// Chat application JavaScript
class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.statusBtn = document.getElementById('statusBtn');
        this.wakeWordBtn = document.getElementById('wakeWordBtn');
        this.voiceStatusBtn = document.getElementById('voiceStatusBtn');
        this.voiceRecordBtn = document.getElementById('voiceRecordBtn');
        this.voiceSpeakBtn = document.getElementById('voiceSpeakBtn');
        this.voiceRecordIcon = document.getElementById('voiceRecordIcon');
        this.messagesArea = document.getElementById('messagesArea');
        this.chatContainer = document.getElementById('chatContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.chatForm = document.getElementById('chatForm');
        this.charCount = document.getElementById('charCount');
        this.statusAlert = document.getElementById('statusAlert');
        this.statusMessage = document.getElementById('statusMessage');
        this.attachBtn = document.getElementById('attachBtn');
        this.localFileBtn = document.getElementById('localFileBtn');
        this.addLinkBtn = document.getElementById('addLinkBtn');
        this.fileInput = document.getElementById('fileInput');
        
        this.isLoading = false;
        this.attachedFiles = [];
        this.attachedLinks = [];
        
        // Voice-related properties
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.lastAssistantMessage = '';
        this.voiceApiStatus = null;
        
        // Wake word detection properties
        this.isListeningForWakeWord = false;
        this.wakeWordRecognition = null;
        this.wakeWords = ['hey zobo', 'hi zobo', 'hello zobo', 'zobo'];
        this.wakeWordEnabled = true;
        
        this.initializeEventListeners();
        this.loadConversationHistory();
        this.checkApiStatus();
        this.checkVoiceStatus();
        this.initializeWakeWord();
        this.loadUserInfo();
        this.initializeSettings();
        this.loadUserPreferences();
    }
    
    initializeEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // Clear conversation
        this.clearBtn.addEventListener('click', () => {
            this.clearConversation();
        });
        
        // Check API status
        this.statusBtn.addEventListener('click', () => {
            this.checkApiStatus();
        });
        
        // Message input handling
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResizeTextarea();
        });
        
        // Keyboard shortcuts
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // File attachment handlers
        this.localFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });
        
        this.addLinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAddLinkDialog();
        });
        
        const oneDriveBtn = document.getElementById('oneDriveBtn');
        if (oneDriveBtn) {
            oneDriveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openOneDrivePicker();
            });
        }
        
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        // Voice control handlers
        this.wakeWordBtn.addEventListener('click', () => {
            this.toggleWakeWord();
        });
        
        this.voiceStatusBtn.addEventListener('click', () => {
            this.checkVoiceStatus();
        });
        
        this.voiceRecordBtn.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
        
        this.voiceSpeakBtn.addEventListener('click', () => {
            this.speakLastMessage();
        });
        
        // Auto-focus on message input
        this.messageInput.focus();
        
        // Check for calendar connection status
        this.checkCalendarStatus();
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isLoading) {
            return;
        }
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and show loading
        this.messageInput.value = '';
        this.updateCharCount();
        this.autoResizeTextarea();
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage(data.response, 'assistant');
                this.lastAssistantMessage = data.response; // Store for voice functionality
                this.hideStatusAlert();
                
                // Check for auto-extracted user data and sync with profile settings
                this.checkForProfileUpdates(message);
            } else {
                console.error('Server error:', response.status, data);
                this.addMessage(`Error: ${data.error || 'Server error'}`, 'error');
                this.showStatusAlert('error', data.error || 'Server error');
            }
        } catch (error) {
            console.error('Network error:', error);
            this.addMessage('Error: Network error. Please check your connection and try again.', 'error');
            this.showStatusAlert('error', 'Network error occurred');
        } finally {
            this.setLoading(false);
            this.messageInput.focus();
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${type}-message mb-3`;
        
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="d-flex align-items-start flex-row-reverse">
                    <div class="avatar bg-primary rounded-circle ms-3 d-flex align-items-center justify-content-center">
                        <i class="fas fa-user text-white"></i>
                    </div>
                    <div class="message-content text-end">
                        <div class="message-header mb-1">
                            <small class="text-muted me-2">${currentTime}</small>
                            <strong>You</strong>
                        </div>
                        <div class="message-text">
                            ${this.formatMessage(content)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            const iconClass = type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-robot';
            const name = type === 'error' ? 'System' : 'Zobo';
            
            messageDiv.innerHTML = `
                <div class="d-flex align-items-start">
                    <div class="avatar bg-info rounded-circle me-3 d-flex align-items-center justify-content-center">
                        <i class="${iconClass} text-white"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-header mb-1">
                            <strong>${name}</strong>
                            <small class="text-muted ms-2">${currentTime}</small>
                        </div>
                        <div class="message-text">
                            ${this.formatMessage(content)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(content) {
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // First escape HTML
        let formatted = escapeHtml(content);
        
        // Then apply formatting for code blocks and line breaks
        return formatted
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        this.sendBtn.disabled = loading;
        this.messageInput.disabled = loading;
        
        if (loading) {
            this.loadingIndicator.classList.remove('d-none');
            this.scrollToBottom();
        } else {
            this.loadingIndicator.classList.add('d-none');
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 1800) {
            this.charCount.parentElement.classList.add('text-warning');
        } else if (count >= 2000) {
            this.charCount.parentElement.classList.add('text-danger');
            this.charCount.parentElement.classList.remove('text-warning');
        } else {
            this.charCount.parentElement.classList.remove('text-warning', 'text-danger');
        }
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    async clearConversation() {
        if (!confirm('Are you sure you want to clear the conversation history?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                // Clear messages except welcome message
                const welcomeMessage = this.messagesArea.firstElementChild;
                this.messagesArea.innerHTML = '';
                this.messagesArea.appendChild(welcomeMessage);
                
                this.showStatusAlert('success', 'Conversation cleared successfully');
            } else {
                const data = await response.json();
                this.showStatusAlert('error', `Failed to clear conversation: ${data.error}`);
            }
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.showStatusAlert('error', 'Network error occurred while clearing conversation');
        }
    }
    
    async loadConversationHistory() {
        try {
            const response = await fetch('/api/conversation');
            const data = await response.json();
            
            if (response.ok && data.conversation && data.conversation.length > 0) {
                // Load existing conversation
                data.conversation.forEach(message => {
                    if (message.role === 'user') {
                        this.addMessage(message.content, 'user');
                    } else if (message.role === 'assistant') {
                        this.addMessage(message.content, 'assistant');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }
    
    async checkApiStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.showStatusAlert('success', `API is working properly. Model: ${data.model || 'Zobo'}`);
            } else {
                this.showStatusAlert('warning', data.message);
            }
        } catch (error) {
            console.error('Error checking API status:', error);
            this.showStatusAlert('error', 'Failed to check API status');
        }
    }
    
    showStatusAlert(type, message) {
        const alertTypes = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };
        
        this.statusAlert.className = `alert ${alertTypes[type]} alert-dismissible fade show`;
        this.statusMessage.textContent = message;
        this.statusAlert.classList.remove('d-none');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideStatusAlert();
            }, 3000);
        }
    }
    
    hideStatusAlert() {
        this.statusAlert.classList.add('d-none');
    }
    
    showAddLinkDialog() {
        const url = prompt('Enter a URL or link:');
        if (url && url.trim()) {
            const trimmedUrl = url.trim();
            
            // Basic URL validation
            if (!this.isValidUrl(trimmedUrl)) {
                this.showStatusAlert('warning', 'Please enter a valid URL (e.g., https://example.com)');
                return;
            }
            
            this.attachedLinks.push({
                url: trimmedUrl,
                title: this.getUrlTitle(trimmedUrl)
            });
            
            this.displayAttachedItems();
            this.showStatusAlert('success', 'Link added successfully!');
        }
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Try adding https:// if no protocol
            try {
                new URL('https://' + string);
                return true;
            } catch (_) {
                return false;
            }
        }
    }
    
    getUrlTitle(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
            return urlObj.hostname;
        } catch (_) {
            return url;
        }
    }
    
    handleFileSelection(files) {
        if (files.length === 0) return;
        
        // Upload files to connect them to Zobo instead of adding to chat
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showStatusAlert('warning', `File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }
            
            // Upload and connect file to Zobo
            this.uploadFileToZobo(file);
        });
    }
    
    async uploadFileToZobo(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Show upload progress
        this.showStatusAlert('info', `Connecting "${file.name}" to Zobo...`);
        
        try {
            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showStatusAlert('success', `"${file.name}" is now connected to Zobo! You can reference it in conversations.`);
                
                // Add a system message to show file connection
                this.addMessage(`📎 Connected file: ${file.name} (${this.formatFileSize(file.size)}) - Zobo can now access this file`, 'assistant');
            } else {
                this.showStatusAlert('error', `Failed to connect "${file.name}": ${data.error}`);
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.showStatusAlert('error', `Failed to connect "${file.name}": Network error`);
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    displayAttachedItems() {
        // Create or update display area
        let itemDisplay = document.getElementById('attachedItemsDisplay');
        if (!itemDisplay) {
            itemDisplay = document.createElement('div');
            itemDisplay.id = 'attachedItemsDisplay';
            itemDisplay.className = 'attached-files-display mb-2';
            this.messageInput.parentElement.parentElement.insertBefore(itemDisplay, this.messageInput.parentElement);
        }
        
        itemDisplay.innerHTML = '';
        
        // Display files
        this.attachedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'attached-file-item d-inline-flex align-items-center bg-secondary rounded px-2 py-1 me-2 mb-1';
            fileItem.innerHTML = `
                <i class="fas fa-file me-2"></i>
                <span class="file-name">${file.name}</span>
                <button type="button" class="btn-close btn-close-white ms-2" data-type="file" data-index="${index}" title="Remove file"></button>
            `;
            
            itemDisplay.appendChild(fileItem);
        });
        
        // Display links
        this.attachedLinks.forEach((link, index) => {
            const linkItem = document.createElement('div');
            linkItem.className = 'attached-file-item d-inline-flex align-items-center bg-info rounded px-2 py-1 me-2 mb-1';
            linkItem.innerHTML = `
                <i class="fas fa-link me-2"></i>
                <span class="file-name" title="${link.url}">${link.title}</span>
                <button type="button" class="btn-close btn-close-white ms-2" data-type="link" data-index="${index}" title="Remove link"></button>
            `;
            
            itemDisplay.appendChild(linkItem);
        });
        
        // Add remove handlers
        itemDisplay.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeAttachedItem(type, index);
            });
        });
        
        const totalItems = this.attachedFiles.length + this.attachedLinks.length;
        if (totalItems > 0) {
            this.showStatusAlert('success', `${totalItems} item(s) attached. Note: Attachment functionality is prepared but not yet connected to the AI.`);
        }
    }
    
    removeAttachedItem(type, index) {
        if (type === 'file') {
            this.attachedFiles.splice(index, 1);
        } else if (type === 'link') {
            this.attachedLinks.splice(index, 1);
        }
        
        if (this.attachedFiles.length === 0 && this.attachedLinks.length === 0) {
            const itemDisplay = document.getElementById('attachedItemsDisplay');
            if (itemDisplay) {
                itemDisplay.remove();
            }
        } else {
            this.displayAttachedItems();
        }
    }
    
    openOneDrivePicker() {
        // OneDrive file picker integration
        try {
            // Check if OneDrive API is available
            if (typeof OneDrive !== 'undefined') {
                const odOptions = {
                    clientId: "your-app-id", // This would need to be configured
                    action: "download",
                    multiSelect: true,
                    openInNewWindow: true,
                    advanced: {
                        filter: "folder,.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    },
                    success: (files) => {
                        this.handleOneDriveFiles(files);
                    },
                    cancel: () => {
                        console.log('OneDrive picker cancelled');
                    },
                    error: (error) => {
                        console.error('OneDrive picker error:', error);
                        this.showStatusAlert('error', 'Error accessing OneDrive: ' + error.message);
                    }
                };
                
                OneDrive.open(odOptions);
            } else {
                // Fallback: Show instructions for OneDrive setup
                this.showOneDriveSetupDialog();
            }
        } catch (error) {
            console.error('OneDrive integration error:', error);
            this.showOneDriveSetupDialog();
        }
    }
    
    showOneDriveSetupDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content bg-dark">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fab fa-microsoft me-2"></i>OneDrive Integration
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>OneDrive integration is available! Here's how to use it:</p>
                        
                        <h6>Option 1: Share OneDrive Link</h6>
                        <ol>
                            <li>Go to your OneDrive and find the file</li>
                            <li>Right-click and select "Share"</li>
                            <li>Copy the sharing link</li>
                            <li>Use the "Add Link" option to paste it</li>
                        </ol>
                        
                        <h6>Option 2: Download and Upload</h6>
                        <ol>
                            <li>Download the file from OneDrive to your computer</li>
                            <li>Use the "Upload File" option to attach it</li>
                        </ol>
                        
                        <div class="alert alert-info mt-3">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Coming Soon:</strong> Direct OneDrive file picker integration for seamless file access!
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="document.getElementById('addLinkBtn').click()" data-bs-dismiss="modal">
                            <i class="fas fa-link me-2"></i>Add OneDrive Link
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Clean up modal after hiding
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    handleOneDriveFiles(files) {
        // Handle files selected from OneDrive
        files.value.forEach(file => {
            const linkItem = {
                type: 'onedrive',
                name: file.name,
                url: file['@microsoft.graph.downloadUrl'] || file.webUrl,
                size: file.size || 'Unknown size',
                icon: this.getFileIcon(file.name)
            };
            
            this.attachedLinks.push(linkItem);
        });
        
        this.displayAttachedItems();
        this.showStatusAlert('success', `Added ${files.value.length} file(s) from OneDrive`);
    }

    // Calendar integration functions
    async checkCalendarStatus() {
        try {
            const response = await fetch('/api/calendar/events?days=1');
            if (response.ok) {
                this.calendarConnected = true;
            } else {
                this.calendarConnected = false;
            }
        } catch (error) {
            this.calendarConnected = false;
        }
    }
    
    async scheduleEvent(summary, startTime, endTime, description = '', location = '') {
        try {
            const response = await fetch('/api/calendar/confirm-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: summary,
                    start_time: startTime,
                    end_time: endTime,
                    description: description,
                    location: location
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showStatusAlert('success', `Event "${summary}" scheduled successfully!`);
                return data.event;
            } else {
                this.showStatusAlert('error', `Failed to schedule event: ${data.error}`);
                return null;
            }
        } catch (error) {
            console.error('Error scheduling event:', error);
            this.showStatusAlert('error', 'Network error while scheduling event');
            return null;
        }
    }
    
    async getFreeTimeSlots(durationMinutes = 60, days = 7) {
        try {
            const response = await fetch(`/api/calendar/free-slots?duration=${durationMinutes}&days=${days}`);
            const data = await response.json();
            
            if (response.ok) {
                return data.free_slots;
            } else {
                console.error('Error getting free slots:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching free slots:', error);
            return [];
        }
    }
    
    async getCalendarEvents(days = 7) {
        try {
            const response = await fetch(`/api/calendar/events?days=${days}`);
            const data = await response.json();
            
            if (response.ok) {
                return data.events;
            } else {
                console.error('Error getting calendar events:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            return [];
        }
    }
}

// Make calendar functions globally accessible for Zobo to use
window.ZoboCalendar = {
    scheduleEvent: async (summary, startTime, endTime, description = '', location = '') => {
        const app = document.chatApp;
        if (app) {
            return await app.scheduleEvent(summary, startTime, endTime, description, location);
        }
        return null;
    },
    
    getFreeSlots: async (durationMinutes = 60, days = 7) => {
        const app = document.chatApp;
        if (app) {
            return await app.getFreeTimeSlots(durationMinutes, days);
        }
        return [];
    },
    
    getEvents: async (days = 7) => {
        const app = document.chatApp;
        if (app) {
            return await app.getCalendarEvents(days);
        }
        return [];
    }
};

// Move this back into the ChatApp class
ChatApp.prototype.loadUserInfo = async function() {
        try {
            const response = await fetch('/api/auth/user');
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                // Store user data for guest detection
                this.currentUser = data.user;
                
                const userDropdown = document.getElementById('userDropdown');
                const userName = document.getElementById('userName');
                const userEmail = document.getElementById('userEmail');
                const userAvatar = document.getElementById('userAvatar');
                
                if (userDropdown && userName && userEmail) {
                    userName.textContent = data.user.name || 'User';
                    userEmail.textContent = data.user.email || '';
                    
                    if (data.user.picture && userAvatar) {
                        userAvatar.src = data.user.picture;
                        userAvatar.style.display = 'inline';
                    }
                    
                    userDropdown.style.display = 'block';
                }
                
                // Show guest warning if user is a guest
                if (this.isGuestUser()) {
                    this.showGuestWarning();
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
};

// User data management methods
ChatApp.prototype.getUserData = async function() {
    try {
        const response = await fetch('/api/user-data');
        const data = await response.json();
        return data.user_data || {};
    } catch (error) {
        console.error('Error getting user data:', error);
        return {};
    }
};

ChatApp.prototype.updateUserData = async function(userData) {
    try {
        const response = await fetch('/api/user-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (response.ok) {
            this.showStatusAlert('success', data.message);
            return data.user_data;
        } else {
            this.showStatusAlert('error', `Failed to update user data: ${data.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error updating user data:', error);
        this.showStatusAlert('error', 'Network error while updating user data');
        return null;
    }
};

ChatApp.prototype.deleteUserDataField = async function(field) {
    try {
        const response = await fetch(`/api/user-data/${field}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            this.showStatusAlert('success', data.message);
            return true;
        } else {
            this.showStatusAlert('error', `Failed to delete ${field}: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting user data field:', error);
        this.showStatusAlert('error', `Network error while deleting ${field}`);
        return false;
    }
};

ChatApp.prototype.initializeSettings = function() {
        // Settings modal event listeners
        const settingsModal = document.getElementById('settingsModal');
        const switchAccountBtn = document.getElementById('switchAccountBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const themeSelect = document.getElementById('themeSelect');
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        const compactModeToggle = document.getElementById('compactModeToggle');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        // Load settings when modal opens
        if (settingsModal) {
            settingsModal.addEventListener('show.bs.modal', () => {
                this.loadSettingsData();
            });
        }
        
        // Account management
        if (switchAccountBtn) {
            switchAccountBtn.addEventListener('click', () => {
                this.switchAccount();
            });
        }
        
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                this.signOut();
            });
        }
        
        // Theme changes
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }
        
        // Font size changes
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.changeFontSize(e.target.value);
            });
        }
        
        // Compact mode toggle
        if (compactModeToggle) {
            compactModeToggle.addEventListener('change', (e) => {
                this.toggleCompactMode(e.target.checked);
            });
        }
        
        // Save settings
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveAllSettings();
            });
        }
        
        // Connect app buttons
        const connectMicrosoft = document.getElementById('connectMicrosoft');
        const connectApple = document.getElementById('connectApple');
        const manageGoogleCalendar = document.getElementById('manageGoogleCalendar');
        
        if (connectMicrosoft) {
            connectMicrosoft.addEventListener('click', () => {
                this.connectApp('microsoft');
            });
        }
        
        if (connectApple) {
            connectApple.addEventListener('click', () => {
                this.connectApp('apple');
            });
        }
        
        if (manageGoogleCalendar) {
            manageGoogleCalendar.addEventListener('click', () => {
                this.manageApp('google');
            });
        }
        
        // Data management
        const clearAllDataBtn = document.getElementById('clearAllDataBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');
        
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Load saved settings
        this.loadSavedSettings();
        
        // Profile management
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const loadProfileBtn = document.getElementById('loadProfileBtn');
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveUserProfile();
            });
        }
        
        if (loadProfileBtn) {
            loadProfileBtn.addEventListener('click', () => {
                this.loadUserProfile();
            });
        }
        
        // Load profile when settings modal opens
        this.loadUserProfile();
};

