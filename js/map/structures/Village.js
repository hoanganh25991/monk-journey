import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';
import { Building } from './Building.js';
import { Tower } from './Tower.js';

/**
 * Creates a village structure with multiple buildings
 */
export class Village {
    /**
     * Create a new village
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {object} options - Village configuration options
     */
    constructor(zoneType = 'Forest', options = {}) {
        this.zoneType = zoneType;
        
        // Default options
        this.options = {
            size: options.size || 'medium', // small, medium, large
            buildingCount: options.buildingCount || this.getDefaultBuildingCount(options.size),
            hasTower: options.hasTower !== undefined ? options.hasTower : Math.random() > 0.5,
            hasWell: options.hasWell !== undefined ? options.hasWell : Math.random() > 0.3,
            hasMarket: options.hasMarket !== undefined ? options.hasMarket : Math.random() > 0.5,
            layout: options.layout || 'circular', // circular, grid, random
            radius: options.radius || 15 + Math.random() * 10
        };
    }
    
    /**
     * Get default building count based on village size
     * @param {string} size - Village size
     * @returns {number} - Default building count
     */
    getDefaultBuildingCount(size) {
        switch(size) {
            case 'small':
                return 3 + Math.floor(Math.random() * 3);
            case 'medium':
                return 6 + Math.floor(Math.random() * 4);
            case 'large':
                return 10 + Math.floor(Math.random() * 6);
            default:
                return 5 + Math.floor(Math.random() * 5);
        }
    }
    
    /**
     * Create the village mesh
     * @returns {THREE.Group} - The village group
     */
    createMesh() {
        const villageGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Extract options
        const { buildingCount, hasTower, hasWell, hasMarket, layout, radius } = this.options;
        
        // Create buildings based on layout
        switch(layout) {
            case 'circular':
                this.createCircularLayout(villageGroup, buildingCount, radius);
                break;
            case 'grid':
                this.createGridLayout(villageGroup, buildingCount);
                break;
            case 'random':
            default:
                this.createRandomLayout(villageGroup, buildingCount, radius);
                break;
        }
        
        // Add tower if needed
        if (hasTower) {
            this.addTower(villageGroup);
        }
        
        // Add well if needed
        if (hasWell) {
            this.addWell(villageGroup);
        }
        
        // Add market if needed
        if (hasMarket) {
            this.addMarket(villageGroup);
        }
        
        // Add paths between buildings
        this.createPaths(villageGroup);
        
        return villageGroup;
    }
    
    /**
     * Create a circular layout for buildings
     * @param {THREE.Group} villageGroup - The village group
     * @param {number} buildingCount - Number of buildings
     * @param {number} radius - Village radius
     */
    createCircularLayout(villageGroup, buildingCount, radius) {
        for (let i = 0; i < buildingCount; i++) {
            // Calculate position on circle
            const angle = (i / buildingCount) * Math.PI * 2;
            const distance = radius * (0.6 + Math.random() * 0.4); // Vary distance slightly
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create building
            this.addBuilding(villageGroup, x, z);
        }
    }
    
    /**
     * Create a grid layout for buildings
     * @param {THREE.Group} villageGroup - The village group
     * @param {number} buildingCount - Number of buildings
     */
    createGridLayout(villageGroup, buildingCount) {
        // Calculate grid size
        const gridSize = Math.ceil(Math.sqrt(buildingCount));
        const spacing = 8; // Space between buildings
        
        let buildingsPlaced = 0;
        
        for (let row = 0; row < gridSize && buildingsPlaced < buildingCount; row++) {
            for (let col = 0; col < gridSize && buildingsPlaced < buildingCount; col++) {
                // Add some randomness to grid positions
                const offsetX = (Math.random() - 0.5) * 2;
                const offsetZ = (Math.random() - 0.5) * 2;
                
                const x = (col - gridSize / 2 + 0.5) * spacing + offsetX;
                const z = (row - gridSize / 2 + 0.5) * spacing + offsetZ;
                
                // Skip some positions randomly for more natural look
                if (Math.random() > 0.8) {
                    continue;
                }
                
                // Create building
                this.addBuilding(villageGroup, x, z);
                buildingsPlaced++;
            }
        }
    }
    
