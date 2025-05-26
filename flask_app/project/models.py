from . import db
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)  # Increased length for longer hashes
    
    # Relationships
    profile = db.relationship('UserProfile', back_populates='user', uselist=False, cascade="all, delete-orphan")
    carts = db.relationship('Cart', back_populates='user', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    full_name = db.Column(db.String(120), nullable=True)
    address_line1 = db.Column(db.String(200), nullable=True)
    address_line2 = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)

    # Relationship
    user = db.relationship('User', back_populates='profile')

    def __repr__(self):
        return f'<UserProfile for User {self.user_id}>'

class Cart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='carts')
    items = db.relationship('CartItem', back_populates='cart', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Cart {self.id} for User {self.user_id}>'

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('cart.id'), nullable=False)
    product_id = db.Column(db.String(100), nullable=False) # Assuming product IDs from existing JSON/future catalog
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    cart = db.relationship('Cart', back_populates='items')

    def __repr__(self):
        return f'<CartItem {self.product_id} (x{self.quantity}) in Cart {self.cart_id}>'
