import * as THREE from 'three';
import { FlyingDragonEffect } from '../../FlyingDragonEffect.js';

/**
 * Effect for the Gale Dragon variant of Flying Dragon
 * Creates a wind dragon that deflects projectiles
 * Visual style: Swirling wind currents and air distortion
 */
export class GaleDragonEffect extends FlyingDragonEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.projectileDeflection = true;
        this.deflectionRadius = 3; // 3 unit radius for deflection
        
        // Visual properties
        this.windStreams = [];
        this.airParticles = null;
        this.deflectionField = null;
        this.windColor = new THREE.Color(0xccffee); // Light cyan-green
    }

    /**
     * Create the Gale Dragon effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to wind color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.windColor.clone();
                    });
                } else {
                    child.material.color = this.windColor.clone();
                }
            }
        });
        
        // Add wind streams
        this.addWindStreams(effectGroup);
        
        // Add air particles
        this.addAirParticles(effectGroup);
        
        // Add deflection field
        this.addDeflectionField(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add wind streams to the effect
     * @param {THREE.Group} group - The group to add wind streams to
     */
    addWindStreams(group) {
        const streamCount = 8;
        
        for (let i = 0; i < streamCount; i++) {
            // Create a wind stream
            const stream = this.createWindStream();
            
            // Position around the dragon
            const angle = (i / streamCount) * Math.PI * 2;
            const radius = 0.7;
            stream.position.x = Math.cos(angle) * radius;
            stream.position.z = Math.sin(angle) * radius;
            stream.position.y = 0.5 + Math.random() * 0.5;
            
            // Rotate to follow the circle
            stream.rotation.y = angle + Math.PI / 2;
            
            // Store initial angle for animation
            stream.userData.angle = angle;
            stream.userData.radius = radius;
            stream.userData.rotationSpeed = 0.5 + Math.random() * 0.5;
            
            group.add(stream);
            this.windStreams.push(stream);
        }
    }
    
    /**
     * Create a stylized wind stream using simple geometries
     * @returns {THREE.Group} - The created wind stream
     */
    createWindStream() {
        const streamGroup = new THREE.Group();
        
        // Create a curved path for the wind stream
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0.5, 0),
            new THREE.Vector3(2, 0.3, 0),
            new THREE.Vector3(3, 0, 0)
        );
        
        // Create geometry from the curve
        const points = curve.getPoints(20);
        const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create material
        const streamMaterial = new THREE.LineBasicMaterial({
            color: this.windColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        // Create line
        const streamLine = new THREE.Line(streamGeometry, streamMaterial);
        streamGroup.add(streamLine);
        
        // Add small particles along the stream
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const point = curve.getPoint(t);
            
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.windColor,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(point);
            
            // Store position along curve for animation
            particle.userData.curvePosition = t;
            particle.userData.speed = 0.5 + Math.random() * 0.5;
            
            streamGroup.add(particle);
        }
        
        return streamGroup;
    }
    
    /**
     * Add air particles to the effect
     * @param {THREE.Group} group - The group to add air particles to
     */
    addAirParticles(group) {
        const particleCount = 100;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Position particles in a sphere around the dragon
        for (let i = 0; i < particleCount; i++) {
            // Random position within a sphere
            const radius = Math.random() * this.deflectionRadius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Random sizes
            sizes[i] = 0.03 + Math.random() * 0.05;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: this.windColor,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.airParticles = particles;
    }
    
    /**
     * Add a deflection field to the effect
     * @param {THREE.Group} group - The group to add the deflection field to
     */
    addDeflectionField(group) {
        // Create a sphere for the deflection field
        const fieldGeometry = new THREE.SphereGeometry(this.deflectionRadius, 32, 32);
        const fieldMaterial = new THREE.MeshBasicMaterial({
            color: this.windColor,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        group.add(field);
        
        // Store for animation
        this.deflectionField = field;
    }
    
    /**
     * Update the Gale Dragon effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate wind streams
            this.windStreams.forEach(stream => {
                const angle = stream.userData.angle || 0;
                const radius = stream.userData.radius || 1;
                const rotationSpeed = stream.userData.rotationSpeed || 0.5;
                
                // Rotate around the center
                const newAngle = angle + this.elapsedTime * rotationSpeed;
                stream.position.x = Math.cos(newAngle) * radius;
                stream.position.z = Math.sin(newAngle) * radius;
                
                // Update rotation to follow the circle
                stream.rotation.y = newAngle + Math.PI / 2;
                
                // Animate particles along the stream
                stream.children.forEach(child => {
                    if (child.userData.curvePosition !== undefined) {
                        const speed = child.userData.speed || 0.5;
                        let position = child.userData.curvePosition + delta * speed;
                        
                        // Loop back to start when reaching the end
                        if (position > 1) {
                            position = position % 1;
                        }
                        
                        // Update position along the curve
                        const curve = new THREE.CubicBezierCurve3(
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(1, 0.5, 0),
                            new THREE.Vector3(2, 0.3, 0),
                            new THREE.Vector3(3, 0, 0)
                        );
                        
                        const point = curve.getPoint(position);
                        child.position.copy(point);
                        
                        // Store updated position
                        child.userData.curvePosition = position;
                    }
                });
            });
            
            // Animate air particles
            if (this.airParticles && this.airParticles.geometry) {
                const positions = this.airParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x * x + y * y + z * z);
                    
                    // Move in a circular pattern
                    const speed = 0.5 * (1 - distance / this.deflectionRadius);
                    
                    // Calculate rotation around y-axis
                    const angle = Math.atan2(z, x) + delta * speed;
                    
                    // Update position
                    positions[i * 3] = Math.cos(angle) * distance;
                    positions[i * 3 + 2] = Math.sin(angle) * distance;
                    
                    // Add some vertical movement
                    positions[i * 3 + 1] += delta * (Math.random() - 0.5) * 0.2;
                    
                    // Keep within bounds
                    if (Math.abs(positions[i * 3 + 1]) > this.deflectionRadius) {
                        positions[i * 3 + 1] = Math.sign(positions[i * 3 + 1]) * this.deflectionRadius;
                    }
                }
                
                this.airParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate deflection field
            if (this.deflectionField) {
                // Rotate the field
                this.deflectionField.rotation.y += delta * 0.2;
                this.deflectionField.rotation.x += delta * 0.1;
                
                // Pulse the field
                const pulseFactor = 1 + 0.05 * Math.sin(this.elapsedTime * 3);
                this.deflectionField.scale.set(pulseFactor, pulseFactor, pulseFactor);
            }
            
            // Check for projectiles to deflect
            if (this.projectileDeflection && this.skill.game) {
                this.checkProjectileDeflection();
            }
        }
    }
    
    /**
     * Check for projectiles to deflect
     */
    checkProjectileDeflection() {
        // This would need to be implemented based on the game's projectile system
        // Here's a placeholder implementation
        if (this.skill.game.projectileManager) {
            const projectiles = this.skill.game.projectileManager.getProjectilesNearPosition(
                this.effect.position,
                this.deflectionRadius
            );
            
            projectiles.forEach(projectile => {
                // Only deflect enemy projectiles
                if (projectile.isEnemyProjectile) {
                    this.deflectProjectile(projectile);
                }
            });
        }
    }
    
    /**
     * Deflect a projectile
     * @param {Projectile} projectile - The projectile to deflect
     */
    deflectProjectile(projectile) {
        // This would need to be implemented based on the game's projectile system
        // Here's a placeholder implementation
        if (projectile.deflect) {
            projectile.deflect();
            
            // Create a visual effect for the deflection
            this.createDeflectionVisualEffect(projectile.getPosition());
        }
    }
    
    /**
     * Create a visual effect for projectile deflection
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createDeflectionVisualEffect(position) {
        if (!this.skill.game) return;
        
        // Create a burst effect
        const burstGeometry = new THREE.RingGeometry(0.1, 0.5, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: this.windColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(position);
        
        // Orient to face random direction
        burst.rotation.x = Math.random() * Math.PI;
        burst.rotation.y = Math.random() * Math.PI;
        burst.rotation.z = Math.random() * Math.PI;
        
        // Add to scene
        this.skill.game.scene.add(burst);
        
        // Animate the burst
        let scale = 1;
        let opacity = burst.material.opacity;
        
        const animate = () => {
            scale += 0.1;
            opacity -= 0.05;
            
            burst.scale.set(scale, scale, scale);
            burst.material.opacity = Math.max(0, opacity);
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.skill.game.scene.remove(burst);
                burst.geometry.dispose();
                burst.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Apply deflection field effect
     */
    applyDeflectionField() {
        if (!this.skill.game || !this.projectileDeflection) return;
        
        // This would need to be implemented based on the game's systems
        // Here's a placeholder implementation
        if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
            this.skill.game.hudManager.showNotification(`Projectile deflection field active for ${this.skill.duration} seconds!`);
        }
    }
    
    /**
     * Override the activate method to apply deflection field
     */
    activate() {
        super.activate();
        this.applyDeflectionField();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.windStreams = [];
        this.airParticles = null;
        this.deflectionField = null;
        
        // Call parent dispose
        super.dispose();
    }
}