ChatApp.prototype.loadSettingsData = async function() {
        try {
            // Load user info into settings modal
            const response = await fetch('/api/auth/user');
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                const settingsUserName = document.getElementById('settingsUserName');
                const settingsUserEmail = document.getElementById('settingsUserEmail');
                const settingsUserProvider = document.getElementById('settingsUserProvider');
                const settingsUserAvatar = document.getElementById('settingsUserAvatar');
                
                if (settingsUserName) settingsUserName.textContent = data.user.name || 'User';
                if (settingsUserEmail) {
                    settingsUserEmail.textContent = data.user.email || (data.user.provider === 'guest' ? 'Guest User - No Email' : '');
                }
                if (settingsUserProvider) settingsUserProvider.textContent = data.user.provider || 'Unknown';
                
                if (data.user.picture && settingsUserAvatar) {
                    settingsUserAvatar.src = data.user.picture;
                    settingsUserAvatar.style.display = 'inline';
                }
                
                // Disable connect buttons for guest users
                if (data.user.provider === 'guest') {
                    this.disableConnectButtons();
                }
            }
            
            // Check app connection statuses
            this.updateAppStatuses();
            
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
};

ChatApp.prototype.updateAppStatuses = async function() {
        // Check Google Calendar status
        try {
            const response = await fetch('/api/calendar/events?days=1');
            const googleCalendarStatus = document.getElementById('googleCalendarStatus');
            if (googleCalendarStatus) {
                if (response.ok) {
                    googleCalendarStatus.textContent = 'Connected';
                    googleCalendarStatus.className = 'badge bg-success me-2';
                } else {
                    googleCalendarStatus.textContent = 'Not Connected';
                    googleCalendarStatus.className = 'badge bg-secondary me-2';
                }
            }
        } catch (error) {
            const googleCalendarStatus = document.getElementById('googleCalendarStatus');
            if (googleCalendarStatus) {
                googleCalendarStatus.textContent = 'Error';
                googleCalendarStatus.className = 'badge bg-danger me-2';
            }
        }
        
        // Microsoft and Apple status would be checked similarly
        // For now, they remain "Not Connected" as placeholders
};

