import * as THREE from 'three';
import { PathFactory } from './PathFactory.js';
import { PATH_PATTERNS, PATH_TYPES, PATH_MATERIALS } from '../../config/paths.js';

/**
 * Manages path creation and rendering in the world
 * Centralizes path management and provides dynamic path generation
 */
export class PathManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Initialize the path factory
        this.pathFactory = new PathFactory(scene, worldManager);
        
        // Path collections
        this.paths = {};
        this.visiblePaths = {};
        this.pathsArray = [];
        
        // For minimap functionality
        this.roadPaths = [];
        this.trailPaths = [];
        this.bridgePaths = [];
        this.stairsPaths = [];
        
        // Chunk tracking
        this.pathChunks = {};
        
        // Global path network for continuous paths
        this.globalPaths = new Map(); // Key: pathId, Value: path data
        this.pathNetwork = new Map(); // Key: chunkKey, Value: Set of pathIds
        this.pathIdCounter = 0;
        
        // Path generation settings - DISABLED
        this.pathDensity = 0.0; // Completely disabled path generation
        this.pathConnectivity = 0.0;
        this.pathVariation = 0.0;
        this.minPathLength = 0;
        this.maxPathLength = 0;
        this.pathGenerationEnabled = false; // Flag to disable all path generation
        
        // Path view distance (in chunks)
        this.pathViewDistance = 3;
    }
    
    /**
     * Initialize the path manager
     */
    init() {
        // Clear any existing paths since path generation is disabled
        this.clear();
        
        // Force remove any lingering path objects from the scene
        this.forceRemoveAllPathObjects();
        
        console.debug('Path manager initialized - path generation is DISABLED');
    }
    
    /**
     * Update paths based on player position
     * @param {THREE.Vector3} playerPosition - The player's current position
     * @param {number} drawDistanceMultiplier - Multiplier for draw distance
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        // Calculate which terrain chunk the player is in
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const playerChunkX = Math.floor(playerPosition.x / terrainChunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / terrainChunkSize);
        
        // Adjust view distance based on performance settings
        const effectiveViewDistance = Math.max(
            1, 
            Math.floor(this.pathViewDistance * drawDistanceMultiplier)
        );
        
        // Track which chunks should be visible
        const newVisibleChunks = {};
        
        // Generate or load paths for chunks around the player
        for (let x = playerChunkX - effectiveViewDistance; x <= playerChunkX + effectiveViewDistance; x++) {
            for (let z = playerChunkZ - effectiveViewDistance; z <= playerChunkZ + effectiveViewDistance; z++) {
                const chunkKey = `${x},${z}`;
                newVisibleChunks[chunkKey] = true;
                
                // Path generation is disabled - just mark chunk as processed
                if (!this.pathChunks[chunkKey]) {
                    this.pathChunks[chunkKey] = [];
                    this.pathNetwork.set(chunkKey, new Set());
                }
            }
        }
        
        // Remove paths that are now too far from the player
        for (const chunkKey in this.visiblePaths) {
            if (!newVisibleChunks[chunkKey]) {
                this.hidePathsInChunk(chunkKey);
            }
        }
        
        // Show paths that are now visible
        for (const chunkKey in newVisibleChunks) {
            if (!this.visiblePaths[chunkKey] && this.pathChunks[chunkKey]) {
                this.showPathsInChunk(chunkKey);
            }
        }
        
        // Update the list of visible chunks
        this.visiblePaths = newVisibleChunks;
    }
    
    /**
     * Generate long continuous paths for a specific chunk region
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     */
    generateLongPathsForChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // PATH GENERATION DISABLED - Just initialize empty chunk
        if (!this.pathChunks[chunkKey]) {
            this.pathChunks[chunkKey] = [];
            this.pathNetwork.set(chunkKey, new Set());
        }
        
        console.debug(`Path generation disabled - chunk ${chunkKey} initialized with no paths`);
        return;
    }
    
    /**
     * Generate a single long path that spans multiple chunks
     * @param {number} startChunkX - Starting chunk X coordinate
     * @param {number} startChunkZ - Starting chunk Z coordinate
     * @param {string} zoneType - The zone type for path styling
     */
    generateSingleLongPath(startChunkX, startChunkZ, zoneType) {
        // PATH GENERATION DISABLED
        console.debug('Path generation is disabled - generateSingleLongPath called but not executed');
        return;
        
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const pathId = `path_${this.pathIdCounter++}`;
        
        // Determine path characteristics based on zone type
        let pathPattern, pathType, pathMaterial, pathWidth;
        
        switch (zoneType) {
            case 'Forest':
                pathPattern = Math.random() > 0.7 ? PATH_PATTERNS.NATURAL : PATH_PATTERNS.CURVED;
                pathType = PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.DIRT;
                pathWidth = 2 + Math.random() * 1.5;
                break;
                
            case 'Desert':
                pathPattern = Math.random() > 0.6 ? PATH_PATTERNS.STRAIGHT : PATH_PATTERNS.CURVED;
                pathType = PATH_TYPES.ROAD;
                pathMaterial = PATH_MATERIALS.SAND;
                pathWidth = 3 + Math.random() * 2;
                break;
                
            case 'Mountain':
                pathPattern = Math.random() > 0.5 ? PATH_PATTERNS.CURVED : PATH_PATTERNS.SPIRAL;
                pathType = Math.random() > 0.7 ? PATH_TYPES.STAIRS : PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.STONE;
                pathWidth = 4 + Math.random() * 3;
                break;
                
            case 'Village':
                pathPattern = PATH_PATTERNS.STRAIGHT;
                pathType = PATH_TYPES.ROAD;
                pathMaterial = PATH_MATERIALS.STONE;
                pathWidth = 2.5 + Math.random() * 1.5;
                break;
                
            case 'Swamp':
                pathPattern = PATH_PATTERNS.CURVED;
                pathType = Math.random() > 0.6 ? PATH_TYPES.BRIDGE : PATH_TYPES.TRAIL;
                pathMaterial = Math.random() > 0.5 ? PATH_MATERIALS.WOOD : PATH_MATERIALS.DIRT;
                pathWidth = 1.5 + Math.random() * 1;
                break;
                
            default:
                pathPattern = PATH_PATTERNS.NATURAL;
                pathType = PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.DIRT;
                pathWidth = 2 + Math.random() * 1;
        }
        
        // Generate path points across multiple chunks
        const pathLength = this.minPathLength + Math.random() * (this.maxPathLength - this.minPathLength);
        const points = this.generateLongPathPoints(startChunkX, startChunkZ, pathLength, pathPattern);
        
        // Apply terrain heights to all points
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const terrainHeight = this.getTerrainHeightAt(point.x, point.z);
            
            // Adjust height based on path type
            switch (pathType) {
                case PATH_TYPES.STAIRS:
                    const stairProgress = i / (points.length - 1);
                    const heightDifference = 5;
                    point.y = terrainHeight + (stairProgress * heightDifference) + 0.1;
                    break;
                    
                case PATH_TYPES.BRIDGE:
                    const bridgeHeight = 2 + Math.sin(i / points.length * Math.PI) * 1.5;
                    point.y = terrainHeight + bridgeHeight;
                    break;
                    
                case PATH_TYPES.ROAD:
                    point.y = terrainHeight + 0.2;
                    break;
                    
                case PATH_TYPES.TRAIL:
                default:
                    point.y = terrainHeight + 0.1;
                    break;
            }
        }
        
        // Create path options
        const pathOptions = {
            type: pathType,
            material: pathMaterial,
            height: pathWidth,
            heightOffset: 0,
            tessellation: pathType === PATH_TYPES.STAIRS ? 16 : 8,
            uvScale: pathType === PATH_TYPES.ROAD ? 2.0 : 1.0,
            randomness: this.pathVariation * 0.5,
            followTerrain: true,
            wallType: pathType
        };
        
        // Create the path using the factory
        const pathObject = this.pathFactory.createPath(pathPattern, points, pathWidth, pathOptions);
        
        if (pathObject) {
            // Store global path data
            const pathData = {
                id: pathId,
                pattern: pathPattern,
                type: pathType,
                material: pathMaterial,
                width: pathWidth,
                points: points.map(p => ({ x: p.x, y: p.y, z: p.z })),
                options: pathOptions,
                object: pathObject,
                chunks: new Set() // Will track which chunks this path spans
            };
            
            this.globalPaths.set(pathId, pathData);
            
            // Determine which chunks this path spans and register it
            this.registerPathInChunks(pathId, points);
            
            // Add to type-specific collections
            this.addToTypeCollection(pathType, pathData);
            
            console.debug(`Generated long path ${pathId} spanning ${pathData.chunks.size} chunks`);
        }
    }
    
    /**
     * Generate points for a long path that spans multiple chunks
     * @param {number} startChunkX - Starting chunk X
     * @param {number} startChunkZ - Starting chunk Z  
     * @param {number} pathLength - Total path length
     * @param {string} pathPattern - Path pattern type
     * @returns {Array} - Array of Vector3 points
     */
    generateLongPathPoints(startChunkX, startChunkZ, pathLength, pathPattern) {
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const points = [];
        
        // Starting position (random within the starting chunk)
        const startX = startChunkX * terrainChunkSize + Math.random() * terrainChunkSize;
        const startZ = startChunkZ * terrainChunkSize + Math.random() * terrainChunkSize;
        
        points.push(new THREE.Vector3(startX, 0, startZ));
        
        // Generate path direction
        let currentX = startX;
        let currentZ = startZ;
        let currentDirection = Math.random() * Math.PI * 2; // Random initial direction
        let remainingLength = pathLength;
        
        // Generate points along the path
        while (remainingLength > 0) {
            // Segment length (vary between 20-50 units)
            const segmentLength = Math.min(20 + Math.random() * 30, remainingLength);
            
            // Add some directional variation based on pattern
            let directionChange = 0;
            switch (pathPattern) {
                case PATH_PATTERNS.STRAIGHT:
                    directionChange = (Math.random() - 0.5) * 0.2; // Small variations
                    break;
                case PATH_PATTERNS.CURVED:
                    directionChange = (Math.random() - 0.5) * 0.5; // Moderate curves
                    break;
                case PATH_PATTERNS.NATURAL:
                    directionChange = (Math.random() - 0.5) * 0.8; // More organic curves
                    break;
                case PATH_PATTERNS.SPIRAL:
                    directionChange = 0.3; // Consistent spiral
                    break;
                default:
                    directionChange = (Math.random() - 0.5) * 0.3;
            }
            
            currentDirection += directionChange;
            
            // Calculate next point
            currentX += Math.cos(currentDirection) * segmentLength;
            currentZ += Math.sin(currentDirection) * segmentLength;
            
            points.push(new THREE.Vector3(currentX, 0, currentZ));
            
            remainingLength -= segmentLength;
        }
        
        return points;
    }
    
    /**
     * Register a path in all chunks it spans through
     * @param {string} pathId - Path ID
     * @param {Array} points - Path points
     */
    registerPathInChunks(pathId, points) {
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const pathData = this.globalPaths.get(pathId);
        
        if (!pathData) return;
        
        // Find all chunks that this path passes through
        const chunksSpanned = new Set();
        
        for (const point of points) {
            const chunkX = Math.floor(point.x / terrainChunkSize);
            const chunkZ = Math.floor(point.z / terrainChunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            chunksSpanned.add(chunkKey);
        }
        
        // Register path in each chunk
        for (const chunkKey of chunksSpanned) {
            // Initialize chunk data if not exists
            if (!this.pathChunks[chunkKey]) {
                this.pathChunks[chunkKey] = [];
            }
            if (!this.pathNetwork.has(chunkKey)) {
                this.pathNetwork.set(chunkKey, new Set());
            }
            
            // Add path to chunk
            this.pathNetwork.get(chunkKey).add(pathId);
            pathData.chunks.add(chunkKey);
        }
    }
    
    /**
     * Generate paths appropriate for a specific zone type
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {number} startX - Start X coordinate
     * @param {number} startZ - Start Z coordinate
     * @param {number} endX - End X coordinate
     * @param {number} endZ - End Z coordinate
     * @returns {Array} - Array of generated paths
     */
    generatePathsForZone(zoneType, startX, startZ, endX, endZ) {
        // PATH GENERATION DISABLED
        console.debug('Path generation is disabled - generatePathsForZone called but not executed');
        return [];
        
        const paths = [];
        const terrainChunkSize = this.worldManager.terrainManager.terrainChunkSize;
        
        // Determine path characteristics based on zone type
        let pathPattern, pathType, pathMaterial, pathWidth;
        
        switch (zoneType) {
            case 'Forest':
                pathPattern = Math.random() > 0.7 ? PATH_PATTERNS.NATURAL : PATH_PATTERNS.CURVED;
                pathType = PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.DIRT;
                pathWidth = 2 + Math.random() * 1.5; // Wall height: 2-3.5 units
                break;
                
            case 'Desert':
                pathPattern = Math.random() > 0.6 ? PATH_PATTERNS.STRAIGHT : PATH_PATTERNS.CURVED;
                pathType = PATH_TYPES.ROAD;
                pathMaterial = PATH_MATERIALS.SAND;
                pathWidth = 3 + Math.random() * 2; // Wall height: 3-5 units
                break;
                
            case 'Mountain':
                pathPattern = Math.random() > 0.5 ? PATH_PATTERNS.CURVED : PATH_PATTERNS.SPIRAL;
                pathType = Math.random() > 0.7 ? PATH_TYPES.STAIRS : PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.STONE;
                pathWidth = 4 + Math.random() * 3; // Wall height: 4-7 units (mountain walls)
                break;
                
            case 'Village':
                pathPattern = PATH_PATTERNS.STRAIGHT;
                pathType = PATH_TYPES.ROAD;
                pathMaterial = PATH_MATERIALS.STONE;
                pathWidth = 2.5 + Math.random() * 1.5; // Wall height: 2.5-4 units
                break;
                
            case 'Swamp':
                pathPattern = PATH_PATTERNS.CURVED;
                pathType = Math.random() > 0.6 ? PATH_TYPES.BRIDGE : PATH_TYPES.TRAIL;
                pathMaterial = Math.random() > 0.5 ? PATH_MATERIALS.WOOD : PATH_MATERIALS.DIRT;
                pathWidth = 1.5 + Math.random() * 1; // Wall height: 1.5-2.5 units (shorter walls in swamps)
                break;
                
            default:
                pathPattern = PATH_PATTERNS.NATURAL;
                pathType = PATH_TYPES.TRAIL;
                pathMaterial = PATH_MATERIALS.DIRT;
                pathWidth = 2 + Math.random() * 1; // Wall height: 2-3 units
        }
        
        // Generate path points
        const points = [];
        
        // For straight or curved paths, create a path across the chunk
        if (pathPattern === PATH_PATTERNS.STRAIGHT || pathPattern === PATH_PATTERNS.CURVED) {
            // Determine if path goes N-S or E-W
            const isNorthSouth = Math.random() > 0.5;
            
            if (isNorthSouth) {
                // North-South path
                const pathX = startX + Math.random() * terrainChunkSize;
                points.push(new THREE.Vector3(pathX, 0, startZ));
                
                // Add some midpoints for curved paths
                if (pathPattern === PATH_PATTERNS.CURVED) {
                    const midpoint1 = new THREE.Vector3(
                        pathX + (Math.random() * 10 - 5),
                        0,
                        startZ + terrainChunkSize * 0.33
                    );
                    const midpoint2 = new THREE.Vector3(
                        pathX + (Math.random() * 10 - 5),
                        0,
                        startZ + terrainChunkSize * 0.66
                    );
                    points.push(midpoint1, midpoint2);
                }
                
                points.push(new THREE.Vector3(pathX, 0, endZ));
            } else {
                // East-West path
                const pathZ = startZ + Math.random() * terrainChunkSize;
                points.push(new THREE.Vector3(startX, 0, pathZ));
                
                // Add some midpoints for curved paths
                if (pathPattern === PATH_PATTERNS.CURVED) {
                    const midpoint1 = new THREE.Vector3(
                        startX + terrainChunkSize * 0.33,
                        0,
                        pathZ + (Math.random() * 10 - 5)
                    );
                    const midpoint2 = new THREE.Vector3(
                        startX + terrainChunkSize * 0.66,
                        0,
                        pathZ + (Math.random() * 10 - 5)
                    );
                    points.push(midpoint1, midpoint2);
                }
                
                points.push(new THREE.Vector3(endX, 0, pathZ));
            }
        } 
        // For natural paths, create a more organic path
        else if (pathPattern === PATH_PATTERNS.NATURAL) {
            // Start at a random edge point
            const side = Math.floor(Math.random() * 4);
            let startPoint;
            
            switch (side) {
                case 0: // North edge
                    startPoint = new THREE.Vector3(
                        startX + Math.random() * terrainChunkSize,
                        0,
                        startZ
                    );
                    break;
                case 1: // East edge
                    startPoint = new THREE.Vector3(
                        endX,
                        0,
                        startZ + Math.random() * terrainChunkSize
                    );
                    break;
                case 2: // South edge
                    startPoint = new THREE.Vector3(
                        startX + Math.random() * terrainChunkSize,
                        0,
                        endZ
                    );
                    break;
                case 3: // West edge
                    startPoint = new THREE.Vector3(
                        startX,
                        0,
                        startZ + Math.random() * terrainChunkSize
                    );
                    break;
            }
            
            points.push(startPoint);
            
            // Add 2-4 midpoints
            const numMidpoints = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numMidpoints; i++) {
                const midpoint = new THREE.Vector3(
                    startX + Math.random() * terrainChunkSize,
                    0,
                    startZ + Math.random() * terrainChunkSize
                );
                points.push(midpoint);
            }
            
            // End at a different edge
            let endSide = (side + 2) % 4; // Opposite side by default
            if (Math.random() > 0.7) {
                // Sometimes use an adjacent side
                endSide = (side + 1 + Math.floor(Math.random() * 2)) % 4;
            }
            
            let endPoint;
            switch (endSide) {
                case 0: // North edge
                    endPoint = new THREE.Vector3(
                        startX + Math.random() * terrainChunkSize,
                        0,
                        startZ
                    );
                    break;
                case 1: // East edge
                    endPoint = new THREE.Vector3(
                        endX,
                        0,
                        startZ + Math.random() * terrainChunkSize
                    );
                    break;
                case 2: // South edge
                    endPoint = new THREE.Vector3(
                        startX + Math.random() * terrainChunkSize,
                        0,
                        endZ
                    );
                    break;
                case 3: // West edge
                    endPoint = new THREE.Vector3(
                        startX,
                        0,
                        startZ + Math.random() * terrainChunkSize
                    );
                    break;
            }
            
            points.push(endPoint);
        }
        // For circular paths, create a loop within the chunk
        else if (pathPattern === PATH_PATTERNS.CIRCULAR) {
            const centerX = startX + terrainChunkSize / 2;
            const centerZ = startZ + terrainChunkSize / 2;
            const radius = terrainChunkSize * 0.3;
            
            // Create a circle of points
            const numPoints = 8 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const z = centerZ + Math.sin(angle) * radius;
                points.push(new THREE.Vector3(x, 0, z));
            }
            
            // Close the loop
            points.push(points[0].clone());
        }
        // For spiral paths, create a spiral within the chunk
        else if (pathPattern === PATH_PATTERNS.SPIRAL) {
            const centerX = startX + terrainChunkSize / 2;
            const centerZ = startZ + terrainChunkSize / 2;
            const maxRadius = terrainChunkSize * 0.4;
            
            // Create a spiral of points
            const numPoints = 16 + Math.floor(Math.random() * 8);
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 6; // 3 full rotations
                const radius = (i / numPoints) * maxRadius;
                const x = centerX + Math.cos(angle) * radius;
                const z = centerZ + Math.sin(angle) * radius;
                points.push(new THREE.Vector3(x, 0, z));
            }
        }
        
        // Set Y coordinates based on terrain height and path type
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const terrainHeight = this.getTerrainHeightAt(point.x, point.z);
            
            // Adjust height based on path type
            switch (pathType) {
                case PATH_TYPES.STAIRS:
                    // For stairs, create a gradual height increase
                    const stairProgress = i / (points.length - 1);
                    const heightDifference = 5; // 5 units height difference
                    point.y = terrainHeight + (stairProgress * heightDifference) + 0.1;
                    break;
                    
                case PATH_TYPES.BRIDGE:
                    // For bridges, raise the path above terrain
                    const bridgeHeight = 2 + Math.sin(i / points.length * Math.PI) * 1.5; // Arc shape
                    point.y = terrainHeight + bridgeHeight;
                    break;
                    
                case PATH_TYPES.ROAD:
                    // Roads follow terrain closely but slightly above
                    point.y = terrainHeight + 0.2;
                    break;
                    
                case PATH_TYPES.TRAIL:
                default:
                    // Trails follow terrain naturally
                    point.y = terrainHeight + 0.1;
                    break;
            }
        }
        
        // Create path options with appropriate settings for vertical walls/fences
        const pathOptions = {
            type: pathType,
            material: pathMaterial,
            height: pathWidth, // pathWidth is now wall height
            heightOffset: 0, // No additional offset needed for vertical walls
            tessellation: pathType === PATH_TYPES.STAIRS ? 16 : 8, // Higher tessellation for stairs
            uvScale: pathType === PATH_TYPES.ROAD ? 2.0 : 1.0, // Different UV scaling for roads
            randomness: this.pathVariation * 0.5, // Add some randomness to path appearance
            followTerrain: true, // All vertical walls should follow terrain at base
            wallType: pathType // Specify the type of vertical wall
        };
        
        // Create the path using the factory
        const path = this.pathFactory.createPath(pathPattern, points, pathWidth, pathOptions);
        
        if (path) {
            // Store path data for persistence
            const pathData = {
                pattern: pathPattern,
                type: pathType,
                material: pathMaterial,
                width: pathWidth,
                points: points.map(p => ({ x: p.x, y: p.y, z: p.z })),
                options: pathOptions,
                object: path
            };
            
            paths.push(pathData);
            
            // Add to type-specific collections for minimap
            this.addToTypeCollection(pathType, pathData);
        }
        
        return paths;
    }
    
    /**
     * Add path to the appropriate type-specific collection
     * @param {string} type - Type of path
     * @param {Object} pathData - The path data to add
     */
    addToTypeCollection(type, pathData) {
        switch (type) {
            case PATH_TYPES.ROAD:
                this.roadPaths.push(pathData);
                break;
            case PATH_TYPES.TRAIL:
                this.trailPaths.push(pathData);
                break;
            case PATH_TYPES.BRIDGE:
                this.bridgePaths.push(pathData);
                break;
            case PATH_TYPES.STAIRS:
                this.stairsPaths.push(pathData);
                break;
        }
        
        // Add to the main paths array for easy access
        this.pathsArray.push(pathData);
    }
    
    /**
     * Show paths in a specific chunk
     * @param {string} chunkKey - The chunk key
     */
    showPathsInChunk(chunkKey) {
        // Skip if already visible
        if (this.visiblePaths[chunkKey]) {
            return;
        }
        
        // Get all path IDs for this chunk
        const pathIds = this.pathNetwork.get(chunkKey);
        if (pathIds) {
            // Add global paths to scene that pass through this chunk
            for (const pathId of pathIds) {
                const pathData = this.globalPaths.get(pathId);
                if (pathData && pathData.object && !pathData.object.parent) {
                    this.scene.add(pathData.object);
                    console.debug(`Showing path ${pathId} in chunk ${chunkKey}`);
                }
            }
        }
        
        // Mark as visible
        this.visiblePaths[chunkKey] = true;
    }
    
    /**
     * Hide paths in a specific chunk
     * @param {string} chunkKey - The chunk key
     */
    hidePathsInChunk(chunkKey) {
        // Skip if not visible
        if (!this.visiblePaths[chunkKey]) {
            return;
        }
        
        // Get all path IDs for this chunk
        const pathIds = this.pathNetwork.get(chunkKey);
        if (pathIds) {
            // Remove global paths from scene, but only if they're not visible in other chunks
            for (const pathId of pathIds) {
                const pathData = this.globalPaths.get(pathId);
                if (pathData && pathData.object && pathData.object.parent) {
                    // Check if this path is visible in any other currently visible chunk
                    let isVisibleElsewhere = false;
                    for (const otherChunkKey of pathData.chunks) {
                        if (otherChunkKey !== chunkKey && this.visiblePaths[otherChunkKey]) {
                            isVisibleElsewhere = true;
                            break;
                        }
                    }
                    
                    // Only remove if not visible elsewhere
                    if (!isVisibleElsewhere) {
                        this.scene.remove(pathData.object);
                        console.debug(`Hiding path ${pathId} from chunk ${chunkKey}`);
                    }
                }
            }
        }
        
        // Mark as not visible
        delete this.visiblePaths[chunkKey];
    }
    
    /**
     * Get the zone type at a specific position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {string} - The zone type (Forest, Desert, etc.)
     */
    getZoneTypeAt(x, z) {
        // Use the world manager to get the zone at this position
        if (this.worldManager && this.worldManager.getZoneAt) {
            const position = new THREE.Vector3(x, 0, z);
            const zone = this.worldManager.getZoneAt(position);
            if (zone) {
                return zone.type;
            }
        }
        
        // Default to Forest if no zone found
        return 'Forest';
    }
    
    /**
     * Get the terrain height at a specific position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - The terrain height at this position
     */
    getTerrainHeightAt(x, z) {
        // First try to get terrain height from world manager
        if (this.worldManager && this.worldManager.getTerrainHeight) {
            return this.worldManager.getTerrainHeight(x, z);
        }
        
        // If world manager method not available, try terrain manager directly
        if (this.worldManager && this.worldManager.terrainManager && this.worldManager.terrainManager.getHeightAt) {
            return this.worldManager.terrainManager.getHeightAt(x, z);
        }
        
        // If no terrain height available, use a simple height calculation
        // This creates a more natural looking terrain variation
        const height = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 5 + 
                      Math.sin(x * 0.005) * Math.cos(z * 0.005) * 10;
        
        return height;
    }
    
    /**
     * Get all paths for the minimap
     * @returns {Array} - Array of path data for the minimap
     */
    getPathsForMinimap() {
        // PATH GENERATION DISABLED - Return empty array
        console.debug('Path generation is disabled - returning empty paths for minimap');
        return [];
    }
    
    /**
     * Clear all paths
     */
    clear() {
        // Remove all global paths from the scene
        for (const [pathId, pathData] of this.globalPaths) {
            if (pathData.object && pathData.object.parent) {
                this.scene.remove(pathData.object);
                
                // Dispose of geometries and materials
                if (pathData.object.geometry) {
                    pathData.object.geometry.dispose();
                }
                
                if (pathData.object.material) {
                    if (Array.isArray(pathData.object.material)) {
                        pathData.object.material.forEach(material => {
                            if (material.map) material.map.dispose();
                            material.dispose();
                        });
                    } else {
                        if (pathData.object.material.map) {
                            pathData.object.material.map.dispose();
                        }
                        pathData.object.material.dispose();
                    }
                }
            }
        }
        
        // Reset collections
        this.paths = {};
        this.visiblePaths = {};
        this.pathChunks = {};
        this.pathsArray = [];
        
        // Reset global path collections
        this.globalPaths.clear();
        this.pathNetwork.clear();
        this.pathIdCounter = 0;
        
        // Reset type-specific collections
        this.roadPaths = [];
        this.trailPaths = [];
        this.bridgePaths = [];
        this.stairsPaths = [];
        
        console.debug("All paths cleared");
    }
    
    /**
     * Force remove all path objects from the scene by scanning all objects
     * This is a more aggressive cleanup method
     */
    forceRemoveAllPathObjects() {
        console.debug("Force removing all path objects from scene...");
        
        const objectsToRemove = [];
        
        // Scan all objects in the scene
        this.scene.traverse((object) => {
            // Check if object is likely a path based on userData or name
            if (object.userData && (
                object.userData.type === 'path' ||
                object.userData.isPath ||
                object.userData.pathId ||
                object.name?.toLowerCase().includes('path')
            )) {
                objectsToRemove.push(object);
            }
            
            // Also check for mesh objects that might be paths based on position
            // Paths are typically very close to the ground (y < 5)
            if (object.isMesh && object.position.y < 5) {
                // Check if it's a flat, elongated geometry (typical of paths)
                if (object.geometry && object.geometry.boundingBox) {
                    const bbox = object.geometry.boundingBox;
                    const width = bbox.max.x - bbox.min.x;
                    const height = bbox.max.y - bbox.min.y;
                    const depth = bbox.max.z - bbox.min.z;
                    
                    // If it's very flat (small height) and elongated, it might be a path
                    if (height < 2 && (width > 10 || depth > 10)) {
                        objectsToRemove.push(object);
                    }
                }
            }
        });
        
        // Remove all suspected path objects
        objectsToRemove.forEach(object => {
            console.debug(`Removing suspected path object: ${object.name || 'unnamed'}`);
            
            // Remove from parent (scene or group)
            if (object.parent) {
                object.parent.remove(object);
            }
            
            // Dispose of geometry and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (object.material.map) {
                        object.material.map.dispose();
                    }
                    object.material.dispose();
                }
            }
        });
        
        console.debug(`Force removed ${objectsToRemove.length} suspected path objects`);
        
        // Also expose this method to global scope for debugging
        if (typeof window !== 'undefined') {
            window.forceRemovePaths = () => this.forceRemoveAllPathObjects();
            window.debugSceneObjects = () => this.debugSceneObjects();
        }
    }
    
    /**
     * Debug method to list all objects in the scene
     */
    debugSceneObjects() {
        console.log("=== SCENE OBJECTS DEBUG ===");
        let totalObjects = 0;
        const objectsByType = {};
        
        this.scene.traverse((object) => {
            totalObjects++;
            const type = object.constructor.name;
            objectsByType[type] = (objectsByType[type] || 0) + 1;
            
            // Log suspicious objects that might be paths
            if (object.isMesh && object.position.y < 5) {
                console.log(`Low object: ${type} at y=${object.position.y.toFixed(2)}, name="${object.name || 'unnamed'}", userData:`, object.userData);
            }
        });
        
        console.log(`Total objects in scene: ${totalObjects}`);
        console.log("Objects by type:", objectsByType);
        console.log("=== END DEBUG ===");
    }
    
    /**
     * Save path state
     * @returns {object} - The saved path state
     */
    save() {
        // Convert paths to a serializable format
        const serializedPaths = {};
        
        for (const chunkKey in this.pathChunks) {
            serializedPaths[chunkKey] = this.pathChunks[chunkKey].map(pathData => {
                return {
                    pattern: pathData.pattern,
                    type: pathData.type,
                    material: pathData.material,
                    width: pathData.width,
                    points: pathData.points,
                    options: pathData.options
                };
            });
        }
        
        return {
            paths: serializedPaths,
            pathDensity: this.pathDensity,
            pathConnectivity: this.pathConnectivity,
            pathVariation: this.pathVariation
        };
    }
    
    /**
     * Load path state
     * @param {object} pathState - The path state to load
     */
    load(pathState) {
        if (!pathState) return;
        
        // Clear existing paths
        this.clear();
        
        // Load settings
        this.pathDensity = pathState.pathDensity || this.pathDensity;
        this.pathConnectivity = pathState.pathConnectivity || this.pathConnectivity;
        this.pathVariation = pathState.pathVariation || this.pathVariation;
        
        // Load paths
        if (pathState.paths) {
            for (const chunkKey in pathState.paths) {
                const paths = [];
                
                for (const serializedPath of pathState.paths[chunkKey]) {
                    // Convert points back to Vector3
                    const points = serializedPath.points.map(p => 
                        new THREE.Vector3(p.x, p.y, p.z)
                    );
                    
                    // Create the path using the factory
                    const path = this.pathFactory.createPath(
                        serializedPath.pattern,
                        points,
                        serializedPath.width,
                        serializedPath.options
                    );
                    
                    if (path) {
                        // Store path data
                        const pathData = {
                            pattern: serializedPath.pattern,
                            type: serializedPath.type,
                            material: serializedPath.material,
                            width: serializedPath.width,
                            points: serializedPath.points,
                            options: serializedPath.options,
                            object: path
                        };
                        
                        paths.push(pathData);
                        
                        // Add to type-specific collections
                        this.addToTypeCollection(serializedPath.type, pathData);
                    }
                }
                
                // Store paths for this chunk
                this.pathChunks[chunkKey] = paths;
            }
        }
        
        console.debug("Path state loaded");
    }
}