import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Thunderous Kick variant of Flying Kick
 * Each kick releases a thunderclap that stuns enemies
 * Visual style: Lightning arcs and thunder shockwaves
 */
export class ThunderousKickEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.stunEffect = true;
        this.stunDuration = 2; // 2 seconds stun
        this.stunChance = 1.0; // 100% chance to stun
        this.thunderclapInterval = 0.5; // Time between thunderclaps in seconds
        
        // Visual properties
        this.lightningArcs = [];
        this.shockwaves = [];
        this.lastThunderclapTime = 0;
        this.thunderColor = new THREE.Color(0x4488ff);
    }

    /**
     * Create the Thunderous Kick effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add lightning trail
        this.addLightningTrail(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add lightning trail to the effect
     * @param {THREE.Group} group - The group to add the trail to
     */
    addLightningTrail(group) {
        // Create a trail of lightning behind the monk
        const trailGeometry = new THREE.BufferGeometry();
        const trailVertices = [];
        
        // Create a zigzag pattern for lightning
        const segmentCount = 10;
        const segmentLength = 0.5;
        const zigzagWidth = 0.3;
        
        for (let i = 0; i < segmentCount; i++) {
            const z = -i * segmentLength;
            const x = (i % 2 === 0) ? zigzagWidth : -zigzagWidth;
            trailVertices.push(x, 0, z);
        }
        
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailVertices, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: this.thunderColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const lightningTrail = new THREE.Line(trailGeometry, trailMaterial);
        group.add(lightningTrail);
        
        // Store for animation
        this.lightningArcs.push(lightningTrail);
    }
    
    /**
     * Create a thunderclap shockwave
     * @param {THREE.Vector3} position - Position to create the shockwave at
     */
    createThunderclap(position) {
        if (!this.effect) return;
        
        // Create a ring geometry for the shockwave
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.thunderColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to effect group
        this.effect.add(ring);
        
        // Store for animation with creation time
        ring.userData.creationTime = this.elapsedTime;
        ring.userData.maxRadius = this.skill.radius;
        ring.userData.expandSpeed = 10;
        this.shockwaves.push(ring);
        
        // Play thunder sound
        if (this.skill.game && this.skill.game.audioManager) {
            this.skill.game.audioManager.playSound('thunderStrike');
        }
        
        // Apply stun effect to nearby enemies
        this.applyStunToNearbyEnemies(position);
    }
    
    /**
     * Apply stun effect to enemies near the thunderclap
     * @param {THREE.Vector3} position - Position of the thunderclap
     */
    applyStunToNearbyEnemies(position) {
        if (!this.game || !this.game.enemyManager) return;
        
        const enemies = this.game.enemyManager.getEnemiesInRadius(
            position,
            this.skill.radius
        );
        
        enemies.forEach(enemy => {
            if (!enemy) return;
            
            // Apply stun if chance succeeds
            if (Math.random() <= this.stunChance) {
                if (enemy.addStatusEffect) {
                    enemy.addStatusEffect('stun', this.stunDuration);
                }
            }
        });
    }
    
    /**
     * Update the Thunderous Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Check if it's time for a new thunderclap
            if (this.elapsedTime - this.lastThunderclapTime >= this.thunderclapInterval) {
                this.createThunderclap(this.position.clone());
                this.lastThunderclapTime = this.elapsedTime;
            }
            
            // Update lightning arcs
            this.lightningArcs.forEach(arc => {
                if (arc.geometry && arc.geometry.attributes && arc.geometry.attributes.position) {
                    const positions = arc.geometry.attributes.position.array;
                    
                    // Randomize positions slightly for flickering effect
                    for (let i = 0; i < positions.length; i += 3) {
                        // Only randomize x position for zigzag effect
                        positions[i] += (Math.random() - 0.5) * 0.1;
                    }
                    
                    arc.geometry.attributes.position.needsUpdate = true;
                }
                
                // Adjust opacity based on remaining duration
                if (arc.material) {
                    const remainingDuration = this.skill.duration - this.elapsedTime;
                    arc.material.opacity = Math.min(0.8, remainingDuration / this.skill.duration * 2);
                }
            });
            
            // Update shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const shockwave = this.shockwaves[i];
                const age = this.elapsedTime - shockwave.userData.creationTime;
                const maxAge = shockwave.userData.maxRadius / shockwave.userData.expandSpeed;
                
                if (age >= maxAge) {
                    // Remove old shockwaves
                    this.effect.remove(shockwave);
                    this.shockwaves.splice(i, 1);
                    
                    // Dispose of geometry and material
                    if (shockwave.geometry) shockwave.geometry.dispose();
                    if (shockwave.material) shockwave.material.dispose();
                } else {
                    // Expand the ring
                    const newRadius = age * shockwave.userData.expandSpeed;
                    shockwave.scale.set(newRadius, newRadius, 1);
                    
                    // Fade out as it expands
                    shockwave.material.opacity = 0.8 * (1 - age / maxAge);
                }
            }
        }
    }
    
    /**
     * Override damage application to include stun effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply stun effect
        if (this.stunEffect && enemy && enemy.addStatusEffect) {
            if (Math.random() <= this.stunChance) {
                enemy.addStatusEffect('stun', this.stunDuration);
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up lightning arcs
        this.lightningArcs.forEach(arc => {
            if (arc.geometry) arc.geometry.dispose();
            if (arc.material) arc.material.dispose();
        });
        this.lightningArcs = [];
        
        // Clean up shockwaves
        this.shockwaves.forEach(shockwave => {
            if (shockwave.geometry) shockwave.geometry.dispose();
            if (shockwave.material) shockwave.material.dispose();
        });
        this.shockwaves = [];
        
        // Call parent dispose
        super.dispose();
    }
}