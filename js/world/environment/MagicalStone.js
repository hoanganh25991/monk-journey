import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a magical stone environment object
 * These stones have mystical properties and emit light
 */
export class MagicalStone extends EnvironmentObject {
    /**
     * Create a new magical stone
     * @param {THREE.Scene} scene - The scene to add the stone to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the stone
     * @param {number} size - The size of the stone
     */
    constructor(scene, worldManager, position, size = 1) {
        super(scene, worldManager, position, size, 'magical_stone');
        
        // Randomize stone properties
        this.stoneType = Math.floor(Math.random() * 3); // 0: rounded, 1: angular, 2: floating
        this.hasRunes = Math.random() > 0.5; // 50% chance to have runes
        this.pulseEffect = Math.random() > 0.3; // 70% chance to have pulsing effect
        
        // Get zone type from world manager if available
        const zone = worldManager?.getZoneAt?.(position);
        this.zoneType = zone?.name || 'Forest';
        
        // Create the stone
        this.object = this.create();
    }
    
    /**
     * Create the magical stone mesh
     * @returns {THREE.Group} - The magical stone group
     */
    create() {
        const stoneGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Determine stone color based on zone
        let stoneColor, glowColor, runeColor;
        let emissiveIntensity = 0.6;
        
        switch(this.zoneType) {
            case 'Forest':
                stoneColor = 0x4682B4; // Steel Blue
                glowColor = 0x00FFFF; // Cyan
                runeColor = 0x7FFFD4; // Aquamarine
                break;
            case 'Desert':
                stoneColor = 0xCD853F; // Peru
                glowColor = 0xFFD700; // Gold
                runeColor = 0xFFA500; // Orange
                break;
            case 'Mountains':
                stoneColor = 0xB0C4DE; // Light Steel Blue
                glowColor = 0xE0FFFF; // Light Cyan
                runeColor = 0xADD8E6; // Light Blue
                break;
            case 'Swamp':
                stoneColor = 0x2F4F4F; // Dark Slate Gray
                glowColor = 0x7CFC00; // Lawn Green
                runeColor = 0x32CD32; // Lime Green
                break;
            case 'Ruins':
                stoneColor = 0x708090; // Slate Gray
                glowColor = 0xFF00FF; // Magenta
                runeColor = 0xBA55D3; // Medium Orchid
                break;
            case 'Dark Sanctum':
                stoneColor = 0x36454F; // Charcoal
                glowColor = 0x9400D3; // Dark Violet
                runeColor = 0x8A2BE2; // Blue Violet
                emissiveIntensity = 0.8;
                break;
            case 'Crystal Caverns':
                stoneColor = 0x4B0082; // Indigo
                glowColor = 0xE0FFFF; // Light Cyan
                runeColor = 0x9400D3; // Dark Violet
                emissiveIntensity = 0.9;
                break;
            default:
                stoneColor = 0x4682B4; // Steel Blue
                glowColor = 0x00FFFF; // Cyan
                runeColor = 0x7FFFD4; // Aquamarine
        }
        
        // Create stone geometry based on type
        let stoneGeometry;
        
        switch(this.stoneType) {
            case 0: // Rounded stone
                stoneGeometry = new THREE.DodecahedronGeometry(this.size * 0.7, 0);
                break;
            case 1: // Angular stone
                stoneGeometry = new THREE.OctahedronGeometry(this.size * 0.7, 0);
                break;
            case 2: // Floating stone (still use a geometric shape)
                stoneGeometry = new THREE.IcosahedronGeometry(this.size * 0.7, 0);
                break;
            default:
                stoneGeometry = new THREE.DodecahedronGeometry(this.size * 0.7, 0);
        }
        
        // Create stone material with glow
        const stoneMaterial = new THREE.MeshStandardMaterial({
            color: stoneColor,
            roughness: 0.4,
            metalness: 0.6,
            emissive: glowColor,
            emissiveIntensity: emissiveIntensity * 0.3
        });
        
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        // Add slight random rotation
        stone.rotation.x = Math.random() * Math.PI;
        stone.rotation.y = Math.random() * Math.PI;
        stone.rotation.z = Math.random() * Math.PI;
        
        stoneGroup.add(stone);
        
        // If it's a floating stone, add a base and hover effect
        if (this.stoneType === 2) {
            // Create a base
            const baseGeometry = new THREE.CylinderGeometry(
                this.size * 0.5,
                this.size * 0.6,
                this.size * 0.2,
                8
            );
            
            const baseMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.rock || 0x708090,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = -this.size * 0.5;
            base.castShadow = true;
            base.receiveShadow = true;
            
            stoneGroup.add(base);
            
            // Position the stone to float above the base
            stone.position.y = this.size * 0.3;
            
            // Add glow effect under the floating stone
            const glowGeometry = new THREE.SphereGeometry(this.size * 0.3, 16, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.7
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = -this.size * 0.1;
            stoneGroup.add(glow);
        }
        
        // Add runes if enabled
        if (this.hasRunes) {
            // Create rune material
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: runeColor,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            // Add 3-5 rune symbols around the stone
            const runeCount = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < runeCount; i++) {
                // Create a simple rune as a plane with a circular shape
                const runeGeometry = new THREE.PlaneGeometry(this.size * 0.2, this.size * 0.2);
                const rune = new THREE.Mesh(runeGeometry, runeMaterial);
                
                // Position rune on the stone surface
                const angle = (i / runeCount) * Math.PI * 2;
                const radius = this.size * 0.71; // Just outside the stone surface
                
                rune.position.x = Math.cos(angle) * radius;
                rune.position.z = Math.sin(angle) * radius;
                rune.position.y = this.stoneType === 2 ? stone.position.y : 0;
                
                // Orient rune to face outward
                rune.lookAt(new THREE.Vector3(
                    rune.position.x * 2,
                    rune.position.y,
                    rune.position.z * 2
                ));
                
                stoneGroup.add(rune);
            }
        }
        
        // Add point light for glow effect
        const light = new THREE.PointLight(glowColor, 1, this.size * 5);
        light.position.y = this.stoneType === 2 ? stone.position.y : 0;
        stoneGroup.add(light);
        
        // Position the entire stone at the specified position
        stoneGroup.position.copy(this.position);
        
        return stoneGroup;
    }
}