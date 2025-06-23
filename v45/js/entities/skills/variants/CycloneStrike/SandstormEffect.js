import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Sandstorm variant of Cyclone Strike
 * Creates a swirling sandstorm that reduces enemy vision
 * Visual style: Swirling sand particles and dust clouds
 */
export class SandstormEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.visionReduction = true;
        this.visionReductionDuration = 6; // 6 seconds of reduced vision
        
        // Visual properties
        this.sandParticles = null;
        this.dustClouds = [];
        this.sandColor = new THREE.Color(0xd2b48c); // Sandy tan color
    }

    /**
     * Create the Sandstorm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to sand color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.sandColor.clone();
                    });
                } else {
                    child.material.color = this.sandColor.clone();
                }
            }
        });
        
        // Add sand particles
        this.addSandParticles(effectGroup);
        
        // Add dust clouds
        this.addDustClouds(effectGroup);
        
        // Add ground effect
        this.addGroundEffect(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add sand particles to the effect
     * @param {THREE.Group} group - The group to add sand particles to
     */
    addSandParticles(group) {
        const particleCount = 200;
        const baseRadius = this.skill.radius;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions within the cyclone
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius;
            const height = Math.random() * 3;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random sizes
            sizes[i] = 0.03 + Math.random() * 0.07;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: this.sandColor,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.sandParticles = particles;
    }
    
    /**
     * Add dust clouds to the effect
     * @param {THREE.Group} group - The group to add dust clouds to
     */
    addDustClouds(group) {
        const cloudCount = 8;
        const baseRadius = this.skill.radius * 0.7;
        
        for (let i = 0; i < cloudCount; i++) {
            // Create a dust cloud
            const cloud = this.createDustCloud();
            
            // Position in a spiral pattern
            const angle = (i / cloudCount) * Math.PI * 2;
            const heightOffset = (i / cloudCount) * 1.5; // Spiral upward
            
            cloud.position.x = Math.cos(angle) * baseRadius * (0.5 + i/cloudCount);
            cloud.position.z = Math.sin(angle) * baseRadius * (0.5 + i/cloudCount);
            cloud.position.y = heightOffset;
            
            // Store initial position for animation
            cloud.userData.initialAngle = angle;
            cloud.userData.radius = baseRadius * (0.5 + i/cloudCount);
            cloud.userData.height = heightOffset;
            cloud.userData.rotationSpeed = 0.3 + Math.random() * 0.4;
            
            group.add(cloud);
            this.dustClouds.push(cloud);
        }
    }
    
    /**
     * Create a stylized dust cloud using simple geometries
     * @returns {THREE.Group} - The created dust cloud
     */
    createDustCloud() {
        const cloudGroup = new THREE.Group();
        
        // Create several overlapping spheres to form a cloud
        const sphereCount = 4;
        const baseSize = 0.6;
        
        for (let i = 0; i < sphereCount; i++) {
            const size = baseSize * (0.7 + Math.random() * 0.6);
            const sphereGeometry = new THREE.SphereGeometry(size, 8, 8);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: this.sandColor,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.2,
                blending: THREE.AdditiveBlending
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            // Position randomly within the cloud
            sphere.position.x = (Math.random() - 0.5) * baseSize;
            sphere.position.y = (Math.random() - 0.5) * baseSize * 0.5;
            sphere.position.z = (Math.random() - 0.5) * baseSize;
            
            cloudGroup.add(sphere);
        }
        
        return cloudGroup;
    }
    
    /**
     * Add a ground effect to show sand swirling on the ground
     * @param {THREE.Group} group - The group to add the ground effect to
     */
    addGroundEffect(group) {
        const ringGeometry = new THREE.RingGeometry(0.5, this.skill.radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.sandColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        ring.position.y = 0.05; // Just above ground
        
        group.add(ring);
        
        // Add texture to make it look like swirling sand
        const textureSize = 512;
        const data = new Uint8Array(textureSize * textureSize * 4);
        
        // Create a noise pattern
        for (let i = 0; i < textureSize; i++) {
            for (let j = 0; j < textureSize; j++) {
                const index = (i * textureSize + j) * 4;
                
                // Create a swirl pattern
                const x = j / textureSize - 0.5;
                const y = i / textureSize - 0.5;
                const distance = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x);
                
                // Swirl pattern with some noise
                const noise = Math.sin(distance * 50 + angle * 10) * 0.5 + 0.5;
                
                // Set color (sandy color)
                data[index] = 210; // R
                data[index + 1] = 180; // G
                data[index + 2] = 140; // B
                
                // Set alpha based on noise and distance
                data[index + 3] = Math.max(0, Math.min(255, noise * 255 * (1 - distance * 2)));
            }
        }
        
        // Create texture
        const texture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
        texture.needsUpdate = true;
        
        // Apply texture to the ring
        ringMaterial.map = texture;
        ringMaterial.needsUpdate = true;
    }
    
    /**
     * Update the Sandstorm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate sand particles
            if (this.sandParticles && this.sandParticles.geometry) {
                const positions = this.sandParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x * x + z * z);
                    
                    // Move in a spiral pattern
                    const angle = Math.atan2(z, x) + delta * (2 - distance / this.skill.radius);
                    const newDistance = distance * 0.99; // Slowly move inward
                    
                    positions[i * 3] = Math.cos(angle) * newDistance;
                    positions[i * 3 + 1] = y + delta * (0.5 + Math.random() * 0.5); // Move upward
                    positions[i * 3 + 2] = Math.sin(angle) * newDistance;
                    
                    // If particle gets too close to center or too high, reset it
                    if (newDistance < 0.2 || y > 3) {
                        const newAngle = Math.random() * Math.PI * 2;
                        const newRadius = this.skill.radius * 0.8 + Math.random() * this.skill.radius * 0.2;
                        
                        positions[i * 3] = Math.cos(newAngle) * newRadius;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                    }
                }
                
                this.sandParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate dust clouds
            this.dustClouds.forEach(cloud => {
                const initialAngle = cloud.userData.initialAngle || 0;
                const radius = cloud.userData.radius || 1;
                const height = cloud.userData.height || 0;
                const rotationSpeed = cloud.userData.rotationSpeed || 0.3;
                
                // Spiral inward and upward
                const newAngle = initialAngle + this.elapsedTime * rotationSpeed;
                const newRadius = radius * (1 - this.elapsedTime / (this.skill.duration * 1.5));
                
                cloud.position.x = Math.cos(newAngle) * newRadius;
                cloud.position.z = Math.sin(newAngle) * newRadius;
                cloud.position.y = height + this.elapsedTime * 0.3;
                
                // Rotate the cloud
                cloud.rotation.y += delta * 0.2;
            });
        }
    }
    
    /**
     * Apply vision reduction effect to enemies
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyVisionReductionEffect(enemy) {
        if (!enemy || !this.visionReduction) return;
        
        // Apply vision reduction status effect
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect('visionReduction', this.visionReductionDuration);
        }
    }
    
    /**
     * Override the damage application to add vision reduction effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply vision reduction effect
        this.applyVisionReductionEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.sandParticles = null;
        this.dustClouds = [];
        
        // Call parent dispose
        super.dispose();
    }
}