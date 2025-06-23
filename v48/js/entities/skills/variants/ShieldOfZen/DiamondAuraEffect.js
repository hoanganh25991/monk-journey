import * as THREE from 'three';
import { ShieldOfZenEffect } from '../../ShieldOfZenEffect.js';

/**
 * Specialized effect for Shield of Zen - Diamond Aura variant
 * Creates a crystalline shield that reflects projectiles
 */
export class DiamondAuraEffect extends ShieldOfZenEffect {
    constructor(skill) {
        super(skill);
        // Override base properties for this variant
        this.damageReduction = 0.4; // 40% damage reduction
        this.damageReflection = 0.2; // 20% damage reflection
        this.projectileReflection = true; // Can reflect projectiles
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
        
        // Create diamond aura effect
        this._createDiamondAura(effectGroup);
    }
    
    /**
     * Create a diamond aura effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @private
     */
    _createDiamondAura(effectGroup) {
        // Create aura group
        const auraGroup = new THREE.Group();
        
        // Create crystalline shield using icosahedron geometry
        const shieldGeometry = new THREE.IcosahedronGeometry(2.5, 1);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaddff, // Light blue
            transparent: true,
            opacity: 0.4,
            metalness: 0.9,
            roughness: 0.2,
            side: THREE.DoubleSide,
            flatShading: true
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        auraGroup.add(shield);
        
        // Create diamond particles
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Create diamond-shaped particle using octahedron geometry
            const particleSize = 0.1 + Math.random() * 0.2;
            const particleGeometry = new THREE.OctahedronGeometry(particleSize, 0);
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.7,
                metalness: 0.9,
                roughness: 0.1,
                flatShading: true
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position randomly around shield
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 2.5;
            
            particle.position.set(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            );
            
            // Store orbit data
            particle.userData = {
                orbitRadius: radius,
                orbitSpeed: 0.2 + Math.random() * 0.3,
                orbitAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                initialPosition: particle.position.clone()
            };
            
            auraGroup.add(particle);
            particles.push(particle);
        }
        
        // Add reflection points at shield vertices
        const reflectionPoints = [];
        const vertices = shieldGeometry.attributes.position;
        
        // Use a set to track unique vertex positions
        const uniqueVertices = new Set();
        
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const y = vertices.getY(i);
            const z = vertices.getZ(i);
            
            // Create a key for this vertex position
            const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
            
            // Only process unique vertices
            if (!uniqueVertices.has(key)) {
                uniqueVertices.add(key);
                
                // Create reflection point
                const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const pointMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9
                });
                
                const point = new THREE.Mesh(pointGeometry, pointMaterial);
                point.position.set(x, y, z);
                
                // Store animation data
                point.userData = {
                    pulseSpeed: 1 + Math.random() * 2,
                    phase: Math.random() * Math.PI * 2
                };
                
                auraGroup.add(point);
                reflectionPoints.push(point);
            }
        }
        
        // Add aura group to effect group
        effectGroup.add(auraGroup);
        
        // Store references
        this.aura = auraGroup;
        this.shield = shield;
        this.particles = particles;
        this.reflectionPoints = reflectionPoints;
    }
    
    /**
     * Override the update method to add custom behavior
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateShieldOfZenEffect(delta) {
        // Call the parent method to update the base effect
        super._updateShieldOfZenEffect(delta);
        
        // Update diamond shield
        if (this.shield) {
            // Rotate shield slowly
            this.shield.rotation.y += 0.1 * delta;
            this.shield.rotation.z += 0.05 * delta;
            
            // Pulse shield opacity
            this.shield.material.opacity = 0.3 + 0.1 * Math.sin(this.elapsedTime * 1.5);
        }
        
        // Update reflection points
        if (this.reflectionPoints) {
            for (const point of this.reflectionPoints) {
                if (point.userData) {
                    // Pulse size
                    const scale = 0.8 + 0.4 * Math.sin(this.elapsedTime * point.userData.pulseSpeed + point.userData.phase);
                    point.scale.set(scale, scale, scale);
                    
                    // Pulse opacity
                    point.material.opacity = 0.7 + 0.3 * Math.sin(this.elapsedTime * point.userData.pulseSpeed + point.userData.phase);
                }
            }
        }
        
        // Check for projectile reflection if game reference exists
        if (this.projectileReflection && this.skill.game && this.skill.game.projectileManager) {
            const reflectionRadius = 2.5;
            const playerPosition = this.effect.position.clone();
            
            // Get projectiles in reflection radius
            const projectiles = this.skill.game.projectileManager.getProjectilesInRadius(playerPosition, reflectionRadius);
            
            for (const projectile of projectiles) {
                // Only reflect enemy projectiles that haven't been reflected yet
                if (projectile.source === 'enemy' && !projectile.reflected) {
                    // Mark as reflected
                    projectile.reflected = true;
                    
                    // Reverse direction
                    projectile.direction.multiplyScalar(-1);
                    
                    // Change source to player
                    projectile.source = 'player';
                    
                    // Increase damage
                    projectile.damage *= 1.5;
                    
                    // Create reflection effect
                    this._createReflectionEffect(projectile.position.clone());
                    
                    // Show notification if UI manager is available
                    if (this.skill.game.player && this.skill.game.player.game && this.skill.game.player.game.hudManager) {
                        this.skill.game.player.game.hudManager.showNotification('Projectile reflected!');
                    }
                }
            }
        }
    }
    
    /**
     * Create a reflection effect at the given position
     * @param {THREE.Vector3} position - Position to create the effect
     * @private
     */
    _createReflectionEffect(position) {
        if (!this.effect) return;
        
        // Create a flash effect at the reflection point
        const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 1.0
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        flash.scale.set(0.1, 0.1, 0.1);
        
        // Store animation data
        flash.userData = {
            age: 0,
            maxAge: 0.3,
            isFlash: true
        };
        
        this.effect.add(flash);
        
        // Add to a list for cleanup
        if (!this.reflectionFlashes) {
            this.reflectionFlashes = [];
        }
        this.reflectionFlashes.push(flash);
    }
    
    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        // Clear reflection flashes
        if (this.reflectionFlashes) {
            this.reflectionFlashes.length = 0;
        }
        
        // Clear reflection points
        if (this.reflectionPoints) {
            this.reflectionPoints.length = 0;
        }
        
        // Call parent dispose method
        super.dispose();
    }
}