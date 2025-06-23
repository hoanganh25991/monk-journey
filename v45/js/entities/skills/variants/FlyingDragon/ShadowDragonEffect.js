import * as THREE from 'three';
import { FlyingDragonEffect } from '../../FlyingDragonEffect.js';

/**
 * Effect for the Shadow Dragon variant of Flying Dragon
 * Creates a shadow clone that mimics the player's attacks
 * Visual style: Dark silhouette with purple energy trails
 */
export class ShadowDragonEffect extends FlyingDragonEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.shadowClone = true;
        this.cloneDuration = 5; // 5 seconds of shadow clone
        this.damageMultiplier = 1.5; // 50% more damage
        
        // Visual properties
        this.shadowColor = new THREE.Color(0x220033);
        this.energyColor = new THREE.Color(0x9900ff);
        this.shadowTrails = [];
        this.cloneCreated = false;
        this.shadowCloneObject = null;
    }

    /**
     * Create the Shadow Dragon effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to shadow colors
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.shadowColor.clone();
                    });
                } else {
                    child.material.color = this.shadowColor.clone();
                }
            }
        });
        
        // Add shadow trails
        this.addShadowTrails(effectGroup);
        
        // Add energy aura
        this.addEnergyAura(effectGroup);
        
        // Create shadow clone after a delay
        this.cloneCreated = false;
        setTimeout(() => {
            this.createShadowClone(position);
        }, 500); // Create clone after 0.5 seconds
        
        return effectGroup;
    }
    
    /**
     * Add shadow trails to the effect
     * @param {THREE.Group} group - The group to add shadow trails to
     */
    addShadowTrails(group) {
        const trailCount = 5;
        
        for (let i = 0; i < trailCount; i++) {
            // Create a shadow trail
            const trail = this.createShadowTrail();
            
            // Position behind the player
            trail.position.z = -0.5 - i * 0.3;
            
            // Store initial position for animation
            trail.userData.index = i;
            trail.userData.offset = i * 0.2;
            
            group.add(trail);
            this.shadowTrails.push(trail);
        }
    }
    
    /**
     * Create a stylized shadow trail using simple geometries
     * @returns {THREE.Group} - The created shadow trail
     */
    createShadowTrail() {
        const trailGroup = new THREE.Group();
        
        // Create main trail shape
        const trailGeometry = new THREE.PlaneGeometry(0.8, 1.5);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: this.shadowColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trailGroup.add(trail);
        
        // Add energy edges
        const edgeGeometry = new THREE.PlaneGeometry(0.9, 1.6);
        const edgeMaterial = new THREE.MeshBasicMaterial({
            color: this.energyColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.z = -0.01; // Slightly behind the main trail
        trailGroup.add(edge);
        
        return trailGroup;
    }
    
    /**
     * Add energy aura to the effect
     * @param {THREE.Group} group - The group to add energy aura to
     */
    addEnergyAura(group) {
        // Create energy sphere
        const auraGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.energyColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);
        
        // Store for animation
        this.energyAura = aura;
    }
    
    /**
     * Create a shadow clone that mimics the player
     * @param {THREE.Vector3} position - Position to create the clone at
     */
    createShadowClone(position) {
        if (this.cloneCreated || !this.skill.game || !this.skill.game.player) return;
        
        // Create a group for the shadow clone
        const cloneGroup = new THREE.Group();
        
        // Create a simplified player silhouette
        const bodyGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.3);
        const bodyMaterial = new THREE.MeshBasicMaterial({
            color: this.shadowColor,
            transparent: true,
            opacity: 0.7
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Center of the body
        cloneGroup.add(body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial.clone());
        head.position.y = 1.1;
        cloneGroup.add(head);
        
        // Create limbs
        const limbGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const limbMaterial = bodyMaterial.clone();
        
        // Arms
        const leftArm = new THREE.Mesh(limbGeometry, limbMaterial);
        leftArm.position.set(-0.3, 0.7, 0);
        cloneGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(limbGeometry, limbMaterial);
        rightArm.position.set(0.3, 0.7, 0);
        cloneGroup.add(rightArm);
        
        // Legs
        const leftLeg = new THREE.Mesh(limbGeometry, limbMaterial);
        leftLeg.position.set(-0.2, 0.25, 0);
        cloneGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(limbGeometry, limbMaterial);
        rightLeg.position.set(0.2, 0.25, 0);
        cloneGroup.add(rightLeg);
        
        // Add energy aura
        const auraGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: this.energyColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.scale.set(1.5, 1.5, 1.5);
        cloneGroup.add(aura);
        
        // Position the clone behind the player
        const playerPosition = this.skill.game.player.getPosition();
        const playerDirection = this.skill.game.player.getDirection();
        
        if (playerPosition && playerDirection) {
            // Position slightly behind the player
            cloneGroup.position.copy(playerPosition);
            cloneGroup.position.x -= playerDirection.x * 1.5;
            cloneGroup.position.z -= playerDirection.z * 1.5;
            
            // Add to scene
            this.skill.game.scene.add(cloneGroup);
            
            // Store for animation and updates
            this.shadowCloneObject = cloneGroup;
            this.cloneCreated = true;
            
            // Set up clone removal after duration
            setTimeout(() => {
                this.removeShadowClone();
            }, this.cloneDuration * 1000);
        }
    }
    
    /**
     * Remove the shadow clone
     */
    removeShadowClone() {
        if (!this.shadowCloneObject) return;
        
        // Fade out animation
        const fadeOutDuration = 1; // 1 second fade out
        const startTime = Date.now();
        
        const fadeOut = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / fadeOutDuration, 1);
            
            // Fade out opacity
            this.shadowCloneObject.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.opacity = (1 - progress) * 0.7;
                        });
                    } else {
                        child.opacity = (1 - progress) * 0.7;
                    }
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            } else {
                // Remove from scene
                if (this.shadowCloneObject.parent) {
                    this.shadowCloneObject.parent.remove(this.shadowCloneObject);
                }
                
                // Dispose of geometries and materials
                this.shadowCloneObject.traverse(child => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                
                this.shadowCloneObject = null;
                this.cloneCreated = false;
            }
        };
        
        fadeOut();
    }
    
    /**
     * Update the Shadow Dragon effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate shadow trails
            this.shadowTrails.forEach(trail => {
                const index = trail.userData.index || 0;
                const offset = trail.userData.offset || 0;
                
                // Fade in and out
                const opacity = 0.6 * (1 - Math.abs(Math.sin(this.elapsedTime * 2 + offset)));
                
                trail.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = opacity;
                    }
                });
                
                // Wave motion
                trail.position.x = Math.sin(this.elapsedTime * 3 + index) * 0.2;
                trail.rotation.z = Math.sin(this.elapsedTime * 2 + index) * 0.1;
            });
            
            // Animate energy aura
            if (this.energyAura) {
                // Pulse the aura
                const pulseFactor = 1 + 0.2 * Math.sin(this.elapsedTime * 5);
                this.energyAura.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate the aura
                this.energyAura.rotation.y += delta * 0.5;
                this.energyAura.rotation.z += delta * 0.3;
            }
        }
        
        // Update shadow clone
        this.updateShadowClone(delta);
    }
    
    /**
     * Update the shadow clone
     * @param {number} delta - Time since last update in seconds
     */
    updateShadowClone(delta) {
        if (!this.shadowCloneObject || !this.skill.game || !this.skill.game.player) return;
        
        // Get player position and direction
        const playerPosition = this.skill.game.player.getPosition();
        const playerDirection = this.skill.game.player.getDirection();
        
        if (playerPosition && playerDirection) {
            // Follow player with a delay
            const targetX = playerPosition.x - playerDirection.x * 1.5;
            const targetZ = playerPosition.z - playerDirection.z * 1.5;
            
            // Smooth movement
            this.shadowCloneObject.position.x += (targetX - this.shadowCloneObject.position.x) * 0.1;
            this.shadowCloneObject.position.z += (targetZ - this.shadowCloneObject.position.z) * 0.1;
            
            // Match player's Y position
            this.shadowCloneObject.position.y = playerPosition.y;
            
            // Face same direction as player
            if (playerDirection.x !== 0 || playerDirection.z !== 0) {
                const angle = Math.atan2(playerDirection.x, playerDirection.z);
                this.shadowCloneObject.rotation.y = angle;
            }
            
            // Animate limbs based on player movement
            const movementFactor = Math.sin(this.elapsedTime * 5) * 0.2;
            
            // Arms swing opposite to legs
            if (this.shadowCloneObject.children[2] && this.shadowCloneObject.children[3]) {
                this.shadowCloneObject.children[2].rotation.x = -movementFactor;
                this.shadowCloneObject.children[3].rotation.x = movementFactor;
            }
            
            // Legs swing
            if (this.shadowCloneObject.children[4] && this.shadowCloneObject.children[5]) {
                this.shadowCloneObject.children[4].rotation.x = movementFactor;
                this.shadowCloneObject.children[5].rotation.x = -movementFactor;
            }
            
            // Pulse the aura
            if (this.shadowCloneObject.children[6]) {
                const aura = this.shadowCloneObject.children[6];
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 3);
                aura.scale.set(pulseFactor * 1.5, pulseFactor * 1.5, pulseFactor * 1.5);
                aura.rotation.y += delta * 0.5;
            }
        }
    }
    
    /**
     * Override the damage application to add shadow clone damage
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply shadow clone damage if active
        if (this.shadowClone && this.cloneCreated && this.shadowCloneObject) {
            // Apply additional damage from the shadow clone
            const cloneDamage = amount * 0.5; // Clone does 50% of original damage
            super.applyDamage(enemy, cloneDamage);
            
            // Create a visual effect at the enemy's position
            this.createShadowStrike(enemy.getPosition());
        }
    }
    
    /**
     * Create a shadow strike visual effect
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createShadowStrike(position) {
        if (!position || !this.skill.game) return;
        
        // Create a quick flash effect
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.energyColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        
        // Add to scene
        this.skill.game.scene.add(flash);
        
        // Animate and remove
        const startTime = Date.now();
        const duration = 0.5; // 0.5 seconds
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up and fade out
            const scale = 1 + progress * 2;
            flash.scale.set(scale, scale, scale);
            flash.material.opacity = 0.8 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove from scene
                if (flash.parent) {
                    flash.parent.remove(flash);
                }
                
                // Dispose of geometry and material
                flash.geometry.dispose();
                flash.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Remove shadow clone
        this.removeShadowClone();
        
        // Clear arrays
        this.shadowTrails = [];
        this.energyAura = null;
        
        // Call parent dispose
        super.dispose();
    }
}