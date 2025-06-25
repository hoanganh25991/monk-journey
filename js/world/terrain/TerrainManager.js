import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';
import { TERRAIN_CONFIG } from '../../config/terrain.js';

/**
 * Optimized Terrain Manager
 * Simplified and high-performance terrain system
 * Combines all terrain functionality into a single, efficient class
 */
export class TerrainManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Terrain configuration
        this.config = {
            chunkSize: TERRAIN_CONFIG?.chunkSize || 64,
            viewDistance: TERRAIN_CONFIG?.chunkViewDistance || 3,
            bufferDistance: TERRAIN_CONFIG?.bufferDistance || 5,
            resolution: TERRAIN_CONFIG?.resolution || 32,
            height: TERRAIN_CONFIG?.height || 10,
            size: TERRAIN_CONFIG?.size || 1000
        };
        
        // Core data structures - simplified
        this.chunks = new Map(); // Active terrain chunks
        this.buffer = new Map(); // Pre-generated chunks not yet visible
        this.queue = []; // Generation queue with priority
        
        // Player tracking for predictive loading
        this.playerChunk = { x: 0, z: 0 };
        this.movementDirection = new THREE.Vector3();
        
        // Performance management
        this.isProcessing = false;
        this.maxProcessingTime = 16; // 16ms per frame for 60fps
        this.maxQueueSize = 20;
        
        // Base terrain
        this.baseTerrain = null;
        
        // Texture cache for reusing materials
        this.textureCache = new Map();
        
        // Geometry pool for reusing geometries
        this.geometryPool = [];
        this.maxPoolSize = 10;
    }
    
    /**
     * Initialize the terrain system
     */
    async init() {
        console.log('🌍 Initializing Terrain Manager...');
        
        // Create base terrain
        await this.createBaseTerrain();
        
        // Generate initial chunks around origin
        this.updateTerrain(new THREE.Vector3(0, 0, 0));
        
        // Wait for initial generation to complete
        await this.waitForInitialGeneration();
        
        console.log('✅ Terrain Manager initialized');
        return true;
    }
    
    /**
     * Create base flat terrain
     */
    async createBaseTerrain() {
        const geometry = this.createTerrainGeometry(0, 0, this.config.size, this.config.resolution);
        const material = this.createTerrainMaterial('Terrant');
        
        this.baseTerrain = new THREE.Mesh(geometry, material);
        this.baseTerrain.position.set(0, 0, 0);
        this.baseTerrain.receiveShadow = true;
        
        this.scene.add(this.baseTerrain);
        console.log('🌱 Base terrain created');
    }
    
    /**
     * Update terrain based on player position
     * This is the main entry point called by the game loop
     */
    updateTerrain(playerPosition) {
        const currentChunk = this.getChunkCoords(playerPosition);
        
        // Update player movement tracking
        this.updateMovementTracking(currentChunk);
        
        // Update visible chunks
        this.updateVisibleChunks(currentChunk);
        
        // Queue chunks for buffer
        this.queueBufferChunks(currentChunk);
        
        // Process generation queue
        if (!this.isProcessing) {
            this.processQueue();
        }
        
        // Cleanup distant chunks
        this.cleanupDistantChunks(currentChunk);
    }
    
    /**
     * Update movement tracking for predictive loading
     */
    updateMovementTracking(currentChunk) {
        if (this.playerChunk.x !== currentChunk.x || this.playerChunk.z !== currentChunk.z) {
            // Calculate movement direction
            this.movementDirection.set(
                currentChunk.x - this.playerChunk.x,
                0,
                currentChunk.z - this.playerChunk.z
            );
            
            // Normalize if not zero
            if (this.movementDirection.lengthSq() > 0) {
                this.movementDirection.normalize();
            }
            
            this.playerChunk = currentChunk;
        }
    }
    
    /**
     * Update visible chunks around player
     */
    updateVisibleChunks(centerChunk) {
        const viewDistance = this.config.viewDistance;
        
        for (let x = centerChunk.x - viewDistance; x <= centerChunk.x + viewDistance; x++) {
            for (let z = centerChunk.z - viewDistance; z <= centerChunk.z + viewDistance; z++) {
                const chunkKey = `${x},${z}`;
                
                // Skip if already visible
                if (this.chunks.has(chunkKey)) continue;
                
                // Check if in buffer, move to active
                if (this.buffer.has(chunkKey)) {
                    const chunk = this.buffer.get(chunkKey);
                    this.buffer.delete(chunkKey);
                    this.chunks.set(chunkKey, chunk);
                    this.scene.add(chunk);
                    continue;
                }
                
                // Create immediately for visible chunks
                this.createChunk(x, z, true);
            }
        }
    }
    
    /**
     * Queue chunks for buffering (predictive loading)
     */
    queueBufferChunks(centerChunk) {
        // Don't queue if queue is full
        if (this.queue.length >= this.maxQueueSize) return;
        
        const bufferDistance = this.config.bufferDistance;
        const viewDistance = this.config.viewDistance;
        
        const candidates = [];
        
        for (let x = centerChunk.x - bufferDistance; x <= centerChunk.x + bufferDistance; x++) {
            for (let z = centerChunk.z - bufferDistance; z <= centerChunk.z + bufferDistance; z++) {
                const chunkKey = `${x},${z}`;
                
                // Skip if already exists or in queue
                if (this.chunks.has(chunkKey) || 
                    this.buffer.has(chunkKey) || 
                    this.isInQueue(x, z)) continue;
                
                // Skip if too close (should be visible chunk)
                const distance = Math.max(Math.abs(x - centerChunk.x), Math.abs(z - centerChunk.z));
                if (distance <= viewDistance) continue;
                
                // Calculate priority based on movement direction and distance
                let priority = -distance; // Closer = higher priority
                
                // Boost priority for chunks in movement direction
                if (this.movementDirection.lengthSq() > 0) {
                    const dx = x - centerChunk.x;
                    const dz = z - centerChunk.z;
                    const dot = dx * this.movementDirection.x + dz * this.movementDirection.z;
                    if (dot > 0) {
                        priority += dot * 10; // Significant boost for movement direction
                    }
                }
                
                candidates.push({ x, z, priority, chunkKey });
            }
        }
        
        // Sort by priority and add to queue
        candidates.sort((a, b) => b.priority - a.priority);
        
        // Add up to remaining queue capacity
        const remainingCapacity = this.maxQueueSize - this.queue.length;
        for (let i = 0; i < Math.min(candidates.length, remainingCapacity); i++) {
            this.queue.push(candidates[i]);
        }
    }
    
    /**
     * Process the generation queue efficiently
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        const startTime = performance.now();
        
        while (this.queue.length > 0 && (performance.now() - startTime) < this.maxProcessingTime) {
            const item = this.queue.shift();
            
            // Skip if chunk now exists (race condition)
            if (this.chunks.has(item.chunkKey) || this.buffer.has(item.chunkKey)) {
                continue;
            }
            
            // Create chunk for buffer
            this.createChunk(item.x, item.z, false);
        }
        
        this.isProcessing = false;
        
        // Continue processing in next frame if queue not empty
        if (this.queue.length > 0) {
            requestAnimationFrame(() => this.processQueue());
        }
    }
    
    /**
     * Create a terrain chunk
     */
    createChunk(chunkX, chunkZ, isImmediate = false) {
        const worldX = chunkX * this.config.chunkSize;
        const worldZ = chunkZ * this.config.chunkSize;
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Create terrain geometry
        const geometry = this.createTerrainGeometry(
            worldX, 
            worldZ, 
            this.config.chunkSize, 
            Math.floor(this.config.resolution / 2) // Lower resolution for chunks
        );
        
        // Get zone type for this position
        const position = new THREE.Vector3(worldX, 0, worldZ);
        const zone = this.worldManager.getZoneAt(position);
        const zoneType = zone ? zone.name : 'Terrant';
        
        // Create material
        const material = this.createTerrainMaterial(zoneType);
        
        // Create mesh
        const chunk = new THREE.Mesh(geometry, material);
        chunk.position.set(worldX, 0, worldZ);
        chunk.receiveShadow = true;
        chunk.castShadow = false; // Terrain doesn't cast shadows for performance
        
        // Color the terrain
        this.colorTerrain(chunk, zoneType);
        
        if (isImmediate) {
            // Add to active chunks and scene immediately
            this.chunks.set(chunkKey, chunk);
            this.scene.add(chunk);
        } else {
            // Add to buffer
            this.buffer.set(chunkKey, chunk);
        }
        
        return chunk;
    }
    
    /**
     * Create terrain geometry with safe pooling
     */
    createTerrainGeometry(centerX, centerZ, size, resolution) {
        // Validate input parameters
        if (!isFinite(centerX) || !isFinite(centerZ)) {
            console.error('TerrainManager: Invalid center coordinates:', centerX, centerZ);
            centerX = 0;
            centerZ = 0;
        }
        
        if (!isFinite(size) || size <= 0) {
            console.error('TerrainManager: Invalid size:', size);
            size = this.config.chunkSize || 64;
        }
        
        if (!isFinite(resolution) || resolution <= 0) {
            console.error('TerrainManager: Invalid resolution:', resolution);
            resolution = this.config.resolution || 32;
        }
        
        // For now, disable pooling to prevent NaN issues
        // TODO: Implement proper geometry pooling with vertex buffer updates
        
        try {
            // Create new geometry every time to ensure clean state
            const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
            geometry.rotateX(-Math.PI / 2); // Make it horizontal
            
            // Apply height variations
            this.applyHeightVariations(geometry, centerX, centerZ);
            
            geometry.computeVertexNormals();
            return geometry;
        } catch (error) {
            console.error('TerrainManager: Failed to create terrain geometry:', error);
            // Return a simple fallback geometry
            const fallbackGeometry = new THREE.PlaneGeometry(64, 64, 16, 16);
            fallbackGeometry.rotateX(-Math.PI / 2);
            return fallbackGeometry;
        }
    }
    
    /**
     * Update geometry positions for pooled geometry reuse
     */
    updateGeometryPositions(geometry, centerX, centerZ, size, resolution) {
        // Dispose existing geometry and create new one for now
        // This is a safer approach than trying to update existing geometry
        geometry.dispose();
        
        // Create new geometry with proper parameters
        const newGeometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        newGeometry.rotateX(-Math.PI / 2);
        
        // Copy attributes from new geometry to existing one
        geometry.attributes = newGeometry.attributes;
        geometry.index = newGeometry.index;
        
        // Apply height variations
        this.applyHeightVariations(geometry, centerX, centerZ);
        
        // Clean up temporary geometry
        newGeometry.dispose();
    }

    /**
     * Apply height variations to geometry
     */
    applyHeightVariations(geometry, centerX, centerZ) {
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] + centerX;
            const z = positions[i + 2] + centerZ;
            
            // Simple height calculation using noise with NaN validation
            const height = this.getTerrainHeight(x, z);
            positions[i + 1] = isNaN(height) ? 0 : height;
        }
        
        geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Get terrain height at position using simple noise
     */
    getTerrainHeight(x, z) {
        // Handle case where a Vector3 object is passed instead of x, z
        if (typeof x === 'object' && x !== null && 'x' in x && 'z' in x) {
            console.warn('TerrainManager: Vector3 object passed to getTerrainHeight instead of x, z coordinates:', x);
            // Extract coordinates from Vector3
            const originalX = x;
            z = x.z;
            x = x.x;
            
            // Log stack trace to help find source
            console.trace('TerrainManager: Stack trace for Vector3 parameter issue');
        }
        
        // Handle edge case where x is undefined/null
        if (x === undefined || x === null) {
            console.warn('TerrainManager: x parameter is undefined/null in getTerrainHeight');
            return 0;
        }
        
        // Handle edge case where z is undefined/null
        if (z === undefined || z === null) {
            console.warn('TerrainManager: z parameter is undefined/null in getTerrainHeight');
            return 0;
        }
        
        // Validate input parameters
        if (!isFinite(x) || !isFinite(z)) {
            console.warn('TerrainManager: Invalid coordinates passed to getTerrainHeight:', x, z);
            return 0;
        }
        
        // Simple multi-octave noise for terrain height
        let height = 0;
        let amplitude = this.config.height || 10;
        let frequency = 0.01;
        
        for (let i = 0; i < 3; i++) {
            const sinValue = Math.sin(x * frequency);
            const cosValue = Math.cos(z * frequency);
            
            // Validate intermediate calculations
            if (isFinite(sinValue) && isFinite(cosValue)) {
                height += sinValue * cosValue * amplitude;
            }
            
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        // Final validation
        return isFinite(height) ? height : 0;
    }
    
    /**
     * Create or reuse terrain material
     */
    createTerrainMaterial(zoneType) {
        if (this.textureCache.has(zoneType)) {
            return this.textureCache.get(zoneType);
        }
        
        const zoneColors = ZONE_COLORS?.[zoneType] || ZONE_COLORS?.['Terrant'] || {};
        const baseColor = zoneType === 'Terrant' ? (zoneColors.soil || 0x8B4513) : 0x4a9e4a;
        
        const material = new THREE.MeshLambertMaterial({
            color: baseColor,
            vertexColors: true
        });
        
        this.textureCache.set(zoneType, material);
        return material;
    }
    
    /**
     * Color terrain with natural variations
     */
    colorTerrain(terrain, zoneType) {
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        const zoneColors = ZONE_COLORS?.[zoneType] || ZONE_COLORS?.['Terrant'] || {};
        
        let baseColorHex = zoneType === 'Terrant' ? (zoneColors.soil || 0x8B4513) : 0x4a9e4a;
        const baseColor = new THREE.Color(baseColorHex);
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // Simple variation
            const variation = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.1;
            const color = baseColor.clone();
            color.multiplyScalar(1 + variation);
            
            colors.push(color.r, color.g, color.b);
        }
        
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    /**
     * Cleanup distant chunks to manage memory
     */
    cleanupDistantChunks(centerChunk) {
        const cleanupDistance = this.config.bufferDistance + 2;
        const chunksToRemove = [];
        
        // Check active chunks
        for (const [key, chunk] of this.chunks) {
            const [x, z] = key.split(',').map(Number);
            const distance = Math.max(Math.abs(x - centerChunk.x), Math.abs(z - centerChunk.z));
            
            if (distance > cleanupDistance) {
                chunksToRemove.push({ key, chunk, isActive: true });
            }
        }
        
        // Check buffer chunks
        for (const [key, chunk] of this.buffer) {
            const [x, z] = key.split(',').map(Number);
            const distance = Math.max(Math.abs(x - centerChunk.x), Math.abs(z - centerChunk.z));
            
            if (distance > cleanupDistance) {
                chunksToRemove.push({ key, chunk, isActive: false });
            }
        }
        
        // Remove chunks
        for (const { key, chunk, isActive } of chunksToRemove) {
            if (isActive) {
                this.scene.remove(chunk);
                this.chunks.delete(key);
            } else {
                this.buffer.delete(key);
            }
            
            // Return geometry to pool
            if (this.geometryPool.length < this.maxPoolSize) {
                this.geometryPool.push(chunk.geometry);
            } else {
                chunk.geometry.dispose();
            }
            
            // Don't dispose material (reused from cache)
        }
        
        if (chunksToRemove.length > 0) {
            console.debug(`🧹 Cleaned up ${chunksToRemove.length} distant chunks`);
        }
    }
    
    /**
     * Wait for initial terrain generation
     */
    waitForInitialGeneration() {
        return new Promise((resolve) => {
            const check = () => {
                if (this.queue.length === 0 && !this.isProcessing) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    /**
     * Utility methods
     */
    getChunkCoords(position) {
        return {
            x: Math.floor(position.x / this.config.chunkSize),
            z: Math.floor(position.z / this.config.chunkSize)
        };
    }
    
    isInQueue(x, z) {
        return this.queue.some(item => item.x === x && item.z === z);
    }
    
    /**
     * Get terrain height at world position
     */
    getHeightAt(x, z) {
        return this.getTerrainHeight(x, z);
    }
    
    /**
     * Check if a chunk exists at coordinates
     */
    hasChunk(chunkKey) {
        return this.chunks.has(chunkKey) || this.buffer.has(chunkKey);
    }
    
    /**
     * Clear all terrain data
     */
    clear() {
        // Remove all chunks from scene
        for (const chunk of this.chunks.values()) {
            this.scene.remove(chunk);
            chunk.geometry.dispose();
        }
        
        // Dispose buffer chunks
        for (const chunk of this.buffer.values()) {
            chunk.geometry.dispose();
        }
        
        // Clear data structures
        this.chunks.clear();
        this.buffer.clear();
        this.queue.length = 0;
        
        // Clear caches
        this.textureCache.clear();
        this.geometryPool.forEach(geo => geo.dispose());
        this.geometryPool.length = 0;
        
        // Reset tracking
        this.playerChunk = { x: 0, z: 0 };
        this.movementDirection.set(0, 0, 0);
        this.isProcessing = false;
    }
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            activeChunks: this.chunks.size,
            bufferedChunks: this.buffer.size,
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            geometryPoolSize: this.geometryPool.length,
            textureCache: this.textureCache.size
        };
    }
}