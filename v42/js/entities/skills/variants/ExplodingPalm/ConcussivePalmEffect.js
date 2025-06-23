import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Concussive Palm variant of Exploding Palm
 * Creates a palm strike that stuns enemies
 * Visual style: Shockwave rings and distortion effects
 */
export class ConcussivePalmEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.stunEffect = true;
        this.stunDuration = 2; // 2 seconds stun
        
        // Visual properties
        this.shockwaveRings = [];
        this.concussiveColor = new THREE.Color(0xffcc00); // Golden yellow
    }

    /**
     * Create the Concussive Palm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to concussive color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.concussiveColor.clone();
                    });
                } else {
                    child.material.color = this.concussiveColor.clone();
                }
            }
        });
        
        // Add shockwave rings
        this.addShockwaveRings(effectGroup, direction);
        
        // Add impact burst
        this.addImpactBurst(effectGroup, direction);
        
        return effectGroup;
    }
    
    /**
     * Add shockwave rings to the effect
     * @param {THREE.Group} group - The group to add shockwave rings to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addShockwaveRings(group, direction) {
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            // Create a ring
            const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.concussiveColor,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Position along the direction
            const distance = 0.5 * (i + 1);
            ring.position.copy(direction.clone().multiplyScalar(distance));
            
            // Orient to face the direction
            ring.lookAt(direction.clone().add(ring.position));
            
            // Store for animation
            ring.userData.expansionRate = 2 + i * 0.5;
            ring.userData.initialOpacity = ringMaterial.opacity;
            ring.userData.delay = i * 0.1; // Stagger the rings
            
            group.add(ring);
            this.shockwaveRings.push(ring);
        }
    }
    
    /**
     * Add an impact burst to the effect
     * @param {THREE.Group} group - The group to add the impact burst to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addImpactBurst(group, direction) {
        // Create a burst at the impact point
        const burstGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        
        // Position at the impact point
        burst.position.copy(direction.clone().multiplyScalar(1));
        
        group.add(burst);
        
        // Animate the burst
        const expandAndFade = () => {
            let scale = 1;
            let opacity = burst.material.opacity;
            
            const animate = () => {
                scale += 0.1;
                opacity -= 0.05;
                
                burst.scale.set(scale, scale, scale);
                burst.material.opacity = Math.max(0, opacity);
                
                if (opacity > 0 && this.isActive) {
                    requestAnimationFrame(animate);
                } else {
                    group.remove(burst);
                    burst.geometry.dispose();
                    burst.material.dispose();
                }
            };
            
            animate();
        };
        
        expandAndFade();
        
        // Add distortion waves
        this.addDistortionWaves(group, direction);
    }
    
    /**
     * Add distortion waves to the effect
     * @param {THREE.Group} group - The group to add distortion waves to
     * @param {THREE.Vector3} direction - Direction the effect should face
     */
    addDistortionWaves(group, direction) {
        // Create a plane for the distortion effect
        const planeGeometry = new THREE.PlaneGeometry(2, 2, 20, 20);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: this.concussiveColor,
            transparent: true,
            opacity: 0.3,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Position at the impact point
        plane.position.copy(direction.clone().multiplyScalar(1));
        
        // Orient to face the direction
        plane.lookAt(direction.clone().add(plane.position));
        
        group.add(plane);
        
        // Animate the vertices to create a ripple effect
        const initialPositions = [];
        const positions = plane.geometry.attributes.position.array;
        
        // Store initial positions
        for (let i = 0; i < positions.length; i += 3) {
            initialPositions.push({
                x: positions[i],
                y: positions[i + 1],
                z: positions[i + 2]
            });
        }
        
        // Animate the distortion
        let time = 0;
        const animate = () => {
            time += 0.05;
            
            // Update vertex positions
            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                const initial = initialPositions[j];
                
                // Calculate distance from center
                const x = initial.x;
                const y = initial.y;
                const distance = Math.sqrt(x * x + y * y);
                
                // Create a ripple effect
                const ripple = Math.sin(distance * 5 - time) * 0.1;
                
                // Apply ripple to z-coordinate
                positions[i + 2] = initial.z + ripple;
            }
            
            plane.geometry.attributes.position.needsUpdate = true;
            
            // Fade out
            plane.material.opacity -= 0.01;
            
            if (plane.material.opacity > 0 && this.isActive) {
                requestAnimationFrame(animate);
            } else {
                group.remove(plane);
                plane.geometry.dispose();
                plane.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Update the Concussive Palm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate shockwave rings
            this.shockwaveRings.forEach(ring => {
                // Check if the ring should start expanding yet
                if (this.elapsedTime < ring.userData.delay) return;
                
                const activeTime = this.elapsedTime - ring.userData.delay;
                const expansionRate = ring.userData.expansionRate || 2;
                const initialOpacity = ring.userData.initialOpacity || 0.8;
                
                // Expand the ring
                const scale = 1 + activeTime * expansionRate;
                ring.scale.set(scale, scale, scale);
                
                // Fade out
                ring.material.opacity = initialOpacity * (1 - activeTime / 1);
            });
        }
    }
    
    /**
     * Apply stun effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyStunEffect(enemy) {
        if (!enemy || !this.stunEffect) return;
        
        // Apply stun status effect
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect('stun', this.stunDuration);
            
            // Create a visual effect for the stun
            this.createStunVisualEffect(enemy);
        }
    }
    
    /**
     * Create a visual effect for the stun status
     * @param {Enemy} enemy - The enemy to create the effect on
     */
    createStunVisualEffect(enemy) {
        if (!enemy || !this.skill.game) return;
        
        // Create stars circling around the enemy's head
        const starCount = 5;
        const starGroup = new THREE.Group();
        
        // Get enemy position
        const enemyPosition = enemy.getPosition();
        const headHeight = enemy.height || 1.5;
        
        // Position the group above the enemy's head
        starGroup.position.set(
            enemyPosition.x,
            enemyPosition.y + headHeight + 0.5,
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
                color: this.concussiveColor,
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
            
            // Rotate the stars around the head
            starGroup.children.forEach(star => {
                const angle = star.userData.angle + elapsed * star.userData.rotationSpeed * 5;
                const radius = 0.3;
                
                star.position.x = Math.cos(angle) * radius;
                star.position.z = Math.sin(angle) * radius;
                
                // Spin the star
                star.rotation.z += star.userData.rotationSpeed;
            });
            
            // Make the group bob up and down
            starGroup.position.y = enemyPosition.y + headHeight + 0.5 + Math.sin(elapsed * 3) * 0.1;
            
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
        this.shockwaveRings = [];
        
        // Call parent dispose
        super.dispose();
    }
}