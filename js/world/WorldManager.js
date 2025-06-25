import * as THREE from 'three';
import { TerrainManager } from './terrain/TerrainManager.js';
import { StructureManager } from './structures/StructureManager.js';
import { EnvironmentManager } from './environment/EnvironmentManager.js';
import { InteractiveObjectManager } from './interactive/InteractiveObjectManager.js';
import { ZoneManager } from './zones/ZoneManager.js';
import { LightingManager } from './lighting/LightingManager.js';
import { FogManager } from './environment/FogManager.js';
import { SkyManager } from './environment/SkyManager.js';
import { TeleportManager } from './teleport/TeleportManager.js';
import { STRUCTURE_OBJECTS } from '../config/structure.js';
import { ENVIRONMENT_OBJECTS } from '../config/environment.js';

/**
 * Optimized World Manager
 * Simplified world management with better performance and cleaner architecture
 * Focuses on core responsibilities: coordination, performance monitoring, and object management
 */
export class WorldManager {
    constructor(scene, loadingManager, game) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.game = game;
        
        // Core managers - only essential ones
        this.terrainManager = new TerrainManager(scene, this, game);
        this.lightingManager = new LightingManager(scene);
        this.skyManager = new SkyManager(scene);
        this.fogManager = new FogManager(scene, this, game);
        this.structureManager = new StructureManager(scene, this, game);
        this.environmentManager = new EnvironmentManager(scene, this, game);
        this.interactiveManager = new InteractiveObjectManager(scene, this, game);
        this.zoneManager = new ZoneManager(scene, this, game);
        this.teleportManager = new TeleportManager(scene, this, game);
        
        // Performance monitoring
        this.performance = {
            frameRate: 60,
            lastUpdate: Date.now(),
            updateInterval: 1000, // Check every second
            lowPerformanceThreshold: 45, // FPS threshold
            isLowPerformance: false,
            adjustmentCooldown: 5000, // 5 seconds between adjustments
            lastAdjustment: 0
        };
        
        // Object generation settings - simplified with higher probabilities for testing
        this.generation = {
            enabled: true,
            updateDistance: 50, // How far player must move before updating
            lastPosition: new THREE.Vector3(),
            structureProbability: 0.8, // Increased for testing
            environmentProbability: 0.9, // Increased for testing  
            interactiveProbability: 0.5, // Increased for testing
            generatedObjects: new Set() // Track to prevent duplicates
        };
        
        // Enemy management reference
        this.enemyManager = null;
        
