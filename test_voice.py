#!/usr/bin/env python3
"""
Test script for Gemini Live API voice functionality
"""

import requests
import json

def test_voice_api():
    """Test the voice API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Gemini Live API Voice Functionality")
    print("=" * 50)
    
    # Test 1: Voice API Status
    print("\n1. Testing Voice API Status...")
    try:
        response = requests.get(f"{base_url}/api/voice/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {data['message']}")
            print(f"✅ Model: {data['model']}")
            print(f"✅ Configured: {data['configured']}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking status: {e}")
    
    # Test 2: Available Voices
    print("\n2. Testing Available Voices...")
    try:
        response = requests.get(f"{base_url}/api/voice/available-voices")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Current model: {data['current_model']}")
            print(f"✅ Available voices: {len(data['voices'])}")
            for voice in data['voices']:
                print(f"   - {voice['name']} ({voice['type']})")
        else:
            print(f"❌ Voices check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking voices: {e}")
    
    # Test 3: Text-to-Speech
    print("\n3. Testing Text-to-Speech...")
    try:
        test_text = "Hello! I'm Zobo, your AI friend. How are you today?"
        response = requests.post(
            f"{base_url}/api/voice/speak",
            json={"text": test_text}
        )
        if response.status_code == 200:
            data = response.json()
            if 'audio' in data:
                print(f"✅ Text-to-speech successful! Audio length: {len(data['audio'])} characters")
            else:
                print(f"⚠️  Text-to-speech returned: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Text-to-speech failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing text-to-speech: {e}")
    
    # Test 4: Main Application
    print("\n4. Testing Main Application...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Main application is running")
            if "Zobo - Your AI Friend" in response.text:
                print("✅ Frontend is loading correctly")
            else:
                print("⚠️  Frontend content may have issues")
        else:
            print(f"❌ Main application failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing main application: {e}")
    
    print("\n🎉 Voice API Testing Complete!")
    print("\n📱 To use the voice features:")
    print("1. Open http://localhost:8000 in your browser")
    print("2. Click the microphone icon in the header to check status")
    print("3. Use the microphone button to record voice messages")
    print("4. Use the speaker button to hear Zobo's responses")

if __name__ == "__main__":
    test_voice_api() 