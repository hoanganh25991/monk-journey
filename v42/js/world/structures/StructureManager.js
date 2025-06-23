import * as THREE from 'three';
import { Building } from './Building.js';
import { Tower } from './Tower.js';
import { Ruins } from './Ruins.js';
import { DarkSanctum } from './DarkSanctum.js';
import { Mountain } from './Mountain.js';
import { Bridge } from './Bridge.js';
import { Village } from './Village.js';
import { RandomGenerator } from '../utils/RandomGenerator.js';
import { STRUCTURE_CONFIG } from '../../config/structure.js';

/**
 * Manages structure generation and placement
 */
export class StructureManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Structure collections
        this.structures = [];
        this.structuresPlaced = {}; // Track placed structures by chunk key
        this.specialStructures = {}; // Track special structures like Dark Sanctum
        
        // Structure types and densities
        this.structureTypes = [
            'house', 'tower', 'ruins', 'darkSanctum', 
            'mountain', 'bridge', 'village'
        ]; // Types of structures
        
        // Use structure densities from config
        this.structureDensity = STRUCTURE_CONFIG.structureDensity;
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Initialize the structure system
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
     * Generate structures for a specific chunk
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {boolean} dataOnly - If true, only generate data without creating 3D objects
     */
    generateStructuresForChunk(chunkX, chunkZ, dataOnly = false) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if structures already generated for this chunk
        if (this.structuresPlaced[chunkKey]) {
            return;
        }
        
        // Mark this chunk as processed
        this.structuresPlaced[chunkKey] = [];
        
        // Calculate world coordinates for this chunk
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const worldX = chunkX * terrainChunkSize;
        const worldZ = chunkZ * terrainChunkSize;
        
        // Use seeded random for consistent generation
        // Use a more stable seed that combines chunk coordinates
        const seed = `${chunkX * 10000 + chunkZ}`;
        const random = RandomGenerator.seededRandom(seed);
        
        // Get the zone type for this chunk to determine structure types and density
        const chunkCenterX = worldX + terrainChunkSize / 2;
        const chunkCenterZ = worldZ + terrainChunkSize / 2;
        const zoneType = this.getZoneTypeAt(chunkCenterX, chunkCenterZ);
        
        // Adjust structure density based on zone type
        let densityMultiplier = 1.0;
        if (zoneType === 'Forest') densityMultiplier = 1.2;
        if (zoneType === 'Desert') densityMultiplier = 0.7;
        if (zoneType === 'Mountains') densityMultiplier = 0.5;
        if (zoneType === 'Ruins') densityMultiplier = 1.5;
        if (zoneType === 'Dark Sanctum') densityMultiplier = 0.8;
        if (zoneType === 'Terrant') densityMultiplier = 1.0;
        
        // IMPROVED: Better distribution of Dark Sanctums
        // Modified to make them more common and better distributed
        const shouldHaveDarkSanctum = 
            (Math.abs(chunkX) % 15 === 0 && Math.abs(chunkZ) % 15 === 0) && // Changed from 20 to 15
            (Math.abs(chunkX) > 3 || Math.abs(chunkZ) > 3); // Reduced from 5 to 3 to place them closer to center
        
        if (shouldHaveDarkSanctum) {
            // Place Dark Sanctum near the center of the chunk
            const x = worldX + terrainChunkSize / 2 + (random() * 20 - 10);
            const z = worldZ + terrainChunkSize / 2 + (random() * 20 - 10);
            
            // Check if we're too close to an existing Dark Sanctum
            let tooClose = false;
            for (const key in this.specialStructures) {
                if (this.specialStructures[key].type === 'darkSanctum') {
                    const dx = this.specialStructures[key].x - x;
                    const dz = this.specialStructures[key].z - z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance < 200) { // Minimum distance between Dark Sanctums
                        tooClose = true;
                        break;
                    }
                }
            }
            
            if (!tooClose) {
                // Store the structure data
                const structureData = { x, z, type: 'darkSanctum', chunkKey };
                this.structuresPlaced[chunkKey].push(structureData);
                
                // Only create the actual 3D object if not in data-only mode
                if (!dataOnly) {
                    const darkSanctum = this.createDarkSanctum(x, z);
                    // Store chunk key in the mesh userData for easier cleanup
                    if (darkSanctum) {
                        darkSanctum.userData.chunkKey = chunkKey;
                        darkSanctum.userData.structureType = 'darkSanctum';
                    }
                    
                    this.specialStructures[`darkSanctum_${chunkKey}`] = { 
                        x, z, type: 'darkSanctum', chunkKey 
                    };
                }
            }
        }
        
        // Generate mountains (if in Mountains zone)
        if (zoneType === 'Mountains') {
            const mountainCount = Math.floor(2 + random() * 3); // 2-4 mountains per chunk
            for (let i = 0; i < mountainCount; i++) {
                const x = worldX + random() * terrainChunkSize;
                const z = worldZ + random() * terrainChunkSize;
                
                // Store the structure data
                const structureData = { x, z, type: 'mountain', chunkKey };
                this.structuresPlaced[chunkKey].push(structureData);
                
                // Only create the actual 3D object if not in data-only mode
                if (!dataOnly) {
                    const mountain = this.createMountain(x, z);
                    if (mountain) {
                        mountain.userData.chunkKey = chunkKey;
                        mountain.userData.structureType = 'mountain';
                    }
                }
            }
        }
        
        // Generate villages (rare, but contain multiple buildings)
        if (random() < this.structureDensity.village * densityMultiplier) {
            const villageX = worldX + terrainChunkSize / 2 + (random() * 20 - 10);
            const villageZ = worldZ + terrainChunkSize / 2 + (random() * 20 - 10);
            
            // Store the structure data
            const structureData = { x: villageX, z: villageZ, type: 'village', chunkKey };
            this.structuresPlaced[chunkKey].push(structureData);
            
            // Only create the actual 3D object if not in data-only mode
            if (!dataOnly) {
                const village = this.createVillage(villageX, villageZ);
                if (village) {
                    village.userData.chunkKey = chunkKey;
                    village.userData.structureType = 'village';
                }
            }
        }
        
        // Generate houses
        const houseCount = Math.floor(terrainChunkSize * terrainChunkSize * this.structureDensity.house * densityMultiplier);
        for (let i = 0; i < houseCount; i++) {
            const x = worldX + random() * terrainChunkSize;
            const z = worldZ + random() * terrainChunkSize;
            
            // Randomize house dimensions
            const width = 3 + random() * 5;
            const depth = 3 + random() * 5;
            const height = 2 + random() * 5;
            
            // Store the structure data
            const structureData = { 
                x, z, type: 'house', 
                dimensions: { width, depth, height },
                chunkKey
            };
            this.structuresPlaced[chunkKey].push(structureData);
            
            // Only create the actual 3D object if not in data-only mode
            if (!dataOnly) {
                const building = this.createBuilding(x, z, width, depth, height);
                if (building) {
                    building.userData.chunkKey = chunkKey;
                    building.userData.structureType = 'house';
                }
            }
        }
        
        // Generate towers
        const towerCount = Math.floor(terrainChunkSize * terrainChunkSize * this.structureDensity.tower * densityMultiplier);
        for (let i = 0; i < towerCount; i++) {
            const x = worldX + random() * terrainChunkSize;
            const z = worldZ + random() * terrainChunkSize;
            
            // Store the structure data
            const structureData = { x, z, type: 'tower', chunkKey };
            this.structuresPlaced[chunkKey].push(structureData);
            
            // Only create the actual 3D object if not in data-only mode
            if (!dataOnly) {
                const tower = this.createTower(x, z);
                if (tower) {
                    tower.userData.chunkKey = chunkKey;
                    tower.userData.structureType = 'tower';
                }
            }
        }
        
        // Generate ruins
        const ruinsCount = Math.floor(terrainChunkSize * terrainChunkSize * this.structureDensity.ruins * densityMultiplier);
        for (let i = 0; i < ruinsCount; i++) {
            const x = worldX + random() * terrainChunkSize;
            const z = worldZ + random() * terrainChunkSize;
            
            // Store the structure data
            const structureData = { x, z, type: 'ruins', chunkKey };
            this.structuresPlaced[chunkKey].push(structureData);
            
            // Only create the actual 3D object if not in data-only mode
            if (!dataOnly) {
                const ruins = this.createRuins(x, z);
                if (ruins) {
                    ruins.userData.chunkKey = chunkKey;
                    ruins.userData.structureType = 'ruins';
                }
            }
        }
        
        // Generate bridges (if near water or valleys)
        if (random() < this.structureDensity.bridge * densityMultiplier) {
            const x = worldX + random() * terrainChunkSize;
            const z = worldZ + random() * terrainChunkSize;
            
            // Store the structure data
            const structureData = { x, z, type: 'bridge', chunkKey };
            this.structuresPlaced[chunkKey].push(structureData);
            
            // Only create the actual 3D object if not in data-only mode
            if (!dataOnly) {
                const bridge = this.createBridge(x, z);
                if (bridge) {
                    bridge.userData.chunkKey = chunkKey;
                    bridge.userData.structureType = 'bridge';
                }
            }
        }
    }
    
    /**
     * Load structures for a chunk from saved data
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
        
        // Store the structures data
        this.structuresPlaced[chunkKey] = structures;
        
        // Create the actual 3D objects
        structures.forEach(structure => {
            switch (structure.type) {
                case 'house':
                    this.createBuilding(
                        structure.x, 
                        structure.z, 
                        structure.dimensions.width, 
                        structure.dimensions.depth, 
                        structure.dimensions.height
                    );
                    break;
                case 'tower':
                    this.createTower(structure.x, structure.z);
                    break;
                case 'ruins':
                    this.createRuins(structure.x, structure.z);
                    break;
                case 'darkSanctum':
                    this.createDarkSanctum(structure.x, structure.z);
                    this.specialStructures[`darkSanctum_${chunkKey}_${this.structuresPlaced[chunkKey].indexOf(structure)}`] = { 
                        x: structure.x, z: structure.z, type: 'darkSanctum' 
                    };
                    break;
            }
        });
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
     * @returns {THREE.Group} - The mountain group
     */
    createMountain(x, z) {
        const zoneType = this.getZoneTypeAt(x, z);
        const mountain = new Mountain(zoneType);
        const mountainGroup = mountain.createMesh();
        
        // Position mountain on terrain
        mountainGroup.position.set(x, this.worldManager.getTerrainHeight(x, z), z);
        
        // Add to scene
        this.scene.add(mountainGroup);
        this.structures.push(mountainGroup);
        
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