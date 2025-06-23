import * as THREE from 'three';
import { ImprisonedFistsEffect } from '../../ImprisonedFistsEffect.js';

/**
 * Effect for the Shadow Bind variant of Imprisoned Fists
 * Creates shadow tendrils that immobilize enemies for a longer duration
 * Visual style: Dark purple/black tendrils with shadow particles
 */
export class ShadowBindEffect extends ImprisonedFistsEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.immobilizeDuration = 7; // 7 seconds of immobilization (longer than base)
        this.shadowDamage = 3; // Shadow damage per second
        this.shadowDamageInterval = 1.0; // Apply shadow damage every second
        this.lastShadowDamageTime = 0;
        
        // Visual properties
        this.shadowParticles = [];
        this.shadowTendrils = [];
        this.tendrilCount = 5; // Number of tendrils per enemy
    }

    /**
     * Create the Shadow Bind effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base effect color to dark purple/black
        effectGroup.children.forEach(child => {
            if (child.material) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.set(0x330033); // Dark purple color
                }
            }
        });
        
        // Modify particle system colors to shadow colors
        if (this.particleSystem) {
            const colors = this.particleSystem.geometry.attributes.color.array;
            const color = new THREE.Color(0x330033); // Dark purple color
            
            for (let i = 0; i < colors.length / 3; i++) {
                colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
                colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
            }
            
            this.particleSystem.geometry.attributes.color.needsUpdate = true;
        }
        
        // Modify ground indicator color
        if (this.groundIndicator) {
            this.groundIndicator.material.color.set(0x330033); // Dark purple color
        }
        
        // Add shadow particles
        this.addShadowParticles(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add shadow particles to the effect
     * @param {THREE.Group} group - The group to add shadow particles to
     */
    addShadowParticles(group) {
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create shadow colors
        const shadowColors = [
            new THREE.Color(0x330033), // Dark purple
            new THREE.Color(0x220022), // Darker purple
            new THREE.Color(0x110011), // Very dark purple
            new THREE.Color(0x000000)  // Black
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
            
            // Random shadow color
            const colorIndex = Math.floor(Math.random() * shadowColors.length);
            const color = shadowColors[colorIndex];
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size - varied for shadow particles
            sizes[i] = 0.15 + Math.random() * 0.25;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const shadowParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        group.add(shadowParticleSystem);
        
        // Store for animation
        this.shadowParticles.push(shadowParticleSystem);
    }
    
    /**
     * Create a visual lock effect for an enemy with shadow tendrils
     * @param {Enemy} enemy - The enemy to create a lock effect for
     */
    createLockEffect(enemy) {
        // Call the parent method to create the base lock effect
        super.createLockEffect(enemy);
        
        const enemyPosition = enemy.getPosition();
        
        // Create shadow tendrils around the enemy
        for (let i = 0; i < this.tendrilCount; i++) {
            this.createShadowTendril(enemy, i);
        }
        
        // Apply shadow bind effect to the enemy
        this.applyShadowBindEffect(enemy);
    }
    
    /**
     * Create a shadow tendril for an enemy
     * @param {Enemy} enemy - The enemy to create a tendril for
     * @param {number} index - Index of the tendril (for positioning)
     */
    createShadowTendril(enemy, index) {
        const enemyPosition = enemy.getPosition();
        
        // Create a curved path for the tendril
        const curve = this.generateTendrilCurve(enemyPosition, index);
        
        // Create geometry from the curve
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            12,         // tubularSegments
            0.05,       // radius
            8,          // radialSegments
            false       // closed
        );
        
        // Create material for the tendril
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x330033, // Dark purple
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create the tendril mesh
        const tendril = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Add to scene
        if (this.skill.game && this.skill.game.scene) {
            this.skill.game.scene.add(tendril);
            
            // Store for animation and cleanup
            this.shadowTendrils.push({
                mesh: tendril,
                enemy: enemy,
                index: index,
                curve: curve,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    /**
     * Generate a curve for a shadow tendril
     * @param {THREE.Vector3} position - Position of the enemy
     * @param {number} index - Index of the tendril
     * @returns {THREE.CatmullRomCurve3} - The generated curve
     */
    generateTendrilCurve(position, index) {
        // Create points for the curve
        const points = [];
        
        // Start from the ground
        const angle = (index / this.tendrilCount) * Math.PI * 2;
        const groundRadius = 1.5 + Math.random() * 0.5;
        
        const groundPos = new THREE.Vector3(
            position.x + Math.cos(angle) * groundRadius,
            0.1, // Just above ground
            position.z + Math.sin(angle) * groundRadius
        );
        
        points.push(groundPos);
        
        // Add intermediate control points
        const segmentCount = 3 + Math.floor(Math.random() * 3); // 3-5 segments
        
        for (let i = 1; i < segmentCount; i++) {
            const t = i / segmentCount;
            
            // Interpolate from ground to enemy position
            const x = groundPos.x + (position.x - groundPos.x) * t;
            const z = groundPos.z + (position.z - groundPos.z) * t;
            
            // Add some randomness for a more organic look
            const jitter = 0.3 * Math.sin(t * Math.PI);
            const jitterX = (Math.random() - 0.5) * jitter;
            const jitterZ = (Math.random() - 0.5) * jitter;
            
            // Y coordinate follows a curved path upward
            const y = groundPos.y + (position.y - groundPos.y) * t * t + Math.sin(t * Math.PI) * 0.5;
            
            points.push(new THREE.Vector3(x + jitterX, y, z + jitterZ));
        }
        
        // End at the enemy position
        points.push(new THREE.Vector3(position.x, position.y, position.z));
        
        // Create a smooth curve through the points
        return new THREE.CatmullRomCurve3(points);
    }
    
    /**
     * Apply shadow bind effect to an enemy
     * @param {Enemy} enemy - The enemy to bind
     */
    applyShadowBindEffect(enemy) {
        // Apply shadow bind status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                type: 'immobilize',
                duration: this.immobilizeDuration,
                source: 'ShadowBind',
                // Apply shadow damage over time
                onTick: (delta) => {
                    this.lastShadowDamageTime += delta;
                    if (this.lastShadowDamageTime >= this.shadowDamageInterval) {
                        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                        // const damage = this.shadowDamage;
                        // enemy.takeDamage(damage);
                        this.lastShadowDamageTime = 0;
                        
                        // Create a shadow damage visual effect
                        this.createShadowDamageEffect(enemy.getPosition());
                    }
                }
            });
        }
    }
    
    /**
     * Create a shadow damage visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createShadowDamageEffect(position) {
        // Create a burst of shadow particles
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create particle positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create shadow colors
        const shadowColors = [
            new THREE.Color(0x330033), // Dark purple
            new THREE.Color(0x220022), // Darker purple
            new THREE.Color(0x110011), // Very dark purple
            new THREE.Color(0x000000)  // Black
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere
            const radius = 0.3 + Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
            
            // Random shadow color
            const colorIndex = Math.floor(Math.random() * shadowColors.length);
            const color = shadowColors[colorIndex];
            
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
            }, 700); // 0.7 seconds
        }
    }
    
    /**
     * Update the Shadow Bind effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate shadow particles
            this.shadowParticles.forEach(particles => {
                const positions = particles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Slow, drifting movement for shadow particles
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Add slow drifting movement
                    positions[i * 3] = x + (Math.random() - 0.5) * delta * 0.3;
                    positions[i * 3 + 1] = y + (Math.random() - 0.5) * delta * 0.3;
                    positions[i * 3 + 2] = z + (Math.random() - 0.5) * delta * 0.3;
                    
                    // Reset particles that move too far
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
            
            // Animate shadow tendrils
            this.shadowTendrils.forEach(tendril => {
                // Update tendril position if enemy moves
                if (tendril.enemy && tendril.enemy.getPosition) {
                    const enemyPosition = tendril.enemy.getPosition();
                    
                    // Regenerate the curve to follow the enemy
                    const newCurve = this.generateTendrilCurve(enemyPosition, tendril.index);
                    
                    // Update the geometry
                    tendril.mesh.geometry.dispose();
                    tendril.mesh.geometry = new THREE.TubeGeometry(
                        newCurve,
                        12,         // tubularSegments
                        0.05,       // radius
                        8,          // radialSegments
                        false       // closed
                    );
                    
                    // Store the new curve
                    tendril.curve = newCurve;
                }
                
                // Pulsing effect on the tendrils
                const time = this.elapsedTime;
                const pulseValue = 0.8 + Math.sin(time * tendril.pulseSpeed + tendril.pulseOffset) * 0.2;
                
                // Apply pulse to opacity
                tendril.mesh.material.opacity = pulseValue;
            });
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up shadow particles
        this.shadowParticles = [];
        
        // Clean up shadow tendrils
        this.shadowTendrils.forEach(tendril => {
            if (this.skill.game && this.skill.game.scene) {
                this.skill.game.scene.remove(tendril.mesh);
                if (tendril.mesh.geometry) tendril.mesh.geometry.dispose();
                if (tendril.mesh.material) tendril.mesh.material.dispose();
            }
        });
        this.shadowTendrils = [];
        
        // Call parent dispose
        super.dispose();
    }
}