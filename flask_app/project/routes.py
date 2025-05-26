import os
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from .forms import RegistrationForm, LoginForm
from .models import User, UserProfile, Cart, CartItem
from . import db, csrf # Import csrf
import stripe

main_bp = Blueprint('main', __name__)

# --- Helper Function for Cart ---
def get_or_create_active_cart():
    """
    Retrieves the active cart for the current user, or creates one if none exists.
    """
    cart = Cart.query.filter_by(user_id=current_user.id, is_active=True).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.session.add(cart)
        db.session.commit()
    return cart

# --- Web Page Routes ---
@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/profile')
@login_required
def profile():
    user_profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not user_profile:
        user_profile = UserProfile(user_id=current_user.id, full_name=current_user.username)
        db.session.add(user_profile)
        db.session.commit()
        flash('Basic profile was missing and has been created. Please update it.', 'info')
    return render_template('profile.html', name=current_user.username, profile=user_profile)

@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()

        user_profile = UserProfile(user_id=user.id, full_name=user.username)
        db.session.add(user_profile)
        db.session.commit()

        flash('Your account has been created! You are now able to log in.', 'success')
        return redirect(url_for('main.login'))
    return render_template('register.html', title='Register', form=form)

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('main.profile'))
        else:
            flash('Login Unsuccessful. Please check email and password.', 'danger')
    return render_template('login.html', title='Login', form=form)

@main_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

# --- API Routes for Cart Management ---
@main_bp.route('/api/cart', methods=['GET'])
@login_required
def get_cart():
    cart = get_or_create_active_cart()
    cart_items_data = []
    if cart.items:
        for item in cart.items:
            cart_items_data.append({
                "item_id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "added_at": item.added_at.isoformat() if item.added_at else None
            })
    
    return jsonify({
        "cart_id": cart.id,
        "user_id": cart.user_id,
        "created_at": cart.created_at.isoformat() if cart.created_at else None,
        "is_active": cart.is_active,
        "items": cart_items_data
    }), 200

@main_bp.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json()
    if not data:
        return jsonify(error="Invalid JSON payload"), 400

    # Validate product_id
    product_id = data.get('product_id')
    if not product_id or not isinstance(product_id, str):
        return jsonify(error="Invalid input: product_id is required and must be a string."), 400
    
    # Validate quantity
    quantity = data.get('quantity', 1) # Default to 1 if not provided
    if not isinstance(quantity, int) or quantity < 1:
        return jsonify(error="Invalid input: quantity must be a positive integer (>= 1)."), 400

    cart = get_or_create_active_cart()
    item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()

    if item:
        item.quantity += quantity
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(item)
    
    db.session.commit()
    
    return jsonify({
        "message": "Item added/updated in cart", 
        "item": {
            "item_id": item.id,
            "product_id": item.product_id, 
            "quantity": item.quantity,
            "cart_id": cart.id
        }
    }), 201

@main_bp.route('/api/cart/update', methods=['POST'])
@login_required
def update_cart_item():
    data = request.get_json()
    if not data:
        return jsonify(error="Invalid JSON payload"), 400

    # Validate product_id
    product_id = data.get('product_id')
    if not product_id or not isinstance(product_id, str):
        return jsonify(error="Invalid input: product_id is required and must be a string."), 400

    # Validate quantity
    if 'quantity' not in data: # Quantity is required for update
        return jsonify(error="Invalid input: quantity is required for update."), 400
    quantity = data.get('quantity')
    if not isinstance(quantity, int) or quantity < 0: # Allow 0 for removal via update
        return jsonify(error="Invalid input: quantity must be a non-negative integer (>= 0)."), 400

    cart = get_or_create_active_cart()
    item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()

    if not item:
        return jsonify(error="Item not found in cart"), 404

    if quantity == 0:
        db.session.delete(item)
        db.session.commit()
        return jsonify(message="Item removed from cart due to zero quantity"), 200
    else:
        item.quantity = quantity
        db.session.commit()
        return jsonify({
            "message": "Cart item updated",
            "item": {
                "item_id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity
            }
        }), 200

@main_bp.route('/api/cart/remove', methods=['POST'])
@login_required
def remove_from_cart():
    data = request.get_json()
    if not data:
        return jsonify(error="Invalid JSON payload"), 400
    
    # Validate product_id
    product_id = data.get('product_id')
    if not product_id or not isinstance(product_id, str):
        return jsonify(error="Invalid input: product_id is required and must be a string."), 400
    
    cart = get_or_create_active_cart()
    item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()

    if not item:
        return jsonify(error="Item not found in cart"), 404

    db.session.delete(item)
    db.session.commit()
    
    return jsonify(message="Item removed from cart"), 200

# --- API Routes for User Profile Management ---
def serialize_profile(profile):
    if not profile:
        return None
    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "address_line1": profile.address_line1,
        "address_line2": profile.address_line2,
        "city": profile.city,
        "state": profile.state,
        "zip_code": profile.zip_code,
        "phone_number": profile.phone_number
    }

@main_bp.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        # This typically shouldn't happen if profile is created on registration.
        # If it can, creating a default one or returning 404 might be options.
        # For now, let's assume it should exist or be created as fallback.
        profile = UserProfile(user_id=current_user.id, full_name=current_user.username)
        db.session.add(profile)
        db.session.commit()
        
    serialized = serialize_profile(profile)
    return jsonify(serialized), 200