ChatApp.prototype.switchAccount = function() {
        if (confirm('Do you want to sign out and switch to a different account?')) {
            window.location.href = '/logout';
        }
};

ChatApp.prototype.signOut = function() {
        if (confirm('Are you sure you want to sign out?')) {
            window.location.href = '/logout';
        }
};

ChatApp.prototype.changeTheme = function(theme) {
        const html = document.documentElement;
        
        switch (theme) {
            case 'light':
                html.setAttribute('data-bs-theme', 'light');
                break;
            case 'auto':
                // Detect system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    html.setAttribute('data-bs-theme', 'dark');
                } else {
                    html.setAttribute('data-bs-theme', 'light');
                }
                break;
            case 'blue':
                html.setAttribute('data-bs-theme', 'dark');
                html.style.setProperty('--bs-primary', '#0066cc');
                html.style.setProperty('--bs-info', '#0066cc');
                break;
            case 'purple':
                html.setAttribute('data-bs-theme', 'dark');
                html.style.setProperty('--bs-primary', '#6f42c1');
                html.style.setProperty('--bs-info', '#6f42c1');
                break;
            default: // dark
                html.setAttribute('data-bs-theme', 'dark');
                html.style.removeProperty('--bs-primary');
                html.style.removeProperty('--bs-info');
                break;
        }
        
        // Save preference
        localStorage.setItem('zobo-theme', theme);
};

