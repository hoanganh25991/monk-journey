/**
 * ReleaseTab.js
 * Manages the release settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';

export class ReleaseTab extends SettingsTab {
    /**
     * Create a release settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('release', game, settingsMenu);
        
        // Release settings elements
        this.updateToLatestButton = document.getElementById('update-to-latest-button');
        this.currentVersionSpan = document.getElementById('current-version');
        
        this.init();
    }
    
    /**
     * Initialize the release settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeReleaseSettings();
        return true;
    }
    
    /**
     * Initialize release settings
     * @private
     */
    async initializeReleaseSettings() {
        // Display current version (simplified)
        if (this.currentVersionSpan) {
            try {
                const version = await this.fetchCacheVersion();
                this.currentVersionSpan.textContent = version;
            } catch (error) {
                console.error('Error setting version display:', error);
                this.currentVersionSpan.textContent = 'Current Version';
            }
        }
        
        // Set up update button with simplified functionality
        if (this.updateToLatestButton) {
            this.updateToLatestButton.addEventListener('click', async () => {
                // Show loading state
                this.updateToLatestButton.textContent = 'Updating...';
                this.updateToLatestButton.disabled = true;
                
                try {
                    // Unregister all service workers
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                            console.debug('Service worker unregistered');
                        }
                    }
                    
                    // Clear all caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(cacheName => {
                                console.debug(`Deleting cache: ${cacheName}`);
                                return caches.delete(cacheName);
                            })
                        );
                        console.debug('All caches cleared');
                    }
                    
                    // Force reload the page from server (bypass cache)
                    console.debug('Reloading page...');
                    window.location.reload(true);
                } catch (error) {
                    console.error('Error updating to latest version:', error);
                    
                    // Reset button state
                    this.updateToLatestButton.textContent = 'Update to Latest';
                    this.updateToLatestButton.disabled = false;
                    
                    // Show error message
                    alert('Failed to update to the latest version. Please try again later.');
                }
            });
        }
    }

    async fetchCacheVersion() {
        try {
            // Try to get the cache version from the service worker
            const response = await fetch('service-worker.js');
            if (!response.ok) {
                return 'Current Version';
            }
            
            // Get the text content
            const text = await response.text();
            
            // Extract the cache version using regex
            const versionMatch = text.match(/const CACHE_VERSION = ['"](\d+)['"]/);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            } else {
                // If we can't find the version, just return a generic message
                return 'Current Version';
            }
        } catch (error) {
            console.error('Error fetching cache version:', error);
            return 'Current Version';
        }
    }
}