/**
 * Manages terrain cleanup and memory management
 */
export class TerrainCleanupManager {
    constructor(scene, worldManager, terrainConfig) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.terrainConfig = terrainConfig;
    }

    /**
     * Clean up buffer chunks that are too far from player
     * @param {number} centerX - Center X chunk coordinate
     * @param {number} centerZ - Center Z chunk coordinate
     * @param {number} viewDistance - Current view distance
     * @param {Object} terrainBuffer - Terrain buffer to clean
     */
    cleanupBufferChunks(centerX, centerZ, viewDistance, terrainBuffer) {
        // Use a more aggressive buffer distance calculation
        const bufferDistance = Math.min(this.terrainConfig.bufferDistance, viewDistance + 2);
        const chunksToRemove = [];
        
        for (const chunkKey in terrainBuffer) {
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
                const chunk = terrainBuffer[chunkKey];
                
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
                delete terrainBuffer[chunkKey];
            });
            
            // Hint for garbage collection after significant cleanup
            if (chunksToRemove.length > 3 && this.worldManager && this.worldManager.performanceManager) {
                this.worldManager.performanceManager.hintGarbageCollection();
            }
        }
    }

    /**
     * Remove a terrain chunk and associated objects
     * @param {string} chunkKey - The chunk key
     * @param {Object} terrainChunks - Active terrain chunks
     * @param {boolean} cleanupAssociatedObjects - Whether to clean up associated objects (structures, environment)
     */
    removeTerrainChunk(chunkKey, terrainChunks, cleanupAssociatedObjects = true) {
        const terrain = terrainChunks[chunkKey];
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
            delete terrainChunks[chunkKey];
            
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
            }
        }
    }

    /**
     * Clear distant terrain chunks to free memory
     * @param {number} playerChunkX - Player's chunk X coordinate (optional)
     * @param {number} playerChunkZ - Player's chunk Z coordinate (optional)
     * @param {number} maxDistance - Maximum distance from player to keep chunks (defaults to 2x view distance)
     * @param {Object} terrainChunks - Active terrain chunks
     * @param {Object} terrainBuffer - Terrain buffer
     * @param {Array} terrainGenerationQueue - Generation queue
     */
    clearDistantChunks(playerChunkX, playerChunkZ, maxDistance, terrainChunks, terrainBuffer, terrainGenerationQueue) {
        // Default to 2x the view distance if not specified
        const clearDistance = maxDistance || (this.terrainConfig.chunkViewDistance * 2);
        
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
            centerX = Math.floor(playerPos.x / this.terrainConfig.chunkSize);
            centerZ = Math.floor(playerPos.z / this.terrainConfig.chunkSize);
        }
        
        // Count chunks before cleanup
        const chunkCountBefore = Object.keys(terrainChunks).length;
        const bufferCountBefore = Object.keys(terrainBuffer).length;
        
        // Clear distant chunks from active chunks
        const chunksToRemove = [];
        for (const chunkKey in terrainChunks) {
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
            this.removeTerrainChunk(chunkKey, terrainChunks, true); // Force cleanup of associated objects
        });
        
        // Clear distant chunks from buffer - be much more aggressive with buffer cleanup
        // Buffer should only keep chunks that are just outside the view distance
        // Reduced from clearDistance-1 to terrainChunkViewDistance+1 to prevent buffer buildup
        const bufferClearDistance = this.terrainConfig.chunkViewDistance + 1;
        const bufferToRemove = [];
        for (const chunkKey in terrainBuffer) {
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
            const chunk = terrainBuffer[chunkKey];
            
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
            delete terrainBuffer[chunkKey];
        });
        
        // Clear any distant chunks from generation queue
        terrainGenerationQueue.length = 0; // Clear the array
        terrainGenerationQueue.push(...terrainGenerationQueue.filter(item => {
            const distX = Math.abs(item.chunkX - centerX);
            const distZ = Math.abs(item.chunkZ - centerZ);
            return distX <= clearDistance && distZ <= clearDistance;
        }));
        
        // Count chunks after cleanup
        const chunkCountAfter = Object.keys(terrainChunks).length;
        const bufferCountAfter = Object.keys(terrainBuffer).length;
        
        // Force a garbage collection hint after significant cleanup
        if ((chunkCountBefore - chunkCountAfter) + (bufferCountBefore - bufferCountAfter) > 5) {
            if (this.worldManager && this.worldManager.performanceManager) {
                this.worldManager.performanceManager.hintGarbageCollection();
            }
        }
        
        console.debug(`Cleared distant chunks: ${chunkCountBefore - chunkCountAfter} active, ${bufferCountBefore - bufferCountAfter} buffered`);
    }

    /**
     * Clear all terrain objects
     * @param {Object} terrainChunks - Active terrain chunks
     * @param {Object} terrainBuffer - Terrain buffer
     * @param {THREE.Mesh} terrain - Base terrain
     */
    clearAll(terrainChunks, terrainBuffer, terrain) {
        // Clear terrain chunks
        for (const chunkKey in terrainChunks) {
            this.removeTerrainChunk(chunkKey, terrainChunks);
        }
        
        // Clear buffered terrain chunks
        for (const chunkKey in terrainBuffer) {
            const chunk = terrainBuffer[chunkKey];
            if (chunk) {
                if (chunk.parent) {
                    this.scene.remove(chunk);
                }
                if (chunk.geometry) {
                    chunk.geometry.dispose();
                }
                if (chunk.material) {
                    chunk.material.dispose();
                }
            }
        }
        
        // Remove initial terrain if it exists
        if (terrain && terrain.parent) {
            this.scene.remove(terrain);
            terrain.geometry.dispose();
            terrain.material.dispose();
        }
    }
}