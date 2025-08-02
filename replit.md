# Zobo - Your AI Friend Chat Assistant

## Overview

This is a Flask-based web application that provides a chat interface for interacting with the Moonshot AI API (Kimi K2 model). The AI assistant is named "Zobo" and acts as a close, supportive friend. The application features a responsive web interface with real-time chat functionality, conversation history, and API status monitoring.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

The application follows a traditional client-server architecture with the following components:

- **Frontend**: HTML/CSS/JavaScript with Bootstrap for responsive UI
- **Backend**: Python Flask web framework serving as API proxy
- **External API**: Moonshot AI API for chat completions
- **Session Management**: Flask sessions for conversation persistence

## Key Components

### Backend (Flask Application)
- **app.py**: Main Flask application with chat endpoints and Moonshot API integration
- **main.py**: Application entry point for development server
- **MoonshotAPI Class**: Wrapper for Moonshot API interactions with error handling and streaming support

### Frontend
- **templates/index.html**: Single-page chat interface with Bootstrap dark theme
- **static/css/custom.css**: Custom styling for chat bubbles and responsive design
- **static/js/chat.js**: Client-side chat functionality with real-time messaging

### Core Features
- Real-time chat interface with message bubbles
- Conversation history persistence using Flask sessions
- File and link attachment capabilities
- Microsoft OneDrive integration for file sharing
- Google Calendar integration with smart scheduling
- API status monitoring and error handling
- Responsive design supporting mobile and desktop
- Character count and input validation
- Clear conversation functionality

## Data Flow

1. **User Input**: User types message in web interface
2. **Frontend Processing**: JavaScript validates input and sends POST request to Flask backend
3. **Message Enhancement**: If scheduling-related, backend enriches message with calendar context
4. **Backend Processing**: Flask receives message, adds to conversation history, sends to Moonshot API
5. **API Integration**: MoonshotAPI class handles authentication and request formatting
6. **Calendar Integration**: Zobo can access calendar events and suggest optimal scheduling times
7. **Response Handling**: Backend receives AI response and sends back to frontend
8. **Event Scheduling**: User can confirm scheduling through chat, which creates actual calendar events
9. **UI Update**: JavaScript updates chat interface with new messages and status alerts

## External Dependencies

### Backend Dependencies
- **Flask**: Web framework for routing and session management
- **requests**: HTTP client for Moonshot API communication
- **os**: Environment variable management
- **logging**: Application logging and debugging

### Frontend Dependencies
- **Bootstrap**: UI framework with dark theme support
- **Font Awesome**: Icon library for UI elements
- **Vanilla JavaScript**: No frontend frameworks, pure JS implementation

### External Services
- **Moonshot AI API**: Primary AI chat completion service
  - Model: kimi-k2-0711-preview
  - Authentication via API key
  - Supports streaming responses

- **Google Calendar API**: Calendar integration service
  - Enables calendar querying and event management
  - Smart scheduling with free time slot detection
  - OAuth 2.0 authentication
  - Requires GOOGLE_CALENDAR_CREDENTIALS secret

## Deployment Strategy

### Environment Configuration
- **SESSION_SECRET**: Flask session encryption key (defaults to dev key)
- **MOONSHOT_API_KEY**: Required API key for Moonshot service
- **Development Mode**: Runs on localhost:5000 with debug enabled

### File Structure
```
/
├── app.py              # Main Flask application
├── main.py             # Development server entry point
├── templates/
│   └── index.html      # Chat interface template
└── static/
    ├── css/
    │   └── custom.css  # Custom styles
    └── js/
        └── chat.js     # Frontend logic
```

### Key Architectural Decisions

1. **Session-based Storage**: Uses Flask sessions instead of database for conversation persistence
   - **Rationale**: Simplifies deployment and reduces infrastructure requirements
   - **Trade-off**: Conversations don't persist across browser sessions

2. **Proxy Architecture**: Flask acts as middleware between frontend and Moonshot API
   - **Rationale**: Keeps API keys secure and allows request/response transformation
   - **Benefit**: Enables session management and conversation context

3. **Single Page Application**: All chat functionality in one HTML page
   - **Rationale**: Provides seamless user experience without page reloads
   - **Implementation**: JavaScript handles dynamic content updates

4. **Bootstrap Integration**: Uses Replit's custom Bootstrap dark theme
   - **Rationale**: Consistent styling with Replit environment
   - **Benefit**: Responsive design with minimal custom CSS

The application is designed for development and demonstration purposes, with a focus on simplicity and ease of deployment in the Replit environment.