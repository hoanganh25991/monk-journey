import * as THREE from 'three';
import { STRUCTURE_OBJECTS } from '../../config/structure.js';
import { StructureFactory } from './StructureFactory.js';
import { Building } from './Building.js';
import { Tower } from './Tower.js';
import { Ruins } from './Ruins.js';
import { DarkSanctum } from './DarkSanctum.js';
import { Mountain } from './Mountain.js';
import { Bridge } from './Bridge.js';
import { Village } from './Village.js';

/**
 * Manages structure loading and placement from map data
 * Simplified to focus only on loading existing structures from map data
 */
export class StructureManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Initialize structure factory
        this.structureFactory = new StructureFactory(scene, worldManager);
        
        // Structure collections
        this.structures = [];
        this.structuresPlaced = {}; // Track which chunks have structures placed
        this.specialStructures = {}; // Track special structures like Dark Sanctum
        
        // Structure types (using constants from config)
        this.structureTypes = Object.values(STRUCTURE_OBJECTS);
    }
    
    /**
     * Initialize the structure system
     * @param {boolean} createInitialStructures - Whether to create initial structures (default: false)
     */
    init(createInitialStructures = false) {
        // Only create initial structures if specifically requested
        if (createInitialStructures) {
            // Create initial structures near the player's starting position
            // Use the constants directly as the type parameter
            const ruins = this.structureFactory.createStructure(STRUCTURE_OBJECTS.RUINS, { x: 0, z: 0 });
            const darkSanctum = this.structureFactory.createStructure(STRUCTURE_OBJECTS.DARK_SANCTUM, { x: 0, z: -40 });
            
            // Add to structures array for tracking
            if (ruins) {
                this.structures.push({
                    type: STRUCTURE_OBJECTS.RUINS,
                    object: ruins,
                    position: new THREE.Vector3(0, 0, 0),
                    id: 'initial_ruins'
                });
            }
            
            if (darkSanctum) {
                this.structures.push({
                    type: STRUCTURE_OBJECTS.DARK_SANCTUM,
                    object: darkSanctum,
                    position: new THREE.Vector3(0, 0, -40),
                    id: 'initial_dark_sanctum'
                });
            }
            
            // Mark these initial structures as placed
            this.specialStructures['initial_ruins'] = { x: 0, z: 0, type: STRUCTURE_OBJECTS.RUINS };
            this.specialStructures['initial_dark_sanctum'] = { x: 0, z: -40, type: STRUCTURE_OBJECTS.DARK_SANCTUM };
            
            console.debug("Initial structures created");
        } else {
            console.debug("Structure manager initialized without initial structures");
        }
    }
    
    /**
     * Load structures from map data
     * @param {Array} structuresData - Array of structure data from map
     */
    loadFromMapData(structuresData) {
        if (!structuresData || !Array.isArray(structuresData)) {
            console.warn('No structure data provided to load');
            return;
        }

        console.debug(`Loading ${structuresData.length} structures from map data`);

        // Clear existing structures
        this.clear();

        structuresData.forEach(structureData => {
            if (structureData.type && structureData.position) {
                let structure = null;

                // Create the appropriate structure using the factory
                const params = {
                    x: structureData.position.x,
                    z: structureData.position.z,
                    width: structureData.width,
                    depth: structureData.depth,
                    height: structureData.height,
                    style: structureData.type,
                    scale: structureData.scale
                };
                
                structure = this.structureFactory.createStructure(structureData.type, params);
                
                if (!structure) {
                    console.warn(`Failed to create structure of type: ${structureData.type}`);
                }

                if (structure) {
                    // Apply rotation if specified
                    if (structureData.rotation !== undefined) {
                        structure.rotation.y = structureData.rotation;
                    }
                    
                    // Create structure info
                    const structureInfo = {
                        type: structureData.type,
                        object: structure,
                        position: new THREE.Vector3(
                            structureData.position.x,
                            structureData.position.y || 0,
                            structureData.position.z
                        ),
                        id: structureData.id,
                        groupId: structureData.groupId
                    };
                    
                    // Add to structures array for tracking
                    this.structures.push(structureInfo);
                    
                    // If it's a special structure, add to special structures
                    if (structureData.isSpecial) {
                        this.specialStructures[structureData.id] = {
                            x: structureData.position.x,
                            z: structureData.position.z,
                            type: structureData.type
                        };
                    }
                }
            }
        });

        console.debug(`Successfully loaded ${this.structures.length} structures`);
    }
    
    /**
     * Clear all structures
     */
    clear() {
        // Remove all structures from the scene
        this.structures.forEach(structureInfo => {
            if (structureInfo.object && structureInfo.object.parent) {
                this.scene.remove(structureInfo.object);
            }
            
            // Dispose of geometries and materials to free memory
            if (structureInfo.object) {
                if (structureInfo.object.traverse) {
                    structureInfo.object.traverse(obj => {
                        if (obj.geometry) {
                            obj.geometry.dispose();
                        }
                        if (obj.material) {
                            if (Array.isArray(obj.material)) {
                                obj.material.forEach(mat => mat.dispose());
                            } else {
                                obj.material.dispose();
                            }
                        }
                    });
                }
            }
        });
        
        // Reset structures collections
        this.structures = [];
        this.specialStructures = {};
        
        console.debug("All structures cleared");
    }
    
    // Save and load methods have been removed as they are no longer needed
    // World is generated in-memory and not saved/loaded
    
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
        
        // Create a central village structure using the factory
        const villageCenter = this.structureFactory.createStructure(STRUCTURE_OBJECTS.VILLAGE, { 
            x: centerX, 
            z: centerZ 
        });
        
        if (villageCenter) {
            // Create village info
            const villageCenterInfo = {
                type: STRUCTURE_OBJECTS.VILLAGE,
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
                
                const house = this.structureFactory.createStructure(STRUCTURE_OBJECTS.HOUSE, {
                    x: houseX,
                    z: houseZ,
                    width: width,
                    depth: depth,
                    height: height
                });
                
                if (house) {
                    // Rotate house to face village center
                    const angleToCenter = Math.atan2(centerZ - houseZ, centerX - houseX);
                    house.rotation.y = angleToCenter;
                    
                    // Create house info
                    const houseInfo = {
                        type: STRUCTURE_OBJECTS.HOUSE,
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
            const mountain = this.structureFactory.createStructure(STRUCTURE_OBJECTS.MOUNTAIN, {
                x: mountainX,
                z: mountainZ,
                scale: scaleFactor
            });
            
            if (mountain) {
                // Create mountain info
                const mountainInfo = {
                    type: STRUCTURE_OBJECTS.MOUNTAIN,
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
     * Generate structures for a chunk based on zone type and density
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {string|boolean} zoneType - Type of zone (Forest, Desert, etc.) or boolean flag for data-only generation
     * @param {object} zoneDensity - Density configuration for the zone
     */
    generateStructuresForChunk(chunkX, chunkZ, zoneType, zoneDensity) {
        // Handle the case when zoneType is a boolean (data-only flag)
        // This happens when called from TerrainChunkManager
        const dataOnly = typeof zoneType === 'boolean' ? zoneType : false;
        
        // If zoneType is not provided or is a boolean, get it from the world manager
        if (!zoneType || typeof zoneType === 'boolean') {
            // Calculate world coordinates for this chunk
            const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Get zone type from the world manager
            if (this.worldManager && this.worldManager.generationManager) {
                zoneType = this.worldManager.generationManager.getZoneTypeAt(worldX, worldZ);
            } else {
                // Default to Forest if we can't determine zone type
                zoneType = 'Forest';
            }
            
            // Get zone density from the world manager
            if (this.worldManager && this.worldManager.zoneDensities) {
                zoneDensity = this.worldManager.zoneDensities[zoneType];
            }
        }
        
        // Skip if no zone density is provided
        if (!zoneDensity) {
            console.warn(`No zone density provided for zone type: ${zoneType}`);
            return;
        }
        
        // Calculate world coordinates for this chunk
        const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const worldX = chunkX * chunkSize;
        const worldZ = chunkZ * chunkSize;
        
        // Create a unique key for this chunk
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if we've already generated structures for this chunk
        if (this.structuresPlaced[chunkKey]) {
            return;
        }
        
        // If this is a data-only call, just mark the chunk as processed and return
        if (dataOnly) {
            this.structuresPlaced[chunkKey] = true;
            return;
        }
        
        console.debug(`Generating structures for chunk ${chunkKey} (${zoneType})`);
        
        // Mark this chunk as having structures
        this.structuresPlaced[chunkKey] = true;
        
        // Get structure types for this zone
        const structureTypes = zoneDensity.structureTypes || [];
        if (structureTypes.length === 0) {
            console.warn(`No structure types defined for zone: ${zoneType}`);
            return;
        }
        
        // Calculate probability of placing a structure in this chunk
        // Apply the structure density setting as a multiplier
        const baseProbability = 0.2; // Base probability of placing a structure
        const densityFactor = zoneDensity.structures || 0.2;
        const probability = baseProbability * densityFactor * this.worldManager.worldScale;
        
        // Determine if we should place a structure in this chunk
        if (Math.random() < probability) {
            // Choose a random position within the chunk
            const offsetX = Math.random() * chunkSize * 0.8 + chunkSize * 0.1; // Keep away from edges
            const offsetZ = Math.random() * chunkSize * 0.8 + chunkSize * 0.1; // Keep away from edges
            const x = worldX + offsetX;
            const z = worldZ + offsetZ;
            
            // Choose a random structure type for this zone
            const typeIndex = Math.floor(Math.random() * structureTypes.length);
            const type = structureTypes[typeIndex];
            
            // Create the structure
            let structure = null;
            
            // Map the zone type string to our structure object constants
            let structureType;
            // Convert the type to uppercase for the object key
            const objectKey = type.toUpperCase();
            structureType = STRUCTURE_OBJECTS[objectKey];
            
            if (!structureType) {
                console.warn(`Unknown structure type: ${type}`);
            }
            
            if (structureType) {
                // Get default properties for this structure type
                const defaultProps = this.structureFactory.getDefaultProperties(structureType);
                
                // Create random dimensions based on the default properties
                const width = defaultProps.width ? defaultProps.width * (0.8 + Math.random() * 0.4) : 5;
                const depth = defaultProps.depth ? defaultProps.depth * (0.8 + Math.random() * 0.4) : 5;
                const height = defaultProps.height ? defaultProps.height * (0.8 + Math.random() * 0.4) : 3;
                
                // Create the structure using the factory
                structure = this.structureFactory.createStructure(structureType, {
                    x: x,
                    z: z,
                    width: width,
                    depth: depth,
                    height: height,
                    style: type
                });
            }
            
            if (structure) {
                // Add to structures array for tracking
                this.structures.push({
                    type: structureType,
                    object: structure,
                    position: new THREE.Vector3(x, this.worldManager.getTerrainHeight(x, z), z),
                    chunkKey: chunkKey
                });
                
                console.debug(`Created ${type} at (${x.toFixed(1)}, ${z.toFixed(1)}) in chunk ${chunkKey}`);
            }
        }
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
                // Only create important structures like dark_sanctum
                if (structure.type === STRUCTURE_OBJECTS.DARK_SANCTUM) {
                    this.structureFactory.createStructure(structure.type, { x: structure.x, z: structure.z });
                    this.specialStructures[`dark_sanctum_${chunkKey}_${structures.indexOf(structure)}`] = { 
                        x: structure.x, z: structure.z, type: structure.type 
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
    
    // Note: createBuilding method has been removed
    // Use structureFactory.createStructure() directly instead
    
    // Note: Specific structure creation methods have been removed
    // Use structureFactory.createStructure() directly instead
    
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