import * as THREE from 'three';

/**
 * PortalModelFactory - Creates and manages Three.js models for teleport portals
 */
export class PortalModelFactory {
    /**
     * Create a new PortalModelFactory
     * @param {THREE.Scene} scene - The Three.js scene
     */
    constructor(scene) {
        this.scene = scene;
        
        // Portal visual properties
        this.portalRadius = 3;
        this.portalHeight = 0.5;
        this.portalColor = 0x00ffff; // Cyan color
        this.portalEmissiveColor = 0x00ffff;
        this.portalEmissiveIntensity = 0.8;
    }
    
    /**
     * Create a portal mesh with spiral/cyclone effects
     * @param {THREE.Vector3} position - The position of the portal
     * @param {number} color - Custom color for the portal (optional)
     * @param {number} emissiveColor - Custom emissive color (optional)
     * @param {number} size - Custom size for the portal (optional)
     * @returns {THREE.Group} - The created portal group with multiple effects
     */
    createPortalMesh(position, color, emissiveColor, size) {
        // Validate position
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number' ||
            isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.warn('Invalid position provided for portal mesh:', position);
            // Create a default position to avoid errors
            position = new THREE.Vector3(0, 0, 0);
        }
        
        // Use custom size or default, ensure it's a valid number
        const portalRadius = (size && !isNaN(size)) ? size : this.portalRadius;
        
        // Create a group to hold all portal effects
        const portalGroup = new THREE.Group();
        
