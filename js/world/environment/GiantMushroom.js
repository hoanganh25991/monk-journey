import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a giant mushroom environment object styled for Monk Journey
 */
export class GiantMushroom {
    /**
     * Create a new giant mushroom
     * @param {THREE.Scene} scene - The scene to add the giant mushroom to
     * @param {Object} MapManager - The world manager
     * @param {THREE.Vector3} position - The position of the giant mushroom
     * @param {number} size - The size of the giant mushroom
     * @param {Object} data - Additional data for the giant mushroom
     */
    constructor(scene, MapManager, position, size = 1, data = {}) {
        // Store references
        this.scene = scene;
        this.MapManager = MapManager;
        this.position = position;
        
        // Randomize mushroom properties
        this.random = Math.random;
        this.size = size * (1 + this.random() * 0.5); // Apply size with some variation
        
        // Store zone type for color selection (get from data or default to Swamp)
        this.zoneType = data.zoneType || 'Swamp';
        
        // Determine if the mushroom should glow
        this.isGlowing = data.isGlowing !== undefined ? data.isGlowing : (this.random() > 0.5);
    }
    
    /**
     * Create the giant mushroom mesh
     * @returns {THREE.Group} - The giant mushroom group
     */
    createMesh(position = this.position, size = this.size, data = {}) {
        const mushroomGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Swamp;
        
        // Determine mushroom color based on zone
        let capColor, stemColor, glowColor;
        let emissiveIntensity = 0.4;
        
        switch(this.zoneType) {
            case 'Forest':
                capColor = 0xA52A2A; // Brown
                stemColor = 0xF5DEB3; // Wheat
                glowColor = 0xFFFF00; // Yellow
                break;
            case 'Swamp':
                capColor = 0x6B8E23; // Olive Drab
                stemColor = 0xD3D3D3; // Light Gray
                glowColor = 0x00FF00; // Green
                break;
            case 'Dark Sanctum':
                capColor = 0x800080; // Purple
                stemColor = 0x483D8B; // Dark Slate Blue
                glowColor = 0x9370DB; // Medium Purple
                emissiveIntensity = 0.6;
                break;
            default:
                capColor = 0xA52A2A; // Brown
                stemColor = 0xF5DEB3; // Wheat
                glowColor = 0xFFFF00; // Yellow
        }
        
        // Create stem
        const stemHeight = this.size * 3;
        const stemRadius = this.size * 0.5;
        const stemGeometry = new THREE.CylinderGeometry(
            stemRadius * 0.8, // top radius slightly smaller
            stemRadius * 1.2, // bottom radius slightly larger
            stemHeight,
            12
        );
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: stemColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stemHeight / 2;
        stem.castShadow = true;
        stem.receiveShadow = true;
        
        // Add some texture to the stem
        const stemVertices = stem.geometry.attributes.position;
        for (let i = 0; i < stemVertices.count; i++) {
            const x = stemVertices.getX(i);
            const y = stemVertices.getY(i);
            const z = stemVertices.getZ(i);
            
            // Only modify x and z to keep the height consistent
            if (y > stemHeight * 0.1 && y < stemHeight * 0.9) {
                stemVertices.setX(i, x + (this.random() - 0.5) * 0.1 * stemRadius);
                stemVertices.setZ(i, z + (this.random() - 0.5) * 0.1 * stemRadius);
            }
        }
        
        mushroomGroup.add(stem);
        
        // Create cap
        const capRadius = this.size * 1.5;
        const capHeight = this.size * 0.8;
        const capGeometry = new THREE.SphereGeometry(capRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        
        // Create cap material with potential glow
        const capMaterial = new THREE.MeshStandardMaterial({
            color: capColor,
            roughness: 0.7,
            metalness: 0.2
        });
        
        if (this.isGlowing) {
            capMaterial.emissive = new THREE.Color(glowColor);
            capMaterial.emissiveIntensity = emissiveIntensity;
        }
        
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = stemHeight;
        cap.rotation.x = Math.PI;
        cap.castShadow = true;
        cap.receiveShadow = true;
        
        // Add some texture to the cap
        const capVertices = cap.geometry.attributes.position;
        for (let i = 0; i < capVertices.count; i++) {
            const x = capVertices.getX(i);
            const y = capVertices.getY(i);
            const z = capVertices.getZ(i);
            
            // Add some noise to the vertices
            capVertices.setX(i, x + (this.random() - 0.5) * 0.1 * capRadius);
            capVertices.setY(i, y + (this.random() - 0.5) * 0.1 * capRadius);
            capVertices.setZ(i, z + (this.random() - 0.5) * 0.1 * capRadius);
        }
        
        mushroomGroup.add(cap);
        
        // Add spots on the cap
        const spotCount = 8 + Math.floor(this.random() * 8);
        for (let i = 0; i < spotCount; i++) {
            const spotSize = capRadius * (0.1 + this.random() * 0.15);
            const spotGeometry = new THREE.CircleGeometry(spotSize, 8);
            const spotMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });
            
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position spots on the cap
            const phi = this.random() * Math.PI / 3; // Angle from top
            const theta = this.random() * Math.PI * 2; // Angle around
            
            const x = Math.sin(phi) * Math.cos(theta) * capRadius;
            const y = Math.cos(phi) * capRadius;
            const z = Math.sin(phi) * Math.sin(theta) * capRadius;
            
            spot.position.set(x, stemHeight + y, z);
            
            // Orient spot to face outward from the center of the cap
            spot.lookAt(new THREE.Vector3(0, stemHeight, 0));
            spot.rotation.y += Math.PI;
            
            mushroomGroup.add(spot);
        }
        
        // Add glow effect if the mushroom is glowing
        if (this.isGlowing) {
            const light = new THREE.PointLight(glowColor, 0.8, this.size * 5);
            light.position.set(0, stemHeight, 0);
            mushroomGroup.add(light);
        }
        
        // Add small mushrooms around the base
        const smallMushroomCount = 3 + Math.floor(this.random() * 4);
        for (let i = 0; i < smallMushroomCount; i++) {
            const smallSize = this.size * (0.2 + this.random() * 0.3);
            
            // Create small stem
            const smallStemHeight = smallSize * 0.8;
            const smallStemRadius = smallSize * 0.15;
            const smallStemGeometry = new THREE.CylinderGeometry(
                smallStemRadius,
                smallStemRadius,
                smallStemHeight,
                8
            );
            const smallStem = new THREE.Mesh(smallStemGeometry, stemMaterial);
            
            // Create small cap
            const smallCapRadius = smallSize * 0.3;
            const smallCapGeometry = new THREE.SphereGeometry(smallCapRadius, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const smallCap = new THREE.Mesh(smallCapGeometry, capMaterial);
            
            // Position small mushroom parts
            smallStem.position.y = smallStemHeight / 2;
            smallCap.position.y = smallStemHeight;
            smallCap.rotation.x = Math.PI;
            
            // Group small mushroom parts
            const smallMushroom = new THREE.Group();
            smallMushroom.add(smallStem);
            smallMushroom.add(smallCap);
            
            // Position small mushroom around the base
            const angle = this.random() * Math.PI * 2;
            const distance = stemRadius * (1.2 + this.random() * 1.5);
            
            smallMushroom.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            // Random rotation
            smallMushroom.rotation.y = this.random() * Math.PI * 2;
            
            mushroomGroup.add(smallMushroom);
        }
        
        // Position the entire group at the specified position
        if (position) {
            mushroomGroup.position.copy(position);
        }
        
        // Add to scene
        this.scene.add(mushroomGroup);
        
        return mushroomGroup;
    }
}