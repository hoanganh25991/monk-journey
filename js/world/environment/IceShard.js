import * as THREE from 'three';

/**
 * IceShard - Creates crystalline ice formations for cold mountain environments
 */
export class IceShard {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the ice shard mesh
     * @param {THREE.Vector3} position - Position of the ice shard
     * @param {number} size - Size scale of the ice shard
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The ice shard group
     */
    createMesh(position, size, data = {}) {
        const iceGroup = new THREE.Group();
        
        // Create main ice crystals
        const crystalCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < crystalCount; i++) {
            this.createIceCrystal(iceGroup, size, i);
        }
        
        // Add frost effects
        this.addFrostEffects(iceGroup, size);
        
        // Add cold mist/particles
        this.addColdMist(iceGroup, size);
        
        // Position the entire group
        iceGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(iceGroup);
        
        return iceGroup;
    }
    
    /**
     * Create individual ice crystal
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} index - Crystal index for variation
     */
    createIceCrystal(group, size, index) {
        // Create tall, angular crystal shapes
        const crystalHeight = 0.6 * size + Math.random() * 0.4 * size;
        const crystalRadius = 0.1 * size + Math.random() * 0.1 * size;
        
        const crystalGeometry = new THREE.ConeGeometry(crystalRadius, crystalHeight, 6);
        
        // Ice material with transparency and refraction
        const iceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xE6F3FF, // Very pale blue
            transmission: 0.9,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            ior: 1.31, // Index of refraction for ice
            reflectivity: 0.9
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, iceMaterial);
        
        // Position crystals
        if (index > 0) {
            const angle = (index / 3) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 0.15 * size + Math.random() * 0.1 * size;
            crystal.position.x = Math.cos(angle) * radius;
            crystal.position.z = Math.sin(angle) * radius;
        }
        
        crystal.position.y = crystalHeight / 2;
        
        // Add slight random tilt
        crystal.rotation.x = (Math.random() - 0.5) * 0.2;
        crystal.rotation.z = (Math.random() - 0.5) * 0.2;
        
        crystal.castShadow = true;
        crystal.receiveShadow = true;
        
        group.add(crystal);
        
        // Add internal structure lines
        this.addCrystalStructure(group, crystal, crystalHeight, size);
    }
    
    /**
     * Add internal crystal structure
     * @param {THREE.Group} group - The group to add to
     * @param {THREE.Mesh} crystal - The crystal mesh
     * @param {number} height - Crystal height
     * @param {number} size - Overall size scale
     */
    addCrystalStructure(group, crystal, height, size) {
        // Add internal lines to show crystal structure
        const lineCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < lineCount; i++) {
            const points = [];
            
            // Create lines from base to top
            points.push(new THREE.Vector3(
                crystal.position.x + (Math.random() - 0.5) * 0.05 * size,
                0,
                crystal.position.z + (Math.random() - 0.5) * 0.05 * size
            ));
            
            points.push(new THREE.Vector3(
                crystal.position.x + (Math.random() - 0.5) * 0.03 * size,
                height,
                crystal.position.z + (Math.random() - 0.5) * 0.03 * size
            ));
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xB0E0E6, // Powder blue
                transparent: true,
                opacity: 0.6
            });
            
            const structureLine = new THREE.Line(lineGeometry, lineMaterial);
            group.add(structureLine);
        }
        
        // Add facet planes
        this.addCrystalFacets(group, crystal, height, size);
    }
    
    /**
     * Add crystal facets for more realistic appearance
     * @param {THREE.Group} group - The group to add to
     * @param {THREE.Mesh} crystal - The crystal mesh
     * @param {number} height - Crystal height
     * @param {number} size - Overall size scale
     */
    addCrystalFacets(group, crystal, height, size) {
        const facetCount = 4 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < facetCount; i++) {
            const facetGeometry = new THREE.PlaneGeometry(0.08 * size, height * 0.6);
            const facetMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xF0F8FF,
                transmission: 0.7,
                roughness: 0.0,
                metalness: 0.0,
                clearcoat: 1.0,
                reflectivity: 1.0,
                side: THREE.DoubleSide
            });
            
            const facet = new THREE.Mesh(facetGeometry, facetMaterial);
            
            const angle = (i / facetCount) * Math.PI * 2;
            const radius = 0.08 * size;
            
            facet.position.x = crystal.position.x + Math.cos(angle) * radius;
            facet.position.z = crystal.position.z + Math.sin(angle) * radius;
            facet.position.y = height / 2;
            
            facet.rotation.y = angle;
            
            group.add(facet);
        }
    }
    
    /**
     * Add frost effects around the ice
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addFrostEffects(group, size) {
        // Add frost crystals on the ground
        const frostCount = 8 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < frostCount; i++) {
            const frostGeometry = new THREE.PlaneGeometry(0.05 * size, 0.05 * size);
            const frostMaterial = new THREE.MeshBasicMaterial({
                color: 0xF8F8FF,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const frost = new THREE.Mesh(frostGeometry, frostMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 * size + Math.random() * 0.3 * size;
            
            frost.position.x = Math.cos(angle) * radius;
            frost.position.z = Math.sin(angle) * radius;
            frost.position.y = 0.01 * size;
            
            frost.rotation.x = -Math.PI / 2; // Lay flat
            frost.rotation.z = Math.random() * Math.PI * 2;
            
            group.add(frost);
        }
        
        // Add base ice patch
        const baseGeometry = new THREE.CylinderGeometry(0.4 * size, 0.4 * size, 0.02 * size, 12);
        const baseMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xE0F6FF,
            transmission: 0.6,
            roughness: 0.2,
            metalness: 0.0,
            clearcoat: 0.8
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.01 * size;
        base.receiveShadow = true;
        
        group.add(base);
    }
    
    /**
     * Add cold mist particles
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addColdMist(group, size) {
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4 * size;
            const height = Math.random() * 0.3 * size;
            
            particlePositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xE6F3FF,
            size: 0.03 * size,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Add subtle glow effect
        const glowGeometry = new THREE.SphereGeometry(0.6 * size, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xE6F3FF,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.3 * size;
        group.add(glow);
        
        // Add point light for cold blue lighting
        const light = new THREE.PointLight(0xB0E0E6, 0.5, 1.5 * size);
        light.position.y = 0.3 * size;
        group.add(light);
    }
}