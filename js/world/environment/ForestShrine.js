import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a forest shrine environment object
 * A sacred structure found in forest environments
 */
export class ForestShrine extends EnvironmentObject {
    /**
     * Create a new forest shrine
     * @param {THREE.Scene} scene - The scene to add the shrine to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the shrine
     * @param {number} size - The size of the shrine
     */
    constructor(scene, worldManager, position, size = 1) {
        super(scene, worldManager, position, size, 'forest_shrine');
        
        // Randomize shrine properties
        this.shrineType = Math.floor(Math.random() * 3); // 0: stone circle, 1: wooden altar, 2: tree shrine
        this.hasGlowingElements = Math.random() > 0.4; // 60% chance to have glowing elements
        this.hasMoss = Math.random() > 0.3; // 70% chance to have moss
        
        // Get zone type from world manager if available
        this.zoneType = worldManager?.getZoneTypeAt(position.x, position.z) || 'Forest';
        
        // Create the shrine
        this.object = this.create();
    }
    
    /**
     * Create the forest shrine mesh
     * @returns {THREE.Group} - The forest shrine group
     */
    create() {
        const shrineGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Determine colors
        const woodColor = zoneColors.wood || 0x8B4513; // SaddleBrown
        const stoneColor = zoneColors.stone || 0x808080; // Gray
        const mossColor = zoneColors.vegetation || 0x2E8B57; // SeaGreen
        const glowColor = 0x7CFC00; // LawnGreen
        
        // Create materials
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: woodColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const stoneMaterial = new THREE.MeshStandardMaterial({
            color: stoneColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create moss material if needed
        let mossMaterial;
        if (this.hasMoss) {
            mossMaterial = new THREE.MeshStandardMaterial({
                color: mossColor,
                roughness: 1.0,
                metalness: 0.0
            });
        }
        
        // Create glow material if needed
        let glowMaterial;
        if (this.hasGlowingElements) {
            glowMaterial = new THREE.MeshStandardMaterial({
                color: glowColor,
                roughness: 0.5,
                metalness: 0.3,
                emissive: glowColor,
                emissiveIntensity: 0.5
            });
        }
        
        // Create shrine based on type
        switch(this.shrineType) {
            case 0: // Stone circle
                this.createStoneCircle(shrineGroup, stoneMaterial, mossMaterial, glowMaterial);
                break;
                
            case 1: // Wooden altar
                this.createWoodenAltar(shrineGroup, woodMaterial, stoneMaterial, mossMaterial, glowMaterial);
                break;
                
            case 2: // Tree shrine
                this.createTreeShrine(shrineGroup, woodMaterial, stoneMaterial, mossMaterial, glowMaterial);
                break;
                
            default:
                this.createStoneCircle(shrineGroup, stoneMaterial, mossMaterial, glowMaterial);
        }
        
        // Add ground vegetation
        this.addGroundVegetation(shrineGroup, mossColor, glowColor);
        
        // Position the entire shrine at the specified position
        shrineGroup.position.copy(this.position);
        
        return shrineGroup;
    }
    
    /**
     * Create a stone circle shrine
     * @param {THREE.Group} group - The group to add the stone circle to
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} mossMaterial - The moss material (optional)
     * @param {THREE.Material} glowMaterial - The glow material (optional)
     */
    createStoneCircle(group, stoneMaterial, mossMaterial, glowMaterial) {
        // Create a circle of standing stones
        const numStones = 6 + Math.floor(Math.random() * 3); // 6-8 stones
        const radius = this.size * 1.5;
        
        for (let i = 0; i < numStones; i++) {
            const angle = (i / numStones) * Math.PI * 2;
            
            // Vary stone heights
            const height = this.size * (1.0 + Math.random() * 0.8);
            
            const stoneGeometry = new THREE.BoxGeometry(
                this.size * 0.3,
                height,
                this.size * 0.2
            );
            
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            stone.position.x = Math.cos(angle) * radius;
            stone.position.y = height / 2;
            stone.position.z = Math.sin(angle) * radius;
            
            // Slight random rotation and tilt
            stone.rotation.y = angle + (Math.random() - 0.5) * 0.3;
            stone.rotation.x = (Math.random() - 0.5) * 0.1;
            stone.rotation.z = (Math.random() - 0.5) * 0.1;
            
            stone.castShadow = true;
            stone.receiveShadow = true;
            
            group.add(stone);
            
            // Add moss if enabled
            if (mossMaterial && this.hasMoss) {
                // Add moss patches to random parts of the stone
                const mossCount = 1 + Math.floor(Math.random() * 3);
                
                for (let j = 0; j < mossCount; j++) {
                    const mossGeometry = new THREE.PlaneGeometry(
                        this.size * (0.1 + Math.random() * 0.1),
                        this.size * (0.1 + Math.random() * 0.2)
                    );
                    
                    const moss = new THREE.Mesh(mossGeometry, mossMaterial);
                    
                    // Position on a random face of the stone
                    const face = Math.floor(Math.random() * 4);
                    const xOffset = (Math.random() - 0.5) * 0.2;
                    const yOffset = (Math.random() - 0.5) * 0.8;
                    
                    if (face === 0) {
                        // Front face
                        moss.position.z = this.size * 0.11;
                        moss.position.x = xOffset * this.size;
                        moss.position.y = yOffset * height;
                    } else if (face === 1) {
                        // Back face
                        moss.position.z = -this.size * 0.11;
                        moss.position.x = xOffset * this.size;
                        moss.position.y = yOffset * height;
                        moss.rotation.y = Math.PI;
                    } else if (face === 2) {
                        // Left face
                        moss.position.x = -this.size * 0.16;
                        moss.position.z = xOffset * this.size;
                        moss.position.y = yOffset * height;
                        moss.rotation.y = -Math.PI / 2;
                    } else {
                        // Right face
                        moss.position.x = this.size * 0.16;
                        moss.position.z = xOffset * this.size;
                        moss.position.y = yOffset * height;
                        moss.rotation.y = Math.PI / 2;
                    }
                    
                    stone.add(moss);
                }
            }
        }
        
        // Create central altar stone
        const altarGeometry = new THREE.CylinderGeometry(
            this.size * 0.6,
            this.size * 0.7,
            this.size * 0.5,
            8
        );
        
        const altar = new THREE.Mesh(altarGeometry, stoneMaterial);
        altar.position.y = this.size * 0.25;
        altar.castShadow = true;
        altar.receiveShadow = true;
        
        group.add(altar);
        
        // Add glowing runes if enabled
        if (glowMaterial && this.hasGlowingElements) {
            const runeGeometry = new THREE.CircleGeometry(this.size * 0.4, 16);
            const runes = new THREE.Mesh(runeGeometry, glowMaterial);
            runes.rotation.x = -Math.PI / 2;
            runes.position.y = this.size * 0.51;
            
            altar.add(runes);
            
            // Add small glowing stones around the circle
            for (let i = 0; i < numStones; i++) {
                const angle = (i / numStones) * Math.PI * 2;
                const glowStoneGeometry = new THREE.SphereGeometry(this.size * 0.1, 8, 8);
                const glowStone = new THREE.Mesh(glowStoneGeometry, glowMaterial);
                
                glowStone.position.x = Math.cos(angle) * (radius - 0.2);
                glowStone.position.y = this.size * 0.1;
                glowStone.position.z = Math.sin(angle) * (radius - 0.2);
                
                group.add(glowStone);
            }
        }
    }
    
    /**
     * Create a wooden altar shrine
     * @param {THREE.Group} group - The group to add the wooden altar to
     * @param {THREE.Material} woodMaterial - The wood material
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} mossMaterial - The moss material (optional)
     * @param {THREE.Material} glowMaterial - The glow material (optional)
     */
    createWoodenAltar(group, woodMaterial, stoneMaterial, mossMaterial, glowMaterial) {
        // Create stone base
        const baseGeometry = new THREE.BoxGeometry(
            this.size * 1.8,
            this.size * 0.3,
            this.size * 1.8
        );
        
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        group.add(base);
        
        // Create wooden altar
        const altarGeometry = new THREE.BoxGeometry(
            this.size * 1.2,
            this.size * 0.6,
            this.size * 0.8
        );
        
        const altar = new THREE.Mesh(altarGeometry, woodMaterial);
        altar.position.y = this.size * 0.6;
        altar.castShadow = true;
        
        group.add(altar);
        
        // Create wooden posts at corners
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const postGeometry = new THREE.CylinderGeometry(
                this.size * 0.1,
                this.size * 0.1,
                this.size * 1.8,
                8
            );
            
            const post = new THREE.Mesh(postGeometry, woodMaterial);
            
            post.position.x = Math.cos(angle) * this.size * 0.7;
            post.position.y = this.size * 0.9;
            post.position.z = Math.sin(angle) * this.size * 0.7;
            
            post.castShadow = true;
            
            group.add(post);
            
            // Add moss if enabled
            if (mossMaterial && this.hasMoss) {
                const mossGeometry = new THREE.CylinderGeometry(
                    this.size * 0.12,
                    this.size * 0.12,
                    this.size * 0.3,
                    8
                );
                
                const moss = new THREE.Mesh(mossGeometry, mossMaterial);
                moss.position.y = -this.size * 0.7;
                
                post.add(moss);
            }
        }
        
        // Create roof
        const roofGeometry = new THREE.ConeGeometry(
            this.size * 1.2,
            this.size * 0.8,
            4
        );
        
        const roof = new THREE.Mesh(roofGeometry, woodMaterial);
        roof.position.y = this.size * 1.9;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        
        group.add(roof);
        
        // Add offering bowl
        const bowlGeometry = new THREE.CylinderGeometry(
            this.size * 0.3,
            this.size * 0.2,
            this.size * 0.2,
            16
        );
        
        const bowl = new THREE.Mesh(bowlGeometry, stoneMaterial);
        bowl.position.y = this.size * 0.9;
        bowl.castShadow = true;
        
        group.add(bowl);
        
        // Add glowing elements if enabled
        if (glowMaterial && this.hasGlowingElements) {
            // Add glowing contents to the bowl
            const contentsGeometry = new THREE.SphereGeometry(this.size * 0.15, 8, 8);
            const contents = new THREE.Mesh(contentsGeometry, glowMaterial);
            contents.position.y = this.size * 0.05;
            
            bowl.add(contents);
            
            // Add glowing symbols on the altar
            const symbolGeometry = new THREE.PlaneGeometry(
                this.size * 0.6,
                this.size * 0.3
            );
            
            const symbol = new THREE.Mesh(symbolGeometry, glowMaterial);
            symbol.rotation.x = -Math.PI / 2;
            symbol.position.y = this.size * 0.31;
            
            altar.add(symbol);
        }
    }
    
    /**
     * Create a tree shrine
     * @param {THREE.Group} group - The group to add the tree shrine to
     * @param {THREE.Material} woodMaterial - The wood material
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} mossMaterial - The moss material (optional)
     * @param {THREE.Material} glowMaterial - The glow material (optional)
     */
    createTreeShrine(group, woodMaterial, stoneMaterial, mossMaterial, glowMaterial) {
        // Create a tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            this.size * 0.4,
            this.size * 0.5,
            this.size * 3,
            12
        );
        
        const trunk = new THREE.Mesh(trunkGeometry, woodMaterial);
        trunk.position.y = this.size * 1.5;
        trunk.castShadow = true;
        
        group.add(trunk);
        
        // Create tree branches
        const branchCount = 3 + Math.floor(Math.random() * 3); // 3-5 branches
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const height = this.size * (1 + Math.random() * 1.5);
            
            const branchGeometry = new THREE.CylinderGeometry(
                this.size * 0.1,
                this.size * 0.2,
                this.size * 1,
                8
            );
            
            const branch = new THREE.Mesh(branchGeometry, woodMaterial);
            
            // Position and rotate branch
            branch.position.y = height;
            branch.rotation.z = Math.PI / 3;
            branch.rotation.y = angle;
            
            branch.castShadow = true;
            
            trunk.add(branch);
        }
        
