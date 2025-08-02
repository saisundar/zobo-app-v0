#!/usr/bin/env python3
"""
Simple Google Calendar Setup for Kids/Students
This uses a simplified approach that doesn't require Google Cloud Console setup.
"""

import os
import json
from datetime import datetime, timedelta

def create_simple_calendar_config():
    """Create a simple calendar configuration that works without OAuth"""
    
    print("=== Simple Google Calendar Setup ===\n")
    print("Since you're a student, here are easier ways to connect your calendar:\n")
    
    print("Option 1: Google Account Integration (Easiest)")
    print("- Ask a parent/guardian to help set up a Google Apps Script")
    print("- This can share your calendar safely without complex setup")
    print("- They can create a simple webhook that Zobo can use\n")
    
    print("Option 2: Calendar Sharing via URL")
    print("- In Google Calendar, go to Settings > Your Calendar")
    print("- Click 'Integrate calendar' and copy the Public URL")
    print("- This lets Zobo see your events (but not edit them)\n")
    
    print("Option 3: Manual Calendar Input")
    print("- Tell Zobo about your schedule in chat")
    print("- Say things like 'I have math class at 2 PM' or 'I'm busy tomorrow morning'")
    print("- Zobo will remember and help you plan around it\n")
    
    # Create a simple calendar format for manual input
    simple_schedule = {
        "type": "manual_calendar",
        "events": [],
        "created": datetime.now().isoformat(),
        "instructions": "Add events by chatting with Zobo about your schedule"
    }
    
    print("For now, I've set up a simple calendar system.")
    print("Just tell Zobo about your schedule in natural language!")
    print("\nExamples:")
    print("- 'I have school from 8 AM to 3 PM on weekdays'")
    print("- 'I have soccer practice on Tuesdays at 4 PM'")
    print("- 'I'm free this Saturday morning'")
    
    return simple_schedule

if __name__ == "__main__":
    config = create_simple_calendar_config()
    print(f"\nSetup complete! You can now chat with Zobo about scheduling.")