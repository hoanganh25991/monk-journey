import * as THREE from 'three';

/**
 * PineTree - Creates coniferous trees for mountain environments
 */
export class PineTree {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the pine tree mesh
     * @param {THREE.Vector3} position - Position of the tree
     * @param {number} size - Size scale of the tree
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The tree group
     */
    createMesh(position, size, data = {}) {
        const treeGroup = new THREE.Group();
        
        // Create the trunk
        this.createTrunk(treeGroup, size);
        
        // Create the conical foliage layers
        this.createFoliage(treeGroup, size);
        
        // Add some snow if in winter/mountain setting
        if (data.hasSnow || Math.random() > 0.7) {
            this.addSnow(treeGroup, size);
        }
        
        // Position the entire group
        treeGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(treeGroup);
        
        return treeGroup;
    }
    
    /**
     * Create the tree trunk
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createTrunk(group, size) {
        const trunkHeight = 0.8 * size;
        const trunkGeometry = new THREE.CylinderGeometry(
            0.08 * size, // top radius
            0.12 * size, // bottom radius
            trunkHeight,
            8
        );
        
        // MeshLambertMaterial doesn't support roughness property
        const trunkMaterial = new THREE.MeshLambertMaterial({
            color: 0x4A4A4A // Dark gray-brown
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        group.add(trunk);
        
        // Add bark texture details
        this.addBarkTexture(group, size, trunkHeight);
    }
    
    /**
     * Add bark texture to the trunk
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} trunkHeight - Height of the trunk
     */
    addBarkTexture(group, size, trunkHeight) {
        const barkLineCount = 8;
        
        for (let i = 0; i < barkLineCount; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.01 * size, trunkHeight * 0.8, 0.01 * size);
            const lineMaterial = new THREE.MeshLambertMaterial({
                color: 0x3A3A3A // Darker than trunk
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            
            const angle = (i / barkLineCount) * Math.PI * 2;
            line.position.x = Math.cos(angle) * 0.11 * size;
            line.position.z = Math.sin(angle) * 0.11 * size;
            line.position.y = trunkHeight / 2;
            
            group.add(line);
        }
    }
    
    /**
     * Create the conical foliage layers
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createFoliage(group, size) {
        const layerCount = 4 + Math.floor(Math.random() * 2);
        const baseRadius = 0.6 * size;
        const totalHeight = 1.2 * size;
        
        for (let i = 0; i < layerCount; i++) {
            const layerRatio = (layerCount - i) / layerCount;
            const layerRadius = baseRadius * layerRatio;
            const layerHeight = 0.4 * size;
            
            // Create cone for each layer
            const coneGeometry = new THREE.ConeGeometry(layerRadius, layerHeight, 8);
            // MeshLambertMaterial doesn't support roughness property
            const foliageMaterial = new THREE.MeshLambertMaterial({
                color: this.getFoliageColor(i, layerCount)
            });
            
            const cone = new THREE.Mesh(coneGeometry, foliageMaterial);
            cone.position.y = 0.5 * size + (i * 0.25 * size);
            
            // Add slight random rotation for natural look
            cone.rotation.y = Math.random() * Math.PI * 2;
            
            cone.castShadow = true;
            cone.receiveShadow = true;
            
            group.add(cone);
            
            // Add some needle details
            this.addNeedleDetails(group, cone, layerRadius, size);
        }
    }
    
    /**
     * Get foliage color with variation
     * @param {number} layerIndex - Current layer index
     * @param {number} totalLayers - Total number of layers
     * @returns {number} - Color value
     */
    getFoliageColor(layerIndex, totalLayers) {
        // Darker green at bottom, lighter at top
        const baseColor = new THREE.Color(0x1F4F2F); // Dark green
        const topColor = new THREE.Color(0x2F5F3F); // Slightly lighter green
        
        const ratio = layerIndex / totalLayers;
        const color = baseColor.clone().lerp(topColor, ratio);
        
        return color.getHex();
    }
    
    /**
     * Add needle details to foliage layers
     * @param {THREE.Group} group - The group to add to
     * @param {THREE.Mesh} cone - The cone mesh
     * @param {number} radius - Layer radius
     * @param {number} size - Overall size scale
     */
    addNeedleDetails(group, cone, radius, size) {
        const needleCount = Math.floor(radius * 20);
        
        for (let i = 0; i < needleCount; i++) {
            const needleGeometry = new THREE.CylinderGeometry(0.002 * size, 0.002 * size, 0.05 * size, 3);
            const needleMaterial = new THREE.MeshLambertMaterial({
                color: 0x2A5A3A // Needle green
            });
            
            const needle = new THREE.Mesh(needleGeometry, needleMaterial);
            
            // Position needles around the cone
            const angle = Math.random() * Math.PI * 2;
            const distance = radius * (0.7 + Math.random() * 0.3);
            const height = cone.position.y + (Math.random() - 0.5) * 0.3 * size;
            
            needle.position.x = Math.cos(angle) * distance;
            needle.position.z = Math.sin(angle) * distance;
            needle.position.y = height;
            
            // Orient needles outward and slightly downward
            needle.lookAt(
                needle.position.x * 1.5,
                needle.position.y - 0.1 * size,
                needle.position.z * 1.5
            );
            
            group.add(needle);
        }
    }
    
    /**
     * Add snow to the tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addSnow(group, size) {
        // Add snow on branches
        const snowLayers = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < snowLayers; i++) {
            const snowRadius = (0.5 - i * 0.1) * size;
            const snowGeometry = new THREE.CylinderGeometry(snowRadius, snowRadius, 0.05 * size, 8);
            const snowMaterial = new THREE.MeshLambertMaterial({
                color: 0xF0F8FF, // Alice blue (snow)
                emissive: 0xF0F8FF,
                emissiveIntensity: 0.1
            });
            
            const snow = new THREE.Mesh(snowGeometry, snowMaterial);
            snow.position.y = 0.6 * size + (i * 0.3 * size);
            
            group.add(snow);
        }
        
        // Add snow particles around the tree
        this.addSnowParticles(group, size);
    }
    
    /**
     * Add snow particles around the tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addSnowParticles(group, size) {
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.8 * size;
            const height = Math.random() * 1.5 * size;
            
            particlePositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.02 * size,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
    }
}