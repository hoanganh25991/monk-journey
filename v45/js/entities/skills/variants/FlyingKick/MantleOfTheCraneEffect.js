import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Mantle of the Crane variant of Flying Kick
 * Increases range and creates a graceful crane-like visual effect
 * Visual style: White and blue energy with feather-like particles
 */
export class MantleOfTheCraneEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.rangeMultiplier = 1.5; // 50% increased range
        
        // Visual properties
        this.craneColor = new THREE.Color(0xeeeeff); // Light blue-white for crane
        this.featherParticles = null;
        this.wingsEffect = null;
    }
    
    /**
     * Get the range of the effect
     * @returns {number} - The range of the effect
     * @override
     */
    getRange() {
        return super.getRange() * this.rangeMultiplier;
    }
    
    /**
     * Create the effect
     * @param {THREE.Vector3} startPosition - The starting position of the effect
     * @param {THREE.Vector3} targetPosition - The target position of the effect
     * @returns {Object} - The created effect object
     * @override
     */
    create(startPosition, targetPosition) {
        // Create base effect
        const effectObject = super.create(startPosition, targetPosition);
        
        // Modify base effect colors
        if (effectObject.trail) {
            effectObject.trail.traverse(child => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color = this.craneColor.clone();
                        });
                    } else {
                        child.material.color = this.craneColor.clone();
                    }
                }
            });
        }
        
        // Add crane wings effect
        this.addCraneWingsEffect(effectObject, startPosition, targetPosition);
        
        // Add feather particles
        this.addFeatherParticles(effectObject);
        
        return effectObject;
    }
    
    /**
     * Add crane wings effect to the flying kick
     * @param {Object} effectObject - The effect object to add wings to
     * @param {THREE.Vector3} startPosition - The starting position of the effect
     * @param {THREE.Vector3} targetPosition - The target position of the effect
     */
    addCraneWingsEffect(effectObject, startPosition, targetPosition) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create wing geometry
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.quadraticCurveTo(0.5, 0.5, 1, 0);
        wingShape.quadraticCurveTo(0.5, -0.2, 0, 0);
        
        const wingGeometry = new THREE.ShapeGeometry(wingShape);
        
        // Create wing materials
        const wingMaterial = new THREE.MeshBasicMaterial({
            color: this.craneColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        // Create left and right wings
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        
        // Scale wings
        leftWing.scale.set(2, 2, 1);
        rightWing.scale.set(2, 2, 1);
        
        // Position wings
        leftWing.position.set(-0.5, 0.5, 0);
        rightWing.position.set(0.5, 0.5, 0);
        
        // Flip right wing
        rightWing.scale.x *= -1;
        
        // Create wings group
        const wingsGroup = new THREE.Group();
        wingsGroup.add(leftWing);
        wingsGroup.add(rightWing);
        
        // Add to player
        effectObject.player.add(wingsGroup);
        
        // Store for animation
        this.wingsEffect = {
            group: wingsGroup,
            leftWing,
            rightWing,
            material: wingMaterial
        };
    }
    
    /**
     * Add feather particles to the effect
     * @param {Object} effectObject - The effect object to add particles to
     */
    addFeatherParticles(effectObject) {
        if (!effectObject.player || !this.skill.game.scene) return;
        
        // Create feather particles
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at player position
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0.5; // Slightly above player
            positions[i * 3 + 2] = 0;
            
            // Crane color with variations
            const colorVariation = 0.9 + Math.random() * 0.1;
            colors[i * 3] = this.craneColor.r * colorVariation;
            colors[i * 3 + 1] = this.craneColor.g * colorVariation;
            colors[i * 3 + 2] = this.craneColor.b * colorVariation;
            
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
        
        // Add to player
        effectObject.player.add(particles);
        
        // Store for animation
        this.featherParticles = {
            points: particles,
            geometry: particleGeometry,
            material: particleMaterial,
            positions: positions
        };
    }
    
    /**
     * Update the effect
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     * @override
     */
    update(delta, effectObject) {
        super.update(delta, effectObject);
        
        // Update wings effect
        this.updateWingsEffect(delta, effectObject);
        
        // Update feather particles
        this.updateFeatherParticles(delta, effectObject);
    }
    
    /**
     * Update the wings effect
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateWingsEffect(delta, effectObject) {
        if (!this.wingsEffect) return;
        
        // Get progress of the kick
        const progress = effectObject.progress || 0;
        
        // Animate wings based on progress
        if (progress < 0.5) {
            // Opening wings during first half of kick
            const openAmount = progress * 2; // 0 to 1
            
            // Rotate wings outward
            this.wingsEffect.leftWing.rotation.z = Math.PI / 4 * openAmount;
            this.wingsEffect.rightWing.rotation.z = -Math.PI / 4 * openAmount;
            
            // Scale wings up
            const scale = 2 + openAmount;
            this.wingsEffect.leftWing.scale.set(scale, scale, 1);
            this.wingsEffect.rightWing.scale.set(-scale, scale, 1);
            
            // Increase opacity
            this.wingsEffect.material.opacity = 0.7 * openAmount;
        } else {
            // Flapping wings during second half of kick
            const flapAmount = (progress - 0.5) * 2; // 0 to 1
            const flapAngle = Math.sin(flapAmount * Math.PI * 2) * Math.PI / 8;
            
            // Rotate wings for flapping
            this.wingsEffect.leftWing.rotation.z = Math.PI / 4 + flapAngle;
            this.wingsEffect.rightWing.rotation.z = -Math.PI / 4 - flapAngle;
            
            // Maintain full scale
            const scale = 3;
            this.wingsEffect.leftWing.scale.set(scale, scale, 1);
            this.wingsEffect.rightWing.scale.set(-scale, scale, 1);
            
            // Fade out near the end
            if (progress > 0.8) {
                const fadeOut = (progress - 0.8) * 5; // 0 to 1
                this.wingsEffect.material.opacity = 0.7 * (1 - fadeOut);
            }
        }
    }
    
    /**
     * Update the feather particles
     * @param {number} delta - Time since last update in seconds
     * @param {Object} effectObject - The effect object to update
     */
    updateFeatherParticles(delta, effectObject) {
        if (!this.featherParticles) return;
        
        // Get progress of the kick
        const progress = effectObject.progress || 0;
        
        // Animate particles based on progress
        const positions = this.featherParticles.positions;
        const count = positions.length / 3;
        
        for (let i = 0; i < count; i++) {
            // Calculate current position
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            // Add some random movement
            positions[i * 3] = x + (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05 + 0.02; // Slight upward drift
            positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.1;
            
            // Spread particles outward as kick progresses
            if (Math.random() < 0.1) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.5 + progress * 2;
                
                positions[i * 3] = Math.cos(angle) * radius * Math.random();
                positions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
            }
        }
        
        this.featherParticles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles near the end
        if (progress > 0.7) {
            const fadeOut = (progress - 0.7) * 3.33; // 0 to 1
            this.featherParticles.material.opacity = 0.8 * (1 - fadeOut);
        }
    }
    
    /**
     * Clean up the effect
     * @param {Object} effectObject - The effect object to clean up
     * @override
     */
    cleanup(effectObject) {
        super.cleanup(effectObject);
        
        // Clean up wings effect
        if (this.wingsEffect && effectObject.player) {
            effectObject.player.remove(this.wingsEffect.group);
            this.wingsEffect.material.dispose();
            this.wingsEffect = null;
        }
        
        // Clean up feather particles
        if (this.featherParticles && effectObject.player) {
            effectObject.player.remove(this.featherParticles.points);
            this.featherParticles.geometry.dispose();
            this.featherParticles.material.dispose();
            this.featherParticles = null;
        }
    }
    
    /**
     * Create impact effect when the kick hits
     * @param {THREE.Vector3} position - The position of the impact
     * @override
     */
    createImpactEffect(position) {
        super.createImpactEffect(position);
        
        // Add additional crane impact effect
        this.createCraneImpactEffect(position);
    }
    
    /**
     * Create a crane-themed impact effect
     * @param {THREE.Vector3} position - The position to create the effect at
     */
    createCraneImpactEffect(position) {
        if (!position || !this.skill.game.scene) return;
        
        // Create a burst of feather particles
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Start at impact position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 0.5; // Slightly above ground
            positions[i * 3 + 2] = position.z;
            
            // Crane color with variations
            const colorVariation = 0.9 + Math.random() * 0.1;
            colors[i * 3] = this.craneColor.r * colorVariation;
            colors[i * 3 + 1] = this.craneColor.g * colorVariation;
            colors[i * 3 + 2] = this.craneColor.b * colorVariation;
            
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
        
        // Create a ring effect
        const ringGeometry = new THREE.RingGeometry(0.1, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.craneColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Animate the impact effect
        const startTime = this.skill.game.time.getElapsedTime();
        const duration = 0.8; // 0.8 seconds
        
        const updateImpact = () => {
            const currentTime = this.skill.game.time.getElapsedTime();
            const elapsed = currentTime - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                // Animation complete, remove effects
                this.skill.game.scene.remove(particles);
                this.skill.game.scene.remove(ring);
                
                // Dispose resources
                particleGeometry.dispose();
                particleMaterial.dispose();
                ringGeometry.dispose();
                ringMaterial.dispose();
                
                // Remove from update loop
                this.skill.game.removeFromUpdateList(updateImpact);
                return;
            }
            
            // Move particles outward
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Calculate direction from center
                const dx = positions[i * 3] - position.x;
                const dy = positions[i * 3 + 1] - position.y - 0.5;
                const dz = positions[i * 3 + 2] - position.z;
                
                // Normalize direction
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = length > 0 ? dx / length : Math.random() - 0.5;
                const dirY = length > 0 ? dy / length : Math.random() + 0.5; // Mostly upward
                const dirZ = length > 0 ? dz / length : Math.random() - 0.5;
                
                // Move outward
                const speed = 1.5;
                positions[i * 3] += dirX * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 1] += dirY * speed * (this.skill.game.deltaTime || 0.016);
                positions[i * 3 + 2] += dirZ * speed * (this.skill.game.deltaTime || 0.016);
                
                // Add some gentle falling motion
                if (positions[i * 3 + 1] > position.y + 0.2) {
                    positions[i * 3 + 1] -= 0.5 * (this.skill.game.deltaTime || 0.016);
                }
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Expand and fade ring
            ring.scale.set(1 + t, 1 + t, 1);
            ringMaterial.opacity = 0.7 * (1 - t);
            
            // Fade out particles
            particleMaterial.opacity = 0.8 * (1 - t);
        };
        
        // Add to update loop
        this.skill.game.addToUpdateList(updateImpact);
    }
}