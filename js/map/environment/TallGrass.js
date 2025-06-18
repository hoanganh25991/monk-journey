import * as THREE from 'three';

/**
 * TallGrass - Creates tall grass environment objects
 */
export class TallGrass {
    constructor(zoneType = 'Forest') {
        this.zoneType = zoneType;
        this.colors = this.getZoneColors(zoneType);
    }

    /**
     * Get colors based on zone type
     * @param {string} zoneType - The zone type
     * @returns {Object} - Color configuration
     */
    getZoneColors(zoneType) {
        switch (zoneType) {
            case 'Desert':
                return {
                    primary: 0xD2B48C,   // Sandy brown
                    secondary: 0xF4A460, // Sandy brown lighter
                    accent: 0xDEB887     // Burlywood
                };
            case 'Mountain':
                return {
                    primary: 0x8FBC8F,   // Dark sea green
                    secondary: 0x9ACD32, // Yellow green
                    accent: 0x6B8E23     // Olive drab
                };
            case 'Forest':
            default:
                return {
                    primary: 0x228B22,   // Forest green
                    secondary: 0x32CD32, // Lime green
                    accent: 0x90EE90     // Light green
                };
        }
    }

    /**
     * Create tall grass mesh
     * @returns {THREE.Group} - The tall grass group
     */
    createMesh() {
        const grassGroup = new THREE.Group();
        
        // Create multiple grass blades for a fuller look
        const bladeCount = 8 + Math.floor(Math.random() * 12); // 8-20 blades
        
        for (let i = 0; i < bladeCount; i++) {
            const blade = this.createGrassBlade();
            
            // Random positioning within a small area
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 0.8;
            blade.position.x = Math.cos(angle) * distance;
            blade.position.z = Math.sin(angle) * distance;
            
            // Random rotation around Y axis only (this rotates the grass blade around vertical axis)
            blade.rotation.y = Math.random() * Math.PI * 2;
            
            // Fix for horizontal grass: PlaneGeometry creates plane in XY, need to rotate to XZ for upright grass
            // Rotate 90 degrees around X axis to make plane stand vertically from horizontal ground
            blade.rotation.x = Math.PI / 2;
            blade.rotation.z = 0;
            
            grassGroup.add(blade);
        }
        
        // Add some small flowers occasionally
        if (Math.random() < 0.3) {
            const flowerCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < flowerCount; i++) {
                const flower = this.createSmallFlower();
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 1.2;
                flower.position.x = Math.cos(angle) * distance;
                flower.position.z = Math.sin(angle) * distance;
                flower.position.y = 0.5 + Math.random() * 0.5;
                grassGroup.add(flower);
            }
        }
        
        // Random scale variation
        const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        grassGroup.scale.set(scale, scale, scale);
        
        grassGroup.userData = {
            type: 'tall_grass',
            zone: this.zoneType
        };
        
        return grassGroup;
    }

    /**
     * Create a single grass blade
     * @returns {THREE.Mesh} - The grass blade mesh
     */
    createGrassBlade() {
        // Create a simple plane for the grass blade
        const width = 0.1 + Math.random() * 0.1; // 0.1 to 0.2
        const height = 1.5 + Math.random() * 1.0; // 1.5 to 2.5
        
        const geometry = new THREE.PlaneGeometry(width, height);
        
        // Move the pivot to the bottom of the blade
        geometry.translate(0, height / 2, 0);
        
        // PlaneGeometry by default is in XY plane and should stand upright on XZ ground
        
        // Create material with zone-appropriate color
        const colorVariation = Math.random() * 0.3 - 0.15; // -0.15 to 0.15
        const baseColor = new THREE.Color(this.colors.primary);
        baseColor.offsetHSL(0, 0, colorVariation);
        
        const material = new THREE.MeshLambertMaterial({
            color: baseColor,
            side: THREE.DoubleSide,
            transparent: false,  // Remove transparency to avoid black appearance
            opacity: 1.0,        // Full opacity
            alphaTest: 0.1
        });
        
        const blade = new THREE.Mesh(geometry, material);
        blade.castShadow = true;
        blade.receiveShadow = true;
        
        return blade;
    }

    /**
     * Create a small flower for the grass
     * @returns {THREE.Mesh} - The small flower mesh
     */
    createSmallFlower() {
        const geometry = new THREE.SphereGeometry(0.05, 6, 4);
        
        // Random flower colors
        const flowerColors = [0xFF69B4, 0xFFFFE0, 0xE6E6FA, 0xFFA07A, 0x98FB98];
        const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        
        const material = new THREE.MeshLambertMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        
        const flower = new THREE.Mesh(geometry, material);
        flower.castShadow = true;
        
        return flower;
    }
}