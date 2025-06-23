import * as THREE from 'three';
import { FlyingDragonEffect } from '../../FlyingDragonEffect.js';

/**
 * Effect for the Thunder Dragon variant of Flying Dragon
 * Creates a lightning-infused dragon that has a chance to stun enemies
 * Visual style: Lightning arcs, electric sparks, and thunder effects
 */
export class ThunderDragonEffect extends FlyingDragonEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.stunEffect = true;
        this.stunDuration = 1.5; // 1.5 seconds stun
        this.stunChance = 0.3; // 30% chance to stun per hit
        
        // Visual properties
        this.lightningArcs = [];
        this.electricSparks = null;
        this.thunderColor = new THREE.Color(0x4169E1); // Royal blue
    }

    /**
     * Create the Thunder Dragon effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to thunder color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.thunderColor.clone();
                    });
                } else {
                    child.material.color = this.thunderColor.clone();
                }
            }
        });
        
        // Add lightning arcs
        this.addLightningArcs(effectGroup);
        
        // Add electric sparks
        this.addElectricSparks(effectGroup);
        
        // Add thunder aura
        this.addThunderAura(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add lightning arcs to the effect
     * @param {THREE.Group} group - The group to add lightning arcs to
     */
    addLightningArcs(group) {
        const arcCount = 6;
        
        for (let i = 0; i < arcCount; i++) {
            // Create a lightning arc
            const arc = this.createLightningArc();
            
            // Position around the dragon
            const angle = (i / arcCount) * Math.PI * 2;
            const radius = 0.5;
            arc.position.x = Math.cos(angle) * radius;
            arc.position.z = Math.sin(angle) * radius;
            arc.position.y = 0.5 + Math.random() * 0.5;
            
            // Rotate to face outward
            arc.rotation.y = angle;
            
            // Store for animation
            arc.userData.angle = angle;
            arc.userData.radius = radius;
            arc.userData.lifespan = 0.2 + Math.random() * 0.3; // Short lifespan
            arc.userData.age = 0;
            
            group.add(arc);
            this.lightningArcs.push(arc);
        }
    }
    
    /**
     * Create a stylized lightning arc using simple geometries
     * @returns {THREE.Line} - The created lightning arc
     */
    createLightningArc() {
        // Create a jagged line for the lightning
        const points = [];
        const segmentCount = 10;
        const arcLength = 1 + Math.random() * 0.5;
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const x = t * arcLength;
            const y = (Math.random() - 0.5) * 0.2;
            const z = (Math.random() - 0.5) * 0.2;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0xaaddff, // Light blue for lightning
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Line(arcGeometry, arcMaterial);
    }
    
    /**
     * Add electric sparks to the effect
     * @param {THREE.Group} group - The group to add electric sparks to
     */
    addElectricSparks(group) {
        const sparkCount = 50;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const sizes = new Float32Array(sparkCount);
        
        // Position particles around the dragon
        for (let i = 0; i < sparkCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1;
            const height = Math.random() * 1.5;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random sizes
            sizes[i] = 0.03 + Math.random() * 0.05;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaddff, // Light blue for sparks
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
        this.electricSparks = particles;
    }
    
    /**
     * Add a thunder aura to the effect
     * @param {THREE.Group} group - The group to add the thunder aura to
     */
    addThunderAura(group) {
        // Create a sphere for the thunder aura
        const auraGeometry = new THREE.SphereGeometry(1, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.thunderColor,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);
        
        // Store for animation
        this.thunderAura = aura;
    }
    
    /**
     * Update the Thunder Dragon effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate lightning arcs
            this.lightningArcs.forEach((arc, index) => {
                arc.userData.age += delta;
                
                // If the arc has reached its lifespan, reset it
                if (arc.userData.age >= arc.userData.lifespan) {
                    // Remove old arc
                    this.effect.remove(arc);
                    
                    // Create a new arc
                    const newArc = this.createLightningArc();
                    
                    // Position around the dragon
                    const angle = arc.userData.angle;
                    const radius = arc.userData.radius;
                    newArc.position.x = Math.cos(angle) * radius;
                    newArc.position.z = Math.sin(angle) * radius;
                    newArc.position.y = 0.5 + Math.random() * 0.5;
                    
                    // Rotate to face outward
                    newArc.rotation.y = angle;
                    
                    // Store for animation
                    newArc.userData.angle = angle;
                    newArc.userData.radius = radius;
                    newArc.userData.lifespan = 0.2 + Math.random() * 0.3;
                    newArc.userData.age = 0;
                    
                    // Add to the effect
                    this.effect.add(newArc);
                    
                    // Update the array
                    this.lightningArcs[index] = newArc;
                }
            });
            
            // Animate electric sparks
            if (this.electricSparks && this.electricSparks.geometry) {
                const positions = this.electricSparks.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Random movement
                    positions[i * 3] += (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
                    
                    // Keep particles within bounds
                    const distance = Math.sqrt(
                        positions[i * 3] * positions[i * 3] +
                        positions[i * 3 + 2] * positions[i * 3 + 2]
                    );
                    
                    if (distance > 1.2 || positions[i * 3 + 1] < 0 || positions[i * 3 + 1] > 2) {
                        // Reset position
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 1;
                        const height = Math.random() * 1.5;
                        
                        positions[i * 3] = Math.cos(angle) * radius;
                        positions[i * 3 + 1] = height;
                        positions[i * 3 + 2] = Math.sin(angle) * radius;
                    }
                }
                
                this.electricSparks.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate thunder aura
            if (this.thunderAura) {
                // Pulse the aura
                const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * 10);
                this.thunderAura.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate slowly
                this.thunderAura.rotation.y += delta * 0.5;
            }
        }
    }
    
    /**
     * Apply stun effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyStunEffect(enemy) {
        if (!enemy || !this.stunEffect) return;
        
        // Check if stun should be applied based on chance
        if (Math.random() < this.stunChance) {
            // Apply stun status effect
            if (enemy.addStatusEffect) {
                enemy.addStatusEffect('stun', this.stunDuration);
                
                // Create a visual effect for the stun
                this.createStunVisualEffect(enemy);
            }
        }
    }
    
    /**
     * Create a visual effect for the stun status
     * @param {Enemy} enemy - The enemy to create the effect on
     */
    createStunVisualEffect(enemy) {
        if (!enemy || !this.skill.game) return;
        
        // Create lightning bolts that strike the enemy
        const boltCount = 3;
        const bolts = [];
        
        // Get enemy position
        const enemyPosition = enemy.getPosition();
        const enemyHeight = enemy.height || 1.5;
        
        for (let i = 0; i < boltCount; i++) {
            // Create a lightning bolt
            const points = [];
            const segmentCount = 10;
            const boltHeight = 3;
            
            // Start above the enemy
            const startX = enemyPosition.x + (Math.random() - 0.5) * 0.5;
            const startY = enemyPosition.y + enemyHeight + boltHeight;
            const startZ = enemyPosition.z + (Math.random() - 0.5) * 0.5;
            
            // End at the enemy
            const endX = enemyPosition.x;
            const endY = enemyPosition.y + enemyHeight * 0.5;
            const endZ = enemyPosition.z;
            
            for (let j = 0; j <= segmentCount; j++) {
                const t = j / segmentCount;
                
                // Interpolate from start to end
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 0.3 * (1 - t);
                const y = startY + (endY - startY) * t;
                const z = startZ + (endZ - startZ) * t + (Math.random() - 0.5) * 0.3 * (1 - t);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const boltGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const boltMaterial = new THREE.LineBasicMaterial({
                color: 0xaaddff, // Light blue for lightning
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const bolt = new THREE.Line(boltGeometry, boltMaterial);
            
            // Add to scene
            this.skill.game.scene.add(bolt);
            bolts.push(bolt);
            
            // Delay each bolt
            setTimeout(() => {
                // Create a flash at the impact point
                const flashGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                const flashMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending
                });
                
                const flash = new THREE.Mesh(flashGeometry, flashMaterial);
                flash.position.set(endX, endY, endZ);
                
                this.skill.game.scene.add(flash);
                
                // Animate the flash
                let flashScale = 1;
                let flashOpacity = flash.material.opacity;
                
                const animateFlash = () => {
                    flashScale += 0.2;
                    flashOpacity -= 0.1;
                    
                    flash.scale.set(flashScale, flashScale, flashScale);
                    flash.material.opacity = Math.max(0, flashOpacity);
                    
                    if (flashOpacity > 0) {
                        requestAnimationFrame(animateFlash);
                    } else {
                        this.skill.game.scene.remove(flash);
                        flash.geometry.dispose();
                        flash.material.dispose();
                    }
                };
                
                animateFlash();
            }, i * 200); // Stagger the bolts
        }
        
        // Remove bolts after a short time
        setTimeout(() => {
            bolts.forEach(bolt => {
                this.skill.game.scene.remove(bolt);
                bolt.geometry.dispose();
                bolt.material.dispose();
            });
        }, 500);
        
        // Create stars circling around the enemy's head for stun effect
        const starCount = 5;
        const starGroup = new THREE.Group();
        
        // Position the group above the enemy's head
        starGroup.position.set(
            enemyPosition.x,
            enemyPosition.y + enemyHeight + 0.5,
            enemyPosition.z
        );
        
        // Create stars
        for (let i = 0; i < starCount; i++) {
            // Create a star using a simple shape
            const starGeometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Create a star shape
            const outerRadius = 0.1;
            const innerRadius = 0.04;
            const points = 5;
            
            for (let j = 0; j < points * 2; j++) {
                const angle = (j / (points * 2)) * Math.PI * 2;
                const radius = j % 2 === 0 ? outerRadius : innerRadius;
                
                vertices.push(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                );
            }
            
            // Close the shape
            vertices.push(vertices[0], vertices[1], vertices[2]);
            
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            // Create material
            const starMaterial = new THREE.LineBasicMaterial({
                color: this.thunderColor,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            // Create line
            const star = new THREE.Line(starGeometry, starMaterial);
            
            // Position in a circle
            const angle = (i / starCount) * Math.PI * 2;
            const radius = 0.3;
            star.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            // Random rotation
            star.rotation.z = Math.random() * Math.PI * 2;
            
            // Store initial angle for animation
            star.userData.angle = angle;
            star.userData.rotationSpeed = 0.1 + Math.random() * 0.1;
            
            starGroup.add(star);
        }
        
        // Add to scene
        this.skill.game.scene.add(starGroup);
        
        // Animate the stars
        let elapsed = 0;
        const duration = this.stunDuration;
        
        const animate = () => {
            const delta = 1/60; // Assume 60fps
            elapsed += delta;
            
            // Update enemy position
            if (enemy.getPosition) {
                const newPosition = enemy.getPosition();
                starGroup.position.x = newPosition.x;
                starGroup.position.z = newPosition.z;
                starGroup.position.y = newPosition.y + enemyHeight + 0.5 + Math.sin(elapsed * 3) * 0.1;
            }
            
            // Rotate the stars around the head
            starGroup.children.forEach(star => {
                const angle = star.userData.angle + elapsed * star.userData.rotationSpeed * 5;
                const radius = 0.3;
                
                star.position.x = Math.cos(angle) * radius;
                star.position.z = Math.sin(angle) * radius;
                
                // Spin the star
                star.rotation.z += star.userData.rotationSpeed;
            });
            
            // Rotate the entire group
            starGroup.rotation.y += 0.02;
            
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                // Remove stars
                this.skill.game.scene.remove(starGroup);
                starGroup.children.forEach(star => {
                    star.geometry.dispose();
                    star.material.dispose();
                });
            }
        };
        
        animate();
    }
    
    /**
     * Override the damage application to add stun effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply stun effect
        this.applyStunEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.lightningArcs = [];
        this.electricSparks = null;
        this.thunderAura = null;
        
        // Call parent dispose
        super.dispose();
    }
}