import { UIComponent } from '../UIComponent.js';
/**
 * Notifications UI component
 * Displays game notifications and messages
 */
export class NotificationsUI extends UIComponent {
    /**
     * Create a new NotificationsUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('notifications-container', game);
        this.notifications = [];
        this.damageNumbers = [];
        
        // Message queue for asynchronous processing
        this.messageQueue = [];
        this.isProcessingQueue = false;
        
        // Configuration
        this.maxQueueSize = 20; // Maximum number of messages in queue
        this.processingInterval = 50; // Milliseconds between processing messages
        this.maxVisibleNotifications = 5; // Default max visible notifications
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // No initial HTML needed, notifications are added dynamically
        
        // Calculate max visible notifications based on screen height
        this.updateMaxVisibleNotifications();
        
        // Start the message queue processor
        this.startQueueProcessor();
        
        return true;
    }
    
    /**
     * Update max visible notifications based on screen height
     */
    updateMaxVisibleNotifications() {
        const screenHeight = window.innerHeight;
        const maxNotificationAreaHeight = screenHeight / 5;
        const estimatedNotificationHeight = 40;
        this.maxVisibleNotifications = Math.floor(maxNotificationAreaHeight / estimatedNotificationHeight);
    }
    
    /**
     * Start the message queue processor
     */
    startQueueProcessor() {
        // Process messages from queue at regular intervals
        setInterval(() => {
            this.processNextMessage();
        }, this.processingInterval);
    }
    
