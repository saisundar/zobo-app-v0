# Google Calendar Integration Demo

## How to Use Zobo's Smart Scheduling

### 1. Setup Google Calendar Credentials
First, you need to set up Google Calendar API credentials:

1. Run the setup script: `python setup_google_calendar.py`
2. Follow the OAuth flow in your browser
3. Copy the generated JSON to Replit Secrets as `GOOGLE_CALENDAR_CREDENTIALS`
4. Restart the application

### 2. Smart Scheduling Examples

Once your calendar is connected, you can chat with Zobo naturally about scheduling:

**Example Conversations:**

**User:** "I need to schedule a dentist appointment next week"
**Zobo:** "I'd be happy to help you schedule that! Looking at your calendar, I see you have free time slots next week:
- Tuesday from 2:00-4:00 PM  
- Wednesday from 10:00 AM-12:00 PM
- Friday from 1:00-3:00 PM

How long do you need for the appointment, and which time works best for you?"

**User:** "Let's do Tuesday at 2:30 PM for 1 hour"
**Zobo:** "Perfect! I'll schedule your dentist appointment for Tuesday, [date] from 2:30-3:30 PM. Shall I go ahead and add this to your calendar?"

**User:** "Yes, please"
**Zobo:** "Done! Your dentist appointment has been added to your calendar for Tuesday from 2:30-3:30 PM. You should receive a calendar notification."

### 3. Calendar Query Examples

**User:** "What's my schedule like tomorrow?"
**Zobo:** "Looking at your calendar for tomorrow, you have:
- 9:00 AM - Team meeting (1 hour)
- 2:00 PM - Doctor appointment (30 minutes)
- 4:00 PM - Project review (1 hour)

You have free time from 10:00 AM-2:00 PM and after 5:00 PM. Need me to help schedule anything?"

**User:** "When do I have free time this week?"
**Zobo:** "Here are your available time slots this week (1+ hour blocks):
- Monday: 11:00 AM-1:00 PM, 3:00-5:00 PM  
- Tuesday: 2:00-4:00 PM
- Wednesday: 10:00 AM-12:00 PM, 2:00-4:00 PM
- Thursday: Morning is completely free (9:00 AM-12:00 PM)
- Friday: 1:00-3:00 PM

What would you like to schedule?"

### 4. Features

✅ **Smart Time Detection**: Zobo automatically provides calendar context for scheduling requests
✅ **Free Slot Analysis**: Finds optimal time slots between existing events  
✅ **Natural Language**: Chat naturally about scheduling needs
✅ **Confirmation Required**: Always asks before creating calendar events
✅ **Event Management**: Can view, create, update, and delete calendar events
✅ **Working Hours**: Considers reasonable working hours (9 AM - 6 PM by default)
✅ **Conflict Prevention**: Won't double-book existing appointments

### 5. API Endpoints Available

- `GET /api/calendar/events` - View calendar events
- `GET /api/calendar/free-slots` - Get available time slots  
- `POST /api/calendar/schedule` - Smart schedule suggestions
- `POST /api/calendar/confirm-schedule` - Create confirmed events
- `POST /api/calendar/create` - Create events directly
- `PUT /api/calendar/update/<id>` - Update existing events
- `DELETE /api/calendar/delete/<id>` - Delete events

### 6. Troubleshooting

**Calendar not connected?**
- Check if `GOOGLE_CALENDAR_CREDENTIALS` secret is properly set
- Ensure the JSON format is correct (from setup script)
- Restart the application after adding secrets

**Zobo not suggesting times?**
- Use scheduling keywords: "schedule", "meeting", "appointment", "free time"
- Try phrases like "when am I free?" or "schedule a call"
- Make sure your calendar has some existing events for context