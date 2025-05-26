import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from dotenv import load_dotenv
import stripe
from flask_wtf.csrf import CSRFProtect

# Load environment variables from .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect() # Initialize CSRFProtect # Exposed for routes.py, not ideal

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_secret_key_for_flask_app') # Ensure this is strong
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///../instance/app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # CSRF Protection Configuration (Optional: can be set via environment variables too)
    # app.config['WTF_CSRF_SECRET_KEY'] = os.environ.get('WTF_CSRF_SECRET_KEY', 'a_csrf_secret_key')
    # app.config['WTF_CSRF_TIME_LIMIT'] = 3600 # Optional: CSRF token timeout in seconds

    # Stripe Configuration
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    app.config['STRIPE_PUBLIC_KEY'] = os.getenv('STRIPE_PUBLIC_KEY') 
    app.config['STRIPE_WEBHOOK_SECRET'] = os.getenv('STRIPE_WEBHOOK_SECRET')

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app) # Initialize CSRF protection for the app
    
    login_manager.login_view = 'main.login' 
    login_manager.login_message_category = 'info'

    # Import models here to ensure they are registered with SQLAlchemy
    from . import models 
    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Import and register blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    # Add security headers after each request
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Content-Security-Policy is powerful but requires careful configuration.
        # Example: response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.stripe.com;"
        # Strict-Transport-Security should only be enabled if the site is consistently served over HTTPS.
        # if app.config.get('PREFERRED_URL_SCHEME', 'http') == 'https':
        #     response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    return app
