import * as THREE from 'three';
import { ShieldOfZenEffect } from '../../ShieldOfZenEffect.js';

/**
 * Specialized effect for Shield of Zen - Retribution Aura variant
 * Creates a shield that reflects damage back to attackers
 */
export class RetributionAuraEffect extends ShieldOfZenEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.damageReduction = 0.2; // 20% damage reduction
        this.damageReflection = 0.5; // 50% damage reflection
        this.retributionRadius = 3.0; // Radius for retribution damage
    }

    /**
     * Override the base method to create a specialized effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @private
     */
    _createShieldOfZenEffect(effectGroup, position, direction) {
        // Call the parent method to create the base effect
        super._createShieldOfZenEffect(effectGroup, position, direction);
        
        // Create retribution aura effect
        this._createRetributionAura(effectGroup);
    }
    
    /**
     * Create a retribution aura effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createRetributionAura(effectGroup) {
        // Create aura group
        const auraGroup = new THREE.Group();
        
        // Create retribution shield using sphere geometry
        const shieldGeometry = new THREE.SphereGeometry(2.3, 32, 32);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3300, // Fiery red
            transparent: true,
            opacity: 0.3,
            emissive: 0xff3300,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        auraGroup.add(shield);
        
        // Create flame particles
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.1 + Math.random() * 0.2;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.5),
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position randomly around shield
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 2.3 + (Math.random() * 0.4 - 0.2);
            
            particle.position.set(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            );
            
            // Store animation data
            particle.userData = {
                initialRadius: radius,
                orbitSpeed: 0.5 + Math.random() * 1.0,
                orbitAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                pulseSpeed: 1.0 + Math.random() * 2.0,
                phase: Math.random() * Math.PI * 2
            };
            
            auraGroup.add(particle);
            particles.push(particle);
        }
        
        // Create retribution runes
        const runeCount = 6;
        const runes = [];
        
        for (let i = 0; i < runeCount; i++) {
            // Create rune using custom geometry
            const runeGroup = new THREE.Group();
            
            // Create a rune symbol (simple cross shape)
            const runeWidth = 0.3;
            const runeHeight = 0.4;
            const runeThickness = 0.05;
            
            // Vertical bar
            const verticalGeometry = new THREE.BoxGeometry(runeThickness, runeHeight, runeThickness);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.9
            });
            
            const verticalBar = new THREE.Mesh(verticalGeometry, runeMaterial);
            runeGroup.add(verticalBar);
            
            // Horizontal bar
            const horizontalGeometry = new THREE.BoxGeometry(runeWidth, runeThickness, runeThickness);
            const horizontalBar = new THREE.Mesh(horizontalGeometry, runeMaterial);
            horizontalBar.position.y = runeHeight * 0.2; // Offset from center
            runeGroup.add(horizontalBar);
            
            // Position rune around shield
            const angle = (i / runeCount) * Math.PI * 2;
            const radius = 2.5;
            
            runeGroup.position.set(
                Math.cos(angle) * radius,
                0, // Position at equator
                Math.sin(angle) * radius
            );
            
            // Orient rune to face center
            runeGroup.lookAt(0, 0, 0);
            
            // Store animation data
            runeGroup.userData = {
                orbitSpeed: 0.3,
                orbitAxis: new THREE.Vector3(0, 1, 0),
                pulseSpeed: 1.5,
                phase: (i / runeCount) * Math.PI * 2
            };
            
            auraGroup.add(runeGroup);
            runes.push(runeGroup);
        }
        
        // Create ground effect
        const groundRadius = this.retributionRadius;
        const groundGeometry = new THREE.CircleGeometry(groundRadius, 32);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Lay flat
        ground.position.y = 0.05; // Just above ground
        
        auraGroup.add(ground);
        
        // Add aura group to effect group
        effectGroup.add(auraGroup);
        
        // Store references
        this.aura = auraGroup;
        this.shield = shield;
        this.particles = particles;
        this.runes = runes;
        this.ground = ground;
        this.retributionTimer = 0;
        this.lastDamageTaken = 0;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateShieldOfZenEffect(delta) {
        // Call the parent method to update the base effect
        super._updateShieldOfZenEffect(delta);
        
        // Update retribution shield
        if (this.shield) {
            // Pulse shield opacity
            this.shield.material.opacity = 0.2 + 0.1 * Math.sin(this.elapsedTime * 1.5);
            this.shield.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(this.elapsedTime * 1.5);
        }
        
        // Update flame particles
        if (this.particles) {
            for (const particle of this.particles) {
                if (particle.userData) {
                    // Orbit around player
                    const axis = particle.userData.orbitAxis;
                    const angle = particle.userData.orbitSpeed * delta;
                    
                    // Apply rotation around the orbit axis
                    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
                    particle.position.applyMatrix4(rotationMatrix);
                    
                    // Pulse size
                    const scale = 0.8 + 0.4 * Math.sin(this.elapsedTime * particle.userData.pulseSpeed + particle.userData.phase);
                    particle.scale.set(scale, scale, scale);
                    
                    // Pulse color
                    const hue = 0.05 + 0.05 * Math.sin(this.elapsedTime * particle.userData.pulseSpeed + particle.userData.phase);
                    particle.material.color.setHSL(hue, 1, 0.5 + 0.3 * Math.sin(this.elapsedTime * particle.userData.pulseSpeed + particle.userData.phase));
                }
            }
        }
        
        // Update runes
        if (this.runes) {
            for (const rune of this.runes) {
                if (rune.userData) {
                    // Orbit around player
                    const axis = rune.userData.orbitAxis;
                    const angle = rune.userData.orbitSpeed * delta;
                    
                    // Apply rotation around the orbit axis
                    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
                    rune.position.applyMatrix4(rotationMatrix);
                    
                    // Orient rune to face center
                    rune.lookAt(0, 0, 0);
                    
                    // Pulse opacity
                    const opacity = 0.7 + 0.3 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed + rune.userData.phase);
                    rune.children.forEach(child => {
                        if (child.material) {
                            child.material.opacity = opacity;
                        }
                    });
                }
            }
        }
        
        // Update ground effect
        if (this.ground) {
            // Pulse opacity
            this.ground.material.opacity = 0.1 + 0.1 * Math.sin(this.elapsedTime * 1.0);
            
            // Rotate slowly
            this.ground.rotation.z += 0.1 * delta;
        }
        
        // Check for damage taken to trigger retribution
        if (this.skill.game && this.skill.game.player) {
            const player = this.skill.game.player;
            
            // Check if player has taken damage
            if (player.lastDamageTaken > this.lastDamageTaken) {
                // Calculate damage difference
                const damageTaken = player.lastDamageTaken - this.lastDamageTaken;
                
                // Update last damage value
                this.lastDamageTaken = player.lastDamageTaken;
                
                // Trigger retribution effect
                this._triggerRetribution(damageTaken);
            }
        }
        
        // Periodic retribution pulse
        this.retributionTimer += delta;
        if (this.retributionTimer >= 3.0) { // Every 3 seconds
            // Reset timer
            this.retributionTimer = 0;
            
            // Trigger small retribution pulse
            this._triggerRetribution(10, true);
        }
    }
    
    /**
     * Trigger retribution effect
     * @param {number} damageTaken - Amount of damage taken
     * @param {boolean} isPeriodic - Whether this is a periodic pulse
     * @private
     */
    _triggerRetribution(damageTaken, isPeriodic = false) {
        if (!this.effect || damageTaken <= 0) return;
        
        // Calculate retribution damage
        const retributionDamage = damageTaken * this.damageReflection;
        
        // Create retribution effect
        const effectGroup = new THREE.Group();
        
        // Create expanding ring
        const ringGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
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
            maxAge: 1.0,
            maxRadius: this.retributionRadius,
            isRetributionRing: true
        };
        
        effectGroup.add(ring);
        
        // Create flame particles
        const particleCount = isPeriodic ? 10 : 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particleSize = 0.1 + Math.random() * 0.2;
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.5),
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around player
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.0;
            particle.position.set(
                Math.cos(angle) * radius,
                0.1 + Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                age: 0,
                maxAge: 0.5 + Math.random() * 0.5,
                speed: 3.0 + Math.random() * 2.0,
                direction: new THREE.Vector3(
                    Math.cos(angle),
                    0.5 + Math.random() * 0.5,
                    Math.sin(angle)
                ).normalize(),
                isRetributionParticle: true
            };
            
            effectGroup.add(particle);
        }
        
        // Add effect group to main effect
        this.effect.add(effectGroup);
        
        // Store reference
        if (!this.retributionEffects) {
            this.retributionEffects = [];
        }
        this.retributionEffects.push(effectGroup);
        
        // Apply damage to nearby enemies
        if (this.skill.game && this.skill.game.enemyManager) {
            const position = this.effect.position.clone();
            const enemies = this.skill.game.enemyManager.getEnemiesInRadius(position, this.retributionRadius);
            
            for (const enemy of enemies) {
                // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
                // Apply retribution damage
                // enemy.takeDamage(retributionDamage, 'fire');
                
                // Apply burning effect
                if (!isPeriodic) {
                    enemy.applyStatusEffect('burning', 3.0, retributionDamage * 0.1);
                }
            }
            
            // Show notification if UI manager is available
            if (!isPeriodic && this.skill.game.player && this.skill.game.player.game && this.skill.game.player.game.hudManager) {
                this.skill.game.player.game.hudManager.showNotification(`Retribution deals ${Math.round(retributionDamage)} damage!`);
            }
        }
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Call parent update method
        super.update(delta);
        
        // Update retribution effects
        if (this.retributionEffects) {
            for (let i = this.retributionEffects.length - 1; i >= 0; i--) {
                const effectGroup = this.retributionEffects[i];
                let expired = true;
                
                // Update all children
                for (let j = 0; j < effectGroup.children.length; j++) {
                    const child = effectGroup.children[j];
                    
                    if (child.userData) {
                        // Update age
                        child.userData.age += delta;
                        
                        // Handle retribution ring
                        if (child.userData.isRetributionRing) {
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
                                expired = false;
                            }
                        }
                        
                        // Handle retribution particles
                        else if (child.userData.isRetributionParticle) {
                            // Move particle outward
                            const moveAmount = child.userData.speed * delta;
                            child.position.add(child.userData.direction.clone().multiplyScalar(moveAmount));
                            
                            // Fade out over time
                            const progress = child.userData.age / child.userData.maxAge;
                            child.material.opacity = Math.max(0, 0.7 - progress * 0.7);
                            
                            // Keep effect alive if particle is still active
                            if (child.userData.age < child.userData.maxAge) {
                                expired = false;
                            }
                        }
                    }
                }
                
                // Remove effect group if all children have expired
                if (expired) {
                    // Remove from scene
                    if (effectGroup.parent) {
                        effectGroup.parent.remove(effectGroup);
                    }
                    
                    // Dispose of resources
                    effectGroup.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) child.material.dispose();
                    });
                    
                    // Remove from array
                    this.retributionEffects.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clear retribution effects
        if (this.retributionEffects) {
            for (const effectGroup of this.retributionEffects) {
                if (effectGroup.parent) {
                    effectGroup.parent.remove(effectGroup);
                }
                
                effectGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            this.retributionEffects.length = 0;
        }
        
        // Clear runes
        if (this.runes) {
            this.runes.length = 0;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}