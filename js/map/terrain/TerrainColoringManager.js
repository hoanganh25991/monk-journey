import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';
import { BIOMES } from '../../config/map/biomes.js';

/**
 * Manages terrain coloring and zone-based styling
 * Enhanced with realistic noise patterns for more natural-looking terrain
 */
export class TerrainColoringManager {
    constructor() {
        // Noise scale factors for different terrain features
        this.noiseScales = {
            microDetail: 0.3,    // Small details like pebbles and soil variations
            mediumDetail: 0.1,   // Medium details like small bumps and depressions
            largeDetail: 0.03,   // Large terrain features like hills and valleys
            ultraDetail: 0.8     // Ultra fine details for close-up viewing
        };
        
        // Noise influence factors
        this.noiseInfluence = {
            micro: 0.15,         // How much micro detail affects the final color
            medium: 0.1,         // How much medium detail affects the final color
            large: 0.05,         // How much large detail affects the final color
            ultra: 0.05          // How much ultra fine detail affects the final color
        };
    }

    /**
     * Generate coherent noise value based on position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @param {number} scale - Noise scale factor
     * @returns {number} - Noise value between -1 and 1
     */
    generateNoise(x, y, z, scale) {
        // Improved noise function with multiple octaves for more natural variation
        const nx = x * scale;
        const ny = y * scale;
        const nz = z * scale;
        
        // First octave - base noise
        const noise1 = Math.sin(nx) * Math.cos(nz) * Math.sin(nx * 0.7 + nz * 0.3);
        
        // Second octave - finer detail
        const noise2 = Math.sin(nx * 2.3) * Math.cos(nz * 2.1) * Math.sin(ny * 1.5);
        
        // Third octave - finest detail
        const noise3 = Math.sin(nx * 4.7 + nz * 3.1) * Math.cos(nz * 5.3 + nx * 2.3) * Math.sin(ny * 3.5);
        
        // Combine octaves with diminishing influence
        return noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    }