ChatApp.prototype.changeFontSize = function(size) {
        const body = document.body;
        
        // Remove existing font size classes
        body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
        
        // Add new font size class
        body.classList.add(`font-${size}`);
        
        // Save preference
        localStorage.setItem('zobo-font-size', size);
};

ChatApp.prototype.toggleCompactMode = function(enabled) {
        const body = document.body;
        
        if (enabled) {
            body.classList.add('compact-mode');
        } else {
            body.classList.remove('compact-mode');
        }
        
        // Save preference
        localStorage.setItem('zobo-compact-mode', enabled.toString());
};

ChatApp.prototype.loadSavedSettings = function() {
        // Load saved theme
        const savedTheme = localStorage.getItem('zobo-theme') || 'dark';
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = savedTheme;
            this.changeTheme(savedTheme);
        }
        
        // Load saved font size
        const savedFontSize = localStorage.getItem('zobo-font-size') || 'medium';
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        if (fontSizeSelect) {
            fontSizeSelect.value = savedFontSize;
            this.changeFontSize(savedFontSize);
        }
        
        // Load saved compact mode
        const savedCompactMode = localStorage.getItem('zobo-compact-mode') === 'true';
        const compactModeToggle = document.getElementById('compactModeToggle');
        if (compactModeToggle) {
            compactModeToggle.checked = savedCompactMode;
            this.toggleCompactMode(savedCompactMode);
        }
};

