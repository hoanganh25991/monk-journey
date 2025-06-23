import * as THREE from 'three';
import { ImprisonedFistsEffect } from '../../ImprisonedFistsEffect.js';

/**
 * Effect for the Thunderous Grip variant of Imprisoned Fists
 * Each strike releases a shockwave that stuns nearby enemies
 * Visual style: Electric blue/purple chains with lightning arcs
 */
export class ThunderousGripEffect extends ImprisonedFistsEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.stunDuration = 3; // 3 seconds of stun
        this.shockwaveRadius = 4; // Radius of the shockwave
        this.shockwaveDamage = 15; // Damage dealt by the shockwave
        
        // Visual properties
        this.lightningArcs = [];
        this.electricParticles = [];
        this.shockwaves = [];
    }

    /**
     * Create the Thunderous Grip effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base effect color to electric blue/purple
        effectGroup.children.forEach(child => {
            if (child.material) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.set(0x6600ff); // Electric purple color
                }
            }
        });
        
        // Modify particle system colors to electric colors
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            const color = new THREE.Color(0x6600ff); // Electric purple color
            
            for (let i = 0; i < colors.length / 3; i++) {
                colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            }
            
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
        
        // Modify ground indicator color
        if (this.groundIndicator) {
            this.groundIndicator.material.color.set(0x6600ff); // Electric purple color
        }
        
        // Add electric particles
        this.addElectricParticles(effectGroup);
        
        // Add lightning arcs
        this.addLightningArcs(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add electric particles to the effect
     * @param {THREE.Group} group - The group to add electric particles to
     */
    addElectricParticles(group) {
        const particleCount = 40;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create electric colors
        const electricColors = [
            new THREE.Color(0x6600ff), // Purple
            new THREE.Color(0x0066ff), // Blue
            new THREE.Color(0x00ccff), // Light blue
            new THREE.Color(0xaaaaff)  // Pale blue
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the beam
            const distance = Math.random() * 5; // Length of the beam
            const angle = Math.random() * Math.PI * 2; // Random angle around the beam
            const radius = (this.radius / 10) * (1 + Math.random()); // Vary the radius
            
            // Position particles in a cloud around the beam
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = distance;
            
            // Random electric color
            const colorIndex = Math.floor(Math.random() * electricColors.length);
            const color = electricColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - smaller for electric particles
            sizes[i] = 0.1 + Math.random() * 0.15;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const electricParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        group.add(electricParticleSystem);
        
        // Store for animation
        this.electricParticles.push(electricParticleSystem);
    }
    
    /**
     * Add lightning arcs to the effect
     * @param {THREE.Group} group - The group to add lightning arcs to
     */
    addLightningArcs(group) {
        const arcCount = 4;
        
        for (let i = 0; i < arcCount; i++) {
            // Create a lightning arc using line segments
            const points = this.generateLightningPath();
            const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const arcMaterial = new THREE.LineBasicMaterial({
                color: 0xaaaaff, // Pale blue
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const arc = new THREE.Line(arcGeometry, arcMaterial);
            
            // Position around the beam
            const angle = (i / arcCount) * Math.PI * 2;
            arc.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                0
            );
            
            // Random rotation for variety
            arc.rotation.x = Math.random() * Math.PI;
            arc.rotation.y = Math.random() * Math.PI;
            arc.rotation.z = Math.random() * Math.PI;
            
            group.add(arc);
            
            // Store for animation and cleanup
            this.lightningArcs.push({
                line: arc,
                timeOffset: Math.random() * Math.PI * 2,
                regenerateTime: 0.2 + Math.random() * 0.3 // Time between regenerating the arc
            });
        }
    }
    
    /**
     * Generate a lightning path with jagged segments
     * @returns {THREE.Vector3[]} - Array of points forming the lightning path
     */
    generateLightningPath() {
        const points = [];
        const segmentCount = 10;
        const length = 2 + Math.random() * 2; // Length between 2 and 4
        
        // Start point
        points.push(new THREE.Vector3(0, 0, 0));
        
        // Generate jagged segments
        for (let i = 1; i < segmentCount; i++) {
            const t = i / segmentCount;
            
            // Main direction is along z-axis (beam direction)
            const z = t * length;
            
            // Add randomness to x and y for jagged effect
            const jitter = 0.1 + (0.2 * t); // Increasing jitter along the path
            const x = (Math.random() - 0.5) * jitter;
            const y = (Math.random() - 0.5) * jitter;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // End point
        points.push(new THREE.Vector3(0, 0, length));
        
        return points;
    }
    
    /**
     * Create a visual lock effect for an enemy with electric effects
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        // Call the parent method to create the base lock effect
        super.createLockEffect(enemy);
        
        const enemyPosition = enemy.getPosition();
        
        // Create a shockwave effect
        this.createShockwave(enemyPosition);
        
        // Apply stun effect to nearby enemies
        this.applyShockwaveEffect(enemyPosition);
        
        // Apply stun effect to the primary target
        this.applyStunEffect(enemy);
    }
    
    /**
     * Create a shockwave effect
     * @param {THREE.Vector3} position - Position to create the shockwave at
     */
    createShockwave(position) {
        // Create a ring geometry for the shockwave
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x6600ff, // Electric purple
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Store initial creation time for animation
        ring.userData = {
            creationTime: this.elapsedTime,
            maxRadius: this.shockwaveRadius,
            duration: 1.0 // Duration of the shockwave expansion
        };
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(ring);
            
            // Store for animation and cleanup
            this.shockwaves.push(ring);
        }
    }
    
    /**
     * Apply shockwave effect to enemies in radius
     * @param {THREE.Vector3} position - Center position of the shockwave
     */
    applyShockwaveEffect(position) {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // Get enemies within shockwave radius
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            position,
            this.shockwaveRadius
        );
        
        // Apply stun and damage to each enemy
        enemies.forEach(enemy => {
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // Apply damage
            // enemy.takeDamage(this.shockwaveDamage);
            
            // Apply stun effect
            this.applyStunEffect(enemy);
            
            // Create electric visual effect on the enemy
            this.createElectricEffect(enemy.getPosition());
        });
    }
    
    /**
     * Apply stun effect to an enemy
     * @param {Enemy} enemy - The enemy to stun
     */
    applyStunEffect(enemy) {
        // Apply stun status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                type: 'stun',
                duration: this.stunDuration,
                source: 'ThunderousGrip'
            });
        }
    }
    
    /**
     * Create an electric visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createElectricEffect(position) {
        // Create a burst of electric particles
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create electric colors
        const electricColors = [
            new THREE.Color(0x6600ff), // Purple
            new THREE.Color(0x0066ff), // Blue
            new THREE.Color(0x00ccff), // Light blue
            new THREE.Color(0xaaaaff)  // Pale blue
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere
            const radius = 0.3 + Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
            
            // Random electric color
            const colorIndex = Math.floor(Math.random() * electricColors.length);
            const color = electricColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(particles);
            
            // Remove after a short duration
            setTimeout(() => {
                if (this.skill.game && this.skill.game.scene) {
                    this.skill.game.scene.remove(particles);
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            }, 500); // 0.5 seconds
        }
    }
    
    /**
     * Update the Thunderous Grip effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate electric particles
            this.electricParticles.forEach(particles => {
                const positions = particles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Erratic movement for electric particles
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Add random jittery movement
                    positions[i * 3] = x + (Math.random() - 0.5) * delta * 1.0;
                    positions[i * 3 + 1] = y + (Math.random() - 0.5) * delta * 1.0;
                    positions[i * 3 + 2] = z + (Math.random() - 0.5) * delta * 1.0;
                    
                    // Reset particles that move too far from the beam
                    const distFromCenter = Math.sqrt(x*x + y*y);
                    if (distFromCenter > this.radius / 5 || z < 0 || z > 5) {
                        // Reset to a position near the beam
                        const angle = Math.random() * Math.PI * 2;
                        const radius = (this.radius / 10) * (1 + Math.random());
                        positions[i * 3] = Math.cos(angle) * radius;
                        positions[i * 3 + 1] = Math.sin(angle) * radius;
                        positions[i * 3 + 2] = Math.random() * 5;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            });
            
            // Animate lightning arcs
            this.lightningArcs.forEach(arc => {
                arc.regenerateTime -= delta;
                
                // Regenerate the lightning path periodically
                if (arc.regenerateTime <= 0) {
                    // Generate new path
                    const points = this.generateLightningPath();
                    
                    // Update the geometry
                    arc.line.geometry.dispose();
                    arc.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
                    
                    // Reset timer
                    arc.regenerateTime = 0.1 + Math.random() * 0.2;
                    
                    // Flicker opacity
                    arc.line.material.opacity = 0.5 + Math.random() * 0.5;
                }
            });
            
            // Animate shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const shockwave = this.shockwaves[i];
                const userData = shockwave.userData;
                
                // Calculate progress (0 to 1)
                const age = this.elapsedTime - userData.creationTime;
                const progress = Math.min(1.0, age / userData.duration);
                
                // Expand the ring
                const currentRadius = progress * userData.maxRadius;
                
                // Update the geometry
                if (shockwave.geometry) {
                    shockwave.geometry.dispose();
                }
                shockwave.geometry = new THREE.RingGeometry(
                    currentRadius - 0.1,
                    currentRadius,
                    32
                );
                
                // Fade out as it expands
                shockwave.material.opacity = 0.8 * (1 - progress);
                
                // Remove when complete
                if (progress >= 1.0) {
                    if (this.skill.game && this.skill.game.scene) {
                        this.skill.game.scene.remove(shockwave);
                        shockwave.geometry.dispose();
                        shockwave.material.dispose();
                    }
                    this.shockwaves.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up electric particles
        this.electricParticles = [];
        
        // Clean up lightning arcs
        this.lightningArcs.forEach(arc => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(arc.line);
                if (arc.line.geometry) arc.line.geometry.dispose();
                if (arc.line.material) arc.line.material.dispose();
            }
        });
        this.lightningArcs = [];
        
        // Clean up shockwaves
        this.shockwaves.forEach(shockwave => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(shockwave);
                if (shockwave.geometry) shockwave.geometry.dispose();
                if (shockwave.material) shockwave.material.dispose();
            }
        });
        this.shockwaves = [];
        
        // Call parent dispose
        super.dispose();
    }
}