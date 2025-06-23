import * as THREE from 'three';
import { FlyingDragonEffect } from '../../FlyingDragonEffect.js';

/**
 * Effect for the Inferno Dragon variant of Flying Dragon
 * Creates a fiery dragon that deals fire damage over time
 * Visual style: Flames, embers, and heat distortion
 */
export class InfernoDragonEffect extends FlyingDragonEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.fireDamage = true;
        this.burnDuration = 3; // 3 seconds burn
        this.burnDamage = skill.damage * 0.1; // 10% of base damage per tick
        
        // Visual properties
        this.flames = [];
        this.embers = null;
        this.fireColor = new THREE.Color(0xff6600); // Orange-red
    }

    /**
     * Create the Inferno Dragon effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to fire color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.fireColor.clone();
                    });
                } else {
                    child.material.color = this.fireColor.clone();
                }
            }
        });
        
        // Add flames
        this.addFlames(effectGroup);
        
        // Add embers
        this.addEmbers(effectGroup);
        
        // Add heat distortion
        this.addHeatDistortion(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add flames to the effect
     * @param {THREE.Group} group - The group to add flames to
     */
    addFlames(group) {
        const flameCount = 8;
        
        for (let i = 0; i < flameCount; i++) {
            // Create a flame
            const flame = this.createFlame();
            
            // Position around the dragon
            const angle = (i / flameCount) * Math.PI * 2;
            const radius = 0.5;
            flame.position.x = Math.cos(angle) * radius;
            flame.position.z = Math.sin(angle) * radius;
            flame.position.y = 0.5 + Math.random() * 0.5;
            
            // Store initial position for animation
            flame.userData.initialPosition = flame.position.clone();
            flame.userData.angle = angle;
            flame.userData.radius = radius;
            flame.userData.speed = 0.5 + Math.random() * 0.5;
            
            group.add(flame);
            this.flames.push(flame);
        }
    }
    
    /**
     * Create a stylized flame using simple geometries
     * @returns {THREE.Group} - The created flame
     */
    createFlame() {
        const flameGroup = new THREE.Group();
        
        // Create flame using a cone
        const flameGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.rotation.x = Math.PI; // Point upward
        flameGroup.add(flame);
        
        // Add inner flame (brighter)
        const innerFlameGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const innerFlameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00, // Yellow
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
        innerFlame.rotation.x = Math.PI; // Point upward
        innerFlame.position.y = 0.05;
        flameGroup.add(innerFlame);
        
        return flameGroup;
    }
    
    /**
     * Add embers to the effect
     * @param {THREE.Group} group - The group to add embers to
     */
    addEmbers(group) {
        const emberCount = 50;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(emberCount * 3);
        const sizes = new Float32Array(emberCount);
        const colors = new Float32Array(emberCount * 3);
        
        // Position particles around the dragon
        for (let i = 0; i < emberCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1;
            const height = Math.random() * 1.5;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random sizes
            sizes[i] = 0.03 + Math.random() * 0.05;
            
            // Random colors (from yellow to red)
            const colorT = Math.random();
            colors[i * 3] = 1; // R
            colors[i * 3 + 1] = 0.5 * colorT; // G
            colors[i * 3 + 2] = 0; // B
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            vertexColors: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.embers = particles;
    }
    
    /**
     * Add heat distortion to the effect
     * @param {THREE.Group} group - The group to add heat distortion to
     */
    addHeatDistortion(group) {
        // Create a sphere for the heat distortion
        const distortionGeometry = new THREE.SphereGeometry(1, 16, 16);
        const distortionMaterial = new THREE.MeshBasicMaterial({
            color: this.fireColor,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
        group.add(distortion);
        
        // Store for animation
        this.heatDistortion = distortion;
    }
    
    /**
     * Update the Inferno Dragon effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate flames
            this.flames.forEach(flame => {
                const initialPosition = flame.userData.initialPosition;
                const angle = flame.userData.angle + this.elapsedTime * flame.userData.speed;
                const radius = flame.userData.radius;
                
                // Move in a circular pattern
                flame.position.x = Math.cos(angle) * radius;
                flame.position.z = Math.sin(angle) * radius;
                
                // Add some vertical movement
                flame.position.y = initialPosition.y + Math.sin(this.elapsedTime * 2) * 0.1;
                
                // Flicker the flames
                const flickerScale = 0.8 + Math.random() * 0.4;
                flame.scale.set(flickerScale, flickerScale, flickerScale);
                
                // Flicker opacity
                flame.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 0.7 + Math.random() * 0.3;
                    }
                });
            });
            
            // Animate embers
            if (this.embers && this.embers.geometry) {
                const positions = this.embers.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Move upward
                    positions[i * 3 + 1] += delta * (0.5 + Math.random() * 0.5);
                    
                    // Add some random horizontal movement
                    positions[i * 3] += delta * (Math.random() - 0.5) * 0.2;
                    positions[i * 3 + 2] += delta * (Math.random() - 0.5) * 0.2;
                    
                    // Reset if too high
                    if (positions[i * 3 + 1] > 2) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 1;
                        
                        positions[i * 3] = Math.cos(angle) * radius;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = Math.sin(angle) * radius;
                    }
                }
                
                this.embers.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate heat distortion
            if (this.heatDistortion) {
                // Pulse the distortion
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 3);
                this.heatDistortion.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate slowly
                this.heatDistortion.rotation.y += delta * 0.2;
            }
        }
    }
    
    /**
     * Apply fire damage effect to an enemy
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyFireDamageEffect(enemy) {
        if (!enemy || !this.fireDamage) return;
        
        // Apply burn status effect
        if (enemy.addStatusEffect) {
            const burnEffect = {
                type: 'burn',
                duration: this.burnDuration,
                tickRate: 0.5, // Damage every 0.5 seconds
                damagePerTick: this.burnDamage,
                source: 'Inferno Dragon'
            };
            
            enemy.addStatusEffect(burnEffect);
            
            // Create a visual effect for the burning
            this.createBurnVisualEffect(enemy);
        }
    }
    
    /**
     * Create a visual effect for the burn status
     * @param {Enemy} enemy - The enemy to create the effect on
     */
    createBurnVisualEffect(enemy) {
        if (!enemy || !this.skill.game) return;
        
        // Create fire particles that surround the enemy
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Get enemy position
        const enemyPosition = enemy.getPosition();
        const enemyRadius = enemy.radius || 0.5;
        const enemyHeight = enemy.height || 1.5;
        
        // Initialize particles around the enemy
        for (let i = 0; i < particleCount; i++) {
            // Random position on the surface of the enemy
            const theta = Math.random() * Math.PI * 2;
            const height = Math.random() * enemyHeight;
            
            positions[i * 3] = enemyPosition.x + Math.cos(theta) * enemyRadius;
            positions[i * 3 + 1] = enemyPosition.y + height;
            positions[i * 3 + 2] = enemyPosition.z + Math.sin(theta) * enemyRadius;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.fireColor,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // Add to scene
        this.skill.game.scene.add(particles);
        
        // Animate the fire effect
        let elapsed = 0;
        const duration = this.burnDuration;
        
        const animate = () => {
            const delta = 1/60; // Assume 60fps
            elapsed += delta;
            
            // Update particle positions to follow the enemy
            if (enemy.getPosition) {
                const newPosition = enemy.getPosition();
                
                // Update particles
                const positions = particles.geometry.attributes.position.array;
                
                for (let i = 0; i < particleCount; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate offset from enemy center
                    const offsetX = x - newPosition.x;
                    const offsetZ = z - newPosition.z;
                    
                    // Move with enemy
                    positions[i * 3] = newPosition.x + offsetX;
                    positions[i * 3 + 2] = newPosition.z + offsetZ;
                    
                    // Move upward
                    positions[i * 3 + 1] += delta * 0.5;
                    
                    // Reset if too high
                    if (positions[i * 3 + 1] > newPosition.y + enemyHeight + 0.5) {
                        const theta = Math.random() * Math.PI * 2;
                        positions[i * 3] = newPosition.x + Math.cos(theta) * enemyRadius;
                        positions[i * 3 + 1] = newPosition.y + Math.random() * enemyHeight * 0.5;
                        positions[i * 3 + 2] = newPosition.z + Math.sin(theta) * enemyRadius;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Fade out near the end
            if (elapsed > duration * 0.7) {
                const fadeRatio = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
                particles.material.opacity = 0.8 * fadeRatio;
            }
            
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                // Remove effects
                this.skill.game.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Override the damage application to add fire damage effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply fire damage effect
        this.applyFireDamageEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.flames = [];
        this.embers = null;
        this.heatDistortion = null;
        
        // Call parent dispose
        super.dispose();
    }
}