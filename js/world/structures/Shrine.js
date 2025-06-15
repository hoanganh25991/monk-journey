import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Creates a shrine structure
 */
export class Shrine {
    /**
     * Create a new shrine
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {object} options - Shrine configuration options
     */
    constructor(zoneType = 'Forest', options = {}) {
        this.zoneType = zoneType;
        
        // Default options
        this.options = {
            size: options.size || 3 + Math.random() * 2, // Size between 3-5 units
            height: options.height || 4 + Math.random() * 3, // Height between 4-7 units
            style: options.style || this.getShrineStyle(zoneType),
            hasOfferings: options.hasOfferings !== undefined ? options.hasOfferings : Math.random() > 0.3,
            hasTorches: options.hasTorches !== undefined ? options.hasTorches : Math.random() > 0.5
        };
    }
    
    /**
     * Get appropriate shrine style based on zone type
     * @param {string} zoneType - The zone type
     * @returns {string} - Shrine style
     */
    getShrineStyle(zoneType) {
        switch(zoneType) {
            case 'Forest':
                return 'wooden';
            case 'Desert':
                return 'sandstone';
            case 'Mountains':
                return 'stone';
            case 'Swamp':
                return 'moss';
            case 'Ruins':
                return 'ancient';
            case 'Dark Sanctum':
                return 'obsidian';
            default:
                return 'wooden';
        }
    }
    
    /**
     * Create the shrine mesh
     * @returns {THREE.Group} - The shrine group
     */
    createMesh() {
        const shrineGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Extract options
        const { size, height, style, hasOfferings, hasTorches } = this.options;
        
        // Create base platform
        this.createBase(shrineGroup, zoneColors, style);
        
        // Create main shrine structure
        this.createShrineStructure(shrineGroup, zoneColors, style);
        
        // Create decorative elements
        if (hasOfferings) {
            this.createOfferings(shrineGroup, zoneColors);
        }
        
        // Create torches if needed
        if (hasTorches) {
            this.createTorches(shrineGroup, zoneColors);
        }
        
        return shrineGroup;
    }
    
