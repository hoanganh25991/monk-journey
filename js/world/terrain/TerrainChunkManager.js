import * as THREE from 'three';
import chunkPersistenceManager from './ChunkPersistenceManager.js';

/**
 * Manages terrain chunk creation, buffering, and lifecycle
 */
export class TerrainChunkManager {
    constructor(scene, worldManager, terrainConfig, templateManager, coloringManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.terrainConfig = terrainConfig;
        this.templateManager = templateManager;
        this.coloringManager = coloringManager;
        
        this.terrainBuffer = {}; // Store pre-generated terrain chunks that aren't yet visible
        this.terrainChunks = {}; // Store terrain chunks by chunk key
        this.visibleTerrainChunks = {}; // Store currently visible terrain chunks
        
        // Enable chunk persistence
        this.persistenceEnabled = true;
        this.persistenceManager = chunkPersistenceManager;
    }

    /**
     * Check if a chunk exists in any collection
     * @param {string} chunkKey - The chunk key
     * @returns {boolean} - True if chunk exists
     */
    hasChunk(chunkKey) {
        return !!(this.terrainChunks[chunkKey] || this.terrainBuffer[chunkKey]);
    }

    /**
     * Create a unified terrain mesh for both base terrain and chunks
     * @param {number} x - X coordinate (chunk or world)
     * @param {number} z - Z coordinate (chunk or world)
     * @param {number} size - Size of the terrain mesh
     * @param {number} resolution - Resolution of the terrain mesh
     * @param {boolean} isBaseTerrain - Whether this is the base terrain or a chunk
     * @param {THREE.Vector3} position - Position to place the terrain
     * @returns {THREE.Mesh} - The created terrain mesh
     */
    createTerrainMesh(x, z, size, resolution, isBaseTerrain = false, position = null) {
        // Determine zone type for this terrain chunk
        let zoneType = 'Terrant'; // Default to Terrant for new terrain
        
        // If we have a world manager with zone information, use it
        if (this.worldManager && this.worldManager.getZoneAt) {
            // Calculate world coordinates for this chunk
            const worldX = x * this.terrainConfig.chunkSize + this.terrainConfig.chunkSize / 2;
            const worldZ = z * this.terrainConfig.chunkSize + this.terrainConfig.chunkSize / 2;
            
            // Get zone at this position
            const pos = new THREE.Vector3(worldX, 0, worldZ);
            const zone = this.worldManager.getZoneAt(pos);
            
            if (zone) {
                zoneType = zone.name;
            }
        }
        
        // Get or create terrain template for this zone type
        const template = this.templateManager.getOrCreateTerrainTemplate(zoneType, size, resolution);
        
        // Create terrain mesh using the template
        const terrain = new THREE.Mesh(template.geometry.clone(), template.material.clone());
        terrain.rotation.x = -Math.PI / 2;
        
        // CRITICAL FIX: Ensure both receiveShadow and castShadow are set to true
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        
        // Apply terrain coloring with variations based on zone type
        const themeColors = this.worldManager.zoneManager ? this.worldManager.zoneManager.currentThemeColors : null;
        this.coloringManager.colorTerrainUniform(terrain, zoneType, themeColors);
        
        // Store zone type on the terrain for later reference
        terrain.userData.zoneType = zoneType;
        
        // Position the terrain - ensure y=0 exactly to prevent vibration
        if (position) {
            terrain.position.copy(position);
        } else {
            // Calculate world coordinates for this chunk
            const worldX = x * this.terrainConfig.chunkSize;
            const worldZ = z * this.terrainConfig.chunkSize;
            
            terrain.position.set(
                worldX + this.terrainConfig.chunkSize / 2,
                0,
                worldZ + this.terrainConfig.chunkSize / 2
            );
        }
        
        this.scene.add(terrain);
        
        return terrain;
    }