ChatApp.prototype.saveSettings = function() {
        // Settings are saved automatically as they change
        this.showStatusAlert('success', 'Settings saved successfully!');
        
        // Close modal
        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (settingsModal) {
            settingsModal.hide();
        }
};

ChatApp.prototype.connectApp = function(provider) {
        // Check if user is a guest
        if (this.isGuestUser()) {
            this.showGuestRestrictionWarning();
            return;
        }
        
        switch (provider) {
            case 'microsoft':
                if (confirm('This will redirect you to Microsoft to connect your account. Continue?')) {
                    window.location.href = '/auth/microsoft';
                }
                break;
            case 'apple':
                if (confirm('This will redirect you to Apple to connect your account. Continue?')) {
                    window.location.href = '/auth/apple';
                }
                break;
            default:
                this.showStatusAlert('info', `${provider} connection coming soon!`);
                break;
        }
};

ChatApp.prototype.manageApp = function(provider) {
        // Check if user is a guest
        if (this.isGuestUser()) {
            this.showGuestRestrictionWarning();
            return;
        }
        
        switch (provider) {
            case 'google':
                this.showStatusAlert('info', 'Google Calendar is connected and working. You can disconnect by signing out and signing back in with a different account.');
                break;
            default:
                this.showStatusAlert('info', `${provider} management coming soon!`);
                break;
        }
};

