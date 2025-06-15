import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Manages terrain coloring and zone-based styling
 */
export class TerrainColoringManager {
    constructor() {
        // No state needed for this utility class
    }

    /**
     * Apply consistent terrain coloring based on zone type with minimal variation
     * @param {THREE.Mesh} terrain - The terrain mesh to color
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {Object} themeColors - Optional theme colors from loaded map
     */
    colorTerrainUniform(terrain, zoneType = 'Terrant', themeColors = null) {
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        
        // Get colors from theme colors if available, otherwise use config
        // First check if we have direct theme colors passed in
        let zoneColors;
        
        if (themeColors) {
            // Use theme colors directly if provided
            // The map generator stores theme colors directly in the theme.colors property
            zoneColors = themeColors;
            console.debug(`Using theme colors for zone ${zoneType}:`, zoneColors);
        } else {
            // Fall back to config colors for the specific zone type
            zoneColors = ZONE_COLORS[zoneType] || ZONE_COLORS['Terrant'];
            console.debug(`Using config colors for zone ${zoneType}:`, zoneColors);
        }
        
        // Define base colors for each zone type
        let baseColorHex;
        let secondaryColorHex = null;
        let useHeightGradient = false;
        let heightThreshold = 0.4;
        let useSpecialColoring = false;
        
        // Determine the main color for this zone type
        switch (zoneType) {
            // Original zones
            case 'Terrant':
                baseColorHex = zoneColors.soil || zoneColors.ground;
                break;
            case 'Forest':
                baseColorHex = zoneColors.ground || zoneColors.foliage;
                break;
            case 'Desert':
                baseColorHex = zoneColors.sand || zoneColors.ground;
                break;
            case 'Mountains':
                baseColorHex = zoneColors.snow || zoneColors.rock;
                secondaryColorHex = zoneColors.ice || zoneColors.rock;
                useHeightGradient = true;
                break;
            case 'Swamp':
                baseColorHex = zoneColors.vegetation || zoneColors.ground;
                break;
            case 'Ruins':
                baseColorHex = zoneColors.stone || zoneColors.ground;
                break;
            case 'Dark Sanctum':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.fire || zoneColors.accent;
                useHeightGradient = true;
                heightThreshold = 0.7;
                break;
                
            // Fantasy Realms
            case 'Enchanted Grove':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.glow;
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
            case 'Crystal Caverns':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.crystal;
                useHeightGradient = true;
                break;
            case 'Celestial Realm':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.cloud;
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
            case 'Volcanic Wastes':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.lava;
                useHeightGradient = true;
                heightThreshold = 0.3;
                break;
            case 'Twilight Veil':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.mist;
                useHeightGradient = true;
                heightThreshold = 0.7;
                break;
                
            // Realistic Biomes
            case 'Tundra':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.ice;
                useHeightGradient = true;
                break;
            case 'Savanna':
                baseColorHex = zoneColors.ground;
                break;
            case 'Rainforest':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.canopy;
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
            case 'Coral Reef':
                baseColorHex = zoneColors.water;
                secondaryColorHex = zoneColors.coral;
                useSpecialColoring = true;
                break;
            case 'Alpine':
                baseColorHex = zoneColors.rock;
                secondaryColorHex = zoneColors.snow;
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
                
            // Abstract/Stylized
            case 'Neon Grid':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.grid;
                useSpecialColoring = true;
                break;
            case 'Candy Kingdom':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.highlight;
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
            case 'Monochrome':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.accent;
                useHeightGradient = true;
                break;
            case 'Pastel Dream':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.cloud;
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
                
            // Mixed Themes
            case 'Corrupted Sanctuary':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.corruption;
                useSpecialColoring = true;
                break;
            case 'Ancient Tech':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.tech;
                useHeightGradient = true;
                break;
            case 'Fungal Network':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.fungi;
                useSpecialColoring = true;
                break;
            case 'Quantum Flux':
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.energy;
                useSpecialColoring = true;
                break;
                
            default:
                // Fallback to soil color or a default brown
                baseColorHex = zoneColors.ground || zoneColors.soil || '#8B4513';
        }
        
        // Create base color
        const baseColor = new THREE.Color(baseColorHex);
        let secondaryColor = null;
        if (secondaryColorHex) {
            secondaryColor = new THREE.Color(secondaryColorHex);
        }
        
        // Use terrain position for consistent variation across chunks
        const terrainX = terrain.position.x;
        const terrainZ = terrain.position.z;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Get vertex position
            const x = positions[i] + terrainX;
            const z = positions[i + 2] + terrainZ;
            const y = positions[i + 1]; // Get the height of the vertex
            
            // Very subtle variation for consistency across large areas
            // Use larger scale for smoother transitions
            const variation = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 0.02;
            
            let color;
            
            // Normalize height to 0-1 range (assuming height is between -10 and 10)
            const normalizedHeight = (y + 10) / 20;
            
            if (useHeightGradient && secondaryColor) {
                // Use height-based gradient between two colors
                if (normalizedHeight < heightThreshold) {
                    // Lower areas - use secondary color
                    color = new THREE.Color(
                        Math.max(0, Math.min(1, secondaryColor.r + variation)),
                        Math.max(0, Math.min(1, secondaryColor.g + variation)),
                        Math.max(0, Math.min(1, secondaryColor.b + variation))
                    );
                } else {
                    // Higher areas - use base color
                    color = new THREE.Color(
                        Math.max(0, Math.min(1, baseColor.r + variation)),
                        Math.max(0, Math.min(1, baseColor.g + variation)),
                        Math.max(0, Math.min(1, baseColor.b + variation))
                    );
                }
            } else if (useSpecialColoring && secondaryColor) {
                // Special coloring patterns for unique zones
                
                // Pattern based on position
                const pattern = Math.sin(x * 0.1) * Math.cos(z * 0.1);
                
                if (zoneType === 'Coral Reef') {
                    // Coral reef pattern - coral formations rising from water
                    if (pattern > 0.3 && normalizedHeight > 0.4) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + variation)),
                            Math.max(0, Math.min(1, secondaryColor.g + variation)),
                            Math.max(0, Math.min(1, secondaryColor.b + variation))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + variation)),
                            Math.max(0, Math.min(1, baseColor.g + variation)),
                            Math.max(0, Math.min(1, baseColor.b + variation))
                        );
                    }
                } else if (zoneType === 'Neon Grid') {
                    // Grid pattern for Neon Grid
                    const gridX = Math.abs(Math.sin(x * 0.5)) < 0.1;
                    const gridZ = Math.abs(Math.sin(z * 0.5)) < 0.1;
                    
                    if (gridX || gridZ) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + variation)),
                            Math.max(0, Math.min(1, secondaryColor.g + variation)),
                            Math.max(0, Math.min(1, secondaryColor.b + variation))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + variation)),
                            Math.max(0, Math.min(1, baseColor.g + variation)),
                            Math.max(0, Math.min(1, baseColor.b + variation))
                        );
                    }
                } else if (zoneType === 'Corrupted Sanctuary') {
                    // Corruption spreading pattern
                    if (pattern > 0 && Math.sin(x * 0.2 + z * 0.3) > 0) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + variation)),
                            Math.max(0, Math.min(1, secondaryColor.g + variation)),
                            Math.max(0, Math.min(1, secondaryColor.b + variation))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + variation)),
                            Math.max(0, Math.min(1, baseColor.g + variation)),
                            Math.max(0, Math.min(1, baseColor.b + variation))
                        );
                    }
                } else if (zoneType === 'Fungal Network') {
                    // Fungal growth pattern
                    if (Math.abs(Math.sin(x * 0.3) * Math.cos(z * 0.3)) > 0.7) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + variation)),
                            Math.max(0, Math.min(1, secondaryColor.g + variation)),
                            Math.max(0, Math.min(1, secondaryColor.b + variation))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + variation)),
                            Math.max(0, Math.min(1, baseColor.g + variation)),
                            Math.max(0, Math.min(1, baseColor.b + variation))
                        );
                    }
                } else if (zoneType === 'Quantum Flux') {
                    // Reality distortion pattern
                    const distortion = Math.sin(x * 0.05 + z * 0.05 + y * 0.1);
                    if (distortion > 0) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + variation)),
                            Math.max(0, Math.min(1, secondaryColor.g + variation)),
                            Math.max(0, Math.min(1, secondaryColor.b + variation))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + variation)),
                            Math.max(0, Math.min(1, baseColor.g + variation)),
                            Math.max(0, Math.min(1, baseColor.b + variation))
                        );
                    }
                } else {
                    // Default pattern
                    color = new THREE.Color(
                        Math.max(0, Math.min(1, baseColor.r + variation)),
                        Math.max(0, Math.min(1, baseColor.g + variation)),
                        Math.max(0, Math.min(1, baseColor.b + variation))
                    );
                }
            } else {
                // For other zone types, use the base color with variation
                color = new THREE.Color(
                    Math.max(0, Math.min(1, baseColor.r + variation)),
                    Math.max(0, Math.min(1, baseColor.g + variation)),
                    Math.max(0, Math.min(1, baseColor.b + variation))
                );
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
}