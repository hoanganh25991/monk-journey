import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Path of the Storm variant of Cyclone Strike
 * Creates a torrent of mystic wind that deals continuous damage
 * Visual style: Swirling energy with arcane symbols
 */
export class PathOfTheStormEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.continuousDamage = true;
        this.damageInterval = 0.5; // Damage every 0.5 seconds
        this.lastDamageTime = 0;
        this.damagePerTick = this.skill.damage * 0.2; // 20% of base damage per tick
        
        // Visual properties
        this.mysticSymbols = [];
        this.energyParticles = null;
        this.mysticColor = new THREE.Color(0x9966ff); // Purple mystic color
    }

    /**
     * Create the Path of the Storm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to mystic color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.mysticColor.clone();
                    });
                } else {
                    child.material.color = this.mysticColor.clone();
                }
            }
        });
        
        // Add mystic symbols
        this.addMysticSymbols(effectGroup);
        
        // Add energy particles
        this.addEnergyParticles(effectGroup);
        
        // Add arcane ring
        this.addArcaneRing(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add mystic symbols to the effect
     * @param {THREE.Group} group - The group to add mystic symbols to
     */
    addMysticSymbols(group) {
        const symbolCount = 5;
        const baseRadius = this.skill.radius * 0.7;
        
        for (let i = 0; i < symbolCount; i++) {
            // Create a mystic symbol
            const symbol = this.createMysticSymbol();
            
            // Position in a circle
            const angle = (i / symbolCount) * Math.PI * 2;
            
            symbol.position.x = Math.cos(angle) * baseRadius;
            symbol.position.z = Math.sin(angle) * baseRadius;
            symbol.position.y = 0.5 + i * 0.3; // Staggered height
            
            // Rotate to face center
            symbol.rotation.y = angle + Math.PI;
            
            // Store initial position for animation
            symbol.userData.initialAngle = angle;
            symbol.userData.radius = baseRadius;
            symbol.userData.height = symbol.position.y;
            symbol.userData.rotationSpeed = 0.3 + Math.random() * 0.3;
            
            group.add(symbol);
            this.mysticSymbols.push(symbol);
        }
    }
    
    /**
     * Create a stylized mystic symbol using simple geometries
     * @returns {THREE.Group} - The created mystic symbol
     */
    createMysticSymbol() {
        const symbolGroup = new THREE.Group();
        
        // Create a circular base for the symbol
        const circleGeometry = new THREE.CircleGeometry(0.3, 16);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: this.mysticColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        symbolGroup.add(circle);
        
        // Add some lines to create a mystical symbol
        const lineCount = 3;
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI;
            
            const lineGeometry = new THREE.PlaneGeometry(0.5, 0.05);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.z = angle;
            
            symbolGroup.add(line);
        }
        
        // Add a central dot
        const dotGeometry = new THREE.CircleGeometry(0.05, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.z = 0.01; // Slightly in front
        symbolGroup.add(dot);
        
        return symbolGroup;
    }
    
    /**
     * Add energy particles to the effect
     * @param {THREE.Group} group - The group to add energy particles to
     */
    addEnergyParticles(group) {
        const particleCount = 100;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create particles in a spiral pattern
        for (let i = 0; i < particleCount; i++) {
            // Spiral pattern
            const angle = (i / particleCount) * Math.PI * 10;
            const radius = (i / particleCount) * this.skill.radius;
            const height = (i / particleCount) * 2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Mystic color with variations
            const colorFactor = 0.7 + Math.random() * 0.3;
            colors[i * 3] = 0.6 * colorFactor; // Red
            colors[i * 3 + 1] = 0.4 * colorFactor; // Green
            colors[i * 3 + 2] = 1.0 * colorFactor; // Blue (high to make it purple)
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.15;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particles
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.energyParticles = particles;
    }
    
    /**
     * Add an arcane ring to the effect
     * @param {THREE.Group} group - The group to add the arcane ring to
     */
    addArcaneRing(group) {
        const ringGeometry = new THREE.RingGeometry(this.skill.radius - 0.2, this.skill.radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.mysticColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        group.add(ring);
        
        // Store for animation
        this.arcaneRing = ring;
    }
    
    /**
     * Update the Path of the Storm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate mystic symbols
            this.mysticSymbols.forEach(symbol => {
                const initialAngle = symbol.userData.initialAngle || 0;
                const radius = symbol.userData.radius || 1;
                const height = symbol.userData.height || 0.5;
                const rotationSpeed = symbol.userData.rotationSpeed || 0.3;
                
                // Rotate around the center
                const newAngle = initialAngle + this.elapsedTime * rotationSpeed;
                
                symbol.position.x = Math.cos(newAngle) * radius;
                symbol.position.z = Math.sin(newAngle) * radius;
                
                // Oscillate height
                symbol.position.y = height + Math.sin(this.elapsedTime * 2 + initialAngle) * 0.2;
                
                // Rotate to face center
                symbol.rotation.y = newAngle + Math.PI;
                
                // Rotate the symbol itself
                symbol.rotation.z += delta * 2;
            });
            
            // Animate energy particles
            if (this.energyParticles && this.energyParticles.geometry) {
                const positions = this.energyParticles.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate angle and distance from center
                    const angle = Math.atan2(z, x);
                    const distance = Math.sqrt(x * x + z * z);
                    
                    // Rotate particles around center and move upward
                    const newAngle = angle + delta * (1 - distance / this.skill.radius); // Faster rotation near center
                    
                    positions[i * 3] = Math.cos(newAngle) * distance;
                    positions[i * 3 + 1] = y + delta * 0.5; // Move upward
                    positions[i * 3 + 2] = Math.sin(newAngle) * distance;
                    
                    // Reset particles that go too high
                    if (y > 3 || Math.random() < 0.01) {
                        const newAngle = Math.random() * Math.PI * 2;
                        const newRadius = Math.random() * this.skill.radius * 0.8;
                        
                        positions[i * 3] = Math.cos(newAngle) * newRadius;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                    }
                }
                
                this.energyParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate arcane ring
            if (this.arcaneRing) {
                this.arcaneRing.rotation.z += delta * 0.5;
                
                // Pulse the ring
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 5);
                this.arcaneRing.scale.set(pulseFactor, pulseFactor, 1);
            }
            
            // Apply continuous damage
            if (this.continuousDamage) {
                this.lastDamageTime += delta;
                if (this.lastDamageTime >= this.damageInterval) {
                    this.applyContinuousDamage();
                    this.lastDamageTime = 0;
                }
            }
        }
    }
    
    /**
     * Apply continuous damage to enemies within range
     */
    applyContinuousDamage() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // Get position for damage calculations
        // const damagePosition = this.effect.position.clone();
        
        // const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //     damagePosition,
        //     this.skill.radius
        // );
        
        // enemies.forEach(enemy => {
        //     // Apply damage
        //     enemy.takeDamage(this.damagePerTick);
            
        //     // Create a visual effect for the damage
        //     if (this.skill.game.effectsManager) {
        //         // Get enemy position
        //         const enemyPosition = enemy.getPosition();
        //         if (enemyPosition) {
        //             // Create a position slightly above the enemy
        //             const effectPosition = new THREE.Vector3(
        //                 enemyPosition.x,
        //                 enemyPosition.y + 1,
        //                 enemyPosition.z
        //             );
                    
        //             // Create a small particle burst
        //             this.createDamageEffect(effectPosition);
        //         }
        //     }
        // });
    }
    
    /**
     * Create a visual effect for damage
     * @param {THREE.Vector3} position - Position to create the effect at
     */
    createDamageEffect(position) {
        // Create a small particle burst
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within a small sphere
            const radius = 0.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
            
            // Mystic color with variations
            const colorFactor = 0.7 + Math.random() * 0.3;
            colors[i * 3] = 0.6 * colorFactor; // Red
            colors[i * 3 + 1] = 0.4 * colorFactor; // Green
            colors[i * 3 + 2] = 1.0 * colorFactor; // Blue (high to make it purple)
            
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
        if (this.skill.game.scene) {
            this.skill.game.scene.add(particles);
            
            // Remove after a short time
            setTimeout(() => {
                this.skill.game.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }, 500);
        }
    }
}