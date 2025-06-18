import * as THREE from 'three';

/**
 * Represents a plaza environment object for circular villages
 */
export class Plaza {
    /**
     * Create a new plaza
     * @param {THREE.Scene} scene - The scene to add the plaza to
     * @param {Object} MapManager - The map manager
     */
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the plaza mesh
     * @param {Object} data - Plaza data including position and radius
     * @returns {THREE.Mesh} - The plaza mesh
     */
    createMesh(data) {
        const radius = data.radius || 8;
        
        // Create plaza ground
        const plazaGeometry = new THREE.CircleGeometry(radius, 32);
        
        // Get theme colors
        let plazaColor = 0xCCCCCC; // Default plaza color
        
        if (this.MapManager.mapLoader && 
            this.MapManager.mapLoader.currentMap && 
            this.MapManager.mapLoader.currentMap.theme) {
            const themeColors = this.MapManager.mapLoader.currentMap.theme.colors;
            
            // Use theme-specific path color if available
            if (themeColors && themeColors.path) {
                // Convert hex string to number
                plazaColor = parseInt(themeColors.path.replace('#', '0x'), 16);
            }
        }
        
        const plazaMaterial = new THREE.MeshStandardMaterial({ 
            color: plazaColor,
            roughness: 0.7
        });
        
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        plaza.position.set(data.position.x, 0.05, data.position.z); // Slightly above ground
        
        plaza.userData = { type: 'plaza' };
        
        return plaza;
    }
}