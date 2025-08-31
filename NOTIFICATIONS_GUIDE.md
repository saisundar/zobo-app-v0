# 🔔 Zobo Notifications & Timing Features

Zobo now supports comprehensive notifications, alarms, timers, and stopwatches! These features enhance your interaction with Zobo by providing time-based assistance and alerts.

## 🚀 Features Overview

### 📱 Device Compatibility
- **Notifications**: Available on all devices (desktop, mobile, tablet)
- **Alarms**: Mobile devices only (phones and tablets)
- **Timers**: Mobile devices only (phones and tablets)  
- **Stopwatches**: Mobile devices only (phones and tablets)

### ✨ Key Capabilities
- Web push notifications with permission management
- Background notifications when app is not active
- Mobile vibration patterns for alerts
- Voice command integration through chat
- Persistent timing across browser sessions
- Service worker support for background operation

## 📢 Notification Commands

### Basic Notifications
```
"Send notification about meeting in 5 minutes"
"Notify me about lunch"
"Send notification 'Remember to call mom'"
```

## ⏰ Alarm Commands (Mobile Only)

### Set Alarms
```
"Set alarm for 7:30 AM"
"Set alarm for 6 PM to take medicine"
"Alarm for 2:30 PM about the meeting"
"Set alarm in 30 minutes"
"Set alarm in 2 hours to check on dinner"
"Wake me up at 8:00 AM for work"
```

### Manage Alarms
```
"Show alarms"
"List active alarms"
"What alarms do I have?"
```

## ⏱️ Timer Commands (Mobile Only)

### Set Timers
```
"Set timer for 10 minutes"
"Timer for 5 minutes to check cookies"
"15 minute timer for workout"
"Set timer for 2 hours"
"30 second timer"
```

### Timer Status
```
"Show timers"
"List active timers"
"What timers are running?"
```

## ⏲️ Stopwatch Commands (Mobile Only)

### Control Stopwatch
```
"Start stopwatch"
"Stop stopwatch"
"Show stopwatches"
"List active stopwatches"
```

### Advanced Stopwatch (Future)
- Lap timing functionality
- Pause/resume capability
- Multiple concurrent stopwatches

## 🔧 Technical Implementation

### Device Detection
The system automatically detects device type using:
- User agent analysis
- Touch capability detection
- Screen size assessment
- Orientation checks

### Mobile Device Criteria
A device is considered mobile if it:
- Matches mobile user agent patterns (Android, iOS, etc.)
- Has touch support
- Has small screen dimensions (≤768px)
- Is in portrait orientation

### Notification System
- **Permission Management**: Automatic permission request
- **Background Support**: Service worker for background notifications
- **Visual Feedback**: Custom notification styling with Zobo branding
- **Audio Alerts**: Sound files for alarms and timers
- **Vibration**: Mobile vibration patterns for enhanced alerts

### Error Handling
- Graceful degradation when features aren't available
- Clear error messages for unsupported devices
- Fallback options for permission-denied scenarios

## 📱 Mobile-Only Features Explanation

### Why Mobile Only?
Alarms, timers, and stopwatches are restricted to mobile devices because:

1. **Usage Patterns**: These features are primarily used on personal mobile devices
2. **Notification Reliability**: Mobile browsers have better background notification support
3. **User Experience**: Mobile devices are typically with users throughout the day
4. **Battery Optimization**: Mobile devices handle background tasks more efficiently
5. **Vibration Support**: Physical feedback enhances timer/alarm effectiveness

### Laptop/Desktop Experience
On laptops and desktops, users will receive clear messages like:
- "⏰ Alarms are only available on mobile devices (phones and tablets)."
- "⏱️ Timers are only available on mobile devices (phones and tablets)."

## 🔊 Audio Files

### Required Audio Files
Place these files in `/static/audio/`:
- `alarm.mp3`: Alarm sound (looping, 30-second max)
- `timer.mp3`: Timer completion sound (single play)

### Audio Specifications
- **Format**: MP3 (widely supported)
- **Duration**: 
  - Alarm: 5-10 seconds (will loop)
  - Timer: 1-3 seconds (single play)
- **Volume**: Moderate (code sets volume to 0.6-0.8)
- **Quality**: 128kbps or higher for clarity

## 🖼️ Icon Files

### Required Icon Files
Place these files in `/static/img/`:
- `zobo-icon.png`: Main notification icon (192x192px)
- `zobo-badge.png`: Notification badge (72x72px)

### Icon Specifications
- **Format**: PNG with transparency
- **Colors**: Match Zobo branding
- **Background**: Transparent or solid color
- **Quality**: High resolution for crisp display

## 🧪 Testing Commands

Try these commands to test the notification system:

### Basic Test
```
"Send notification hello world"
```

### Mobile Timer Test (if on mobile)
```
"Set timer for 10 seconds"
```

### Mobile Alarm Test (if on mobile)
```
"Set alarm in 1 minute for testing"
```

### Status Check
```
"Show alarms"
"Show timers"
"Show stopwatches"
```

## 🛠️ Developer Notes

### JavaScript Integration
- Main class: `ZoboNotifications` in `/static/js/notifications.js`
- Chat integration: `handleNotificationCommand()` in `/static/js/chat.js`
- Service worker: `/static/js/sw-notifications.js`

### Browser Support
- **Chrome**: Full support (desktop + mobile)
- **Firefox**: Full support (desktop + mobile)
- **Safari**: Notification support, limited background features
- **Edge**: Full support (desktop + mobile)

### Permissions
The system automatically requests notification permissions on first use. Users can:
- Allow: Full notification functionality
- Deny: Features disabled with graceful fallback
- Default: Will prompt when first notification is triggered

### Background Operation
- Uses Service Worker for background notifications
- Survives browser tab closure on mobile
- Limited background time on desktop browsers
- Snooze functionality for alarms

## 🔮 Future Enhancements

### Planned Features
- [ ] Calendar integration for smart alarms
- [ ] Location-based notifications
- [ ] Recurring alarms (daily, weekly)
- [ ] Custom notification sounds
- [ ] Multiple stopwatch support with labels
- [ ] Timer templates (common durations)
- [ ] Sleep tracking integration
- [ ] Focus/Pomodoro timer modes

### Potential Integrations
- [ ] Google Calendar reminders
- [ ] Task management systems
- [ ] Health apps for medication reminders
- [ ] Smart home device integration
- [ ] Weather-based notifications

---

## 🎯 Quick Start

1. **Open Zobo on your mobile device**
2. **Allow notification permissions** when prompted
3. **Try a simple command**: `"Set timer for 5 minutes"`
4. **Watch for the notification** when timer completes!

Enjoy your enhanced Zobo experience with notifications and timing features! 🚀