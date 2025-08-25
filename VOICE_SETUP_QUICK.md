# Voice Features Setup - Quick Guide

Voice functionality has been successfully added to Zobo! 🎤

## What's Been Added:

### ✅ **Voice UI Controls:**
- **Wake Word Button**: Toggle "Hey Zobo" listening (ear icon in header)
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
- **"Hey Zobo" Wake Word**: Always listening for voice activation
- **Continuous Listening**: Background wake word detection

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
2. **Enable "Hey Zobo"**: Click the ear button in header (turns green when listening)
3. **Say wake word**: Say "Hey Zobo" + your message (e.g., "Hey Zobo, how are you?")
4. **Alternative**: Click microphone button near input to record manually
5. **Hear responses**: Click speaker button to hear Zobo's last response
6. **Voice conversations**: Zobo will respond with voice when wake word is used

### 🎙️ **Wake Word Usage:**
- **"Hey Zobo, what's the weather?"** - Direct command
- **"Hi Zobo"** - Just wake word (starts recording mode)
- **"Hello Zobo, tell me a joke"** - Command with question
- **"Zobo"** - Simple activation

## Voice Status Indicators:

### Wake Word Button (Ear Icon):
- 🟢 **Green Ear**: "Hey Zobo" listening actively
- 🟡 **Yellow Ear**: "Hey Zobo" starting up
- ⚪ **Gray Deaf Ear**: "Hey Zobo" disabled

### Voice API Button (Microphone Icon):
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