# Voice API Setup Guide

This guide will help you set up the Google Cloud Voice API for Zobo's voice features.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Python Environment**: Make sure you have Python 3.7+ installed
3. **Required Libraries**: Install the voice API dependencies

## Step 1: Install Dependencies

```bash
pip install google-cloud-texttospeech google-cloud-speech pydub
```

## Step 2: Set Up Google Cloud Project

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your Project ID

2. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - Cloud Text-to-Speech API
     - Cloud Speech-to-Text API

3. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create the account
   - Click on the service account name
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format and download the key file

## Step 3: Configure Environment Variables

Set these environment variables in your system or create a `.env` file:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Existing configuration
MOONSHOT_API_KEY=your-moonshot-api-key
SESSION_SECRET=your-session-secret
```

## Step 4: Test the Setup

1. **Start the application**:
   ```bash
   python app.py
   ```

2. **Check voice API status**:
   - Open the application in your browser
   - Click the microphone icon in the header
   - You should see "Voice API is ready!" if configured correctly

## Voice Features Available

### Text-to-Speech
- **Speak Button**: Click the volume icon next to the input to speak the last Zobo message
- **Voice Selection**: Uses Google's Neural2-F voice (female, natural-sounding)
- **Language Support**: Currently configured for English (US)

### Speech-to-Text
- **Record Button**: Click the microphone icon to record a voice message
- **Auto-transcription**: Your speech will be converted to text and placed in the input field
- **Language Support**: Currently configured for English (US)

## Troubleshooting

### Common Issues

1. **"Voice API not configured"**:
   - Check that `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
   - Verify the service account key file exists and is readable
   - Ensure the APIs are enabled in Google Cloud Console

2. **"Failed to start recording"**:
   - Check microphone permissions in your browser
   - Make sure your microphone is working and not muted
   - Try refreshing the page and allowing microphone access

3. **"Failed to transcribe voice message"**:
   - Speak clearly and ensure good audio quality
   - Check that the speech-to-text API is enabled
   - Verify your service account has the necessary permissions

### Permissions Required

Your service account needs these roles:
- Cloud Text-to-Speech User
- Cloud Speech-to-Text User

### Cost Considerations

- **Text-to-Speech**: ~$4 per 1 million characters
- **Speech-to-Text**: ~$0.006 per 15 seconds of audio

For typical usage, costs are minimal (usually under $1/month for personal use).

## Advanced Configuration

### Custom Voices

You can change the voice by modifying the voice parameter in the API calls. Available voices include:
- `en-US-Neural2-F` (Female)
- `en-US-Neural2-M` (Male)
- `en-US-Neural2-A` (Female, alternative)
- `en-US-Neural2-C` (Male, alternative)
- `en-US-Neural2-D` (Female, alternative)
- `en-US-Neural2-E` (Male, alternative)
- `en-US-Neural2-G` (Female, alternative)
- `en-US-Neural2-H` (Female, alternative)
- `en-US-Neural2-I` (Male, alternative)
- `en-US-Neural2-J` (Male, alternative)

### Language Support

To add support for other languages:
1. Change the `language_code` parameter in the API calls
2. Update the voice selection to use voices for that language
3. Modify the frontend to support language selection

## Security Notes

- Keep your service account key secure and never commit it to version control
- Use environment variables or secure secret management
- Consider using Google Cloud's built-in IAM for production deployments
- Regularly rotate your service account keys

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the Flask application logs for Python errors
3. Verify your Google Cloud configuration
4. Test the APIs directly in Google Cloud Console 