    /**
     * Process the next message in the queue
     */
    processNextMessage() {
        // If already processing or queue is empty, do nothing
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        try {
            // Pop the next message from the queue
            const message = this.messageQueue.shift();
            
            // Display the message
            this.displayNotification(message);
        } catch (error) {
            console.error('Error processing notification message:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }
    
    /**
     * Update notifications and damage numbers
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Update notifications
        this.updateNotifications(delta);
    }
    
    /**
     * Add a notification message to the queue
     * @param {string} message - Message to display
     */
    showNotification(message) {
        // Add message to queue
        this.messageQueue.push(message);
        
        // If queue gets too large, remove oldest messages
        if (this.messageQueue.length > this.maxQueueSize) {
            // Keep only the most recent messages
            const messagesToKeep = Math.max(5, Math.floor(this.maxQueueSize * 0.5));
            this.messageQueue = this.messageQueue.slice(-messagesToKeep);
        }
    }
    
    /**
     * Display a notification message (called from queue processor)
     * @param {string} message - Message to display
     */
    displayNotification(message) {
        // Get screen height to calculate maximum notification area (1/5 of screen height)
        const screenHeight = window.innerHeight;
        const maxNotificationAreaHeight = screenHeight / 5;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification-item';
        notification.style.top = '80px'; // Initial position, will be adjusted later
        notification.textContent = message;
        
        // Add notification to container
        this.container.appendChild(notification);
        
        // Calculate message rate to determine how aggressively to manage notifications
        const messageRate = this.getMessageRate();
        
        // Determine how many notifications to keep based on message rate
        // When messages come in quickly, keep fewer notifications visible
        const notificationsToKeep = messageRate > 3 ? 
            Math.max(2, this.maxVisibleNotifications - 2) : // High message rate - keep fewer
            this.maxVisibleNotifications; // Normal rate - keep max allowed
        
        // If we have too many notifications, remove the oldest ones immediately
        while (this.notifications.length >= notificationsToKeep) {
            // Remove oldest notification
            const oldestNotification = this.notifications.shift();
            if (oldestNotification && oldestNotification.element) {
                oldestNotification.element.remove();
            }
        }
        
        // Add to notifications array with dynamic lifetime based on message rate
        const lifetime = messageRate > 3 ? 0.3 : 0.7; // Shorter lifetime when messages come quickly

        this.notifications.push({
            element: notification,
            lifetime: lifetime,
            message: message, // Store message for deduplication
            timestamp: Date.now() // Store timestamp for message rate calculation
        });
        
        // Check for duplicate messages and reduce their lifetime
        this.deduplicateNotifications();
        
        // Adjust position for multiple notifications
        if (this.notifications.length > 1) {
            // Calculate total height of all notifications
            let totalHeight = 0;
            let availableHeight = maxNotificationAreaHeight;
            
            // Calculate how much space we need
            for (let i = 0; i < this.notifications.length - 1; i++) {
                const notif = this.notifications[i];
                if (notif && notif.element) {
                    const height = notif.element.offsetHeight + 5; // Height + smaller margin
                    totalHeight += height;
                }
            }
            
            // If we exceed the max height, compress the notifications
            if (totalHeight > availableHeight) {
                // Compress notifications to fit in the available space
                this.compressNotifications(availableHeight);
            } else {
                // Just position the new notification below the last one
                const previousNotification = this.notifications[this.notifications.length - 2];
                if (previousNotification && previousNotification.element) {
                    const previousHeight = previousNotification.element.offsetHeight;
                    const previousTop = parseInt(previousNotification.element.style.top);
                    notification.style.top = `${previousTop + previousHeight + 5}px`; // Smaller margin
                }
            }
        }
    }
    
    /**
     * Update existing notifications
     * @param {number} delta - Time since last update in seconds
     */
    updateNotifications(delta) {
        // Update existing notifications
        let needsReorganization = false;
        
        // Calculate message rate to determine if we need to expire messages faster
        const messageRate = this.getMessageRate();
        const fastExpiry = messageRate > 3; // If messages are coming in quickly
        
        // If message rate is very high, aggressively reduce visible notifications
        if (messageRate > 5 && this.notifications.length > 3) {
            // Keep only the most recent notifications
            const notificationsToKeep = Math.max(2, Math.floor(this.maxVisibleNotifications * 0.5));
            
            // Remove excess notifications from the beginning (oldest first)
            while (this.notifications.length > notificationsToKeep) {
                const oldestNotification = this.notifications.shift();
                if (oldestNotification && oldestNotification.element) {
                    oldestNotification.element.remove();
                }
            }
            
            needsReorganization = true;
        }
        
        // Process remaining notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            
            // Skip invalid notifications
            if (!notification || !notification.element) {
                this.notifications.splice(i, 1);
                continue;
            }
            
            // Update notification lifetime - expire faster if many messages are coming in
            const expiryRate = fastExpiry ? 1.5 / 60 : 1 / 60;
            notification.lifetime -= expiryRate;
            
            // Remove expired notifications
            if (notification.lifetime <= 0) {
                notification.element.remove();
                this.notifications.splice(i, 1);
                needsReorganization = true;
            } else {
                // Update opacity for fade out - start fading earlier
                const fadeStartThreshold = fastExpiry ? 1.2 : 1;
                if (notification.lifetime < fadeStartThreshold) {
                    notification.element.style.opacity = notification.lifetime / fadeStartThreshold;
                }
                
                // Faster slide up for smoother animation - speed based on message rate
                const slideSpeed = fastExpiry ? 1.2 : 0.8;
                const currentTop = parseInt(notification.element.style.top);
                notification.element.style.top = `${currentTop - slideSpeed}px`;
            }
        }
        
        // If we removed notifications or have too many, reorganize the remaining ones
        if ((needsReorganization && this.notifications.length > 0) || 
            (this.notifications.length > 3 && fastExpiry)) {
            
            // Get screen height to calculate maximum notification area
            const screenHeight = window.innerHeight;
            const maxNotificationAreaHeight = screenHeight / 5;
            
            // Calculate total height of all notifications
            let totalHeight = 0;
            for (let i = 0; i < this.notifications.length; i++) {
                const notif = this.notifications[i];
                if (notif && notif.element) {
                    const height = notif.element.offsetHeight + 5; // Height + smaller margin
                    totalHeight += height;
                }
            }
            
            // If we exceed the max height, compress the notifications
            if (totalHeight > maxNotificationAreaHeight) {
                this.compressNotifications(maxNotificationAreaHeight);
            } else {
                // Just reposition notifications with proper spacing
                let currentTop = 80; // Start from the top position
                
                for (let i = 0; i < this.notifications.length; i++) {
                    const notification = this.notifications[i];
                    if (notification && notification.element) {
                        // Reset transform in case it was previously compressed
                        if (notification.element.style.transform.includes('scale')) {
                            notification.element.style.transform = 'translateX(-50%)';
                        }
                        
                        notification.element.style.top = `${currentTop}px`;
                        currentTop += notification.element.offsetHeight + 5; // Height + smaller margin
                    }
                }
            }
        }
        
        // Process more messages from the queue if we have space
        if (this.notifications.length < this.maxVisibleNotifications && this.messageQueue.length > 0) {
            this.processNextMessage();
        }
    }
    
    /**
     * Show level up animation using Three.js effects
     * @param {number} level - New level
     */
    showLevelUp(level) {
        // Use the EffectsManager to create a 3D level up effect
        if (this.game && this.game.effectsManager) {
            this.game.effectsManager.createLevelUpEffect(level);
            
            // Also show a notification
            this.showNotification(`Level Up! You are now level ${level}`);
        } else {
            // Fallback to DOM-based notification if EffectsManager is not available
            this.showNotification(`Level Up! You are now level ${level}`, 3.0);
        }
    }
    
    /**
     * Helper method to calculate message rate (messages per second)
     * @returns {number} - Message rate
     */
    getMessageRate() {
        if (this.notifications.length < 2) return 1; // Default rate
        
        // Calculate time window (in seconds) for the last few messages
        const now = Date.now();
        const oldestTimestamp = this.notifications[0].timestamp;
        const timeWindow = (now - oldestTimestamp) / 1000;
        
        // Avoid division by zero
        if (timeWindow < 0.1) return 10; // Very high rate
        
        // Calculate messages per second
        return this.notifications.length / timeWindow;
    }
    
    /**
     * Helper method to compress notifications to fit in available space
     * @param {number} availableHeight - Available height for notifications
     */
    compressNotifications(availableHeight) {
        // Calculate how much space each notification can take
        const notificationCount = this.notifications.length;
        
        // If no notifications, nothing to do
        if (notificationCount === 0) {
            return;
        }
        
        const spacePerNotification = availableHeight / notificationCount;
        
        // Position each notification with compressed spacing
        let currentTop = 80; // Start from the top position
        
        // Apply more aggressive compression when we have many notifications
        const compressionFactor = notificationCount > 5 ? 0.03 : 0.02;
        
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            
            // Skip invalid notifications
            if (!notification || !notification.element) {
                continue;
            }
            
            // Apply a scale reduction for better compactness
            // More aggressive scaling for higher message counts
            const scale = Math.max(0.8, 1 - (notificationCount * compressionFactor));
            notification.element.style.transform = `translateX(-50%) scale(${scale})`;
            
            // Set position
            notification.element.style.top = `${currentTop}px`;
            
            // Move to next position (use smaller spacing when compressed)
            // Use a minimum spacing to prevent overlap
            // For very high message counts, use even smaller spacing
            const minSpacing = notificationCount > 5 ? 20 : 25;
            currentTop += Math.max(minSpacing, spacePerNotification);
        }
    }
    
    /**
     * Helper method to deduplicate notifications
     */
    deduplicateNotifications() {
        // Create a map to count occurrences of each message
        const messageCounts = {};
        const messageIndices = {}; // Track indices of first occurrence
        
        // Count occurrences and track first occurrence
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            
            // Skip invalid notifications
            if (!notification) {
                continue;
            }
            
            const message = notification.message;
            
            if (messageCounts[message] === undefined) {
                messageIndices[message] = i; // First occurrence
            }
            
            messageCounts[message] = (messageCounts[message] || 0) + 1;
        }
        
        // Handle duplicate messages
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            
            // Skip invalid notifications
            if (!notification || !notification.element) {
                this.notifications.splice(i, 1);
                continue;
            }
            
            const message = notification.message;
            
            if (messageCounts[message] > 1) {
                // If this is not the first occurrence of the message
                if (messageIndices[message] !== i) {
                    // For duplicates, either remove them or reduce their lifetime drastically
                    if (messageCounts[message] > 2) {
                        // If more than 2 duplicates, remove all but the first occurrence
                        notification.element.remove();
                        this.notifications.splice(i, 1);
                    } else {
                        // For just 2 duplicates, drastically reduce lifetime
                        notification.lifetime = Math.min(notification.lifetime, 0.8);
                    }
                } else {
                    // For the first occurrence, update the text to show count
                    if (messageCounts[message] > 2) {
                        notification.element.textContent = `${message} (${messageCounts[message]}x)`;
                    }
                    // Slightly reduce lifetime of first occurrence too
                    notification.lifetime = Math.min(notification.lifetime, 2.0);
                }
            }
        }
    }
    
    /**
     * Clear all notifications immediately
     * Useful when transitioning between game states or when too many messages appear
     */
    clearAllNotifications() {
        // Remove all visible notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            if (notification && notification.element) {
                notification.element.remove();
            }
        }
        
        // Clear the notifications array
        this.notifications = [];
        
        // Clear the message queue or keep only the most recent few
        if (this.messageQueue.length > 5) {
            // Keep only the 5 most recent messages
            this.messageQueue = this.messageQueue.slice(-5);
        }
    }
}