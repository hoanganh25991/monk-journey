import * as THREE from 'three';

/**
 * Small Mushroom - A smaller, more delicate mushroom variant
 * Used for forest floor decoration and magical environments
 */
export class SmallMushroom {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }
    
    /**
     * Create a small mushroom mesh
     * @param {THREE.Vector3} position - Position of the mushroom
     * @param {number} size - Size multiplier for the mushroom
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The mushroom group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all parts of the mushroom
        const mushroomGroup = new THREE.Group();
        
        // Get color variations from data or use defaults
        const capColor = data.capColor || this.getRandomCapColor();
        const stemColor = data.stemColor || 0xF5F5F5; // Default to off-white
        
        // Create stem (thinner than regular mushroom)
        const stemGeometry = new THREE.CylinderGeometry(0.05 * size, 0.08 * size, 0.3 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: stemColor });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Create cap (smaller and more varied than regular mushroom)
        const capGeometry = new THREE.SphereGeometry(0.15 * size, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ color: capColor });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.15 * size;
        
        // Add some variation to the cap shape
        const scaleX = 0.8 + Math.random() * 0.4;
        const scaleZ = 0.8 + Math.random() * 0.4;
        cap.scale.set(scaleX, 1, scaleZ);
        
        // Add slight random rotation for natural look
        mushroomGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add small details to the cap (spots or texture)
        if (Math.random() > 0.5) {
            this.addCapDetails(cap, size, capColor);
        }
        
        // Add parts to the group
        mushroomGroup.add(stem);
        mushroomGroup.add(cap);
        
        // Position the mushroom
        mushroomGroup.position.copy(position);
        
        // Add to scene if scene is provided
        if (this.scene) {
            this.scene.add(mushroomGroup);
        }
        
        return mushroomGroup;
    }
    
    /**
     * Add details to the mushroom cap
     * @param {THREE.Mesh} cap - The mushroom cap mesh
     * @param {number} size - Size multiplier
     * @param {number} capColor - The cap color
     */
    addCapDetails(cap, size, capColor) {
        // Create spots on the cap
        const spotCount = Math.floor(Math.random() * 5) + 3;
        const spotColor = this.getContrastColor(capColor);
        const spotMaterial = new THREE.MeshLambertMaterial({ color: spotColor });
        
        for (let i = 0; i < spotCount; i++) {
            const spotSize = (0.02 + Math.random() * 0.03) * size;
            const spotGeometry = new THREE.CircleGeometry(spotSize, 8);
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position the spot on the cap
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.12 * size;
            spot.position.set(
                Math.cos(angle) * radius,
                0.001, // Slightly above the cap surface
                Math.sin(angle) * radius
            );
            
            // Rotate to face outward from cap center
            spot.rotation.x = -Math.PI / 2;
            
            cap.add(spot);
        }
    }
    
    /**
     * Get a random cap color for the mushroom
     * @returns {number} - The color as a hex value
     */
    getRandomCapColor() {
        const colors = [
            0xE53935, // Red
            0xD81B60, // Pink
            0x8E24AA, // Purple
            0x5E35B1, // Deep Purple
            0x3949AB, // Indigo
            0x1E88E5, // Blue
            0x039BE5, // Light Blue
            0x00ACC1, // Cyan
            0x00897B, // Teal
            0x43A047, // Green
            0x7CB342, // Light Green
            0xC0CA33, // Lime
            0xFDD835, // Yellow
            0xFFB300, // Amber
            0xFB8C00, // Orange
            0xF4511E  // Deep Orange
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Get a contrasting color for details
     * @param {number} color - The base color
     * @returns {number} - A contrasting color
     */
    getContrastColor(color) {
        // Simple contrast - if dark color, return light color and vice versa
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        return luminance > 128 ? 0x333333 : 0xFFFFFF;
    }
}