    /**
     * Create a random layout for buildings
     * @param {THREE.Group} villageGroup - The village group
     * @param {number} buildingCount - Number of buildings
     * @param {number} radius - Village radius
     */
    createRandomLayout(villageGroup, buildingCount, radius) {
        for (let i = 0; i < buildingCount; i++) {
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const distance = radius * Math.sqrt(Math.random()); // Square root for even distribution
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create building
            this.addBuilding(villageGroup, x, z);
        }
    }
    
    /**
     * Add a building to the village
     * @param {THREE.Group} villageGroup - The village group
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    addBuilding(villageGroup, x, z) {
        // Randomize building dimensions
        const width = 3 + Math.random() * 4;
        const depth = 3 + Math.random() * 4;
        const height = 2 + Math.random() * 3;
        
        // Create building
        const building = new Building(this.zoneType, width, depth, height);
        const buildingMesh = building.createMesh();
        
        // Position building
        buildingMesh.position.set(x, 0, z);
        
        // Random rotation
        buildingMesh.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to village group
        villageGroup.add(buildingMesh);
    }
    
    /**
     * Add a tower to the village
     * @param {THREE.Group} villageGroup - The village group
     */
    addTower(villageGroup) {
        // Create tower
        const tower = new Tower(this.zoneType);
        const towerMesh = tower.createMesh();
        
        // Position tower at center or slightly offset
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetZ = (Math.random() - 0.5) * 5;
        towerMesh.position.set(offsetX, 0, offsetZ);
        
        // Add to village group
        villageGroup.add(towerMesh);
    }
    
    /**
     * Add a well to the village
     * @param {THREE.Group} villageGroup - The village group
     */
    addWell(villageGroup) {
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create well group
        const wellGroup = new THREE.Group();
        
        // Create well base (cylinder)
        const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = 0.5;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        wellGroup.add(baseMesh);
        
        // Create well interior (darker cylinder)
        const interiorGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.1, 16);
        const interiorMaterial = new THREE.MeshStandardMaterial({
            color: 0x000033, // Dark blue for water
            roughness: 0.5,
            metalness: 0.3
        });
        
        const interiorMesh = new THREE.Mesh(interiorGeometry, interiorMaterial);
        interiorMesh.position.y = 0.5;
        wellGroup.add(interiorMesh);
        
        // Create support material for wooden elements
        const supportMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create well roof supports
        for (let i = 0; i < 2; i++) {
            const supportGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
            const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
            supportMesh.position.set(i === 0 ? -1.5 : 1.5, 1.5, 0);
            supportMesh.castShadow = true;
            wellGroup.add(supportMesh);
        }
        
        // Create well roof
        const roofGeometry = new THREE.ConeGeometry(2, 1, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = 3.5;
        roofMesh.rotation.y = Math.PI / 4; // Rotate to align with square base
        roofMesh.castShadow = true;
        wellGroup.add(roofMesh);
        
        // Create crossbeam
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
        const beamMesh = new THREE.Mesh(beamGeometry, supportMaterial);
        beamMesh.position.y = 3;
        beamMesh.rotation.z = Math.PI / 2; // Rotate to horizontal
        beamMesh.castShadow = true;
        wellGroup.add(beamMesh);
        
        // Position well
        const angle = Math.random() * Math.PI * 2;
        const distance = this.options.radius * 0.3;
        wellGroup.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        // Add to village group
        villageGroup.add(wellGroup);
    }
    
