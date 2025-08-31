#!/usr/bin/env python3
"""
Simple database test to verify functionality
"""

import os

def test_database():
    """Test if database is working"""
    try:
        from database import db
        
        # Test user creation
        test_user_id = "test-user-12345"
        test_data = {
            'name': 'Test User',
            'age': 25,
            'school': 'Test School'
        }
        
        print("Testing database functionality...")
        
        # Save user
        save_result = db.save_user(test_user_id, test_data)
        print(f"Save user: {save_result}")
        
        # Get user
        retrieved_data = db.get_user(test_user_id)
        print(f"Retrieved data: {retrieved_data}")
        
        # Clean up
        db.delete_user_data(test_user_id)
        print("✅ Database is working!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False

if __name__ == '__main__':
    test_database()