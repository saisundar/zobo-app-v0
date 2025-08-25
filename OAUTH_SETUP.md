# OAuth Setup Guide for Zobo App

This guide will help you configure Google, Microsoft, and Apple OAuth authentication for your Zobo app.

## Prerequisites

1. Install the new dependencies:
```bash
pip install -r requirements.txt
```

## Environment Variables

You need to set up OAuth applications for each provider and add the following environment variables:

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)

Set these environment variables:
```bash
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI to:
   - `http://localhost:5000/auth/microsoft/callback` (for development)
   - `https://yourdomain.com/auth/microsoft/callback` (for production)
5. Go to "Certificates & secrets" and create a client secret

Set these environment variables:
```bash
export MICROSOFT_CLIENT_ID="your-microsoft-client-id"
export MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
export MICROSOFT_AUTHORITY="https://login.microsoftonline.com/common"  # Optional, defaults to this value
```

### Apple OAuth Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to "Certificates, Identifiers & Profiles"
4. Create a new App ID and enable "Sign in with Apple"
5. Create a Service ID for web authentication
6. Configure the Service ID with your domain and redirect URLs:
   - `http://localhost:5000/auth/apple/callback` (for development)
   - `https://yourdomain.com/auth/apple/callback` (for production)

Set these environment variables:
```bash
export APPLE_CLIENT_ID="your-apple-service-id"
export APPLE_CLIENT_SECRET="your-apple-client-secret"  # This is a JWT token you need to generate
```

Note: Apple OAuth requires generating a JWT token as the client secret. This is more complex and typically requires additional setup.

## Session Security

Make sure to set a secure session secret:
```bash
export SESSION_SECRET="your-very-secure-random-string"
```

## Testing the Setup

1. Start your Flask application:
```bash
python app.py
```

2. Visit `http://localhost:5000`
3. You should be redirected to the login page
4. Try signing in with any configured OAuth provider

## Available Providers

The app will automatically detect which OAuth providers are configured based on the presence of their environment variables:

- **Google**: Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Microsoft**: Requires `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
- **Apple**: Requires `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET`

If no providers are configured, the login page will show setup instructions.

## Security Notes

1. Never commit OAuth secrets to version control
2. Use environment variables or a secure secrets management system
3. In production, use HTTPS for all OAuth redirect URIs
4. Set strong, unique session secrets
5. Consider implementing rate limiting for authentication endpoints

## Troubleshooting

### Common Issues

1. **"OAuth provider not configured"**: Make sure environment variables are set correctly
2. **"Redirect URI mismatch"**: Ensure the redirect URI in your OAuth app matches exactly
3. **"Invalid client"**: Check that your client ID and secret are correct
4. **SSL/HTTPS errors**: In development, some providers may require HTTPS

### Debug Mode

Enable Flask debug mode for detailed error messages:
```bash
export FLASK_DEBUG=1
```

### Logs

Check the application logs for detailed OAuth error messages. The app logs OAuth errors with specific details about what went wrong.

## Production Deployment

When deploying to production:

1. Set all environment variables in your hosting platform
2. Update OAuth redirect URIs to use your production domain
3. Use HTTPS for all authentication flows
4. Set `FLASK_ENV=production`
5. Use a production WSGI server like Gunicorn

Example production environment variables:
```bash
export FLASK_ENV=production
export GOOGLE_CLIENT_ID="prod-google-client-id"
export GOOGLE_CLIENT_SECRET="prod-google-client-secret"
export MICROSOFT_CLIENT_ID="prod-microsoft-client-id"
export MICROSOFT_CLIENT_SECRET="prod-microsoft-client-secret"
export SESSION_SECRET="super-secure-production-secret"
```