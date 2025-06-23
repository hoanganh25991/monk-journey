import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Creates a bridge structure
 */
export class Bridge {
    /**
     * Create a new bridge
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {object} options - Bridge configuration options
     */
    constructor(zoneType = 'Forest', options = {}) {
        this.zoneType = zoneType;
        
        // Default options
        this.options = {
            length: options.length || 10 + Math.random() * 10,
            width: options.width || 3 + Math.random() * 2,
            height: options.height || 1 + Math.random() * 2,
            archHeight: options.archHeight || 2 + Math.random() * 3,
            hasRailing: options.hasRailing !== undefined ? options.hasRailing : Math.random() > 0.3,
            style: options.style || this.getBridgeStyle(zoneType)
        };
    }
    
    /**
     * Get appropriate bridge style based on zone type
     * @param {string} zoneType - The zone type
     * @returns {string} - Bridge style
     */
    getBridgeStyle(zoneType) {
        switch(zoneType) {
            case 'Forest':
                return 'wooden';
            case 'Desert':
                return 'sandstone';
            case 'Mountains':
                return 'stone';
            case 'Swamp':
                return 'wooden';
            case 'Ruins':
                return 'ancient';
            case 'Dark Sanctum':
                return 'obsidian';
            case 'Terrant':
                return Math.random() > 0.5 ? 'stone' : 'wooden';
            default:
                return 'wooden';
        }
    }
    
    /**
     * Create the bridge mesh
     * @returns {THREE.Group} - The bridge group
     */
    createMesh() {
        const bridgeGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Extract options
        const { length, width, height, archHeight, hasRailing, style } = this.options;
        
        // Create the main bridge deck
        this.createBridgeDeck(bridgeGroup, zoneColors, style);
        
        // Create supports/pillars
        this.createBridgeSupports(bridgeGroup, zoneColors, style);
        
        // Create railings if needed
        if (hasRailing) {
            this.createBridgeRailings(bridgeGroup, zoneColors, style);
        }
        
        // Rotate bridge to align with x-axis
        bridgeGroup.rotation.y = Math.PI / 2;
        
        return bridgeGroup;
    }
    
    /**
     * Create the main bridge deck
     * @param {THREE.Group} bridgeGroup - The bridge group
     * @param {object} zoneColors - Colors for the current zone
     * @param {string} style - Bridge style
     */
    createBridgeDeck(bridgeGroup, zoneColors, style) {
        const { length, width, height, archHeight } = this.options;
        
        // Determine bridge material based on style
        let deckColor;
        let roughness = 0.8;
        let metalness = 0.1;
        
        switch(style) {
            case 'wooden':
                deckColor = 0x8B4513; // Brown
                break;
            case 'stone':
                deckColor = zoneColors.rock || 0x808080; // Gray
                roughness = 0.9;
                break;
            case 'sandstone':
                deckColor = zoneColors.structure || 0xEDC9AF; // Tan
                break;
            case 'ancient':
                deckColor = zoneColors.stone || 0xA9A9A9; // Stone Gray
                roughness = 0.95;
                break;
            case 'obsidian':
                deckColor = zoneColors.structure || 0x0C0C0C; // Black
                roughness = 0.6;
                metalness = 0.3;
                break;
            default:
                deckColor = 0x8B4513; // Brown
        }
        
        // Create bridge deck geometry
        const deckGeometry = new THREE.BoxGeometry(length, height, width);
        
        // Apply arch to the bridge if needed
        if (archHeight > 0) {
            const positions = deckGeometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Get x position (along bridge length)
                const x = positions[i];
                
                // Calculate arch height based on position along bridge
                // Maximum height at center, zero at ends
                const normalizedX = x / (length / 2); // -1 to 1
                const archOffset = archHeight * (1 - normalizedX * normalizedX);
                
                // Apply arch offset to y position
                positions[i + 1] += archOffset;
            }
            
            // Update normals
            deckGeometry.computeVertexNormals();
        }
        
        // Create bridge deck material
        const deckMaterial = new THREE.MeshStandardMaterial({
            color: deckColor,
            roughness: roughness,
            metalness: metalness
        });
        
