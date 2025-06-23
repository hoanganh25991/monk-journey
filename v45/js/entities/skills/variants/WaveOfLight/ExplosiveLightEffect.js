import * as THREE from 'three';
import { WaveOfLightEffect } from '../../WaveOfLightEffect.js';

/**
 * Specialized effect for Wave of Light - Explosive Light variant
 * Creates a bell that explodes with greater force and area of effect
 */
export class ExplosiveLightEffect extends WaveOfLightEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.explosionRadius = 3.0; // Larger explosion radius
        this.explosionForce = 1.5; // Stronger explosion force
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    createWaveEffect(effectGroup) {
        // Call the parent method to create the base effect
        super.createWaveEffect(effectGroup);
        
        // Modify the effect for Explosive Light variant
        this._enhanceBellEffect(effectGroup);
    }
    
    /**
     * Enhance the bell effect for explosive variant
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _enhanceBellEffect(effectGroup) {
        // Get the bell group (first child of effect group)
        const bellGroup = effectGroup.children[0];
        
        if (bellGroup) {
            // Modify bell appearance
            bellGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    // Change color to fiery orange
                    if (child.material.color) {
                        child.material.color.set(0xff6600);
                    }
                    
                    // Add emissive glow
                    if ('emissive' in child.material) {
                        child.material.emissive = new THREE.Color(0xff3300);
                        child.material.emissiveIntensity = 0.5;
                    }
                }
            });
            
            // Add flame particles to bell
            const particleCount = 20;
            const flameColors = [0xff4400, 0xff7700, 0xffaa00];
            
            for (let i = 0; i < particleCount; i++) {
                const flameSize = 0.1 + Math.random() * 0.2;
                const flameGeometry = new THREE.SphereGeometry(flameSize, 8, 8);
                const flameMaterial = new THREE.MeshBasicMaterial({
                    color: flameColors[Math.floor(Math.random() * flameColors.length)],
                    transparent: true,
                    opacity: 0.7
                });
                
                const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                
                // Random position around bell
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.5 + Math.random() * 1.0;
                const height = Math.random() * 2.0;
                
                flame.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Store animation data
                flame.userData = {
                    initialPos: flame.position.clone(),
                    speed: 1 + Math.random() * 2,
                    phase: Math.random() * Math.PI * 2,
                    isFlame: true
                };
                
                bellGroup.add(flame);
            }
        }
        
        // Get the impact area (second child of effect group)
        const impactArea = effectGroup.children[1];
        
        if (impactArea && impactArea.isMesh) {
            // Increase impact area size
            impactArea.scale.set(this.explosionRadius / 2, this.explosionRadius / 2, 1);
            
            // Change color to fiery orange
            impactArea.material.color.set(0xff6600);
        }
        
        // Create explosion particles container
        const explosionContainer = new THREE.Group();
        explosionContainer.visible = false; // Hide initially
        effectGroup.add(explosionContainer);
        
        // Store reference
        this.explosionContainer = explosionContainer;
    }
    
    /**
     * Create explosion effect
     * @private
     */
    _createExplosionEffect() {
        if (!this.explosionContainer) return;
        
        // Make container visible
        this.explosionContainer.visible = true;
        
        // Clear any existing children
        while (this.explosionContainer.children.length > 0) {
            const child = this.explosionContainer.children[0];
            this.explosionContainer.remove(child);
            
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        
        // Create explosion ring
        const ringGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.y = 0.1; // Just above ground
        
        // Store animation data
        ring.userData = {
            age: 0,
            maxAge: 0.8,
            maxRadius: this.explosionRadius,
            isExplosionRing: true
        };
        
        this.explosionContainer.add(ring);
        
        // Create explosion particles
        const particleCount = 40;
        const flameColors = [0xff4400, 0xff7700, 0xffaa00];
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.1 + Math.random() * 0.3;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: flameColors[Math.floor(Math.random() * flameColors.length)],
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position near center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            particle.position.set(
                Math.cos(angle) * radius,
                0.1 + Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                age: 0,
                maxAge: 0.5 + Math.random() * 0.5,
                speed: 3.0 + Math.random() * 3.0,
                direction: new THREE.Vector3(
                    Math.cos(angle),
                    0.5 + Math.random() * 0.5,
                    Math.sin(angle)
                ).normalize(),
                isExplosionParticle: true
            };
            
            this.explosionContainer.add(particle);
        }
        
        // Create debris particles
        const debrisCount = 15;
        const debrisColors = [0x888888, 0x666666, 0xaaaaaa];
        
        for (let i = 0; i < debrisCount; i++) {
            // Create random debris shape
            let debrisGeometry;
            const shapeType = Math.floor(Math.random() * 3);
            
            switch (shapeType) {
                case 0:
                    debrisGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                    break;
                case 1:
                    debrisGeometry = new THREE.TetrahedronGeometry(0.1);
                    break;
                case 2:
                    debrisGeometry = new THREE.OctahedronGeometry(0.1);
                    break;
            }
            
            const debrisMaterial = new THREE.MeshStandardMaterial({
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
                metalness: 0.3,
                roughness: 0.8
            });
            
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            // Random position near center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3;
            
            debris.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            debris.userData = {
                age: 0,
                maxAge: 1.0 + Math.random() * 0.5,
                speed: 2.0 + Math.random() * 2.0,
                direction: new THREE.Vector3(
                    Math.cos(angle),
                    0.8 + Math.random() * 0.4,
                    Math.sin(angle)
                ).normalize(),
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 10,
                    Math.random() * 10,
                    Math.random() * 10
                ),
                isDebris: true
            };
            
            this.explosionContainer.add(debris);
        }
        
        // Apply damage and knockback to enemies in radius
        this._applyExplosionDamage();
    }
    
    /**
     * Apply explosion damage and knockback
     * @private
     */
    _applyExplosionDamage() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        const position = this.effect.position.clone();
        
        // Get enemies in explosion radius
        const enemies = this.skill.game.enemyManager.getEnemiesInRadius(position, this.explosionRadius);
        
        for (const enemy of enemies) {
            // Calculate distance from explosion center
            const distance = enemy.getPosition().distanceTo(position);
            
            // Calculate damage falloff based on distance
            const damageFalloff = 1 - (distance / this.explosionRadius);
            const damage = this.skill.damage * damageFalloff * this.explosionForce;
            
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // Apply damage
            // enemy.takeDamage(damage, 'fire');
            
            // Apply knockback
            const knockbackDirection = new THREE.Vector3().subVectors(enemy.getPosition(), position).normalize();
            const knockbackForce = 5 * damageFalloff * this.explosionForce;
            enemy.applyKnockback(knockbackDirection, knockbackForce);
            
            // Apply burning effect
            enemy.applyStatusEffect('burning', 3.0, damage * 0.1);
            
            // Create damage number if HUD manager is available
            if (this.skill.game.hudManager) {
                this.skill.game.hudManager.createDamageNumber(damage, enemy.getPosition());
            }
        }
        
        // Play explosion sound
        if (this.skill.game && this.skill.game.audioManager) {
            this.skill.game.audioManager.playSound('explosion', position);
        }
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    updateWaveEffect(delta) {
        // Call the parent method to update the base effect
        super.updateWaveEffect(delta);
        
        // Get the bell group (first child of effect group)
        const bellGroup = this.effect.children[0];
        
        // Update flame particles on bell
        if (bellGroup) {
            bellGroup.traverse(child => {
                if (child.userData && child.userData.isFlame) {
                    // Make flames flicker
                    const initialPos = child.userData.initialPos;
                    const speed = child.userData.speed;
                    const phase = child.userData.phase;
                    
                    // Oscillate position
                    child.position.set(
                        initialPos.x + Math.sin(this.elapsedTime * speed + phase) * 0.1,
                        initialPos.y + Math.abs(Math.sin(this.elapsedTime * speed * 1.5 + phase)) * 0.2,
                        initialPos.z + Math.cos(this.elapsedTime * speed + phase) * 0.1
                    );
                    
                    // Pulse opacity
                    child.material.opacity = 0.5 + 0.3 * Math.sin(this.elapsedTime * speed * 2 + phase);
                }
            });
        }
        
        // Update explosion effects
        if (this.explosionContainer && this.explosionContainer.visible) {
            let allExpired = true;
            
            // Update all explosion children
            this.explosionContainer.traverse(child => {
                if (child.userData) {
                    // Update age
                    if (child.userData.age !== undefined) {
                        child.userData.age += delta;
                    }
                    
                    // Handle explosion ring
                    if (child.userData.isExplosionRing) {
                        // Expand ring
                        const progress = child.userData.age / child.userData.maxAge;
                        const radius = child.userData.maxRadius * progress;
                        
                        // Update ring geometry
                        child.geometry.dispose();
                        child.geometry = new THREE.RingGeometry(radius - 0.3, radius, 32);
                        
                        // Fade out over time
                        child.material.opacity = Math.max(0, 0.8 - progress * 0.8);
                        
                        // Keep effect alive if ring is still active
                        if (child.userData.age < child.userData.maxAge) {
                            allExpired = false;
                        }
                    }
                    
                    // Handle explosion particles
                    else if (child.userData.isExplosionParticle) {
                        // Move particle outward
                        const moveAmount = child.userData.speed * delta;
                        child.position.add(child.userData.direction.clone().multiplyScalar(moveAmount));
                        
                        // Fade out over time
                        const progress = child.userData.age / child.userData.maxAge;
                        child.material.opacity = Math.max(0, 0.7 - progress * 0.7);
                        
                        // Keep effect alive if particle is still active
                        if (child.userData.age < child.userData.maxAge) {
                            allExpired = false;
                        }
                    }
                    
                    // Handle debris particles
                    else if (child.userData.isDebris) {
                        // Move debris
                        const moveAmount = child.userData.speed * delta;
                        child.position.add(child.userData.direction.clone().multiplyScalar(moveAmount));
                        
                        // Apply gravity
                        child.userData.direction.y -= 9.8 * delta;
                        
                        // Rotate debris
                        child.rotation.x += child.userData.rotationSpeed.x * delta;
                        child.rotation.y += child.userData.rotationSpeed.y * delta;
                        child.rotation.z += child.userData.rotationSpeed.z * delta;
                        
                        // Bounce off ground
                        if (child.position.y < 0.05) {
                            child.position.y = 0.05;
                            child.userData.direction.y = Math.abs(child.userData.direction.y) * 0.6;
                            child.userData.speed *= 0.8;
                        }
                        
                        // Keep effect alive if debris is still active
                        if (child.userData.age < child.userData.maxAge) {
                            allExpired = false;
                        }
                    }
                }
            });
            
            // Hide container if all effects have expired
            if (allExpired) {
                this.explosionContainer.visible = false;
            }
        }
        
        // Check for bell impact to trigger explosion
        if (this.bellState && this.bellState.phase === 'impact') {
            // Create explosion when bell impacts
            this._createExplosionEffect();
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clean up explosion container
        if (this.explosionContainer) {
            this.explosionContainer.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            
            while (this.explosionContainer.children.length > 0) {
                this.explosionContainer.remove(this.explosionContainer.children[0]);
            }
        }
        
        // Call parent dispose method
        super.dispose();
    }
}