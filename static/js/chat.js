// Chat application JavaScript
class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.statusBtn = document.getElementById('statusBtn');
        this.oneDriveBtn = document.getElementById('oneDriveBtn');
        

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
        
        this.initializeEventListeners();
        this.loadConversationHistory();
        this.checkApiStatus();
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
        
        this.oneDriveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openOneDrivePicker();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
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
                this.hideStatusAlert();
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
        // Basic formatting for code blocks and line breaks
        return content
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
                this.addMessage(`📎 Connected file: ${file.name} (${this.formatFileSize(file.size)}) - Zobo can now access this file`, 'system');
            } else {
                this.showStatusAlert('error', `Failed to connect "${file.name}": ${data.error}`);
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.showStatusAlert('error', `Failed to connect "${file.name}": Network error`);
        }
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

// Initialize chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    document.chatApp = app; // Make globally accessible
});
