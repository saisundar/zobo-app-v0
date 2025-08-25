import os
import logging
from flask import request, redirect, url_for, session, jsonify, flash, render_template
from authlib.integrations.flask_client import OAuth
import json

def init_auth(app):
    """Initialize OAuth authentication for the Flask app"""
    
    # Configure OAuth
    oauth = OAuth(app)
    
    # Google OAuth
    google = oauth.register(
        name='google',
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    
    # Microsoft OAuth
    microsoft = oauth.register(
        name='microsoft',
        client_id=os.environ.get("MICROSOFT_CLIENT_ID"),
        client_secret=os.environ.get("MICROSOFT_CLIENT_SECRET"),
        authority=os.environ.get("MICROSOFT_AUTHORITY", "https://login.microsoftonline.com/common"),
        api_base_url='https://graph.microsoft.com/',
        access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
        authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        client_kwargs={
            'scope': 'openid email profile User.Read',
            'response_type': 'code'
        }
    )
    
    # Apple OAuth (Sign in with Apple)
    apple = oauth.register(
        name='apple',
        client_id=os.environ.get("APPLE_CLIENT_ID"),
        client_secret=os.environ.get("APPLE_CLIENT_SECRET"),
        authorize_url='https://appleid.apple.com/auth/authorize',
        access_token_url='https://appleid.apple.com/auth/token',
        client_kwargs={
            'scope': 'name email',
            'response_mode': 'form_post',
            'response_type': 'code'
        }
    )
    
    return oauth, google, microsoft, apple

def create_auth_routes(app, oauth_clients):
    """Create authentication routes"""
    oauth, google, microsoft, apple = oauth_clients
    
    @app.route('/login')
    def login():
        """Show login page with OAuth options"""
        if 'user' in session:
            return redirect(url_for('index'))
        return render_template('login.html')
    
    @app.route('/logout')
    def logout():
        """Logout user"""
        session.clear()
        flash('You have been logged out successfully.', 'success')
        return redirect(url_for('login'))
    
    # Google OAuth routes
    @app.route('/auth/google')
    def google_login():
        """Initiate Google OAuth login"""
        if not os.environ.get("GOOGLE_CLIENT_ID"):
            flash('Google OAuth not configured', 'error')
            return redirect(url_for('login'))
        
        redirect_uri = url_for('google_callback', _external=True)
        return google.authorize_redirect(redirect_uri)
    
    @app.route('/auth/google/callback')
    def google_callback():
        """Handle Google OAuth callback"""
        try:
            token = google.authorize_access_token()
            user_info = token.get('userinfo')
            
            if user_info:
                session['user'] = {
                    'id': user_info['sub'],
                    'email': user_info['email'],
                    'name': user_info['name'],
                    'picture': user_info.get('picture'),
                    'provider': 'google'
                }
                flash(f'Welcome, {user_info["name"]}!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Failed to get user information from Google', 'error')
                
        except Exception as e:
            logging.error(f"Google OAuth error: {str(e)}")
            flash('Google login failed. Please try again.', 'error')
        
        return redirect(url_for('login'))
    
    # Microsoft OAuth routes
    @app.route('/auth/microsoft')
    def microsoft_login():
        """Initiate Microsoft OAuth login"""
        if not os.environ.get("MICROSOFT_CLIENT_ID"):
            flash('Microsoft OAuth not configured', 'error')
            return redirect(url_for('login'))
        
        redirect_uri = url_for('microsoft_callback', _external=True)
        return microsoft.authorize_redirect(redirect_uri)
    
    @app.route('/auth/microsoft/callback')
    def microsoft_callback():
        """Handle Microsoft OAuth callback"""
        try:
            token = microsoft.authorize_access_token()
            
            # Get user info from Microsoft Graph
            resp = microsoft.get('me', token=token)
            user_info = resp.json()
            
            if user_info:
                session['user'] = {
                    'id': user_info['id'],
                    'email': user_info.get('mail') or user_info.get('userPrincipalName'),
                    'name': user_info.get('displayName'),
                    'provider': 'microsoft'
                }
                flash(f'Welcome, {user_info.get("displayName", "User")}!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Failed to get user information from Microsoft', 'error')
                
        except Exception as e:
            logging.error(f"Microsoft OAuth error: {str(e)}")
            flash('Microsoft login failed. Please try again.', 'error')
        
        return redirect(url_for('login'))
    
    # Apple OAuth routes
    @app.route('/auth/apple')
    def apple_login():
        """Initiate Apple OAuth login"""
        if not os.environ.get("APPLE_CLIENT_ID"):
            flash('Apple OAuth not configured', 'error')
            return redirect(url_for('login'))
        
        redirect_uri = url_for('apple_callback', _external=True)
        return apple.authorize_redirect(redirect_uri)
    
    @app.route('/auth/apple/callback', methods=['GET', 'POST'])
    def apple_callback():
        """Handle Apple OAuth callback"""
        try:
            token = apple.authorize_access_token()
            
            # Apple returns user info in the ID token
            id_token = token.get('id_token')
            if id_token:
                # Decode the JWT token to get user info
                try:
                    import jwt
                    # Note: In production, you should verify the JWT signature
                    user_info = jwt.decode(id_token, options={"verify_signature": False})
                except ImportError:
                    # Fallback if PyJWT is not installed
                    import base64
                    import json
                    # Basic JWT parsing without signature verification (unsafe for production)
                    try:
                        payload_part = id_token.split('.')[1]
                        # Add padding if needed
                        payload_part += '=' * (4 - len(payload_part) % 4)
                        payload_bytes = base64.b64decode(payload_part)
                        user_info = json.loads(payload_bytes)
                    except Exception as e:
                        logging.error(f"Failed to decode Apple ID token: {str(e)}")
                        flash('Apple login failed. Please try again.', 'error')
                        return redirect(url_for('login'))
                
                # Apple also sends user info in the form data on first authorization
                user_data = request.form.get('user')
                if user_data:
                    user_json = json.loads(user_data)
                    name = f"{user_json.get('name', {}).get('firstName', '')} {user_json.get('name', {}).get('lastName', '')}".strip()
                else:
                    name = user_info.get('email', 'Apple User')  # Fallback
                
                session['user'] = {
                    'id': user_info['sub'],
                    'email': user_info.get('email'),
                    'name': name,
                    'provider': 'apple'
                }
                flash(f'Welcome, {name}!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Failed to get user information from Apple', 'error')
                
        except Exception as e:
            logging.error(f"Apple OAuth error: {str(e)}")
            flash('Apple login failed. Please try again.', 'error')
        
        return redirect(url_for('login'))
    
    @app.route('/api/auth/user')
    def get_current_user():
        """Get current authenticated user info"""
        user = session.get('user')
        if user:
            return jsonify({
                'authenticated': True,
                'user': user
            })
        else:
            return jsonify({
                'authenticated': False,
                'user': None
            })
    
    @app.route('/api/auth/status')
    def auth_status():
        """Check authentication status and available providers"""
        providers = []
        
        if os.environ.get("GOOGLE_CLIENT_ID"):
            providers.append({
                'name': 'google',
                'display_name': 'Google',
                'login_url': url_for('google_login'),
                'icon': 'fab fa-google'
            })
        
        if os.environ.get("MICROSOFT_CLIENT_ID"):
            providers.append({
                'name': 'microsoft',
                'display_name': 'Microsoft',
                'login_url': url_for('microsoft_login'),
                'icon': 'fab fa-microsoft'
            })
        
        if os.environ.get("APPLE_CLIENT_ID"):
            providers.append({
                'name': 'apple',
                'display_name': 'Apple',
                'login_url': url_for('apple_login'),
                'icon': 'fab fa-apple'
            })
        
        # Add demo mode if enabled
        if os.environ.get("ENABLE_DEMO_AUTH"):
            providers.append({
                'name': 'demo',
                'display_name': 'Demo User',
                'login_url': url_for('demo_login'),
                'icon': 'fas fa-user-circle'
            })
        
        return jsonify({
            'authenticated': 'user' in session,
            'user': session.get('user'),
            'available_providers': providers
        })
    
    # Demo authentication route
    @app.route('/auth/demo')
    def demo_login():
        """Demo login for testing purposes"""
        if not os.environ.get("ENABLE_DEMO_AUTH"):
            flash('Demo authentication is not enabled', 'error')
            return redirect(url_for('login'))
        
        # Create a demo user session
        session['user'] = {
            'id': 'demo-user-123',
            'email': 'demo@zobo-app.com',
            'name': 'Demo User',
            'picture': None,
            'provider': 'demo'
        }
        
        flash('Welcome, Demo User! You\'re now signed in.', 'success')
        return redirect(url_for('index'))

def require_auth(f):
    """Decorator to require authentication for routes"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function