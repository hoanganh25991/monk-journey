import * as THREE from 'three';

/**
 * EmberVent - Creates volcanic vents that emit glowing embers and particles
 */
export class EmberVent {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the ember vent mesh
     * @param {THREE.Vector3} position - Position of the vent
     * @param {number} size - Size scale of the vent
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The vent group
     */
    createMesh(position, size, data = {}) {
        const ventGroup = new THREE.Group();
        
        // Create the vent opening (crater-like structure)
        this.createVentStructure(ventGroup, size);
        
        // Add ember particles
        this.addEmberParticles(ventGroup, size);
        
        // Add heat glow
        this.addHeatGlow(ventGroup, size);
        
        // Add sound effect area (for future implementation)
        this.addEffectZone(ventGroup, size);
        
        // Position the entire group
        ventGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(ventGroup);
        
        return ventGroup;
    }
    
    /**
     * Create the physical vent structure
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createVentStructure(group, size) {
        // Create outer rim
        const rimGeometry = new THREE.CylinderGeometry(0.4 * size, 0.5 * size, 0.1 * size, 12);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A4A4A, // Dark gray volcanic rock
            roughness: 0.9,
            metalness: 0.1
        });
        
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.y = 0.05 * size;
        rim.castShadow = true;
        rim.receiveShadow = true;
        group.add(rim);
        
        // Create inner opening with glowing material
        const innerGeometry = new THREE.CylinderGeometry(0.2 * size, 0.3 * size, 0.12 * size, 8);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF4500,
            emissive: 0xFF2200,
            emissiveIntensity: 0.8
        });
        
        const inner = new THREE.Mesh(innerGeometry, innerMaterial);
        inner.position.y = 0.06 * size;
        group.add(inner);
        
        // Add rocky debris around the vent
        this.addDebris(group, size);
    }
    
    /**
     * Add rocky debris around the vent
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addDebris(group, size) {
        const debrisCount = 6 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < debrisCount; i++) {
            const debrisGeometry = new THREE.DodecahedronGeometry(0.05 * size + Math.random() * 0.1 * size, 0);
            const debrisMaterial = new THREE.MeshStandardMaterial({
                color: 0x654321, // Dark brown
                roughness: 0.8
            });
            
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.4 * size + Math.random() * 0.3 * size;
            
            debris.position.x = Math.cos(angle) * radius;
            debris.position.z = Math.sin(angle) * radius;
            debris.position.y = Math.random() * 0.05 * size;
            
            debris.rotation.x = Math.random() * Math.PI;
            debris.rotation.y = Math.random() * Math.PI;
            debris.rotation.z = Math.random() * Math.PI;
            
            debris.castShadow = true;
            debris.receiveShadow = true;
            group.add(debris);
        }
    }
    
    /**
     * Add ember particles rising from the vent
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addEmberParticles(group, size) {
        // Create floating ember particles
        const emberCount = 20;
        const emberGeometry = new THREE.BufferGeometry();
        const emberPositions = [];
        const emberColors = [];
        
        for (let i = 0; i < emberCount; i++) {
            // Create spiral pattern for embers rising
            const angle = (i / emberCount) * Math.PI * 4; // Multiple spirals
            const radius = (Math.random() * 0.15 + 0.05) * size;
            const height = Math.random() * 1.0 * size;
            
            emberPositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Vary ember colors from yellow to red
            const intensity = Math.random();
            emberColors.push(
                1.0, // Red
                0.5 + intensity * 0.5, // Green (varies)
                intensity * 0.3 // Blue (small amount)
            );
        }
        
        emberGeometry.setAttribute('position', new THREE.Float32BufferAttribute(emberPositions, 3));
        emberGeometry.setAttribute('color', new THREE.Float32BufferAttribute(emberColors, 3));
        
        const emberMaterial = new THREE.PointsMaterial({
            size: 0.02 * size,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        const embers = new THREE.Points(emberGeometry, emberMaterial);
        group.add(embers);
        
        // Add larger floating embers as individual objects
        this.addFloatingEmbers(group, size);
    }
    
    /**
     * Add individual floating embers
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addFloatingEmbers(group, size) {
        const floatingEmberCount = 5;
        
        for (let i = 0; i < floatingEmberCount; i++) {
            const emberGeometry = new THREE.SphereGeometry(0.015 * size, 6, 6);
            const emberMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF6600,
                emissive: 0xFF4400,
                emissiveIntensity: 1.0
            });
            
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.1 * size;
            const height = 0.2 * size + Math.random() * 0.6 * size;
            
            ember.position.x = Math.cos(angle) * radius;
            ember.position.z = Math.sin(angle) * radius;
            ember.position.y = height;
            
            group.add(ember);
        }
    }
    
    /**
     * Add heat glow and lighting effects
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addHeatGlow(group, size) {
        // Add main point light
        const mainLight = new THREE.PointLight(0xFF4500, 2, 2 * size);
        mainLight.position.y = 0.1 * size;
        group.add(mainLight);
        
        // Add subtle secondary light for ambiance
        const ambientLight = new THREE.PointLight(0xFF8800, 0.5, 3 * size);
        ambientLight.position.y = 0.5 * size;
        group.add(ambientLight);
        
        // Add heat shimmer effect
        const shimmerGeometry = new THREE.CylinderGeometry(0.3 * size, 0.1 * size, 0.8 * size, 8, 1, true);
        const shimmerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
        shimmer.position.y = 0.4 * size;
        group.add(shimmer);
    }
    
    /**
     * Add effect zone for interactions
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addEffectZone(group, size) {
        // Invisible sphere to define heat effect area
        const zoneGeometry = new THREE.SphereGeometry(1.5 * size, 8, 8);
        const zoneMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            visible: false
        });
        
        const effectZone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        effectZone.userData = {
            type: 'ember_vent_zone',
            heatIntensity: 0.8,
            damageRadius: 1.5 * size
        };
        
        group.add(effectZone);
    }
}