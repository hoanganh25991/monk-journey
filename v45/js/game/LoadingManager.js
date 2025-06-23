import * as THREE from 'three';

/**
 * Service for managing asset loading
 */
export class LoadingManager {
    constructor() {
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
    }
    
    /**
     * Get the THREE.LoadingManager instance
     * @returns {THREE.LoadingManager} The loading manager
     */
    getManager() {
        return this.loadingManager;
    }
    
    /**
     * Set up loading manager events
     */
    setupLoadingManager() {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.width = `${progress}%`;
            }
        };
        
        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
        };
    }
    
    /**
     * Set a callback for when all assets are loaded
     * @param {Function} callback - The callback function
     */
    onLoad(callback) {
        this.loadingManager.onLoad = callback;
    }
    
    /**
     * Set a callback for loading progress
     * @param {Function} callback - The callback function (url, itemsLoaded, itemsTotal)
     */
    onProgress(callback) {
        this.loadingManager.onProgress = callback;
    }
    
    /**
     * Set a callback for loading errors
     * @param {Function} callback - The callback function (url)
     */
    onError(callback) {
        this.loadingManager.onError = callback;
    }
}