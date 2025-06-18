import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a moss environment object
 * Creates patches of moss that can grow on various surfaces
 */
export class Moss extends EnvironmentObject {
    /**
     * Create a new moss patch
     * @param {THREE.Scene} scene - The scene to add the moss to
     * @param {Object} MapManager - The map manager
     * @param {THREE.Vector3} position - The position of the moss
     * @param {number} size - The size of the moss patch
     */
    constructor(scene, MapManager, position, size = 1) {
        super(scene, MapManager, position, size, 'moss');
        
        // Randomize moss properties
        this.patchType = Math.floor(Math.random() * 3); // 0: ground, 1: rock, 2: tree
        this.hasMushrooms = Math.random() > 0.6; // 40% chance to have small mushrooms
        this.hasGlow = Math.random() > 0.7; // 30% chance to have bioluminescent properties
        
        // Get zone type from map manager's zone manager if available
        this.zoneType = 'Forest'; // Default to Forest
        
        // Try to get the zone type from the zone manager
        if (MapManager && MapManager.zoneManager) {
            const zone = MapManager.zoneManager.getZoneAt(position);
            if (zone && zone.name) {
                this.zoneType = zone.name;
            }
        }
        
        // Create the moss
        this.object = this.create();
    }
    
    /**
     * Create the moss mesh
     * @returns {THREE.Group} - The moss group
     */
    create() {
        const mossGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Determine moss color based on zone
        let mossColor, mushroomColor, glowColor;
        let emissiveIntensity = this.hasGlow ? 0.5 : 0;
        
        switch(this.zoneType) {
            case 'Forest':
                mossColor = 0x6B8E23; // Olive Drab
                mushroomColor = 0xFFFFE0; // Light Yellow
                glowColor = 0x7FFF00; // Chartreuse
                break;
            case 'Swamp':
                mossColor = 0x556B2F; // Dark Olive Green
                mushroomColor = 0xE0FFFF; // Light Cyan
                glowColor = 0x40E0D0; // Turquoise
                break;
            case 'Mountain':
                mossColor = 0x8FBC8F; // Dark Sea Green
                mushroomColor = 0xF0FFFF; // Azure
                glowColor = 0xADD8E6; // Light Blue
                break;
            case 'Ruins':
                mossColor = 0x8F9779; // Moss Green
                mushroomColor = 0xDDA0DD; // Plum
                glowColor = 0xD8BFD8; // Thistle
                break;
            case 'Desert':
                mossColor = 0x9ACD32; // Yellow Green (rare desert moss)
                mushroomColor = 0xF4A460; // Sandy Brown
                glowColor = 0xFFA500; // Orange
                break;
            case 'Dark Sanctum':
                mossColor = 0x5C4033; // Charred Brown
                mushroomColor = 0x8B0000; // Dark Red
                glowColor = 0xE3CF57; // Sulfur Yellow
                emissiveIntensity = this.hasGlow ? 0.7 : 0;
                break;
            case 'Enchanted Grove':
                mossColor = 0x006400; // Dark Green
                mushroomColor = 0x00FFFF; // Cyan
                glowColor = 0x7FFFD4; // Aquamarine
                emissiveIntensity = this.hasGlow ? 0.8 : 0.2;
                break;
            default:
                mossColor = 0x6B8E23; // Olive Drab
                mushroomColor = 0xFFFFE0; // Light Yellow
                glowColor = 0x7FFF00; // Chartreuse
        }
        
        // Create moss material with potential glow
        const mossMaterial = new THREE.MeshStandardMaterial({
            color: mossColor,
            roughness: 0.9,
            metalness: 0.1,
            emissive: this.hasGlow ? glowColor : 0x000000,
            emissiveIntensity: emissiveIntensity
        });
        
        // Create base object based on patch type
        let baseObject;
        
        switch(this.patchType) {
            case 0: // Ground moss
                // Create a flat, irregular patch
                const groundGeometry = new THREE.CircleGeometry(this.size * 1.2, 8);
                baseObject = new THREE.Mesh(groundGeometry, mossMaterial);
                baseObject.rotation.x = -Math.PI / 2; // Lay flat on ground
                baseObject.position.y = 0.01; // Slightly above ground to prevent z-fighting
                break;
                
            case 1: // Rock moss
                // Create a rock with moss on top
                const rockGeometry = new THREE.SphereGeometry(
                    this.size * 0.7,
                    8,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2
                );
                
                const rockMaterial = new THREE.MeshStandardMaterial({
                    color: zoneColors.rock || 0x708090,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.rotation.x = Math.PI / 2;
                rock.position.y = this.size * 0.35;
                
                // Create moss on top of rock
                const rockMossGeometry = new THREE.CircleGeometry(this.size * 0.6, 8);
                const rockMoss = new THREE.Mesh(rockMossGeometry, mossMaterial);
                rockMoss.rotation.x = -Math.PI / 2;
                rockMoss.position.y = this.size * 0.71;
                
                baseObject = new THREE.Group();
                baseObject.add(rock);
                baseObject.add(rockMoss);
                break;
                
            case 2: // Tree moss
                // Create a tree trunk section with moss
                const trunkGeometry = new THREE.CylinderGeometry(
                    this.size * 0.5,
                    this.size * 0.5,
                    this.size * 1.2,
                    8
                );
                
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: zoneColors.trunk || 0x8B4513,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.rotation.x = Math.PI / 2; // Lay horizontally
                trunk.position.y = this.size * 0.5;
                
                // Create moss patches on trunk
                const treeMossGroup = new THREE.Group();
                
                // Add 3-5 moss patches
                const patchCount = 3 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < patchCount; i++) {
                    const angle = Math.random() * Math.PI; // Top half of trunk
                    const patchGeometry = new THREE.CircleGeometry(this.size * (0.2 + Math.random() * 0.2), 8);
                    const patch = new THREE.Mesh(patchGeometry, mossMaterial);
                    
                    // Position patch on trunk surface
                    patch.position.x = Math.cos(angle) * this.size * 0.5;
                    patch.position.y = this.size * 0.5 + (Math.random() - 0.5) * this.size * 0.8;
                    patch.position.z = Math.sin(angle) * this.size * 0.5;
                    
                    // Orient patch to face outward from trunk
                    patch.lookAt(new THREE.Vector3(
                        patch.position.x * 2,
                        patch.position.y,
                        patch.position.z * 2
                    ));
                    
                    treeMossGroup.add(patch);
                }
                
                baseObject = new THREE.Group();
                baseObject.add(trunk);
                baseObject.add(treeMossGroup);
                break;
                
            default:
                // Default to ground moss
                const defaultGeometry = new THREE.CircleGeometry(this.size, 8);
                baseObject = new THREE.Mesh(defaultGeometry, mossMaterial);
                baseObject.rotation.x = -Math.PI / 2;
                baseObject.position.y = 0.01;
        }
        
        mossGroup.add(baseObject);
        
        // Add small details to make the moss more interesting
        if (this.patchType === 0 || this.patchType === 1) {
            // Add small tufts of moss for ground or rock moss
            const tuftCount = 5 + Math.floor(Math.random() * 6);
            
            for (let i = 0; i < tuftCount; i++) {
                const tuftGeometry = new THREE.SphereGeometry(
                    this.size * (0.1 + Math.random() * 0.1),
                    6,
                    6
                );
                
                const tuft = new THREE.Mesh(tuftGeometry, mossMaterial);
                
                // Position tuft randomly within the moss patch
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.size * (this.patchType === 0 ? 1 : 0.5);
                
                tuft.position.x = Math.cos(angle) * radius;
                tuft.position.z = Math.sin(angle) * radius;
                
                // Set height based on patch type
                if (this.patchType === 0) {
                    tuft.position.y = this.size * 0.1;
                } else {
                    tuft.position.y = this.size * 0.71 + this.size * 0.1;
                }
                
                mossGroup.add(tuft);
            }
        }
        
        // Add mushrooms if enabled
        if (this.hasMushrooms) {
            const mushroomMaterial = new THREE.MeshStandardMaterial({
                color: mushroomColor,
                roughness: 0.7,
                metalness: 0.2
            });
            
            const capMaterial = new THREE.MeshStandardMaterial({
                color: this.hasGlow ? glowColor : mushroomColor,
                roughness: 0.5,
                metalness: 0.3,
                emissive: this.hasGlow ? glowColor : 0x000000,
                emissiveIntensity: emissiveIntensity
            });
            
            // Add 2-4 mushrooms
            const mushroomCount = 2 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < mushroomCount; i++) {
                // Create stem
                const stemHeight = this.size * (0.1 + Math.random() * 0.15);
                const stemRadius = this.size * 0.03;
                
                const stemGeometry = new THREE.CylinderGeometry(
                    stemRadius * 0.7,
                    stemRadius,
                    stemHeight,
                    8
                );
                
                const stem = new THREE.Mesh(stemGeometry, mushroomMaterial);
                
                // Create cap
                const capRadius = stemRadius * (2 + Math.random());
                const capGeometry = new THREE.SphereGeometry(
                    capRadius,
                    8,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2
                );
                
                const cap = new THREE.Mesh(capGeometry, capMaterial);
                cap.rotation.x = Math.PI / 2;
                cap.position.y = stemHeight / 2;
                
                // Group stem and cap
                const mushroom = new THREE.Group();
                mushroom.add(stem);
                mushroom.add(cap);
                
                // Position mushroom based on patch type
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.size * (this.patchType === 0 ? 0.9 : 0.4);
                
                mushroom.position.x = Math.cos(angle) * radius;
                mushroom.position.z = Math.sin(angle) * radius;
                
                // Set height based on patch type
                if (this.patchType === 0) {
                    mushroom.position.y = stemHeight / 2;
                } else if (this.patchType === 1) {
                    mushroom.position.y = this.size * 0.71;
                } else {
                    // For tree moss, position on the trunk surface
                    const trunkAngle = Math.random() * Math.PI;
                    mushroom.position.x = Math.cos(trunkAngle) * this.size * 0.5;
                    mushroom.position.y = this.size * 0.5 + (Math.random() - 0.5) * this.size * 0.7;
                    mushroom.position.z = Math.sin(trunkAngle) * this.size * 0.5;
                    
                    // Orient mushroom to grow outward from trunk
                    mushroom.lookAt(new THREE.Vector3(
                        mushroom.position.x * 2,
                        mushroom.position.y,
                        mushroom.position.z * 2
                    ));
                }
                
                mossGroup.add(mushroom);
                
                // Add tiny point light for glowing mushrooms
                if (this.hasGlow) {
                    const light = new THREE.PointLight(glowColor, 0.5, this.size);
                    light.position.copy(cap.position);
                    light.position.y += capRadius * 0.5;
                    mushroom.add(light);
                }
            }
        }
        
        // Add ambient glow if the moss is bioluminescent
        if (this.hasGlow) {
            const glowIntensity = 0.7;
            const glowRadius = this.size * (this.patchType === 0 ? 2 : 1.5);
            
            const light = new THREE.PointLight(glowColor, glowIntensity, glowRadius);
            
            // Position light based on patch type
            if (this.patchType === 0) {
                light.position.y = this.size * 0.2;
            } else if (this.patchType === 1) {
                light.position.y = this.size * 0.8;
            } else {
                light.position.y = this.size * 0.5;
            }
            
            mossGroup.add(light);
        }
        
        // Position the entire moss patch at the specified position
        mossGroup.position.copy(this.position);
        
        return mossGroup;
    }
}