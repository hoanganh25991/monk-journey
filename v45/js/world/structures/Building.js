import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a building structure styled for Monk Journey
 */
export class Building {
    /**
     * Create a new building
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {number} width - Building width
     * @param {number} depth - Building depth
     * @param {number} height - Building height
     */
    constructor(zoneType = 'Forest', width = 5, depth = 5, height = 4) {
        // Ensure all dimensions are valid numbers
        this.width = isNaN(width) || width <= 0 ? 5 : width;
        this.depth = isNaN(depth) || depth <= 0 ? 5 : depth;
        this.height = isNaN(height) || height <= 0 ? 4 : height;
        this.zoneType = zoneType || 'Forest';
        this.random = Math.random;
    }
    
    /**
     * Create the building mesh
     * @returns {THREE.Group} - The building group
     */
    createMesh() {
        const buildingGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create wall material with zone-appropriate color
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x4A4A4A, // Dark Charcoal
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create pagoda-style building for Monk Journey theme
        // Base structure - slightly wider at the bottom
        const baseHeight = this.height * 0.3;
        const baseGeometry = new THREE.BoxGeometry(this.width * 1.1, baseHeight, this.depth * 1.1);
        const base = new THREE.Mesh(baseGeometry, wallMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        
        buildingGroup.add(base);
        
        // Main building structure - middle section
        const middleHeight = this.height * 0.4;
        const middleGeometry = new THREE.BoxGeometry(this.width, middleHeight, this.depth);
        const middle = new THREE.Mesh(middleGeometry, wallMaterial);
        middle.position.y = baseHeight + middleHeight / 2;
        middle.castShadow = true;
        middle.receiveShadow = true;
        
        buildingGroup.add(middle);
        
        // Top section - slightly narrower
        const topHeight = this.height * 0.3;
        const topGeometry = new THREE.BoxGeometry(this.width * 0.9, topHeight, this.depth * 0.9);
        const top = new THREE.Mesh(topGeometry, wallMaterial);
        top.position.y = baseHeight + middleHeight + topHeight / 2;
        top.castShadow = true;
        top.receiveShadow = true;
        
        buildingGroup.add(top);
        
        // Create pagoda-style roof
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520, // Golden Rod default
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create curved, multi-tiered roof
        const roofWidth = Math.sqrt(this.width * this.width + this.depth * this.depth) / 2 + 0.8;
        const roofHeight = this.height * 0.4;
        
        // First roof tier (bottom)
        const roofGeometry1 = new THREE.ConeGeometry(roofWidth, roofHeight * 0.6, 4);
        const roof1 = new THREE.Mesh(roofGeometry1, roofMaterial);
        roof1.position.y = this.height + roofHeight * 0.3;
        roof1.rotation.y = Math.PI / 4;
        roof1.scale.y = 0.5; // Flatten it
        roof1.castShadow = true;
        roof1.receiveShadow = true;
        
        buildingGroup.add(roof1);
        
        // Second roof tier (top)
        const roofGeometry2 = new THREE.ConeGeometry(roofWidth * 0.7, roofHeight * 0.4, 4);
        const roof2 = new THREE.Mesh(roofGeometry2, roofMaterial);
        roof2.position.y = this.height + roofHeight * 0.6;
        roof2.rotation.y = Math.PI / 4;
        roof2.scale.y = 0.5; // Flatten it
        roof2.castShadow = true;
        roof2.receiveShadow = true;
        
        buildingGroup.add(roof2);
        
        // Add decorative roof edges (eaves)
        const eavesMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520, // Golden Rod default
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Add curved eaves at each corner
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const eaveGeometry = new THREE.BoxGeometry(this.width * 0.2, 0.1, this.depth * 0.2);
            const eave = new THREE.Mesh(eaveGeometry, eavesMaterial);
            
            // Position at corners with slight upward curve
            eave.position.set(
                Math.sin(angle) * (this.width / 2 + 0.3),
                this.height + 0.1,
                Math.cos(angle) * (this.depth / 2 + 0.3)
            );
            
            // Rotate to point outward
            eave.rotation.y = angle + Math.PI / 4;
            // Tilt upward for curved effect
            eave.rotation.x = Math.PI * 0.1;
            
            buildingGroup.add(eave);
        }
        
        // Create sliding door (more Asian style)
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520, // Golden Rod default
            roughness: 0.9,
            metalness: 0.1
        });
        
        const doorWidth = Math.min(this.width / 2.5, 1.5);
        const doorHeight = Math.min(this.height / 2, 2);
        
        // Create door frame
        const doorFrameGeometry = new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.2, 0.1);
        const doorFrame = new THREE.Mesh(doorFrameGeometry, wallMaterial);
        doorFrame.position.set(0, doorHeight / 2, this.depth / 2 + 0.05);
        
        buildingGroup.add(doorFrame);
        
        // Create sliding door panels
        const doorPanelWidth = doorWidth / 2 - 0.05;
        const doorPanelGeometry = new THREE.BoxGeometry(doorPanelWidth, doorHeight - 0.1, 0.05);
        
        // Left door panel
        const leftDoor = new THREE.Mesh(doorPanelGeometry, doorMaterial);
        leftDoor.position.set(-doorPanelWidth / 2 - 0.05, doorHeight / 2, this.depth / 2 + 0.1);
        
        // Right door panel
        const rightDoor = new THREE.Mesh(doorPanelGeometry, doorMaterial);
        rightDoor.position.set(doorPanelWidth / 2 + 0.05, doorHeight / 2, this.depth / 2 + 0.1);
        
        buildingGroup.add(leftDoor);
        buildingGroup.add(rightDoor);
        
        // Create windows - more stylized for Asian architecture
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        // Create lattice pattern for windows
        const createLatticeWindow = (width, height, depth) => {
            const windowGroup = new THREE.Group();
            
            // Window frame
            const frameGeometry = new THREE.BoxGeometry(width, height, depth);
            const frame = new THREE.Mesh(frameGeometry, wallMaterial);
            windowGroup.add(frame);
            
            // Glass
            const glassGeometry = new THREE.BoxGeometry(width - 0.1, height - 0.1, depth / 2);
            const glass = new THREE.Mesh(glassGeometry, windowMaterial);
            glass.position.z = depth / 4;
            windowGroup.add(glass);
            
            // Horizontal lattice bars
            const barHeight = 0.05;
            const barWidth = width - 0.15;
            for (let i = 1; i < 3; i++) {
                const barY = (i / 3) * height - height / 2;
                const barGeometry = new THREE.BoxGeometry(barWidth, barHeight, depth);
                const bar = new THREE.Mesh(barGeometry, wallMaterial);
                bar.position.y = barY;
                windowGroup.add(bar);
            }
            
            // Vertical lattice bars
            const barDepth = depth;
            const barThickness = 0.05;
            for (let i = 1; i < 3; i++) {
                const barX = (i / 3) * width - width / 2;
                const barGeometry = new THREE.BoxGeometry(barThickness, height - 0.15, barDepth);
                const bar = new THREE.Mesh(barGeometry, wallMaterial);
                bar.position.x = barX;
                windowGroup.add(bar);
            }
            
            return windowGroup;
        };
        
        // Add windows to front
        const frontWindow1 = createLatticeWindow(1.2, 1.2, 0.2);
        frontWindow1.position.set(-this.width / 4, this.height / 2 + 0.5, this.depth / 2 + 0.05);
        
        const frontWindow2 = createLatticeWindow(1.2, 1.2, 0.2);
        frontWindow2.position.set(this.width / 4, this.height / 2 + 0.5, this.depth / 2 + 0.05);
        
        buildingGroup.add(frontWindow1);
        buildingGroup.add(frontWindow2);
        
        // Add windows to sides
        const sideWindow1 = createLatticeWindow(0.2, 1.2, 1.2);
        sideWindow1.position.set(this.width / 2 + 0.05, this.height / 2 + 0.5, 0);
        sideWindow1.rotation.y = Math.PI / 2;
        
        const sideWindow2 = createLatticeWindow(0.2, 1.2, 1.2);
        sideWindow2.position.set(-this.width / 2 - 0.05, this.height / 2 + 0.5, 0);
        sideWindow2.rotation.y = Math.PI / 2;
        
        buildingGroup.add(sideWindow1);
        buildingGroup.add(sideWindow2);
        
        // Add decorative elements based on zone type
        if (this.zoneType === 'Forest') {
            // Add lanterns for forest pagodas
            this.addLanterns(buildingGroup, zoneColors);
        } else if (this.zoneType === 'Desert') {
            // Add awnings for desert buildings
            this.addAwnings(buildingGroup, zoneColors);
        } else if (this.zoneType === 'Mountains') {
            // Add snow caps for mountain buildings
            this.addSnowCaps(buildingGroup, zoneColors);
        }
        
        return buildingGroup;
    }
    
    /**
     * Add decorative lanterns to the building
     * @param {THREE.Group} buildingGroup - The building group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addLanterns(buildingGroup, zoneColors) {
        // Create lantern material
        const lanternMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520, // Golden Rod default
            roughness: 0.7,
            metalness: 0.3,
            emissive: zoneColors.accent || 0xDAA520,
            emissiveIntensity: 0.3
        });
        
        // Add lanterns at the entrance
        const lanternSize = 0.3;
        const lanternGeometry = new THREE.SphereGeometry(lanternSize, 8, 8);
        
        // Left lantern
        const leftLantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
        leftLantern.position.set(-this.width / 3, this.height / 3, this.depth / 2 + 0.3);
        buildingGroup.add(leftLantern);
        
        // Right lantern
        const rightLantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
        rightLantern.position.set(this.width / 3, this.height / 3, this.depth / 2 + 0.3);
        buildingGroup.add(rightLantern);
        
        // Add lantern strings
        const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
        
        const leftString = new THREE.Mesh(stringGeometry, stringMaterial);
        leftString.position.set(-this.width / 3, this.height / 3 + 0.25, this.depth / 2 + 0.3);
        buildingGroup.add(leftString);
        
        const rightString = new THREE.Mesh(stringGeometry, stringMaterial);
        rightString.position.set(this.width / 3, this.height / 3 + 0.25, this.depth / 2 + 0.3);
        buildingGroup.add(rightString);
    }
    
    /**
     * Add decorative awnings to the building
     * @param {THREE.Group} buildingGroup - The building group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addAwnings(buildingGroup, zoneColors) {
        // Create awning material
        const awningMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xFF4500, // Sunset Orange default
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Add awning over the door
        const awningWidth = this.width * 0.6;
        const awningDepth = 0.8;
        const awningHeight = 0.1;
        
        const awningGeometry = new THREE.BoxGeometry(awningWidth, awningHeight, awningDepth);
        const awning = new THREE.Mesh(awningGeometry, awningMaterial);
        awning.position.set(0, this.height * 0.6, this.depth / 2 + awningDepth / 2);
        buildingGroup.add(awning);
        
        // Add support rods for awning
        const rodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.7,
            metalness: 0.3
        });
        
        const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, this.height * 0.2, 6);
        
        // Left rod
        const leftRod = new THREE.Mesh(rodGeometry, rodMaterial);
        leftRod.position.set(-awningWidth / 2 + 0.1, this.height * 0.5, this.depth / 2 + awningDepth - 0.1);
        buildingGroup.add(leftRod);
        
        // Right rod
        const rightRod = new THREE.Mesh(rodGeometry, rodMaterial);
        rightRod.position.set(awningWidth / 2 - 0.1, this.height * 0.5, this.depth / 2 + awningDepth - 0.1);
        buildingGroup.add(rightRod);
    }
    
    /**
     * Add snow caps to the building for mountain zones
     * @param {THREE.Group} buildingGroup - The building group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addSnowCaps(buildingGroup, zoneColors) {
        // Create snow material
        const snowMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.snow || 0xFFFAFA, // Snow White default
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add snow on the roof
        const snowCapGeometry = new THREE.ConeGeometry(
            Math.sqrt(this.width * this.width + this.depth * this.depth) / 2 + 0.3, 
            0.3, 
            4
        );
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.y = this.height + this.height * 0.4 + 0.1;
        snowCap.rotation.y = Math.PI / 4;
        snowCap.scale.y = 0.3; // Flatten it
        buildingGroup.add(snowCap);
        
        // Add snow on window sills
        const sillGeometry = new THREE.BoxGeometry(1.4, 0.1, 0.3);
        
        // Front window sills
        const frontSill1 = new THREE.Mesh(sillGeometry, snowMaterial);
        frontSill1.position.set(-this.width / 4, this.height / 2, this.depth / 2 + 0.15);
        buildingGroup.add(frontSill1);
        
        const frontSill2 = new THREE.Mesh(sillGeometry, snowMaterial);
        frontSill2.position.set(this.width / 4, this.height / 2, this.depth / 2 + 0.15);
        buildingGroup.add(frontSill2);
    }
}