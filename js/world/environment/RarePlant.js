import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a rare plant environment object with unique properties
 * These plants are special and have magical/glowing properties
 */
export class RarePlant extends EnvironmentObject {
    /**
     * Create a new rare plant
     * @param {THREE.Scene} scene - The scene to add the plant to
     * @param {Object} MapManager - The world manager
     * @param {THREE.Vector3} position - The position of the plant
     * @param {number} size - The size of the plant
     */
    constructor(scene, MapManager, position, size = 1) {
        super(scene, MapManager, position, size, 'rare_plant');
        
        // Randomize plant properties
        this.plantHeight = 0.8 + Math.random() * 1.2;
        this.stemCount = 2 + Math.floor(Math.random() * 3);
        this.hasFlowers = Math.random() > 0.3; // 70% chance to have flowers
        
        // Get zone type from world manager if available
        this.zoneType = MapManager?.getCurrentZoneType(position) || 'Forest';
        
        // Create the plant
        this.object = this.create();
    }
    
    /**
     * Create the rare plant mesh
     * @returns {THREE.Group} - The rare plant group
     */
    create() {
        const plantGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Determine plant color based on zone
        let plantColor, flowerColor, glowColor;
        let emissiveIntensity = 0.5;
        
        switch(this.zoneType) {
            case 'Forest':
                plantColor = 0x9370DB; // Medium Purple
                flowerColor = 0x00FFFF; // Cyan
                glowColor = 0x7FFFD4; // Aquamarine
                break;
            case 'Desert':
                plantColor = 0xFF7F50; // Coral
                flowerColor = 0xFFD700; // Gold
                glowColor = 0xFFA500; // Orange
                break;
            case 'Mountains':
                plantColor = 0x87CEFA; // Light Sky Blue
                flowerColor = 0xE0FFFF; // Light Cyan
                glowColor = 0xADD8E6; // Light Blue
                break;
            case 'Swamp':
                plantColor = 0x9ACD32; // Yellow Green
                flowerColor = 0x7CFC00; // Lawn Green
                glowColor = 0x32CD32; // Lime Green
                break;
            case 'Ruins':
                plantColor = 0xDDA0DD; // Plum
                flowerColor = 0xFF00FF; // Magenta
                glowColor = 0xBA55D3; // Medium Orchid
                break;
            case 'Dark Sanctum':
                plantColor = 0x800080; // Purple
                flowerColor = 0x9400D3; // Dark Violet
                glowColor = 0x8A2BE2; // Blue Violet
                emissiveIntensity = 0.8;
                break;
            case 'Enchanted Grove':
                plantColor = 0x00FA9A; // Medium Spring Green
                flowerColor = 0x00FFFF; // Cyan
                glowColor = 0x7FFFD4; // Aquamarine
                emissiveIntensity = 0.9;
                break;
            default:
                plantColor = 0x9370DB; // Medium Purple
                flowerColor = 0x00FFFF; // Cyan
                glowColor = 0x7FFFD4; // Aquamarine
        }
        
        // Create base/soil
        const baseGeometry = new THREE.CylinderGeometry(this.size * 0.4, this.size * 0.5, this.size * 0.2, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.ground || 0x8F9779,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = this.size * 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        
        plantGroup.add(base);
        
        // Create plant material with glow
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: plantColor,
            roughness: 0.7,
            metalness: 0.2,
            emissive: plantColor,
            emissiveIntensity: emissiveIntensity * 0.3
        });
        
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: flowerColor,
            roughness: 0.3,
            metalness: 0.5,
            emissive: flowerColor,
            emissiveIntensity: emissiveIntensity
        });
        
        // Create multiple stems
        for (let i = 0; i < this.stemCount; i++) {
            // Create stem
            const stemHeight = this.plantHeight * this.size * (0.7 + Math.random() * 0.6);
            const stemWidth = this.size * (0.05 + Math.random() * 0.1);
            
            const stemGeometry = new THREE.CylinderGeometry(
                stemWidth * 0.7, // top radius
                stemWidth, // bottom radius
                stemHeight, // height
                8 // radial segments
            );
            
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Position stem on the base with random placement
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.size * 0.25;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = stemHeight / 2 + this.size * 0.2;
            
            stem.position.set(x, y, z);
            
            // Random slight tilt
            stem.rotation.x = (Math.random() - 0.5) * 0.3;
            stem.rotation.z = (Math.random() - 0.5) * 0.3;
            
            stem.castShadow = true;
            
            plantGroup.add(stem);
            
            // Add leaves to stem
            const leafCount = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < leafCount; j++) {
                const leafGeometry = new THREE.SphereGeometry(
                    stemWidth * 2,
                    8,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2
                );
                
                const leaf = new THREE.Mesh(leafGeometry, stemMaterial);
                
                // Position leaf along the stem
                const leafHeight = (j + 1) / (leafCount + 1) * stemHeight;
                leaf.position.set(
                    stem.position.x,
                    stem.position.y - stemHeight / 2 + leafHeight,
                    stem.position.z
                );
                
                // Rotate leaf outward from stem
                const leafAngle = Math.random() * Math.PI * 2;
                leaf.rotation.y = leafAngle;
                leaf.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                
                leaf.castShadow = true;
                
                plantGroup.add(leaf);
            }
            
            // Add flower if this plant has flowers
            if (this.hasFlowers) {
                const flowerSize = stemWidth * (2 + Math.random() * 2);
                const flowerGeometry = new THREE.DodecahedronGeometry(flowerSize, 0);
                const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
                
                // Position flower at top of stem
                flower.position.set(
                    stem.position.x,
                    stem.position.y + stemHeight / 2 + flowerSize * 0.5,
                    stem.position.z
                );
                
                flower.castShadow = true;
                
                plantGroup.add(flower);
                
                // Add point light for glow effect
                const light = new THREE.PointLight(glowColor, 0.7, this.size * 3);
                light.position.copy(flower.position);
                plantGroup.add(light);
            }
        }
        
        // Position the entire plant at the specified position
        plantGroup.position.copy(this.position);
        
        return plantGroup;
    }
}