    /**
     * Add a market to the village
     * @param {THREE.Group} villageGroup - The village group
     */
    addMarket(villageGroup) {
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create market group
        const marketGroup = new THREE.Group();
        
        // Create market stalls
        const stallCount = 3 + Math.floor(Math.random() * 3);
        const stallRadius = 5;
        
        for (let i = 0; i < stallCount; i++) {
            // Calculate position in circle
            const angle = (i / stallCount) * Math.PI * 2;
            const x = Math.cos(angle) * stallRadius;
            const z = Math.sin(angle) * stallRadius;
            
            // Create stall
            const stallGroup = this.createMarketStall(zoneColors);
            stallGroup.position.set(x, 0, z);
            
            // Rotate stall to face center
            stallGroup.rotation.y = angle + Math.PI;
            
            // Add to market group
            marketGroup.add(stallGroup);
        }
        
        // Position market
        const angle = Math.random() * Math.PI * 2;
        const distance = this.options.radius * 0.5;
        marketGroup.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        // Add to village group
        villageGroup.add(marketGroup);
    }
    
    /**
     * Create a market stall
     * @param {object} zoneColors - Colors for the current zone
     * @returns {THREE.Group} - The market stall group
     */
    createMarketStall(zoneColors) {
        const stallGroup = new THREE.Group();
        
        // Create stall base
        const baseGeometry = new THREE.BoxGeometry(3, 0.2, 2);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = 0.1;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        stallGroup.add(baseMesh);
        
        // Create stall counter
        const counterGeometry = new THREE.BoxGeometry(3, 0.8, 0.5);
        const counterMesh = new THREE.Mesh(counterGeometry, baseMaterial);
        counterMesh.position.set(0, 0.5, 0.75);
        counterMesh.castShadow = true;
        counterMesh.receiveShadow = true;
        stallGroup.add(counterMesh);
        
        // Create stall roof supports
        for (let i = 0; i < 2; i++) {
            const supportGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
            const supportMesh = new THREE.Mesh(supportGeometry, baseMaterial);
            supportMesh.position.set(i === 0 ? -1.4 : 1.4, 1, 0.75);
            supportMesh.castShadow = true;
            stallGroup.add(supportMesh);
        }
        
        // Create stall roof
        const roofGeometry = new THREE.BoxGeometry(3.5, 0.2, 2.5);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xD2691E,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = 2;
        roofMesh.castShadow = true;
        stallGroup.add(roofMesh);
        
        // Add random goods on the counter
        this.addMarketGoods(stallGroup, zoneColors);
        
        return stallGroup;
    }
    
