import os
import logging
import json
import re
from flask import Flask, render_template, request, jsonify, session
import requests
from datetime import datetime, timedelta
from dateutil import parser
from calendar_service import GoogleCalendarService
from auth import init_auth, create_auth_routes, require_auth

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Initialize OAuth
oauth_clients = init_auth(app)
create_auth_routes(app, oauth_clients)

# Moonshot API configuration
MOONSHOT_API_KEY = os.environ.get("MOONSHOT_API_KEY")
MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1"
MODEL_NAME = "kimi-k2-0711-preview"

class MoonshotAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completion(self, messages, temperature=0.6, max_tokens=2048, stream=False):
        """Send chat completion request to Moonshot API"""
        try:
            payload = {
                "model": MODEL_NAME,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                stream=stream,
                timeout=30
            )
            
            if response.status_code == 200:
                if stream:
                    return response
                else:
                    return response.json()
            else:
                logging.error(f"API Error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed: {str(e)}")
            return None

# Initialize Moonshot API client
moonshot_client = MoonshotAPI(MOONSHOT_API_KEY, MOONSHOT_BASE_URL) if MOONSHOT_API_KEY else None

# Initialize Google Calendar service
calendar_service = GoogleCalendarService()

@app.route('/')
@require_auth
def index():
    """Main chat interface"""
    # Initialize session conversation if not exists
    if 'conversation' not in session:
        session['conversation'] = []
    
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
@require_auth
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        if not moonshot_client:
            return jsonify({'error': 'Moonshot API key not configured'}), 500
        
        # Get user ID for data storage
        user_id = session.get('user', {}).get('id', 'unknown')
        
        # Store/extract user data from their message
        user_data = extract_and_store_user_data(user_message, user_id)
        
        # Get conversation history from session
        conversation = session.get('conversation', [])
        
        # Check if user is asking about scheduling and enhance message with calendar data
        enhanced_message = enhance_message_with_calendar_context(user_message)
        
        # Add user message to conversation
        conversation.append({"role": "user", "content": enhanced_message})
        
        # Prepare messages for API (include system message with calendar context and user data)
        calendar_context = get_calendar_context()
        user_context = get_user_data_context(user_id)
        
        system_prompt = f"""You are Zobo, a close friend who's always there to chat, help, and support. You're warm, understanding, and speak in a casual, friendly way like you've known the person for years. You're genuinely interested in their thoughts and feelings, and you respond with empathy and enthusiasm.

{user_context}

You also have access to the user's Google Calendar and can help with scheduling. You can:
- View upcoming events and availability
- Schedule new events by finding optimal time slots between existing events
- Reschedule or modify existing events
- Provide schedule summaries and reminders
- Find free time slots for meetings and activities

You can also access files that users have connected to you. When users upload files, they become connected to you and you can reference their content in conversations. You can:
- Read and analyze connected text files, documents, and other file types
- Answer questions about file content
- Help with document analysis and summarization
- Reference specific information from uploaded files

IMPORTANT SCHEDULING BEHAVIOR:
When the user asks to schedule something:
1. Analyze their current calendar for free time slots
2. Suggest specific times that work between existing events
3. Always ask for confirmation before creating any calendar events
4. Be specific about dates, times, and durations
5. Consider reasonable working hours (9 AM - 6 PM by default)

IMPORTANT FILE BEHAVIOR:
When users reference files or ask about documents:
1. Check if they have connected files available
2. Reference the actual file content when answering questions
3. Be specific about which file you're referencing
4. If no files are connected, suggest they upload relevant files

Examples of how to respond to scheduling requests:
- "I can schedule that meeting for you! Looking at your calendar, I see you have free time on Tuesday from 2-4 PM or Wednesday from 10 AM-12 PM. Which works better?"
- "Based on your calendar, you have a 2-hour gap tomorrow from 1-3 PM. Would you like me to schedule your doctor's appointment then?"

When discussing scheduling, always confirm details with the user before making changes."""

        if calendar_context:
            system_prompt += f"\n\nCurrent calendar context:\n{calendar_context}"
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history (limit to last 10 messages to stay within token limits and avoid cookie size issues)
        messages.extend(conversation[-10:])
        
        # Call Moonshot API
        response = moonshot_client.chat_completion(messages, temperature=0.6)
        
        if response and isinstance(response, dict) and 'choices' in response:
            assistant_message = response['choices'][0]['message']['content']
            
            # Add assistant response to conversation
            conversation.append({"role": "assistant", "content": assistant_message})
            
            # Update session (keep only last 10 messages to prevent cookie overflow)
            session['conversation'] = conversation[-10:]
            session.modified = True
            
            return jsonify({
                'response': assistant_message,
                'conversation_length': len(conversation)
            })
        else:
            return jsonify({'error': 'Failed to get response from Moonshot API'}), 500
            
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/clear', methods=['POST'])
@require_auth
def clear_conversation():
    """Clear conversation history"""
    try:
        session['conversation'] = []
        session.modified = True
        return jsonify({'message': 'Conversation cleared successfully'})
    except Exception as e:
        logging.error(f"Clear conversation error: {str(e)}")
        return jsonify({'error': 'Failed to clear conversation'}), 500

