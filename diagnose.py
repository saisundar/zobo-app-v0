#!/usr/bin/env python3
"""
Diagnosis script to identify why the service is unavailable
"""

import os
import sys

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("🔍 Checking Dependencies...")
    
    required_packages = [
        'flask', 'requests', 'authlib', 'python-dateutil', 'PyJWT'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("✅ All core dependencies available")
    return True

def check_environment_variables():
    """Check required environment variables"""
    print("\n🔧 Checking Environment Variables...")
    
    required_vars = ['MOONSHOT_API_KEY']
    optional_vars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GEMINI_API_KEY']
    
    missing_required = []
    for var in required_vars:
        if os.environ.get(var):
            print(f"✅ {var} - Set")
        else:
            print(f"❌ {var} - MISSING (REQUIRED)")
            missing_required.append(var)
    
    missing_optional = []
    for var in optional_vars:
        if os.environ.get(var):
            print(f"✅ {var} - Set")
        else:
            print(f"⚠️  {var} - Not set (optional)")
            missing_optional.append(var)
    
    if missing_required:
        print(f"\n🚨 CRITICAL: Missing required variables: {', '.join(missing_required)}")
        print("The app will not work without these!")
        return False
    
    print("✅ All required environment variables set")
    return True

def check_app_startup():
    """Check if the app can start without errors"""
    print("\n🚀 Testing App Startup...")
    
    try:
        # Try importing the app
        from app import app
        print("✅ App imports successfully")
        
        # Test app configuration
        if app.secret_key:
            print("✅ App secret key configured")
        else:
            print("⚠️  App secret key missing")
        
        return True
        
    except Exception as e:
        print(f"❌ App startup error: {str(e)}")
        return False

def suggest_fixes():
    """Suggest fixes for common issues"""
    print("\n🛠️  Quick Fixes:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Set MOONSHOT_API_KEY environment variable")
    print("3. For Google features, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET")
    print("4. Start the app: python3 app.py")
    print("5. Access at: http://localhost:8080")

def main():
    """Run all diagnostic checks"""
    print("🏥 Zobo App Diagnostic Tool")
    print("=" * 50)
    
    deps_ok = check_dependencies()
    env_ok = check_environment_variables()
    app_ok = check_app_startup()
    
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY:")
    print(f"Dependencies: {'✅ OK' if deps_ok else '❌ ISSUES'}")
    print(f"Environment: {'✅ OK' if env_ok else '❌ ISSUES'}")
    print(f"App Startup: {'✅ OK' if app_ok else '❌ ISSUES'}")
    
    if deps_ok and env_ok and app_ok:
        print("\n🎉 All checks passed! The app should work.")
        print("🌐 Start with: python3 app.py")
        print("🌐 Access at: http://localhost:8080")
    else:
        print("\n🚨 Issues found! See fixes below:")
        suggest_fixes()

if __name__ == '__main__':
    main()