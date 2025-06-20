import * as THREE from 'three';

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
        
        // Save/load functionality has been removed
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
        
        // Add terrain to scene (unless rendering is disabled)
        if (!this.terrainConfig.debug.disableRendering) {
            this.scene.add(terrain);
        }
        
        return terrain;
    }

    /**
     * Create a terrain chunk at the specified coordinates
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunk(chunkX, chunkZ) {
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
        
        // Always create chunks since we don't use saved data anymore
        const shouldCreateChunk = true;
        
        console.debug(`Creating new terrain chunk ${chunkKey}`);
        // If not loaded from storage, create a new chunk
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
     * Create a terrain chunk for the buffer (not immediately visible)
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     */
    createBufferedTerrainChunk(chunkX, chunkZ) {
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
        
        // Always create chunks since we don't use saved data anymore
        const shouldCreateChunk = true;
        
        // Determine zone type for this terrain chunk
        let zoneType = 'Terrant'; // Default to Terrant for new terrain
        
        // If we have a world manager with zone information, use it
        if (this.worldManager && this.worldManager.getZoneAt) {
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
            zoneType: zoneType
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
        const { chunkX, chunkZ, zoneType } = placeholder;
        const zoneTypeName = zoneType || 'Terrant';
        
        // If no saved data, create a new chunk using the template system
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
                    if (!this.terrainChunks[chunkKey].parent && !this.terrainConfig.debug.disableRendering) {
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
                    if (!this.terrainChunks[chunkKey].parent && !this.terrainConfig.debug.disableRendering) {
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