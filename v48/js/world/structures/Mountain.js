import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

/**
 * Creates a mountain structure
 */
export class Mountain {
    /**
     * Create a new mountain
     * @param {string} zoneType - The type of zone (Forest, Desert, Mountains, Terrant, etc.)
     * @param {object} options - Mountain configuration options
     */
    constructor(zoneType = 'Mountains', options = {}) {
        this.zoneType = zoneType;
        
        // Default options
        this.options = {
            baseRadius: options.baseRadius || 15 + Math.random() * 10,
            height: options.height || 20 + Math.random() * 30,
            peakSharpness: options.peakSharpness || 2 + Math.random() * 2,
            roughness: options.roughness || 0.8 + Math.random() * 0.4,
            resolution: options.resolution || 32,
            snowLine: options.snowLine || 0.7 + Math.random() * 0.2, // Height percentage where snow begins
            hasSnow: options.hasSnow !== undefined ? options.hasSnow : (zoneType === 'Mountains'),
            hasCrystals: options.hasCrystals !== undefined ? options.hasCrystals : (Math.random() > 0.7)
        };
        
        // Create noise generator for mountain shape
        this.noise = new SimplexNoise();
    }
    
    /**
     * Create the mountain mesh
     * @returns {THREE.Group} - The mountain group
     */
    createMesh() {
        const mountainGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Mountains;
        
        // Create the mountain geometry
        const { baseRadius, height, resolution } = this.options;
        
        // Create a cone geometry as the base shape
        const geometry = new THREE.ConeGeometry(
            baseRadius,
            height,
            resolution,
            4, // Radial segments
            true // Open ended
        );
        
        // Apply noise to vertices to make the mountain look more natural
        this.applyNoiseToGeometry(geometry);
        
        // Create vertex colors for the mountain
        this.applyColorsToGeometry(geometry, zoneColors);
        
        // Create the mountain material
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        // Create the mountain mesh
        const mountainMesh = new THREE.Mesh(geometry, material);
        mountainMesh.castShadow = true;
        mountainMesh.receiveShadow = true;
        
        // Add the mountain mesh to the group
        mountainGroup.add(mountainMesh);
        
        // Add crystals if enabled
        if (this.options.hasCrystals) {
            this.addCrystals(mountainGroup, zoneColors);
        }
        
        return mountainGroup;
    }
    
    /**
     * Apply noise to the geometry vertices to create a more natural mountain shape
     * @param {THREE.BufferGeometry} geometry - The mountain geometry
     */
    applyNoiseToGeometry(geometry) {
        const { roughness, peakSharpness } = this.options;
        
        // Get position attribute
        const positions = geometry.attributes.position;
        
        // Apply noise to each vertex
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Skip invalid vertices
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.warn("Found NaN vertex position in Mountain geometry");
                continue;
            }
            
            // Calculate distance from center axis
            const distance = Math.sqrt(x * x + z * z);
            
            // Calculate normalized height (0 at bottom, 1 at top)
            const normalizedHeight = y / (this.options.height || 1); // Prevent division by zero
            
            // More noise at the bottom, less at the peak
            const noiseScale = roughness * (1 - Math.pow(normalizedHeight, peakSharpness));
            
            // Apply 3D noise
            let noiseValue = 0;
            try {
                noiseValue = this.noise.noise3d(
                    x * 0.05, 
                    y * 0.05, 
                    z * 0.05
                ) * noiseScale * distance * 0.3;
                
                // Ensure noise value is valid
                if (isNaN(noiseValue)) {
                    noiseValue = 0;
                }
            } catch (e) {
                console.warn("Error calculating noise for Mountain geometry:", e);
                noiseValue = 0;
            }
            
            // Apply noise to position with safety checks
            const xOffset = noiseValue * (x / (Math.max(distance, 0.001))); // Avoid division by zero
            const zOffset = noiseValue * (z / (Math.max(distance, 0.001)));
            
            // Ensure we're not setting NaN values
            if (!isNaN(x + xOffset)) {
                positions.setX(i, x + xOffset);
            }
            
            if (!isNaN(z + zOffset)) {
                positions.setZ(i, z + zOffset);
            }
            
