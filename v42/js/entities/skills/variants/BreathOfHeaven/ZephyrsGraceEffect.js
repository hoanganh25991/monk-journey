import * as THREE from 'three';
import { BreathOfHeavenEffect } from '../../BreathOfHeavenEffect.js';

/**
 * Effect for the Zephyr's Grace variant of Breath of Heaven
 * Creates a wind aura that increases movement speed
 * Visual style: Swirling wind currents and floating leaves
 */
export class ZephyrsGraceEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.speedBoost = true;
        this.speedBoostMultiplier = 1.3; // 30% speed boost
        this.speedBoostDuration = 8; // Extended duration for speed boost
        
        // Visual properties
        this.windStreams = [];
        this.leaves = [];
        this.windColor = new THREE.Color(0xccffee); // Light cyan-green
    }

    /**
     * Create the Zephyr's Grace effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base aura to look more like wind
        const baseAura = effectGroup.children[0];
        baseAura.material.color = this.windColor;
        baseAura.material.opacity = 0.3;
        
        // Add wind streams
        this.addWindStreams(effectGroup);
        
        // Add floating leaves
        this.addFloatingLeaves(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add wind streams to the effect
     * @param {THREE.Group} group - The group to add wind streams to
     */
    addWindStreams(group) {
        const streamCount = 8;
        const baseRadius = this.skill.radius;
        
        for (let i = 0; i < streamCount; i++) {
            // Create a wind stream
            const stream = this.createWindStream();
            
            // Position around a circle
            const angle = (i / streamCount) * Math.PI * 2;
            stream.position.x = Math.cos(angle) * (baseRadius * 0.5);
            stream.position.z = Math.sin(angle) * (baseRadius * 0.5);
            stream.position.y = 0.1;
            
            // Rotate to follow the circle
            stream.rotation.y = angle + Math.PI / 2;
            
            // Store initial angle for animation
            stream.userData.angle = angle;
            stream.userData.radius = baseRadius * 0.5;
            stream.userData.rotationSpeed = 0.5 + Math.random() * 0.5;
            
            group.add(stream);
            this.windStreams.push(stream);
        }
    }
    
    /**
     * Create a stylized wind stream using simple geometries
     * @returns {THREE.Group} - The created wind stream
     */
    createWindStream() {
        const streamGroup = new THREE.Group();
        
        // Create a curved path for the wind stream
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0.5, 0),
            new THREE.Vector3(2, 0.3, 0),
            new THREE.Vector3(3, 0, 0)
        );
        
        // Create geometry from the curve
        const points = curve.getPoints(20);
        const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create material
        const streamMaterial = new THREE.LineBasicMaterial({
            color: this.windColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        // Create line
        const streamLine = new THREE.Line(streamGeometry, streamMaterial);
        streamGroup.add(streamLine);
        
        // Add small particles along the stream
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const point = curve.getPoint(t);
            
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.windColor,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(point);
            
            // Store position along curve for animation
            particle.userData.curvePosition = t;
            particle.userData.speed = 0.5 + Math.random() * 0.5;
            
            streamGroup.add(particle);
        }
        
        return streamGroup;
    }
    
    /**
     * Add floating leaves to the effect
     * @param {THREE.Group} group - The group to add leaves to
     */
    addFloatingLeaves(group) {
        const leafCount = 15;
        const baseRadius = this.skill.radius;
        
        for (let i = 0; i < leafCount; i++) {
            // Create a leaf
            const leaf = this.createLeaf();
            
            // Position randomly within the effect radius
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius;
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = Math.random() * 1.5;
            
            // Random rotation
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI;
            leaf.rotation.z = Math.random() * Math.PI;
            
            // Store initial position for animation
            leaf.userData.initialAngle = angle;
            leaf.userData.radius = radius;
            leaf.userData.height = leaf.position.y;
            leaf.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 2
            };
            leaf.userData.orbitSpeed = 0.3 + Math.random() * 0.7;
            
            group.add(leaf);
            this.leaves.push(leaf);
        }
    }
    
    /**
     * Create a stylized leaf using simple geometries
     * @returns {THREE.Mesh} - The created leaf
     */
    createLeaf() {
        // Create a simple leaf shape using a scaled box
        const leafGeometry = new THREE.BoxGeometry(0.2, 0.01, 0.3);
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ff99),
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Scale to make it more leaf-like
        leaf.scale.x = 0.5 + Math.random() * 0.5;
        leaf.scale.z = 0.5 + Math.random() * 0.5;
        
        return leaf;
    }
    
    /**
     * Update the Zephyr's Grace effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate wind streams
            this.windStreams.forEach(stream => {
                const angle = stream.userData.angle || 0;
                const radius = stream.userData.radius || 1;
                const rotationSpeed = stream.userData.rotationSpeed || 0.5;
                
                // Rotate around the center
                const newAngle = angle + this.elapsedTime * rotationSpeed;
                stream.position.x = Math.cos(newAngle) * radius;
                stream.position.z = Math.sin(newAngle) * radius;
                
                // Update rotation to follow the circle
                stream.rotation.y = newAngle + Math.PI / 2;
                
                // Animate particles along the stream
                stream.children.forEach(child => {
                    if (child.userData.curvePosition !== undefined) {
                        const speed = child.userData.speed || 0.5;
                        let position = child.userData.curvePosition + delta * speed;
                        
                        // Loop back to start when reaching the end
                        if (position > 1) {
                            position = position % 1;
                        }
                        
                        // Update position along the curve
                        const curve = new THREE.CubicBezierCurve3(
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(1, 0.5, 0),
                            new THREE.Vector3(2, 0.3, 0),
                            new THREE.Vector3(3, 0, 0)
                        );
                        
                        const point = curve.getPoint(position);
                        child.position.copy(point);
                        
                        // Store updated position
                        child.userData.curvePosition = position;
                    }
                });
            });
            
            // Animate floating leaves
            this.leaves.forEach(leaf => {
                const initialAngle = leaf.userData.initialAngle || 0;
                const radius = leaf.userData.radius || 1;
                const height = leaf.userData.height || 0.5;
                const rotationSpeed = leaf.userData.rotationSpeed || { x: 0, y: 0, z: 0 };
                const orbitSpeed = leaf.userData.orbitSpeed || 0.5;
                
                // Rotate the leaf
                leaf.rotation.x += delta * rotationSpeed.x;
                leaf.rotation.y += delta * rotationSpeed.y;
                leaf.rotation.z += delta * rotationSpeed.z;
                
                // Move in a spiral pattern
                const newAngle = initialAngle + this.elapsedTime * orbitSpeed;
                leaf.position.x = Math.cos(newAngle) * radius;
                leaf.position.z = Math.sin(newAngle) * radius;
                
                // Gentle up and down motion
                leaf.position.y = height + Math.sin(this.elapsedTime * orbitSpeed * 2) * 0.2;
            });
        }
    }
    
    /**
     * Apply movement speed boost with increased effect
     */
    applyMovementSpeedBoost() {
        if (!this.skill.game || !this.skill.game.player || this.hasAppliedSpeedBoost) return;
        
        const player = this.skill.game.player;
        if (player && player.stats) {
            // Apply the enhanced movement speed boost
            player.stats.addTemporaryBoost('movementSpeed', this.speedBoostMultiplier, this.speedBoostDuration);
            
            // Mark that we've applied the speed boost
            this.hasAppliedSpeedBoost = true;
            
            // Show a notification if available
            if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
                this.skill.game.hudManager.showNotification(`Movement speed increased by 30% for ${this.speedBoostDuration} seconds!`);
            }
            
            // Create a visual effect for the speed boost
            this.createSpeedBoostEffect();
        }
    }
    
    /**
     * Create an enhanced visual effect for the speed boost
     */
    createSpeedBoostEffect() {
        if (!this.skill.game || !this.skill.game.player) return;
        
        const player = this.skill.game.player;
        if (player && player.getPosition) {
            const playerPosition = player.getPosition();
            if (playerPosition && this.effect) {
                // Create a burst effect
                const burstGeometry = new THREE.RingGeometry(0.5, 2, 32);
                const burstMaterial = new THREE.MeshBasicMaterial({
                    color: this.windColor,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                
                const burst = new THREE.Mesh(burstGeometry, burstMaterial);
                burst.rotation.x = Math.PI / 2; // Lay flat
                burst.position.y = 0.1;
                
                this.effect.add(burst);
                
                // Animate the burst
                const expandAndFade = () => {
                    let scale = 1;
                    let opacity = burst.material.opacity;
                    
                    const animate = () => {
                        scale += 0.05;
                        opacity -= 0.02;
                        
                        burst.scale.set(scale, scale, scale);
                        burst.material.opacity = Math.max(0, opacity);
                        
                        if (opacity > 0 && this.isActive) {
                            requestAnimationFrame(animate);
                        } else {
                            this.effect.remove(burst);
                            burst.geometry.dispose();
                            burst.material.dispose();
                        }
                    };
                    
                    animate();
                };
                
                expandAndFade();
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.windStreams = [];
        this.leaves = [];
        
        // Call parent dispose
        super.dispose();
    }
}