@app.route('/api/conversation', methods=['GET'])
@require_auth
def get_conversation():
    """Get current conversation history"""
    try:
        conversation = session.get('conversation', [])
        return jsonify({'conversation': conversation})
    except Exception as e:
        logging.error(f"Get conversation error: {str(e)}")
        return jsonify({'error': 'Failed to get conversation'}), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check API status"""
    try:
        if not moonshot_client:
            return jsonify({
                'status': 'error',
                'message': 'Moonshot API key not configured',
                'api_configured': False
            })
        
        # Test API connection with a simple request
        test_messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"}
        ]
        
        response = moonshot_client.chat_completion(test_messages, max_tokens=10)
        
        if response and isinstance(response, dict) and 'choices' in response:
            return jsonify({
                'status': 'ok',
                'message': 'Moonshot API is working',
                'api_configured': True,
                'model': MODEL_NAME
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Moonshot API is not responding',
                'api_configured': True
            })
            
    except Exception as e:
        logging.error(f"Status check error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Status check failed: {str(e)}',
            'api_configured': bool(moonshot_client)
        })

def get_calendar_context():
    """Get current calendar context for AI assistant"""
    try:
        if not calendar_service.service:
            return "Calendar not connected"
        
        # Get events for the next 7 days
        events = calendar_service.get_events()
        if not events:
            return "No upcoming events in the next 7 days"
        
        context = "Upcoming events in the next 7 days:\n"
        for event in events[:10]:  # Limit to 10 most recent events
            start_time = parser.parse(event['start'])
            context += f"- {event['summary']} on {start_time.strftime('%A, %B %d at %I:%M %p')}\n"
        
        return context
        
    except Exception as e:
        logging.error(f"Error getting calendar context: {str(e)}")
        return "Calendar information temporarily unavailable"

@app.route('/api/calendar/events', methods=['GET'])
@require_auth
def get_calendar_events():
    """Get calendar events"""
    try:
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=days)
        
        events = calendar_service.get_events(
            time_min=start_date.isoformat() + 'Z',
            time_max=end_date.isoformat() + 'Z'
        )
        
        if events is None:
            return jsonify({'error': 'Failed to fetch calendar events. Please check your calendar connection.'}), 500
        
        return jsonify({'events': events})
        
    except Exception as e:
        logging.error(f"Error getting calendar events: {str(e)}")
        return jsonify({'error': 'Failed to retrieve calendar events'}), 500

@app.route('/api/calendar/schedule', methods=['POST'])
@require_auth
def smart_schedule_event():
    """Smart schedule a new event"""
    try:
        data = request.get_json()
        summary = data.get('summary', '').strip()
        duration = data.get('duration_minutes', 60)
        description = data.get('description', '')
        location = data.get('location', '')
        
        if not summary:
            return jsonify({'error': 'Event title is required'}), 400
        
        # Find optimal scheduling
        result, error = calendar_service.smart_schedule_event(
            summary=summary,
            duration_minutes=duration,
            description=description,
            location=location
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        if result:
            return jsonify({
                'suggested_schedule': {
                    'start': result['suggested_start'].isoformat(),
                    'end': result['suggested_end'].isoformat(),
                    'summary': result['summary'],
                    'description': result['description'],
                    'location': result['location']
                },
                'alternatives': [
                    {
                        'start': slot['start'].isoformat(),
                        'end': (slot['start'] + timedelta(minutes=duration)).isoformat(),
                        'duration_minutes': slot['duration_minutes']
                    }
                    for slot in result['alternative_slots']
                ]
            })
        else:
            return jsonify({'error': 'Failed to find available time slots'}), 400
        
    except Exception as e:
        logging.error(f"Error scheduling event: {str(e)}")
        return jsonify({'error': 'Failed to schedule event'}), 500

@app.route('/api/calendar/create', methods=['POST'])
@require_auth
def create_calendar_event():
    """Create a new calendar event"""
    try:
        data = request.get_json()
        summary = data.get('summary', '').strip()
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        description = data.get('description', '')
        location = data.get('location', '')
        
        if not all([summary, start_time, end_time]):
            return jsonify({'error': 'Title, start time, and end time are required'}), 400
        
        # Create the event
        event = calendar_service.create_event(
            summary=summary,
            start_time=start_time,
            end_time=end_time,
            description=description,
            location=location
        )
        
        if not event:
            return jsonify({'error': 'Failed to create calendar event'}), 500
        
        return jsonify({
            'message': 'Event created successfully',
            'event_id': event['id'],
            'event_link': event.get('htmlLink', '')
        })
        
    except Exception as e:
        logging.error(f"Error creating calendar event: {str(e)}")
        return jsonify({'error': 'Failed to create calendar event'}), 500

@app.route('/api/calendar/update/<event_id>', methods=['PUT'])
@require_auth
def update_calendar_event(event_id):
    """Update an existing calendar event"""
    try:
        data = request.get_json()
        
        # Update the event
        event = calendar_service.update_event(
            event_id=event_id,
            summary=data.get('summary'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            description=data.get('description'),
            location=data.get('location')
        )
        
        if not event:
            return jsonify({'error': 'Failed to update calendar event'}), 500
        
        return jsonify({
            'message': 'Event updated successfully',
            'event_id': event['id']
        })
        
    except Exception as e:
        logging.error(f"Error updating calendar event: {str(e)}")
        return jsonify({'error': 'Failed to update calendar event'}), 500

@app.route('/api/calendar/delete/<event_id>', methods=['DELETE'])
@require_auth
def delete_calendar_event(event_id):
    """Delete a calendar event"""
    try:
        success = calendar_service.delete_event(event_id)
        
        if not success:
            return jsonify({'error': 'Failed to delete calendar event'}), 500
        
        return jsonify({'message': 'Event deleted successfully'})
        
    except Exception as e:
        logging.error(f"Error deleting calendar event: {str(e)}")
        return jsonify({'error': 'Failed to delete calendar event'}), 500

@app.route('/api/calendar/free-slots', methods=['GET'])
@require_auth
def get_free_slots():
    """Get available time slots"""
    try:
        duration = request.args.get('duration', 60, type=int)
        days = request.args.get('days', 7, type=int)
        
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=days)
        
        free_slots = calendar_service.find_free_slots(
            duration_minutes=duration,
            start_date=start_date,
            end_date=end_date
        )
        
        formatted_slots = [
            {
                'start': slot['start'].isoformat(),
                'end': slot['end'].isoformat(),
                'duration_minutes': slot['duration_minutes']
            }
            for slot in free_slots[:20]  # Limit to first 20 slots
        ]
        
        return jsonify({'free_slots': formatted_slots})
        
    except Exception as e:
        logging.error(f"Error getting free slots: {str(e)}")
        return jsonify({'error': 'Failed to get available time slots'}), 500

def enhance_message_with_calendar_context(user_message):
    """Enhance user message with calendar context for scheduling requests"""
    try:
        # Keywords that indicate scheduling intent
        scheduling_keywords = [
            'schedule', 'meeting', 'appointment', 'book', 'plan', 'free time', 
            'available', 'calendar', 'busy', 'when can', 'what time', 'tomorrow',
            'next week', 'this week', 'today', 'later', 'morning', 'afternoon',
            'school', 'class', 'homework', 'practice', 'lesson'
        ]
        
        message_lower = user_message.lower()
        is_scheduling_request = any(keyword in message_lower for keyword in scheduling_keywords)
        
        if not is_scheduling_request:
            return user_message
        
        # Check for manual calendar events in session
        manual_events = session.get('manual_calendar_events', [])
        
        # Check for connected files
        connected_files = session.get('connected_files', [])
        
        # Try to get Google Calendar events if available
        calendar_info = ""
        try:
            if calendar_service.service:
                events = calendar_service.get_events()
                if events:
                    calendar_info = "\n\n[Your Google Calendar events:\n"
                    for event in events[:10]:
                        start_time = parser.parse(event['start'])
                        calendar_info += f"- {event['summary']}: {start_time.strftime('%A, %b %d at %I:%M %p')}\n"
                    
                    # Include free time slots
                    free_slots = calendar_service.find_free_slots(60)
                    if free_slots:
                        calendar_info += "\nAvailable 1-hour+ time slots:\n"
                        for slot in free_slots[:5]:
                            start = slot['start'].strftime('%A, %b %d at %I:%M %p')
                            end = slot['end'].strftime('%I:%M %p')
                            calendar_info += f"- {start} - {end}\n"
                    calendar_info += "]"
        except:
            pass
        
        # Add manual calendar events if any
        if manual_events:
            if not calendar_info:
                calendar_info = "\n\n[Your schedule (from our conversations):\n"
            else:
                calendar_info += "\n\nManual schedule entries:\n"
            
            for event in manual_events[-10:]:  # Last 10 manual events
                calendar_info += f"- {event['summary']}: {event['time']}\n"
            
            if not calendar_info.endswith("]"):
                calendar_info += "]"
        
        # If no calendar info available, add helpful note
        if not calendar_info:
            calendar_info = "\n\n[Note: No calendar connected. Tell me about your schedule (like 'I have school from 8-3' or 'I'm free Saturday morning') and I'll help you plan!]"
        
        # Add connected files info if user is asking about files or documents
        file_keywords = ['file', 'document', 'upload', 'attachment', 'read', 'analyze', 'content']
        if any(keyword in message_lower for keyword in file_keywords) and connected_files:
            file_info = "\n\n[Connected files you can reference:\n"
            for file in connected_files[-5:]:  # Last 5 files
                file_info += f"- {file['name']} ({file['size']} bytes, uploaded {file['uploaded_at'][:10]})\n"
            file_info += "]"
            calendar_info += file_info
        
        return user_message + calendar_info
        
    except Exception as e:
        logging.error(f"Error enhancing message with calendar context: {str(e)}")
        return user_message

def extract_and_store_user_data(message, user_id):
    """Extract and store user-specific data from their message"""
    try:
        # Get or create user data storage
        if 'user_data_storage' not in session:
            session['user_data_storage'] = {}
        
        user_data = session['user_data_storage'].get(user_id, {})
        message_lower = message.lower()
        
        # Extract name information
        name_patterns = [
            r"i am ([a-zA-Z\s]+)",
            r"my name is ([a-zA-Z\s]+)",
            r"call me ([a-zA-Z\s]+)",
            r"i'm ([a-zA-Z\s]+)",
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, message_lower)
            if match:
                name = match.group(1).strip().title()
                if len(name) > 0 and len(name) < 50:  # Reasonable name length
                    user_data['name'] = name
                    user_data['last_updated'] = datetime.now().isoformat()
                    break
        
        # Extract other personal information patterns
        if 'school' in message_lower or 'grade' in message_lower:
            school_patterns = [
                r"i go to ([a-zA-Z0-9\s]+) school",
                r"i'm in grade (\d+)",
                r"i'm in (\d+)th grade",
                r"i study at ([a-zA-Z0-9\s]+)"
            ]
            for pattern in school_patterns:
                match = re.search(pattern, message_lower)
                if match:
                    info = match.group(1).strip()
                    if 'grade' in pattern:
                        user_data['grade'] = info
                    else:
                        user_data['school'] = info.title()
                    user_data['last_updated'] = datetime.now().isoformat()
                    break
        
        # Extract age information
        age_patterns = [
            r"i am (\d+) years old",
            r"i'm (\d+) years old",
            r"i am (\d+)",
            r"i'm (\d+)"
        ]
        for pattern in age_patterns:
            match = re.search(pattern, message_lower)
            if match:
                age = int(match.group(1))
                if 5 <= age <= 100:  # Reasonable age range
                    user_data['age'] = age
                    user_data['last_updated'] = datetime.now().isoformat()
                break
        
        # Store updated user data
        session['user_data_storage'][user_id] = user_data
        session.modified = True
        
        return user_data
        
    except Exception as e:
        logging.error(f"Error extracting user data: {str(e)}")
        return {}

def get_user_data_context(user_id):
    """Get user-specific context for the AI assistant"""
    try:
        user_data_storage = session.get('user_data_storage', {})
        user_data = user_data_storage.get(user_id, {})
        
        if not user_data:
            return "Remember to learn about this user as they share information about themselves."
        
        context = "What you know about this user:\n"
        
        if 'name' in user_data:
            context += f"- Their name is {user_data['name']}\n"
        
        if 'age' in user_data:
            context += f"- They are {user_data['age']} years old\n"
        
        if 'school' in user_data:
            context += f"- They go to {user_data['school']}\n"
        
        if 'grade' in user_data:
            context += f"- They are in grade {user_data['grade']}\n"
        
        context += "\nUse this information naturally in conversations, and remember to ask follow-up questions to learn more about them."
        
        return context
        
    except Exception as e:
        logging.error(f"Error getting user data context: {str(e)}")
        return "Remember to learn about this user as they share information about themselves."

@app.route('/api/calendar/confirm-schedule', methods=['POST'])
@require_auth
def confirm_schedule():
    """Confirm and create a scheduled event"""
    try:
        data = request.get_json()
        summary = data.get('summary', '').strip()
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        description = data.get('description', '')
        location = data.get('location', '')
        
        if not all([summary, start_time, end_time]):
            return jsonify({'error': 'Title, start time, and end time are required'}), 400
        
        # Create the event
        event = calendar_service.create_event(
            summary=summary,
            start_time=start_time,
            end_time=end_time,
            description=description,
            location=location
        )
        
        if not event:
            return jsonify({'error': 'Failed to create calendar event'}), 500
        
        return jsonify({
            'message': 'Event scheduled successfully!',
            'event': {
                'id': event['id'],
                'summary': summary,
                'start': start_time,
                'end': end_time,
                'link': event.get('htmlLink', '')
            }
        })
        
    except Exception as e:
        logging.error(f"Error confirming schedule: {str(e)}")
        return jsonify({'error': 'Failed to schedule event'}), 500

@app.route('/api/calendar/manual-event', methods=['POST'])
@require_auth
def add_manual_event():
    """Add a manual calendar event from conversation"""
    try:
        data = request.get_json()
        summary = data.get('summary', '').strip()
        time_description = data.get('time', '').strip()
        
        if not all([summary, time_description]):
            return jsonify({'error': 'Event title and time are required'}), 400
        
        # Get or create manual events list in session
        manual_events = session.get('manual_calendar_events', [])
        
        # Add new event
        new_event = {
            'summary': summary,
            'time': time_description,
            'added_at': datetime.now().isoformat()
        }
        
        manual_events.append(new_event)
        session['manual_calendar_events'] = manual_events
        session.modified = True
        
        return jsonify({
            'message': f'Got it! I\'ve noted that you have "{summary}" {time_description}',
            'event': new_event
        })
        
    except Exception as e:
        logging.error(f"Error adding manual event: {str(e)}")
        return jsonify({'error': 'Failed to add manual event'}), 500

@app.route('/api/calendar/manual-events', methods=['GET'])
@require_auth
def get_manual_events():
    """Get manual calendar events from session"""
    try:
        manual_events = session.get('manual_calendar_events', [])
        return jsonify({'events': manual_events})
        
    except Exception as e:
        logging.error(f"Error getting manual events: {str(e)}")
        return jsonify({'error': 'Failed to get manual events'}), 500

@app.route('/api/onedrive/files', methods=['GET'])
def get_onedrive_files():
    """Get OneDrive files (placeholder for future integration)"""
    try:
        # This would integrate with Microsoft Graph API in a full implementation
        return jsonify({
            'message': 'OneDrive integration available via file sharing links',
            'instructions': [
                'Share files from OneDrive using sharing links',
                'Copy the OneDrive sharing URL', 
                'Use the "Add Link" feature to attach OneDrive files',
                'Direct OneDrive picker integration coming soon'
            ]
        })
        
    except Exception as e:
        logging.error(f"Error accessing OneDrive: {str(e)}")
        return jsonify({'error': 'OneDrive integration not yet available'}), 500

@app.route('/api/upload-file', methods=['POST'])
@require_auth
def upload_file():
    """Upload and connect a file to Zobo"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file size (10MB limit)
        file.seek(0, 2)  # SEEK_END
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            return jsonify({'error': 'File too large. Maximum size is 10MB.'}), 400
        
        # Read file content
        file_content = file.read()
        
        # Store file info in session (connected files)
        connected_files = session.get('connected_files', [])
        
        file_info = {
            'name': file.filename,
            'size': file_size,
            'type': file.content_type or 'unknown',
            'content': file_content.decode('utf-8', errors='ignore') if file_size < 1024 * 1024 else None,  # Only store content for files < 1MB
            'uploaded_at': datetime.now().isoformat()
        }
        
        # Remove old files if too many (keep last 5)
        if len(connected_files) >= 5:
            connected_files = connected_files[-4:]  # Keep last 4, add new one
        
        connected_files.append(file_info)
        session['connected_files'] = connected_files
        session.modified = True
        
        return jsonify({
            'message': f'File "{file.filename}" connected to Zobo successfully',
            'file_info': {
                'name': file.filename,
                'size': file_size,
                'type': file.content_type
            }
        })
        
    except Exception as e:
        logging.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': 'Failed to upload file'}), 500