ChatApp.prototype.clearAllData = async function() {
        if (!confirm('This will delete all your conversation history, settings, and connected files. This action cannot be undone. Are you sure?')) {
            return;
        }
        
        if (!confirm('Are you absolutely sure? This will permanently delete all your data.')) {
            return;
        }
        
        try {
            // Clear conversation
            await fetch('/api/clear', { method: 'POST' });
            
            // Clear local storage
            localStorage.clear();
            
            // Clear session storage
            sessionStorage.clear();
            
            // Reload page
            this.showStatusAlert('success', 'All data cleared successfully. Page will reload.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showStatusAlert('error', 'Error clearing some data. Please try again.');
        }
};

ChatApp.prototype.exportData = async function() {
        try {
            // Get conversation history
            const conversationResponse = await fetch('/api/conversation');
            const conversationData = await conversationResponse.json();
            
            // Get user data
            const userResponse = await fetch('/api/auth/user');
            const userData = await userResponse.json();
            
            // Get connected files
            const filesResponse = await fetch('/api/connected-files');
            const filesData = await filesResponse.json();
            
            // Compile export data
            const exportData = {
                export_date: new Date().toISOString(),
                user: userData.user,
                conversation_history: conversationData.conversation || [],
                connected_files: filesData.connected_files || [],
                settings: {
                    theme: localStorage.getItem('zobo-theme'),
                    font_size: localStorage.getItem('zobo-font-size'),
                    compact_mode: localStorage.getItem('zobo-compact-mode')
                }
            };
            
            // Create download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zobo-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatusAlert('success', 'Data exported successfully!');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatusAlert('error', 'Error exporting data. Please try again.');
        }
};

// User profile management methods
ChatApp.prototype.saveUserProfile = async function() {
    try {
        const profileName = document.getElementById('profileName')?.value.trim();
        const profileAge = document.getElementById('profileAge')?.value;
        const profileSchool = document.getElementById('profileSchool')?.value.trim();
        const profileGrade = document.getElementById('profileGrade')?.value.trim();
        
        const profileData = {};
        if (profileName) profileData.name = profileName;
        if (profileAge) profileData.age = parseInt(profileAge);
        if (profileSchool) profileData.school = profileSchool;
        if (profileGrade) profileData.grade = profileGrade;
        
        if (Object.keys(profileData).length === 0) {
            this.showStatusAlert('warning', 'Please enter at least one profile field to save.');
            return;
        }
        
        const result = await this.updateUserData(profileData);
        if (result) {
            const profileStatus = document.getElementById('profileStatus');
            if (profileStatus) {
                const savedFields = Object.keys(profileData);
                profileStatus.textContent = `Saved: ${savedFields.join(', ')} • Last updated: ${new Date().toLocaleString()}`;
                profileStatus.className = 'small text-success';
            }
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        this.showStatusAlert('error', 'Failed to save profile');
    }
};

ChatApp.prototype.loadUserProfile = async function() {
    try {
        const userData = await this.getUserData();
        
        // Update form fields
        const profileName = document.getElementById('profileName');
        const profileAge = document.getElementById('profileAge');
        const profileSchool = document.getElementById('profileSchool');
        const profileGrade = document.getElementById('profileGrade');
        const profileStatus = document.getElementById('profileStatus');
        
        if (profileName) profileName.value = userData.name || '';
        if (profileAge) profileAge.value = userData.age || '';
        if (profileSchool) profileSchool.value = userData.school || '';
        if (profileGrade) profileGrade.value = userData.grade || '';
        
        if (profileStatus) {
            if (Object.keys(userData).length > 0) {
                const lastUpdated = userData.last_updated ? new Date(userData.last_updated).toLocaleString() : 'Unknown';
                profileStatus.textContent = `Profile loaded • Last updated: ${lastUpdated}`;
                profileStatus.className = 'small text-info';
            } else {
                profileStatus.textContent = 'No profile data found. Tell Zobo about yourself to get started!';
                profileStatus.className = 'small text-muted';
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        const profileStatus = document.getElementById('profileStatus');
        if (profileStatus) {
            profileStatus.textContent = 'Error loading profile data';
            profileStatus.className = 'small text-danger';
        }
    }
};

// Wake Word Detection Methods
ChatApp.prototype.initializeWakeWord = function() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        this.wakeWordBtn.disabled = true;
        this.wakeWordBtn.title = 'Speech recognition not supported';
        return;
    }
    
    // Initialize speech recognition for wake word
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.wakeWordRecognition = new SpeechRecognition();
    
    this.wakeWordRecognition.continuous = true;
    this.wakeWordRecognition.interimResults = true;
    this.wakeWordRecognition.lang = 'en-US';
    
    this.wakeWordRecognition.onstart = () => {
        console.log('Wake word detection started');
        this.isListeningForWakeWord = true;
        this.updateWakeWordButton();
    };
    
    this.wakeWordRecognition.onend = () => {
        console.log('Wake word detection ended');
        this.isListeningForWakeWord = false;
        this.updateWakeWordButton();
        
        // Restart if wake word is still enabled
        if (this.wakeWordEnabled) {
            setTimeout(() => {
                this.startWakeWordDetection();
            }, 1000);
        }
    };
    
    this.wakeWordRecognition.onerror = (event) => {
        console.error('Wake word recognition error:', event.error);
        if (event.error === 'not-allowed') {
            this.showStatusAlert('error', 'Microphone permission denied. Please allow microphone access for wake word detection.');
            this.wakeWordEnabled = false;
            this.updateWakeWordButton();
        }
    };
    
    this.wakeWordRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Check for wake words in both interim and final results
        const allTranscript = (finalTranscript + ' ' + interimTranscript).toLowerCase();
        
        for (const wakeWord of this.wakeWords) {
            if (allTranscript.includes(wakeWord)) {
                console.log('Wake word detected:', wakeWord);
                this.onWakeWordDetected(allTranscript, wakeWord);
                break;
            }
        }
    };
    
    // Start wake word detection by default
    if (this.wakeWordEnabled) {
        this.startWakeWordDetection();
    }
};

ChatApp.prototype.toggleWakeWord = function() {
    this.wakeWordEnabled = !this.wakeWordEnabled;
    
    if (this.wakeWordEnabled) {
        this.startWakeWordDetection();
        this.showStatusAlert('success', 'Hey Zobo wake word detection enabled');
    } else {
        this.stopWakeWordDetection();
        this.showStatusAlert('info', 'Hey Zobo wake word detection disabled');
    }
    
    this.updateWakeWordButton();
};

ChatApp.prototype.startWakeWordDetection = function() {
    if (!this.wakeWordRecognition || this.isListeningForWakeWord) {
        return;
    }
    
    try {
        this.wakeWordRecognition.start();
    } catch (error) {
        console.error('Error starting wake word detection:', error);
    }
};

ChatApp.prototype.stopWakeWordDetection = function() {
    if (this.wakeWordRecognition && this.isListeningForWakeWord) {
        try {
            this.wakeWordRecognition.stop();
        } catch (error) {
            console.error('Error stopping wake word detection:', error);
        }
    }
};

ChatApp.prototype.updateWakeWordButton = function() {
    if (!this.wakeWordBtn) return;
    
    if (this.wakeWordEnabled && this.isListeningForWakeWord) {
        this.wakeWordBtn.className = 'btn btn-success btn-sm';
        this.wakeWordBtn.title = 'Hey Zobo listening (click to disable)';
        this.wakeWordBtn.innerHTML = '<i class="fas fa-ear-listen"></i>';
    } else if (this.wakeWordEnabled) {
        this.wakeWordBtn.className = 'btn btn-warning btn-sm';
        this.wakeWordBtn.title = 'Hey Zobo starting up (click to disable)';
        this.wakeWordBtn.innerHTML = '<i class="fas fa-ear-listen"></i>';
    } else {
        this.wakeWordBtn.className = 'btn btn-outline-secondary btn-sm';
        this.wakeWordBtn.title = 'Hey Zobo disabled (click to enable)';
        this.wakeWordBtn.innerHTML = '<i class="fas fa-ear-deaf"></i>';
    }
};

ChatApp.prototype.onWakeWordDetected = function(fullTranscript, wakeWord) {
    // Show visual feedback
    this.showStatusAlert('info', `"${wakeWord}" detected! Listening...`, 2000);
    
    // Add wake word visual indicator
    this.wakeWordBtn.style.animation = 'pulse 1s infinite';
    setTimeout(() => {
        this.wakeWordBtn.style.animation = '';
    }, 3000);
    
    // Extract potential command after wake word
    const wakeWordIndex = fullTranscript.indexOf(wakeWord);
    const commandText = fullTranscript.substring(wakeWordIndex + wakeWord.length).trim();
    
    if (commandText.length > 0) {
        // If there's a command after the wake word, process it
        this.messageInput.value = commandText;
        this.updateCharCount();
        this.autoResizeTextarea();
        
        // Auto-send the message after a short delay
        setTimeout(() => {
            this.sendMessage();
        }, 500);
        
        this.showStatusAlert('success', `Processing: "${commandText}"`, 3000);
    } else {
        // Just wake word detected, start recording for full command
        this.showStatusAlert('info', 'Say your message now...', 3000);
        
        // Start recording after a brief delay
        setTimeout(() => {
            this.toggleVoiceRecording();
        }, 1000);
    }
    
    // Play a subtle notification sound (optional)
    this.playWakeWordSound();
};

ChatApp.prototype.playWakeWordSound = function() {
    try {
        // Create a subtle beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Could not play wake word sound:', error);
    }
};

// Voice functionality methods
ChatApp.prototype.checkVoiceStatus = async function() {
    try {
        const response = await fetch('/api/voice/status');
        const data = await response.json();
        this.voiceApiStatus = data;
        
        // Update voice status button appearance
        if (data.configured) {
            this.voiceStatusBtn.className = 'btn btn-success btn-sm';
            this.voiceStatusBtn.title = 'Voice API is ready';
            this.voiceRecordBtn.disabled = false;
            this.voiceSpeakBtn.disabled = false;
        } else {
            this.voiceStatusBtn.className = 'btn btn-warning btn-sm';
            this.voiceStatusBtn.title = 'Voice API not configured';
            this.voiceRecordBtn.disabled = true;
            this.voiceSpeakBtn.disabled = true;
        }
        
        // Show status if clicked
        if (data.configured) {
            this.showStatusAlert('success', `Voice API is ready! Model: ${data.model}`);
        } else {
            this.showStatusAlert('warning', data.message || 'Voice API not configured');
        }
    } catch (error) {
        console.error('Error checking voice status:', error);
        this.voiceStatusBtn.className = 'btn btn-danger btn-sm';
        this.voiceStatusBtn.title = 'Voice API error';
        this.voiceRecordBtn.disabled = true;
        this.voiceSpeakBtn.disabled = true;
        this.showStatusAlert('error', 'Failed to check voice status');
    }
};

ChatApp.prototype.toggleVoiceRecording = async function() {
    if (this.isRecording) {
        this.stopRecording();
    } else {
        await this.startRecording();
    }
};

ChatApp.prototype.startRecording = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };
        
        this.mediaRecorder.onstop = () => {
            this.processRecording();
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        
        // Update UI
        this.voiceRecordIcon.className = 'fas fa-stop';
        this.voiceRecordBtn.className = 'btn btn-danger';
        this.voiceRecordBtn.title = 'Stop recording';
        
        this.showStatusAlert('info', 'Recording... Click again to stop');
    } catch (error) {
        console.error('Error starting recording:', error);
        this.showStatusAlert('error', 'Failed to start recording. Please check microphone permissions.');
    }
};

