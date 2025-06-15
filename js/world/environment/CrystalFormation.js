import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a crystal formation environment object styled for Monk Journey
 */
export class CrystalFormation {
    /**
     * Create a new crystal formation
     * @param {THREE.Scene} scene - The scene to add the crystal formation to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the crystal formation
     * @param {number} size - The size of the crystal formation
     * @param {Object} data - Additional data for the crystal formation
     */
    constructor(scene, worldManager, position, size = 1, data = {}) {
        // Store references
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        
        // Randomize crystal properties
        this.random = Math.random;
        this.size = size * (1 + this.random() * 0.5); // Apply size with some variation
        this.crystalCount = 3 + Math.floor(this.random() * 5); // 3-7 crystals
        
        // Store zone type for color selection (get from data or default to Forest)
        this.zoneType = data.zoneType || 'Forest';
    }
    
    /**
     * Create the crystal formation mesh
     * @returns {THREE.Group} - The crystal formation group
     */
    createMesh() {
        const crystalGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Determine crystal color based on zone
        let crystalColor;
        let emissiveIntensity = 0.5;
        
        switch(this.zoneType) {
            case 'Forest':
                crystalColor = 0x50C878; // Emerald Green
                break;
            case 'Desert':
                crystalColor = 0xFFD700; // Gold
                break;
            case 'Mountains':
                crystalColor = 0xADD8E6; // Light Blue
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
                crystalColor = 0x50C878; // Emerald Green
        }
        
        // Create base rock
        const baseGeometry = new THREE.SphereGeometry(this.size * 0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x808080, // Gray default
            roughness: 0.9,
            metalness: 0.1
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = Math.PI / 2;
        base.position.y = 0;
        base.castShadow = true;
        base.receiveShadow = true;
        
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
            const height = 0.5 + this.random() * 1.5;
            const width = 0.2 + this.random() * 0.3;
            
            const crystalGeometry = new THREE.ConeGeometry(width, height, 5);
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position crystal on the base with random placement
            const angle = this.random() * Math.PI * 2;
            const radius = this.random() * this.size * 0.4;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = height / 2;
            
            crystal.position.set(x, y, z);
            
            // Random rotation and tilt
            crystal.rotation.y = this.random() * Math.PI * 2;
            crystal.rotation.x = (this.random() - 0.5) * 0.5;
            crystal.rotation.z = (this.random() - 0.5) * 0.5;
            
            crystal.castShadow = true;
            
            crystalGroup.add(crystal);
            
            // Add point light for glow effect
            if (i % 2 === 0) { // Only add light to some crystals to avoid too many lights
                const light = new THREE.PointLight(crystalColor, 0.5, 2);
                light.position.copy(crystal.position);
                light.position.y += height / 2;
                crystalGroup.add(light);
            }
        }
        
        // Position the entire group at the specified position
        if (this.position) {
            crystalGroup.position.copy(this.position);
        }
        
        // Add to scene
        this.scene.add(crystalGroup);
        
        return crystalGroup;
    }
}