    /**
     * Create a terrain chunk at the specified coordinates
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {Promise<THREE.Mesh>} - The created terrain chunk
     */
    async createTerrainChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if this chunk already exists in active chunks
        if (this.terrainChunks[chunkKey]) {
            console.debug(`Using existing terrain chunk ${chunkKey}`);
            return this.terrainChunks[chunkKey];
        }
        
        // Skip if this chunk already exists in buffer
        if (this.terrainBuffer[chunkKey]) {
            console.debug(`Moving terrain chunk ${chunkKey} from buffer to active`);
            // Move from buffer to active chunks
            this.terrainChunks[chunkKey] = this.terrainBuffer[chunkKey];
            
            // Add to scene if not already added
            if (!this.terrainChunks[chunkKey].parent) {
                this.scene.add(this.terrainChunks[chunkKey]);
            }
            
            // Remove from buffer
            delete this.terrainBuffer[chunkKey];
            
            return this.terrainChunks[chunkKey];
        }
        
        // Check if this chunk exists in persistence storage
        if (this.persistenceEnabled) {
            try {
                const hasPersistedChunk = await this.persistenceManager.hasChunk(chunkKey);
                
                if (hasPersistedChunk) {
                    console.debug(`Loading persisted terrain chunk ${chunkKey}`);
                    const chunkData = await this.persistenceManager.loadChunk(chunkKey);
                    
                    if (chunkData) {
                        return this.createTerrainChunkFromPersistedData(chunkX, chunkZ, chunkData);
                    }
                }
            } catch (error) {
                console.error(`Error checking for persisted chunk ${chunkKey}:`, error);
                // Continue with creating a new chunk
            }
        }
        
