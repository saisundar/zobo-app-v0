#!/usr/bin/env python3
"""
Simple calendar service stub to maintain compatibility
"""

import logging
from datetime import datetime, timedelta

class GoogleCalendarService:
    """Simplified calendar service for basic functionality"""
    
    def __init__(self):
        self.service = None
        logging.info("Calendar service initialized (stub mode)")
    
    def get_events(self, time_min=None, time_max=None):
        """Get calendar events - returns empty list for now"""
        return []
    
    def create_event(self, summary, start_time, end_time, description='', location=''):
        """Create calendar event - returns None for now"""
        logging.info(f"Calendar event request: {summary} at {start_time}")
        return None
    
    def update_event(self, event_id, summary=None, start_time=None, end_time=None, description=None, location=None):
        """Update calendar event - returns None for now"""
        logging.info(f"Calendar update request for event {event_id}")
        return None
    
    def delete_event(self, event_id):
        """Delete calendar event - returns False for now"""
        logging.info(f"Calendar delete request for event {event_id}")
        return False
    
    def smart_schedule_event(self, summary, duration_minutes, description='', location=''):
        """Smart schedule event - returns None for now"""
        logging.info(f"Smart schedule request: {summary} for {duration_minutes} minutes")
        return None, "Calendar integration not configured"
    
    def find_free_slots(self, duration_minutes=60, start_date=None, end_date=None):
        """Find free time slots - returns empty list for now"""
        return []