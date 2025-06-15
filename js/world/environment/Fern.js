import * as THREE from 'three';

/**
 * Fern - A specialized plant for forest environments
 * Features multiple fronds with a distinctive fern-like appearance
 */
export class Fern {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }
    
    /**
     * Create a fern mesh
     * @param {THREE.Vector3} position - Position of the fern
     * @param {number} size - Size multiplier for the fern
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The fern group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all parts of the fern
        const fernGroup = new THREE.Group();
        
        // Get color variations from data or use defaults
        const frondColor = data.frondColor || this.getRandomFrondColor();
        
        // Create the main stem
        const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.04 * size, 0.5 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 }); // Brown stem
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25 * size;
        
        // Add the stem to the group
        fernGroup.add(stem);
        
        // Create fronds (5-9 fronds)
        const frondCount = Math.floor(Math.random() * 5) + 5;
        
        for (let i = 0; i < frondCount; i++) {
            const frond = this.createFrond(size, frondColor);
            
            // Position frond along the stem
            const heightPercent = 0.2 + (i / frondCount) * 0.8;
            frond.position.y = heightPercent * 0.5 * size;
            
            // Rotate frond around stem
            const angle = (i / frondCount) * Math.PI * 2;
            frond.rotation.y = angle;
            
            // Angle frond upward, more vertical near top
            const verticalAngle = Math.PI / 2 - (heightPercent * Math.PI / 3);
            frond.rotation.x = verticalAngle;
            
            stem.add(frond);
        }
        
        // Add slight random rotation for natural look
        fernGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Position the fern
        fernGroup.position.copy(position);
        
        // Add to scene if scene is provided
        if (this.scene) {
            this.scene.add(fernGroup);
        }
        
        return fernGroup;
    }
    
    /**
     * Create a single fern frond
     * @param {number} size - Size multiplier
     * @param {number} color - Color for the frond
     * @returns {THREE.Group} - The frond group
     */
    createFrond(size, color) {
        const frondGroup = new THREE.Group();
        
        // Create the main frond stem
        const frondStemGeometry = new THREE.CylinderGeometry(0.01 * size, 0.02 * size, 0.4 * size, 8);
        const frondStemMaterial = new THREE.MeshLambertMaterial({ color: 0x7D6E83 }); // Grayish brown
        const frondStem = new THREE.Mesh(frondStemGeometry, frondStemMaterial);
        
        // Position stem at the base of the frond
        frondStem.position.y = 0.2 * size;
        frondStem.rotation.x = Math.PI / 2; // Rotate to be horizontal
        
        frondGroup.add(frondStem);
        
        // Create leaflets along the frond stem
        const leafletCount = Math.floor(Math.random() * 4) + 6; // 6-9 leaflets
        
        for (let i = 0; i < leafletCount; i++) {
            // Create leaflet pairs (one on each side)
            for (let side = -1; side <= 1; side += 2) {
                if (i === leafletCount - 1 && side === 1) continue; // Skip the last right side to make the tip
                
                const leaflet = this.createLeaflet(size, color);
                
                // Position along the frond stem
                const lengthPercent = i / leafletCount;
                leaflet.position.z = lengthPercent * 0.4 * size;
                
                // Position to the side
                leaflet.position.x = side * 0.05 * size;
                
                // Scale leaflets - smaller near the tip
                const leafletScale = 1 - lengthPercent * 0.7;
                leaflet.scale.set(leafletScale, leafletScale, leafletScale);
                
                // Angle leaflets
                leaflet.rotation.y = side * Math.PI / 4;
                leaflet.rotation.x = -Math.PI / 6;
                
                frondStem.add(leaflet);
            }
        }
        
        // Create the tip leaflet
        const tipLeaflet = this.createLeaflet(size * 0.7, color);
        tipLeaflet.position.z = 0.4 * size;
        tipLeaflet.rotation.x = -Math.PI / 6;
        frondStem.add(tipLeaflet);
        
        return frondGroup;
    }
    
    /**
     * Create a single leaflet for the fern
     * @param {number} size - Size multiplier
     * @param {number} color - Color for the leaflet
     * @returns {THREE.Mesh} - The leaflet mesh
     */
    createLeaflet(size, color) {
        // Create a custom shape for the leaflet
        const shape = new THREE.Shape();
        
        // Draw a leaf-like shape
        shape.moveTo(0, 0);
        shape.bezierCurveTo(0.02 * size, 0.03 * size, 0.04 * size, 0.05 * size, 0.06 * size, 0.03 * size);
        shape.bezierCurveTo(0.08 * size, 0.01 * size, 0.1 * size, 0, 0.12 * size, 0);
        shape.bezierCurveTo(0.1 * size, -0.01 * size, 0.08 * size, -0.02 * size, 0.06 * size, -0.03 * size);
        shape.bezierCurveTo(0.04 * size, -0.05 * size, 0.02 * size, -0.03 * size, 0, 0);
        
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    /**
     * Get a random frond color for the fern
     * @returns {number} - The color as a hex value
     */
    getRandomFrondColor() {
        // Ferns are typically various shades of green
        const colors = [
            0x2E7D32, // Dark green
            0x388E3C, // Medium green
            0x43A047, // Light green
            0x4CAF50, // Green
            0x66BB6A, // Light green
            0x81C784  // Pale green
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
}