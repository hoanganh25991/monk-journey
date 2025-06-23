import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Inner Sanctuary skill
 */
export class InnerSanctuaryEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        this.rotationSpeed = 1.5; // Rotation speed in radians per second
        this.orbitRadius = 1.2; // Distance from player
        this.orbitHeight = 1.0; // Height above ground
        this.orbitParticles = [];
        this.sanctuaryState = null;
    }

    /**
     * Create an Inner Sanctuary effect
     * @param {THREE.Vector3} position - Player position
     * @param {THREE.Vector3} direction - Player direction
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        position = position.clone();
        // position.y -= 3.0;
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store initial position for orbit calculations
        this.playerPosition = position.clone();
        
        // Create the Inner Sanctuary effect
        this._createInnerSanctuaryEffect(effectGroup, position);
        
        // Position effect at player position
        effectGroup.position.copy(position);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Inner Sanctuary effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @private
     */
    _createInnerSanctuaryEffect(effectGroup, position) {
        // Create the main sanctuary area
        const sanctuaryGroup = new THREE.Group();
        
        // Create the base sanctuary circle
        const baseRadius = this.skill.radius || 5;
        const baseGeometry = new THREE.CircleGeometry(baseRadius, 64);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.3,
            emissive: this.skill.color,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = -Math.PI / 2; // Lay flat on ground
        base.position.y = 0.05; // Slightly above ground to avoid z-fighting
        sanctuaryGroup.add(base);
        
        // Create protective dome
        const domeGeometry = new THREE.SphereGeometry(baseRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.2,
            emissive: this.skill.color,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0; // At ground level
        sanctuaryGroup.add(dome);
        
        // Create edge ring
        const edgeGeometry = new THREE.RingGeometry(baseRadius - 0.1, baseRadius + 0.1, 64);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            emissive: this.skill.color,
            emissiveIntensity: 1.0,
            side: THREE.DoubleSide
        });
        
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.rotation.x = -Math.PI / 2; // Lay flat on ground
        edge.position.y = 0.06; // Slightly above base
        sanctuaryGroup.add(edge);
        
        // Create runes around the sanctuary
        const runeCount = 8;
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = baseRadius * 0.8;
            
            // Create rune container for easier positioning
            const runeContainer = new THREE.Group();
            
            // Create rune (using a simple plane with emissive material)
            const runeGeometry = new THREE.PlaneGeometry(0.7, 0.7);
            const runeMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.9,
                emissive: this.skill.color,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            runeContainer.position.set(
                Math.cos(angle) * runeRadius,
                0.5, // Hover above ground
                Math.sin(angle) * runeRadius
            );
            
            // Rotate rune to face up
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                initialY: runeContainer.position.y,
                rotationSpeed: 0.5 + (Math.random() * 0.5),
                hoverSpeed: 0.2 + (Math.random() * 0.3),
                pulseSpeed: 0.5 + (Math.random() * 1.0)
            };
            
            runeContainer.add(rune);
            sanctuaryGroup.add(runeContainer);
        }
        
        // Create energy pillars at cardinal points
        const pillarCount = 4;
        for (let i = 0; i < pillarCount; i++) {
            const angle = (i / pillarCount) * Math.PI * 2;
            const pillarRadius = baseRadius * 0.6;
            
            // Create pillar
            const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
            const pillarMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5,
                emissive: this.skill.color,
                emissiveIntensity: 1.0
            });
            
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            
            // Position pillar
            pillar.position.set(
                Math.cos(angle) * pillarRadius,
                1, // Half height above ground
                Math.sin(angle) * pillarRadius
            );
            
            // Store animation data
            pillar.userData = {
                pulseSpeed: 0.3 + (Math.random() * 0.3)
            };
            
            sanctuaryGroup.add(pillar);
        }
        
        // Create central mandala
        const mandalaGroup = new THREE.Group();
        mandalaGroup.position.y = 0.1; // Slightly above ground
        
        // Create concentric circles for mandala
        const circleCount = 3;
        for (let i = 0; i < circleCount; i++) {
            const radius = 0.5 + (i * 0.4);
            const circleGeometry = new THREE.RingGeometry(radius - 0.05, radius, 32);
            const circleMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.8 - (i * 0.2),
                emissive: this.skill.color,
                emissiveIntensity: 1.0 - (i * 0.2),
                side: THREE.DoubleSide
            });
            
            const circle = new THREE.Mesh(circleGeometry, circleMaterial);
            circle.rotation.x = -Math.PI / 2; // Lay flat
            
            // Store rotation data
            circle.userData = {
                rotationSpeed: 0.2 - (i * 0.05) // Outer circles rotate slower
            };
            
            mandalaGroup.add(circle);
        }
        
        // Create central energy core
        const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            emissive: this.skill.color,
            emissiveIntensity: 1.5
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.3; // Hover above mandala
        mandalaGroup.add(core);
        
        // Create lotus petals
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            
            // Create a custom shape for the petal
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.quadraticCurveTo(0.2, 0.3, 0.4, 0);
            shape.quadraticCurveTo(0.2, -0.1, 0, 0);
            
            const petalGeometry = new THREE.ShapeGeometry(shape);
            const petalMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.7,
                emissive: this.skill.color,
                emissiveIntensity: 0.8,
                side: THREE.DoubleSide
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            // Position and rotate petal
            petal.position.set(0, 0.1, 0);
            petal.rotation.x = -Math.PI / 2; // Lay flat
            petal.rotation.z = angle;
            
            // Move petal outward
            petal.translateOnAxis(new THREE.Vector3(1, 0, 0), 0.5);
            
            // Store animation data
            petal.userData = {
                pulseSpeed: 0.5 + (Math.random() * 0.5)
            };
            
            mandalaGroup.add(petal);
        }
        
        // Add mandala to sanctuary
        sanctuaryGroup.add(mandalaGroup);
        
        // Create particles floating within the sanctuary
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within the sanctuary
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius * 0.9;
            const height = 0.1 + Math.random() * (baseRadius / 2);
            
            // Create particle
            const particleSize = 0.05 + (Math.random() * 0.1);
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.6 + (Math.random() * 0.4),
                emissive: this.skill.color,
                emissiveIntensity: 0.5
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                orbitRadius: radius,
                orbitAngle: angle,
                orbitSpeed: 0.1 + (Math.random() * 0.3),
                initialHeight: height,
                verticalSpeed: 0.2 + (Math.random() * 0.4),
                amplitude: 0.1 + (Math.random() * 0.3)
            };
            
            sanctuaryGroup.add(particle);
            particles.push(particle);
        }
        
        // Add sanctuary to effect group
        effectGroup.add(sanctuaryGroup);
        
        // Store animation state
        this.sanctuaryState = {
            age: 0,
            particles: particles,
            mandala: mandalaGroup
        };
    }

    /**
     * Update the Inner Sanctuary effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Check if effect has expired
        if (this.elapsedTime >= this.skill.duration) {
            this.isActive = false;
            this.dispose(); // Properly dispose of the effect when it expires
            return;
        }
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update the Inner Sanctuary effect
        this._updateInnerSanctuaryEffect(delta);
    }

    /**
     * Update the Inner Sanctuary effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateInnerSanctuaryEffect(delta) {
        // Update sanctuary state
        this.sanctuaryState.age += delta;
        
        // Get the sanctuary group (first child of effect group)
        const sanctuaryGroup = this.effect.children[0];
        
        // Update mandala rotation
        const mandala = this.sanctuaryState.mandala;
        for (let i = 0; i < mandala.children.length; i++) {
            const child = mandala.children[i];
            if (child.userData && child.userData.rotationSpeed) {
                // Rotate concentric circles
                child.rotation.z += child.userData.rotationSpeed * delta;
            }
            
            if (child.userData && child.userData.pulseSpeed) {
                // Pulse petals
                const scale = 1.0 + 0.2 * Math.sin(this.sanctuaryState.age * child.userData.pulseSpeed);
                child.scale.set(scale, scale, scale);
            }
        }
        
        // Update floating particles
        for (const particle of this.sanctuaryState.particles) {
            if (particle.userData) {
                // Orbit around center
                const newAngle = particle.userData.orbitAngle + (delta * particle.userData.orbitSpeed);
                particle.userData.orbitAngle = newAngle;
                
                particle.position.x = Math.cos(newAngle) * particle.userData.orbitRadius;
                particle.position.z = Math.sin(newAngle) * particle.userData.orbitRadius;
                
                // Oscillate height
                const heightOffset = Math.sin(this.sanctuaryState.age * particle.userData.verticalSpeed) * particle.userData.amplitude;
                particle.position.y = particle.userData.initialHeight + heightOffset;
            }
        }
        
        // Update runes and pillars
        for (let i = 0; i < sanctuaryGroup.children.length; i++) {
            const child = sanctuaryGroup.children[i];
            
            // Check if it's a rune container
            if (child.children.length > 0 && child.children[0].userData && child.children[0].userData.hoverSpeed) {
                const rune = child.children[0];
                
                // Hover up and down
                const hoverOffset = Math.sin(this.sanctuaryState.age * rune.userData.hoverSpeed) * 0.1;
                child.position.y = rune.userData.initialY + hoverOffset;
                
                // Rotate rune
                rune.rotation.z += rune.userData.rotationSpeed * delta;
                
                // Pulse size
                const scale = 1.0 + 0.1 * Math.sin(this.sanctuaryState.age * rune.userData.pulseSpeed);
                rune.scale.set(scale, scale, scale);
            }
            
            // Check if it's a pillar
            if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.userData && child.userData.pulseSpeed) {
                // Pulse opacity
                const opacity = 0.3 + 0.2 * Math.sin(this.sanctuaryState.age * child.userData.pulseSpeed);
                child.material.opacity = opacity;
            }
        }
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Inner Sanctuary specific resources
        if (this.sanctuaryState) {
            // Clear particle references
            if (this.sanctuaryState.particles) {
                this.sanctuaryState.particles.length = 0;
            }
            
            // Clear sanctuary state
            this.sanctuaryState = null;
        }
        
        // Recursively dispose of geometries and materials
        this.effect.traverse(child => {
            // Dispose of geometries
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            // Dispose of materials
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        // Dispose of any textures
                        if (material.map) material.map.dispose();
                        if (material.normalMap) material.normalMap.dispose();
                        if (material.specularMap) material.specularMap.dispose();
                        if (material.emissiveMap) material.emissiveMap.dispose();
                        
                        // Dispose of the material itself
                        material.dispose();
                    });
                } else {
                    // Dispose of any textures
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    if (child.material.specularMap) child.material.specularMap.dispose();
                    if (child.material.emissiveMap) child.material.emissiveMap.dispose();
                    
                    // Dispose of the material itself
                    child.material.dispose();
                }
            }
            
            // Clear any userData
            if (child.userData) {
                child.userData = {};
            }
        });
        
        // Remove from parent
        if (this.effect.parent) {
            this.effect.parent.remove(this.effect);
        }
        
        // Clear references
        this.effect = null;
        this.isActive = false;
        this.playerPosition = null;
    }
    
    /**
     * Override the reset method to properly clean up all resources
     */
    reset() {
        // Call the dispose method to clean up resources
        this.dispose();
        
        // Reset state variables
        this.isActive = false;
        this.elapsedTime = 0;
    }
}