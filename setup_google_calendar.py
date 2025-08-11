#!/usr/bin/env python3
"""
Google Calendar Setup Script
This script helps you set up Google Calendar API credentials for Zobo.

Run this script to get the credentials JSON that you need to add to Replit Secrets.
"""

import json
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Scopes for Google Calendar API
SCOPES = ["https://www.googleapis.com/auth/calendar"]


def setup_google_calendar_auth():
    """
    Interactive setup for Google Calendar authentication.
    This will guide you through the OAuth process and generate the credentials.
    """
    print("=== Google Calendar Setup for Zobo ===\n")

    print("Before running this script, you need to:")
    print("1. Go to https://console.cloud.google.com/")
    print("2. Create a new project or select existing one")
    print("3. Enable the Google Calendar API")
    print("4. Create OAuth 2.0 Client ID credentials")
    print("5. Download the credentials.json file")
    print("6. Place it in this directory as 'credentials.json'\n")

    # Check if credentials.json exists
    if not os.path.exists("credentials.json"):
        print("ERROR: credentials.json not found!")
        print(
            "Please download your OAuth credentials from Google Cloud Console"
        )
        print("and save it as 'credentials.json' in this directory.")
        return None

    creds = None
    # The file token.json stores the user's access and refresh tokens.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=8888)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    # Generate the credentials JSON for Replit Secrets
    creds_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    print("✅ Authentication successful!")
    print("\n" + "=" * 60)
    print("COPY THIS VALUE TO REPLIT SECRETS:")
    print("Secret Name: GOOGLE_CALENDAR_CREDENTIALS")
    print("Secret Value:")
    print("=" * 60)
    print(json.dumps(creds_data, indent=2))
    print("=" * 60)
    print("\nInstructions:")
    print("1. Copy the JSON above (everything between the === lines)")
    print("2. Go to your Replit project")
    print("3. Open the Secrets tab (lock icon in sidebar)")
    print("4. Add a new secret:")
    print("   - Key: GOOGLE_CALENDAR_CREDENTIALS")
    print("   - Value: [paste the JSON above]")
    print("5. Restart your application")

    return creds_data


if __name__ == "__main__":
    setup_google_calendar_auth()
