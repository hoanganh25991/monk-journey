import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a building structure styled for Monk Journey
 * Enhanced with multiple building types and styles
 */
export class Building {
    /**
     * Create a new building
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {number} width - Building width
     * @param {number} depth - Building depth
     * @param {number} height - Building height
     * @param {string} buildingType - Type of building (house, shop, temple)
     * @param {number} style - Style variant (0-2)
     */
    constructor(zoneType = 'Forest', width = 5, depth = 5, height = 4, buildingType = 'house', style = 0) {
        // Ensure all dimensions are valid numbers
        this.width = isNaN(width) || width <= 0 ? 5 : width;
        this.depth = isNaN(depth) || depth <= 0 ? 5 : depth;
        this.height = isNaN(height) || height <= 0 ? 4 : height;
        this.zoneType = zoneType || 'Forest';
        this.buildingType = buildingType || 'house';
        this.style = style || 0;
        
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
        
        // Create accent material
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520, // Golden Rod default
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Choose building creation method based on type and style
        switch (this.buildingType) {
            case 'temple':
                this.createTemple(buildingGroup, wallMaterial, accentMaterial, zoneColors);
                break;
            case 'shop':
                this.createShop(buildingGroup, wallMaterial, accentMaterial, zoneColors);
                break;
            case 'house':
            default:
                // Different house styles
                if (this.style === 1) {
                    this.createTwoStoryHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors);
                } else if (this.style === 2) {
                    this.createRoundedHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors);
                } else {
                    this.createPagodaStyleHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors);
                }
                break;
        }
        
        // Add zone-specific decorations
        this.addZoneSpecificDecorations(buildingGroup, zoneColors);
        
        return buildingGroup;
    }
    
    /**
     * Create a pagoda-style house (default style)
     */
    createPagodaStyleHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors) {
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
        
        // Create curved, multi-tiered roof
        const roofWidth = Math.sqrt(this.width * this.width + this.depth * this.depth) / 2 + 0.8;
        const roofHeight = this.height * 0.4;
        
        // First roof tier (bottom)
        const roofGeometry1 = new THREE.ConeGeometry(roofWidth, roofHeight * 0.6, 4);
        const roof1 = new THREE.Mesh(roofGeometry1, accentMaterial);
        roof1.position.y = this.height + roofHeight * 0.3;
        roof1.rotation.y = Math.PI / 4;
        roof1.scale.y = 0.5; // Flatten it
        roof1.castShadow = true;
        roof1.receiveShadow = true;
        
        buildingGroup.add(roof1);
        
        // Second roof tier (top)
        const roofGeometry2 = new THREE.ConeGeometry(roofWidth * 0.7, roofHeight * 0.4, 4);
        const roof2 = new THREE.Mesh(roofGeometry2, accentMaterial);
        roof2.position.y = this.height + roofHeight * 0.6;
        roof2.rotation.y = Math.PI / 4;
        roof2.scale.y = 0.5; // Flatten it
        roof2.castShadow = true;
        roof2.receiveShadow = true;
        
        buildingGroup.add(roof2);
        
        // Add curved eaves at each corner
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const eaveGeometry = new THREE.BoxGeometry(this.width * 0.2, 0.1, this.depth * 0.2);
            const eave = new THREE.Mesh(eaveGeometry, accentMaterial);
            
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
        
        // Add zone-specific decorations
        this.addZoneSpecificDecorations(buildingGroup, zoneColors);
        
        return buildingGroup;
    }
    
    /**
     * Create a two-story house (style 1)
     */
    createTwoStoryHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors) {
        // First floor
        const firstFloorHeight = this.height * 0.5;
        const firstFloorGeometry = new THREE.BoxGeometry(this.width, firstFloorHeight, this.depth);
        const firstFloor = new THREE.Mesh(firstFloorGeometry, wallMaterial);
        firstFloor.position.y = firstFloorHeight / 2;
        firstFloor.castShadow = true;
        firstFloor.receiveShadow = true;
        
        buildingGroup.add(firstFloor);
        
        // Second floor - slightly smaller
        const secondFloorHeight = this.height * 0.4;
        const secondFloorGeometry = new THREE.BoxGeometry(this.width * 0.85, secondFloorHeight, this.depth * 0.85);
        const secondFloor = new THREE.Mesh(secondFloorGeometry, wallMaterial);
        secondFloor.position.y = firstFloorHeight + secondFloorHeight / 2;
        secondFloor.castShadow = true;
        secondFloor.receiveShadow = true;
        
        buildingGroup.add(secondFloor);
        
        // Create sloped roof
        const roofHeight = this.height * 0.3;
        const roofWidth = this.width * 0.95;
        const roofDepth = this.depth * 0.95;
        
        // Create a pyramid-shaped roof
        const roofGeometry = new THREE.ConeGeometry(
            Math.sqrt(roofWidth * roofWidth + roofDepth * roofDepth) / 2,
            roofHeight,
            4
        );
        const roof = new THREE.Mesh(roofGeometry, accentMaterial);
        roof.position.y = firstFloorHeight + secondFloorHeight + roofHeight / 2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        
        buildingGroup.add(roof);
        
        // Add balcony to second floor
        const balconyDepth = 1.2;
        const balconyWidth = this.width * 0.4;
        const balconyHeight = 0.1;
        
        const balconyGeometry = new THREE.BoxGeometry(balconyWidth, balconyHeight, balconyDepth);
        const balcony = new THREE.Mesh(balconyGeometry, accentMaterial);
        balcony.position.set(0, firstFloorHeight + 0.05, this.depth / 2 + balconyDepth / 2);
        
        buildingGroup.add(balcony);
        
        // Add balcony railings
        const railingHeight = 0.6;
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x4A4A4A,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Front railing
        const frontRailingGeometry = new THREE.BoxGeometry(balconyWidth, railingHeight, 0.05);
        const frontRailing = new THREE.Mesh(frontRailingGeometry, railingMaterial);
        frontRailing.position.set(0, firstFloorHeight + railingHeight / 2 + balconyHeight, this.depth / 2 + balconyDepth);
        
        // Side railings
        const sideRailingGeometry = new THREE.BoxGeometry(0.05, railingHeight, balconyDepth);
        const leftRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
        leftRailing.position.set(-balconyWidth / 2, firstFloorHeight + railingHeight / 2 + balconyHeight, this.depth / 2 + balconyDepth / 2);
        
        const rightRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
        rightRailing.position.set(balconyWidth / 2, firstFloorHeight + railingHeight / 2 + balconyHeight, this.depth / 2 + balconyDepth / 2);
        
        buildingGroup.add(frontRailing);
        buildingGroup.add(leftRailing);
        buildingGroup.add(rightRailing);
        
        // Add windows
        this.addWindows(buildingGroup, wallMaterial, zoneColors, firstFloorHeight);
        
        // Add door
        this.addDoor(buildingGroup, accentMaterial, zoneColors);
    }
    
    /**
     * Create a rounded house (style 2)
     */
    createRoundedHouse(buildingGroup, wallMaterial, accentMaterial, zoneColors) {
        // Create a cylindrical base
        const baseRadius = Math.min(this.width, this.depth) / 2;
        const baseHeight = this.height * 0.7;
        const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 12);
        const base = new THREE.Mesh(baseGeometry, wallMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        
        buildingGroup.add(base);
        
        // Create a dome roof
        const roofRadius = baseRadius * 1.2;
        const roofHeight = this.height * 0.4;
        const roofGeometry = new THREE.SphereGeometry(roofRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const roof = new THREE.Mesh(roofGeometry, accentMaterial);
        roof.position.y = baseHeight;
        roof.castShadow = true;
        
        buildingGroup.add(roof);
        
        // Add a decorative spire on top
        const spireHeight = this.height * 0.3;
        const spireGeometry = new THREE.ConeGeometry(baseRadius * 0.15, spireHeight, 8);
        const spire = new THREE.Mesh(spireGeometry, accentMaterial);
        spire.position.y = baseHeight + roofRadius * 0.8;
        spire.castShadow = true;
        
        buildingGroup.add(spire);
        
        // Add windows around the cylindrical base
        const windowCount = 5;
        const windowWidth = 0.8;
        const windowHeight = 1.2;
        const windowDepth = 0.1;
        
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < windowCount; i++) {
            const angle = (i / windowCount) * Math.PI * 2;
            
            // Skip one position for the door
            if (i === 0) continue;
            
            const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            // Position around the cylinder
            window.position.set(
                Math.sin(angle) * (baseRadius + 0.05),
                baseHeight / 2,
                Math.cos(angle) * (baseRadius + 0.05)
            );
            
            // Rotate to face outward
            window.rotation.y = angle + Math.PI / 2;
            
            buildingGroup.add(window);
        }
        
        // Add a door at the front
        const doorWidth = 1.2;
        const doorHeight = 2;
        const doorDepth = 0.2;
        
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const door = new THREE.Mesh(doorGeometry, accentMaterial);
        
        // Position at the front
        door.position.set(0, doorHeight / 2, baseRadius + 0.05);
        
        buildingGroup.add(door);
        
        // Add steps leading to the door
        const stepsWidth = doorWidth * 1.5;
        const stepsDepth = 0.8;
        const stepsHeight = 0.2;
        
        const stepsGeometry = new THREE.BoxGeometry(stepsWidth, stepsHeight, stepsDepth);
        const steps = new THREE.Mesh(stepsGeometry, wallMaterial);
        steps.position.set(0, stepsHeight / 2, baseRadius + stepsDepth / 2 + 0.1);
        
        buildingGroup.add(steps);
    }
    
    /**
     * Create a temple building
     */
    createTemple(buildingGroup, wallMaterial, accentMaterial, zoneColors) {
        // Create a larger, more ornate building for temples
        
        // Base platform
        const baseWidth = this.width * 1.2;
        const baseDepth = this.depth * 1.2;
        const baseHeight = this.height * 0.2;
        
        const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const base = new THREE.Mesh(baseGeometry, wallMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        
        buildingGroup.add(base);
        
        // Main temple structure
        const templeWidth = this.width;
        const templeDepth = this.depth;
        const templeHeight = this.height * 0.6;
        
        const templeGeometry = new THREE.BoxGeometry(templeWidth, templeHeight, templeDepth);
        const temple = new THREE.Mesh(templeGeometry, wallMaterial);
        temple.position.y = baseHeight + templeHeight / 2;
        temple.castShadow = true;
        temple.receiveShadow = true;
        
        buildingGroup.add(temple);
        
        // Create multi-tiered pagoda roof
        const roofTiers = 3;
        const roofBaseWidth = templeWidth * 1.3;
        const roofBaseDepth = templeDepth * 1.3;
        const totalRoofHeight = this.height * 0.5;
        const tierHeight = totalRoofHeight / roofTiers;
        
        for (let i = 0; i < roofTiers; i++) {
            const tierScale = 1 - (i * 0.2);
            const tierWidth = roofBaseWidth * tierScale;
            const tierDepth = roofBaseDepth * tierScale;
            
            // Create a flattened pyramid for each tier
            const tierGeometry = new THREE.BoxGeometry(tierWidth, tierHeight * 0.7, tierDepth);
            const tier = new THREE.Mesh(tierGeometry, accentMaterial);
            
            // Position each tier
            tier.position.y = baseHeight + templeHeight + (i * tierHeight) + tierHeight / 2;
            tier.castShadow = true;
            
            buildingGroup.add(tier);
            
            // Add decorative corners to each tier
            for (let j = 0; j < 4; j++) {
                const angle = (j / 4) * Math.PI * 2;
                const cornerX = Math.sin(angle) * (tierWidth / 2);
                const cornerZ = Math.cos(angle) * (tierDepth / 2);
                
                const cornerGeometry = new THREE.ConeGeometry(0.3, tierHeight * 0.5, 4);
                const corner = new THREE.Mesh(cornerGeometry, accentMaterial);
                
                corner.position.set(
                    cornerX,
                    baseHeight + templeHeight + (i * tierHeight) + tierHeight,
                    cornerZ
                );
                
                buildingGroup.add(corner);
            }
        }
        
        // Add a spire at the top
        const spireHeight = this.height * 0.3;
        const spireGeometry = new THREE.ConeGeometry(0.4, spireHeight, 8);
        const spire = new THREE.Mesh(spireGeometry, accentMaterial);
        spire.position.y = baseHeight + templeHeight + totalRoofHeight + spireHeight / 2;
        spire.castShadow = true;
        
        buildingGroup.add(spire);
        
        // Add ornate entrance
        const entranceWidth = templeWidth * 0.4;
        const entranceHeight = templeHeight * 0.7;
        const entranceDepth = 0.8;
        
        const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
        const entrance = new THREE.Mesh(entranceGeometry, accentMaterial);
        entrance.position.set(0, baseHeight + entranceHeight / 2, templeDepth / 2 + entranceDepth / 2);
        
        buildingGroup.add(entrance);
        
        // Add steps leading to the entrance
        const stepsWidth = entranceWidth * 1.5;
        const stepsDepth = 1.2;
        const stepsHeight = 0.2;
        
        const stepsGeometry = new THREE.BoxGeometry(stepsWidth, stepsHeight, stepsDepth);
        const steps = new THREE.Mesh(stepsGeometry, wallMaterial);
        steps.position.set(0, stepsHeight / 2, templeDepth / 2 + entranceDepth + stepsDepth / 2);
        
        buildingGroup.add(steps);
        
        // Add decorative columns
        const columnRadius = 0.3;
        const columnHeight = templeHeight * 0.9;
        
        for (let i = 0; i < 2; i++) {
            const side = i === 0 ? -1 : 1;
            const columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 8);
            const column = new THREE.Mesh(columnGeometry, wallMaterial);
            
            column.position.set(
                side * (entranceWidth / 2 + columnRadius * 2),
                baseHeight + columnHeight / 2,
                templeDepth / 2 + columnRadius
            );
            
            buildingGroup.add(column);
        }
        
        // Add decorative windows
        const windowWidth = 0.8;
        const windowHeight = 1.5;
        const windowDepth = 0.1;
        
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        // Add windows to sides
        for (let i = 0; i < 2; i++) {
            const side = i === 0 ? -1 : 1;
            
            for (let j = 0; j < 2; j++) {
                const offset = j === 0 ? -1 : 1;
                
                const windowGeometry = new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                
                window.position.set(
                    side * (templeWidth / 2 + windowDepth / 2),
                    baseHeight + templeHeight / 2,
                    offset * (templeDepth / 4)
                );
                
                buildingGroup.add(window);
            }
        }
    }
    
    /**
     * Create a shop building
     */
    createShop(buildingGroup, wallMaterial, accentMaterial, zoneColors) {
        // Create a shop with a distinctive storefront
        
        // Main structure
        const shopWidth = this.width;
        const shopDepth = this.depth;
        const shopHeight = this.height * 0.8;
        
        const shopGeometry = new THREE.BoxGeometry(shopWidth, shopHeight, shopDepth);
        const shop = new THREE.Mesh(shopGeometry, wallMaterial);
        shop.position.y = shopHeight / 2;
        shop.castShadow = true;
        shop.receiveShadow = true;
        
        buildingGroup.add(shop);
        
        // Create sloped roof
        const roofHeight = this.height * 0.3;
        const roofWidth = shopWidth * 1.2; // Extend beyond walls
        const roofDepth = shopDepth * 1.2; // Extend beyond walls
        
        // Create a pyramid-shaped roof
        const roofGeometry = new THREE.ConeGeometry(
            Math.sqrt(roofWidth * roofWidth + roofDepth * roofDepth) / 2,
            roofHeight,
            4
        );
        const roof = new THREE.Mesh(roofGeometry, accentMaterial);
        roof.position.y = shopHeight + roofHeight / 2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        
        buildingGroup.add(roof);
        
        // Create storefront with large display window
        const windowWidth = shopWidth * 0.7;
        const windowHeight = shopHeight * 0.5;
        const windowDepth = 0.1;
        
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(0, shopHeight / 2, shopDepth / 2 + windowDepth / 2);
        
        buildingGroup.add(window);
        
        // Create window frame
        const frameWidth = windowWidth + 0.2;
        const frameHeight = windowHeight + 0.2;
        const frameDepth = 0.2;
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xDAA520,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create frame parts
        const frameTop = new THREE.BoxGeometry(frameWidth, 0.2, frameDepth);
        const frameBottom = new THREE.BoxGeometry(frameWidth, 0.2, frameDepth);
        const frameLeft = new THREE.BoxGeometry(0.2, frameHeight, frameDepth);
        const frameRight = new THREE.BoxGeometry(0.2, frameHeight, frameDepth);
        
        const topFrame = new THREE.Mesh(frameTop, frameMaterial);
        topFrame.position.set(0, shopHeight / 2 + windowHeight / 2 + 0.1, shopDepth / 2 + frameDepth / 2);
        
        const bottomFrame = new THREE.Mesh(frameBottom, frameMaterial);
        bottomFrame.position.set(0, shopHeight / 2 - windowHeight / 2 - 0.1, shopDepth / 2 + frameDepth / 2);
        
        const leftFrame = new THREE.Mesh(frameLeft, frameMaterial);
        leftFrame.position.set(-windowWidth / 2 - 0.1, shopHeight / 2, shopDepth / 2 + frameDepth / 2);
        
        const rightFrame = new THREE.Mesh(frameRight, frameMaterial);
        rightFrame.position.set(windowWidth / 2 + 0.1, shopHeight / 2, shopDepth / 2 + frameDepth / 2);
        
        buildingGroup.add(topFrame);
        buildingGroup.add(bottomFrame);
        buildingGroup.add(leftFrame);
        buildingGroup.add(rightFrame);
        
        // Add door to the side of the display window
        const doorWidth = 1.2;
        const doorHeight = 2;
        const doorDepth = 0.2;
        
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const door = new THREE.Mesh(doorGeometry, accentMaterial);
        
        // Position door to the right of the window
        door.position.set(windowWidth / 2 + doorWidth / 2 + 0.3, doorHeight / 2, shopDepth / 2 + doorDepth / 2);
        
        buildingGroup.add(door);
        
        // Add shop sign
        const signWidth = shopWidth * 0.6;
        const signHeight = 0.8;
        const signDepth = 0.1;
        
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, signDepth);
        const sign = new THREE.Mesh(signGeometry, accentMaterial);
        sign.position.set(0, shopHeight + 0.5, shopDepth / 2 + signDepth / 2 + 0.3);
        
        buildingGroup.add(sign);
        
        // Add sign support
        const supportGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
        const support = new THREE.Mesh(supportGeometry, wallMaterial);
        support.position.set(0, shopHeight + 0.1, shopDepth / 2 + 0.3);
        
        buildingGroup.add(support);
    }
    
    /**
     * Add windows to a building
     */
    addWindows(buildingGroup, wallMaterial, zoneColors, firstFloorHeight = 0) {
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
        
        // If this is a two-story building, add second floor windows
        if (firstFloorHeight > 0) {
            const secondFloorWindow1 = createLatticeWindow(1.2, 1.2, 0.2);
            secondFloorWindow1.position.set(-this.width / 4, firstFloorHeight + this.height / 4, this.depth / 2 + 0.05);
            
            const secondFloorWindow2 = createLatticeWindow(1.2, 1.2, 0.2);
            secondFloorWindow2.position.set(this.width / 4, firstFloorHeight + this.height / 4, this.depth / 2 + 0.05);
            
            buildingGroup.add(secondFloorWindow1);
            buildingGroup.add(secondFloorWindow2);
        }
        
        // Add windows to sides
        const sideWindow1 = createLatticeWindow(0.2, 1.2, 1.2);
        sideWindow1.position.set(this.width / 2 + 0.05, this.height / 2 + 0.5, 0);
        sideWindow1.rotation.y = Math.PI / 2;
        
        const sideWindow2 = createLatticeWindow(0.2, 1.2, 1.2);
        sideWindow2.position.set(-this.width / 2 - 0.05, this.height / 2 + 0.5, 0);
        sideWindow2.rotation.y = Math.PI / 2;
        
        buildingGroup.add(sideWindow1);
        buildingGroup.add(sideWindow2);
    }
    
    /**
     * Add a door to a building
     */
    addDoor(buildingGroup, accentMaterial, zoneColors) {
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
        const doorFrame = new THREE.Mesh(doorFrameGeometry, accentMaterial);
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
    }
    
    /**
     * Add zone-specific decorations to the building
     */
    addZoneSpecificDecorations(buildingGroup, zoneColors) {
        switch (this.zoneType) {
            case 'Forest':
                this.addLanterns(buildingGroup, zoneColors);
                break;
            case 'Desert':
                this.addAwnings(buildingGroup, zoneColors);
                break;
            case 'Mountains':
                this.addSnowCaps(buildingGroup, zoneColors);
                break;
            case 'Swamp':
                this.addMossAndVines(buildingGroup, zoneColors);
                break;
            case 'Ruins':
                this.addCracksAndVines(buildingGroup, zoneColors);
                break;
        }
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
    
    /**
     * Add moss and vines to the building for Swamp zones
     * @param {THREE.Group} buildingGroup - The building group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addMossAndVines(buildingGroup, zoneColors) {
        // Create moss material
        const mossMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.vegetation || 0x2E8B57, // Sea Green default
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add moss patches to walls
        for (let i = 0; i < 5; i++) {
            // Random position on the building
            const side = Math.floor(Math.random() * 4); // 0: front, 1: right, 2: back, 3: left
            const height = Math.random() * this.height * 0.8;
            
            // Create moss patch
            const mossSize = 0.3 + Math.random() * 0.5;
            const mossGeometry = new THREE.SphereGeometry(mossSize, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            
            // Position based on side
            switch (side) {
                case 0: // front
                    moss.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        this.depth / 2 + 0.01
                    );
                    moss.rotation.x = Math.PI / 2;
                    break;
                case 1: // right
                    moss.position.set(
                        this.width / 2 + 0.01,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    moss.rotation.z = Math.PI / 2;
                    moss.rotation.y = Math.PI / 2;
                    break;
                case 2: // back
                    moss.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        -this.depth / 2 - 0.01
                    );
                    moss.rotation.x = -Math.PI / 2;
                    break;
                case 3: // left
                    moss.position.set(
                        -this.width / 2 - 0.01,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    moss.rotation.z = -Math.PI / 2;
                    moss.rotation.y = Math.PI / 2;
                    break;
            }
            
            // Scale the moss patch to be flatter
            moss.scale.set(1, 0.3, 1);
            buildingGroup.add(moss);
        }
        
        // Add hanging vines
        for (let i = 0; i < 3; i++) {
            // Create a vine
            const vineLength = 1 + Math.random() * 2;
            const vineWidth = 0.1 + Math.random() * 0.1;
            const vineGeometry = new THREE.CylinderGeometry(vineWidth, vineWidth, vineLength, 8);
            const vine = new THREE.Mesh(vineGeometry, mossMaterial);
            
            // Position at random points along the roof
            const angle = Math.random() * Math.PI * 2;
            const radius = (Math.random() * 0.3 + 0.7) * Math.min(this.width, this.depth) / 2;
            
            vine.position.set(
                Math.cos(angle) * radius,
                this.height + 0.1,
                Math.sin(angle) * radius
            );
            
            // Rotate to hang down
            vine.rotation.x = Math.PI / 2;
            
            // Move origin to top of vine so it hangs properly
            vineGeometry.translate(0, -vineLength / 2, 0);
            
            buildingGroup.add(vine);
        }
    }
    
    /**
     * Add cracks and vines to the building for Ruins zones
     * @param {THREE.Group} buildingGroup - The building group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addCracksAndVines(buildingGroup, zoneColors) {
        // Create vine material
        const vineMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.vegetation || 0x2E8B57, // Sea Green default
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Create crack material (slightly darker than the building)
        const crackMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222, // Dark gray
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add cracks to walls
        for (let i = 0; i < 4; i++) {
            // Random position on the building
            const side = Math.floor(Math.random() * 4); // 0: front, 1: right, 2: back, 3: left
            const height = Math.random() * this.height * 0.8;
            
            // Create jagged crack
            const crackWidth = 0.05 + Math.random() * 0.1;
            const crackHeight = 0.5 + Math.random() * 1.5;
            
            // Create a jagged line for the crack
            const crackShape = new THREE.Shape();
            crackShape.moveTo(0, 0);
            
            const segments = 8;
            const segmentHeight = crackHeight / segments;
            
            for (let j = 1; j <= segments; j++) {
                const jitter = (Math.random() - 0.5) * crackWidth * 2;
                crackShape.lineTo(jitter, j * segmentHeight);
            }
            
            const crackGeometry = new THREE.ShapeGeometry(crackShape);
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // Position based on side
            switch (side) {
                case 0: // front
                    crack.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        this.depth / 2 + 0.01
                    );
                    crack.rotation.x = Math.PI / 2;
                    break;
                case 1: // right
                    crack.position.set(
                        this.width / 2 + 0.01,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    crack.rotation.z = Math.PI / 2;
                    crack.rotation.y = Math.PI / 2;
                    break;
                case 2: // back
                    crack.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        -this.depth / 2 - 0.01
                    );
                    crack.rotation.x = -Math.PI / 2;
                    break;
                case 3: // left
                    crack.position.set(
                        -this.width / 2 - 0.01,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    crack.rotation.z = -Math.PI / 2;
                    crack.rotation.y = Math.PI / 2;
                    break;
            }
            
            buildingGroup.add(crack);
        }
        
        // Add vines growing on the building
        for (let i = 0; i < 3; i++) {
            // Create a vine system
            const vineGroup = new THREE.Group();
            
            // Main vine
            const mainVineLength = 1.5 + Math.random() * 2;
            const mainVineWidth = 0.05;
            const mainVineGeometry = new THREE.CylinderGeometry(mainVineWidth, mainVineWidth, mainVineLength, 8);
            const mainVine = new THREE.Mesh(mainVineGeometry, vineMaterial);
            
            // Rotate to grow along wall
            mainVine.rotation.z = Math.PI / 2;
            
            // Move origin to bottom of vine
            mainVineGeometry.translate(0, mainVineLength / 2, 0);
            
            vineGroup.add(mainVine);
            
            // Add branches
            const branchCount = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < branchCount; j++) {
                const branchLength = 0.5 + Math.random() * 1;
                const branchWidth = 0.03;
                const branchGeometry = new THREE.CylinderGeometry(branchWidth, branchWidth, branchLength, 8);
                const branch = new THREE.Mesh(branchGeometry, vineMaterial);
                
                // Position along main vine
                const position = (j + 1) / (branchCount + 1) * mainVineLength;
                
                // Rotate branch
                const angle = Math.random() * Math.PI;
                branch.rotation.x = angle;
                
                // Move origin to connection point
                branchGeometry.translate(0, branchLength / 2, 0);
                
                branch.position.set(0, position, 0);
                
                vineGroup.add(branch);
            }
            
            // Position the vine group on a random wall
            const side = Math.floor(Math.random() * 4); // 0: front, 1: right, 2: back, 3: left
            const height = Math.random() * this.height * 0.5;
            
            switch (side) {
                case 0: // front
                    vineGroup.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        this.depth / 2 + 0.05
                    );
                    vineGroup.rotation.y = Math.PI / 2;
                    break;
                case 1: // right
                    vineGroup.position.set(
                        this.width / 2 + 0.05,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    vineGroup.rotation.y = 0;
                    break;
                case 2: // back
                    vineGroup.position.set(
                        (Math.random() - 0.5) * this.width * 0.8,
                        height,
                        -this.depth / 2 - 0.05
                    );
                    vineGroup.rotation.y = -Math.PI / 2;
                    break;
                case 3: // left
                    vineGroup.position.set(
                        -this.width / 2 - 0.05,
                        height,
                        (Math.random() - 0.5) * this.depth * 0.8
                    );
                    vineGroup.rotation.y = Math.PI;
                    break;
            }
            
            buildingGroup.add(vineGroup);
        }
    }
}