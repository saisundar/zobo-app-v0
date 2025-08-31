/**
 * Zobo Notifications & Timing System
 * Handles notifications, alarms, timers, and stopwatches
 */

class ZoboNotifications {
    constructor() {
        this.permission = 'default';
        this.activeAlarms = new Map();
        this.activeTimers = new Map();
        this.activeStopwatches = new Map();
        this.isMobileDevice = this.detectMobileDevice();
        
        this.init();
    }
    
    async init() {
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Initialize service worker for background notifications if supported
        this.initServiceWorker();
        
        // Set up visibility change handler for background notifications
        this.setupVisibilityHandler();
        
        console.log(`Zobo Notifications initialized - Mobile: ${this.isMobileDevice}, Permission: ${this.permission}`);
    }
    
    detectMobileDevice() {
        /**
         * Detect if device is mobile (phone or tablet)
         * Returns true for mobile devices, false for laptops/desktops
         */
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Mobile user agent patterns
        const mobilePatterns = [
            /android/i,
            /webos/i,
            /iphone/i,
            /ipad/i,
            /ipod/i,
            /blackberry/i,
            /windows phone/i,
            /mobile/i,
            /tablet/i
        ];
        
        // Check user agent
        const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent));
        
        // Additional checks
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        // Device is considered mobile if it matches UA patterns and has touch support
        // OR if it's a small touch screen in portrait mode
        return isMobileUA || (hasTouch && isSmallScreen && isPortrait);
    }
    
    async requestNotificationPermission() {
        /**
         * Request permission for web notifications
         */
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }
        
        if (Notification.permission === 'denied') {
            this.permission = 'denied';
            return false;
        }
        
        // Request permission
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }
    
    async initServiceWorker() {
        /**
         * Initialize service worker for background notifications
         */
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/static/js/sw-notifications.js');
                console.log('Notification service worker registered:', registration);
            } catch (error) {
                console.log('Service worker registration failed:', error);
            }
        }
    }
    
    setupVisibilityHandler() {
        /**
         * Handle page visibility changes for background notifications
         */
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is now hidden - background mode
                this.enableBackgroundMode();
            } else {
                // Page is visible again - foreground mode
                this.enableForegroundMode();
            }
        });
    }
    
    enableBackgroundMode() {
        /**
         * Switch to background notification mode
         */
        console.log('Switched to background notification mode');
        // Background notifications will be handled by service worker
    }
    
    enableForegroundMode() {
        /**
         * Switch to foreground notification mode
         */
        console.log('Switched to foreground notification mode');
        // Direct notifications will be handled by this class
    }
    
    async sendNotification(title, options = {}) {
        /**
         * Send a notification to the user
         */
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }
        
        const defaultOptions = {
            body: '',
            icon: '/static/img/zobo-icon.png',
            badge: '/static/img/zobo-badge.png',
            tag: 'zobo-notification',
            requireInteraction: false,
            vibrate: [200, 100, 200], // Mobile vibration pattern
            ...options
        };
        
        try {
            if (document.hidden && 'serviceWorker' in navigator) {
                // Send through service worker for background notifications
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(title, defaultOptions);
            } else {
                // Direct notification
                new Notification(title, defaultOptions);
            }
            
            // Mobile vibration if supported
            if (this.isMobileDevice && 'vibrate' in navigator) {
                navigator.vibrate(defaultOptions.vibrate);
            }
            
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }
    
    // ALARM FUNCTIONALITY
    setAlarm(id, time, message = 'Alarm') {
        /**
         * Set an alarm for a specific time
         * @param {string} id - Unique alarm identifier
         * @param {Date|string} time - When to trigger alarm
         * @param {string} message - Alarm message
         */
        if (!this.isMobileDevice) {
            throw new Error('Alarms are only available on mobile devices');
        }
        
        const alarmTime = new Date(time);
        const now = new Date();
        
        if (alarmTime <= now) {
            throw new Error('Alarm time must be in the future');
        }
        
        const delay = alarmTime.getTime() - now.getTime();
        
        // Clear existing alarm with same ID
        this.clearAlarm(id);
        
        const timeoutId = setTimeout(() => {
            this.triggerAlarm(id, message, alarmTime);
        }, delay);
        
        this.activeAlarms.set(id, {
            timeoutId,
            time: alarmTime,
            message,
            created: now
        });
        
        console.log(`Alarm '${id}' set for ${alarmTime.toLocaleString()}`);
        return true;
    }
    
    clearAlarm(id) {
        /**
         * Clear/cancel an alarm
         */
        const alarm = this.activeAlarms.get(id);
        if (alarm) {
            clearTimeout(alarm.timeoutId);
            this.activeAlarms.delete(id);
            console.log(`Alarm '${id}' cleared`);
            return true;
        }
        return false;
    }
    
    async triggerAlarm(id, message, scheduledTime) {
        /**
         * Trigger alarm notification and sound
         */
        console.log(`🚨 ALARM: ${message} (scheduled for ${scheduledTime.toLocaleString()})`);
        
        // Send notification
        await this.sendNotification('🚨 Zobo Alarm', {
            body: message,
            tag: `alarm-${id}`,
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500],
            actions: [
                { action: 'snooze', title: '😴 Snooze 5 min' },
                { action: 'dismiss', title: '✅ Dismiss' }
            ]
        });
        
        // Play alarm sound
        this.playAlarmSound();
        
        // Remove from active alarms
        this.activeAlarms.delete(id);
        
        // Notify chat app
        if (window.chatApp) {
            window.chatApp.addMessage(`🚨 Alarm: ${message}`, 'system');
        }
    }
    
    // TIMER FUNCTIONALITY
    startTimer(id, duration, message = 'Timer finished') {
        /**
         * Start a countdown timer
         * @param {string} id - Unique timer identifier
         * @param {number} duration - Duration in seconds
         * @param {string} message - Timer completion message
         */
        if (!this.isMobileDevice) {
            throw new Error('Timers are only available on mobile devices');
        }
        
        if (duration <= 0) {
            throw new Error('Timer duration must be positive');
        }
        
        // Clear existing timer with same ID
        this.clearTimer(id);
        
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        
        const timeoutId = setTimeout(() => {
            this.triggerTimer(id, message, duration);
        }, duration * 1000);
        
        this.activeTimers.set(id, {
            timeoutId,
            startTime,
            endTime,
            duration,
            message,
            remaining: duration
        });
        
        // Start countdown update
        this.startTimerCountdown(id);
        
        console.log(`Timer '${id}' started for ${duration} seconds`);
        return true;
    }
    
    startTimerCountdown(id) {
        /**
         * Update timer countdown every second
         */
        const timer = this.activeTimers.get(id);
        if (!timer) return;
        
        const updateCountdown = () => {
            const timer = this.activeTimers.get(id);
            if (!timer) return;
            
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
            timer.remaining = remaining;
            
            // Notify UI update if callback exists
            if (timer.onUpdate) {
                timer.onUpdate(remaining);
            }
            
            if (remaining > 0) {
                setTimeout(updateCountdown, 1000);
            }
        };
        
        updateCountdown();
    }
    
    clearTimer(id) {
        /**
         * Clear/cancel a timer
         */
        const timer = this.activeTimers.get(id);
        if (timer) {
            clearTimeout(timer.timeoutId);
            this.activeTimers.delete(id);
            console.log(`Timer '${id}' cleared`);
            return true;
        }
        return false;
    }
    
    async triggerTimer(id, message, duration) {
        /**
         * Trigger timer completion notification
         */
        console.log(`⏰ TIMER FINISHED: ${message} (${duration}s)`);
        
        // Send notification
        await this.sendNotification('⏰ Zobo Timer', {
            body: message,
            tag: `timer-${id}`,
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300]
        });
        
        // Play timer sound
        this.playTimerSound();
        
        // Remove from active timers
        this.activeTimers.delete(id);
        
        // Notify chat app
        if (window.chatApp) {
            window.chatApp.addMessage(`⏰ Timer finished: ${message}`, 'system');
        }
    }
    
    // STOPWATCH FUNCTIONALITY
    startStopwatch(id) {
        /**
         * Start a stopwatch
         * @param {string} id - Unique stopwatch identifier
         */
        if (!this.isMobileDevice) {
            throw new Error('Stopwatches are only available on mobile devices');
        }
        
        const startTime = Date.now();
        
        this.activeStopwatches.set(id, {
            startTime,
            lapTimes: [],
            isRunning: true,
            totalElapsed: 0
        });
        
        // Start update loop
        this.startStopwatchUpdate(id);
        
        console.log(`Stopwatch '${id}' started`);
        return true;
    }
    
    startStopwatchUpdate(id) {
        /**
         * Update stopwatch display every 100ms
         */
        const updateStopwatch = () => {
            const stopwatch = this.activeStopwatches.get(id);
            if (!stopwatch || !stopwatch.isRunning) return;
            
            const elapsed = stopwatch.totalElapsed + (Date.now() - stopwatch.startTime);
            
            // Notify UI update if callback exists
            if (stopwatch.onUpdate) {
                stopwatch.onUpdate(elapsed);
            }
            
            setTimeout(updateStopwatch, 100);
        };
        
        updateStopwatch();
    }
    
    pauseStopwatch(id) {
        /**
         * Pause a running stopwatch
         */
        const stopwatch = this.activeStopwatches.get(id);
        if (stopwatch && stopwatch.isRunning) {
            stopwatch.totalElapsed += Date.now() - stopwatch.startTime;
            stopwatch.isRunning = false;
            console.log(`Stopwatch '${id}' paused`);
            return true;
        }
        return false;
    }
    
    resumeStopwatch(id) {
        /**
         * Resume a paused stopwatch
         */
        const stopwatch = this.activeStopwatches.get(id);
        if (stopwatch && !stopwatch.isRunning) {
            stopwatch.startTime = Date.now();
            stopwatch.isRunning = true;
            this.startStopwatchUpdate(id);
            console.log(`Stopwatch '${id}' resumed`);
            return true;
        }
        return false;
    }
    
    lapStopwatch(id) {
        /**
         * Record a lap time
         */
        const stopwatch = this.activeStopwatches.get(id);
        if (stopwatch) {
            const currentElapsed = stopwatch.totalElapsed + 
                (stopwatch.isRunning ? Date.now() - stopwatch.startTime : 0);
            
            stopwatch.lapTimes.push({
                lapNumber: stopwatch.lapTimes.length + 1,
                time: currentElapsed,
                timestamp: new Date()
            });
            
            console.log(`Stopwatch '${id}' lap ${stopwatch.lapTimes.length}: ${this.formatTime(currentElapsed)}`);
            return currentElapsed;
        }
        return null;
    }
    
    resetStopwatch(id) {
        /**
         * Reset stopwatch to zero
         */
        const stopwatch = this.activeStopwatches.get(id);
        if (stopwatch) {
            stopwatch.startTime = Date.now();
            stopwatch.totalElapsed = 0;
            stopwatch.lapTimes = [];
            console.log(`Stopwatch '${id}' reset`);
            return true;
        }
        return false;
    }
    
    stopStopwatch(id) {
        /**
         * Stop and remove stopwatch
         */
        const stopwatch = this.activeStopwatches.get(id);
        if (stopwatch) {
            const finalTime = stopwatch.totalElapsed + 
                (stopwatch.isRunning ? Date.now() - stopwatch.startTime : 0);
            
            this.activeStopwatches.delete(id);
            console.log(`Stopwatch '${id}' stopped at ${this.formatTime(finalTime)}`);
            return finalTime;
        }
        return null;
    }
    
    // UTILITY FUNCTIONS
    playAlarmSound() {
        /**
         * Play alarm sound
         */
        try {
            const audio = new Audio('/static/audio/alarm.mp3');
            audio.volume = 0.8;
            audio.loop = true;
            audio.play();
            
            // Stop after 30 seconds if not dismissed
            setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
            }, 30000);
        } catch (error) {
            console.warn('Could not play alarm sound:', error);
        }
    }
    
    playTimerSound() {
        /**
         * Play timer completion sound
         */
        try {
            const audio = new Audio('/static/audio/timer.mp3');
            audio.volume = 0.6;
            audio.play();
        } catch (error) {
            console.warn('Could not play timer sound:', error);
        }
    }
    
    formatTime(milliseconds) {
        /**
         * Format milliseconds as HH:MM:SS.sss
         */
        const totalSeconds = Math.floor(milliseconds / 1000);
        const ms = milliseconds % 1000;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
        }
    }
    
    // STATUS FUNCTIONS
    getActiveAlarms() {
        return Array.from(this.activeAlarms.entries()).map(([id, alarm]) => ({
            id,
            time: alarm.time,
            message: alarm.message,
            created: alarm.created
        }));
    }
    
    getActiveTimers() {
        return Array.from(this.activeTimers.entries()).map(([id, timer]) => ({
            id,
            duration: timer.duration,
            remaining: timer.remaining,
            message: timer.message,
            endTime: new Date(timer.endTime)
        }));
    }
    
    getActiveStopwatches() {
        return Array.from(this.activeStopwatches.entries()).map(([id, stopwatch]) => {
            const elapsed = stopwatch.totalElapsed + 
                (stopwatch.isRunning ? Date.now() - stopwatch.startTime : 0);
            
            return {
                id,
                elapsed,
                formattedTime: this.formatTime(elapsed),
                isRunning: stopwatch.isRunning,
                lapTimes: stopwatch.lapTimes
            };
        });
    }
    
    // DEVICE CAPABILITY CHECK
    isFeatureAvailable(feature) {
        /**
         * Check if a feature is available on this device
         */
        const mobileOnlyFeatures = ['alarm', 'timer', 'stopwatch'];
        
        if (mobileOnlyFeatures.includes(feature) && !this.isMobileDevice) {
            return false;
        }
        
        return true;
    }
    
    getCapabilities() {
        /**
         * Get device capabilities
         */
        return {
            deviceType: this.isMobileDevice ? 'mobile' : 'desktop',
            notifications: 'Notification' in window,
            notificationPermission: this.permission,
            alarms: this.isMobileDevice,
            timers: this.isMobileDevice,
            stopwatches: this.isMobileDevice,
            serviceWorker: 'serviceWorker' in navigator,
            vibration: 'vibrate' in navigator
        };
    }
}

// Initialize global notifications system
window.zoboNotifications = new ZoboNotifications();