ChatApp.prototype.stopRecording = function() {
    if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        // Stop all audio tracks
        if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        this.voiceRecordIcon.className = 'fas fa-microphone';
        this.voiceRecordBtn.className = 'btn btn-outline-secondary';
        this.voiceRecordBtn.title = 'Record voice message';
        
        this.showStatusAlert('info', 'Processing voice message...');
    }
};

ChatApp.prototype.processRecording = async function() {
    try {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        
        const response = await fetch('/api/voice/live-conversation', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.audio) {
                // Play the audio response
                this.playAudioResponse(data.audio);
                this.showStatusAlert('success', 'Voice message processed successfully');
            } else {
                this.showStatusAlert('success', data.message || 'Voice processed');
            }
        } else {
            this.showStatusAlert('error', data.message || 'Failed to process voice message');
            if (data.fallback) {
                this.showStatusAlert('info', 'Please use text chat instead');
            }
        }
    } catch (error) {
        console.error('Error processing recording:', error);
        this.showStatusAlert('error', 'Failed to process voice message');
    }
};

ChatApp.prototype.speakLastMessage = async function() {
    if (!this.lastAssistantMessage) {
        this.showStatusAlert('warning', 'No message to speak');
        return;
    }
    
    try {
        this.voiceSpeakBtn.disabled = true;
        this.voiceSpeakBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch('/api/voice/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: this.lastAssistantMessage
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.audio) {
            this.playAudioResponse(data.audio);
            this.showStatusAlert('success', 'Speaking message...');
        } else {
            this.showStatusAlert('info', data.message || 'Text-to-speech not available');
        }
    } catch (error) {
        console.error('Error with text-to-speech:', error);
        this.showStatusAlert('error', 'Failed to speak message');
    } finally {
        this.voiceSpeakBtn.disabled = false;
        this.voiceSpeakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
};

ChatApp.prototype.playAudioResponse = function(audioBase64) {
    try {
        const audioData = atob(audioBase64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.play().then(() => {
            // Audio is playing
        }).catch((error) => {
            console.error('Error playing audio:', error);
            this.showStatusAlert('error', 'Failed to play audio response');
        });
        
        // Clean up URL after audio finishes
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
        });
    } catch (error) {
        console.error('Error creating audio from base64:', error);
        this.showStatusAlert('error', 'Failed to play audio response');
    }
};

// Guest user helper functions
ChatApp.prototype.isGuestUser = function() {
    return this.currentUser && this.currentUser.provider === 'guest';
};

ChatApp.prototype.showGuestWarning = function() {
    // Show persistent warning for guest users
    this.showStatusAlert('warning', 'You\'re using Zobo as a guest. App linking and calendar features require signing in with Google. <a href="/login" class="text-white">Sign in now</a>');
};

ChatApp.prototype.showGuestRestrictionWarning = function() {
    // Show warning when guest tries to connect apps
    alert('App linking is not available for guest users. Please sign in with your Google account to connect apps and access calendar features.\n\nClick "Sign in with Google" from the account menu to get started.');
};

ChatApp.prototype.disableConnectButtons = function() {
    // Disable and update connect buttons for guest users
    const connectMicrosoft = document.getElementById('connectMicrosoft');
    const connectApple = document.getElementById('connectApple');
    const manageGoogleCalendar = document.getElementById('manageGoogleCalendar');
    const microsoftStatus = document.getElementById('microsoftStatus');
    const appleStatus = document.getElementById('appleStatus');
    const googleCalendarStatus = document.getElementById('googleCalendarStatus');
    
    if (connectMicrosoft) {
        connectMicrosoft.disabled = true;
        connectMicrosoft.classList.add('disabled');
        connectMicrosoft.innerHTML = '<i class="fas fa-lock"></i> Requires Sign In';
        connectMicrosoft.title = 'Sign in with Google to connect Microsoft 365';
    }
    
    if (connectApple) {
        connectApple.disabled = true;
        connectApple.classList.add('disabled');
        connectApple.innerHTML = '<i class="fas fa-lock"></i> Requires Sign In';
        connectApple.title = 'Sign in with Google to connect Apple iCloud';
    }
    
    if (manageGoogleCalendar) {
        manageGoogleCalendar.disabled = true;
        manageGoogleCalendar.classList.add('disabled');
        manageGoogleCalendar.innerHTML = '<i class="fas fa-lock"></i>';
        manageGoogleCalendar.title = 'Sign in with Google to access calendar features';
    }
    
    if (microsoftStatus) {
        microsoftStatus.textContent = 'Requires Sign In';
        microsoftStatus.className = 'badge bg-secondary me-2';
    }
    
    if (appleStatus) {
        appleStatus.textContent = 'Requires Sign In';
        appleStatus.className = 'badge bg-secondary me-2';
    }
    
    if (googleCalendarStatus) {
        googleCalendarStatus.textContent = 'Requires Sign In';
        googleCalendarStatus.className = 'badge bg-secondary me-2';
    }
};

