/**
 * ServiceWorkerRegistration - Simplified version for silent updates
 * Handles the registration and lifecycle of the service worker
 */
(function() {
    // Register the service worker when the page loads
    window.addEventListener('load', () => {
        // Skip registration if conditions aren't met
        if (document.title === 'registration.js') {
            console.debug('This is a service worker registration script. It should be included in an HTML page, not opened directly.');
            return;
        }
        
        if (window.location.protocol === 'file:') {
            console.warn('Service workers are not supported when running locally from file://');
            return;
        }

        if (window.location.hostname === 'localhost') {
            console.warn('Service workers are not supported when running locally from localhost');
            return;
        }

        if (localStorage.getItem('monk_journey_debug_mode') === 'true') {
            console.warn('Service workers are disabled in debug mode');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported in this browser');
            return;
        }

        // Determine the correct path to service-worker.js
        const swPath = window.location.pathname.includes('/pwa/') ? '../service-worker.js' : 'service-worker.js';
        
        // Register the service worker
        navigator.serviceWorker.register(swPath)
            .then(registration => {
                console.debug('Service Worker registered with scope:', registration.scope);
                
                // Set up update handling
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    
                    console.debug('New service worker installing');
                    
                    // Listen for state changes
                    newWorker.addEventListener('statechange', () => {
                        console.debug(`Service worker state: ${newWorker.state}`);
                    });
                });
                
                // Set up message listener for update notifications
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'UPDATE_COMPLETE') {
                        // Show a brief toast notification
                        showUpdateToast(event.data.totalSizeMB);
                    }
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
    
    /**
     * Shows a simple toast notification when an update is complete
     * @param {number} sizeMB - Size of the update in MB
     */
    function showUpdateToast(sizeMB) {
        // Create a toast element
        const toast = document.createElement('div');
        toast.textContent = `App updated${sizeMB ? ` (${sizeMB} MB)` : ''}`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 20px';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        toast.style.transition = 'opacity 0.5s ease-in-out';
        
        // Add to document
        document.body.appendChild(toast);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
})();