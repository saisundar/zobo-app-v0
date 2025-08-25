# Voice Features Setup - Quick Guide

Voice functionality has been successfully added to Zobo! 🎤

## What's Been Added:

### ✅ **Voice UI Controls:**
- **Voice Status Button**: Shows if voice API is ready (microphone icon in header)
- **Voice Record Button**: Record voice messages (microphone icon near input)
- **Voice Speak Button**: Hear Zobo's responses spoken aloud (speaker icon near input)

### ✅ **Voice API Endpoints:**
- `/api/voice/status` - Check voice API status
- `/api/voice/speak` - Convert text to speech
- `/api/voice/live-conversation` - Process voice conversations
- `/api/voice/available-voices` - Get voice options

### ✅ **Voice Features:**
- **Speech-to-Text**: Record voice messages that get converted to text
- **Text-to-Speech**: Click speaker button to hear Zobo's responses
- **Live Voice Chat**: Full voice conversations with Zobo
- **"Hey Zobo" Support**: Voice activation (when API configured)

## To Enable Voice Features:

### 1. **Install Voice Dependencies:**
```bash
pip install google-genai python-dotenv
```

### 2. **Get Gemini API Key:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key

### 3. **Set Environment Variable:**
Create a `.env` file in your project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=your_session_secret_here
```

### 4. **Test Voice Features:**
```bash
# Run the test script
python test_voice.py

# Or run the simple test
python test_voice_simple.py
```

## How to Use:

1. **Start the app**: `python app.py`
2. **Check voice status**: Click the microphone button in header
3. **Record voice message**: Click microphone button near input, speak, click again to stop
4. **Hear responses**: Click speaker button to hear Zobo's last response
5. **Voice conversations**: Record messages and Zobo will respond with voice

## Voice Status Indicators:

- 🟢 **Green Microphone**: Voice API ready and working
- 🟡 **Yellow Microphone**: Voice API not configured
- 🔴 **Red Microphone**: Voice API error

## Troubleshooting:

- **No microphone permission**: Allow microphone access in browser
- **Voice API not configured**: Check GEMINI_API_KEY environment variable  
- **Dependencies missing**: Run `pip install -r requirements.txt`

## Voice Models Available:

- **Native Audio Dialog**: Best for natural conversations
- **Half-cascade**: Better for production stability

For detailed setup instructions, see `voice_setup.md`.

**Enjoy talking to Zobo! 🤖🎤**