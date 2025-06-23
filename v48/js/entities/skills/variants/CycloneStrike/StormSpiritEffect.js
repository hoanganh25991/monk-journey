import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Storm Spirit variant of Cyclone Strike
 * Creates a tornado-like effect that pulls enemies in and deals damage
 * Visual style: Swirling wind with debris
 */
export class StormSpiritEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.pullForce = 5; // Force with which to pull enemies
        this.debrisParticles = null;
        this.windLines = [];
        this.tornadoColor = new THREE.Color(0x88ccff); // Light blue for tornado
    }

    /**
     * Create the Storm Spirit effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.tornadoColor.clone();
                    });
                } else {
                    child.material.color = this.tornadoColor.clone();
                }
            }
        });
        
        // Add tornado funnel
        this.addTornadoFunnel(effectGroup);
        
        // Add debris particles
        this.addDebrisParticles(effectGroup);
        
        // Add wind lines
        this.addWindLines(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add a tornado funnel to the effect
     * @param {THREE.Group} group - The group to add the tornado funnel to
     */
    addTornadoFunnel(group) {
        const height = 4;
        const radiusTop = 0.5;
        const radiusBottom = this.skill.radius * 0.8;
        const segments = 32;
        
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 10, true);
        
        // Create a custom material for the tornado
        const material = new THREE.MeshBasicMaterial({
            color: this.tornadoColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const funnel = new THREE.Mesh(geometry, material);
        funnel.position.y = height / 2;
        
        group.add(funnel);
        
        // Store for animation
        this.tornadoFunnel = funnel;
    }
    
    /**
     * Add debris particles to the effect
     * @param {THREE.Group} group - The group to add debris particles to
     */
    addDebrisParticles(group) {
        const particleCount = 100;
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create particles in a tornado pattern
        for (let i = 0; i < particleCount; i++) {
            // Spiral pattern
            const heightFactor = Math.random();
            const angle = (i / particleCount) * Math.PI * 20 + heightFactor * Math.PI * 10;
            const radius = (1 - heightFactor * 0.7) * this.skill.radius * 0.8;
            const height = heightFactor * 4;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Debris colors (browns, grays)
            const colorType = Math.floor(Math.random() * 3);
            if (colorType === 0) {
                // Brown
                colors[i * 3] = 0.6 + Math.random() * 0.4; // Red
                colors[i * 3 + 1] = 0.3 + Math.random() * 0.3; // Green
                colors[i * 3 + 2] = 0.1 + Math.random() * 0.2; // Blue
            } else if (colorType === 1) {
                // Gray
                const gray = 0.5 + Math.random() * 0.5;
                colors[i * 3] = gray; // Red
                colors[i * 3 + 1] = gray; // Green
                colors[i * 3 + 2] = gray; // Blue
            } else {
                // Green (leaves)
                colors[i * 3] = 0.1 + Math.random() * 0.2; // Red
                colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; // Green
                colors[i * 3 + 2] = 0.1 + Math.random() * 0.2; // Blue
            }
            
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
        this.debrisParticles = particles;
    }
    
    /**
     * Add wind lines to the effect
     * @param {THREE.Group} group - The group to add wind lines to
     */
    addWindLines(group) {
        const lineCount = 20;
        const baseRadius = this.skill.radius * 0.8;
        
        for (let i = 0; i < lineCount; i++) {
            // Create a curved line to represent wind
            const curvePoints = [];
            const segments = 10;
            const heightFactor = Math.random();
            const startAngle = Math.random() * Math.PI * 2;
            const angleSpan = Math.PI / 2 + Math.random() * Math.PI / 2;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const angle = startAngle + t * angleSpan;
                const radius = baseRadius * (1 - t * 0.3) * (1 - heightFactor * 0.7);
                const height = t * 4 * heightFactor;
                
                curvePoints.push(
                    new THREE.Vector3(
                        Math.cos(angle) * radius,
                        height,
                        Math.sin(angle) * radius
                    )
                );
            }
            
            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
            
            const material = new THREE.LineBasicMaterial({
                color: this.tornadoColor,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.5,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(geometry, material);
            group.add(line);
            
            // Store for animation
            this.windLines.push({
                line,
                startAngle,
                angleSpan,
                heightFactor,
                speed: 0.5 + Math.random() * 1.5
            });
        }
    }
    
    /**
     * Update the Storm Spirit effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Rotate tornado funnel
            if (this.tornadoFunnel) {
                this.tornadoFunnel.rotation.y += delta * 2;
            }
            
            // Animate debris particles
            if (this.debrisParticles && this.debrisParticles.geometry) {
                const positions = this.debrisParticles.geometry.attributes.position.array;
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
                    const heightFactor = y / 4; // 0 to 1 based on height
                    const rotationSpeed = (1 - heightFactor) * 3; // Faster at bottom
                    const newAngle = angle + delta * rotationSpeed;
                    
                    // New radius that decreases with height
                    const newRadius = distance * (1 - delta * 0.1);
                    
                    positions[i * 3] = Math.cos(newAngle) * newRadius;
                    positions[i * 3 + 1] = y + delta * (1 + heightFactor); // Move upward faster at top
                    positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                    
                    // Reset particles that go too high or too close to center
                    if (y > 4 || newRadius < 0.1 || Math.random() < 0.01) {
                        const newAngle = Math.random() * Math.PI * 2;
                        const newRadius = this.skill.radius * 0.8 * (0.7 + Math.random() * 0.3);
                        
                        positions[i * 3] = Math.cos(newAngle) * newRadius;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                    }
                }
                
                this.debrisParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Animate wind lines
            this.windLines.forEach(windLine => {
                const line = windLine.line;
                const startAngle = windLine.startAngle;
                const angleSpan = windLine.angleSpan;
                const heightFactor = windLine.heightFactor;
                const speed = windLine.speed;
                
                // Rotate the entire line
                line.rotation.y += delta * speed;
                
                // Fade out and reset when it completes a rotation
                const rotation = line.rotation.y % (Math.PI * 2);
                const opacity = 1 - (rotation / (Math.PI * 2));
                
                if (line.material) {
                    line.material.opacity = opacity * 0.5 + 0.2;
                }
                
                // Reset rotation occasionally
                if (rotation > Math.PI * 1.8 && Math.random() < 0.1) {
                    line.rotation.y = 0;
                    
                    // Regenerate the line with new parameters
                    const curvePoints = [];
                    const segments = 10;
                    const newStartAngle = Math.random() * Math.PI * 2;
                    const newAngleSpan = Math.PI / 2 + Math.random() * Math.PI / 2;
                    const newHeightFactor = Math.random();
                    
                    for (let j = 0; j <= segments; j++) {
                        const t = j / segments;
                        const angle = newStartAngle + t * newAngleSpan;
                        const radius = this.skill.radius * 0.8 * (1 - t * 0.3) * (1 - newHeightFactor * 0.7);
                        const height = t * 4 * newHeightFactor;
                        
                        curvePoints.push(
                            new THREE.Vector3(
                                Math.cos(angle) * radius,
                                height,
                                Math.sin(angle) * radius
                            )
                        );
                    }
                    
                    const curve = new THREE.CatmullRomCurve3(curvePoints);
                    line.geometry.dispose();
                    line.geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
                    
                    // Update wind line parameters
                    windLine.startAngle = newStartAngle;
                    windLine.angleSpan = newAngleSpan;
                    windLine.heightFactor = newHeightFactor;
                    windLine.speed = 0.5 + Math.random() * 1.5;
                }
            });
            
            // Pull in enemies
            this.pullEnemies();
        }
    }
    
    /**
     * Pull enemies toward the center of the tornado
     */
    pullEnemies() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // Get position for pull calculations
        // const pullPosition = this.effect.position.clone();
        
        // const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //     pullPosition,
        //     this.skill.radius * 1.5 // Slightly larger than visual radius
        // );
        
        // enemies.forEach(enemy => {
        //     // Get enemy position
        //     const enemyPosition = enemy.getPosition();
        //     if (!enemyPosition) return;
            
        //     // Calculate direction to pull
        //     const pullDirection = new THREE.Vector3(
        //         pullPosition.x - enemyPosition.x,
        //         0, // Don't pull vertically
        //         pullPosition.z - enemyPosition.z
        //     );
            
        //     // Calculate distance
        //     const distance = pullDirection.length();
            
        //     // Skip if already at center
        //     if (distance < 0.1) return;
            
        //     // Normalize direction
        //     pullDirection.normalize();
            
        //     // Pull force decreases with distance
        //     const pullStrength = this.pullForce * (1 - distance / (this.skill.radius * 1.5));
            
        //     // Apply pull force
        //     enemy.applyForce(
        //         pullDirection.x * pullStrength * this.skill.game.deltaTime,
        //         pullDirection.z * pullStrength * this.skill.game.deltaTime
        //     );
            
        //     // Apply damage if very close to center
        //     if (distance < this.skill.radius * 0.3) {
        //         enemy.takeDamage(this.skill.damage * 0.1 * this.skill.game.deltaTime);
        //     }
        // });
    }
}