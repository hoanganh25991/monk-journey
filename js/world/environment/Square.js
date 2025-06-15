import * as THREE from 'three';

/**
 * Represents a square environment object for grid villages
 */
export class Square {
    /**
     * Create a new square
     * @param {THREE.Scene} scene - The scene to add the square to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the square mesh
     * @param {Object} data - Square data including position and size
     * @returns {THREE.Mesh} - The square mesh
     */
    createMesh(data) {
        const size = data.size || 10;
        
        // Create square ground
        const squareGeometry = new THREE.PlaneGeometry(size, size);
        
        // Get theme colors
        let squareColor = 0xCCCCCC; // Default square color
        
        if (this.worldManager.mapLoader && 
            this.worldManager.mapLoader.currentMap && 
            this.worldManager.mapLoader.currentMap.theme) {
            const themeColors = this.worldManager.mapLoader.currentMap.theme.colors;
            
            // Use theme-specific path color if available
            if (themeColors && themeColors.path) {
                // Convert hex string to number
                squareColor = parseInt(themeColors.path.replace('#', '0x'), 16);
            }
        }
        
        const squareMaterial = new THREE.MeshStandardMaterial({ 
            color: squareColor,
            roughness: 0.7
        });
        
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        square.position.set(data.position.x, 0.05, data.position.z); // Slightly above ground
        
        square.userData = { type: 'square' };
        
        return square;
    }
}