        // Simple caching for commonly accessed data
        this.cache = {
            playerChunk: { x: 0, z: 0 },
            nearbyObjects: [],
            lastCacheUpdate: 0,
            cacheInterval: 500 // Update cache every 500ms
        };
    }
    
    /**
     * Set enemy manager reference
     */
    setEnemyManager(enemyManager) {
        this.enemyManager = enemyManager;
        console.debug("Enemy manager set in WorldManager");
    }
    
    /**
     * Get the zone at a specific position
     */
    getZoneAt(position) {
        return this.zoneManager.getZoneAt(position);
    }
    
    /**
     * Get the current zone type at a specific position
     */
    getCurrentZoneType(position) {
        const zone = this.getZoneAt(position);
        return zone ? zone.name : 'Terrant';
    }
    
    /**
     * Initialize the world
     */
    async init() {
        console.log('🌍 Initializing Optimized World Manager...');
        
        try {
            // Initialize core systems in order
            this.lightingManager.init();
            
            if (this.skyManager.init) {
                this.skyManager.init();
            }
            
            this.fogManager.initFog();
            
            // Initialize terrain (this takes the most time)
            await this.terrainManager.init();
            
            // Initialize other managers
            this.structureManager.init();
            this.zoneManager.init();
            this.interactiveManager.init();
            this.teleportManager.init();
            
            // Generate initial world content
            await this.generateInitialContent();
            
            console.log('✅ World Manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ World Manager initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Generate initial content around spawn point
     */
    async generateInitialContent() {
        console.log('🎯 Generating initial world content...');
        
        const spawnRadius = 100;
        const objectCount = {
            structures: 0,
            environment: 0,
            interactive: 0
        };
        
        // Generate objects in a reasonable area around spawn
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            for (let radius = 20; radius <= spawnRadius; radius += 20) {
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const position = new THREE.Vector3(x, 0, z);
                
                // Check zone for appropriate content
                const zone = this.getZoneAt(position);
                const zoneType = zone ? zone.name : 'Terrant';
                
                console.debug(`🎲 Generating at (${x.toFixed(1)}, ${z.toFixed(1)}) in zone: ${zoneType}`);
                
                // Generate based on probabilities
                const structureRoll = Math.random();
                const environmentRoll = Math.random();
                const interactiveRoll = Math.random();
                
                console.debug(`🎲 Rolls - Structure: ${structureRoll.toFixed(3)} (threshold: ${this.generation.structureProbability}), Environment: ${environmentRoll.toFixed(3)} (threshold: ${this.generation.environmentProbability}), Interactive: ${interactiveRoll.toFixed(3)} (threshold: ${this.generation.interactiveProbability})`);
                
                if (structureRoll < this.generation.structureProbability) {
                    console.debug('🏗️ Creating structure...');
                    await this.createStructureAt(position, zoneType);
                    objectCount.structures++;
                }
                
                if (environmentRoll < this.generation.environmentProbability) {
                    console.debug('🌳 Creating environment object...');
                    await this.createEnvironmentObjectAt(position, zoneType);
                    objectCount.environment++;
                }
                
                if (interactiveRoll < this.generation.interactiveProbability) {
                    console.debug('⚡ Creating interactive object...');
                    await this.createInteractiveObjectAt(position, zoneType);
                    objectCount.interactive++;
                }
            }
        }
        
        console.log(`📊 Generated initial content:`, objectCount);
        
        // Add a test structure at origin for easy visibility
        console.log('🧪 Creating test structure at origin...');
        const testPosition = new THREE.Vector3(0, 0, 0);
        await this.createStructureAt(testPosition, 'Terrant');
        
        // Add a test environment object nearby
        console.log('🧪 Creating test environment object...');
        const testEnvPosition = new THREE.Vector3(10, 0, 0);
        await this.createEnvironmentObjectAt(testEnvPosition, 'Forest');
        
        console.log('🧪 Test objects creation complete');
        
        // Force create some objects for testing - bypass probability
        console.log('🧪 Force creating test objects...');
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            console.log(`🧪 Force creating structure ${i + 1} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
            await this.createStructureAt(new THREE.Vector3(x, 0, z), 'Terrant');
            
            console.log(`🧪 Force creating environment object ${i + 1} at (${(x + 5).toFixed(1)}, ${z.toFixed(1)})`);
            await this.createEnvironmentObjectAt(new THREE.Vector3(x + 5, 0, z), 'Forest');
        }
        console.log('🧪 Force creation complete');
    }
    
    /**
     * Main update method called by game loop
     */
    update(playerPosition, deltaTime) {
        // Update performance monitoring
        this.updatePerformanceMonitoring(deltaTime);
        
        // Update terrain based on player position
        this.terrainManager.updateTerrain(playerPosition);
        
        // Check if player moved enough to trigger world updates
        const distanceMoved = playerPosition.distanceTo(this.generation.lastPosition);
        if (distanceMoved > this.generation.updateDistance) {
            this.updateWorldContent(playerPosition);
            this.generation.lastPosition.copy(playerPosition);
        }
        
        // Update cache periodically
        const now = Date.now();
        if (now - this.cache.lastCacheUpdate > this.cache.cacheInterval) {
            this.updateCache(playerPosition);
            this.cache.lastCacheUpdate = now;
        }
        
        // Update fog based on performance
        if (this.fogManager.update) {
            this.fogManager.update(deltaTime, playerPosition);
        }
    }
    
    /**
     * Update performance monitoring and adjust settings
     */
    updatePerformanceMonitoring(deltaTime) {
        // Calculate current FPS
        this.performance.frameRate = 1 / deltaTime;
        
        const now = Date.now();
        if (now - this.performance.lastUpdate > this.performance.updateInterval) {
            // Check for low performance
            const wasLowPerformance = this.performance.isLowPerformance;
            this.performance.isLowPerformance = this.performance.frameRate < this.performance.lowPerformanceThreshold;
            
            // Adjust settings if performance changed and cooldown passed
            if (wasLowPerformance !== this.performance.isLowPerformance && 
                now - this.performance.lastAdjustment > this.performance.adjustmentCooldown) {
                
                this.adjustPerformanceSettings();
                this.performance.lastAdjustment = now;
            }
            
            this.performance.lastUpdate = now;
        }
    }
    
    /**
     * Adjust settings based on performance
     */
    adjustPerformanceSettings() {
        if (this.performance.isLowPerformance) {
            console.log('📉 Low performance detected, reducing settings...');
            
            // Reduce generation probabilities
            this.generation.structureProbability *= 0.7;
            this.generation.environmentProbability *= 0.8;
            this.generation.interactiveProbability *= 0.6;
            
            // Increase update distance (less frequent updates)
            this.generation.updateDistance *= 1.2;
            
        } else {
            console.log('📈 Performance improved, increasing settings...');
            
            // Increase generation probabilities (but not above original values)
            this.generation.structureProbability = Math.min(0.3, this.generation.structureProbability * 1.1);
            this.generation.environmentProbability = Math.min(0.7, this.generation.environmentProbability * 1.1);
            this.generation.interactiveProbability = Math.min(0.2, this.generation.interactiveProbability * 1.1);
            
            // Decrease update distance (more frequent updates)
            this.generation.updateDistance = Math.max(30, this.generation.updateDistance * 0.9);
        }
    }
    
    /**
     * Update world content around player
     */
    updateWorldContent(playerPosition) {
        if (!this.generation.enabled) return;
        
        // Validate player position
        if (!playerPosition || !isFinite(playerPosition.x) || !isFinite(playerPosition.z)) {
            console.warn('WorldManager: Invalid player position in updateWorldContent:', playerPosition);
            return;
        }
        
        // Generate content in a circle around player
        const generationRadius = 150;
        const attempts = this.performance.isLowPerformance ? 3 : 6; // Fewer attempts in low performance
        
        for (let i = 0; i < attempts; i++) {
            // Random position around player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * generationRadius + 50; // Don't generate too close
            
            const x = playerPosition.x + Math.cos(angle) * distance;
            const z = playerPosition.z + Math.sin(angle) * distance;
            
            // Validate generated coordinates
            if (!isFinite(x) || !isFinite(z)) {
                console.warn('WorldManager: Generated invalid coordinates:', x, z);
                continue;
            }
            
            const position = new THREE.Vector3(x, 0, z);
            
            // Create position key to prevent duplicates
            const posKey = `${Math.floor(x / 10)},${Math.floor(z / 10)}`;
            if (this.generation.generatedObjects.has(posKey)) continue;
            
            // Get zone info
            const zone = this.getZoneAt(position);
            const zoneType = zone ? zone.name : 'Terrant';
            
            // Generate object based on probabilities
            const rand = Math.random();
            if (rand < this.generation.structureProbability) {
                this.createStructureAt(position, zoneType);
                this.generation.generatedObjects.add(posKey);
            } else if (rand < this.generation.structureProbability + this.generation.environmentProbability) {
                this.createEnvironmentObjectAt(position, zoneType);
                this.generation.generatedObjects.add(posKey);
            } else if (rand < this.generation.structureProbability + this.generation.environmentProbability + this.generation.interactiveProbability) {
                this.createInteractiveObjectAt(position, zoneType);
                this.generation.generatedObjects.add(posKey);
            }
        }
        
        // Cleanup old generated objects tracking (memory management)
        if (this.generation.generatedObjects.size > 1000) {
            // Keep only recent half
            const entries = Array.from(this.generation.generatedObjects);
            this.generation.generatedObjects.clear();
            entries.slice(-500).forEach(entry => this.generation.generatedObjects.add(entry));
        }
    }
    
    /**
     * Update internal cache for performance
     */
    updateCache(playerPosition) {
        // Update player chunk
        this.cache.playerChunk = {
            x: Math.floor(playerPosition.x / 64), // Assuming 64 is chunk size
            z: Math.floor(playerPosition.z / 64)
        };
        
        // Cache could include nearby objects, zones, etc.
        // For now, just store basic info
    }
    
    /**
     * Create structure at position
     */
    async createStructureAt(position, zoneType) {
        try {
            console.debug(`🏗️ Creating structure at (${position.x.toFixed(1)}, ${position.z.toFixed(1)}) in zone: ${zoneType}`);
            
            // Simple structure types based on zone using proper constants
            const structureTypes = {
                'Terrant': [STRUCTURE_OBJECTS.HOUSE, STRUCTURE_OBJECTS.TOWER],
                'Forest': [STRUCTURE_OBJECTS.HOUSE, STRUCTURE_OBJECTS.TOWER], // Use available types
                'Desert': [STRUCTURE_OBJECTS.RUINS, STRUCTURE_OBJECTS.HOUSE],
                'Mountain': [STRUCTURE_OBJECTS.TOWER, STRUCTURE_OBJECTS.RUINS],
                'default': [STRUCTURE_OBJECTS.HOUSE]
            };
            
            const types = structureTypes[zoneType] || structureTypes.default;
            const structureType = types[Math.floor(Math.random() * types.length)];
            
            console.debug(`🏗️ Selected structure type: ${structureType}`);
            
            // Set terrain height with validation
            if (isFinite(position.x) && isFinite(position.z)) {
                position.y = this.terrainManager.getHeightAt(position.x, position.z);
            } else {
                console.warn('WorldManager: Invalid position for structure creation:', position);
                position.y = 0;
            }
            
            if (this.structureManager.createStructure) {
                console.debug('🏗️ Calling structureManager.createStructure...');
                const result = await this.structureManager.createStructure(structureType, position);
                console.debug(`🏗️ Structure creation result:`, result ? 'SUCCESS' : 'FAILED');
            } else {
                console.error('🏗️ structureManager.createStructure method not found!');
            }
            
        } catch (error) {
            console.warn('Failed to create structure:', error);
        }
    }
    
    /**
     * Create environment object at position
     */
    async createEnvironmentObjectAt(position, zoneType) {
        try {
            console.debug(`🌳 Creating environment object at (${position.x.toFixed(1)}, ${position.z.toFixed(1)}) in zone: ${zoneType}`);
            
            // Environment types based on zone using proper constants
            const envTypes = {
                'Terrant': [ENVIRONMENT_OBJECTS.ROCK, ENVIRONMENT_OBJECTS.SMALL_CRYSTAL, ENVIRONMENT_OBJECTS.TREE],
                'Forest': [ENVIRONMENT_OBJECTS.TREE, ENVIRONMENT_OBJECTS.BUSH, ENVIRONMENT_OBJECTS.FLOWER],
                'Desert': [ENVIRONMENT_OBJECTS.DESERT_PLANT, ENVIRONMENT_OBJECTS.ROCK, ENVIRONMENT_OBJECTS.OASIS],
                'Mountain': [ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK, ENVIRONMENT_OBJECTS.SMALL_CRYSTAL, ENVIRONMENT_OBJECTS.PINE_TREE],
                'default': [ENVIRONMENT_OBJECTS.TREE, ENVIRONMENT_OBJECTS.ROCK]
            };
            
            const types = envTypes[zoneType] || envTypes.default;
            const envType = types[Math.floor(Math.random() * types.length)];
            
            console.debug(`🌳 Selected environment type: ${envType}`);
            
            // Set terrain height with validation
            if (isFinite(position.x) && isFinite(position.z)) {
                position.y = this.terrainManager.getHeightAt(position.x, position.z);
            } else {
                console.warn('WorldManager: Invalid position for environment object creation:', position);
                position.y = 0;
            }
            
            if (this.environmentManager.createEnvironmentObject) {
                console.debug('🌳 Calling environmentManager.createEnvironmentObject...');
                const result = await this.environmentManager.createEnvironmentObject(envType, position.x, position.z);
                console.debug(`🌳 Environment object creation result:`, result ? 'SUCCESS' : 'FAILED');
            } else {
                console.error('🌳 environmentManager.createEnvironmentObject method not found!');
            }
            
        } catch (error) {
            console.warn('Failed to create environment object:', error);
        }
    }
    
    /**
     * Create interactive object at position
     */
    async createInteractiveObjectAt(position, zoneType) {
        try {
            // Interactive object types
            const interactiveTypes = ['chest', 'portal', 'shrine'];
            const objType = interactiveTypes[Math.floor(Math.random() * interactiveTypes.length)];
            
            // Set terrain height with validation
            if (isFinite(position.x) && isFinite(position.z)) {
                position.y = this.terrainManager.getHeightAt(position.x, position.z);
            } else {
                console.warn('WorldManager: Invalid position for interactive object creation:', position);
                position.y = 0;
            }
            
            if (this.interactiveManager.createInteractiveObject) {
                await this.interactiveManager.createInteractiveObject(objType, position);
            }
            
        } catch (error) {
            console.warn('Failed to create interactive object:', error);
        }
    }
    
    /**
     * Get terrain height at position
     */
    getTerrainHeight(x, z) {
        return this.terrainManager.getHeightAt(x, z);
    }
    
    /**
     * Get interactive objects near a specific position
     */
    getInteractiveObjectsNear(position, radius) {
        return this.interactiveManager.getObjectsNear(position, radius);
    }
    
    /**
     * Legacy methods for backward compatibility
     */
    updateForPlayer(playerPosition, drawDistanceMultiplier = 1.0) {
        this.update(playerPosition, 0.016); // Assume 60fps for deltaTime
    }
    
    /**
     * Clear all world content
     */
    clear() {
        if (this.terrainManager && this.terrainManager.clear) {
            this.terrainManager.clear();
        }
        this.generation.generatedObjects.clear();
        this.generation.lastPosition.set(0, 0, 0);
        this.cache.playerChunk = { x: 0, z: 0 };
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            performance: {
                fps: Math.round(this.performance.frameRate),
                isLowPerformance: this.performance.isLowPerformance
            },
            generation: {
                enabled: this.generation.enabled,
                updateDistance: this.generation.updateDistance,
                objectsGenerated: this.generation.generatedObjects.size,
                probabilities: {
                    structure: this.generation.structureProbability.toFixed(2),
                    environment: this.generation.environmentProbability.toFixed(2),
                    interactive: this.generation.interactiveProbability.toFixed(2)
                }
            },
            terrain: this.terrainManager && this.terrainManager.getDebugInfo ? this.terrainManager.getDebugInfo() : {},
            memory: {
                cacheSize: this.cache.nearbyObjects.length,
                lastCacheUpdate: Date.now() - this.cache.lastCacheUpdate
            }
        };
    }
    
    /**
     * Legacy method - kept for compatibility
     */
    generateRandomObjectsAroundPlayer() {
        // This is now handled by updateWorldContent
        console.warn('generateRandomObjectsAroundPlayer is deprecated, use updateWorldContent instead');
    }
    
    /**
     * Legacy method - kept for compatibility  
     */
    spawnEnemiesNearPlayer(playerPosition) {
        if (this.enemyManager && this.enemyManager.spawnEnemiesNearPlayer) {
            this.enemyManager.spawnEnemiesNearPlayer(playerPosition);
        }
    }
    
    /**
     * Legacy method - kept for compatibility
     */
    clearTerrainCache() {
        // No-op since we don't use terrain cache anymore
        console.debug('clearTerrainCache called - no action needed with optimized terrain');
    }
    
    /**
     * Legacy method - kept for compatibility
     */
    cleanupDuplicateStructures() {
        // Handled automatically by the optimized system
        console.debug('cleanupDuplicateStructures called - handled automatically');
    }
    
    /**
     * Legacy method - kept for compatibility
     */
    generateInitialObjectsAroundOrigin() {
        // This is now handled by generateInitialContent
        console.debug('generateInitialObjectsAroundOrigin called - handled by generateInitialContent');
    }
}