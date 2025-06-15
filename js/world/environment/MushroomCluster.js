import * as THREE from 'three';

/**
 * Mushroom Cluster - A cluster of various mushrooms of different sizes
 * Creates natural-looking groupings of mushrooms for forest environments
 */
export class MushroomCluster {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }
    
    /**
     * Create a mushroom cluster mesh
     * @param {THREE.Vector3} position - Center position of the cluster
     * @param {number} size - Size multiplier for the cluster
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The mushroom cluster group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all mushrooms in the cluster
        const clusterGroup = new THREE.Group();
        
        // Determine number of mushrooms in cluster (3-8 mushrooms)
        const mushroomCount = Math.floor(Math.random() * 6) + 3;
        
        // Get cluster parameters from data or use defaults
        const clusterRadius = (data.radius || 1.5) * size;
        const allowGlowing = data.allowGlowing !== false; // Default to true
        
        // Create mushrooms in a roughly circular pattern
        for (let i = 0; i < mushroomCount; i++) {
            // Position mushroom within cluster radius
            const angle = (i / mushroomCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const distance = Math.random() * clusterRadius;
            
            const mushroomX = position.x + Math.cos(angle) * distance;
            const mushroomZ = position.z + Math.sin(angle) * distance;
            
            // Get terrain height for this position
            const mushroomY = this.worldManager ? 
                this.worldManager.getTerrainHeight(mushroomX, mushroomZ) : 
                position.y;
            
            const mushroomPosition = new THREE.Vector3(mushroomX, mushroomY, mushroomZ);
            
            // Vary mushroom size (small to medium)
            const mushroomSize = (0.3 + Math.random() * 0.7) * size;
            
            // Create the mushroom
            const mushroom = this.createSingleMushroom(mushroomPosition, mushroomSize, allowGlowing);
            clusterGroup.add(mushroom);
        }
        
        // Add some variation - occasionally add a larger central mushroom
        if (Math.random() > 0.6) {
            const centerMushroom = this.createSingleMushroom(position, size * 1.2, allowGlowing);
            clusterGroup.add(centerMushroom);
        }
        
        // Add to scene if scene is provided
        if (this.scene) {
            this.scene.add(clusterGroup);
        }
        
        return clusterGroup;
    }
    
    /**
     * Create a single mushroom for the cluster
     * @param {THREE.Vector3} position - Position of the mushroom
     * @param {number} size - Size multiplier for the mushroom
     * @param {boolean} allowGlowing - Whether this mushroom can glow
     * @returns {THREE.Group} - The mushroom group
     */
    createSingleMushroom(position, size = 1, allowGlowing = true) {
        // Create a group to hold all parts of the mushroom
        const mushroomGroup = new THREE.Group();
        
        // Determine if this mushroom should glow (20% chance if allowed)
        const isGlowing = allowGlowing && Math.random() < 0.2;
        
        // Get mushroom colors
        const capColor = this.getRandomCapColor(isGlowing);
        const stemColor = isGlowing ? 0xE8F5E8 : 0xF5F5F5; // Slightly greenish if glowing
        
        // Create stem with slight variation in thickness
        const stemBottomRadius = (0.06 + Math.random() * 0.04) * size;
        const stemTopRadius = (0.04 + Math.random() * 0.02) * size;
        const stemHeight = (0.4 + Math.random() * 0.3) * size;
        
        const stemGeometry = new THREE.CylinderGeometry(stemTopRadius, stemBottomRadius, stemHeight, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: stemColor });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Create cap with variation
        const capRadius = (0.18 + Math.random() * 0.12) * size;
        const capGeometry = new THREE.SphereGeometry(capRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        
        let capMaterial;
        if (isGlowing) {
            capMaterial = new THREE.MeshLambertMaterial({ 
                color: capColor,
                emissive: capColor,
                emissiveIntensity: 0.3
            });
        } else {
            capMaterial = new THREE.MeshLambertMaterial({ color: capColor });
        }
        
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = stemHeight * 0.5 + capRadius * 0.3;
        
        // Add variation to the cap shape
        const scaleX = 0.7 + Math.random() * 0.6;
        const scaleZ = 0.7 + Math.random() * 0.6;
        cap.scale.set(scaleX, 1, scaleZ);
        
        // Add slight random rotation for natural look
        mushroomGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add cap details (spots or texture) for some mushrooms
        if (Math.random() > 0.4) {
            this.addCapDetails(cap, size, capColor, isGlowing);
        }
        
        // Add parts to the group
        mushroomGroup.add(stem);
        mushroomGroup.add(cap);
        
        // Position the mushroom
        mushroomGroup.position.copy(position);
        
        // Add slight tilt for natural look
        const tiltAmount = (Math.random() - 0.5) * 0.2;
        mushroomGroup.rotation.z = tiltAmount;
        mushroomGroup.rotation.x = (Math.random() - 0.5) * 0.15;
        
        return mushroomGroup;
    }
    
    /**
     * Add details to the mushroom cap
     * @param {THREE.Mesh} cap - The mushroom cap mesh
     * @param {number} size - Size multiplier
     * @param {number} capColor - The cap color
     * @param {boolean} isGlowing - Whether the mushroom is glowing
     */
    addCapDetails(cap, size, capColor, isGlowing = false) {
        // Create spots on the cap
        const spotCount = Math.floor(Math.random() * 4) + 2;
        const spotColor = this.getContrastColor(capColor);
        
        let spotMaterial;
        if (isGlowing) {
            spotMaterial = new THREE.MeshLambertMaterial({ 
                color: spotColor,
                emissive: spotColor,
                emissiveIntensity: 0.2
            });
        } else {
            spotMaterial = new THREE.MeshLambertMaterial({ color: spotColor });
        }
        
        for (let i = 0; i < spotCount; i++) {
            const spotSize = (0.015 + Math.random() * 0.025) * size;
            const spotGeometry = new THREE.CircleGeometry(spotSize, 8);
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position the spot on the cap
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.15 * size;
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
     * @param {boolean} isGlowing - Whether the mushroom should have glowing colors
     * @returns {number} - The color as a hex value
     */
    getRandomCapColor(isGlowing = false) {
        if (isGlowing) {
            // Glowing mushrooms use more mystical colors
            const glowingColors = [
                0x9C27B0, // Purple
                0x673AB7, // Deep Purple
                0x3F51B5, // Indigo
                0x2196F3, // Blue
                0x00BCD4, // Cyan
                0x009688, // Teal
                0x4CAF50, // Green
                0x8BC34A, // Light Green
                0xFFEB3B, // Yellow
                0xFF9800, // Orange
                0xE91E63  // Pink
            ];
            return glowingColors[Math.floor(Math.random() * glowingColors.length)];
        } else {
            // Regular mushrooms use natural colors
            const naturalColors = [
                0x8D6E63, // Brown
                0x6D4C41, // Dark Brown
                0xA1887F, // Light Brown
                0x795548, // Brown Grey
                0xD7CCC8, // Light Brown Grey
                0xBCAAA4, // Warm Grey
                0xE53935, // Red (classic mushroom)
                0xC62828, // Dark Red
                0xFB8C00, // Orange
                0xFF8F00, // Dark Orange
                0xFFB300, // Amber
                0xF57F17  // Yellow Orange
            ];
            return naturalColors[Math.floor(Math.random() * naturalColors.length)];
        }
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