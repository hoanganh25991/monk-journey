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
        
        // Noise configuration for enhanced terrain
        this.noiseConfig = {
            heightScale: 1.0,
            colorScale: 1.0,
            patternScale: 1.0,
            temperatureScale: 0.5,
            moistureScale: 0.5,
            roughnessScale: 0.3
        };
        
        // Debug/testing configuration
        this.useTestPattern = false; // Set to true to use checkerboard test pattern instead of biome coloring
    }
    
    /**
     * Initialize the terrain system
     */
    async init() {
        console.log('🌍 Initializing Terrain Manager...');
        const startTime = performance.now();
        
        // Skip base terrain creation to prevent z-fighting
        // The chunked system will handle all terrain rendering
        
        // Generate initial chunks around origin
        console.log('🌱 Generating initial terrain chunks...');
        this.updateTerrain(new THREE.Vector3(0, 0, 0));
        
        // Wait for initial generation to complete with timeout
        console.log('⏳ Waiting for initial terrain generation...');
        const generationStartTime = performance.now();
        
        try {
            await Promise.race([
                this.waitForInitialGeneration(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Terrain generation timeout')), 30000) // 30 second timeout
                )
            ]);
            
            const generationTime = performance.now() - generationStartTime;
            console.log(`✅ Initial terrain generation completed in ${generationTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.warn('⚠️ Terrain generation timeout or error, continuing with available chunks:', error);
            // Continue with whatever chunks were generated
        }
        
        const totalTime = performance.now() - startTime;
        console.log(`✅ Terrain Manager initialized in ${totalTime.toFixed(2)}ms`);
        return true;
    }
    
    /**
     * Create base flat terrain (DISABLED - causes z-fighting with chunks)
     */
    async createBaseTerrain() {
        // DISABLED: Base terrain causes z-fighting with chunks
        // The chunked terrain system handles all terrain rendering
        console.log('🌱 Base terrain creation skipped (chunked system active)');
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
        // Add tiny height offset to prevent z-fighting
        chunk.position.set(worldX, 0.001, worldZ);
        chunk.receiveShadow = true;
        chunk.castShadow = false; // Terrain doesn't cast shadows for performance
        
        // Color the terrain with enhanced noise
        this.colorTerrain(chunk, zoneType);
        
        // Debug: Log terrain creation
        console.log(`🌍 Created ${zoneType} terrain chunk at (${worldX}, ${worldZ})`);
        
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
     * Get terrain height at position using enhanced noise
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
        
        // Enhanced multi-octave noise for terrain height with natural variations
        let height = 0;
        let amplitude = this.config.height || 10;
        let frequency = 0.005; // Start with lower frequency for larger features
        
        // Layer 1: Large rolling hills
        height += this.improvedNoise(x * frequency, z * frequency) * amplitude;
        
        // Layer 2: Medium variations
        amplitude *= 0.6;
        frequency *= 2.5;
        height += this.improvedNoise(x * frequency, z * frequency) * amplitude;
        
        // Layer 3: Small details
        amplitude *= 0.5;
        frequency *= 3;
        height += this.improvedNoise(x * frequency, z * frequency) * amplitude;
        
        // Layer 4: Fine details
        amplitude *= 0.4;
        frequency *= 2;
        height += this.improvedNoise(x * frequency, z * frequency) * amplitude;
        
        // Layer 5: Ridge noise for variety
        amplitude *= 0.3;
        frequency *= 1.5;
        height += Math.abs(this.improvedNoise(x * frequency, z * frequency)) * amplitude;
        
        // Final validation
        return isFinite(height) ? height : 0;
    }
    
    /**
     * Improved noise function using interpolated random values
     */
    improvedNoise(x, z) {
        // Get integer coordinates
        const floorX = Math.floor(x);
        const floorZ = Math.floor(z);
        
        // Get fractional parts
        const fracX = x - floorX;
        const fracZ = z - floorZ;
        
        // Get noise values at corners
        const a = this.smoothNoise(floorX, floorZ);
        const b = this.smoothNoise(floorX + 1, floorZ);
        const c = this.smoothNoise(floorX, floorZ + 1);
        const d = this.smoothNoise(floorX + 1, floorZ + 1);
        
        // Smooth interpolation
        const fadeX = this.fade(fracX);
        const fadeZ = this.fade(fracZ);
        
        // Interpolate
        const i1 = this.lerp(a, b, fadeX);
        const i2 = this.lerp(c, d, fadeX);
        
        return this.lerp(i1, i2, fadeZ);
    }
    
    /**
     * Smooth noise function
     */
    smoothNoise(x, z) {
        const corners = (this.rawNoise(x - 1, z - 1) + this.rawNoise(x + 1, z - 1) +
                        this.rawNoise(x - 1, z + 1) + this.rawNoise(x + 1, z + 1)) / 16;
        const sides = (this.rawNoise(x - 1, z) + this.rawNoise(x + 1, z) +
                      this.rawNoise(x, z - 1) + this.rawNoise(x, z + 1)) / 8;
        const center = this.rawNoise(x, z) / 4;
        
        return corners + sides + center;
    }
    
    /**
     * Raw noise function using pseudo-random values
     */
    rawNoise(x, z) {
        // Simple hash function for consistent pseudo-random values
        let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        const result = 2 * (n - Math.floor(n)) - 1; // Return value between -1 and 1
        
        // Debug: Occasional logging
        if (Math.random() < 0.0001) {
            console.log(`🔧 Raw noise at (${x}, ${z}): ${result.toFixed(3)}`);
        }
        
        return result;
    }
    
    /**
     * Smooth fade function for interpolation
     */
    fade(t) {
        // Smoothstep function: 3t² - 2t³
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    /**
     * Create or reuse terrain material with enhanced properties
     */
    createTerrainMaterial(zoneType) {
        const cacheKey = `${zoneType}_enhanced`;
        
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }
        
        const zoneColors = ZONE_COLORS?.[zoneType] || ZONE_COLORS?.['Terrant'] || {};
        const baseColor = zoneType === 'Terrant' ? (zoneColors.soil || 0xE5C09A) : 0x4a9e4a;
        
        // Enhanced material with better visual properties
        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff, // Use white so vertex colors show through properly
            vertexColors: true,
            transparent: false,
            opacity: 1.0,
            // Add slight roughness variation for more realistic appearance
            shininess: 0,
            flatShading: false, // Smooth shading for better noise visualization
            side: THREE.FrontSide,
        });
        
        // Optional: Add custom shader uniforms for advanced effects
        material.onBeforeCompile = (shader) => {
            // Add time uniform for animated effects if needed
            shader.uniforms.time = { value: 0 };
            
            // Modify vertex shader to add subtle movement
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                // Add subtle terrain animation based on world position
                float wave = sin(position.x * 0.01 + position.z * 0.01) * 0.1;
                transformed.y += wave * 0.02;
                `
            );
            
            // Store reference for potential animation updates
            material.userData.shader = shader;
        };
        
        this.textureCache.set(cacheKey, material);
        return material;
    }
    
    /**
     * Color terrain with natural variations using noise
     */
    colorTerrain(terrain, zoneType) {
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        const zoneColors = ZONE_COLORS?.[zoneType] || ZONE_COLORS?.['Terrant'] || {};
        
        // Get base colors for the zone
        const baseColorHex = zoneType === 'Terrant' ? (zoneColors.soil || 0xE5C09A) : 0x4a9e4a;
        const baseColor = new THREE.Color(baseColorHex);
        
        // Get additional colors for variety
        const accentColorHex = zoneColors.accent || zoneColors.vegetation || baseColorHex;
        const accentColor = new THREE.Color(accentColorHex);
        
        const rockColorHex = zoneColors.rock || 0x696969;
        const rockColor = new THREE.Color(rockColorHex);
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] + terrain.position.x;
            const z = positions[i + 2] + terrain.position.z;
            const y = positions[i + 1]; // Height of this vertex
            
            // Debug test pattern (can be toggled via this.useTestPattern)
            if (this.useTestPattern) {
                const testX = Math.floor(x / 5) % 2;
                const testZ = Math.floor(z / 5) % 2;
                if ((testX + testZ) % 2 === 0) {
                    colors.push(1.0, 0.0, 0.0); // Red squares
                    continue;
                } else {
                    colors.push(0.0, 0.0, 1.0); // Blue squares
                    continue;
                }
            }
            
            // Generate biome-specific patterns
            const biomePattern = this.createBiomePattern(x, z, zoneType);
            
            // Generate multiple noise layers for color variation (reduced frequency for larger areas)
            const colorNoise1 = this.improvedNoise(x * 0.005, z * 0.005); // Very large patterns (400% larger areas)
            const colorNoise2 = this.improvedNoise(x * 0.01 , z * 0.01 );   // Large patterns (500% larger areas)
            const colorNoise3 = this.improvedNoise(x * 0.02 , z * 0.02 );   // Medium patterns (500% larger areas)
            const colorNoise4 = this.improvedNoise(x * 0.04 , z * 0.04 );   // Fine details (500% larger areas)
            
            // Combine noise for complex patterns - ENHANCED for more visibility
            const combinedNoise = (colorNoise1 * 0.5 + colorNoise2 * 0.4 + colorNoise3 * 0.3 + colorNoise4 * 0.2);
            
            // Height-based color mixing
            const heightFactor = Math.max(0, Math.min(1, (y + 5) / 15)); // Normalize height to 0-1
            
            // Debug: Log noise values occasionally
            if (Math.random() < 0.001) { // Log 0.1% of vertices for debugging
                console.log(`🎨 Noise at (${x}, ${z}): combined=${combinedNoise.toFixed(3)}, height=${heightFactor.toFixed(3)}, zone=${zoneType}`);
            }
            
            // Start with base color
            let finalColor = baseColor.clone();
            
            // Apply aggressive noise-based color variation (reduced frequency for larger areas)
            const majorNoise = this.improvedNoise(x * 0.003, z * 0.003);  // Much larger major patterns
            const minorNoise = this.improvedNoise(x * 0.015, z * 0.015);  // Larger minor patterns
            const detailNoise = this.improvedNoise(x * 0.03, z * 0.03);   // Larger detail patterns
            
            // Create dramatic color variations based on noise
            if (majorNoise > 0.3) {
                // High noise areas - darker, rockier colors
                finalColor.multiplyScalar(0.6);
                const rockInfluence = Math.min(1, majorNoise * 2);
                finalColor.lerp(rockColor, rockInfluence * 0.7);
            } else if (majorNoise < -0.3) {
                // Low noise areas - lighter, sandier colors  
                finalColor.multiplyScalar(1.4);
                const lightColor = new THREE.Color(0xF5DEB3); // Wheat
                finalColor.lerp(lightColor, Math.abs(majorNoise) * 0.8);
            }
            
            // Add medium-scale variations
            if (Math.abs(minorNoise) > 0.4) {
                const accentInfluence = Math.min(1, Math.abs(minorNoise) * 1.5);
                finalColor.lerp(accentColor, accentInfluence * 0.6);
            }
            
            // Add fine details
            const detailInfluence = detailNoise * 0.3;
            finalColor.multiplyScalar(1 + detailInfluence);
            
            // Apply biome-specific coloring based on patterns
            this.applyBiomeColoring(finalColor, biomePattern, zoneType, zoneColors, heightFactor);
            
            // Mix with accent color based on noise - ENHANCED VISIBILITY
            if (Math.abs(combinedNoise) > 0.05) { // Lower threshold for more variation
                const mixAmount = Math.min(0.8, Math.abs(combinedNoise) * 3); // Stronger mixing
                finalColor.lerp(accentColor, mixAmount);
            }
            
            // Add rock color at higher elevations or steep slopes - ENHANCED
            if (heightFactor > 0.5 || Math.abs(combinedNoise) > 0.3) { // Lower thresholds
                const rockMixAmount = Math.min(0.6, (heightFactor - 0.5) * 2 + Math.abs(combinedNoise) * 0.8);
                finalColor.lerp(rockColor, rockMixAmount);
            }
            
            // Add dramatic brightness variation based on noise - ENHANCED
            const brightnessVariation = 1 + (combinedNoise * 0.6); // Double the variation
            finalColor.multiplyScalar(Math.max(0.3, Math.min(1.8, brightnessVariation)));
            
            // Add subtle color temperature variation (reduced frequency for larger areas)
            const temperatureNoise = this.improvedNoise(x * 0.002, z * 0.002);  // Much larger temperature zones
            if (temperatureNoise > 0) {
                // Warmer tones
                finalColor.r = Math.min(1, finalColor.r * (1 + temperatureNoise * 0.1));
                finalColor.g = Math.min(1, finalColor.g * (1 + temperatureNoise * 0.05));
            } else {
                // Cooler tones
                finalColor.b = Math.min(1, finalColor.b * (1 + Math.abs(temperatureNoise) * 0.1));
                finalColor.g = Math.min(1, finalColor.g * (1 + Math.abs(temperatureNoise) * 0.05));
            }
            
            colors.push(finalColor.r, finalColor.g, finalColor.b);
        }
        
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    /**
     * Apply biome-specific coloring based on patterns
     */
    applyBiomeColoring(color, pattern, zoneType, zoneColors, heightFactor) {
        switch (zoneType) {
            case 'Forest':
                // Forest areas: mix greens based on vegetation density
                if (pattern.vegetation > 0.3) {
                    const forestGreen = new THREE.Color(zoneColors.foliage || 0x2F4F4F);
                    color.lerp(forestGreen, pattern.vegetation * 0.7);
                }
                if (pattern.clearings > 0.2) {
                    const groundColor = new THREE.Color(zoneColors.ground || 0x8F9779);
                    color.lerp(groundColor, pattern.clearings * 0.5);
                }
                break;
                
            case 'Desert':
                // Desert areas: sand dunes and rocky outcrops - MAXIMUM VISIBILITY
                if (pattern.sand > 0.05) { // Very low threshold
                    const sandColor = new THREE.Color(zoneColors.sand || 0xF4A460);
                    color.lerp(sandColor, Math.min(1, pattern.sand * 2)); // Very strong effect
                }
                if (pattern.rocks > 0.1) { // Lower threshold
                    const rockColor = new THREE.Color(zoneColors.rock || 0xA0522D);
                    color.lerp(rockColor, Math.min(1, pattern.rocks * 1.5)); // Very strong effect
                }
                // Add dramatic wind pattern effect
                if (Math.abs(pattern.windPattern) > 0.05) {
                    const windColor = pattern.windPattern > 0 ? 
                        new THREE.Color(0xF5DEB3) : // Wheat color for light sand
                        new THREE.Color(0xD2691E); // Saddle brown for compressed sand
                    color.lerp(windColor, Math.min(1, Math.abs(pattern.windPattern) * 0.8));
                }
                // Add overall desert color enhancement
                const desertBase = new THREE.Color(0xEDC9AF); // Desert sand
                color.lerp(desertBase, 0.3);
                break;
                
            case 'Mountains':
                // Mountain areas: snow at peaks, rocks on slopes
                if (pattern.snow > 0.4 && heightFactor > 0.6) {
                    const snowColor = new THREE.Color(zoneColors.snow || 0xFFFAFA);
                    color.lerp(snowColor, pattern.snow * 0.9);
                }
                if (pattern.slopes > 0.3) {
                    const rockColor = new THREE.Color(zoneColors.rock || 0xA9A9A9);
                    color.lerp(rockColor, pattern.slopes * 0.5);
                }
                break;
                
            case 'Swamp':
                // Swamp areas: water patches and muddy vegetation
                if (pattern.water > 0.3) {
                    const waterColor = new THREE.Color(zoneColors.water || 0x4682B4);
                    color.lerp(waterColor, pattern.water * 0.7);
                }
                if (pattern.muddy > 0.2) {
                    const mudColor = new THREE.Color(zoneColors.ground || 0x8F9779);
                    mudColor.multiplyScalar(0.6); // Make it darker for mud
                    color.lerp(mudColor, pattern.muddy * 0.6);
                }
                break;
                
            case 'Volcanic Wastes':
                // Volcanic areas: lava flows and ash
                if (pattern.lava > 0.4) {
                    const lavaColor = new THREE.Color(0xFF4500); // Orange-red lava
                    color.lerp(lavaColor, pattern.lava * 0.8);
                }
                if (pattern.ash > 0.3) {
                    const ashColor = new THREE.Color(0x696969); // Dark gray ash
                    color.lerp(ashColor, pattern.ash * 0.5);
                }
                break;
                
            case 'Crystal Caverns':
                // Crystal areas: glowing crystal formations
                if (pattern.crystals > 0.4) {
                    const crystalColor = new THREE.Color(zoneColors.crystal || 0xE0FFFF);
                    color.lerp(crystalColor, pattern.crystals * 0.7);
                }
                if (pattern.glow > 0.5) {
                    const glowColor = new THREE.Color(zoneColors.glow || 0x9400D3);
                    color.lerp(glowColor, pattern.glow * 0.4);
                }
                break;
                
            case 'Enchanted Grove':
                // Enchanted areas: magical patterns and glowing elements
                if (pattern.magic > 0.4) {
                    const magicColor = new THREE.Color(zoneColors.glow || 0x7FFFD4);
                    color.lerp(magicColor, pattern.magic * 0.6);
                }
                if (pattern.circles > 0.3) {
                    const circleColor = new THREE.Color(zoneColors.accent || 0x00FFFF);
                    color.lerp(circleColor, pattern.circles * 0.4);
                }
                break;
                
            default:
                // Default Terrant pattern
                if (pattern.variation > 0.3) {
                    const variationColor = new THREE.Color(zoneColors.accent || 0xDAA520);
                    color.lerp(variationColor, pattern.variation * 0.3);
                }
                break;
        }
    }
    
    /**
     * Get noise value for texture/pattern generation
     */
    getTextureNoise(x, z, scale = 1, octaves = 3) {
        let noise = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            noise += this.improvedNoise(x * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return noise / maxValue; // Normalize to -1 to 1
    }
    
    /**
     * Create biome-specific terrain patterns
     */
    createBiomePattern(x, z, zoneType) {
        const patterns = {
            'Forest': this.createForestPattern(x, z),
            'Desert': this.createDesertPattern(x, z),
            'Mountains': this.createMountainPattern(x, z),
            'Swamp': this.createSwampPattern(x, z),
            'Volcanic Wastes': this.createVolcanicPattern(x, z),
            'Crystal Caverns': this.createCrystalPattern(x, z),
            'Enchanted Grove': this.createEnchantedPattern(x, z),
            'Terrant': this.createDefaultPattern(x, z)
        };
        
        return patterns[zoneType] || patterns['Terrant'];
    }
    
    /**
     * Forest pattern - clustered vegetation areas
     */
    createForestPattern(x, z) {
        const density = this.getTextureNoise(x * 0.03, z * 0.03, 1, 4);
        const clearings = this.getTextureNoise(x * 0.015, z * 0.015, 1, 2);
        
        return {
            vegetation: Math.max(0, density * 0.8 + clearings * 0.2),
            clearings: Math.max(0, -clearings * 0.6),
            density: density
        };
    }
    
    /**
     * Desert pattern - dunes and rocky outcrops
     */
    createDesertPattern(x, z) {
        const dunes = this.getTextureNoise(x * 0.02, z * 0.02, 1, 3);
        const rocks = this.getTextureNoise(x * 0.08, z * 0.08, 1, 2);
        
        return {
            sand: Math.max(0, dunes * 0.7),
            rocks: Math.max(0, rocks * 0.5),
            windPattern: this.getTextureNoise(x * 0.1, z * 0.05, 1, 1)
        };
    }
    
    /**
     * Mountain pattern - rocky terrain with snow peaks
     */
    createMountainPattern(x, z) {
        const altitude = this.getTextureNoise(x * 0.01, z * 0.01, 1, 4);
        const rocky = this.getTextureNoise(x * 0.05, z * 0.05, 1, 3);
        
        return {
            snow: Math.max(0, altitude * 0.8),
            rocks: Math.max(0, rocky * 0.6),
            slopes: Math.abs(this.getTextureNoise(x * 0.02, z * 0.02, 1, 2))
        };
    }
    
    /**
     * Swamp pattern - water patches and vegetation
     */
    createSwampPattern(x, z) {
        const water = this.getTextureNoise(x * 0.025, z * 0.025, 1, 3);
        const vegetation = this.getTextureNoise(x * 0.04, z * 0.04, 1, 2);
        
        return {
            water: Math.max(0, water * 0.6),
            vegetation: Math.max(0, vegetation * 0.7),
            muddy: Math.max(0, -water * 0.4)
        };
    }
    
    /**
     * Volcanic pattern - lava flows and ash
     */
    createVolcanicPattern(x, z) {
        const lava = this.getTextureNoise(x * 0.03, z * 0.03, 1, 2);
        const ash = this.getTextureNoise(x * 0.06, z * 0.06, 1, 3);
        
        return {
            lava: Math.max(0, lava * 0.8),
            ash: Math.max(0, ash * 0.5),
            heat: Math.abs(this.getTextureNoise(x * 0.02, z * 0.02, 1, 1))
        };
    }
    
    /**
     * Crystal pattern - crystal formations
     */
    createCrystalPattern(x, z) {
        const crystals = this.getTextureNoise(x * 0.04, z * 0.04, 1, 3);
        const veins = this.getTextureNoise(x * 0.08, z * 0.08, 1, 2);
        
        return {
            crystals: Math.max(0, crystals * 0.9),
            veins: Math.abs(veins * 0.6),
            glow: Math.max(0, crystals * 0.5)
        };
    }
    
    /**
     * Enchanted pattern - magical variations
     */
    createEnchantedPattern(x, z) {
        const magic = this.getTextureNoise(x * 0.02, z * 0.02, 1, 4);
        const circles = Math.sin(x * 0.01) * Math.cos(z * 0.01);
        
        return {
            magic: Math.abs(magic * 0.7),
            circles: Math.abs(circles * 0.4),
            glow: Math.max(0, magic * 0.8)
        };
    }
    
    /**
     * Default pattern for Terrant and other zones
     */
    createDefaultPattern(x, z) {
        const base = this.getTextureNoise(x * 0.03, z * 0.03, 1, 3);
        const details = this.getTextureNoise(x * 0.1, z * 0.1, 1, 2);
        
        return {
            base: base * 0.5,
            details: details * 0.3,
            variation: Math.abs(base * 0.4)
        };
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
     * Wait for initial terrain generation with improved feedback
     */
    waitForInitialGeneration() {
        return new Promise((resolve) => {
            let lastQueueSize = -1;
            let stableCount = 0;
            const maxStableChecks = 3; // Require 3 stable checks before resolving
            
            const check = () => {
                const currentQueueSize = this.queue.length;
                const isProcessing = this.isProcessing;
                
                // Check if generation is complete
                if (currentQueueSize === 0 && !isProcessing) {
                    stableCount++;
                    
                    if (stableCount >= maxStableChecks) {
                        console.log('✅ Initial terrain generation complete');
                        const stats = this.getGenerationStats();
                        console.log(`📊 Final terrain stats: ${stats.generatedChunks} chunks generated`);
                        resolve();
                        return;
                    }
                } else {
                    stableCount = 0; // Reset stable count if still processing
                }
                
                // Log progress only when queue size changes significantly
                if (Math.abs(currentQueueSize - lastQueueSize) >= 2 || lastQueueSize === -1) {
                    console.debug(`⏳ Terrain generation progress: ${currentQueueSize} chunks queued, processing: ${isProcessing}`);
                    lastQueueSize = currentQueueSize;
                }
                
                // Continue checking with appropriate interval
                const interval = isProcessing ? 50 : 100; // Check more frequently when processing
                setTimeout(check, interval);
            };
            
            check();
        });
    }
    
    /**
     * Get terrain generation statistics for progress tracking
     * @returns {Object} Stats object with generation progress
     */
    getGenerationStats() {
        // Calculate initial chunks that should be generated
        const viewDistance = this.config.viewDistance;
        const initialChunks = (viewDistance * 2 + 1) * (viewDistance * 2 + 1);
        
        return {
            totalChunks: initialChunks,
            generatedChunks: this.chunks.size + this.buffer.size,
            queuedChunks: this.queue.length,
            isProcessing: this.isProcessing,
            activeChunks: this.chunks.size,
            bufferedChunks: this.buffer.size
        };
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
        // Remove base terrain if it exists (legacy cleanup)
        if (this.baseTerrain) {
            this.scene.remove(this.baseTerrain);
            this.baseTerrain.geometry.dispose();
            this.baseTerrain = null;
        }
        
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