    /**
     * Add goods to a market stall
     * @param {THREE.Group} stallGroup - The stall group
     * @param {object} zoneColors - Colors for the current zone
     */
    addMarketGoods(stallGroup, zoneColors) {
        // Random goods count
        const goodsCount = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < goodsCount; i++) {
            // Random position on counter
            const x = (Math.random() - 0.5) * 2.5;
            
            // Random good type
            const goodType = Math.floor(Math.random() * 4);
            let goodGeometry, goodMaterial, goodMesh;
            
            switch(goodType) {
                case 0: // Box/crate
                    goodGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                    goodMaterial = new THREE.MeshStandardMaterial({
                        color: 0x8B4513,
                        roughness: 0.8,
                        metalness: 0.1
                    });
                    goodMesh = new THREE.Mesh(goodGeometry, goodMaterial);
                    break;
                    
                case 1: // Fruit/vegetable (sphere)
                    goodGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                    goodMaterial = new THREE.MeshStandardMaterial({
                        color: Math.random() > 0.5 ? 0xFF6347 : 0x32CD32, // Red or green
                        roughness: 0.8,
                        metalness: 0.1
                    });
                    goodMesh = new THREE.Mesh(goodGeometry, goodMaterial);
                    break;
                    
                case 2: // Bottle/potion
                    goodGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
                    goodMaterial = new THREE.MeshStandardMaterial({
                        color: Math.random() > 0.5 ? 0x1E90FF : 0xFF69B4, // Blue or pink
                        roughness: 0.4,
                        metalness: 0.6,
                        transparent: true,
                        opacity: 0.8
                    });
                    goodMesh = new THREE.Mesh(goodGeometry, goodMaterial);
                    break;
                    
                case 3: // Bread/loaf
                    goodGeometry = new THREE.CapsuleGeometry(0.15, 0.3, 4, 8);
                    goodMaterial = new THREE.MeshStandardMaterial({
                        color: 0xDEB887, // Burlywood
                        roughness: 0.9,
                        metalness: 0.1
                    });
                    goodMesh = new THREE.Mesh(goodGeometry, goodMaterial);
                    goodMesh.rotation.z = Math.PI / 2; // Lay on side
                    break;
            }
            
            // Position good on counter
            goodMesh.position.set(x, 1, 0.75);
            goodMesh.castShadow = true;
            stallGroup.add(goodMesh);
        }
    }
    
    /**
     * Create paths between buildings
     * @param {THREE.Group} villageGroup - The village group
     */
    createPaths(villageGroup) {
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create path material
        const pathMaterial = new THREE.MeshStandardMaterial({
            color: this.zoneType === 'Terrant' ? zoneColors.soil : 0xA9A9A9, // Gray or soil color
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Get all building positions
        const buildings = [];
        villageGroup.traverse(child => {
            // Only consider direct children of village group that are groups themselves
            // (buildings, tower, well, market)
            if (child instanceof THREE.Group && child.parent === villageGroup && child !== villageGroup) {
                buildings.push({
                    position: child.position.clone(),
                    isSpecial: child.userData.isSpecial || false
                });
            }
        });
        
        // Skip if not enough buildings
        if (buildings.length < 2) {
            console.warn('Not enough buildings to create paths');
            return;
        }
        
        // Create paths between buildings
        for (let i = 0; i < buildings.length; i++) {
            // Connect to nearest buildings or special structures
            const connectedCount = Math.min(2, buildings.length - 1);
            
            // Find nearest buildings
            const distances = [];
            for (let j = 0; j < buildings.length; j++) {
                if (i !== j) {
                    const dist = buildings[i].position.distanceTo(buildings[j].position);
                    
                    // Skip invalid distances
                    if (isFinite(dist) && !isNaN(dist) && dist > 0.1) {
                        distances.push({
                            index: j,
                            distance: dist,
                            isSpecial: buildings[j].isSpecial
                        });
                    }
                }
            }
            
            // Skip if no valid distances
            if (distances.length === 0) {
                continue;
            }
            
            // Sort by distance
            distances.sort((a, b) => {
                // Prioritize special structures
                if (a.isSpecial && !b.isSpecial) return -1;
                if (!a.isSpecial && b.isSpecial) return 1;
                
                // Then sort by distance
                return a.distance - b.distance;
            });
            
            // Create paths to nearest buildings
            for (let k = 0; k < Math.min(connectedCount, distances.length); k++) {
                const targetIndex = distances[k].index;
                
                // Create path between buildings
                this.createPath(
                    villageGroup,
                    buildings[i].position,
                    buildings[targetIndex].position,
                    pathMaterial
                );
            }
        }
    }
    
    /**
     * Create a path between two points
     * @param {THREE.Group} villageGroup - The village group
     * @param {THREE.Vector3} start - Start position
     * @param {THREE.Vector3} end - End position
     * @param {THREE.Material} material - Path material
     */
    createPath(villageGroup, start, end, material) {
        // Calculate path properties
        const direction = new THREE.Vector3().subVectors(end, start);
        const distance = direction.length();
        const pathWidth = 1;
        
        // Skip if distance is too small or invalid
        if (distance < 0.1 || !isFinite(distance) || isNaN(distance)) {
            console.warn('Skipping path creation: invalid distance', distance);
            return;
        }
        
        // Create path geometry
        const pathGeometry = new THREE.PlaneGeometry(distance, pathWidth);
        
        // Create path mesh
        const pathMesh = new THREE.Mesh(pathGeometry, material);
        
        // Position path
        pathMesh.position.set(
            (start.x + end.x) / 2,
            0.01, // Slightly above ground to prevent z-fighting
            (start.z + end.z) / 2
        );
        
        // Rotate path to align with direction
        pathMesh.rotation.x = -Math.PI / 2; // Lay flat
        pathMesh.rotation.z = -Math.atan2(direction.z, direction.x);
        
        // Add to village group
        pathMesh.receiveShadow = true;
        villageGroup.add(pathMesh);
    }
}