    /**
     * Create the base platform for the shrine
     * @param {THREE.Group} shrineGroup - The shrine group
     * @param {object} zoneColors - Colors for the current zone
     * @param {string} style - Shrine style
     */
    createBase(shrineGroup, zoneColors, style) {
        const { size } = this.options;
        
        // Determine base material based on style
        let baseColor;
        let roughness = 0.8;
        let metalness = 0.1;
        
        switch(style) {
            case 'wooden':
                baseColor = 0x8B4513; // Brown
                roughness = 0.9;
                break;
            case 'stone':
                baseColor = zoneColors.rock || 0x808080; // Gray
                roughness = 0.9;
                break;
            case 'sandstone':
                baseColor = zoneColors.structure || 0xEDC9AF; // Tan
                break;
            case 'moss':
                baseColor = 0x556B2F; // Dark Olive Green
                roughness = 0.95;
                break;
            case 'ancient':
                baseColor = zoneColors.stone || 0xA9A9A9; // Stone Gray
                roughness = 0.95;
                break;
            case 'obsidian':
                baseColor = zoneColors.structure || 0x0C0C0C; // Black
                roughness = 0.6;
                metalness = 0.3;
                break;
            default:
                baseColor = 0x8B4513; // Brown
        }
        
        // Create base material
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: roughness,
            metalness: metalness
        });
        
        // Create stepped base (3 layers)
        for (let i = 0; i < 3; i++) {
            const layerSize = size * (1 - i * 0.2);
            const layerHeight = 0.2;
            const layerY = i * layerHeight;
            
            const baseGeometry = new THREE.BoxGeometry(layerSize, layerHeight, layerSize);
            const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
            baseMesh.position.set(0, layerY, 0);
            baseMesh.receiveShadow = true;
            
            shrineGroup.add(baseMesh);
        }
    }
    
    /**
     * Create the main shrine structure
     * @param {THREE.Group} shrineGroup - The shrine group
     * @param {object} zoneColors - Colors for the current zone
     * @param {string} style - Shrine style
     */
    createShrineStructure(shrineGroup, zoneColors, style) {
        const { size, height } = this.options;
        
        // Determine structure material based on style
        let structureColor;
        let roofColor;
        let roughness = 0.8;
        let metalness = 0.1;
        
        switch(style) {
            case 'wooden':
                structureColor = 0x8B4513; // Brown
                roofColor = 0x8B0000; // Dark Red
                roughness = 0.9;
                break;
            case 'stone':
                structureColor = zoneColors.rock || 0x808080; // Gray
                roofColor = 0x696969; // Darker Gray
                roughness = 0.9;
                break;
            case 'sandstone':
                structureColor = zoneColors.structure || 0xEDC9AF; // Tan
                roofColor = 0xCD853F; // Peru
                break;
            case 'moss':
                structureColor = 0x556B2F; // Dark Olive Green
                roofColor = 0x2F4F4F; // Dark Slate Gray
                roughness = 0.95;
                break;
            case 'ancient':
                structureColor = zoneColors.stone || 0xA9A9A9; // Stone Gray
                roofColor = 0x708090; // Slate Gray
                roughness = 0.95;
                break;
            case 'obsidian':
                structureColor = zoneColors.structure || 0x0C0C0C; // Black
                roofColor = 0x4B0082; // Indigo
                roughness = 0.6;
                metalness = 0.3;
                break;
            default:
                structureColor = 0x8B4513; // Brown
                roofColor = 0x8B0000; // Dark Red
        }
        
        // Create structure materials
        const structureMaterial = new THREE.MeshStandardMaterial({
            color: structureColor,
            roughness: roughness,
            metalness: metalness
        });
        
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: roofColor,
            roughness: roughness,
            metalness: metalness
        });
        
        // Create main structure (pagoda style)
        const baseY = 0.6; // Height of the base
        const structureWidth = size * 0.6;
        const structureDepth = size * 0.6;
        const structureHeight = height * 0.6;
        
        // Create main structure body
        const structureGeometry = new THREE.BoxGeometry(structureWidth, structureHeight, structureDepth);
        const structureMesh = new THREE.Mesh(structureGeometry, structureMaterial);
        structureMesh.position.set(0, baseY + structureHeight / 2, 0);
        structureMesh.castShadow = true;
        structureMesh.receiveShadow = true;
        
        shrineGroup.add(structureMesh);
        
        // Create pagoda-style roof
        const roofLayers = 3;
        const roofHeight = height * 0.4 / roofLayers;
        
        for (let i = 0; i < roofLayers; i++) {
            const roofWidth = structureWidth * (1.5 - i * 0.3);
            const roofDepth = structureDepth * (1.5 - i * 0.3);
            const roofY = baseY + structureHeight + i * roofHeight;
            
            // Create roof layer
            const roofGeometry = new THREE.BoxGeometry(roofWidth, roofHeight, roofDepth);
            const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
            roofMesh.position.set(0, roofY + roofHeight / 2, 0);
            roofMesh.castShadow = true;
            
            shrineGroup.add(roofMesh);
        }
        
        // Create decorative spire on top
        const spireHeight = height * 0.2;
        const spireGeometry = new THREE.ConeGeometry(0.2, spireHeight, 8);
        const spireMesh = new THREE.Mesh(spireGeometry, roofMaterial);
        spireMesh.position.set(0, baseY + structureHeight + roofLayers * roofHeight + spireHeight / 2, 0);
        spireMesh.castShadow = true;
        
        shrineGroup.add(spireMesh);
        
        // Create entrance (opening in the front)
        const doorWidth = structureWidth * 0.4;
        const doorHeight = structureHeight * 0.6;
        const doorDepth = structureDepth * 0.1;
        
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const doorMesh = new THREE.Mesh(doorGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
        doorMesh.position.set(0, baseY + doorHeight / 2, structureDepth / 2);
        
        shrineGroup.add(doorMesh);
    }
    
    /**
     * Create offerings at the shrine
     * @param {THREE.Group} shrineGroup - The shrine group
     * @param {object} zoneColors - Colors for the current zone
     */
    createOfferings(shrineGroup, zoneColors) {
        const { size } = this.options;
        const baseY = 0.6; // Height of the base
        
        // Create offering bowl
        const bowlGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16);
        const bowlMaterial = new THREE.MeshStandardMaterial({
            color: 0xB87333, // Copper
            roughness: 0.5,
            metalness: 0.8
        });
        
        const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
        bowl.position.set(0, baseY + 0.1, size * 0.4);
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        
        shrineGroup.add(bowl);
        
        // Create offerings inside the bowl (fruits, flowers, etc.)
        const offeringColors = [0xFF0000, 0xFFFF00, 0xFFA500, 0x800080, 0xFFC0CB];
        
        for (let i = 0; i < 5; i++) {
            const offeringSize = 0.1;
            const offeringGeometry = new THREE.SphereGeometry(offeringSize, 8, 8);
            const offeringMaterial = new THREE.MeshStandardMaterial({
                color: offeringColors[i % offeringColors.length],
                roughness: 0.8,
                metalness: 0.2
            });
            
            const offering = new THREE.Mesh(offeringGeometry, offeringMaterial);
            
            // Position offerings in a circular pattern inside the bowl
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.15;
            
            offering.position.set(
                Math.cos(angle) * radius,
                baseY + 0.25,
                size * 0.4 + Math.sin(angle) * radius
            );
            
            offering.castShadow = true;
            
            shrineGroup.add(offering);
        }
        
        // Create incense sticks
        for (let i = 0; i < 3; i++) {
            const stickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
            const stickMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.9,
                metalness: 0.1
            });
            
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            
            // Position sticks in a row in front of the bowl
            const offset = (i - 1) * 0.1;
            
            stick.position.set(offset, baseY + 0.25, size * 0.5);
            stick.rotation.x = Math.PI / 6; // Tilt slightly
            
            stick.castShadow = true;
            
            shrineGroup.add(stick);
            
            // Add smoke particle effect
            const smokeMaterial = new THREE.SpriteMaterial({
                color: 0xCCCCCC,
                transparent: true,
                opacity: 0.5
            });
            
            const smoke = new THREE.Sprite(smokeMaterial);
            smoke.scale.set(0.1, 0.2, 1);
            smoke.position.set(offset, baseY + 0.5, size * 0.5 + 0.1);
            
            shrineGroup.add(smoke);
        }
    }
    
    /**
     * Create torches around the shrine
     * @param {THREE.Group} shrineGroup - The shrine group
     * @param {object} zoneColors - Colors for the current zone
     */
    createTorches(shrineGroup, zoneColors) {
        const { size } = this.options;
        const baseY = 0.6; // Height of the base
        
        // Create torches at the corners
        for (let i = 0; i < 4; i++) {
            // Calculate corner position
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const radius = size * 0.4;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create torch pole
            const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
            const poleMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.9,
                metalness: 0.1
            });
            
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(x, baseY + 0.75, z);
            pole.castShadow = true;
            
            shrineGroup.add(pole);
            
            // Create torch fire
            const fireGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const fireMaterial = new THREE.MeshStandardMaterial({
                color: 0xFF4500, // Orange Red
                emissive: 0xFF4500,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.9
            });
            
            const fire = new THREE.Mesh(fireGeometry, fireMaterial);
            fire.position.set(x, baseY + 1.5, z);
            
            // Add point light for torch
            const light = new THREE.PointLight(0xFF4500, 1, 3);
            light.position.copy(fire.position);
            
            shrineGroup.add(fire);
            shrineGroup.add(light);
        }
    }
}