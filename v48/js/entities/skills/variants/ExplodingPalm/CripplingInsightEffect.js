import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Crippling Insight variant of Exploding Palm
 * Applies a bleeding effect that slows enemies and deals damage over time
 * Visual style: Dark red energy with blood-like particles
 */
export class CripplingInsightEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.bleedDuration = 5; // Duration of bleed effect in seconds
        this.bleedDamagePerSecond = this.skill.damage * 0.2; // 20% of base damage per second
        this.slowFactor = 0.5; // Enemies move at 50% speed when affected
        
        // Visual properties
        this.bleedColor = new THREE.Color(0x990000); // Dark red for blood
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
        
        // Apply bleed effect
        this.applyBleedEffect(enemy);
        
        // Create visual effect
        this.createHitEffect(enemy.getPosition());
    }
    
    /**
     * Apply the bleed effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the bleed effect to
     */
    applyBleedEffect(enemy) {
        // Add a status effect to the enemy
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect({
                name: 'Crippling Insight',
                type: 'bleed',
                duration: this.bleedDuration,
                tickInterval: 1, // Apply damage every second
                onTick: (enemy, deltaTime) => {
                    // Apply bleed damage
                    const bleedDamage = this.bleedDamagePerSecond * deltaTime;
                    enemy.takeDamage(bleedDamage);
                    
                    // Create blood drip effect
                    if (Math.random() < deltaTime * 2) {
                        this.createBloodDripEffect(enemy.getPosition());
                    }
                },
                onApply: (enemy) => {
                    // Slow the enemy
                    enemy.applySpeedModifier('crippling-insight', this.slowFactor);
                },
                onRemove: (enemy) => {
                    // Remove slow effect
                    enemy.removeSpeedModifier('crippling-insight');
                }
            });
        }
    }
    
    /**
     * Create a blood drip effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createBloodDripEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a small pool of blood particles
        const particleCount = 5 + Math.floor(Math.random() * 5);
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position near the enemy
            const radius = 0.3 * Math.random();
            const angle = Math.random() * Math.PI * 2;
            
            positions[i * 3] = position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = position.y + Math.random() * 0.2; // Slightly above ground
            positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
            
            // Blood red color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.bleedColor.r * colorVariation;
            colors[i * 3 + 1] = this.bleedColor.g * colorVariation;
            colors[i * 3 + 2] = this.bleedColor.b * colorVariation;
            
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
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the blood drips falling to the ground
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 1 + Math.random(); // 1-2 seconds
        
        const updateBloodDrips = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBloodDrips);
                return;
            }
            
            // Update positions - blood drips falling
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Move downward
                positions[i * 3 + 1] = position.y + Math.random() * 0.2 - t * 0.5;
                
                // Spread outward slightly
                const angle = Math.atan2(
                    positions[i * 3 + 2] - position.z,
                    positions[i * 3] - position.x
                );
                
                const distance = Math.sqrt(
                    Math.pow(positions[i * 3] - position.x, 2) +
                    Math.pow(positions[i * 3 + 2] - position.z, 2)
                );
                
                const newDistance = distance + t * 0.1;
                
                positions[i * 3] = position.x + Math.cos(angle) * newDistance;
                positions[i * 3 + 2] = position.z + Math.sin(angle) * newDistance;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out near the end
            if (t > 0.7) {
                particleMaterial.opacity = 0.8 * (1 - (t - 0.7) / 0.3);
            }
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBloodDrips);
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
        
        // Add additional blood splash effect
        this.createBloodSplashEffect(position);
    }
    
    /**
     * Create a blood splash effect at the specified position
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createBloodSplashEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a blood splash using particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a sphere
            const radius = 0.5 + Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta) * 0.5; // Flatter in vertical
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
            
            // Blood red color with variations
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = this.bleedColor.r * colorVariation;
            colors[i * 3 + 1] = this.bleedColor.g * colorVariation;
            colors[i * 3 + 2] = this.bleedColor.b * colorVariation;
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
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
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the blood splash
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.5; // 0.5 seconds
        
        const updateBloodSplash = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove particles
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateBloodSplash);
                return;
            }
            
            // Fade out
            particleMaterial.opacity = 0.8 * (1 - t);
            
            // Expand outward
            particles.scale.set(1 + t, 1 + t * 0.5, 1 + t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateBloodSplash);
    }
}