        // Create bridge deck mesh
        const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
        deckMesh.castShadow = true;
        deckMesh.receiveShadow = true;
        
        // Add to bridge group
        bridgeGroup.add(deckMesh);
    }
    
    /**
     * Create bridge supports/pillars
     * @param {THREE.Group} bridgeGroup - The bridge group
     * @param {object} zoneColors - Colors for the current zone
     * @param {string} style - Bridge style
     */
    createBridgeSupports(bridgeGroup, zoneColors, style) {
        const { length, width, height, archHeight } = this.options;
        
        // Determine support material based on style
        let supportColor;
        let roughness = 0.8;
        let metalness = 0.1;
        
        switch(style) {
            case 'wooden':
                supportColor = 0x654321; // Darker Brown
                break;
            case 'stone':
                supportColor = zoneColors.rock ? new THREE.Color(zoneColors.rock).multiplyScalar(0.8).getHex() : 0x696969; // Darker Gray
                roughness = 0.9;
                break;
            case 'sandstone':
                supportColor = zoneColors.structure ? new THREE.Color(zoneColors.structure).multiplyScalar(0.8).getHex() : 0xD2B48C; // Darker Tan
                break;
            case 'ancient':
                supportColor = zoneColors.stone ? new THREE.Color(zoneColors.stone).multiplyScalar(0.8).getHex() : 0x808080; // Darker Stone Gray
                roughness = 0.95;
                break;
            case 'obsidian':
                supportColor = 0x0C0C0C; // Black
                roughness = 0.6;
                metalness = 0.3;
                break;
            default:
                supportColor = 0x654321; // Darker Brown
        }
        
        // Create support material
        const supportMaterial = new THREE.MeshStandardMaterial({
            color: supportColor,
            roughness: roughness,
            metalness: metalness
        });
        
        // Number of supports depends on bridge length
        const supportCount = Math.max(2, Math.floor(length / 5));
        
        for (let i = 0; i < supportCount; i++) {
            // Position along bridge length
            const x = (i / (supportCount - 1) - 0.5) * length;
            
            // Calculate support height based on arch
            let supportHeight = 5; // Base height below water/ground
            
            if (archHeight > 0) {
                // Calculate arch height at this position
                const normalizedX = x / (length / 2); // -1 to 1
                const archOffset = archHeight * (1 - normalizedX * normalizedX);
                supportHeight += archOffset;
            }
            
            // Create support pillar
            const pillarGeometry = new THREE.BoxGeometry(0.5, supportHeight, width * 0.8);
            const pillarMesh = new THREE.Mesh(pillarGeometry, supportMaterial);
            
            // Position pillar
            pillarMesh.position.set(x, -supportHeight / 2 + height / 2, 0);
            
            // Add to bridge group
            pillarMesh.castShadow = true;
            pillarMesh.receiveShadow = true;
            bridgeGroup.add(pillarMesh);
            
            // For wooden or ancient bridges, add cross supports
            if (style === 'wooden' || style === 'ancient') {
                this.createCrossSupports(bridgeGroup, x, supportHeight, width, supportMaterial);
            }
        }
    }
    
    /**
     * Create cross supports for wooden bridges
     * @param {THREE.Group} bridgeGroup - The bridge group
     * @param {number} x - X position
     * @param {number} supportHeight - Height of the main support
     * @param {number} width - Bridge width
     * @param {THREE.Material} material - Support material
     */
    createCrossSupports(bridgeGroup, x, supportHeight, width, material) {
        // Create diagonal cross supports
        const crossLength = Math.sqrt(supportHeight * supportHeight + (width * 0.5) * (width * 0.5));
        const crossGeometry = new THREE.BoxGeometry(0.3, crossLength, 0.3);
        
        // Left diagonal
        const leftCross = new THREE.Mesh(crossGeometry, material);
        leftCross.position.set(x, -supportHeight / 4 + this.options.height / 2, width * 0.25);
        
        // Calculate angle for diagonal
        const angle = Math.atan2(supportHeight, width * 0.5);
        leftCross.rotation.z = angle;
        
        // Right diagonal
        const rightCross = new THREE.Mesh(crossGeometry, material);
        rightCross.position.set(x, -supportHeight / 4 + this.options.height / 2, -width * 0.25);
        rightCross.rotation.z = angle;
        
        // Add to bridge group
        leftCross.castShadow = true;
        rightCross.castShadow = true;
        bridgeGroup.add(leftCross);
        bridgeGroup.add(rightCross);
    }
    
    /**
     * Create bridge railings
     * @param {THREE.Group} bridgeGroup - The bridge group
     * @param {object} zoneColors - Colors for the current zone
     * @param {string} style - Bridge style
     */
    createBridgeRailings(bridgeGroup, zoneColors, style) {
        const { length, width, height, archHeight } = this.options;
        
        // Determine railing material based on style
        let railingColor;
        let roughness = 0.8;
        let metalness = 0.1;
        
        switch(style) {
            case 'wooden':
                railingColor = 0x8B4513; // Brown
                break;
            case 'stone':
                railingColor = zoneColors.rock || 0x808080; // Gray
                roughness = 0.9;
                break;
            case 'sandstone':
                railingColor = zoneColors.structure || 0xEDC9AF; // Tan
                break;
            case 'ancient':
                railingColor = zoneColors.accent || 0xD8BFD8; // Accent color for ancient
                roughness = 0.7;
                metalness = 0.2;
                break;
            case 'obsidian':
                railingColor = zoneColors.accent || 0x8B0000; // Red accent for obsidian
                roughness = 0.6;
                metalness = 0.3;
                break;
            default:
                railingColor = 0x8B4513; // Brown
        }
        
        // Create railing material
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: railingColor,
            roughness: roughness,
            metalness: metalness
        });
        
        // Number of posts depends on bridge length
        const postCount = Math.max(4, Math.floor(length / 2));
        const postHeight = 1.2;
        
        // Create left and right railings
        for (let side = -1; side <= 1; side += 2) {
            // Skip center
            if (side === 0) continue;
            
            // Create posts
            for (let i = 0; i < postCount; i++) {
                // Position along bridge length
                const x = (i / (postCount - 1) - 0.5) * length;
                
                // Calculate post position based on arch
                let postY = height / 2 + postHeight / 2;
                
                if (archHeight > 0) {
                    // Calculate arch height at this position
                    const normalizedX = x / (length / 2); // -1 to 1
                    const archOffset = archHeight * (1 - normalizedX * normalizedX);
                    postY += archOffset;
                }
                
                // Create post
                const postGeometry = new THREE.BoxGeometry(0.2, postHeight, 0.2);
                const postMesh = new THREE.Mesh(postGeometry, railingMaterial);
                
                // Position post
                postMesh.position.set(x, postY, side * (width / 2 - 0.1));
                
                // Add to bridge group
                postMesh.castShadow = true;
                bridgeGroup.add(postMesh);
                
                // Add horizontal railings between posts (except for last post)
                if (i < postCount - 1) {
                    const nextX = ((i + 1) / (postCount - 1) - 0.5) * length;
                    const railLength = nextX - x;
                    
                    // Calculate next post Y position for arch
                    let nextPostY = height / 2 + postHeight / 2;
                    
                    if (archHeight > 0) {
                        const nextNormalizedX = nextX / (length / 2);
                        const nextArchOffset = archHeight * (1 - nextNormalizedX * nextNormalizedX);
                        nextPostY += nextArchOffset;
                    }
                    
                    // Create horizontal rail
                    const railGeometry = new THREE.BoxGeometry(railLength, 0.15, 0.15);
                    const railMesh = new THREE.Mesh(railGeometry, railingMaterial);
                    
                    // Position rail between posts, accounting for arch
                    railMesh.position.set(
                        x + railLength / 2,
                        postY + postHeight / 2 - 0.1 + (nextPostY - postY) / 2,
                        side * (width / 2 - 0.1)
                    );
                    
                    // Rotate rail to follow arch if needed
                    if (archHeight > 0) {
                        const angle = Math.atan2(nextPostY - postY, railLength);
                        railMesh.rotation.z = angle;
                    }
                    
                    // Add to bridge group
                    railMesh.castShadow = true;
                    bridgeGroup.add(railMesh);
                }
            }
        }
    }
}