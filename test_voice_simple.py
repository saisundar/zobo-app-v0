#!/usr/bin/env python3
"""
Simple test script for voice functionality
"""

import requests
import json

def test_voice_status():
    """Test voice API status"""
    try:
        response = requests.get('http://localhost:8000/api/voice/status')
        print(f"Voice Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing voice status: {e}")
        return False

def test_text_to_speech():
    """Test text-to-speech functionality"""
    try:
        data = {"text": "Hello, this is a test of the voice functionality!"}
        response = requests.post('http://localhost:8000/api/voice/speak', 
                               json=data, 
                               headers={'Content-Type': 'application/json'})
        print(f"Text-to-Speech: {response.status_code}")
        result = response.json()
        print(json.dumps(result, indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing text-to-speech: {e}")
        return False

def test_chat():
    """Test chat functionality"""
    try:
        data = {"message": "Hello Zobo, how are you today?"}
        response = requests.post('http://localhost:8000/api/chat', 
                               json=data, 
                               headers={'Content-Type': 'application/json'})
        print(f"Chat: {response.status_code}")
        result = response.json()
        print(json.dumps(result, indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing chat: {e}")
        return False

if __name__ == "__main__":
    print("Testing Zobo Voice Functionality...")
    print("=" * 50)
    
    # Test voice status
    print("\n1. Testing Voice Status:")
    voice_ok = test_voice_status()
    
    # Test chat
    print("\n2. Testing Chat:")
    chat_ok = test_chat()
    
    # Test text-to-speech
    print("\n3. Testing Text-to-Speech:")
    tts_ok = test_text_to_speech()
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print(f"Voice Status: {'✅' if voice_ok else '❌'}")
    print(f"Chat: {'✅' if chat_ok else '❌'}")
    print(f"Text-to-Speech: {'✅' if tts_ok else '❌'}")
    
    if voice_ok and chat_ok:
        print("\n🎉 Core functionality is working! You can now access the app at http://localhost:8000")
    else:
        print("\n⚠️ Some functionality may not be working properly.") 