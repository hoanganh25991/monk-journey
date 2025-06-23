import * as THREE from 'three';
import { ImprisonedFistsEffect } from '../../ImprisonedFistsEffect.js';

/**
 * Effect for the Gale Chains variant of Imprisoned Fists
 * Increases the range and speed of the strike, allowing for rapid engagement
 * Visual style: Wind-like white/green chains with air currents
 */
export class GaleChainsEffect extends ImprisonedFistsEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.rangeMultiplier = 1.5; // 50% increased range
        this.speedMultiplier = 1.8; // 80% increased speed
        
        // Visual properties
        this.windParticles = [];
        this.airCurrents = [];
    }

    /**
     * Create the Gale Chains effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Apply range and speed multipliers to the skill
        const originalRange = this.skill.range;
        const originalSpeed = this.moveSpeed;
        
        this.skill.range = originalRange * this.rangeMultiplier;
        this.moveSpeed = originalSpeed * this.speedMultiplier;
        
        // Create base effect with modified range
        const effectGroup = super.create(position, direction);
        
        // Restore original values to avoid affecting other instances
        this.skill.range = originalRange;
        
        // Modify the base effect color to light green/white
        effectGroup.children.forEach(child => {
            if (child.material) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.set(0xccffcc); // Light green color
                }
            }
        });
        
        // Modify particle system colors to wind colors
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            const color = new THREE.Color(0xccffcc); // Light green color
            
            for (let i = 0; i < colors.length / 3; i++) {
                colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            }
            
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
        
        // Modify ground indicator color
        if (this.groundIndicator) {
            this.groundIndicator.material.color.set(0xccffcc); // Light green color
        }
        
        // Add wind particles
        this.addWindParticles(effectGroup);
        
        // Add air currents
        this.addAirCurrents(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add wind particles to the effect
     * @param {THREE.Group} group - The group to add wind particles to
     */
    addWindParticles(group) {
        const particleCount = 70; // More particles for a wind effect
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create wind colors
        const windColors = [
            new THREE.Color(0xffffff), // White
            new THREE.Color(0xeeffee), // Very light green
            new THREE.Color(0xccffcc), // Light green
            new THREE.Color(0xaaffaa)  // Pale green
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around the beam
            const distance = Math.random() * 5; // Length of the beam
            const angle = Math.random() * Math.PI * 2; // Random angle around the beam
            const radius = (this.radius / 8) * (1 + Math.random() * 2); // Wider spread for wind
            
            // Position particles in a cloud around the beam
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = distance;
            
            // Random wind color
            const colorIndex = Math.floor(Math.random() * windColors.length);
            const color = windColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - smaller for wind particles
            sizes[i] = 0.08 + Math.random() * 0.12;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const windParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        group.add(windParticleSystem);
        
        // Store for animation
        this.windParticles.push(windParticleSystem);
    }
    
    /**
     * Add air currents to the effect
     * @param {THREE.Group} group - The group to add air currents to
     */
    addAirCurrents(group) {
        const currentCount = 6;
        
        for (let i = 0; i < currentCount; i++) {
            // Create a curved path for the air current
            const curve = this.generateAirCurrentCurve();
            
            // Create geometry from the curve
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                20,         // tubularSegments
                0.03,       // radius
                8,          // radialSegments
                false       // closed
            );
            
            // Create material for the air current
            const tubeMaterial = new THREE.MeshBasicMaterial({
                color: 0xccffcc, // Light green
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            
            // Create the air current mesh
            const airCurrent = new THREE.Mesh(tubeGeometry, tubeMaterial);
            
            // Position around the beam
            const angle = (i / currentCount) * Math.PI * 2;
            airCurrent.position.set(
                Math.cos(angle) * 0.1,
                Math.sin(angle) * 0.1,
                0
            );
            
            // Random rotation for variety
            airCurrent.rotation.x = Math.random() * Math.PI;
            airCurrent.rotation.y = Math.random() * Math.PI;
            airCurrent.rotation.z = Math.random() * Math.PI;
            
            group.add(airCurrent);
            
            // Store for animation and cleanup
            this.airCurrents.push({
                mesh: airCurrent,
                curve: curve,
                speed: 0.5 + Math.random() * 1.0,
                offset: Math.random() * Math.PI * 2,
                regenerateTime: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    /**
     * Generate a curve for an air current
     * @returns {THREE.CatmullRomCurve3} - The generated curve
     */
    generateAirCurrentCurve() {
        // Create points for the curve
        const points = [];
        const segmentCount = 10;
        const length = 3 + Math.random() * 3; // Length between 3 and 6
        
        // Generate a spiral-like path
        for (let i = 0; i < segmentCount; i++) {
            const t = i / segmentCount;
            const angle = t * Math.PI * 4; // Two full rotations
            
            // Spiral radius increases with t
            const radius = 0.1 + t * 0.3;
            
            // Position along the beam
            const z = t * length;
            
            // Spiral coordinates
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create a smooth curve through the points
        return new THREE.CatmullRomCurve3(points);
    }
    
    /**
     * Create a visual lock effect for an enemy with wind effects
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        // Call the parent method to create the base lock effect
        super.createLockEffect(enemy);
        
        const enemyPosition = enemy.getPosition();
        
        // Create a wind vortex around the enemy
        this.createWindVortex(enemyPosition);
        
        // Apply gale effect to the enemy
        this.applyGaleEffect(enemy);
    }
    
    /**
     * Create a wind vortex around an enemy
     * @param {THREE.Vector3} position - Position to create the vortex at
     */
    createWindVortex(position) {
        // Create a ring of particles for the vortex
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create wind colors
        const windColors = [
            new THREE.Color(0xffffff), // White
            new THREE.Color(0xeeffee), // Very light green
            new THREE.Color(0xccffcc), // Light green
            new THREE.Color(0xaaffaa)  // Pale green
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Position in a circle around the enemy
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.0;
            
            positions[i * 3] = position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = position.y + 0.5 + Math.random() * 0.5; // Vary height
            positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            // Random wind color
            const colorIndex = Math.floor(Math.random() * windColors.length);
            const color = windColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const vortex = new THREE.Points(particleGeometry, particleMaterial);
        
        // Store animation properties
        vortex.userData = {
            rotationSpeed: 2.0, // Rotation speed
            initialPositions: positions.slice(), // Clone the positions array
            creationTime: this.elapsedTime
        };
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(vortex);
            
            // Store for animation and cleanup
            this.airCurrents.push({
                mesh: vortex,
                isVortex: true,
                duration: this.lockDuration
            });
        }
    }
    
    /**
     * Apply gale effect to an enemy
     * @param {Enemy} enemy - The enemy to affect
     */
    applyGaleEffect(enemy) {
        // Apply immobilize status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                type: 'immobilize',
                duration: this.lockDuration,
                source: 'GaleChains'
            });
        }
    }
    
    /**
     * Update the Gale Chains effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate wind particles
            this.windParticles.forEach(particles => {
                const positions = particles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Fast, swirling movement for wind particles
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Rotate particles around the beam
                    const angle = Math.atan2(y, x) + (delta * (2.0 + Math.random() * 1.0));
                    const radius = Math.sqrt(x * x + y * y);
                    
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = Math.sin(angle) * radius;
                    
                    // Fast forward movement
                    positions[i * 3 + 2] = z + delta * (3.0 + Math.random() * 2.0);
                    
                    // Reset particles that move too far
                    if (z > 5) {
                        positions[i * 3 + 2] = 0;
                        
                        // Also reset x and y to maintain the beam shape
                        const newAngle = Math.random() * Math.PI * 2;
                        const newRadius = (this.radius / 8) * (1 + Math.random() * 2);
                        positions[i * 3] = Math.cos(newAngle) * newRadius;
                        positions[i * 3 + 1] = Math.sin(newAngle) * newRadius;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            });
            
            // Animate air currents
            for (let i = this.airCurrents.length - 1; i >= 0; i--) {
                const current = this.airCurrents[i];
                
                if (current.isVortex) {
                    // Animate vortex
                    const vortex = current.mesh;
                    const userData = vortex.userData;
                    const positions = vortex.geometry.attributes.position.array;
                    const initialPositions = userData.initialPositions;
                    const count = positions.length / 3;
                    
                    // Calculate age of the vortex
                    const age = this.elapsedTime - userData.creationTime;
                    
                    // Remove if duration exceeded
                    if (age > current.duration) {
                        if (this.skill.game && this.skill.game.scene) {
                            this.skill.game.scene.remove(vortex);
                            vortex.geometry.dispose();
                            vortex.material.dispose();
                        }
                        this.airCurrents.splice(i, 1);
                        continue;
                    }
                    
                    // Rotate the vortex particles
                    for (let j = 0; j < count; j++) {
                        const x0 = initialPositions[j * 3];
                        const z0 = initialPositions[j * 3 + 2];
                        
                        // Calculate center of rotation
                        const centerX = vortex.position.x;
                        const centerZ = vortex.position.z;
                        
                        // Calculate relative position
                        const relX = x0 - centerX;
                        const relZ = z0 - centerZ;
                        
                        // Calculate rotation angle
                        const rotationAngle = userData.rotationSpeed * age;
                        
                        // Apply rotation
                        positions[j * 3] = centerX + relX * Math.cos(rotationAngle) - relZ * Math.sin(rotationAngle);
                        positions[j * 3 + 2] = centerZ + relX * Math.sin(rotationAngle) + relZ * Math.cos(rotationAngle);
                        
                        // Add some vertical movement
                        positions[j * 3 + 1] = initialPositions[j * 3 + 1] + Math.sin(age * 2 + j * 0.1) * 0.2;
                    }
                    
                    vortex.geometry.attributes.position.needsUpdate = true;
                    
                    // Fade out near the end
                    if (age > current.duration * 0.7) {
                        const fadeRatio = 1 - ((age - current.duration * 0.7) / (current.duration * 0.3));
                        vortex.material.opacity = 0.7 * fadeRatio;
                    }
                } else {
                    // Animate regular air currents
                    current.regenerateTime -= delta;
                    
                    // Regenerate the air current path periodically
                    if (current.regenerateTime <= 0) {
                        // Generate new path
                        const newCurve = this.generateAirCurrentCurve();
                        
                        // Update the geometry
                        current.mesh.geometry.dispose();
                        current.mesh.geometry = new THREE.TubeGeometry(
                            newCurve,
                            20,         // tubularSegments
                            0.03,       // radius
                            8,          // radialSegments
                            false       // closed
                        );
                        
                        // Reset timer
                        current.regenerateTime = 0.5 + Math.random() * 0.5;
                        current.curve = newCurve;
                    }
                    
                    // Pulsing opacity
                    const time = this.elapsedTime;
                    current.mesh.material.opacity = 0.3 + Math.sin(time * current.speed + current.offset) * 0.1;
                }
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up wind particles
        this.windParticles = [];
        
        // Clean up air currents
        this.airCurrents.forEach(current => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(current.mesh);
                if (current.mesh.geometry) current.mesh.geometry.dispose();
                if (current.mesh.material) current.mesh.material.dispose();
            }
        });
        this.airCurrents = [];
        
        // Call parent dispose
        super.dispose();
    }
}