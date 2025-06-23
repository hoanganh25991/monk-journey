import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Manages world zones and their properties
 */
export class ZoneManager {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = null;
        
        // Zone collections
        this.zones = [];
        this.zoneMarkers = [];
    }
    
    /**
     * Set the game reference
     * @param {Game} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }
    
    /**
     * Initialize the zone system
     */
    init() {
        this.createZones();
    }
    
    /**
     * Create zones throughout the world
     */
    createZones() {
        // Define zone types with colors from the Monk Journey theme
        const zoneTypes = [
            { name: 'Forest', color: ZONE_COLORS.Forest.foliage, radius: 20 },
            { name: 'Desert', color: ZONE_COLORS.Desert.sand, radius: 20 },
            { name: 'Mountains', color: ZONE_COLORS.Mountains.ice, radius: 20 },
            { name: 'Swamp', color: ZONE_COLORS.Swamp.vegetation, radius: 20 },
            { name: 'Ruins', color: ZONE_COLORS.Ruins.stone, radius: 15 },
            { name: 'Dark Sanctum', color: ZONE_COLORS['Dark Sanctum'].structure, radius: 15 },
            { name: 'Terrant', color: ZONE_COLORS.Terrant.soil, radius: 25 } // Larger radius for Terrant zones
        ];
        
        // Initialize empty zones array
        this.zones = [];
        
        // Create zones in a grid pattern across the world
        // Use a larger spacing to create more distinct regions
        const spacing = 50; // Space between zone centers
        const range = 10; // More zones for better coverage
        
        // Create a deterministic zone layout using a grid-based approach
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                // Use a deterministic but varied zone selection
                // This creates a more natural-looking pattern while remaining consistent
                const seed = (x * 12345 + z * 54321) % 1000000;
                const pseudoRandom = this.seededRandom(seed);
                
                // Choose zone type based on position and pseudo-random value
                let zoneIndex;
                
                // Create larger contiguous regions by using grid quadrants
                const quadrant = Math.floor((x + range) / 5) + Math.floor((z + range) / 5) * 4;
                
                // Assign zone types to quadrants with some variation
                if (quadrant % 7 === 0) {
                    zoneIndex = 0; // Forest
                } else if (quadrant % 7 === 1) {
                    zoneIndex = 1; // Desert
                } else if (quadrant % 7 === 2) {
                    zoneIndex = 2; // Mountains
                } else if (quadrant % 7 === 3) {
                    zoneIndex = 3; // Swamp
                } else if (quadrant % 7 === 4) {
                    zoneIndex = 4; // Ruins
                } else if (quadrant % 7 === 5) {
                    zoneIndex = 5; // Dark Sanctum
                } else {
                    zoneIndex = 6; // Terrant
                }
                
                // Add some variation to prevent perfect grid patterns
                if (pseudoRandom() < 0.2) {
                    // 20% chance to use a different zone type
                    zoneIndex = Math.floor(pseudoRandom() * zoneTypes.length);
                }
                
                // Make sure zoneIndex is valid
                zoneIndex = Math.min(Math.max(0, zoneIndex), zoneTypes.length - 1);
                const zoneType = zoneTypes[zoneIndex];
                
                // Add some deterministic variation to zone positions
                // This makes the zones less grid-like while remaining consistent
                const offsetX = (pseudoRandom() - 0.5) * spacing * 0.4;
                const offsetZ = (pseudoRandom() - 0.5) * spacing * 0.4;
                
                // Create the zone
                this.zones.push({
                    name: zoneType.name,
                    center: new THREE.Vector3(
                        x * spacing + offsetX, 
                        0, 
                        z * spacing + offsetZ
                    ),
                    radius: zoneType.radius * (0.9 + pseudoRandom() * 0.2), // Slight radius variation
                    color: zoneType.color
                });
            }
        }
        
        // Add special zones
        // Dark Sanctum at the center
        this.zones.push({
            name: 'Dark Sanctum',
            center: new THREE.Vector3(0, 0, 0),
            radius: 15,
            color: 0x330033
        });
        
        // Add a large Terrant zone around the center
        this.zones.push({
            name: 'Terrant',
            center: new THREE.Vector3(0, 0, 0),
            radius: 40, // Large radius to cover the starting area
            color: ZONE_COLORS.Terrant.soil
        });
        
        // Cache zone data for chunk lookups
        this.buildZoneCache();
        
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
     * Build a cache of zone data for chunk lookups
     * This improves performance by pre-calculating zone information for chunks
     */
    buildZoneCache() {
        this.zoneCache = {};
        
        // Make sure terrain manager is available
        if (!this.worldManager || !this.worldManager.terrainManager) {
            console.warn("Cannot build zone cache: terrain manager not available");
            return;
        }
        
        // Get the terrain chunk size
        const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
        
        // Calculate the range of chunks to cache based on the world size
        const range = 20; // Cache a 40x40 chunk area
        
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                const chunkKey = `${x},${z}`;
                
                // Calculate the center of this chunk in world coordinates
                const worldX = x * chunkSize + chunkSize / 2;
                const worldZ = z * chunkSize + chunkSize / 2;
                
                // Find the zone at this position
                const position = new THREE.Vector3(worldX, 0, worldZ);
                const zone = this.getZoneAt(position);
                
                // Cache the zone type for this chunk
                this.zoneCache[chunkKey] = zone ? zone.name : 'Terrant';
            }
        }
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
                this.worldManager.getTerrainHeight(zone.center.x, zone.center.z) + 2.5,
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
     * Get the zone at a specific world position
     * @param {THREE.Vector3} position - The position to check
     * @returns {object|null} - The zone at the specified position, or null if none
     */
    getZoneAt(position) {
        // If zones array is empty, return default Terrant zone
        if (!this.zones || this.zones.length === 0) {
            return {
                name: 'Terrant',
                color: ZONE_COLORS.Terrant ? ZONE_COLORS.Terrant.soil : 0x8B4513, // Earth Brown
                center: position.clone(),
                radius: 1
            };
        }
        
        // Check if we have a cached zone for this chunk
        if (this.zoneCache && this.worldManager && this.worldManager.terrainManager) {
            // Calculate which chunk this position is in
            const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
            const chunkX = Math.floor(position.x / chunkSize);
            const chunkZ = Math.floor(position.z / chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // If we have a cached zone type for this chunk, create a temporary zone object
            if (this.zoneCache[chunkKey]) {
                const zoneName = this.zoneCache[chunkKey];
                
                // Find the color for this zone type
                let zoneColor = 0x4a9e4a; // Default color
                for (const zone of this.zones) {
                    if (zone.name === zoneName) {
                        zoneColor = zone.color;
                        break;
                    }
                }
                
                return {
                    name: zoneName,
                    color: zoneColor,
                    // We don't need these properties for most use cases
                    center: position.clone(),
                    radius: 1
                };
            }
        }
        
        // If no cache or cache miss, fall back to distance-based lookup
        try {
            // Sort zones by distance to optimize lookup (closest first)
            const sortedZones = [...this.zones].sort((a, b) => {
                const distA = position.distanceTo(a.center);
                const distB = position.distanceTo(b.center);
                return distA - distB;
            });
            
            // Check zones in order of proximity
            for (const zone of sortedZones) {
                const distance = position.distanceTo(zone.center);
                if (distance <= zone.radius) {
                    return zone;
                }
            }
        } catch (error) {
            console.warn("Error in zone lookup:", error);
        }
        
        // Default to Terrant if no zone found
        return {
            name: 'Terrant',
            color: ZONE_COLORS.Terrant ? ZONE_COLORS.Terrant.soil : 0x8B4513, // Earth Brown
            center: position.clone(),
            radius: 1
        };
    }
    
    /**
     * Get the zone type for a specific chunk
     * @param {number} chunkX - X chunk coordinate
     * @param {number} chunkZ - Z chunk coordinate
     * @returns {string} - The zone type name
     */
    getZoneTypeForChunk(chunkX, chunkZ) {
        try {
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Check if we have a cached zone type for this chunk
            if (this.zoneCache && this.zoneCache[chunkKey]) {
                return this.zoneCache[chunkKey];
            }
            
            // Make sure terrain manager is available
            if (!this.worldManager || !this.worldManager.terrainManager) {
                return 'Terrant'; // Default if terrain manager not available
            }
            
            // If not in cache, calculate it and cache the result
            const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
            const worldX = chunkX * chunkSize + chunkSize / 2;
            const worldZ = chunkZ * chunkSize + chunkSize / 2;
            
            const position = new THREE.Vector3(worldX, 0, worldZ);
            const zone = this.getZoneAt(position);
            
            // Cache the result for future lookups
            if (!this.zoneCache) this.zoneCache = {};
            this.zoneCache[chunkKey] = zone ? zone.name : 'Terrant';
            
            return this.zoneCache[chunkKey];
        } catch (error) {
            console.warn("Error getting zone type for chunk:", error);
            return 'Terrant'; // Default to Terrant on error
        }
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