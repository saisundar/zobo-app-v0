import json
import logging
import os
from datetime import datetime, timedelta

from dateutil import parser
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Scopes for Google Calendar API
SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = "35b16f711410d3a53db69da560c7b50107d4a4f0397ef90e2f3c251091f54358@group.calendar.google.com"


class GoogleCalendarService:
    def __init__(self):
        self.service = None
        self.credentials = None
        self.setup_credentials()

    def setup_credentials(self):
        """Setup Google Calendar API credentials"""
        try:
            # Load credentials from environment or file
            creds_json = os.environ.get("GOOGLE_CALENDAR_CREDENTIALS")
            if creds_json:
                creds_data = json.loads(creds_json)
                self.credentials = Credentials.from_authorized_user_info(
                    creds_data, SCOPES
                )

            # If there are no valid credentials available, user needs to authorize
            if not self.credentials or not self.credentials.valid:
                if (
                    self.credentials
                    and self.credentials.expired
                    and self.credentials.refresh_token
                ):
                    self.credentials.refresh(Request())
                else:
                    # This would need to be handled through OAuth flow
                    logging.warning(
                        "Google Calendar credentials not available or invalid"
                    )
                    return False

            # Build the service
            self.service = build("calendar", "v3", credentials=self.credentials)
            return True

        except Exception as e:
            logging.error(f"Error setting up Calendar credentials: {str(e)}")
            return False

    def get_events(self, time_min=None, time_max=None, max_results=50):
        """Get events from Google Calendar"""
        if not self.service:
            return None

        try:
            # Default to next 7 days if no time range specified
            if not time_min:
                time_min = datetime.utcnow().isoformat() + "Z"
            if not time_max:
                time_max = (
                    datetime.utcnow() + timedelta(days=7)
                ).isoformat() + "Z"

            events_result = (
                self.service.events()
                .list(
                    calendarId=CALENDAR_ID,
                    timeMin=time_min,
                    timeMax=time_max,
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )

            events = events_result.get("items", [])

            # Format events for easier processing
            formatted_events = []
            for event in events:
                start = event["start"].get(
                    "dateTime", event["start"].get("date")
                )
                end = event["end"].get("dateTime", event["end"].get("date"))

                formatted_events.append(
                    {
                        "id": event["id"],
                        "summary": event.get("summary", "No title"),
                        "description": event.get("description", ""),
                        "start": start,
                        "end": end,
                        "location": event.get("location", ""),
                        "attendees": event.get("attendees", []),
                    }
                )

            return formatted_events

        except HttpError as error:
            logging.error(f"Error getting calendar events: {error}")
            return None

    def create_event(
        self, summary, start_time, end_time, description="", location=""
    ):
        """Create a new event in Google Calendar"""
        if not self.service:
            return None

        try:
            event = {
                "summary": summary,
                "description": description,
                "location": location,
                "start": {
                    "dateTime": start_time,
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": end_time,
                    "timeZone": "UTC",
                },
            }

            event = (
                self.service.events()
                .insert(calendarId=CALENDAR_ID, body=event)
                .execute()
            )
            return event

        except HttpError as error:
            logging.error(f"Error creating calendar event: {error}")
            return None

    def update_event(
        self,
        event_id,
        summary=None,
        start_time=None,
        end_time=None,
        description=None,
        location=None,
    ):
        """Update an existing event in Google Calendar"""
        if not self.service:
            return None

        try:
            # Get the existing event
            event = (
                self.service.events()
                .get(calendarId="primary", eventId=event_id)
                .execute()
            )

            # Update fields if provided
            if summary:
                event["summary"] = summary
            if description is not None:
                event["description"] = description
            if location is not None:
                event["location"] = location
            if start_time:
                event["start"] = {"dateTime": start_time, "timeZone": "UTC"}
            if end_time:
                event["end"] = {"dateTime": end_time, "timeZone": "UTC"}

            updated_event = (
                self.service.events()
                .update(calendarId="primary", eventId=event_id, body=event)
                .execute()
            )
            return updated_event

        except HttpError as error:
            logging.error(f"Error updating calendar event: {error}")
            return None

    def delete_event(self, event_id):
        """Delete an event from Google Calendar"""
        if not self.service:
            return False

        try:
            self.service.events().delete(
                calendarId="primary", eventId=event_id
            ).execute()
            return True

        except HttpError as error:
            logging.error(f"Error deleting calendar event: {error}")
            return False

    def find_free_slots(
        self,
        duration_minutes,
        start_date=None,
        end_date=None,
        working_hours=(9, 17),
    ):
        """Find free time slots in the calendar"""
        if not self.service:
            return []

        try:
            # Default to next 7 days if no date range specified
            if not start_date:
                start_date = datetime.utcnow().replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            if not end_date:
                end_date = start_date + timedelta(days=7)

            # Get events in the date range
            events = self.get_events(
                time_min=start_date.isoformat() + "Z",
                time_max=end_date.isoformat() + "Z",
            )

            if events is None:
                return []

            free_slots = []
            current_date = start_date

            while current_date < end_date:
                # Skip weekends (optional - can be made configurable)
                if current_date.weekday() < 5:  # Monday = 0, Sunday = 6
                    # Check each day for free slots
                    day_start = current_date.replace(
                        hour=working_hours[0], minute=0
                    )
                    day_end = current_date.replace(
                        hour=working_hours[1], minute=0
                    )

                    # Get events for this day
                    day_events = []
                    for event in events:
                        event_start = parser.parse(event["start"])
                        event_end = parser.parse(event["end"])

                        # Check if event overlaps with this day
                        if (
                            event_start.date()
                            <= current_date.date()
                            <= event_end.date()
                        ):
                            day_events.append(
                                {
                                    "start": max(event_start, day_start),
                                    "end": min(event_end, day_end),
                                }
                            )

                    # Sort events by start time
                    day_events.sort(key=lambda x: x["start"])

                    # Find free slots
                    current_time = day_start
                    for event in day_events:
                        if event["start"] > current_time:
                            # There's a gap before this event
                            gap_duration = (
                                event["start"] - current_time
                            ).total_seconds() / 60
                            if gap_duration >= duration_minutes:
                                free_slots.append(
                                    {
                                        "start": current_time,
                                        "end": event["start"],
                                        "duration_minutes": gap_duration,
                                    }
                                )
                        current_time = max(current_time, event["end"])

                    # Check for free time after the last event
                    if current_time < day_end:
                        gap_duration = (
                            day_end - current_time
                        ).total_seconds() / 60
                        if gap_duration >= duration_minutes:
                            free_slots.append(
                                {
                                    "start": current_time,
                                    "end": day_end,
                                    "duration_minutes": gap_duration,
                                }
                            )

                current_date += timedelta(days=1)

            return free_slots

        except Exception as e:
            logging.error(f"Error finding free slots: {str(e)}")
            return []

    def smart_schedule_event(
        self,
        summary,
        duration_minutes,
        preferred_times=None,
        description="",
        location="",
    ):
        """Smart schedule an event by finding the best available slot"""
        free_slots = self.find_free_slots(duration_minutes)

        if not free_slots:
            return None, "No available time slots found"

        # If preferred times are specified, try to find slots that match
        if preferred_times:
            # This could be enhanced to match preferred times
            pass

        # For now, suggest the first available slot
        best_slot = free_slots[0]
        suggested_start = best_slot["start"]
        suggested_end = suggested_start + timedelta(minutes=duration_minutes)

        return {
            "suggested_start": suggested_start,
            "suggested_end": suggested_end,
            "summary": summary,
            "description": description,
            "location": location,
            "alternative_slots": free_slots[:5],  # Provide up to 5 alternatives
        }, None
