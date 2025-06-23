import * as THREE from 'three';
import { BreathOfHeavenEffect } from '../../BreathOfHeavenEffect.js';

/**
 * Effect for the Soothing Mist variant of Breath of Heaven
 * Creates a healing mist that provides healing over time
 * Visual style: Swirling mist particles and gentle fog
 */
export class SoothingMistEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.healOverTime = true;
        this.healingTickRate = 0.5; // Heal every 0.5 seconds
        
        // Visual properties
        this.mistParticles = null;
        this.mistClouds = [];
        this.mistColor = new THREE.Color(0xaaffcc); // Soft green-blue
    }

    /**
     * Create the Soothing Mist effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base aura to look more like mist
        const baseAura = effectGroup.children[0];
        baseAura.material.color = this.mistColor;
        baseAura.material.opacity = 0.4;
        
        // Replace the default particles with mist particles
        if (effectGroup.children[1] && effectGroup.children[1].isPoints) {
            effectGroup.remove(effectGroup.children[1]);
        }
        
        // Add mist particles
        this.addMistParticles(effectGroup);
        
        // Add mist clouds
        this.addMistClouds(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add mist particles to the effect
     * @param {THREE.Group} group - The group to add mist particles to
     */
    addMistParticles(group) {
        const particleCount = 100;
        const baseRadius = this.skill.radius;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions within a sphere
            const radius = Math.random() * baseRadius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = (Math.random() * 0.5) + 0.1; // Keep particles low to the ground
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Random sizes
            sizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: this.mistColor,
            size: 0.2,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.mistParticles = particles;
    }
    
    /**
     * Add mist clouds to the effect
     * @param {THREE.Group} group - The group to add mist clouds to
     */
    addMistClouds(group) {
        const cloudCount = 6;
        const baseRadius = this.skill.radius * 0.7;
        
        for (let i = 0; i < cloudCount; i++) {
            // Create a mist cloud
            const cloud = this.createMistCloud();
            
            // Position around a circle
            const angle = (i / cloudCount) * Math.PI * 2;
            cloud.position.x = Math.cos(angle) * baseRadius * Math.random();
            cloud.position.z = Math.sin(angle) * baseRadius * Math.random();
            cloud.position.y = 0.2 + Math.random() * 0.3;
            
            // Random rotation
            cloud.rotation.y = Math.random() * Math.PI * 2;
            
            // Store initial position for animation
            cloud.userData.initialY = cloud.position.y;
            cloud.userData.driftSpeed = 0.2 + Math.random() * 0.3;
            cloud.userData.driftOffset = Math.random() * Math.PI * 2;
            cloud.userData.rotationSpeed = 0.1 + Math.random() * 0.2;
            
            group.add(cloud);
            this.mistClouds.push(cloud);
        }
    }
    
    /**
     * Create a stylized mist cloud using simple geometries
     * @returns {THREE.Group} - The created mist cloud
     */
    createMistCloud() {
        const cloudGroup = new THREE.Group();
        
        // Create several overlapping spheres to form a cloud
        const sphereCount = 5;
        const baseSize = 0.5;
        
        for (let i = 0; i < sphereCount; i++) {
            const size = baseSize * (0.7 + Math.random() * 0.6);
            const sphereGeometry = new THREE.SphereGeometry(size, 8, 8);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: this.mistColor,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.2,
                blending: THREE.AdditiveBlending
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            // Position randomly within the cloud
            sphere.position.x = (Math.random() - 0.5) * baseSize;
            sphere.position.y = (Math.random() - 0.5) * baseSize * 0.5;
            sphere.position.z = (Math.random() - 0.5) * baseSize;
            
            cloudGroup.add(sphere);
        }
        
        return cloudGroup;
    }
    
    /**
     * Update the Soothing Mist effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate mist particles
            if (this.mistParticles && this.mistParticles.geometry) {
                const positions = this.mistParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Slow drifting motion
                    const angle = Math.atan2(z, x);
                    const distance = Math.sqrt(x * x + z * z);
                    
                    // Slightly change angle for drifting effect
                    const newAngle = angle + delta * (Math.random() - 0.5) * 0.5;
                    
                    positions[i * 3] = Math.cos(newAngle) * distance;
                    positions[i * 3 + 2] = Math.sin(newAngle) * distance;
                    
                    // Slight up and down motion
                    positions[i * 3 + 1] = y + delta * (Math.random() - 0.5) * 0.2;
                    
                    // Keep particles within bounds
                    if (positions[i * 3 + 1] < 0.1) positions[i * 3 + 1] = 0.1;
                    if (positions[i * 3 + 1] > 1.5) positions[i * 3 + 1] = 1.5;
                }
                
                this.mistParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate mist clouds
            this.mistClouds.forEach(cloud => {
                const initialY = cloud.userData.initialY || 0.2;
                const driftSpeed = cloud.userData.driftSpeed || 0.2;
                const driftOffset = cloud.userData.driftOffset || 0;
                const rotationSpeed = cloud.userData.rotationSpeed || 0.1;
                
                // Gentle floating motion
                cloud.position.y = initialY + Math.sin(this.elapsedTime * driftSpeed + driftOffset) * 0.1;
                
                // Slow rotation
                cloud.rotation.y += delta * rotationSpeed;
                
                // Pulse the opacity slightly
                cloud.children.forEach(child => {
                    if (child.material) {
                        const baseMaterial = child.material;
                        const baseOpacity = baseMaterial.userData.baseOpacity || baseMaterial.opacity;
                        
                        // Store the base opacity if not already stored
                        if (!baseMaterial.userData.baseOpacity) {
                            baseMaterial.userData.baseOpacity = baseOpacity;
                        }
                        
                        // Pulse opacity
                        baseMaterial.opacity = baseOpacity * (0.8 + 0.2 * Math.sin(this.elapsedTime * 0.5 + driftOffset));
                    }
                });
            });
        }
    }
    
    /**
     * Apply healing over time effect
     */
    applyHealingEffect() {
        if (!this.skill.game) return;
        
        // Apply reduced healing but more frequently
        const player = this.skill.game.player;
        if (player && player.stats && this.healOverTime) {
            const healAmount = (this.skill.healing || 10) * 0.4; // 40% of normal healing per tick
            player.stats.heal(healAmount);
            
            // Show healing effect using the EffectsManager
            if (this.skill.game.effectsManager) {
                const playerPosition = player.getPosition();
                if (playerPosition) {
                    // Create a position slightly above the player
                    const healPosition = new THREE.Vector3(
                        playerPosition.x,
                        playerPosition.y + 2,
                        playerPosition.z
                    );
                    
                    // Use a smaller healing effect for the continuous healing
                    const healEffect = new this.skill.game.effectsManager.BleedingEffect({
                        amount: healAmount,
                        duration: 1,
                        isPlayerDamage: false,
                        color: 0xaaffcc // Use the mist color for healing
                    });
                    
                    // Create and add the effect to the scene
                    const effectGroup = healEffect.create(healPosition, new THREE.Vector3(0, 1, 0));
                    this.skill.game.scene.add(effectGroup);
                    
                    // Add to effects manager for updates
                    this.skill.game.effectsManager.effects.push(healEffect);
                }
            }
        }
        
        // Apply damage to enemies as normal
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // if (this.skill.game.enemyManager) {
        //     const damagePosition = this.effect.position.clone();
            
        //     const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //         damagePosition,
        //         this.skill.radius
        //     );
            
        //     enemies.forEach(enemy => {
        //         const damageAmount = this.skill.damage * 0.5; // Reduced damage per tick
        //         enemy.takeDamage(damageAmount);
        //     });
        // }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.mistParticles = null;
        this.mistClouds = [];
        
        // Call parent dispose
        super.dispose();
    }
}