import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a crystal outcrop environment object styled for Monk Journey
 * A larger, more dramatic crystal formation that emerges from mountain terrain
 */
export class CrystalOutcrop {
    /**
     * Create a new crystal outcrop
     * @param {THREE.Scene} scene - The scene to add the crystal outcrop to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the crystal outcrop
     * @param {number} size - The size of the crystal outcrop
     * @param {Object} data - Additional data for the crystal outcrop
     */
    constructor(scene, worldManager, position, size = 1, data = {}) {
        // Store references
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        
        // Randomize crystal properties
        this.random = Math.random;
        this.size = size * (1 + this.random() * 0.5); // Apply size with some variation
        this.crystalCount = 8 + Math.floor(this.random() * 7); // 8-14 crystals
        
        // Store zone type for color selection (get from data or default to Mountains)
        this.zoneType = data.zoneType || 'Mountains';
    }
    
    /**
     * Create the crystal outcrop mesh
     * @returns {THREE.Group} - The crystal outcrop group
     */
    createMesh(position = this.position, size = this.size, data = {}) {
        const crystalGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Mountains;
        
        // Determine crystal color based on zone
        let crystalColor;
        let emissiveIntensity = 0.6;
        
        switch(this.zoneType) {
            case 'Forest':
                crystalColor = 0x50C878; // Emerald Green
                break;
            case 'Desert':
                crystalColor = 0xFFD700; // Gold
                break;
            case 'Mountains':
                crystalColor = 0x87CEEB; // Sky Blue
                break;
            case 'Swamp':
                crystalColor = 0x9370DB; // Medium Purple
                break;
            case 'Ruins':
                crystalColor = 0xFF7F50; // Coral
                break;
            case 'Dark Sanctum':
                crystalColor = 0x800080; // Purple
                emissiveIntensity = 0.8;
                break;
            default:
                crystalColor = 0x87CEEB; // Sky Blue
        }
        
        // Create base rock formation (larger and more jagged than regular crystal formation)
        const baseGeometry = new THREE.DodecahedronGeometry(this.size * 1.2, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x808080, // Gray default
            roughness: 0.9,
            metalness: 0.2
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0;
        base.castShadow = true;
        base.receiveShadow = true;
        
        // Add some deformation to the base
        const baseVertices = base.geometry.attributes.position;
        for (let i = 0; i < baseVertices.count; i++) {
            const x = baseVertices.getX(i);
            const y = baseVertices.getY(i);
            const z = baseVertices.getZ(i);
            
            // Add some noise to the vertices
            baseVertices.setX(i, x + (this.random() - 0.5) * 0.3 * this.size);
            baseVertices.setY(i, y + (this.random() - 0.5) * 0.3 * this.size);
            baseVertices.setZ(i, z + (this.random() - 0.5) * 0.3 * this.size);
        }
        
        crystalGroup.add(base);
        
        // Create crystal material with transparency and glow
        const crystalMaterial = new THREE.MeshStandardMaterial({
            color: crystalColor,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
            emissive: crystalColor,
            emissiveIntensity: emissiveIntensity
        });
        
        // Create multiple crystals in a formation
        for (let i = 0; i < this.crystalCount; i++) {
            // Create crystal geometry (elongated pyramid)
            const height = 0.8 + this.random() * 2.0;
            const width = 0.3 + this.random() * 0.4;
            
            const crystalGeometry = new THREE.ConeGeometry(width, height, 5);
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position crystal on the base with random placement
            const angle = this.random() * Math.PI * 2;
            const radius = this.random() * this.size * 0.8;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (this.random() * 0.5 + 0.2) * this.size;
            
            crystal.position.set(x, y, z);
            
            // Random rotation and tilt
            crystal.rotation.y = this.random() * Math.PI * 2;
            crystal.rotation.x = (this.random() - 0.5) * 0.7;
            crystal.rotation.z = (this.random() - 0.5) * 0.7;
            
            crystal.castShadow = true;
            
            crystalGroup.add(crystal);
            
            // Add point light for glow effect
            if (i % 3 === 0) { // Only add light to some crystals to avoid too many lights
                const light = new THREE.PointLight(crystalColor, 0.6, 3);
                light.position.copy(crystal.position);
                light.position.y += height / 2;
                crystalGroup.add(light);
            }
        }
        
        // Position the entire group at the specified position
        if (position) {
            crystalGroup.position.copy(position);
        }
        
        // Add to scene
        this.scene.add(crystalGroup);
        
        return crystalGroup;
    }
}