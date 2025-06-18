import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../../config/map/terrain.js';

/**
 * Manages terrain templates and texture caching
 */
export class TerrainTemplateManager {
    constructor() {
        // Cache for terrain templates by zone type
        this.terrainTemplates = {};
        
        // Cache for generated textures by color
        this.textureCache = {};
        
        // Seed for noise generation
        this.seed = Math.random();
    }
    
    /**
     * Generate coherent noise value at a given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @returns {number} - Noise value between -1 and 1
     */
    generateCoherentNoise(x, y, z) {
        // Simple implementation of Perlin-like noise
        // This is a basic implementation that provides coherent noise
        
        // Add seed to coordinates to get different terrain each time
        x += this.seed;
        z += this.seed;
        
        // Convert coordinates to grid cell coordinates and local coordinates
        const X = Math.floor(x);
        const Y = Math.floor(y);
        const Z = Math.floor(z);
        
        // Get local coordinates (0 to 1) within the grid cell
        const x_frac = x - X;
        const y_frac = y - Y;
        const z_frac = z - Z;
        
        // Generate pseudo-random gradient vectors at grid points
        const gradients = [
            this.getGradient(X, Y, Z),
            this.getGradient(X + 1, Y, Z),
            this.getGradient(X, Y + 1, Z),
            this.getGradient(X + 1, Y + 1, Z),
            this.getGradient(X, Y, Z + 1),
            this.getGradient(X + 1, Y, Z + 1),
            this.getGradient(X, Y + 1, Z + 1),
            this.getGradient(X + 1, Y + 1, Z + 1)
        ];
        
        // Calculate dot products between gradients and distance vectors
        const dots = [
            this.dot([x_frac, y_frac, z_frac], gradients[0]),
            this.dot([x_frac - 1, y_frac, z_frac], gradients[1]),
            this.dot([x_frac, y_frac - 1, z_frac], gradients[2]),
            this.dot([x_frac - 1, y_frac - 1, z_frac], gradients[3]),
            this.dot([x_frac, y_frac, z_frac - 1], gradients[4]),
            this.dot([x_frac - 1, y_frac, z_frac - 1], gradients[5]),
            this.dot([x_frac, y_frac - 1, z_frac - 1], gradients[6]),
            this.dot([x_frac - 1, y_frac - 1, z_frac - 1], gradients[7])
        ];
        
        // Interpolate dot products using smoothstep function
        const u = this.smoothstep(x_frac);
        const v = this.smoothstep(y_frac);
        const w = this.smoothstep(z_frac);
        
        // Trilinear interpolation
        const value = this.lerp(
            this.lerp(
                this.lerp(dots[0], dots[1], u),
                this.lerp(dots[2], dots[3], u),
                v
            ),
            this.lerp(
                this.lerp(dots[4], dots[5], u),
                this.lerp(dots[6], dots[7], u),
                v
            ),
            w
        );
        
        // Scale to range [-1, 1]
        return value * 2;
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
    
    /**
     * Generate a pseudo-random gradient vector based on coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @returns {Array} - Gradient vector [x, y, z]
     */
    getGradient(x, y, z) {
        // Simple hash function to get a consistent pseudo-random value
        const h = this.hash(x + this.hash(y + this.hash(z)));
        
        // Use the hash to select a gradient vector
        const theta = h * Math.PI * 2;
        const phi = h * Math.PI;
        
        return [
            Math.cos(theta) * Math.sin(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(phi)
        ];
    }
    
    /**
     * Simple hash function for pseudo-random number generation
     * @param {number} n - Input value
     * @returns {number} - Pseudo-random value between 0 and 1
     */
    hash(n) {
        // Simple hash function that returns a value between 0 and 1
        const x = Math.sin(n) * 10000;
        return x - Math.floor(x);
    }
    
    /**
     * Calculate dot product of two vectors
     * @param {Array} a - First vector
     * @param {Array} b - Second vector
     * @returns {number} - Dot product
     */
    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    /**
     * Smooth step function for interpolation
     * @param {number} t - Input value between 0 and 1
     * @returns {number} - Smoothed value
     */
    smoothstep(t) {
        // Improved smoothstep function: 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} a - First value
     * @param {number} b - Second value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    lerp(a, b, t) {
        return a + t * (b - a);
    }
}