        // Create stone circle around the tree
        const stoneCount = 5 + Math.floor(Math.random() * 4); // 5-8 stones
        const radius = this.size * 1.2;
        
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            
            const stoneGeometry = new THREE.BoxGeometry(
                this.size * 0.3,
                this.size * 0.3,
                this.size * 0.3
            );
            
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            stone.position.x = Math.cos(angle) * radius;
            stone.position.y = this.size * 0.15;
            stone.position.z = Math.sin(angle) * radius;
            
            // Random rotation
            stone.rotation.y = Math.random() * Math.PI;
            
            stone.castShadow = true;
            stone.receiveShadow = true;
            
            group.add(stone);
            
            // Add moss if enabled
            if (mossMaterial && this.hasMoss) {
                const mossGeometry = new THREE.BoxGeometry(
                    this.size * 0.32,
                    this.size * 0.1,
                    this.size * 0.32
                );
                
                const moss = new THREE.Mesh(mossGeometry, mossMaterial);
                moss.position.y = this.size * 0.2;
                
                stone.add(moss);
            }
        }
        
        // Add moss to tree trunk if enabled
        if (mossMaterial && this.hasMoss) {
            const mossCount = 2 + Math.floor(Math.random() * 3); // 2-4 moss patches
            
            for (let i = 0; i < mossCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const height = Math.random() * this.size * 2;
                
                const mossGeometry = new THREE.PlaneGeometry(
                    this.size * (0.2 + Math.random() * 0.3),
                    this.size * (0.3 + Math.random() * 0.4)
                );
                
                const moss = new THREE.Mesh(mossGeometry, mossMaterial);
                
                moss.position.y = height - this.size;
                moss.position.x = Math.cos(angle) * this.size * 0.41;
                moss.position.z = Math.sin(angle) * this.size * 0.41;
                
                moss.rotation.y = angle + Math.PI / 2;
                
                trunk.add(moss);
            }
        }
        
        // Add glowing elements if enabled
        if (glowMaterial && this.hasGlowingElements) {
            // Add glowing symbols on the trunk
            const symbolCount = 2 + Math.floor(Math.random() * 3); // 2-4 symbols
            
            for (let i = 0; i < symbolCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const height = Math.random() * this.size * 2;
                
                const symbolGeometry = new THREE.PlaneGeometry(
                    this.size * 0.2,
                    this.size * 0.2
                );
                
                const symbol = new THREE.Mesh(symbolGeometry, glowMaterial);
                
                symbol.position.y = height - this.size;
                symbol.position.x = Math.cos(angle) * this.size * 0.41;
                symbol.position.z = Math.sin(angle) * this.size * 0.41;
                
                symbol.rotation.y = angle + Math.PI / 2;
                
                trunk.add(symbol);
            }
            
            // Add glowing orbs around the tree
            for (let i = 0; i < stoneCount; i++) {
                const angle = (i / stoneCount) * Math.PI * 2;
                
                const orbGeometry = new THREE.SphereGeometry(this.size * 0.1, 8, 8);
                const orb = new THREE.Mesh(orbGeometry, glowMaterial);
                
                orb.position.x = Math.cos(angle) * radius;
                orb.position.y = this.size * 0.5;
                orb.position.z = Math.sin(angle) * radius;
                
                group.add(orb);
            }
        }
    }
    
    /**
     * Add ground vegetation around the shrine
     * @param {THREE.Group} group - The group to add vegetation to
     * @param {number} mossColor - The color of moss
     * @param {number} glowColor - The color of glowing elements
     */
    addGroundVegetation(group, mossColor, glowColor) {
        // Create ground circle
        const groundGeometry = new THREE.CircleGeometry(this.size * 2, 32);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x3A5F3A, // Dark green
            transparent: false
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.01; // Slightly above ground to prevent z-fighting
        
        group.add(ground);
        
        // Add small plants and flowers
        const plantCount = 10 + Math.floor(Math.random() * 10); // 10-19 plants
        
        for (let i = 0; i < plantCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size * 1.8;
            
            // Determine if this should be a glowing plant
            const isGlowing = this.hasGlowingElements && Math.random() > 0.7;
            
            // Create a simple plant
            const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 4);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Create flower or leaf
            const flowerGeometry = new THREE.SphereGeometry(0.05, 8, 4);
            const flowerMaterial = new THREE.MeshLambertMaterial({
                color: isGlowing ? glowColor : (Math.random() > 0.5 ? 0xFFFFFF : 0xFFA500),
                emissive: isGlowing ? glowColor : 0x000000,
                emissiveIntensity: isGlowing ? 0.5 : 0
            });
            
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.y = 0.1;
            
            // Create plant group
            const plantGroup = new THREE.Group();
            plantGroup.add(stem);
            plantGroup.add(flower);
            
            plantGroup.position.set(
                Math.cos(angle) * distance,
                0.1,
                Math.sin(angle) * distance
            );
            
            group.add(plantGroup);
        }
    }
}