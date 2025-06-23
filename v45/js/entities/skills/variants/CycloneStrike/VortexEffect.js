import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Vortex variant of Cyclone Strike
 * Creates a powerful vortex that pulls enemies in and knocks them back
 * Visual style: Intense inward spiral with a powerful central burst
 */
export class VortexEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.knockbackEffect = true;
        this.knockbackForce = 5; // Strong knockback force
        this.pullDuration = 1; // Duration of pull effect in seconds
        this.pullTimer = 0;
        this.hasBurst = false;
        
        // Visual properties
        this.spiralLines = [];
        this.centralCore = null;
        this.vortexColor = new THREE.Color(0x9370DB); // Medium purple
    }

    /**
     * Create the Vortex effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to vortex color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.vortexColor.clone();
                    });
                } else {
                    child.material.color = this.vortexColor.clone();
                }
            }
        });
        
        // Add spiral lines
        this.addSpiralLines(effectGroup);
        
        // Add central core
        this.addCentralCore(effectGroup);
        
        // Add ground effect
        this.addGroundEffect(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add spiral lines to the effect
     * @param {THREE.Group} group - The group to add spiral lines to
     */
    addSpiralLines(group) {
        const lineCount = 12;
        const baseRadius = this.skill.radius;
        
        for (let i = 0; i < lineCount; i++) {
            // Create a spiral line
            const line = this.createSpiralLine(baseRadius);
            
            // Rotate to distribute evenly
            line.rotation.y = (i / lineCount) * Math.PI * 2;
            
            // Store for animation
            line.userData.rotationSpeed = 1 + Math.random() * 0.5;
            line.userData.initialRotation = line.rotation.y;
            
            group.add(line);
            this.spiralLines.push(line);
        }
    }
    
    /**
     * Create a spiral line
     * @param {number} radius - The radius of the spiral
     * @returns {THREE.Line} - The created spiral line
     */
    createSpiralLine(radius) {
        // Create a spiral curve
        const points = [];
        const turns = 2; // Number of turns in the spiral
        const pointCount = 50;
        
        for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const angle = t * Math.PI * 2 * turns;
            const r = radius * (1 - t);
            
            const x = Math.cos(angle) * r;
            const y = 0.1; // Just above ground
            const z = Math.sin(angle) * r;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create geometry
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create material
        const lineMaterial = new THREE.LineBasicMaterial({
            color: this.vortexColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Create line
        return new THREE.Line(lineGeometry, lineMaterial);
    }
    
    /**
     * Add a central core to the effect
     * @param {THREE.Group} group - The group to add the central core to
     */
    addCentralCore(group) {
        // Create a sphere for the core
        const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.5;
        
        group.add(core);
        this.centralCore = core;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.vortexColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        core.add(glow);
    }
    
    /**
     * Add a ground effect to the vortex
     * @param {THREE.Group} group - The group to add the ground effect to
     */
    addGroundEffect(group) {
        const ringGeometry = new THREE.RingGeometry(0.1, this.skill.radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.vortexColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        ring.position.y = 0.05; // Just above ground
        
        group.add(ring);
        
        // Add texture to make it look like a vortex
        const textureSize = 512;
        const data = new Uint8Array(textureSize * textureSize * 4);
        
        // Create a spiral pattern
        for (let i = 0; i < textureSize; i++) {
            for (let j = 0; j < textureSize; j++) {
                const index = (i * textureSize + j) * 4;
                
                // Create a spiral pattern
                const x = j / textureSize - 0.5;
                const y = i / textureSize - 0.5;
                const distance = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x);
                
                // Spiral pattern
                const spiral = (angle + distance * 20) % (Math.PI * 2) / (Math.PI * 2);
                
                // Set color (purple color)
                data[index] = 147; // R
                data[index + 1] = 112; // G
                data[index + 2] = 219; // B
                
                // Set alpha based on spiral and distance
                data[index + 3] = Math.max(0, Math.min(255, (spiral > 0.5 ? 0 : 255) * (1 - distance * 2)));
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
     * Update the Vortex effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Update pull timer
            this.pullTimer += delta;
            
            // Animate spiral lines
            this.spiralLines.forEach(line => {
                const rotationSpeed = line.userData.rotationSpeed || 1;
                const initialRotation = line.userData.initialRotation || 0;
                
                // Rotate the line
                line.rotation.y = initialRotation + this.elapsedTime * rotationSpeed;
                
                // Scale down as the effect progresses
                const scale = Math.max(0.1, 1 - this.elapsedTime / this.skill.duration);
                line.scale.set(scale, scale, scale);
            });
            
            // Animate central core
            if (this.centralCore) {
                // Pulse the core
                const pulseFactor = 1 + 0.3 * Math.sin(this.elapsedTime * 10);
                this.centralCore.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Increase intensity as the pull phase ends
                if (this.pullTimer < this.pullDuration) {
                    // Growing phase
                    const growFactor = this.pullTimer / this.pullDuration;
                    this.centralCore.material.opacity = 0.5 + 0.3 * growFactor;
                } else if (!this.hasBurst) {
                    // Burst phase
                    this.createBurstEffect();
                    this.hasBurst = true;
                }
            }
            
            // Pull enemies during the pull phase
            if (this.pullTimer < this.pullDuration) {
                this.pullEnemies(delta);
            }
        }
    }
    
    /**
     * Pull enemies toward the center
     * @param {number} delta - Time since last update in seconds
     */
    pullEnemies(delta) {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        const centerPosition = this.effect.position.clone();
        
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            centerPosition,
            this.skill.radius * 1.5 // Slightly larger range for pull effect
        );
        
        enemies.forEach(enemy => {
            if (enemy.applyForce) {
                const enemyPosition = enemy.getPosition();
                const direction = new THREE.Vector3()
                    .subVectors(centerPosition, enemyPosition)
                    .normalize();
                
                // Pull force decreases with distance
                const distance = enemyPosition.distanceTo(centerPosition);
                const pullForce = 5 * (1 - distance / (this.skill.radius * 1.5));
                
                enemy.applyForce(direction, pullForce * delta * 60); // Scale by delta and convert to per-frame force
            }
        });
    }
    
    /**
     * Create a burst effect when the pull phase ends
     */
    createBurstEffect() {
        if (!this.effect) return;
        
        // Create a burst ring
        const burstGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.rotation.x = Math.PI / 2; // Lay flat
        burst.position.y = 0.5;
        
        this.effect.add(burst);
        
        // Animate the burst
        const expandAndFade = () => {
            let scale = 1;
            let opacity = burst.material.opacity;
            
            const animate = () => {
                scale += 0.2;
                opacity -= 0.05;
                
                burst.scale.set(scale, scale, scale);
                burst.material.opacity = Math.max(0, opacity);
                
                if (opacity > 0 && this.isActive) {
                    requestAnimationFrame(animate);
                } else {
                    this.effect.remove(burst);
                    burst.geometry.dispose();
                    burst.material.dispose();
                }
            };
            
            animate();
        };
        
        expandAndFade();
        
        // Apply knockback to enemies
        this.applyKnockbackToEnemies();
    }
    
    /**
     * Apply knockback to all enemies in range
     */
    applyKnockbackToEnemies() {
        if (!this.skill.game || !this.skill.game.enemyManager || !this.knockbackEffect) return;
        
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // const centerPosition = this.effect.position.clone();
        
        // const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //     centerPosition,
        //     this.skill.radius * 1.5 // Slightly larger range for knockback effect
        // );
        
        // enemies.forEach(enemy => {
        //     if (enemy.applyKnockback) {
        //         const enemyPosition = enemy.getPosition();
        //         const direction = new THREE.Vector3()
        //             .subVectors(enemyPosition, centerPosition)
        //             .normalize();
                
        //         enemy.applyKnockback(direction, this.knockbackForce);
                
        //         // Apply damage
        //         const damageAmount = this.skill.damage * 1.5; // 50% more damage for the burst
        //         enemy.takeDamage(damageAmount);
        //     }
        // });
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.spiralLines = [];
        this.centralCore = null;
        
        // Call parent dispose
        super.dispose();
    }
}