        console.debug(`Creating new terrain chunk ${chunkKey}`);
        // Create a new chunk
        return this.createNewTerrainChunk(chunkX, chunkZ);
    }

    /**
     * Create a new terrain chunk from scratch
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createNewTerrainChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Create the terrain mesh using the unified method
        const terrain = this.createTerrainMesh(
            chunkX,
            chunkZ,
            this.terrainConfig.chunkSize,
            16 // Lower resolution for better performance
        );
        
        // Store the terrain chunk
        this.terrainChunks[chunkKey] = terrain;
        
        // Notify structure manager to generate structures for this chunk
        if (this.worldManager && this.worldManager.structureManager) {
            this.worldManager.structureManager.generateStructuresForChunk(chunkX, chunkZ);
        }
        
        // Persist the chunk data for future use
        if (this.persistenceEnabled) {
            // Extract essential data for persistence
            const chunkData = this.serializeChunkData(terrain, chunkX, chunkZ);
            
            // Queue the chunk for persistence (non-blocking)
            this.persistenceManager.queueChunkForSave(chunkKey, chunkData);
        }
        
        return terrain;
    }

    /**
     * Create a terrain chunk from saved data
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {object} chunkData - Saved chunk data
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunkFromSavedData(chunkX, chunkZ, chunkData) {
        // Create the basic terrain chunk
        const terrain = this.createNewTerrainChunk(chunkX, chunkZ);
        
        // Notify structure manager about saved structures
        if (chunkData.structures && chunkData.structures.length > 0 && 
            this.worldManager && this.worldManager.structureManager) {
            this.worldManager.structureManager.loadStructuresForChunk(chunkX, chunkZ, chunkData.structures);
        }
        
        // Notify environment manager about saved environment objects
        if (chunkData.environmentObjects && Array.isArray(chunkData.environmentObjects) && chunkData.environmentObjects.length > 0 && 
            this.worldManager && this.worldManager.environmentManager) {
            this.worldManager.environmentManager.loadEnvironmentObjectsForChunk(chunkX, chunkZ, chunkData.environmentObjects);
        }
        
        console.debug(`Terrain chunk ${chunkX},${chunkZ} created from saved data`);
        return terrain;
    }
    
    /**
     * Create a terrain chunk from persisted data
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @param {object} chunkData - Persisted chunk data
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunkFromPersistedData(chunkX, chunkZ, chunkData) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Create terrain mesh using the template system
        const zoneType = chunkData.zoneType || 'Terrant';
        
        // Get the terrain template for this zone type
        const template = this.templateManager.getOrCreateTerrainTemplate(
            zoneType, 
            this.terrainConfig.chunkSize, 
            16
        );
        
        // Create terrain mesh using the template
        const terrain = new THREE.Mesh(template.geometry.clone(), template.material.clone());
        terrain.rotation.x = -Math.PI / 2;
        
        // Set shadows
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        
        // Apply terrain coloring with variations based on zone type
        const themeColors = this.worldManager.zoneManager ? this.worldManager.zoneManager.currentThemeColors : null;
        this.coloringManager.colorTerrainUniform(terrain, zoneType, themeColors);
        
        // Store zone type on the terrain for later reference
        terrain.userData.zoneType = zoneType;
        
        // Position the terrain
        const worldX = chunkX * this.terrainConfig.chunkSize;
        const worldZ = chunkZ * this.terrainConfig.chunkSize;
        
        terrain.position.set(
            worldX + this.terrainConfig.chunkSize / 2,
            0,
            worldZ + this.terrainConfig.chunkSize / 2
        );
        
        // Add to scene
        this.scene.add(terrain);
        
        // Store the terrain chunk
        this.terrainChunks[chunkKey] = terrain;
        
        // Load structures if available
        if (chunkData.structures && Array.isArray(chunkData.structures) && 
            this.worldManager && this.worldManager.structureManager) {
            this.worldManager.structureManager.loadStructuresForChunk(chunkX, chunkZ, chunkData.structures);
        }
        
        // Load environment objects if available
        if (chunkData.environmentObjects && Array.isArray(chunkData.environmentObjects) && 
            this.worldManager && this.worldManager.environmentManager) {
            this.worldManager.environmentManager.loadEnvironmentObjectsForChunk(chunkX, chunkZ, chunkData.environmentObjects);
        }
        
        console.debug(`Terrain chunk ${chunkKey} created from persisted data`);
        return terrain;
    }
    
    /**
     * Serialize chunk data for persistence
     * @param {THREE.Mesh} terrain - The terrain mesh
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {Object} - Serialized chunk data
     */
    serializeChunkData(terrain, chunkX, chunkZ) {
        const chunkData = {
            zoneType: terrain.userData.zoneType || 'Terrant',
            structures: [],
            environmentObjects: []
        };
        
        // Get structures in this chunk if available
        // Note: We don't directly serialize structures as they're managed separately
        // The structure manager will handle loading structures for this chunk when needed
        if (this.worldManager && this.worldManager.structureManager) {
            try {
                // Check if the method exists before calling it
                if (typeof this.worldManager.structureManager.getStructuresInChunk === 'function') {
                    const structures = this.worldManager.structureManager.getStructuresInChunk(chunkX, chunkZ);
                    if (structures && structures.length > 0) {
                        chunkData.structures = structures.map(structure => ({
                            type: structure.type,
                            position: {
                                x: structure.position.x,
                                y: structure.position.y,
                                z: structure.position.z
                            },
                            rotation: structure.rotation ? {
                                x: structure.rotation.x,
                                y: structure.rotation.y,
                                z: structure.rotation.z
                            } : undefined,
                            scale: structure.scale ? {
                                x: structure.scale.x,
                                y: structure.scale.y,
                                z: structure.scale.z
                            } : undefined
                        }));
                    }
                } else {
                    // Alternative approach if getStructuresInChunk doesn't exist
                    // Just store the chunk coordinates for later structure generation
                    chunkData.structureChunkCoords = { x: chunkX, z: chunkZ };
                }
            } catch (error) {
                console.debug(`Error getting structures for chunk ${chunkX},${chunkZ}:`, error);
                // Continue without structures
            }
        }
        
        // Get environment objects in this chunk if available
        if (this.worldManager && this.worldManager.environmentManager) {
            try {
                // Check if the method exists before calling it
                if (typeof this.worldManager.environmentManager.getEnvironmentObjectsInChunk === 'function') {
                    const environmentObjects = this.worldManager.environmentManager.getEnvironmentObjectsInChunk(chunkX, chunkZ);
                    if (environmentObjects && environmentObjects.length > 0) {
                        chunkData.environmentObjects = environmentObjects.map(obj => ({
                            type: obj.type,
                            position: {
                                x: obj.position.x,
                                y: obj.position.y,
                                z: obj.position.z
                            },
                            rotation: obj.rotation ? {
                                x: obj.rotation.x,
                                y: obj.rotation.y,
                                z: obj.rotation.z
                            } : undefined,
                            scale: obj.scale ? {
                                x: obj.scale.x,
                                y: obj.scale.y,
                                z: obj.scale.z
                            } : undefined
                        }));
                    }
                } else {
                    // Alternative approach if getEnvironmentObjectsInChunk doesn't exist
                    // Just store the chunk coordinates for later environment object generation
                    chunkData.environmentChunkCoords = { x: chunkX, z: chunkZ };
                }
            } catch (error) {
                console.debug(`Error getting environment objects for chunk ${chunkX},${chunkZ}:`, error);
                // Continue without environment objects
            }
        }
        
        return chunkData;
    }

    /**
     * Create a terrain chunk for the buffer (not immediately visible)
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {Promise<void>}
     */
    async createBufferedTerrainChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if this chunk already exists in any collection
        if (this.terrainChunks[chunkKey]) {
            console.debug(`Chunk ${chunkKey} already exists in active chunks, skipping buffer creation`);
            return;
        }
        
        if (this.terrainBuffer[chunkKey]) {
            console.debug(`Chunk ${chunkKey} already exists in buffer, skipping buffer creation`);
            return;
        }
        
        // Check if this chunk exists in persistence storage
        // Use a non-blocking approach to avoid performance impact
        let usePersistedData = false;
        let persistedChunkData = null;
        
        if (this.persistenceEnabled) {
            try {
                // Use a timeout to prevent blocking for too long
                const hasPersistedChunkPromise = Promise.race([
                    this.persistenceManager.hasChunk(chunkKey),
                    new Promise(resolve => setTimeout(() => resolve(false), 50)) // 50ms timeout
                ]);
                
                const hasPersistedChunk = await hasPersistedChunkPromise;
                
                if (hasPersistedChunk) {
                    // Try to load the persisted chunk data with a timeout
                    const loadChunkPromise = Promise.race([
                        this.persistenceManager.loadChunk(chunkKey),
                        new Promise(resolve => setTimeout(() => resolve(null), 100)) // 100ms timeout
                    ]);
                    
                    persistedChunkData = await loadChunkPromise;
                    usePersistedData = persistedChunkData !== null;
                }
            } catch (error) {
                console.debug(`Error checking for persisted chunk ${chunkKey}, will create new:`, error);
                // Continue with creating a new chunk
            }
        }
        
        // If we have persisted data, use the zone type from it
        let zoneType = usePersistedData && persistedChunkData.zoneType ? 
            persistedChunkData.zoneType : 'Terrant';
        
        // If we don't have persisted data and have a world manager with zone information, use it
        if (!usePersistedData && this.worldManager && this.worldManager.getZoneAt) {
            // Calculate world coordinates for this chunk
            const worldX = chunkX * this.terrainConfig.chunkSize + this.terrainConfig.chunkSize / 2;
            const worldZ = chunkZ * this.terrainConfig.chunkSize + this.terrainConfig.chunkSize / 2;
            
            // Get zone at this position
            const position = new THREE.Vector3(worldX, 0, worldZ);
            const zone = this.worldManager.getZoneAt(position);
            
            if (zone) {
                zoneType = zone.name;
            }
        }
        
        // For buffered chunks, create a lightweight placeholder with zone info
        // This significantly reduces memory usage and improves performance
        const placeholder = {
            isPlaceholder: true,
            chunkX: chunkX,
            chunkZ: chunkZ,
            zoneType: zoneType,
            // Store persisted data reference if available
            persistedData: usePersistedData ? persistedChunkData : null
        };
        
        // Store in buffer but don't create actual geometry yet
        this.terrainBuffer[chunkKey] = placeholder;
        
        // Pre-fetch the terrain template for this zone type to ensure it's cached
        // This helps reduce stuttering when the chunk becomes visible
        this.templateManager.getOrCreateTerrainTemplate(zoneType, this.terrainConfig.chunkSize, 16);
        
        // Notify structure manager to pre-generate structures for this chunk
        if (this.worldManager && this.worldManager.structureManager) {
            this.worldManager.structureManager.generateStructuresForChunk(chunkX, chunkZ, true); // true = data only
        }
        
        console.debug(`Buffered terrain chunk placeholder created: ${chunkKey}`);
    }

    /**
     * Convert a buffered placeholder to a real chunk when needed
     * @param {string} chunkKey - The chunk key
     */
    convertPlaceholderToRealChunk(chunkKey) {
        const placeholder = this.terrainBuffer[chunkKey];
        
        // Skip if not a placeholder
        if (!placeholder || !placeholder.isPlaceholder) {
            return;
        }
        
        // Extract coordinates and zone type
        const { chunkX, chunkZ, zoneType, persistedData } = placeholder;
        const zoneTypeName = zoneType || 'Terrant';
        
        // If we have persisted data, use it to create the chunk
        if (persistedData) {
            console.debug(`Converting placeholder to real chunk using persisted data: ${chunkKey}`);
            
            // Create terrain from persisted data
            const terrain = this.createTerrainChunkFromPersistedData(chunkX, chunkZ, persistedData);
            
            // Replace placeholder with real chunk
            this.terrainBuffer[chunkKey] = terrain;
            return;
        }
        
        // If no persisted data, create a new chunk using the template system
        console.debug(`Converting placeholder to real chunk (no persisted data): ${chunkKey}`);
        
        // Get the terrain template for this zone type
        const template = this.templateManager.getOrCreateTerrainTemplate(
            zoneTypeName, 
            this.terrainConfig.chunkSize, 
            16
        );
        
        // Create terrain mesh using the template
        const terrain = new THREE.Mesh(template.geometry.clone(), template.material.clone());
        terrain.rotation.x = -Math.PI / 2;
        
        // Set shadows
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        
        // Apply terrain coloring with variations based on zone type
        this.coloringManager.colorTerrainUniform(terrain, zoneTypeName);
        
        // Store zone type on the terrain for later reference
        terrain.userData.zoneType = zoneTypeName;
        
        // Position the terrain
        const worldX = chunkX * this.terrainConfig.chunkSize;
        const worldZ = chunkZ * this.terrainConfig.chunkSize;
        
        terrain.position.set(
            worldX + this.terrainConfig.chunkSize / 2,
            0,
            worldZ + this.terrainConfig.chunkSize / 2
        );
        
        // Replace placeholder with real terrain
        this.terrainBuffer[chunkKey] = terrain;
        
        console.debug(`Placeholder converted to new buffered chunk: ${chunkKey}`);
    }

    /**
     * Update visible terrain chunks based on player position
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     * @returns {Object} - New visible terrain chunks
     */
    updateTerrainChunks(centerX, centerZ, drawDistanceMultiplier = 1.0) {
        // Track which terrain chunks should be visible
        const newVisibleTerrainChunks = {};
        
        // Adjust view distance based on performance
        const viewDistance = Math.max(1, Math.floor(this.terrainConfig.chunkViewDistance * drawDistanceMultiplier));
        
        // Generate terrain chunks in view distance (these need to be immediately visible)
        for (let x = centerX - viewDistance; x <= centerX + viewDistance; x++) {
            for (let z = centerZ - viewDistance; z <= centerZ + viewDistance; z++) {
                const chunkKey = `${x},${z}`;
                newVisibleTerrainChunks[chunkKey] = true;
                
                // Skip if this chunk is already active
                if (this.terrainChunks[chunkKey]) {
                    // Make sure it's in the scene (unless rendering is disabled)
                    if (!this.terrainChunks[chunkKey].parent) {
                        this.scene.add(this.terrainChunks[chunkKey]);
                    }
                    continue;
                }
                
                // If this terrain chunk doesn't exist yet, check if it's in the buffer
                if (this.terrainBuffer[chunkKey]) {
                    // Check if it's a placeholder and convert if needed
                    if (this.terrainBuffer[chunkKey].isPlaceholder) {
                        this.convertPlaceholderToRealChunk(chunkKey);
                    }
                    
                    // Move from buffer to active chunks
                    this.terrainChunks[chunkKey] = this.terrainBuffer[chunkKey];
                    
                    // Add to scene if not already added (unless rendering is disabled)
                    if (!this.terrainChunks[chunkKey].parent) {
                        this.scene.add(this.terrainChunks[chunkKey]);
                    }
                    
                    // Remove from buffer
                    delete this.terrainBuffer[chunkKey];
                    console.debug(`Chunk ${chunkKey} moved from buffer to active`);
                } 
                // If not in buffer or active chunks, create it
                else {
                    this.createTerrainChunk(x, z);
                }
            }
        }
        
        return { newVisibleTerrainChunks, viewDistance };
    }

    /**
     * Handle chunk visibility changes
     * @param {Object} newVisibleTerrainChunks - New visible chunks
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} viewDistance - Current view distance
     */
    handleChunkVisibilityChanges(newVisibleTerrainChunks, centerX, centerZ, viewDistance) {
        // Remove terrain chunks that are no longer visible
        for (const chunkKey in this.visibleTerrainChunks) {
            if (!newVisibleTerrainChunks[chunkKey]) {
                // Instead of removing, move to buffer if within buffer distance
                const [x, z] = chunkKey.split(',').map(Number);
                const distX = Math.abs(x - centerX);
                const distZ = Math.abs(z - centerZ);
                
                // Use a more aggressive buffer distance calculation
                // Only keep chunks in buffer that are just outside view distance
                const bufferDistance = Math.min(this.terrainConfig.bufferDistance, viewDistance + 2);
                
                if (distX <= bufferDistance && distZ <= bufferDistance) {
                    // Move to buffer instead of removing
                    this.terrainBuffer[chunkKey] = this.terrainChunks[chunkKey];
                    delete this.terrainChunks[chunkKey];
                    
                    // Hide the chunk but don't destroy it
                    const chunk = this.terrainBuffer[chunkKey];
                    if (chunk && chunk.parent) {
                        this.scene.remove(chunk);
                    }
                } else {
                    // If outside buffer distance, remove completely
                    // This will be handled by the cleanup manager
                    delete this.terrainChunks[chunkKey];
                }
            }
        }
        
        // Update the visible terrain chunks
        this.visibleTerrainChunks = newVisibleTerrainChunks;
    }

    // Save and load methods have been removed as they are no longer needed
    // World is generated in-memory and not saved/loaded

    /**
     * Clear all terrain chunks
     */
    clear() {
        this.terrainChunks = {};
        this.visibleTerrainChunks = {};
        this.terrainBuffer = {};
        
        // Flush any pending persistence operations
        if (this.persistenceEnabled && this.persistenceManager) {
            this.persistenceManager.flushWriteQueue().catch(error => {
                console.error('Error flushing persistence queue during clear:', error);
            });
        }
    }
    
    /**
     * Cleanup resources when the manager is no longer needed
     * This should be called when the game is unloaded
     */
    dispose() {
        // Clear all chunks
        this.clear();
        
        // Dispose the persistence manager
        if (this.persistenceEnabled && this.persistenceManager) {
            this.persistenceManager.dispose();
        }
    }

    /**
     * Get terrain height at a specific world position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - The height of the terrain at the specified position
     */
    getTerrainHeight(x, z) {
        // Always return exactly 0 for completely flat terrain
        // This is critical to prevent vibration
        return 0;
    }
}