            // Slightly adjust height based on noise
            if (normalizedHeight < 0.9 && !isNaN(y + noiseValue * 0.5)) { // Don't affect the very peak
                positions.setY(i, y + noiseValue * 0.5);
            }
        }
        
        // Update normals
        geometry.computeVertexNormals();
        
        // Validate the geometry after modifications
        this.validateGeometry(geometry);
    }
    
    /**
     * Validate geometry to ensure no NaN values exist
     * @param {THREE.BufferGeometry} geometry - The geometry to validate
     */
    validateGeometry(geometry) {
        const positions = geometry.attributes.position;
        let hasNaN = false;
        
        // Check for NaN values
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                hasNaN = true;
                // Replace NaN with zero to prevent errors
                if (isNaN(x)) positions.setX(i, 0);
                if (isNaN(y)) positions.setY(i, 0);
                if (isNaN(z)) positions.setZ(i, 0);
            }
        }
        
        if (hasNaN) {
            console.warn("Fixed NaN values in Mountain geometry");
        }
    }
    
    /**
     * Apply colors to the geometry based on height and zone type
     * @param {THREE.BufferGeometry} geometry - The mountain geometry
     * @param {object} zoneColors - Colors for the current zone
     */
    applyColorsToGeometry(geometry, zoneColors) {
        const { snowLine, hasSnow } = this.options;
        const positions = geometry.attributes.position;
        
        // Create color attribute
        const colors = new Float32Array(positions.count * 3);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Define colors based on zone type
        const rockColor = new THREE.Color(zoneColors.rock || 0xA9A9A9);
        const snowColor = new THREE.Color(zoneColors.snow || 0xFFFFFF);
        const vegetationColor = new THREE.Color(zoneColors.vegetation || 0x2E8B57);
        
        // For Terrant mountains, use Terrant-specific colors
        const soilColor = this.zoneType === 'Terrant' ? 
            new THREE.Color(zoneColors.soil || 0x8B4513) : rockColor.clone().multiplyScalar(0.7);
        
        // Apply colors based on height
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            
            // Calculate normalized height (0 at bottom, 1 at top)
            const normalizedHeight = y / this.options.height;
            
            // Calculate slope based on normal
            const nx = geometry.attributes.normal.getX(i);
            const ny = geometry.attributes.normal.getY(i);
            const nz = geometry.attributes.normal.getZ(i);
            const slope = Math.abs(ny); // 1 = flat, 0 = vertical
            
            // Determine color based on height and slope
            let color;
            
            if (hasSnow && normalizedHeight > snowLine) {
                // Snow at the peak
                const snowBlend = (normalizedHeight - snowLine) / (1 - snowLine);
                color = rockColor.clone().lerp(snowColor, snowBlend * slope);
            } else if (normalizedHeight < 0.2) {
                // Base of the mountain - more vegetation or soil
                const baseBlend = normalizedHeight / 0.2;
                color = vegetationColor.clone().lerp(soilColor, baseBlend);
            } else {
                // Middle of the mountain - rock
                color = rockColor.clone();
                
                // Add slight variation
                const variation = (Math.random() - 0.5) * 0.1;
                color.r = Math.max(0, Math.min(1, color.r + variation));
                color.g = Math.max(0, Math.min(1, color.g + variation));
                color.b = Math.max(0, Math.min(1, color.b + variation));
            }
            
            // Set color
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    }
    
    /**
     * Add crystal formations to the mountain
     * @param {THREE.Group} mountainGroup - The mountain group
     * @param {object} zoneColors - Colors for the current zone
     */
    addCrystals(mountainGroup, zoneColors) {
        const { baseRadius, height } = this.options;
        
        // Get crystal color based on zone
        const crystalColor = this.zoneType === 'Terrant' ? 
            zoneColors.crystal || 0x7B68EE : // Medium Slate Blue for Terrant
            zoneColors.ice || 0xB0E0E6; // Ice Blue for other zones
        
        // Number of crystal clusters
        const crystalCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < crystalCount; i++) {
            // Random position on the mountain
            const angle = Math.random() * Math.PI * 2;
            const radiusPercent = 0.3 + Math.random() * 0.6; // Not too close to center or edge
            const heightPercent = 0.3 + Math.random() * 0.6; // Middle section of mountain
            
            const x = Math.cos(angle) * baseRadius * radiusPercent;
            const z = Math.sin(angle) * baseRadius * radiusPercent;
            const y = height * heightPercent;
            
            // Create crystal cluster
            const crystalCluster = this.createCrystalCluster(crystalColor);
            crystalCluster.position.set(x, y, z);
            
            // Random rotation
            crystalCluster.rotation.y = Math.random() * Math.PI * 2;
            
            // Random scale
            const scale = 0.5 + Math.random() * 1.5;
            crystalCluster.scale.set(scale, scale, scale);
            
            // Add to mountain group
            mountainGroup.add(crystalCluster);
        }
    }
    
    /**
     * Create a cluster of crystals
     * @param {number} color - Crystal color
     * @returns {THREE.Group} - The crystal cluster group
     */
    createCrystalCluster(color) {
        const clusterGroup = new THREE.Group();
        
        // Number of crystals in the cluster
        const crystalCount = 3 + Math.floor(Math.random() * 4);
        
        // Create material with slight emissive property
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < crystalCount; i++) {
            try {
                // Create crystal geometry - use cone for simplicity
                const height = 1 + Math.random() * 2;
                const radius = 0.2 + Math.random() * 0.3;
                
                // Ensure valid parameters for ConeGeometry
                const validRadius = isNaN(radius) || radius <= 0 ? 0.2 : radius;
                const validHeight = isNaN(height) || height <= 0 ? 1.0 : height;
                const radialSegments = 4 + Math.floor(Math.random() * 3); // Random number of sides
                
                const geometry = new THREE.ConeGeometry(
                    validRadius,
                    validHeight,
                    Math.max(3, radialSegments), // Ensure at least 3 segments
                    1
                );
                
                // Validate geometry
                this.validateGeometry(geometry);
                
                // Create crystal mesh
                const crystal = new THREE.Mesh(geometry, material);
                
                // Position within cluster
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 0.5;
                crystal.position.set(
                    Math.cos(angle) * distance,
                    (Math.random() - 0.5) * 0.5,
                    Math.sin(angle) * distance
                );
                
                // Random rotation
                crystal.rotation.x = (Math.random() - 0.5) * 0.5;
                crystal.rotation.z = (Math.random() - 0.5) * 0.5;
                
                // Add to cluster
                clusterGroup.add(crystal);
            } catch (e) {
                console.warn("Error creating crystal in Mountain:", e);
                // Continue with next crystal
            }
        }
        
        return clusterGroup;
    }
}