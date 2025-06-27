import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a tree environment object styled for Monk Journey
 */
export class Tree {
    /**
     * Create a new tree
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    constructor(zoneType = 'Forest') {
        // Randomize tree properties
        this.trunkHeight = 2 + Math.random() * 1; // Trunk height between 2-3 units
        this.trunkRadius = 0.3 + Math.random() * 0.2; // Trunk radius between 0.3-0.5 units
        this.foliageSize = 1.5 + Math.random() * 0.5; // Foliage size between 1.5-2 units
        
        // Store zone type for color selection
        this.zoneType = zoneType;
    }
    
    /**
     * Create the tree mesh
     * @returns {THREE.Group} - The tree group
     */
    createMesh() {
        const treeGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create trunk with zone-appropriate color
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.trunk || 0x8B4513, // Earth Brown default
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create pagoda-style trunk for Monk Journey theme
        const trunkGeometry = new THREE.CylinderGeometry(this.trunkRadius, this.trunkRadius * 1.2, this.trunkHeight, 8);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = this.trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        treeGroup.add(trunk);
        
        // Create foliage with zone-appropriate color
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.foliage || 0x2F4F4F, // Dark Green default
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create multiple layers of foliage in a pagoda-like style
        const foliageLayers = 2 + Math.floor(Math.random() * 2); // 2-3 layers
        
        for (let i = 0; i < foliageLayers; i++) {
            const layerSize = this.foliageSize * (1 - i * 0.15); // Each layer is slightly smaller
            const layerHeight = this.trunkHeight + i * this.foliageSize * 0.5;
            
            // Use more angular shapes for a stylized Asian-inspired look
            const segments = 6; // Hexagonal shape for more stylized look
            const foliageGeometry = new THREE.ConeGeometry(layerSize, this.foliageSize, segments);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = layerHeight;
            foliage.castShadow = true;
            
            // Rotate each layer slightly for a more interesting look
            foliage.rotation.y = (i % 2) * (Math.PI / segments);
            
            treeGroup.add(foliage);
        }
        
        // Add small decorative elements for certain zone types (like flowers in forest)
        if (this.zoneType === 'Forest' && Math.random() > 0.7) {
            const flowerMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.accent || 0x8B0000, // Deep Red default
                roughness: 0.7,
                metalness: 0.3,
                emissive: zoneColors.accent || 0x8B0000,
                emissiveIntensity: 0.2
            });
            
            // Add small flower-like decorations
            const flowerCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < flowerCount; i++) {
                const flowerSize = 0.2 + Math.random() * 0.1;
                const flowerGeometry = new THREE.SphereGeometry(flowerSize, 4, 4);
                const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
                
                // Position flowers randomly in the foliage
                const angle = Math.random() * Math.PI * 2;
                const radius = this.foliageSize * 0.7 * Math.random();
                const height = this.trunkHeight + this.foliageSize * (0.5 + Math.random() * 0.5);
                
                flower.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                treeGroup.add(flower);
            }
        }
        
        return treeGroup;
    }
}