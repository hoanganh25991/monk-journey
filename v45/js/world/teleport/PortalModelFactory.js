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
     * Create a portal mesh
     * @param {THREE.Vector3} position - The position of the portal
     * @param {number} color - Custom color for the portal (optional)
     * @param {number} emissiveColor - Custom emissive color (optional)
     * @param {number} size - Custom size for the portal (optional)
     * @returns {THREE.Mesh} - The created portal mesh
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
        
        // Create portal geometry
        const geometry = new THREE.CylinderGeometry(
            portalRadius, // Top radius
            portalRadius, // Bottom radius
            this.portalHeight, // Height
            32, // Radial segments
            1, // Height segments
            false // Open ended
        );
        
        // Create portal material with glow effect
        const material = new THREE.MeshStandardMaterial({
            color: color || this.portalColor,
            transparent: true,
            opacity: 0.7,
            emissive: emissiveColor || this.portalEmissiveColor,
            emissiveIntensity: this.portalEmissiveIntensity,
            side: THREE.DoubleSide
        });
        
        // Create portal mesh
        const portalMesh = new THREE.Mesh(geometry, material);
        
        // Safely set position
        try {
            portalMesh.position.copy(position);
        } catch (e) {
            console.warn('Error setting portal position:', e);
            portalMesh.position.set(0, 0, 0);
        }
        
        portalMesh.rotation.x = Math.PI / 2; // Lay flat on the ground
        
        // Add to scene
        this.scene.add(portalMesh);
        
        return portalMesh;
    }
    
    /**
     * Create particles for a portal
     * @param {THREE.Vector3} position - The position of the particles
     * @param {number} color - The color of the particles
     * @param {number} portalRadius - The radius of the portal
     * @returns {THREE.Points} - The created particle system
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
        
        // Create particle geometry
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Initialize particle positions in a circle around the portal
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particleRadius = radius * (0.5 + Math.random() * 0.5);
            
            // Calculate positions and ensure they're valid numbers
            let x = position.x + Math.cos(angle) * particleRadius;
            let y = position.y + Math.random() * this.portalHeight;
            let z = position.z + Math.sin(angle) * particleRadius;
            
            // Safety check for NaN values
            if (isNaN(x)) x = 0;
            if (isNaN(y)) y = 0;
            if (isNaN(z)) z = 0;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Explicitly compute bounding sphere after setting attributes
        particleGeometry.computeBoundingSphere();
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: color || this.portalColor,
            size: 0.3,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.scene.add(particles);
        
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