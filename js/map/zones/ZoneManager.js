import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Manages world zones and their properties
 */
export class ZoneManager {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
        this.game = null;
        
        // Zone collections
        this.zones = [];
        this.zoneMarkers = [];
        
        // Theme colors from loaded map (if any)
        this.currentThemeColors = null;
    }
    
    /**
     * Set the game reference
     * @param {Game} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Set theme colors from a loaded map
     * @param {Object} themeColors - Theme colors from map data
     */
    setThemeColors(themeColors) {
        this.currentThemeColors = themeColors;
        console.debug('Theme colors set:', themeColors);
    }
    
    /**
     * Get theme colors for a specific zone type
     * @param {string} zoneType - The zone type
     * @returns {Object} - The theme colors for the zone type
     */
    getThemeColorsForZoneType(zoneType) {
        // If we have theme colors, return them directly
        // This ensures the map's theme colors are used for all zones
        if (this.currentThemeColors) {
            // The map generator stores theme colors directly in the theme.colors property
            // not as a nested object by zone type
            console.debug(`Returning theme colors for zone ${zoneType}:`, this.currentThemeColors);
            return this.currentThemeColors;
        }
        return null;
    }
    
    /**
     * Initialize the zone system
     */
    init() {
        this.createZones();
        
        // Build zone cache for faster lookups
        this.buildSimpleZoneCache();
    }
    
    /**
     * Update terrain colors based on current zones
     * This ensures terrain colors match the zone types
     */
    updateTerrainColors() {
        console.debug('Updating terrain colors based on zones...');
        
        if (!this.MapManager || !this.MapManager.terrainManager) {
            console.warn('TerrainManager not available for color updates');
            return;
        }
        
        // Get all visible terrain chunks
        const terrainChunks = this.MapManager.terrainManager.terrainChunks;
        if (!terrainChunks) {
            console.warn('No terrain chunks available for color updates');
            return;
        }
        
        // Determine the main theme zone (should cover 70% of the map)
        let mainZone = null;
        if (this.zones.length > 0) {
            // Sort zones by radius (descending) to find the largest zone
            const sortedZones = [...this.zones].sort((a, b) => b.radius - a.radius);
            mainZone = sortedZones[0];
            console.debug(`Main theme zone: ${mainZone.name} with radius ${mainZone.radius}`);
        }
        
        // Log theme colors for debugging
        console.debug('Current theme colors:', this.currentThemeColors);
        
        // Update each terrain chunk's color based on its position
        Object.values(terrainChunks).forEach(chunk => {
            if (chunk && !chunk.isPlaceholder) {
                // Get chunk position
                const chunkX = chunk.position.x;
                const chunkZ = chunk.position.z;
                
                // Determine zone for this chunk
                let zoneType = 'Terrant'; // Default
                
                if (mainZone) {
                    // Calculate distance from chunk to main zone center
                    const distance = Math.sqrt(
                        Math.pow(chunkX - mainZone.center.x, 2) + 
                        Math.pow(chunkZ - mainZone.center.z, 2)
                    );
                    
                    // If within 70% of the main zone's radius, use the main zone type
                    // This ensures approximately 70% of the map uses the main theme color
                    if (distance <= mainZone.radius * 1.2) {
                        zoneType = mainZone.name;
                    } else {
                        // Otherwise, find the closest zone
                        const closestZone = this.getZoneAt(
                            new THREE.Vector3(chunkX, 0, chunkZ)
                        );
                        if (closestZone) {
                            zoneType = closestZone.name;
                        }
                    }
                } else {
                    // If no main zone, use the zone manager to determine zone
                    const zone = this.getZoneAt(
                        new THREE.Vector3(chunkX, 0, chunkZ)
                    );
                    if (zone) {
                        zoneType = zone.name;
                    }
                }
                
                // Get theme colors for this zone
                const themeColors = this.getThemeColorsForZoneType(zoneType);
                
                // Apply the zone-appropriate color to the terrain chunk
                this.MapManager.terrainManager.colorTerrainUniform(chunk, zoneType, themeColors);
            }
        });
        
        // Also update the base terrain if it exists
        if (this.MapManager.terrainManager.terrain) {
            const baseTerrain = this.MapManager.terrainManager.terrain;
            const mainZoneType = mainZone ? mainZone.name : 'Terrant';
            const themeColors = this.getThemeColorsForZoneType(mainZoneType);
            
            console.debug(`Coloring base terrain with zone type ${mainZoneType} and theme colors:`, themeColors);
            this.MapManager.terrainManager.colorTerrainUniform(baseTerrain, mainZoneType, themeColors);
        }
        
        console.debug('Terrain colors updated successfully');
    }
    
    /**
     * Update terrain colors in a specific area
     * This is used for chunk-based color updates to ensure consistency
     * @param {number} worldX - World X coordinate of the area center
     * @param {number} worldZ - World Z coordinate of the area center
     * @param {number} width - Width of the area
     * @param {number} depth - Depth of the area
     * @param {Object} colors - Specific colors to apply (overrides zone-based colors)
     */
    updateTerrainColorsInArea(worldX, worldZ, width, depth, colors) {
        if (!this.MapManager || !this.MapManager.terrainManager) {
            console.warn('TerrainManager not available for area color updates');
            return;
        }
        
        // Get all visible terrain chunks
        const terrainChunks = this.MapManager.terrainManager.terrainChunks;
        if (!terrainChunks) {
            console.warn('No terrain chunks available for area color updates');
            return;
        }
        
        // Calculate area bounds
        const minX = worldX - width / 2;
        const maxX = worldX + width / 2;
        const minZ = worldZ - depth / 2;
        const maxZ = worldZ + depth / 2;
        
        // Find terrain chunks that intersect with this area
        Object.values(terrainChunks).forEach(chunk => {
            if (chunk && !chunk.isPlaceholder) {
                const chunkX = chunk.position.x;
                const chunkZ = chunk.position.z;
                const chunkSize = this.MapManager.terrainManager.terrainChunkSize || 50;
                
                // Check if this chunk intersects with our area
                const chunkMinX = chunkX - chunkSize / 2;
                const chunkMaxX = chunkX + chunkSize / 2;
                const chunkMinZ = chunkZ - chunkSize / 2;
                const chunkMaxZ = chunkZ + chunkSize / 2;
                
                // If chunk intersects with our area, update its colors
                if (chunkMaxX >= minX && chunkMinX <= maxX && 
                    chunkMaxZ >= minZ && chunkMinZ <= maxZ) {
                    
                    // If specific colors are provided, use them
                    if (colors) {
                        // Determine zone type based on the chunk position
                        const zone = this.getZoneAt(new THREE.Vector3(chunkX, 0, chunkZ));
                        const zoneType = zone ? zone.name : 'Terrant';
                        
                        // Apply the colors to the terrain chunk
                        this.MapManager.terrainManager.colorTerrainUniform(chunk, zoneType, colors);
                    } else {
                        // Otherwise, use the standard zone-based coloring
                        const zone = this.getZoneAt(new THREE.Vector3(chunkX, 0, chunkZ));
                        const zoneType = zone ? zone.name : 'Terrant';
                        const themeColors = this.getThemeColorsForZoneType(zoneType);
                        
                        this.MapManager.terrainManager.colorTerrainUniform(chunk, zoneType, themeColors);
                    }
                }
            }
        });
    }
    
    /**
     * Create simplified zones throughout the world
     */
    createZones() {
        // Simplified zone types - fewer zones, larger areas
        const zoneTypes = [
            { name: 'Terrant', color: ZONE_COLORS.Terrant.soil, radius: 100 },
            { name: 'Forest', color: ZONE_COLORS.Forest.foliage, radius: 80 },
            { name: 'Desert', color: ZONE_COLORS.Desert.sand, radius: 80 },
            { name: 'Mountain', color: ZONE_COLORS.Mountain.ice, radius: 80 }
        ];
        
        // Initialize zones array with large, simple regions
        this.zones = [
            // Central Terrant zone (starting area)
            {
                name: 'Terrant',
                center: new THREE.Vector3(0, 0, 0),
                radius: 150,
                color: ZONE_COLORS.Terrant.soil
            },
            // Four cardinal direction zones
            {
                name: 'Forest',
                center: new THREE.Vector3(200, 0, 0),
                radius: 120,
                color: ZONE_COLORS.Forest.foliage
            },
            {
                name: 'Desert',
                center: new THREE.Vector3(-200, 0, 0),
                radius: 120,
                color: ZONE_COLORS.Desert.sand
            },
            {
                name: 'Mountain',
                center: new THREE.Vector3(0, 0, 200),
                radius: 120,
                color: ZONE_COLORS.Mountain.ice
            },
            {
                name: 'Swamp',
                center: new THREE.Vector3(0, 0, -200),
                radius: 120,
                color: ZONE_COLORS.Swamp.vegetation
            }
        ];
        
        // Build simple zone cache
        this.buildSimpleZoneCache();
        
        // Visualize zones (for development)
        this.visualizeZones();
    }
    
    /**
     * Seeded random number generator for consistent zone generation
     * @param {number} seed - The seed value
     * @returns {function} - A function that returns a random number between 0 and 1
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    /**
     * Build a simplified cache of zone data for chunk lookups
     */
    buildSimpleZoneCache() {
        this.zoneCache = {};
        // Cache will be built on-demand in getZoneTypeForChunk
    }
    
    /**
     * Create visual markers for zones
     */
    visualizeZones() {
        // Clear existing markers
        this.clearZoneMarkers();
        
        // Create new markers
        this.zones.forEach(zone => {
            const marker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 5, 8),
                new THREE.MeshBasicMaterial({ color: zone.color })
            );
            marker.position.set(
                zone.center.x,
                this.MapManager.getTerrainHeight(zone.center.x, zone.center.z) + 2.5,
                zone.center.z
            );
            this.scene.add(marker);
            this.zoneMarkers.push(marker);
        });
    }
    
    /**
     * Clear zone markers
     */
    clearZoneMarkers() {
        this.zoneMarkers.forEach(marker => {
            if (marker.parent) {
                this.scene.remove(marker);
            }
        });
        this.zoneMarkers = [];
    }
    
    /**
     * Get the zone at a specific world position (simplified)
     * @param {THREE.Vector3} position - The position to check
     * @returns {object} - The zone at the specified position
     */
    getZoneAt(position) {
        // If zones array is empty, return default Terrant zone
        if (!this.zones || this.zones.length === 0) {
            return {
                name: 'Terrant',
                color: ZONE_COLORS.Terrant.soil,
                center: position.clone(),
                radius: 1
            };
        }
        
        // Simple distance-based lookup - find the zone that contains this position
        for (const zone of this.zones) {
            const distance = position.distanceTo(zone.center);
            if (distance <= zone.radius) {
                return zone;
            }
        }
        
        // If no zone contains the position, return the closest one
        let closestZone = this.zones[0];
        let closestDistance = position.distanceTo(this.zones[0].center);
        
        for (let i = 1; i < this.zones.length; i++) {
            const distance = position.distanceTo(this.zones[i].center);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestZone = this.zones[i];
            }
        }
        
        return closestZone;
    }
    
    /**
     * Get the zone type for a specific chunk (simplified)
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {string} - The zone type name
     */
    getZoneTypeForChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Check cache first
        if (this.zoneCache && this.zoneCache[chunkKey]) {
            return this.zoneCache[chunkKey];
        }
        
        // Calculate chunk center position
        const chunkSize = this.MapManager?.terrainManager?.terrainChunkSize || 50;
        const worldX = chunkX * chunkSize + chunkSize / 2;
        const worldZ = chunkZ * chunkSize + chunkSize / 2;
        
        const position = new THREE.Vector3(worldX, 0, worldZ);
        const zone = this.getZoneAt(position);
        
        // Cache the result
        if (!this.zoneCache) this.zoneCache = {};
        this.zoneCache[chunkKey] = zone.name;
        
        return zone.name;
    }
    
    /**
     * Clear all zones
     */
    clear() {
        this.clearZoneMarkers();
        this.zones = [];
    }
    
    /**
     * Save zone state
     * @returns {object} - The saved zone state
     */
    save() {
        return {
            zones: this.zones.map(zone => ({
                name: zone.name,
                center: {
                    x: zone.center.x,
                    y: zone.center.y,
                    z: zone.center.z
                },
                radius: zone.radius,
                color: zone.color
            }))
        };
    }
    
    /**
     * Load zone state
     * @param {object} zoneState - The zone state to load
     */
    load(zoneState) {
        if (!zoneState || !zoneState.zones) return;
        
        this.zones = zoneState.zones.map(zone => ({
            name: zone.name,
            center: new THREE.Vector3(zone.center.x, zone.center.y, zone.center.z),
            radius: zone.radius,
            color: zone.color
        }));
        
        // Visualize the loaded zones
        this.visualizeZones();
    }
}