@app.route('/api/connected-files', methods=['GET'])
@require_auth
def get_connected_files():
    """Get list of files connected to Zobo"""
    try:
        connected_files = session.get('connected_files', [])
        
        # Return file info without content
        file_list = []
        for file_info in connected_files:
            file_list.append({
                'name': file_info['name'],
                'size': file_info['size'],
                'type': file_info['type'],
                'uploaded_at': file_info['uploaded_at']
            })
        
        return jsonify({'connected_files': file_list})
        
    except Exception as e:
        logging.error(f"Error getting connected files: {str(e)}")
        return jsonify({'error': 'Failed to get connected files'}), 500

@app.route('/api/user-data', methods=['GET'])
@require_auth
def get_user_data():
    """Get user-specific data"""
    try:
        user_id = session.get('user', {}).get('id', 'unknown')
        user_data_storage = session.get('user_data_storage', {})
        user_data = user_data_storage.get(user_id, {})
        
        return jsonify({'user_data': user_data})
        
    except Exception as e:
        logging.error(f"Error getting user data: {str(e)}")
        return jsonify({'error': 'Failed to get user data'}), 500

@app.route('/api/user-data', methods=['POST'])
@require_auth
def update_user_data():
    """Update user-specific data"""
    try:
        user_id = session.get('user', {}).get('id', 'unknown')
        data = request.get_json()
        
        # Get or create user data storage
        if 'user_data_storage' not in session:
            session['user_data_storage'] = {}
        
        user_data = session['user_data_storage'].get(user_id, {})
        
        # Update allowed fields
        allowed_fields = ['name', 'age', 'school', 'grade']
        updated_fields = []
        
        for field in allowed_fields:
            if field in data:
                user_data[field] = data[field]
                updated_fields.append(field)
        
        if updated_fields:
            user_data['last_updated'] = datetime.now().isoformat()
            session['user_data_storage'][user_id] = user_data
            session.modified = True
        
        return jsonify({
            'message': f'Updated {", ".join(updated_fields)}' if updated_fields else 'No changes made',
            'user_data': user_data
        })
        
    except Exception as e:
        logging.error(f"Error updating user data: {str(e)}")
        return jsonify({'error': 'Failed to update user data'}), 500

@app.route('/api/user-data/<field>', methods=['DELETE'])
@require_auth
def delete_user_data_field(field):
    """Delete a specific user data field"""
    try:
        user_id = session.get('user', {}).get('id', 'unknown')
        user_data_storage = session.get('user_data_storage', {})
        user_data = user_data_storage.get(user_id, {})
        
        if field in user_data:
            del user_data[field]
            user_data['last_updated'] = datetime.now().isoformat()
            session['user_data_storage'][user_id] = user_data
            session.modified = True
            
            return jsonify({'message': f'Deleted {field} from user data'})
        else:
            return jsonify({'message': f'Field {field} not found'}), 404
        
    except Exception as e:
        logging.error(f"Error deleting user data field: {str(e)}")
        return jsonify({'error': 'Failed to delete user data field'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True, threaded=True)
