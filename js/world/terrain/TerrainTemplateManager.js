import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../../config/terrain.js';

/**
 * Manages terrain templates and texture caching
 */
export class TerrainTemplateManager {
    constructor() {
        // Cache for terrain templates by zone type
        this.terrainTemplates = {};
        
        // Cache for generated textures by color
        this.textureCache = {};
    }

    /**
     * Create or get a cached texture for terrain (simplified - no longer used)
     * @param {number} baseColorHex - Base color for the texture
     * @param {number} secondaryColorHex - Secondary color for the texture
     * @returns {THREE.Texture} - The texture
     */
    getOrCreateTexture(baseColorHex, secondaryColorHex) {
        // Simplified: return null since we're using vertex colors instead of textures
        // This method is kept for compatibility but no longer creates complex textures
        return null;
    }

    /**
     * Create or get a cached terrain template for a zone type (simplified)
     * @param {string} zoneType - The zone type
     * @param {number} size - Size of the terrain
     * @param {number} resolution - Resolution of the terrain
     * @returns {Object} - Template with geometry and material
     */
    getOrCreateTerrainTemplate(zoneType, size, resolution) {
        // Simplified key - only use size and resolution, not zone type
        // This reduces the number of templates we need to cache
        const templateKey = `${size}_${resolution}`;
        
        // Return cached template if it exists
        if (this.terrainTemplates[templateKey]) {
            return this.terrainTemplates[templateKey];
        }
        
        // Create new template with simple geometry
        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        geometry.computeVertexNormals();
        
        // Create simple material without complex textures
        // The coloring will be handled by the TerrainColoringManager
        const materialOptions = {
            roughness: 0.8,
            metalness: 0.1,
            vertexColors: true,
            color: 0xffffff // White base color, will be overridden by vertex colors
        };
        
        // Apply debug settings if enabled
        if (TERRAIN_CONFIG.debug.enabled) {
            if (TERRAIN_CONFIG.debug.transparent) {
                materialOptions.transparent = true;
                materialOptions.opacity = TERRAIN_CONFIG.debug.opacity;
            }
            if (TERRAIN_CONFIG.debug.wireframe) {
                materialOptions.wireframe = true;
            }
        }
        
        const material = new THREE.MeshStandardMaterial(materialOptions);
        
        // Store simplified template
        this.terrainTemplates[templateKey] = {
            geometry: geometry,
            material: material,
            zoneType: 'universal' // Universal template for all zone types
        };
        
        return this.terrainTemplates[templateKey];
    }

    /**
     * Clear all cached templates (simplified)
     */
    clear() {
        // Dispose of cached templates
        for (const templateKey in this.terrainTemplates) {
            const template = this.terrainTemplates[templateKey];
            if (template) {
                if (template.geometry) {
                    template.geometry.dispose();
                }
                if (template.material) {
                    template.material.dispose();
                }
            }
        }
        
        // Reset caches
        this.textureCache = {};
        this.terrainTemplates = {};
    }
}