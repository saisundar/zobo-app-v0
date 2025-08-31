#!/usr/bin/env python3
"""
Database module for persistent user data storage
Uses SQLite for simplicity and portability
"""

import sqlite3
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

class UserDatabase:
    """Simple SQLite database for storing user profile data persistently"""
    
    def __init__(self, db_path: str = "user_data.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Users table for profile data
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        email TEXT,
                        name TEXT,
                        age INTEGER,
                        school TEXT,
                        grade TEXT,
                        provider TEXT,
                        profile_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Conversations table for persistent chat history
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS conversations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        conversation_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                # User preferences table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_preferences (
                        user_id TEXT PRIMARY KEY,
                        theme TEXT DEFAULT 'dark',
                        font_size TEXT DEFAULT 'medium',
                        compact_mode BOOLEAN DEFAULT 0,
                        save_conversations BOOLEAN DEFAULT 1,
                        share_data BOOLEAN DEFAULT 0,
                        preferences_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                # Connected files table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_files (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        filename TEXT,
                        file_size INTEGER,
                        file_type TEXT,
                        content TEXT,
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                # Manual calendar events table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS manual_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        summary TEXT,
                        time_description TEXT,
                        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                conn.commit()
                logging.info("Database initialized successfully")
                
        except sqlite3.Error as e:
            logging.error(f"Database initialization error: {e}")
            raise
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM users WHERE id = ?
                ''', (user_id,))
                
                row = cursor.fetchone()
                if row:
                    user_data = dict(row)
                    # Parse JSON profile data if exists
                    if user_data.get('profile_data'):
                        try:
                            extra_data = json.loads(user_data['profile_data'])
                            user_data.update(extra_data)
                        except json.JSONDecodeError:
                            pass
                    return user_data
                return None
                
        except sqlite3.Error as e:
            logging.error(f"Error getting user {user_id}: {e}")
            return None
    
    def save_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Save or update user profile data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Extract main fields
                email = user_data.get('email')
                name = user_data.get('name')
                age = user_data.get('age')
                school = user_data.get('school')
                grade = user_data.get('grade')
                provider = user_data.get('provider')
                
                # Store additional data as JSON
                extra_data = {k: v for k, v in user_data.items() 
                             if k not in ['email', 'name', 'age', 'school', 'grade', 'provider']}
                profile_data = json.dumps(extra_data) if extra_data else None
                
                # Upsert user data
                cursor.execute('''
                    INSERT OR REPLACE INTO users 
                    (id, email, name, age, school, grade, provider, profile_data, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, email, name, age, school, grade, provider, 
                      profile_data, datetime.now().isoformat()))
                
                conn.commit()
                logging.info(f"User data saved for {user_id}")
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error saving user {user_id}: {e}")
            return False
    
    def get_conversation(self, user_id: str) -> list:
        """Get user's conversation history"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT conversation_data FROM conversations 
                    WHERE user_id = ? 
                    ORDER BY updated_at DESC LIMIT 1
                ''', (user_id,))
                
                row = cursor.fetchone()
                if row and row[0]:
                    try:
                        return json.loads(row[0])
                    except json.JSONDecodeError:
                        return []
                return []
                
        except sqlite3.Error as e:
            logging.error(f"Error getting conversation for {user_id}: {e}")
            return []
    
    def save_conversation(self, user_id: str, conversation: list) -> bool:
        """Save user's conversation history"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                conversation_data = json.dumps(conversation)
                
                # Delete old conversation and insert new one
                cursor.execute('DELETE FROM conversations WHERE user_id = ?', (user_id,))
                cursor.execute('''
                    INSERT INTO conversations (user_id, conversation_data, updated_at)
                    VALUES (?, ?, ?)
                ''', (user_id, conversation_data, datetime.now().isoformat()))
                
                conn.commit()
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error saving conversation for {user_id}: {e}")
            return False
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM user_preferences WHERE user_id = ?
                ''', (user_id,))
                
                row = cursor.fetchone()
                if row:
                    prefs = dict(row)
                    # Parse additional preferences JSON
                    if prefs.get('preferences_data'):
                        try:
                            extra_prefs = json.loads(prefs['preferences_data'])
                            prefs.update(extra_prefs)
                        except json.JSONDecodeError:
                            pass
                    return prefs
                
                # Return defaults if no preferences found
                return {
                    'theme': 'dark',
                    'font_size': 'medium',
                    'compact_mode': False,
                    'save_conversations': True,
                    'share_data': False
                }
                
        except sqlite3.Error as e:
            logging.error(f"Error getting preferences for {user_id}: {e}")
            return {}
    
    def save_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Save user preferences"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Extract main preference fields
                theme = preferences.get('theme', 'dark')
                font_size = preferences.get('font_size', 'medium')
                compact_mode = preferences.get('compact_mode', False)
                save_conversations = preferences.get('save_conversations', True)
                share_data = preferences.get('share_data', False)
                
                # Store additional preferences as JSON
                extra_prefs = {k: v for k, v in preferences.items() 
                              if k not in ['theme', 'font_size', 'compact_mode', 
                                         'save_conversations', 'share_data']}
                preferences_data = json.dumps(extra_prefs) if extra_prefs else None
                
                # Upsert preferences
                cursor.execute('''
                    INSERT OR REPLACE INTO user_preferences 
                    (user_id, theme, font_size, compact_mode, save_conversations, 
                     share_data, preferences_data, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, theme, font_size, compact_mode, save_conversations,
                      share_data, preferences_data, datetime.now().isoformat()))
                
                conn.commit()
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error saving preferences for {user_id}: {e}")
            return False
    
    def get_user_files(self, user_id: str) -> list:
        """Get user's connected files"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT filename, file_size, file_type, content, uploaded_at 
                    FROM user_files 
                    WHERE user_id = ? 
                    ORDER BY uploaded_at DESC
                    LIMIT 5
                ''', (user_id,))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except sqlite3.Error as e:
            logging.error(f"Error getting files for {user_id}: {e}")
            return []
    
    def save_user_file(self, user_id: str, file_info: Dict[str, Any]) -> bool:
        """Save user's connected file"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO user_files 
                    (user_id, filename, file_size, file_type, content)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, file_info.get('name'), file_info.get('size'),
                      file_info.get('type'), file_info.get('content')))
                
                # Keep only last 5 files per user
                cursor.execute('''
                    DELETE FROM user_files 
                    WHERE user_id = ? AND id NOT IN (
                        SELECT id FROM user_files 
                        WHERE user_id = ? 
                        ORDER BY uploaded_at DESC 
                        LIMIT 5
                    )
                ''', (user_id, user_id))
                
                conn.commit()
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error saving file for {user_id}: {e}")
            return False
    
    def get_manual_events(self, user_id: str) -> list:
        """Get user's manual calendar events"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT summary, time_description, added_at 
                    FROM manual_events 
                    WHERE user_id = ? 
                    ORDER BY added_at DESC
                    LIMIT 10
                ''', (user_id,))
                
                events = []
                for row in cursor.fetchall():
                    events.append({
                        'summary': row['summary'],
                        'time': row['time_description'],
                        'added_at': row['added_at']
                    })
                return events
                
        except sqlite3.Error as e:
            logging.error(f"Error getting manual events for {user_id}: {e}")
            return []
    
    def save_manual_event(self, user_id: str, event: Dict[str, Any]) -> bool:
        """Save user's manual calendar event"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO manual_events (user_id, summary, time_description)
                    VALUES (?, ?, ?)
                ''', (user_id, event.get('summary'), event.get('time')))
                
                conn.commit()
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error saving manual event for {user_id}: {e}")
            return False
    
    def delete_user_data(self, user_id: str) -> bool:
        """Delete all user data (for privacy compliance)"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Delete from all tables
                tables = ['users', 'conversations', 'user_preferences', 
                         'user_files', 'manual_events']
                
                for table in tables:
                    cursor.execute(f'DELETE FROM {table} WHERE user_id = ?', (user_id,))
                
                conn.commit()
                logging.info(f"All data deleted for user {user_id}")
                return True
                
        except sqlite3.Error as e:
            logging.error(f"Error deleting data for {user_id}: {e}")
            return False
    
    def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data (for GDPR compliance)"""
        try:
            export_data = {
                'user_id': user_id,
                'exported_at': datetime.now().isoformat(),
                'profile': self.get_user(user_id),
                'conversation': self.get_conversation(user_id),
                'preferences': self.get_user_preferences(user_id),
                'files': self.get_user_files(user_id),
                'manual_events': self.get_manual_events(user_id)
            }
            
            return export_data
            
        except Exception as e:
            logging.error(f"Error exporting data for {user_id}: {e}")
            return {}

# Global database instance
db = UserDatabase()