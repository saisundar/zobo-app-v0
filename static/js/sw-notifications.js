/**
 * Zobo Notification Service Worker
 * Handles background notifications when the app is not active
 */

const CACHE_NAME = 'zobo-notifications-v1';

// Install service worker
self.addEventListener('install', event => {
    console.log('Zobo notification service worker installed');
    self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', event => {
    console.log('Zobo notification service worker activated');
    event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.notification);
    
    const notification = event.notification;
    const action = event.action;
    
    // Handle different notification actions
    if (action === 'snooze') {
        // Snooze alarm for 5 minutes
        scheduleSnoozeAlarm(notification);
    } else if (action === 'dismiss') {
        // Just close the notification
        notification.close();
        return;
    }
    
    // Default action - focus or open the app
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            // Check if app is already open
            for (let client of clients) {
                if (client.url.includes('zobo-app') && 'focus' in client) {
                    client.focus();
                    notification.close();
                    return;
                }
            }
            
            // Open new window if app is not open
            if (self.clients.openWindow) {
                self.clients.openWindow('/');
                notification.close();
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
    console.log('Notification closed:', event.notification.tag);
});

// Handle background sync for scheduled notifications
self.addEventListener('sync', event => {
    if (event.tag === 'zobo-alarm-sync') {
        event.waitUntil(processScheduledAlarms());
    }
});

function scheduleSnoozeAlarm(notification) {
    /**
     * Schedule a snooze alarm for 5 minutes
     */
    const snoozeTime = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    // Close current notification
    notification.close();
    
    // Schedule new notification
    setTimeout(() => {
        self.registration.showNotification('🚨 Zobo Alarm (Snoozed)', {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            tag: notification.tag + '-snooze',
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500],
            actions: [
                { action: 'snooze', title: '😴 Snooze 5 min' },
                { action: 'dismiss', title: '✅ Dismiss' }
            ]
        });
    }, 5 * 60 * 1000);
    
    console.log('Alarm snoozed for 5 minutes');
}

function processScheduledAlarms() {
    /**
     * Process any scheduled alarms (for future background sync implementation)
     */
    return Promise.resolve();
}

// Handle messages from main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SCHEDULE_ALARM':
            scheduleBackgroundAlarm(data);
            break;
        case 'CANCEL_ALARM':
            cancelBackgroundAlarm(data.id);
            break;
        default:
            console.log('Unknown message type:', type);
    }
});

function scheduleBackgroundAlarm(alarmData) {
    /**
     * Schedule an alarm to fire even when app is in background
     */
    const { id, time, message } = alarmData;
    const delay = new Date(time).getTime() - Date.now();
    
    if (delay > 0) {
        setTimeout(() => {
            self.registration.showNotification('🚨 Zobo Alarm', {
                body: message,
                icon: '/static/img/zobo-icon.png',
                badge: '/static/img/zobo-badge.png',
                tag: `alarm-${id}`,
                requireInteraction: true,
                vibrate: [500, 200, 500, 200, 500],
                actions: [
                    { action: 'snooze', title: '😴 Snooze 5 min' },
                    { action: 'dismiss', title: '✅ Dismiss' }
                ]
            });
        }, delay);
        
        console.log(`Background alarm scheduled: ${id} for ${new Date(time).toLocaleString()}`);
    }
}

function cancelBackgroundAlarm(alarmId) {
    /**
     * Cancel a background alarm
     */
    // In a more complex implementation, we'd track active timeouts
    console.log(`Background alarm cancelled: ${alarmId}`);
}