    /**
     * Apply realistic terrain coloring with enhanced noise patterns
     * @param {THREE.Mesh} terrain - The terrain mesh to color
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     * @param {Object} themeColors - Optional theme colors from loaded map
     */
    colorTerrainUniform(terrain, zoneType = BIOMES.TERRANT, themeColors = null) {
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        
        // Get colors from theme colors if available, otherwise use config
        let zoneColors;
        
        if (themeColors) {
            zoneColors = themeColors;
            console.debug(`Using theme colors for zone ${zoneType}:`, zoneColors);
        } else {
            zoneColors = ZONE_COLORS[zoneType] || ZONE_COLORS['Terrant'];
            console.debug(`Using config colors for zone ${zoneType}:`, zoneColors);
        }
        
        // Define base colors for each zone type
        let baseColorHex;
        let secondaryColorHex = null;
        let tertiaryColorHex = null; // Added tertiary color for more variation
        let useHeightGradient = false;
        let heightThreshold = 0.4;
        let useSpecialColoring = false;
        
        // Determine the main color for this zone type
        switch (zoneType) {
            // Original zones
            case BIOMES.TERRANT:
                baseColorHex = zoneColors.soil || zoneColors.ground;
                tertiaryColorHex = zoneColors.stone || '#6D5A4A'; // Slightly different soil tone
                break;
            case BIOMES.FOREST:
                baseColorHex = zoneColors.ground || zoneColors.foliage;
                tertiaryColorHex = zoneColors.soil || '#3D2817'; // Dark soil for forest floor
                break;
            case BIOMES.DESERT:
                baseColorHex = zoneColors.sand || zoneColors.ground;
                tertiaryColorHex = zoneColors.stone || '#B5A282'; // Lighter sand for dunes
                break;
            case BIOMES.MOUNTAIN:
                baseColorHex = zoneColors.snow || zoneColors.rock;
                secondaryColorHex = zoneColors.ice || zoneColors.rock;
                tertiaryColorHex = zoneColors.stone || '#4A4A4A'; // Dark stone for rocky areas
                useHeightGradient = true;
                break;
            case BIOMES.SWAMP:
                baseColorHex = zoneColors.vegetation || zoneColors.ground;
                tertiaryColorHex = zoneColors.water || '#2D3B2D'; // Dark murky water color
                break;
            case BIOMES.RUINS:
                baseColorHex = zoneColors.stone || zoneColors.ground;
                tertiaryColorHex = zoneColors.soil || '#5D5D5D'; // Weathered stone color
                break;
            case BIOMES.DARK_SANCTUM:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.fire || zoneColors.accent;
                tertiaryColorHex = zoneColors.corruption || '#1A0A0A'; // Dark corrupted soil
                useHeightGradient = true;
                heightThreshold = 0.7;
                break;
                
            // Fantasy Realms
            case BIOMES.ENCHANTED_GROVE:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.glow;
                tertiaryColorHex = zoneColors.foliage || '#2D4D2D'; // Magical foliage color
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
            case BIOMES.CRYSTAL_CAVERNS:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.crystal;
                tertiaryColorHex = zoneColors.rock || '#2A3B4D'; // Dark cave rock
                useHeightGradient = true;
                break;
            case BIOMES.CELESTIAL_REALM:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.cloud;
                tertiaryColorHex = zoneColors.glow || '#E0E8FF'; // Ethereal glow
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
            case BIOMES.VOLCANIC_WASTES:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.lava;
                tertiaryColorHex = zoneColors.ash || '#3A3A3A'; // Volcanic ash
                useHeightGradient = true;
                heightThreshold = 0.3;
                break;
            case BIOMES.TWILIGHT_VEIL:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.mist;
                tertiaryColorHex = zoneColors.shadow || '#1A1A2D'; // Shadow color
                useHeightGradient = true;
                heightThreshold = 0.7;
                break;
                
            // Realistic Biomes
            case BIOMES.TUNDRA:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.ice;
                tertiaryColorHex = zoneColors.snow || '#E8EFFF'; // Snow color
                useHeightGradient = true;
                break;
            case BIOMES.SAVANNA:
                baseColorHex = zoneColors.ground;
                tertiaryColorHex = zoneColors.sand || '#D2B48C'; // Dry soil color
                break;
            case BIOMES.RAINFOREST:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.canopy;
                tertiaryColorHex = zoneColors.vegetation || '#1A3B1A'; // Dense vegetation
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
            case BIOMES.CORAL_REEF:
                baseColorHex = zoneColors.water;
                secondaryColorHex = zoneColors.coral;
                tertiaryColorHex = zoneColors.sand || '#E0D8B0'; // Sandy ocean floor
                useSpecialColoring = true;
                break;
            case BIOMES.ALPINE:
                baseColorHex = zoneColors.rock;
                secondaryColorHex = zoneColors.snow;
                tertiaryColorHex = zoneColors.ice || '#A8C8E0'; // Ice color
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
                
            // Abstract/Stylized
            case BIOMES.NEON_GRID:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.grid;
                tertiaryColorHex = zoneColors.glow || '#00FFFF'; // Neon glow
                useSpecialColoring = true;
                break;
            case BIOMES.CANDY_KINGDOM:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.highlight;
                tertiaryColorHex = zoneColors.accent || '#FF9AFF'; // Candy accent
                useHeightGradient = true;
                heightThreshold = 0.5;
                break;
            case BIOMES.MONOCHROME:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.accent;
                tertiaryColorHex = zoneColors.highlight || '#CCCCCC'; // Highlight color
                useHeightGradient = true;
                break;
            case BIOMES.PASTEL_DREAM:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.cloud;
                tertiaryColorHex = zoneColors.highlight || '#FFE8FF'; // Pastel highlight
                useHeightGradient = true;
                heightThreshold = 0.6;
                break;
                
            // Mixed Themes
            case BIOMES.CORRUPTED_SANCTUARY:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.corruption;
                tertiaryColorHex = zoneColors.glow || '#3A0A1A'; // Corrupted glow
                useSpecialColoring = true;
                break;
            case BIOMES.ANCIENT_TECH:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.tech;
                tertiaryColorHex = zoneColors.energy || '#00AAFF'; // Tech energy
                useHeightGradient = true;
                break;
            case BIOMES.FUNGAL_NETWORK:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.fungi;
                tertiaryColorHex = zoneColors.spore || '#8A7A5A'; // Spore color
                useSpecialColoring = true;
                break;
            case BIOMES.QUANTUM_FLUX:
                baseColorHex = zoneColors.ground;
                secondaryColorHex = zoneColors.energy;
                tertiaryColorHex = zoneColors.void || '#000033'; // Void color
                useSpecialColoring = true;
                break;
                
            default:
                // Fallback to Terrant biome colors
                console.warn(`Unknown zone type: ${zoneType}, falling back to ${BIOMES.TERRANT}`);
                zoneColors = ZONE_COLORS[BIOMES.TERRANT];
                baseColorHex = zoneColors.soil || zoneColors.ground || '#8B4513';
                tertiaryColorHex = zoneColors.stone || '#6D5A4A'; // Default tertiary
        }
        
        // Create base color
        const baseColor = new THREE.Color(baseColorHex);
        let secondaryColor = null;
        if (secondaryColorHex) {
            secondaryColor = new THREE.Color(secondaryColorHex);
        }
        
        // Create tertiary color for additional variation
        let tertiaryColor = null;
        if (tertiaryColorHex) {
            tertiaryColor = new THREE.Color(tertiaryColorHex);
        }
        
        // Use terrain position for consistent variation across chunks
        const terrainX = terrain.position.x;
        const terrainZ = terrain.position.z;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Get vertex position
            const x = positions[i] + terrainX;
            const z = positions[i + 2] + terrainZ;
            const y = positions[i + 1]; // Get the height of the vertex
            
            // Generate multi-layered noise for realistic terrain detail
            const microNoise = this.generateNoise(x, y, z, this.noiseScales.microDetail) * this.noiseInfluence.micro;
            const mediumNoise = this.generateNoise(x, y, z, this.noiseScales.mediumDetail) * this.noiseInfluence.medium;
            const largeNoise = this.generateNoise(x, y, z, this.noiseScales.largeDetail) * this.noiseInfluence.large;
            const ultraNoise = this.generateNoise(x, y, z, this.noiseScales.ultraDetail) * this.noiseInfluence.ultra;
            
            // Combine noise layers for rich variation
            const combinedNoise = microNoise + mediumNoise + largeNoise + ultraNoise;
            
            let color;
            
            // Normalize height to 0-1 range (assuming height is between -10 and 10)
            const normalizedHeight = (y + 10) / 20;
            
            if (useHeightGradient && secondaryColor) {
                // Use height-based gradient between colors with noise variation
                if (normalizedHeight < heightThreshold) {
                    // Lower areas - blend between secondary and tertiary colors based on noise
                    if (tertiaryColor && combinedNoise > 0.1) {
                        // Use tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        // Use secondary color with noise variation
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise))
                        );
                    }
                } else {
                    // Higher areas - blend between base and tertiary colors based on noise
                    if (tertiaryColor && combinedNoise < -0.1) {
                        // Use tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        // Use base color with noise variation
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                }
            } else if (useSpecialColoring && secondaryColor) {
                // Special coloring patterns for unique zones with enhanced noise
                
                // Pattern based on position and noise
                const pattern = Math.sin(x * 0.1) * Math.cos(z * 0.1) + combinedNoise * 0.5;
                
                if (zoneType === BIOMES.CORAL_REEF) {
                    // Coral reef pattern - coral formations rising from water
                    if (pattern > 0.3 && normalizedHeight > 0.4) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise))
                        );
                    } else if (pattern < -0.2 && normalizedHeight < 0.3) {
                        // Sandy patches on ocean floor
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                } else if (zoneType === BIOMES.NEON_GRID) {
                    // Enhanced grid pattern for Neon Grid with noise-based distortion
                    const gridX = Math.abs(Math.sin(x * 0.5 + combinedNoise * 0.2)) < 0.1;
                    const gridZ = Math.abs(Math.sin(z * 0.5 + combinedNoise * 0.2)) < 0.1;
                    
                    if (gridX || gridZ) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise * 0.5))
                        );
                    } else if (Math.abs(combinedNoise) > 0.15) {
                        // Tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                } else if (zoneType === BIOMES.CORRUPTED_SANCTUARY) {
                    // Enhanced corruption spreading pattern with noise-based variation
                    if (pattern > 0 && Math.sin(x * 0.2 + z * 0.3 + combinedNoise) > 0) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise))
                        );
                    } else if (combinedNoise > 0.1) {
                        // Tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise * 0.5))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                } else if (zoneType === BIOMES.FUNGAL_NETWORK) {
                    // Enhanced fungal growth pattern with noise-based variation
                    if (Math.abs(Math.sin(x * 0.3 + combinedNoise) * Math.cos(z * 0.3)) > 0.7) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise))
                        );
                    } else if (combinedNoise < -0.1) {
                        // Tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                } else if (zoneType === BIOMES.QUANTUM_FLUX) {
                    // Enhanced reality distortion pattern with noise-based variation
                    const distortion = Math.sin(x * 0.05 + z * 0.05 + y * 0.1 + combinedNoise);
                    if (distortion > 0) {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, secondaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, secondaryColor.b + combinedNoise))
                        );
                    } else if (combinedNoise > 0.15) {
                        // Tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise * 0.5)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise * 0.5))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                } else {
                    // Default pattern with noise-based variation
                    if (combinedNoise > 0.1 && tertiaryColor) {
                        // Use tertiary color for some areas based on noise
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                        );
                    } else {
                        color = new THREE.Color(
                            Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                            Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                        );
                    }
                }
            } else {
                // For other zone types, use the base color with noise-based variation
                if (combinedNoise > 0.1 && tertiaryColor) {
                    // Use tertiary color for some areas based on noise
                    color = new THREE.Color(
                        Math.max(0, Math.min(1, tertiaryColor.r + combinedNoise)),
                        Math.max(0, Math.min(1, tertiaryColor.g + combinedNoise)),
                        Math.max(0, Math.min(1, tertiaryColor.b + combinedNoise))
                    );
                } else {
                    color = new THREE.Color(
                        Math.max(0, Math.min(1, baseColor.r + combinedNoise)),
                        Math.max(0, Math.min(1, baseColor.g + combinedNoise)),
                        Math.max(0, Math.min(1, baseColor.b + combinedNoise))
                    );
                }
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
}