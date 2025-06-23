import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Reaching Rebuke variant of Exploding Palm
 * Applies a shocking effect that stuns enemies and chains to nearby targets
 * Visual style: Electric blue energy with lightning arcs
 */
export class ReachingRebukeEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.chainRadius = 3; // Radius to chain to additional targets
        this.maxChains = 3; // Maximum number of chain jumps
        this.stunDuration = 1.5; // Duration of stun effect in seconds
        this.chainDamageMultiplier = 0.7; // Each chain does 70% of the previous damage
        
        // Visual properties
        this.shockColor = new THREE.Color(0x00ccff); // Electric blue
        this.lightningBolts = [];
    }
    
    /**
     * Apply the effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     * @override
     */
    applyToEnemy(enemy) {
        // Apply base damage
        const damage = this.calculateDamage(enemy);
        enemy.takeDamage(damage);
        
        // Apply stun effect
        this.applyStunEffect(enemy);
        
        // Create visual effect
        this.createHitEffect(enemy.getPosition());
        
        // Chain to nearby enemies
        this.chainToNearbyEnemies(enemy, damage, 1);
    }
    
    /**
     * Apply a stun effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the stun effect to
     */
    applyStunEffect(enemy) {
        // Add a status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                name: 'Reaching Rebuke',
                type: 'stun',
                duration: this.stunDuration,
                onApply: (enemy) => {
                    // Stun the enemy
                    enemy.stun(this.stunDuration);
                    
                    // Create electric aura
                    this.createElectricAura(enemy);
                }
            });
        }
    }
    
    /**
     * Chain the effect to nearby enemies
     * @param {Enemy} sourceEnemy - The enemy to chain from
     * @param {number} sourceDamage - The damage dealt to the source enemy
     * @param {number} chainCount - The current chain count
     */
    chainToNearbyEnemies(sourceEnemy, sourceDamage, chainCount) {
        if (chainCount > this.maxChains || !this.skill.game.enemyManager) return;
        
        const sourcePosition = sourceEnemy.getPosition();
        if (!sourcePosition) return;
        
        // Find nearby enemies
        const nearbyEnemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            sourcePosition,
            this.chainRadius
        );
        
        // Filter out the source enemy and already chained enemies
        const validTargets = nearbyEnemies.filter(enemy => {
            return enemy !== sourceEnemy && !enemy.hasStatusEffect('Reaching Rebuke');
        });
        
        if (validTargets.length === 0) return;
        
        // Select the closest enemy
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        validTargets.forEach(enemy => {
            const enemyPosition = enemy.getPosition();
            if (!enemyPosition) return;
            
            const distance = sourcePosition.distanceTo(enemyPosition);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        if (!closestEnemy) return;
        
        // Calculate chain damage
        const chainDamage = sourceDamage * this.chainDamageMultiplier;
        
        // Apply damage to the chained enemy
        closestEnemy.takeDamage(chainDamage);
        
        // Apply stun effect
        this.applyStunEffect(closestEnemy);
        
        // Create lightning bolt between enemies
        const targetPosition = closestEnemy.getPosition();
        if (targetPosition) {
            this.createLightningBolt(sourcePosition, targetPosition);
        }
        
        // Create hit effect
        this.createHitEffect(targetPosition);
        
        // Chain to the next enemy
        this.chainToNearbyEnemies(closestEnemy, chainDamage, chainCount + 1);
    }
    
    /**
     * Create a lightning bolt between two positions
     * @param {THREE.Vector3} startPosition - The start position of the lightning bolt
     * @param {THREE.Vector3} endPosition - The end position of the lightning bolt
     */
    createLightningBolt(startPosition, endPosition) {
        if (!startPosition || !endPosition || !this.skill.game.scene) return;
        
        // Create a jagged line for lightning
        const segments = 10;
        const points = [];
        
        // Start point
        points.push(new THREE.Vector3(startPosition.x, startPosition.y + 1, startPosition.z));
        
        // Middle points with randomness
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            
            // Interpolate between start and end
            const point = new THREE.Vector3(
                startPosition.x + (endPosition.x - startPosition.x) * t,
                startPosition.y + (endPosition.y - startPosition.y) * t + 1,
                startPosition.z + (endPosition.z - startPosition.z) * t
            );
            
            // Add randomness perpendicular to the line
            const perpX = -(endPosition.z - startPosition.z);
            const perpZ = endPosition.x - startPosition.x;
            const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);
            
            if (perpLength > 0) {
                const randomOffset = (Math.random() - 0.5) * 0.5;
                point.x += (perpX / perpLength) * randomOffset;
                point.z += (perpZ / perpLength) * randomOffset;
            }
            
            // Add vertical randomness
            point.y += (Math.random() - 0.5) * 0.3;
            
            points.push(point);
        }
        
        // End point
        points.push(new THREE.Vector3(endPosition.x, endPosition.y + 1, endPosition.z));
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.shockColor,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const lightning = new THREE.Line(geometry, material);
        
        // Add to scene
        this.skill.game.scene.add(lightning);
        
        // Store for animation and cleanup
        this.lightningBolts.push({
            bolt: lightning,
            creationTime: this.skill.game.time.getElapsedTime(),
            duration: 0.5
        });
        
        // Update lightning bolts
        this.updateLightningBolts();
    }
    
    /**
     * Update and remove expired lightning bolts
     */
    updateLightningBolts() {
        const currentTime = this.skill.game.time.getElapsedTime();
        const activeBolts = [];
        
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const boltData = this.lightningBolts[i];
            const age = currentTime - boltData.creationTime;
            
            if (age < boltData.duration) {
                // Still active, update opacity based on age
                const opacity = 1 - (age / boltData.duration);
                boltData.bolt.material.opacity = opacity;
                
                activeBolts.push(boltData);
            } else {
                // Expired, remove from scene
                if (this.skill.game.scene) {
                    this.skill.game.scene.remove(boltData.bolt);
                }
                
                // Dispose resources
                boltData.bolt.geometry.dispose();
                boltData.bolt.material.dispose();
            }
        }
        
        // Update the list of active bolts
        this.lightningBolts = activeBolts;
    }
    
    /**
     * Create an electric aura around a stunned enemy
     * @param {Enemy} enemy - The enemy to create the aura around
     */
    createElectricAura(enemy) {
        if (!enemy || !this.skill.game.scene) return;
        
        const enemyPosition = enemy.getPosition();
        if (!enemyPosition) return;
        
        // Create electric particles around the enemy
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere around the enemy
            const radius = 1 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 1; // Centered at enemy height
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Electric blue color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.shockColor.r * colorVariation;
            colors[i * 3 + 1] = this.shockColor.g * colorVariation;
            colors[i * 3 + 2] = this.shockColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Position at enemy
        particles.position.copy(enemyPosition);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the electric aura
        const startTime = this.skill.game.time.getElapsedTime();
        
        const updateElectricAura = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            
            // Remove when stun duration is over
            if (elapsed >= this.stunDuration) {
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateElectricAura);
                return;
            }
            
            // Update enemy position
            const newPosition = enemy.getPosition();
            if (newPosition) {
                particles.position.copy(newPosition);
            }
            
            // Animate particles
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Oscillate positions
                const idx = i * 3;
                const originalX = positions[idx];
                const originalY = positions[idx + 1];
                const originalZ = positions[idx + 2];
                
                const distance = Math.sqrt(
                    originalX * originalX + 
                    originalY * originalY + 
                    originalZ * originalZ
                );
                
                // Add some noise to positions
                positions[idx] = originalX + (Math.random() - 0.5) * 0.1;
                positions[idx + 1] = originalY + (Math.random() - 0.5) * 0.1;
                positions[idx + 2] = originalZ + (Math.random() - 0.5) * 0.1;
                
                // Normalize to maintain distance
                const newDistance = Math.sqrt(
                    positions[idx] * positions[idx] + 
                    positions[idx + 1] * positions[idx + 1] + 
                    positions[idx + 2] * positions[idx + 2]
                );
                
                positions[idx] *= distance / newDistance;
                positions[idx + 1] *= distance / newDistance;
                positions[idx + 2] *= distance / newDistance;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Pulse opacity
            particleMaterial.opacity = 0.5 + 0.3 * Math.sin(elapsed * 10);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateElectricAura);
    }
    
    /**
     * Create a hit effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     * @override
     */
    createHitEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create base hit effect
        super.createHitEffect(position);
        
        // Add additional electric burst effect
        this.createElectricBurstEffect(position);
    }
    
    /**
     * Create an electric burst effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createElectricBurstEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a ring geometry for the burst
        const ringGeometry = new THREE.RingGeometry(0.1, 1.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.shockColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Animate the burst
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateBurst = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove ring
                this.skill.game.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBurst);
                return;
            }
            
            // Expand the ring
            ring.scale.set(t * 2, t * 2, 1);
            
            // Fade out
            ringMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBurst);
    }
    
    /**
     * Clean up resources when the effect is destroyed
     */
    destroy() {
        super.destroy();
        
        // Clean up lightning bolts
        this.lightningBolts.forEach(boltData => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(boltData.bolt);
            }
            
            boltData.bolt.geometry.dispose();
            boltData.bolt.material.dispose();
        });
        
        this.lightningBolts = [];
    }
}