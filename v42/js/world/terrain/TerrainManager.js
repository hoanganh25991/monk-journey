import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';
import { ZONE_COLORS } from '../../config/colors.js';
import { TERRAIN_CONFIG } from '../../config/terrain.js';

/**
 * Manages terrain generation and rendering
 */
export class TerrainManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Terrain properties from config
        this.terrainSize = TERRAIN_CONFIG.size;
        this.terrainResolution = TERRAIN_CONFIG.resolution;
        this.terrainHeight = TERRAIN_CONFIG.height;
        
        // For terrain chunks from config
        this.terrainChunkSize = TERRAIN_CONFIG.chunkSize;
        this.terrainChunkViewDistance = TERRAIN_CONFIG.chunkViewDistance;
        
        // For terrain buffering (pre-rendering) from config
        this.terrainBufferDistance = TERRAIN_CONFIG.bufferDistance;

        this.terrainBuffer = {}; // Store pre-generated terrain chunks that aren't yet visible
        this.terrainGenerationQueue = []; // Queue for prioritized terrain generation
        this.terrainChunks = {}; // Store terrain chunks by chunk key
        this.visibleTerrainChunks = {}; // Store currently visible terrain chunks
        this.lastQueueProcessTime = 0; // Timestamp of last queue processing to prevent constant processing
        this.isProcessingTerrainQueue = false; // Flag to prevent multiple queue processing
        this.lastPlayerChunk = { x: 0, z: 0 }; // Last player chunk for movement prediction
        this.playerMovementDirection = new THREE.Vector3(0, 0, 0); // Track player movement direction for prediction
        
        // Base terrain
        this.terrain = null;
        
        // Flag to prevent terrain vibration on first load
        this.initialTerrainCreated = false;
        
        // For save/load functionality
        this.savedTerrainChunks = null;
        
        // Cache for terrain templates by zone type
        this.terrainTemplates = {};
        
        // Cache for generated textures by color
        this.textureCache = {};
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Initialize the terrain system
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async init() {
        // Create base terrain
        await this.createBaseTerrain();
        
        // Set flag to indicate initial terrain is created
        this.initialTerrainCreated = true;
        
        // Initialize the first chunks around the player
        this.updateForPlayer(new THREE.Vector3(0, 0, 0));
        
        // Wait for initial terrain chunks to be fully generated
        await this.waitForInitialTerrainGeneration();
        
        return true;
    }
    
    /**
     * Wait for initial terrain generation to complete
     * @returns {Promise<void>} - Promise that resolves when initial terrain is generated
     */
    waitForInitialTerrainGeneration() {
        return new Promise((resolve) => {
            const checkQueue = () => {
                // If queue is empty and we're not processing anything, terrain generation is complete
                if (this.terrainGenerationQueue.length === 0 && !this.isProcessingTerrainQueue) {
                    console.debug("Initial terrain generation complete");
                    resolve();
                } else {
                    // Check again after a short delay
                    console.debug(`Waiting for terrain generation to complete. Queue length: ${this.terrainGenerationQueue.length}`);
                    setTimeout(checkQueue, 100);
                }
            };
            
            // Start checking
            checkQueue();
        });
    }
    
    /**
     * Create the base flat terrain
     * @returns {Promise<void>}
     */
    async createBaseTerrain() {
        // Create the base terrain at the center (0,0) using the unified terrain creation method
        const terrain = this.createTerrainMesh(
            0, // Center X
            0, // Center Z
            this.terrainSize, // Use terrainSize for the base terrain
            this.terrainResolution - 1, // Use slightly lower resolution for base terrain
            true, // Is base terrain
            new THREE.Vector3(0, 0, 0) // Position at center
        );
        
        // Store reference to the base terrain
        this.terrain = terrain;
        
        console.debug("Flat terrain created and added to scene");
    }
    
    /**
     * Apply terrain coloring based on zone type with natural variations
     * @param {THREE.Mesh} terrain - The terrain mesh to color
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    colorTerrainUniform(terrain, zoneType = 'Terrant') {
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        
        // Get colors from the config based on zone type
        // Default to Terrant colors if specified or fall back to Forest
        const zoneColors = ZONE_COLORS[zoneType] || ZONE_COLORS['Terrant'] || ZONE_COLORS['Forest'];
        
        // For Terrant, use soil as the primary color, no green mixing
        let baseColorHex = zoneType === 'Terrant' ? zoneColors.soil : 0x4a9e4a;
        
        // Create deterministic noise patterns for natural variation
        // Use a fixed seed based on chunk position to prevent flickering
        const noiseScale = 0.05;
        const noiseOffset = terrain.position.x * 0.01 + terrain.position.z * 0.01;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Get vertex position for noise calculation
            const x = positions[i];
            const z = positions[i + 2];
            
            // Base color from zone type
            let baseColor = new THREE.Color(baseColorHex);
            
            // For Terrant, add more variety with multiple soil tones, but NO vegetation
            if (zoneType === 'Terrant') {
                // Use deterministic noise pattern for natural variation
                const noiseValue = Math.sin(x * noiseScale + noiseOffset) * Math.cos(z * noiseScale + noiseOffset);
                
                // Only use soil and rock colors for Terrant - NO vegetation mixing
                if (noiseValue > 0.6) {
                    // Rocky areas
                    baseColor = new THREE.Color(zoneColors.rock);
                } else if (Math.random() > 0.95) {
                    // Rare crystal-influenced areas
                    baseColor = new THREE.Color(zoneColors.soil);
                    baseColor.lerp(new THREE.Color(zoneColors.crystal), 0.2);
                }
                
                // Add subtle micro-variation to make terrain look more natural
                // Use deterministic variation to prevent flickering
                const microVariation = (Math.sin(x * 0.1 + z * 0.1) * 0.05);
                
                // Apply variation to each color channel
                const color = new THREE.Color(
                    Math.max(0, Math.min(1, baseColor.r + microVariation)),
                    Math.max(0, Math.min(1, baseColor.g + microVariation)),
                    Math.max(0, Math.min(1, baseColor.b + microVariation))
                );
                
                colors.push(color.r, color.g, color.b);
            } else {
                // Standard variation for other zone types
                const variation = (Math.sin(x * 0.1 + z * 0.1) * 0.05);
                const color = new THREE.Color(
                    Math.max(0, Math.min(1, baseColor.r + variation)),
                    Math.max(0, Math.min(1, baseColor.g + variation)),
                    Math.max(0, Math.min(1, baseColor.b + variation))
                );
                
                colors.push(color.r, color.g, color.b);
            }
        }
        
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    /**
     * Update terrain based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Get the terrain chunk coordinates for the player's position
        const terrainChunkX = Math.floor(playerPosition.x / this.terrainChunkSize);
        const terrainChunkZ = Math.floor(playerPosition.z / this.terrainChunkSize);
        
        // Calculate player movement direction for predictive loading
        if (this.lastPlayerChunk.x !== terrainChunkX || this.lastPlayerChunk.z !== terrainChunkZ) {
            // Calculate movement direction vector
            this.playerMovementDirection.x = terrainChunkX - this.lastPlayerChunk.x;
            this.playerMovementDirection.z = terrainChunkZ - this.lastPlayerChunk.z;
            
            // Normalize the direction vector if it's not zero
            if (this.playerMovementDirection.x !== 0 || this.playerMovementDirection.z !== 0) {
                const length = Math.sqrt(
                    this.playerMovementDirection.x * this.playerMovementDirection.x + 
                    this.playerMovementDirection.z * this.playerMovementDirection.z
                );
                if (length > 0) {
                    this.playerMovementDirection.x /= length;
                    this.playerMovementDirection.z /= length;
                }
            }
            
            // Update last player chunk
            this.lastPlayerChunk = { x: terrainChunkX, z: terrainChunkZ };
        }
        
        // Update terrain chunks
        this.updateTerrainChunks(terrainChunkX, terrainChunkZ, drawDistanceMultiplier);
    }
    
    /**
     * Update visible terrain chunks based on player position
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateTerrainChunks(centerX, centerZ, drawDistanceMultiplier = 1.0) {
        // Track which terrain chunks should be visible
        const newVisibleTerrainChunks = {};
        
        // Adjust view distance based on performance
        const viewDistance = Math.max(1, Math.floor(this.terrainChunkViewDistance * drawDistanceMultiplier));
        
        // Generate terrain chunks in view distance (these need to be immediately visible)
        for (let x = centerX - viewDistance; x <= centerX + viewDistance; x++) {
            for (let z = centerZ - viewDistance; z <= centerZ + viewDistance; z++) {
                const chunkKey = `${x},${z}`;
                newVisibleTerrainChunks[chunkKey] = true;
                
                // If this terrain chunk doesn't exist yet, create it immediately
                // First check if it's in the buffer
                if (this.terrainBuffer[chunkKey]) {
                    // Check if it's a placeholder and convert if needed
                    if (this.terrainBuffer[chunkKey].isPlaceholder) {
                        this.convertPlaceholderToRealChunk(chunkKey);
                    }
                    
                    // Move from buffer to active chunks
                    this.terrainChunks[chunkKey] = this.terrainBuffer[chunkKey];
                    
                    // Add to scene
                    this.scene.add(this.terrainChunks[chunkKey]);
                    
                    // Remove from buffer
                    delete this.terrainBuffer[chunkKey];
                    console.debug(`Chunk ${chunkKey} moved from buffer to active`);
                } 
                // If not in buffer, create it immediately
                else if (!this.terrainChunks[chunkKey]) {
                    this.createTerrainChunk(x, z);
                }
            }
        }
        
        // Queue terrain chunks for buffering (prioritize in the direction of movement)
        this.queueTerrainChunksForBuffering(centerX, centerZ);
        
        // Add a cooldown to prevent constant queue processing
        const currentTime = Date.now();
        if (!this.lastQueueProcessTime) {
            this.lastQueueProcessTime = 0;
        }
        
        // Only process the queue if we're not already processing and enough time has passed
        const QUEUE_PROCESS_COOLDOWN = 1000; // 1000ms (1 second) cooldown between queue processing
        if (!this.isProcessingTerrainQueue && 
            currentTime - this.lastQueueProcessTime > QUEUE_PROCESS_COOLDOWN) {
            this.lastQueueProcessTime = currentTime;
            this.processTerrainGenerationQueue();
        }
        
        // Remove terrain chunks that are no longer visible
        for (const chunkKey in this.visibleTerrainChunks) {
            if (!newVisibleTerrainChunks[chunkKey]) {
                // Instead of removing, move to buffer if within buffer distance
                const [x, z] = chunkKey.split(',').map(Number);
                const distX = Math.abs(x - centerX);
                const distZ = Math.abs(z - centerZ);
                
                // Use a more aggressive buffer distance calculation
                // Only keep chunks in buffer that are just outside view distance
                const bufferDistance = Math.min(this.terrainBufferDistance, viewDistance + 2);
                
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
                    this.removeTerrainChunk(chunkKey, true); // Force cleanup of associated objects
                }
            }
        }
        
        // Periodically check buffer for chunks that are too far away
        // This helps prevent buffer from growing too large during long-distance travel
        if (Math.random() < 0.1) { // 10% chance each update to check buffer
            this.cleanupBufferChunks(centerX, centerZ, viewDistance);
        }
        
        // Update the visible terrain chunks
        this.visibleTerrainChunks = newVisibleTerrainChunks;
    }
    
    /**
     * Clean up buffer chunks that are too far from player
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} viewDistance - Current view distance
     */
    cleanupBufferChunks(centerX, centerZ, viewDistance) {
        // Use a more aggressive buffer distance calculation
        const bufferDistance = Math.min(this.terrainBufferDistance, viewDistance + 2);
        const chunksToRemove = [];
        
        for (const chunkKey in this.terrainBuffer) {
            const [x, z] = chunkKey.split(',').map(Number);
            const distX = Math.abs(x - centerX);
            const distZ = Math.abs(z - centerZ);
            
            // If chunk is too far away, mark for removal
            if (distX > bufferDistance || distZ > bufferDistance) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Remove marked chunks
        if (chunksToRemove.length > 0) {
            console.debug(`Cleaning up ${chunksToRemove.length} distant buffer chunks`);
            
            chunksToRemove.forEach(chunkKey => {
                const chunk = this.terrainBuffer[chunkKey];
                
                // Remove from scene if needed
                if (chunk && chunk.parent) {
                    this.scene.remove(chunk);
                }
                
                // Dispose of geometry and materials
                if (chunk && chunk.geometry) {
                    chunk.geometry.dispose();
                }
                
                if (chunk && chunk.material) {
                    const materials = Array.isArray(chunk.material) ? chunk.material : [chunk.material];
                    materials.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                }
                
                // Remove from buffer
                delete this.terrainBuffer[chunkKey];
            });
            
            // Hint for garbage collection after significant cleanup
            if (chunksToRemove.length > 3 && this.worldManager) {
                this.worldManager.hintGarbageCollection();
            }
        }
    }
    
    /**
     * Create a terrain chunk at the specified coordinates
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {THREE.Mesh} - The created terrain chunk
     */
    createTerrainChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if this chunk already exists
        if (this.terrainChunks[chunkKey]) {
            return this.terrainChunks[chunkKey];
        }
        
        // Check if this chunk was saved previously
        const shouldCreateChunk = !this.savedTerrainChunks || 
                                 this.savedTerrainChunks[chunkKey] || 
                                 Object.keys(this.savedTerrainChunks).length === 0;
        
        if (!shouldCreateChunk) {
            return null; // Skip creating this chunk as it wasn't in the saved state
        }
        
        // If not loaded from storage, create a new chunk
        return this.createNewTerrainChunk(chunkX, chunkZ);
    }
    
    /**
     * Create or get a cached texture for terrain
     * @param {number} baseColorHex - Base color for the texture
     * @param {number} secondaryColorHex - Secondary color for the texture
     * @returns {THREE.Texture} - The texture
     */
    getOrCreateTexture(baseColorHex, secondaryColorHex) {
        // Create a unique key for this texture combination
        const textureKey = `${baseColorHex.toString(16)}_${secondaryColorHex.toString(16)}`;
        
        // Return cached texture if it exists
        if (this.textureCache[textureKey]) {
            return this.textureCache[textureKey];
        }
        
        // Create new texture and cache it
        const texture = TextureGenerator.createProceduralTexture(baseColorHex, secondaryColorHex, 512);
        this.textureCache[textureKey] = texture;
        
        return texture;
    }
    
    /**
     * Create or get a cached terrain template for a zone type
     * @param {string} zoneType - The zone type
     * @param {number} size - Size of the terrain
     * @param {number} resolution - Resolution of the terrain
     * @returns {Object} - Template with geometry and material
     */
    getOrCreateTerrainTemplate(zoneType, size, resolution) {
        // Create a unique key for this template
        const templateKey = `${zoneType}_${size}_${resolution}`;
        
        // Return cached template if it exists
        if (this.terrainTemplates[templateKey]) {
            return this.terrainTemplates[templateKey];
        }
        
        // Create new template
        // Create terrain geometry
        const geometry = new THREE.PlaneGeometry(
            size,
            size,
            resolution,
            resolution
        );
        
        // Compute vertex normals for proper lighting
        geometry.computeVertexNormals();
        
        // Get colors from the config based on zone type
        const zoneColors = ZONE_COLORS[zoneType] || ZONE_COLORS['Terrant'] || ZONE_COLORS['Forest'];
        
        // Create terrain material with appropriate base color
        // For Terrant, use soil color; for others, use appropriate ground color
        let baseColorHex = 0x4a9e4a; // Default grass color
        
        if (zoneType === 'Terrant') {
            baseColorHex = zoneColors.soil;
        } else if (zoneColors.ground) {
            baseColorHex = zoneColors.ground;
        }
        
        // Create procedural texture based on zone colors
        const secondaryColorHex = zoneType === 'Terrant' ? 
            zoneColors.rock : // Use rock as secondary color for Terrant
            (baseColorHex === 0x4a9e4a ? 0x3a7a3a : baseColorHex * 0.8); // Darker version of base color
            
        // Get or create texture
        const terrainTexture = this.getOrCreateTexture(baseColorHex, secondaryColorHex);
        
        // Create terrain material with texture
        const material = new THREE.MeshStandardMaterial({
            map: terrainTexture,
            roughness: 0.8,
            metalness: 0.2,
            vertexColors: true
        });
        
        // Store template
        this.terrainTemplates[templateKey] = {
            geometry: geometry,
            material: material,
            zoneType: zoneType
        };
        
        return this.terrainTemplates[templateKey];
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
            const worldX = x * this.terrainChunkSize + this.terrainChunkSize / 2;
            const worldZ = z * this.terrainChunkSize + this.terrainChunkSize / 2;
            
            // Get zone at this position
            const pos = new THREE.Vector3(worldX, 0, worldZ);
            const zone = this.worldManager.getZoneAt(pos);
            
            if (zone) {
                zoneType = zone.name;
            }
        }
        
        // Get or create terrain template for this zone type
        const template = this.getOrCreateTerrainTemplate(zoneType, size, resolution);
        
        // Create terrain mesh using the template
        const terrain = new THREE.Mesh(template.geometry.clone(), template.material.clone());
        terrain.rotation.x = -Math.PI / 2;
        
        // CRITICAL FIX: Ensure both receiveShadow and castShadow are set to true
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        
        // Apply terrain coloring with variations based on zone type
        this.colorTerrainUniform(terrain, zoneType);
        
        // Store zone type on the terrain for later reference
        terrain.userData.zoneType = zoneType;
        
        // Position the terrain - ensure y=0 exactly to prevent vibration
        if (position) {
            terrain.position.copy(position);
        } else {
            // Calculate world coordinates for this chunk
            const worldX = x * this.terrainChunkSize;
            const worldZ = z * this.terrainChunkSize;
            
            terrain.position.set(
                worldX + this.terrainChunkSize / 2,
                0,
                worldZ + this.terrainChunkSize / 2
            );
        }
        
        // Add terrain to scene
        this.scene.add(terrain);
        
        return terrain;
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
            this.terrainChunkSize,
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
        if (chunkData.environmentObjects && chunkData.environmentObjects.length > 0 && 
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
        if (this.terrainChunks[chunkKey] || this.terrainBuffer[chunkKey]) {
            return;
        }
        
        // Check if this chunk was saved previously
        const shouldCreateChunk = !this.savedTerrainChunks || 
                                 this.savedTerrainChunks[chunkKey] || 
                                 Object.keys(this.savedTerrainChunks).length === 0;
        
        if (!shouldCreateChunk) {
            return; // Skip creating this chunk as it wasn't in the saved state
        }
        
        // Determine zone type for this terrain chunk
        let zoneType = 'Terrant'; // Default to Terrant for new terrain
        
        // If we have a world manager with zone information, use it
        if (this.worldManager && this.worldManager.getZoneAt) {
            // Calculate world coordinates for this chunk
            const worldX = chunkX * this.terrainChunkSize + this.terrainChunkSize / 2;
            const worldZ = chunkZ * this.terrainChunkSize + this.terrainChunkSize / 2;
            
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
        this.getOrCreateTerrainTemplate(zoneType, this.terrainChunkSize, 16);
        
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
        
        // Try to load from storage first
            
        
        // If no saved data, create a new chunk using the template system
        // Get the terrain template for this zone type
        const template = this.getOrCreateTerrainTemplate(
            zoneTypeName, 
            this.terrainChunkSize, 
            16
        );
        
        // Create terrain mesh using the template
        const terrain = new THREE.Mesh(template.geometry.clone(), template.material.clone());
        terrain.rotation.x = -Math.PI / 2;
        
        // Set shadows
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        
        // Apply terrain coloring with variations based on zone type
        this.colorTerrainUniform(terrain, zoneTypeName);
        
        // Store zone type on the terrain for later reference
        terrain.userData.zoneType = zoneTypeName;
        
        // Position the terrain
        const worldX = chunkX * this.terrainChunkSize;
        const worldZ = chunkZ * this.terrainChunkSize;
        
        terrain.position.set(
            worldX + this.terrainChunkSize / 2,
            0,
            worldZ + this.terrainChunkSize / 2
        );
        
        // Replace placeholder with real terrain
        this.terrainBuffer[chunkKey] = terrain;
        
        console.debug(`Placeholder converted to new buffered chunk: ${chunkKey}`);
    }
    
    /**
     * Queue terrain chunks for buffering with priority based on player movement direction
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     */
    queueTerrainChunksForBuffering(centerX, centerZ) {
        // Limit the queue size to prevent memory issues
        const MAX_QUEUE_SIZE = 16; // Maximum number of chunks in the queue (reduced from 24 to 16)
        if (this.terrainGenerationQueue.length >= MAX_QUEUE_SIZE) {
            console.debug(`Terrain generation queue full (${this.terrainGenerationQueue.length}/${MAX_QUEUE_SIZE}), skipping new chunks`);
            return;
        }
        
        // Clear existing queue to avoid duplicates
        this.terrainGenerationQueue = [];
        
        // Track how many chunks we've added to the queue
        let chunksAdded = 0;
        const MAX_CHUNKS_PER_UPDATE = 8; // Maximum chunks to add per update
        
        // Calculate buffer area (larger than view distance)
        for (let x = centerX - this.terrainBufferDistance; x <= centerX + this.terrainBufferDistance; x++) {
            for (let z = centerZ - this.terrainBufferDistance; z <= centerZ + this.terrainBufferDistance; z++) {
                // Stop if we've reached the maximum chunks per update
                if (chunksAdded >= MAX_CHUNKS_PER_UPDATE) {
                    break;
                }
                const chunkKey = `${x},${z}`;
                
                // Skip if already in visible chunks or already in buffer
                if (this.visibleTerrainChunks[chunkKey] || this.terrainBuffer[chunkKey] || this.terrainChunks[chunkKey]) {
                    continue;
                }
                
                // Calculate distance from center
                const distX = x - centerX;
                const distZ = z - centerZ;
                
                // Calculate dot product with movement direction to prioritize chunks in that direction
                let priority = 0;
                if (this.playerMovementDirection.x !== 0 || this.playerMovementDirection.z !== 0) {
                    const dotProduct = distX * this.playerMovementDirection.x + distZ * this.playerMovementDirection.z;
                    // Higher dot product means the chunk is more in the direction of movement
                    priority = dotProduct;
                }
                
                // Add to queue with priority
                this.terrainGenerationQueue.push({
                    x: x,
                    z: z,
                    priority: priority,
                    chunkKey: chunkKey
                });
                
                // Increment the counter
                chunksAdded++;
            }
            
            // Also break the outer loop if we've reached the maximum
            if (chunksAdded >= MAX_CHUNKS_PER_UPDATE) {
                break;
            }
        }
        
        // Sort queue by priority (higher priority first)
        this.terrainGenerationQueue.sort((a, b) => b.priority - a.priority);
        
        // Log the queue size for debugging
        if (this.terrainGenerationQueue.length > 0) {
            console.debug(`Terrain generation queue size: ${this.terrainGenerationQueue.length}, chunks added: ${chunksAdded}`);
        }
    }
    
    /**
     * Process the terrain generation queue asynchronously
     * Optimized to process multiple chunks per frame when possible
     */
    processTerrainGenerationQueue() {
        // Track when we process the queue to prevent too frequent processing
        this.lastQueueProcessTime = Date.now();
        
        if (this.terrainGenerationQueue.length === 0) {
            this.isProcessingTerrainQueue = false;
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.1) { // Only log 10% of the time
                console.debug("Terrain generation queue processing complete (empty queue)");
            }
            // Dispatch an event that terrain generation is complete
            if (this.game && this.game.events) {
                this.game.events.dispatch('terrainGenerationComplete');
            }
            return;
        }
        
        this.isProcessingTerrainQueue = true;
        
        // Process multiple chunks per frame when possible
        // Start with a timestamp to measure how long we've been processing
        const startTime = performance.now();
        const maxProcessingTime = 3; // Max milliseconds to spend processing per frame (reduced from 5 to 3)
        
        // Process chunks until we hit the time limit or empty the queue
        while (this.terrainGenerationQueue.length > 0 && 
               (performance.now() - startTime) < maxProcessingTime) {
            
            // Get the highest priority chunk
            const nextChunk = this.terrainGenerationQueue.shift();
            
            // Create the chunk in the buffer (not visible yet)
            this.createBufferedTerrainChunk(nextChunk.x, nextChunk.z);
        }
        
        // If there are still chunks to process, continue in the next frame
        if (this.terrainGenerationQueue.length > 0) {
            // Add a maximum processing time to prevent infinite loops
            const MAX_PROCESSING_TIME = 500; // 500ms maximum total processing time
            const processingTime = performance.now() - startTime;
            
            if (processingTime > MAX_PROCESSING_TIME) {
                console.warn(`Terrain generation taking too long (${processingTime.toFixed(2)}ms), clearing queue to prevent FPS drop`);
                // Clear the queue to prevent infinite processing
                this.terrainGenerationQueue = [];
                this.isProcessingTerrainQueue = false;
                return;
            }
            
            // Schedule next batch with a longer delay to allow other operations
            // Increased from 16ms to 50ms to reduce CPU usage
            setTimeout(() => {
                requestAnimationFrame(() => {
                    this.processTerrainGenerationQueue();
                });
            }, 50); // Add a 50ms delay to reduce CPU load
        } else {
            this.isProcessingTerrainQueue = false;
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.1) { // Only log 10% of the time
                console.debug("Terrain generation queue processing complete");
            }
            // Dispatch an event that terrain generation is complete
            if (this.game && this.game.events) {
                this.game.events.dispatch('terrainGenerationComplete');
            }
        }
    }
    
    /**
     * Remove a terrain chunk and associated objects
     * @param {string} chunkKey - The chunk key
     * @param {boolean} cleanupAssociatedObjects - Whether to clean up associated objects (structures, environment)
     */
    removeTerrainChunk(chunkKey, cleanupAssociatedObjects = true) {
        const terrain = this.terrainChunks[chunkKey];
        if (terrain) {
            // Remove from scene
            if (terrain.parent) {
                this.scene.remove(terrain);
            }
            
            // Dispose of geometry and materials
            if (terrain.geometry) {
                terrain.geometry.dispose();
            }
            
            if (terrain.material) {
                if (Array.isArray(terrain.material)) {
                    terrain.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (terrain.material.map) terrain.material.map.dispose();
                    terrain.material.dispose();
                }
            }
            
            // Remove from terrainChunks
            delete this.terrainChunks[chunkKey];
            
            // Clean up associated objects if requested
            if (cleanupAssociatedObjects && this.worldManager) {
                // Clean up environment objects
                if (this.worldManager.environmentManager) {
                    this.worldManager.environmentManager.removeChunkObjects(chunkKey, true);
                }
                
                // Clean up structures
                if (this.worldManager.structureManager) {
                    this.worldManager.structureManager.removeStructuresInChunk(chunkKey, true);
                }
                
                // Clean up interactive objects if the method exists
                if (this.worldManager.interactiveManager && 
                    typeof this.worldManager.interactiveManager.removeObjectsInChunk === 'function') {
                    this.worldManager.interactiveManager.removeObjectsInChunk(chunkKey, true);
                }
                
                // console.debug(`Removed terrain chunk ${chunkKey} with associated objects`);
            }
        }
    }
    
    /**
     * Get the terrain height at a specific world position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - The height of the terrain at the specified position
     */
    getTerrainHeight(x, z) {
        // Always return exactly 0 for completely flat terrain
        // This is critical to prevent vibration
        return 0;
    }
    
    /**
     * Clear all terrain objects
     */
    clear() {
        // Clear terrain chunks
        for (const chunkKey in this.terrainChunks) {
            this.removeTerrainChunk(chunkKey);
        }
        
        // Clear buffered terrain chunks
        for (const chunkKey in this.terrainBuffer) {
            const terrain = this.terrainBuffer[chunkKey];
            if (terrain) {
                if (terrain.parent) {
                    this.scene.remove(terrain);
                }
                if (terrain.geometry) {
                    terrain.geometry.dispose();
                }
                if (terrain.material) {
                    terrain.material.dispose();
                }
            }
        }
        
        // Remove initial terrain if it exists
        if (this.terrain && this.terrain.parent) {
            this.scene.remove(this.terrain);
            this.terrain.geometry.dispose();
            this.terrain.material.dispose();
            this.terrain = null;
        }
        
        // Reset object collections
        this.terrainChunks = {};
        this.visibleTerrainChunks = {};
        this.terrainBuffer = {};
        this.terrainGenerationQueue = [];
        this.isProcessingTerrainQueue = false;
    }
    
    /**
     * Clear distant terrain chunks to free memory
     * @param {number} playerChunkX - Player's chunk X coordinate (optional)
     * @param {number} playerChunkZ - Player's chunk Z coordinate (optional)
     * @param {number} maxDistance - Maximum distance from player to keep chunks (defaults to 2x view distance)
     */
    clearDistantChunks(playerChunkX, playerChunkZ, maxDistance) {
        // Default to 2x the view distance if not specified
        const clearDistance = maxDistance || (this.terrainChunkViewDistance * 2);
        
        // Get current player chunk coordinates
        let centerX = 0;
        let centerZ = 0;
        
        // If player chunk coordinates are provided, use them
        if (typeof playerChunkX === 'number' && typeof playerChunkZ === 'number') {
            centerX = playerChunkX;
            centerZ = playerChunkZ;
        }
        // Otherwise, try to get player position from the game
        else if (this.worldManager && this.worldManager.game && this.worldManager.game.player) {
            const playerPos = this.worldManager.game.player.getPosition();
            centerX = Math.floor(playerPos.x / this.terrainChunkSize);
            centerZ = Math.floor(playerPos.z / this.terrainChunkSize);
        }
        
        // Count chunks before cleanup
        const chunkCountBefore = Object.keys(this.terrainChunks).length;
        const bufferCountBefore = Object.keys(this.terrainBuffer).length;
        
        // Clear distant chunks from active chunks
        const chunksToRemove = [];
        for (const chunkKey in this.terrainChunks) {
            const [x, z] = chunkKey.split(',').map(Number);
            const distX = Math.abs(x - centerX);
            const distZ = Math.abs(z - centerZ);
            
            // If chunk is too far away, mark for removal
            if (distX > clearDistance || distZ > clearDistance) {
                chunksToRemove.push(chunkKey);
            }
        }
        
        // Remove marked chunks
        chunksToRemove.forEach(chunkKey => {
            this.removeTerrainChunk(chunkKey, true); // Force cleanup of associated objects
        });
        
        // Clear distant chunks from buffer - be much more aggressive with buffer cleanup
        // Buffer should only keep chunks that are just outside the view distance
        // Reduced from clearDistance-1 to terrainChunkViewDistance+1 to prevent buffer buildup
        const bufferClearDistance = this.terrainChunkViewDistance + 1;
        const bufferToRemove = [];
        for (const chunkKey in this.terrainBuffer) {
            const [x, z] = chunkKey.split(',').map(Number);
            const distX = Math.abs(x - centerX);
            const distZ = Math.abs(z - centerZ);
            
            // If chunk is too far away, mark for removal
            // Use a stricter distance check for buffer chunks
            if (distX > bufferClearDistance || distZ > bufferClearDistance) {
                bufferToRemove.push(chunkKey);
            }
        }
        
        // Remove marked buffer chunks
        bufferToRemove.forEach(chunkKey => {
            const chunk = this.terrainBuffer[chunkKey];
            
            // Remove from scene if needed
            if (chunk && chunk.parent) {
                this.scene.remove(chunk);
            }
            
            // Dispose of geometry and materials
            if (chunk && chunk.geometry) {
                chunk.geometry.dispose();
            }
            
            if (chunk && chunk.material) {
                const materials = Array.isArray(chunk.material) ? chunk.material : [chunk.material];
                materials.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            }
            
            // Remove from buffer
            delete this.terrainBuffer[chunkKey];
        });
        
        // Clear any distant chunks from generation queue
        this.terrainGenerationQueue = this.terrainGenerationQueue.filter(item => {
            const distX = Math.abs(item.x - centerX);
            const distZ = Math.abs(item.z - centerZ);
            return distX <= clearDistance && distZ <= clearDistance;
        });
        
        // Count chunks after cleanup
        const chunkCountAfter = Object.keys(this.terrainChunks).length;
        const bufferCountAfter = Object.keys(this.terrainBuffer).length;
        
        // Force a garbage collection hint after significant cleanup
        if ((chunkCountBefore - chunkCountAfter) + (bufferCountBefore - bufferCountAfter) > 5) {
            if (this.worldManager) {
                this.worldManager.hintGarbageCollection();
            }
        }
        
        console.debug(`Cleared distant chunks: ${chunkCountBefore - chunkCountAfter} active, ${bufferCountBefore - bufferCountAfter} buffered`);
    }
    
    /**
     * Save terrain state
     * @returns {object} - The saved terrain state
     */
    save() {
        const terrainState = {
            chunks: {}
        };
        
        // Save visible chunks
        for (const chunkKey in this.terrainChunks) {
            terrainState.chunks[chunkKey] = {
                exists: true
            };
        }
        
        // Save buffered chunks
        for (const chunkKey in this.terrainBuffer) {
            if (!terrainState.chunks[chunkKey]) {
                terrainState.chunks[chunkKey] = {
                    exists: true,
                    buffered: true
                };
            }
        }
        
        return terrainState;
    }
    
    /**
     * Load terrain state
     * @param {object} terrainState - The terrain state to load
     */
    load(terrainState) {
        if (!terrainState || !terrainState.chunks) return;
        
        this.savedTerrainChunks = terrainState.chunks;
    }
}