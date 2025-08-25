# Google OAuth Setup Guide

## Prerequisites
You need Google OAuth credentials to enable Google Sign-in. Follow these steps:

## 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Sign-in API)

## 2. Configure OAuth Consent Screen
1. In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields:
   - App name: `Zobo App`
   - User support email: Your email
   - Developer contact email: Your email
4. Add scopes: `openid`, `email`, `profile`
5. Save and continue

## 3. Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:8080/auth/google/callback`
   - `http://127.0.0.1:8080/auth/google/callback`
   - Add your production domain when deploying
5. Download the JSON file or copy the Client ID and Client Secret

## 4. Set Environment Variables
Create a `.env` file in the project root:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
SESSION_SECRET=your_random_session_secret_here
```

## 5. Verify Setup
1. Start your Flask app: `python app.py`
2. Visit `http://localhost:8080/api/auth/debug` to check if credentials are configured
3. Try Google sign-in at `http://localhost:8080/login`

## Troubleshooting

### Error: "Google OAuth not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment
- Verify the credentials are correct

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your app's callback URL
- Common callback URLs: `http://localhost:8080/auth/google/callback`

### Error: "access_denied" 
- Make sure the OAuth consent screen is properly configured
- Check that required scopes are added

## Debug Endpoint
Visit `/api/auth/debug` to see configuration status:
```json
{
  "google_configured": true,
  "google_client_id_present": true,
  "google_client_secret_present": true,
  "google_client_id_preview": "123456789012...6789"
}
```