        // 1. Base portal disc
        const baseGeometry = new THREE.CylinderGeometry(
            portalRadius, // Top radius
            portalRadius, // Bottom radius
            this.portalHeight, // Height
            32, // Radial segments
            1, // Height segments
            false // Open ended
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: color || this.portalColor,
            transparent: true,
            opacity: 0.5,
            emissive: emissiveColor || this.portalEmissiveColor,
            emissiveIntensity: this.portalEmissiveIntensity * 0.5,
            side: THREE.DoubleSide
        });
        
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.rotation.x = Math.PI / 2; // Lay flat on the ground
        portalGroup.add(baseMesh);
        
        // 2. Spiral cyclone effect
        const cycloneMesh = this.createCycloneSpiral(portalRadius, color, emissiveColor);
        portalGroup.add(cycloneMesh);
        
        // 3. Inner swirling ring - keep only this one
        const innerRingMesh = this.createSwirlRing(portalRadius * 0.7, color, emissiveColor);
        portalGroup.add(innerRingMesh);
        
        // Remove outer energy ring to clean up outer effects
        
        // Store references for animation
        portalGroup.baseMesh = baseMesh;
        portalGroup.cycloneMesh = cycloneMesh;
        portalGroup.innerRingMesh = innerRingMesh;
        
        // Safely set position
        try {
            portalGroup.position.copy(position);
        } catch (e) {
            console.warn('Error setting portal position:', e);
            portalGroup.position.set(0, 0, 0);
        }
        
        // Add to scene
        this.scene.add(portalGroup);
        
        return portalGroup;
    }
    
    /**
     * Create a spiral cyclone mesh effect - simplified and contained within portal
     * @param {number} radius - Radius of the cyclone
     * @param {number} color - Color of the cyclone
     * @param {number} emissiveColor - Emissive color
     * @returns {THREE.Mesh} - The cyclone mesh
     */
    createCycloneSpiral(radius, color, emissiveColor) {
        // Create a simple flat spiral that stays within the portal
        const spiralPoints = [];
        const spiralTurns = 3; // Number of complete spiral turns
        const pointsPerTurn = 12; // Reduced for better performance
        const totalPoints = spiralTurns * pointsPerTurn;
        
        for (let i = 0; i <= totalPoints; i++) {
            const progress = i / totalPoints; // 0 to 1
            const angle = progress * Math.PI * 2 * spiralTurns; // Multiple turns
            const spiralRadius = radius * (1 - progress * 0.7); // Spiral inward, leaving some outer radius
            const y = Math.sin(progress * Math.PI * 2) * 0.2; // Small vertical wave motion
            
            const x = Math.cos(angle) * spiralRadius;
            const z = Math.sin(angle) * spiralRadius;
            
            spiralPoints.push(new THREE.Vector3(x, y, z));
        }
        
        // Create tube geometry along the spiral path - thinner and more optimized
        const curve = new THREE.CatmullRomCurve3(spiralPoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, totalPoints, 0.05, 6, false);
        
        const cycloneMaterial = new THREE.MeshStandardMaterial({
            color: color || this.portalColor,
            transparent: true,
            opacity: 0.6,
            emissive: emissiveColor || this.portalEmissiveColor,
            emissiveIntensity: this.portalEmissiveIntensity * 0.8,
            side: THREE.DoubleSide
        });
        
        const cycloneMesh = new THREE.Mesh(tubeGeometry, cycloneMaterial);
        // Rotate the spiral 90 degrees to match the flat portal base surface
        cycloneMesh.rotation.x = Math.PI / 2;
        
        return cycloneMesh;
    }
    
    /**
     * Create a swirling inner ring
     * @param {number} radius - Radius of the ring
     * @param {number} color - Color of the ring
     * @param {number} emissiveColor - Emissive color
     * @returns {THREE.Mesh} - The swirl ring mesh
     */
    createSwirlRing(radius, color, emissiveColor) {
        const ringGeometry = new THREE.TorusGeometry(radius, radius * 0.1, 8, 32);
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: color || this.portalColor,
            transparent: true,
            opacity: 0.6,
            emissive: emissiveColor || this.portalEmissiveColor,
            emissiveIntensity: this.portalEmissiveIntensity * 0.8,
            side: THREE.DoubleSide
        });
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        
        return ringMesh;
    }
    
    /**
     * Create an outer energy ring
     * @param {number} radius - Radius of the ring
     * @param {number} color - Color of the ring
     * @param {number} emissiveColor - Emissive color
     * @returns {THREE.Mesh} - The energy ring mesh
     */
    createEnergyRing(radius, color, emissiveColor) {
        const ringGeometry = new THREE.TorusGeometry(radius, radius * 0.05, 4, 24);
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: color || this.portalColor,
            transparent: true,
            opacity: 0.4,
            emissive: emissiveColor || this.portalEmissiveColor,
            emissiveIntensity: this.portalEmissiveIntensity * 1.5,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        
        return ringMesh;
    }
    
    /**
     * Create spiral particles for a portal
     * @param {THREE.Vector3} position - The position of the particles
     * @param {number} color - The color of the particles
     * @param {number} portalRadius - The radius of the portal
     * @returns {THREE.Group} - The created particle systems group
     */
    createPortalParticles(position, color, portalRadius) {
        // Validate position
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number' ||
            isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.warn('Invalid position provided for portal particles:', position);
            // Create a default position to avoid errors
            position = new THREE.Vector3(0, 0, 0);
        }
        
        // Use provided radius or default, ensure it's a valid number
        const radius = (portalRadius && !isNaN(portalRadius)) ? portalRadius : this.portalRadius;
        
        // Create a group to hold multiple particle systems
        const particleGroup = new THREE.Group();
        
        // Only keep spiral inward particles inside the portal
        const spiralParticles = this.createSpiralParticles(position, color, radius);
        particleGroup.add(spiralParticles);
        
        // Store references for animation
        particleGroup.spiralParticles = spiralParticles;
        
        // Set position
        particleGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(particleGroup);
        
        return particleGroup;
    }
    
    /**
     * Create spiral particles that move inward in a cyclone pattern - simplified and contained
     * @param {THREE.Vector3} position - The position center
     * @param {number} color - The color of the particles
     * @param {number} radius - The radius of the effect
     * @returns {THREE.Points} - The spiral particle system
     */
    createSpiralParticles(position, color, radius) {
        const particleCount = 80; // Reduced for better performance
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleAngles = new Float32Array(particleCount); // Store initial angle for each particle
        const particleSpeeds = new Float32Array(particleCount); // Store speed for each particle
        
        // Initialize spiral particles
        for (let i = 0; i < particleCount; i++) {
            const spiralPosition = i / particleCount; // 0 to 1
            const angle = spiralPosition * Math.PI * 4; // Reduced spiral turns
            const particleRadius = radius * (1 - spiralPosition * 0.7); // Spiral inward
            const height = (Math.random() - 0.5) * 0.8; // Much smaller height variation - contained within portal
            
            let x = Math.cos(angle) * particleRadius;
            let y = height;
            let z = Math.sin(angle) * particleRadius;
            
            // Store initial angle and speed for animation
            particleAngles[i] = angle;
            particleSpeeds[i] = 0.3 + Math.random() * 0.4; // Slightly slower for smoother effect
            
            // Safety check for NaN values
            if (isNaN(x)) x = 0;
            if (isNaN(y)) y = 0;
            if (isNaN(z)) z = 0;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('angle', new THREE.BufferAttribute(particleAngles, 1));
        particleGeometry.setAttribute('speed', new THREE.BufferAttribute(particleSpeeds, 1));
        
        // Compute bounding sphere
        particleGeometry.computeBoundingSphere();
        
        // Create particle material with cyclone colors
        const particleMaterial = new THREE.PointsMaterial({
            color: color || this.portalColor,
            size: 0.3, // Slightly smaller particles
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            vertexColors: false
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        return particles;
    }
    
    /**
     * Create swirling outer particles
     * @param {THREE.Vector3} position - The position center
     * @param {number} color - The color of the particles
     * @param {number} radius - The radius of the effect
     * @returns {THREE.Points} - The swirl particle system
     */
    createSwirlParticles(position, color, radius) {
        const particleCount = 80;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Initialize swirling particles in outer ring - contained within portal
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particleRadius = radius * (0.8 + Math.random() * 0.3); // Slightly less spread
            const height = (Math.random() - 0.5) * 0.6; // Much smaller height - contained within portal
            
            let x = Math.cos(angle) * particleRadius;
            let y = height;
            let z = Math.sin(angle) * particleRadius;
            
            // Safety check for NaN values
            if (isNaN(x)) x = 0;
            if (isNaN(y)) y = 0;
            if (isNaN(z)) z = 0;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.computeBoundingSphere();
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: color || this.portalColor,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        return particles;
    }
    
    /**
     * Create ambient floating particles - contained within portal area
     * @param {THREE.Vector3} position - The position center
     * @param {number} color - The color of the particles
     * @param {number} radius - The radius of the effect
     * @returns {THREE.Points} - The ambient particle system
     */
    createAmbientParticles(position, color, radius) {
        const particleCount = 40; // Reduced for better performance
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Initialize ambient particles randomly distributed within portal bounds
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particleRadius = Math.random() * radius * 1.2; // Slightly reduced spread
            const height = (Math.random() - 0.5) * 1.0; // Much smaller height - contained within portal
            
            let x = Math.cos(angle) * particleRadius;
            let y = height;
            let z = Math.sin(angle) * particleRadius;
            
            // Safety check for NaN values
            if (isNaN(x)) x = 0;
            if (isNaN(y)) y = 0;
            if (isNaN(z)) z = 0;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.computeBoundingSphere();
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: color || this.portalColor,
            size: 0.15,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        return particles;
    }
    
    /**
     * Remove a mesh from the scene
     * @param {THREE.Object3D} mesh - The mesh to remove
     */
    removeMesh(mesh) {
        if (!mesh) {
            console.warn('Attempted to remove null or undefined mesh');
            return;
        }
        
        if (!this.scene) {
            console.warn('Scene is not available for mesh removal');
            return;
        }
        
        try {
            // Remove from scene
            this.scene.remove(mesh);
            
            // Dispose of geometry and material to free memory
            if (mesh.geometry) {
                try {
                    mesh.geometry.dispose();
                } catch (e) {
                    console.warn('Error disposing geometry:', e);
                }
            }
            
            if (mesh.material) {
                try {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => {
                            if (material) material.dispose();
                        });
                    } else {
                        mesh.material.dispose();
                    }
                } catch (e) {
                    console.warn('Error disposing material:', e);
                }
            }
        } catch (e) {
            console.error('Error removing mesh from scene:', e);
        }
    }
}