@main_bp.route('/api/profile/update', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify(error="Invalid JSON payload"), 400

    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        # This case should be rare if profile is created on user registration
        return jsonify(error="Profile not found. Cannot update."), 404

    # Validate known fields if present
    if 'full_name' in data:
        if not isinstance(data['full_name'], str) or len(data['full_name']) > 120:
            return jsonify(error="Invalid full_name: must be a string up to 120 characters."), 400
        profile.full_name = data['full_name']
    
    if 'address_line1' in data:
        if not isinstance(data['address_line1'], str) or len(data['address_line1']) > 200:
            return jsonify(error="Invalid address_line1: must be a string up to 200 characters."), 400
        profile.address_line1 = data['address_line1']

    if 'address_line2' in data:
        if data['address_line2'] is not None and (not isinstance(data['address_line2'], str) or len(data['address_line2']) > 200): # Allow null/None
            return jsonify(error="Invalid address_line2: must be a string up to 200 characters or null."), 400
        profile.address_line2 = data['address_line2']
        
    if 'city' in data:
        if not isinstance(data['city'], str) or len(data['city']) > 100:
            return jsonify(error="Invalid city: must be a string up to 100 characters."), 400
        profile.city = data['city']

    if 'state' in data:
        if not isinstance(data['state'], str) or len(data['state']) > 100:
            return jsonify(error="Invalid state: must be a string up to 100 characters."), 400
        profile.state = data['state']

    if 'zip_code' in data:
        if not isinstance(data['zip_code'], str) or len(data['zip_code']) > 20: # Basic length check
            return jsonify(error="Invalid zip_code: must be a string up to 20 characters."), 400
        profile.zip_code = data['zip_code']

    if 'phone_number' in data:
        if data['phone_number'] is not None and (not isinstance(data['phone_number'], str) or len(data['phone_number']) > 20): # Basic length check, allow null
            return jsonify(error="Invalid phone_number: must be a string up to 20 characters or null."), 400
        profile.phone_number = data['phone_number']
    
    # Note: Unknown fields in `data` are currently ignored, which is acceptable.
    # If strict validation against unknown fields is needed, iterate `data.keys()` and check.
    
    db.session.commit()
    
    return jsonify({
        "message": "Profile updated successfully",
        "profile": serialize_profile(profile)
    }), 200

# --- Route for Account Management Page ---
@main_bp.route('/account')
@login_required
def account():
    # The actual profile data will be fetched client-side by JavaScript
    return render_template('account.html', title='My Account')

# --- Route for Checkout Page ---
@main_bp.route('/checkout')
@login_required
def checkout_page():
    stripe_public_key = current_app.config.get('STRIPE_PUBLIC_KEY')
    if not stripe_public_key:
        flash('Stripe is not configured correctly. Please contact support.', 'danger')
        return redirect(url_for('main.index'))
    return render_template('checkout.html', title='Checkout', stripe_public_key=stripe_public_key)

# --- API Routes for Stripe Payment ---
@main_bp.route('/api/payment/create-payment-intent', methods=['POST'])
@login_required
def create_payment_intent():
    data = request.get_json()
    if not data:
        return jsonify(error="Invalid JSON payload"), 400

    amount = data.get('amount')
    if not isinstance(amount, int) or amount <= 0: # Stripe minimums might be higher (e.g. 50 cents)
        return jsonify(error="Invalid amount: Must be a positive integer representing cents."), 400
    if amount < 50: # Example: Enforce a minimum of $0.50
        return jsonify(error="Invalid amount: Amount must be at least 50 cents."), 400
        
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={'enabled': True},
            metadata={
                'user_id': current_user.id,
            }
        )
        return jsonify({
            'clientSecret': intent.client_secret,
            'publicKey': current_app.config['STRIPE_PUBLIC_KEY']
        }), 200
    except stripe.error.StripeError as e:
        return jsonify(error={'message': str(e)}), 403 # Potentially 400 or 500 depending on error
    except Exception as e:
        # Log general exceptions for debugging
        current_app.logger.error(f"Error creating payment intent: {str(e)}")
        return jsonify(error={'message': "An unexpected error occurred processing your payment."}), 500

@main_bp.route('/api/payment/webhook', methods=['POST'])
@csrf.exempt # Exempt Stripe webhook from CSRF protection
def stripe_webhook():
    endpoint_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not endpoint_secret:
        current_app.logger.error("Stripe webhook secret not configured.")
        return jsonify(error="Webhook secret not configured"), 500
        
    payload = request.data 
    sig_header = request.headers.get('Stripe-Signature')
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e: # Invalid payload
        current_app.logger.warning(f"Webhook ValueError: {str(e)}")
        return jsonify(error=str(e)), 400
    except stripe.error.SignatureVerificationError as e: # Invalid signature
        current_app.logger.warning(f"Webhook SignatureVerificationError: {str(e)}")
        return jsonify(error=str(e)), 400
    except Exception as e:
        current_app.logger.error(f"Webhook general error: {str(e)}")
        return jsonify(error="An unexpected error occurred during webhook processing."), 500

    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        current_app.logger.info(f"PaymentIntent {payment_intent.get('id')} was successful!")
        # TODO: Fulfill the purchase (e.g., mark order as paid, send email, deactivate cart)
        # metadata = payment_intent.get('metadata', {})
        # user_id = metadata.get('user_id')
        # if user_id:
        #    user_cart = Cart.query.filter_by(user_id=user_id, is_active=True).first()
        #    if user_cart:
        #        user_cart.is_active = False
        #        db.session.commit()
        #        current_app.logger.info(f"Cart {user_cart.id} deactivated for user {user_id}")

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        current_app.logger.warning(f"PaymentIntent {payment_intent.get('id')} failed.")
        # TODO: Notify user, log failure details
    else:
        current_app.logger.info(f"Unhandled Stripe event type: {event['type']}")

    return jsonify(received=True), 200