// Auto-sync profile data from chat conversations
ChatApp.prototype.checkForProfileUpdates = async function(userMessage) {
    try {
        // Wait a bit for the server to process the message and extract user data
        setTimeout(async () => {
            const updatedUserData = await this.getUserData();
            
            // Check if we have new data that should be synced to the settings form
            const profileName = document.getElementById('profileName');
            const profileAge = document.getElementById('profileAge');
            const profileSchool = document.getElementById('profileSchool');
            const profileGrade = document.getElementById('profileGrade');
            const profileStatus = document.getElementById('profileStatus');
            
            let hasUpdates = false;
            
            // Update form fields if new data is available
            if (updatedUserData.name && profileName && (!profileName.value || profileName.value !== updatedUserData.name)) {
                profileName.value = updatedUserData.name;
                hasUpdates = true;
            }
            
            if (updatedUserData.age && profileAge && (!profileAge.value || profileAge.value != updatedUserData.age)) {
                profileAge.value = updatedUserData.age;
                hasUpdates = true;
            }
            
            if (updatedUserData.school && profileSchool && (!profileSchool.value || profileSchool.value !== updatedUserData.school)) {
                profileSchool.value = updatedUserData.school;
                hasUpdates = true;
            }
            
            if (updatedUserData.grade && profileGrade && (!profileGrade.value || profileGrade.value !== updatedUserData.grade)) {
                profileGrade.value = updatedUserData.grade;
                hasUpdates = true;
            }
            
            // Show notification if profile was auto-updated
            if (hasUpdates && profileStatus) {
                profileStatus.textContent = '✨ Profile auto-updated from chat! Data saved automatically.';
                profileStatus.className = 'small text-success';
                
                // Add visual highlight to updated form
                const profileCard = document.querySelector('.modal-body .card:last-child');
                if (profileCard) {
                    profileCard.style.border = '2px solid #28a745';
                    profileCard.style.borderRadius = '8px';
                    
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        profileCard.style.border = '';
                    }, 3000);
                }
                
                // Show a subtle notification in the main chat if settings modal is not open
                const settingsModal = document.getElementById('settingsModal');
                if (!settingsModal || !settingsModal.classList.contains('show')) {
                    this.showStatusAlert('success', '✨ Your profile was automatically updated based on our conversation!', 4000);
                }
            }
        }, 1500); // Wait 1.5 seconds for server processing
        
    } catch (error) {
        console.error('Error checking for profile updates:', error);
    }
};

// Enhanced status alert with custom duration
ChatApp.prototype.showStatusAlert = function(type, message, duration = 5000) {
    const alertElement = document.getElementById('statusAlert');
    const messageElement = document.getElementById('statusMessage');
    
    if (!alertElement || !messageElement) return;
    
    // Remove existing classes
    alertElement.className = 'alert alert-dismissible fade show';
    
    // Add appropriate class based on type
    switch (type) {
        case 'success':
            alertElement.classList.add('alert-success');
            break;
        case 'warning':
            alertElement.classList.add('alert-warning');
            break;
        case 'error':
        case 'danger':
            alertElement.classList.add('alert-danger');
            break;
        default:
            alertElement.classList.add('alert-info');
    }
    
    messageElement.textContent = message;
    alertElement.classList.remove('d-none');
    
    // Auto-hide after specified duration
    if (duration > 0) {
        setTimeout(() => {
            alertElement.classList.add('d-none');
        }, duration);
    }
};

// Load user preferences from database
ChatApp.prototype.loadUserPreferences = async function() {
    try {
        const response = await fetch('/api/user-preferences');
        if (response.ok) {
            const data = await response.json();
            const prefs = data.preferences;
            
            // Apply loaded preferences
            if (prefs.theme) {
                this.changeTheme(prefs.theme);
                const themeSelect = document.getElementById('themeSelect');
                if (themeSelect) themeSelect.value = prefs.theme;
            }
            
            if (prefs.font_size) {
                this.changeFontSize(prefs.font_size);
                const fontSizeSelect = document.getElementById('fontSizeSelect');
                if (fontSizeSelect) fontSizeSelect.value = prefs.font_size;
            }
            
            if (prefs.compact_mode !== undefined) {
                this.toggleCompactMode(prefs.compact_mode);
                const compactModeToggle = document.getElementById('compactModeToggle');
                if (compactModeToggle) compactModeToggle.checked = prefs.compact_mode;
            }
            
            if (prefs.save_conversations !== undefined) {
                const saveConversationsToggle = document.getElementById('saveConversationsToggle');
                if (saveConversationsToggle) saveConversationsToggle.checked = prefs.save_conversations;
            }
            
            if (prefs.share_data !== undefined) {
                const shareDataToggle = document.getElementById('shareDataToggle');
                if (shareDataToggle) shareDataToggle.checked = prefs.share_data;
            }
        }
    } catch (error) {
        console.error('Error loading user preferences:', error);
    }
};

// Save all settings
ChatApp.prototype.saveAllSettings = async function() {
    try {
        // Get all settings values
        const theme = document.getElementById('themeSelect')?.value || 'dark';
        const fontSize = document.getElementById('fontSizeSelect')?.value || 'medium';
        const compactMode = document.getElementById('compactModeToggle')?.checked || false;
        const saveConversations = document.getElementById('saveConversationsToggle')?.checked || true;
        const shareData = document.getElementById('shareDataToggle')?.checked || false;
        
        const preferences = {
            theme,
            font_size: fontSize,
            compact_mode: compactMode,
            save_conversations: saveConversations,
            share_data: shareData
        };
        
        // Save preferences
        const response = await fetch('/api/user-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferences)
        });
        
        if (response.ok) {
            this.showStatusAlert('success', 'Settings saved successfully!');
            
            // Apply theme and font size immediately
            this.changeTheme(theme);
            this.changeFontSize(fontSize);
            this.toggleCompactMode(compactMode);
        } else {
            this.showStatusAlert('error', 'Error saving settings. Please try again.');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        this.showStatusAlert('error', 'Error saving settings. Please try again.');
    }
};

// Enhanced clear all data with database integration
ChatApp.prototype.clearAllData = async function() {
    if (!confirm('⚠️ This will permanently delete ALL your data including profile, conversations, and files. This cannot be undone. Are you sure?')) {
        return;
    }
    
    if (!confirm('This is your final warning. All data will be permanently deleted. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/user-data/clear-all', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            this.showStatusAlert('success', 'All user data cleared successfully. Refreshing page...');
            
            // Clear local display
            this.messagesArea.innerHTML = '';
            
            // Refresh page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            this.showStatusAlert('error', 'Error clearing data. Please try again.');
        }
    } catch (error) {
        console.error('Error clearing data:', error);
        this.showStatusAlert('error', 'Error clearing data. Please try again.');
    }
};

// Enhanced export data with complete database export
ChatApp.prototype.exportData = async function() {
    try {
        const response = await fetch('/api/user-data/export');
        const data = await response.json();
        
        if (response.ok && data.data) {
            const dataStr = JSON.stringify(data.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `zobo-complete-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatusAlert('success', 'Complete user data exported successfully!');
        } else {
            this.showStatusAlert('error', 'Error exporting data. Please try again.');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        this.showStatusAlert('error', 'Error exporting data. Please try again.');
    }
};

// Initialize chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    document.chatApp = app; // Make globally accessible
});
