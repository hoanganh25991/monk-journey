import * as THREE from 'three';
import { Building } from './Building.js';
import { Tower } from './Tower.js';
import { Ruins } from './Ruins.js';
import { DarkSanctum } from './DarkSanctum.js';
import { Mountain } from './Mountain.js';
import { Bridge } from './Bridge.js';
import { Village } from './Village.js';
import { RandomGenerator } from '../utils/RandomGenerator.js';

/**
 * Manages structure generation and placement
 * Fully randomized with natural grouping of similar structures
 */
export class StructureManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Structure collections
        this.structures = [];
        this.specialStructures = {}; // Track special structures like Dark Sanctum
        this.structuresPlaced = {}; // Empty object for compatibility with old system
        
        // Structure types (no longer using config)
        this.structureTypes = [
            'house', 'tower', 'ruins', 'darkSanctum', 
            'mountain', 'bridge', 'village'
        ];
        
        // Last player position for distance tracking
        this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
        this.minDistanceForNewStructure = 150; // Increased from 100 to 150 for mobile performance
        this.lastStructureTime = 0;
        this.structureCooldown = 15000; // Increased from 8s to 15s for mobile performance
        
        // Natural grouping settings
        this.groupingProbabilities = {
            'house': 0.85,      // 85% chance that houses will be in groups (villages)
            'tower': 0.4,       // 40% chance that towers will be in groups (fortifications)
            'ruins': 0.6,       // 60% chance that ruins will be in groups (ancient cities)
            'darkSanctum': 0.1, // 10% chance for multiple sanctums (rare)
            'mountain': 0.9,    // 90% chance for mountain ranges
            'bridge': 0.2,      // 20% chance for multiple bridges
            'village': 1.0      // Villages are always groups by definition
        };
        
        this.groupSizes = {
            'house': { min: 3, max: 8 },      // Houses come in groups of 3-8
            'tower': { min: 2, max: 4 },      // Towers come in groups of 2-4
            'ruins': { min: 2, max: 6 },      // Ruins come in groups of 2-6
            'darkSanctum': { min: 2, max: 3 }, // Sanctums come in groups of 2-3 (rare)
            'mountain': { min: 3, max: 7 },    // Mountains come in ranges of 3-7
            'bridge': { min: 2, max: 3 },      // Bridges come in groups of 2-3
            'village': { min: 5, max: 12 }     // Villages have 5-12 buildings
        };
        
        // Group spread determines how tightly packed the groups are
        this.groupSpread = {
            'house': 15,        // Houses spread up to 15 units from center
            'tower': 30,        // Towers spread up to 30 units from center
            'ruins': 25,        // Ruins spread up to 25 units from center
            'darkSanctum': 50,  // Sanctums spread up to 50 units from center
            'mountain': 40,     // Mountains spread up to 40 units from center
            'bridge': 35,       // Bridges spread up to 35 units from center
            'village': 25       // Villages spread up to 25 units from center
        };
        
        // Maximum number of structures to keep in memory
        this.maxStructures = 50; // Increased from 20 to account for groups
    }
    
    /**
     * Initialize the structure system with static structures
     */
    init() {
        // Create initial structures near the player's starting position
        this.createRuins(0, 0);
        
        // Create Dark Sanctum as a landmark
        this.createDarkSanctum(0, -40);
        
        // Mark these initial structures as placed
        this.specialStructures['initial_ruins'] = { x: 0, z: 0, type: 'ruins' };
        this.specialStructures['initial_darkSanctum'] = { x: 0, z: -40, type: 'darkSanctum' };
        
        console.debug("Initial structures created");
    }
    
    /**
     * Check if player has moved far enough to generate a new random structure
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    checkForRandomStructure(playerPosition) {
        // Calculate distance moved since last structure
        const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition);
        const currentTime = Date.now();
        const timeSinceLastStructure = currentTime - this.lastStructureTime;
        
        // Only generate a new structure if player has moved far enough and enough time has passed
        if (distanceMoved >= this.minDistanceForNewStructure && timeSinceLastStructure >= this.structureCooldown) {
            // Update last position and time
            this.lastPlayerPosition.copy(playerPosition);
            this.lastStructureTime = currentTime;
            
            // 30% chance to generate a structure when conditions are met
            if (Math.random() < 0.3) {
                this.generateRandomStructure(playerPosition);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate a random structure or structure group near the player
     * @param {THREE.Vector3} playerPosition - Current player position
     * @returns {Object|null} - Information about the generated structure or null if none was created
     */
    generateRandomStructure(playerPosition) {
        // Choose a random structure type
        const randomType = this.structureTypes[Math.floor(Math.random() * this.structureTypes.length)];
        
        // Generate a position that's visible but not too close to the player
        // Random angle and distance between 50-150 units from player
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        
        const centerX = playerPosition.x + Math.cos(angle) * distance;
        const centerZ = playerPosition.z + Math.sin(angle) * distance;
        
        // Determine if we should create a group or a single structure
        const createGroup = Math.random() < this.groupingProbabilities[randomType];
        
        if (createGroup) {
            // Create a group of structures
            const groupSize = Math.floor(
                this.groupSizes[randomType].min + 
                Math.random() * (this.groupSizes[randomType].max - this.groupSizes[randomType].min)
            );
            
            const spread = this.groupSpread[randomType];
            const groupObjects = [];
            const groupId = `group_${Date.now()}_${randomType}`;
            
            console.debug(`Generating a group of ${groupSize} ${randomType}s at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
            
            // Special handling for villages which need a more organized layout
            if (randomType === 'village') {
                const villageInfo = this.createVillageGroup(centerX, centerZ, groupSize);
                return villageInfo;
            }
            
            // Special handling for mountain ranges which need a more natural formation
            if (randomType === 'mountain') {
                const mountainInfo = this.createMountainRange(centerX, centerZ, groupSize);
                return mountainInfo;
            }
            
            // Create structures in a natural-looking group pattern
            for (let i = 0; i < groupSize; i++) {
                // For natural grouping, use a combination of random and patterned placement
                let structureX, structureZ;
                
                if (i === 0) {
                    // First structure at center
                    structureX = centerX;
                    structureZ = centerZ;
                } else {
                    // Subsequent structures in a natural pattern
                    // Use polar coordinates for more natural grouping
                    const groupAngle = Math.random() * Math.PI * 2;
                    
                    // Distance from center increases slightly with each structure
                    // but with some randomness for natural look
                    const groupDistance = Math.random() * spread * (i / groupSize + 0.3);
                    
                    structureX = centerX + Math.cos(groupAngle) * groupDistance;
                    structureZ = centerZ + Math.sin(groupAngle) * groupDistance;
                }
                
                // Create the structure
                let structure = null;
                
                switch (randomType) {
                    case 'house':
                        // Vary house sizes slightly within a group for natural look
                        const width = 3 + Math.random() * 5;
                        const depth = 3 + Math.random() * 5;
                        const height = 2 + Math.random() * 5;
                        structure = this.createBuilding(structureX, structureZ, width, depth, height);
                        break;
                    case 'tower':
                        structure = this.createTower(structureX, structureZ);
                        break;
                    case 'ruins':
                        structure = this.createRuins(structureX, structureZ);
                        break;
                    case 'darkSanctum':
                        structure = this.createDarkSanctum(structureX, structureZ);
                        break;
                    case 'bridge':
                        structure = this.createBridge(structureX, structureZ);
                        break;
                }
                
                if (structure) {
                    // Create structure info
                    const structureInfo = {
                        type: randomType,
                        object: structure,
                        position: new THREE.Vector3(structureX, 0, structureZ),
                        groupId: groupId
                    };
                    
                    // Add to structures array for tracking
                    this.structures.push(structureInfo);
                    
                    groupObjects.push(structure);
                }
            }
            
            console.debug(`Created group of ${groupObjects.length} ${randomType}s`);
            
            // Return info about the group
            return {
                type: randomType,
                isGroup: true,
                groupId: groupId,
                position: new THREE.Vector3(centerX, 0, centerZ),
                count: groupObjects.length
            };
        } else {
            // Create a single structure
            let structure = null;
            
            switch (randomType) {
                case 'house':
                    const width = 3 + Math.random() * 5;
                    const depth = 3 + Math.random() * 5;
                    const height = 2 + Math.random() * 5;
                    structure = this.createBuilding(centerX, centerZ, width, depth, height);
                    break;
                case 'tower':
                    structure = this.createTower(centerX, centerZ);
                    break;
                case 'ruins':
                    structure = this.createRuins(centerX, centerZ);
                    break;
                case 'darkSanctum':
                    structure = this.createDarkSanctum(centerX, centerZ);
                    break;
                case 'mountain':
                    structure = this.createMountain(centerX, centerZ);
                    break;
                case 'bridge':
                    structure = this.createBridge(centerX, centerZ);
                    break;
                case 'village':
                    structure = this.createVillage(centerX, centerZ);
                    break;
            }
            
            if (structure) {
                console.debug(`Generated single ${randomType} at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
                
                // Create structure info
                const structureInfo = {
                    type: randomType,
                    object: structure,
                    position: new THREE.Vector3(centerX, 0, centerZ)
                };
                
                // Add to structures array for tracking
                this.structures.push(structureInfo);
                
                // Limit the number of structures to prevent memory issues
                if (this.structures.length > this.maxStructures) {
                    const oldestStructure = this.structures.shift();
                    if (oldestStructure.object && oldestStructure.object.parent) {
                        this.scene.remove(oldestStructure.object);
                    }
                }
                
                return structureInfo;
            }
        }
        
        return null;
    }
    
    /**
     * Create a village group with organized layout
     * @param {number} centerX - X coordinate of village center
     * @param {number} centerZ - Z coordinate of village center
     * @param {number} buildingCount - Number of buildings in the village
     * @returns {Object} - Information about the created village
     */
    createVillageGroup(centerX, centerZ, buildingCount) {
        console.debug(`Creating village with ${buildingCount} buildings at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
        
        const groupId = `village_${Date.now()}`;
        const villageBuildings = [];
        
        // Create a central village structure
        const villageCenter = this.createVillage(centerX, centerZ);
        
        if (villageCenter) {
            // Create village info
            const villageCenterInfo = {
                type: 'village',
                object: villageCenter,
                position: new THREE.Vector3(centerX, 0, centerZ),
                groupId: groupId
            };
            
            // Add to structures array
            this.structures.push(villageCenterInfo);
            villageBuildings.push(villageCenterInfo);
            
            // Create a path around the village center (circular path)
            this.createVillagePath(centerX, centerZ, 12);
            
            // Create houses around the village center
            // Use a spiral pattern for more organized village layout
            const spread = this.groupSpread['village'];
            
            for (let i = 0; i < buildingCount - 1; i++) {
                // Spiral pattern
                const angle = i * 0.5; // Gradually increasing angle
                const radius = 5 + i * 3; // Gradually increasing radius
                
                const houseX = centerX + Math.cos(angle) * radius;
                const houseZ = centerZ + Math.sin(angle) * radius;
                
                // Vary house sizes
                const width = 3 + Math.random() * 4;
                const depth = 3 + Math.random() * 4;
                const height = 2 + Math.random() * 3;
                
                const house = this.createBuilding(houseX, houseZ, width, depth, height);
                
                if (house) {
                    // Rotate house to face village center
                    const angleToCenter = Math.atan2(centerZ - houseZ, centerX - houseX);
                    house.rotation.y = angleToCenter;
                    
                    // Create house info
                    const houseInfo = {
                        type: 'house',
                        object: house,
                        position: new THREE.Vector3(houseX, 0, houseZ),
                        groupId: groupId
                    };
                    
                    // Add to structures array
                    this.structures.push(houseInfo);
                    villageBuildings.push(houseInfo);
                    
                    // Create small paths connecting houses to the center
                    if (i % 2 === 0) { // Only create paths for some houses to avoid clutter
                        this.createVillageHousePath(centerX, centerZ, houseX, houseZ);
                    }
                }
            }
            
            // Return info about the village
            return {
                type: 'village',
                isGroup: true,
                groupId: groupId,
                position: new THREE.Vector3(centerX, 0, centerZ),
                count: villageBuildings.length
            };
        }
        
        return null;
    }
    
    /**
     * Create a circular path around a village center
     * @param {number} centerX - X coordinate of village center
     * @param {number} centerZ - Z coordinate of village center
     * @param {number} radius - Radius of the path
     */
    createVillagePath(centerX, centerZ, radius) {
        // Create a circular path around the village center
        const segments = 12; // Number of segments in the circle
        
        for (let i = 0; i < segments; i++) {
            const startAngle = (i / segments) * Math.PI * 2;
            const endAngle = ((i + 1) / segments) * Math.PI * 2;
            
            const startX = centerX + Math.cos(startAngle) * radius;
            const startZ = centerZ + Math.sin(startAngle) * radius;
            
            const endX = centerX + Math.cos(endAngle) * radius;
            const endZ = centerZ + Math.sin(endAngle) * radius;
            
            // Create path segment
            if (this.game && this.game.worldManager && this.game.worldManager.createPathSegment) {
                this.game.worldManager.createPathSegment(startX, startZ, endX, endZ);
            }
        }
    }
    
    /**
     * Create a path from village center to a house
     * @param {number} centerX - X coordinate of village center
     * @param {number} centerZ - Z coordinate of village center
     * @param {number} houseX - X coordinate of house
     * @param {number} houseZ - Z coordinate of house
     */
    createVillageHousePath(centerX, centerZ, houseX, houseZ) {
        // Create a path from the village center to the house
        if (this.game && this.game.worldManager && this.game.worldManager.createPathSegment) {
            this.game.worldManager.createPathSegment(centerX, centerZ, houseX, houseZ);
        }
    }
    
    /**
     * Create a mountain range with natural formation
     * @param {number} centerX - X coordinate of range center
     * @param {number} centerZ - Z coordinate of range center
     * @param {number} mountainCount - Number of mountains in the range
     * @returns {Object} - Information about the created mountain range
     */
    createMountainRange(centerX, centerZ, mountainCount) {
        console.debug(`Creating mountain range with ${mountainCount} peaks at (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
        
        const groupId = `mountain_range_${Date.now()}`;
        const mountains = [];
        
        // Create mountains in a line or arc formation
        const isLinear = Math.random() > 0.3; // 70% chance of linear formation
        const spread = this.groupSpread['mountain'];
        
        // Choose a main direction for the range
        const rangeAngle = Math.random() * Math.PI * 2;
        
        // Create a path along the mountain range
        const pathPoints = [];
        
        for (let i = 0; i < mountainCount; i++) {
            let mountainX, mountainZ;
            
            if (isLinear) {
                // Linear mountain range
                const distance = (i - mountainCount / 2) * (spread / 2);
                mountainX = centerX + Math.cos(rangeAngle) * distance;
                mountainZ = centerZ + Math.sin(rangeAngle) * distance;
                
                // Add some randomness perpendicular to the main direction
                const perpAngle = rangeAngle + Math.PI / 2;
                const perpDistance = (Math.random() - 0.5) * (spread / 3);
                mountainX += Math.cos(perpAngle) * perpDistance;
                mountainZ += Math.sin(perpAngle) * perpDistance;
                
                // Add path point
                if (i > 0 && i < mountainCount - 1) { // Skip first and last for better path
                    pathPoints.push({ x: mountainX, z: mountainZ });
                }
            } else {
                // Arc/cluster formation
                const arcAngle = rangeAngle + (Math.random() - 0.5) * Math.PI / 2;
                const distance = Math.random() * spread;
                mountainX = centerX + Math.cos(arcAngle) * distance;
                mountainZ = centerZ + Math.sin(arcAngle) * distance;
                
                // Add path point if not too close to center
                if (distance > spread * 0.3) {
                    pathPoints.push({ x: mountainX, z: mountainZ });
                }
            }
            
            // Vary mountain sizes
            const scaleFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
            const mountain = this.createMountain(mountainX, mountainZ, scaleFactor);
            
            if (mountain) {
                // Create mountain info
                const mountainInfo = {
                    type: 'mountain',
                    object: mountain,
                    position: new THREE.Vector3(mountainX, 0, mountainZ),
                    groupId: groupId
                };
                
                // Add to structures array
                this.structures.push(mountainInfo);
                mountains.push(mountainInfo);
            }
        }
        
        // Create a path through the mountain range if we have enough points
        if (pathPoints.length >= 2 && this.game && this.game.worldManager && this.game.worldManager.createPathSegment) {
            // Sort path points to create a sensible path
            if (isLinear) {
                // For linear ranges, sort by distance along the range direction
                pathPoints.sort((a, b) => {
                    const aDist = (a.x - centerX) * Math.cos(rangeAngle) + (a.z - centerZ) * Math.sin(rangeAngle);
                    const bDist = (b.x - centerX) * Math.cos(rangeAngle) + (b.z - centerZ) * Math.sin(rangeAngle);
                    return aDist - bDist;
                });
            } else {
                // For arc/cluster, sort by angle around center
                pathPoints.sort((a, b) => {
                    const aAngle = Math.atan2(a.z - centerZ, a.x - centerX);
                    const bAngle = Math.atan2(b.z - centerZ, b.x - centerX);
                    return aAngle - bAngle;
                });
            }
            
            // Create path segments connecting the points
            for (let i = 0; i < pathPoints.length - 1; i++) {
                const start = pathPoints[i];
                const end = pathPoints[i + 1];
                
                // Create path segment with some randomness
                const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 5;
                const midZ = (start.z + end.z) / 2 + (Math.random() - 0.5) * 5;
                
                // Create first half
                this.game.worldManager.createPathSegment(start.x, start.z, midX, midZ);
                
                // Create second half
                this.game.worldManager.createPathSegment(midX, midZ, end.x, end.z);
            }
        }
        
        // Return info about the mountain range
        return {
            type: 'mountain',
            isGroup: true,
            groupId: groupId,
            position: new THREE.Vector3(centerX, 0, centerZ),
            count: mountains.length
        };
    }
    
    /**
     * Legacy method kept for compatibility
     * Now just a stub that does nothing
     */
    generateStructuresForChunk(chunkX, chunkZ, dataOnly = false) {
        // This method is kept as a stub for compatibility
        // It no longer generates structures based on chunks
        return;
    }
    
    /**
     * Compatibility method for the old chunk-based system
     * This is needed because TerrainManager still calls this method
     * @param {string} chunkKey - The chunk key to remove
     * @param {boolean} disposeResources - Whether to dispose resources
     */
    removeStructuresInChunk(chunkKey, disposeResources = false) {
        // In our simplified system, we don't need to do anything here
        // This method is kept for compatibility with TerrainManager
        console.debug(`removeStructuresInChunk called for chunk ${chunkKey} (no action needed in simplified system)`);
        
        // We'll add a check for structures that might be in this chunk area
        // and remove them if they're too far from the player
        if (this.structures && this.structures.length > 0) {
            // Parse chunk coordinates
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            
            // Calculate world coordinates for this chunk
            const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
            const worldX = chunkX * terrainChunkSize;
            const worldZ = chunkZ * terrainChunkSize;
            
            // Remove structures that are in this chunk area
            this.structures = this.structures.filter(structureData => {
                if (!structureData || !structureData.position) return true;
                
                // Check if structure is in this chunk
                const structureX = structureData.position.x;
                const structureZ = structureData.position.z;
                
                const isInChunk = 
                    structureX >= worldX && 
                    structureX < worldX + terrainChunkSize &&
                    structureZ >= worldZ && 
                    structureZ < worldZ + terrainChunkSize;
                
                // If structure is in this chunk, remove it
                if (isInChunk && structureData.object) {
                    console.debug(`Removing structure at (${structureX.toFixed(1)}, ${structureZ.toFixed(1)}) in chunk ${chunkKey}`);
                    this.scene.remove(structureData.object);
                    return false;
                }
                
                return true;
            });
        }
    }
    
    /**
     * Load structures for a chunk from saved data
     * Compatibility method for the old chunk-based system
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {Array} structures - Array of structure data
     */
    loadStructuresForChunk(chunkX, chunkZ, structures) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if already loaded
        if (this.structuresPlaced[chunkKey]) {
            return;
        }
        
        // Mark this chunk as processed to prevent repeated loading
        this.structuresPlaced[chunkKey] = structures || [];
        
        // In our simplified system, we don't need to create objects from saved data
        // We'll just log that this method was called
        console.debug(`loadStructuresForChunk called for chunk ${chunkKey} with ${structures ? structures.length : 0} structures (simplified system)`);
        
        // If we're near the starting area, we might want to create some structures
        // This ensures compatibility with save/load functionality
        if (Math.abs(chunkX) <= 1 && Math.abs(chunkZ) <= 1 && structures && structures.length > 0) {
            console.debug("Loading structures near starting area");
            
            // Create the actual 3D objects for important structures
            structures.forEach(structure => {
                // Only create important structures like darkSanctum
                if (structure.type === 'darkSanctum') {
                    this.createDarkSanctum(structure.x, structure.z);
                    this.specialStructures[`darkSanctum_${chunkKey}_${structures.indexOf(structure)}`] = { 
                        x: structure.x, z: structure.z, type: 'darkSanctum' 
                    };
                }
            });
        }
    }
    
    /**
     * Get the zone type at a specific position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {string} - The zone type (Forest, Desert, etc.)
     */
    getZoneTypeAt(x, z) {
        try {
            // Use the world manager to get the zone at this position
            if (this.worldManager && this.worldManager.zoneManager) {
                // Calculate which chunk this position is in
                const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
                const chunkX = Math.floor(x / terrainChunkSize);
                const chunkZ = Math.floor(z / terrainChunkSize);
                
                // Try to get zone type from the zone manager's chunk cache
                const zoneType = this.worldManager.zoneManager.getZoneTypeForChunk(chunkX, chunkZ);
                if (zoneType) {
                    return zoneType;
                }
                
                // Fallback to position-based lookup
                const position = new THREE.Vector3(x, 0, z);
                const zone = this.worldManager.zoneManager.getZoneAt(position);
                if (zone) {
                    return zone.name;
                }
            } else if (this.worldManager && this.worldManager.getZoneAt) {
                // Legacy method
                const position = new THREE.Vector3(x, 0, z);
                const zone = this.worldManager.getZoneAt(position);
                if (zone) {
                    return zone.name;
                }
            }
        } catch (error) {
            console.warn("Error getting zone type:", error);
        }
        
        // Default to Terrant if no zone found or error
        return 'Terrant';
    }
    
    /**
     * Create a building at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} width - Building width
     * @param {number} depth - Building depth
     * @param {number} height - Building height
     * @returns {THREE.Group} - The building group
     */
    createBuilding(x, z, width, depth, height) {
        const zoneType = this.getZoneTypeAt(x, z);
        const building = new Building(width, depth, height, zoneType);
        const buildingGroup = building.createMesh();
        
        // Position building on terrain
        buildingGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(buildingGroup);
        this.structures.push(buildingGroup);
        
        return buildingGroup;
    }
    
    /**
     * Create a tower at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The tower group
     */
    createTower(x, z) {
        const zoneType = this.getZoneTypeAt(x, z);
        const tower = new Tower(zoneType);
        const towerGroup = tower.createMesh();
        
        // Position tower on terrain
        towerGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(towerGroup);
        this.structures.push(towerGroup);
        
        return towerGroup;
    }
    
    /**
     * Create ruins at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The ruins group
     */
    createRuins(x, z) {
        const ruins = new Ruins();
        const ruinsGroup = ruins.createMesh();
        
        // Position ruins on terrain
        ruinsGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(ruinsGroup);
        this.structures.push(ruinsGroup);
        
        return ruinsGroup;
    }
    
    /**
     * Create a dark sanctum at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The dark sanctum group
     */
    createDarkSanctum(x, z) {
        const darkSanctum = new DarkSanctum();
        const sanctumGroup = darkSanctum.createMesh();
        
        // Position sanctum on terrain
        sanctumGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(sanctumGroup);
        this.structures.push(sanctumGroup);
        
        // Add a boss spawn point
        if (this.worldManager && this.worldManager.interactiveManager) {
            this.worldManager.interactiveManager.createBossSpawnPoint(x, z, 'necromancer_lord');
        }
        
        return sanctumGroup;
    }
    
    /**
     * Create a mountain at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} scaleFactor - Optional scale factor for natural variation
     * @returns {THREE.Group} - The mountain group
     */
    createMountain(x, z, scaleFactor = 1.0) {
        const zoneType = this.getZoneTypeAt(x, z);
        const mountain = new Mountain(zoneType);
        const mountainGroup = mountain.createMesh();
        
        // Apply scale factor for natural variation
        if (scaleFactor !== 1.0) {
            mountainGroup.scale.set(scaleFactor, scaleFactor * 0.8, scaleFactor);
        }
        
        // Add some random rotation for natural look
        mountainGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Position mountain on terrain
        mountainGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(mountainGroup);
        
        return mountainGroup;
    }
    
    /**
     * Create a village at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The village group
     */
    createVillage(x, z) {
        const zoneType = this.getZoneTypeAt(x, z);
        const village = new Village(zoneType);
        const villageGroup = village.createMesh();
        
        // Position village on terrain
        villageGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(villageGroup);
        this.structures.push(villageGroup);
        
        // Add interactive objects like NPCs and treasure chests
        if (this.worldManager && this.worldManager.interactiveManager) {
            // Add a treasure chest
            const chestX = x + (Math.random() * 10 - 5);
            const chestZ = z + (Math.random() * 10 - 5);
            this.worldManager.interactiveManager.createTreasureChest(chestX, chestZ);
            
            // Add quest marker
            const questX = x + (Math.random() * 10 - 5);
            const questZ = z + (Math.random() * 10 - 5);
            this.worldManager.interactiveManager.createQuestMarker(questX, questZ, 'village_quest');
        }
        
        return villageGroup;
    }
    
    /**
     * Create a bridge at the specified position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {THREE.Group} - The bridge group
     */
    createBridge(x, z) {
        const zoneType = this.getZoneTypeAt(x, z);
        const bridge = new Bridge(zoneType);
        const bridgeGroup = bridge.createMesh();
        
        // Position bridge on terrain
        bridgeGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Randomly rotate the bridge
        bridgeGroup.rotation.y = Math.random() * Math.PI;
        
        // Add to scene
        this.scene.add(bridgeGroup);
        this.structures.push(bridgeGroup);
        
        return bridgeGroup;
    }
    
    /**
     * Remove structures in a specific chunk
     * @param {string} chunkKey - The chunk key (x,z format)
     * @param {boolean} disposeResources - Whether to dispose of geometries and materials
     */
    removeStructuresInChunk(chunkKey, disposeResources = false) {
        // Check if we have structures in this chunk
        if (this.structuresPlaced[chunkKey]) {
            // Get structures in this chunk
            const structuresToRemove = this.structures.filter(structure => {
                // Check if structure has position data
                if (structure.userData && structure.userData.chunkKey === chunkKey) {
                    return true;
                }
                return false;
            });
            
            // Remove structures from scene and dispose resources
            structuresToRemove.forEach(structure => {
                // Remove from scene
                if (structure.parent) {
                    this.scene.remove(structure);
                }
                
                // Dispose of resources if requested
                if (disposeResources) {
                    // Dispose of geometry
                    if (structure.geometry) {
                        structure.geometry.dispose();
                    }
                    
                    // Dispose of materials
                    if (structure.material) {
                        if (Array.isArray(structure.material)) {
                            structure.material.forEach(material => {
                                if (material.map) material.map.dispose();
                                material.dispose();
                            });
                        } else {
                            if (structure.material.map) structure.material.map.dispose();
                            structure.material.dispose();
                        }
                    }
                    
                    // Handle child objects
                    if (structure.children && structure.children.length > 0) {
                        structure.children.forEach(child => {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(material => {
                                        if (material.map) material.map.dispose();
                                        material.dispose();
                                    });
                                } else {
                                    if (child.material.map) child.material.map.dispose();
                                    child.material.dispose();
                                }
                            }
                        });
                    }
                }
            });
            
            // Remove structures from the structures array
            this.structures = this.structures.filter(structure => {
                return !(structure.userData && structure.userData.chunkKey === chunkKey);
            });
            
            // Remove from structuresPlaced
            delete this.structuresPlaced[chunkKey];
            
            // console.debug(`Removed ${structuresToRemove.length} structures from chunk ${chunkKey}`);
        }
    }
    
    /**
     * Clear all structures
     */
    clear() {
        // Remove all structures from the scene
        this.structures.forEach(structure => {
            if (structure.parent) {
                this.scene.remove(structure);
            }
            
            // Dispose of geometry
            if (structure.geometry) {
                structure.geometry.dispose();
            }
            
            // Dispose of materials
            if (structure.material) {
                if (Array.isArray(structure.material)) {
                    structure.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (structure.material.map) structure.material.map.dispose();
                    structure.material.dispose();
                }
            }
        });
        
        // Reset collections
        this.structures = [];
        this.structuresPlaced = {};
        this.specialStructures = {};
    }
    
    /**
     * Save structure state
     * @returns {object} - The saved structure state
     */
    save() {
        return {
            structuresPlaced: this.structuresPlaced,
            specialStructures: this.specialStructures
        };
    }
    
    /**
     * Load structure state
     * @param {object} structureState - The structure state to load
     */
    load(structureState) {
        if (!structureState) return;
        
        if (structureState.structuresPlaced) {
            this.structuresPlaced = structureState.structuresPlaced;
        }
        
        if (structureState.specialStructures) {
            this.specialStructures = structureState.specialStructures;
        }
    }
}