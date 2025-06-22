import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Frost Elemental enemy type
 * Creates an ice-based elemental with crystalline features
 */
export class FrostElementalModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.particles = [];
        this.createModel();
    }
    
    createModel() {
        // Create core (crystalline sphere)
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff,
            emissive: 0x88ccff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8,
            metalness: 0.9,
            roughness: 0.2
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1.0;
        core.castShadow = true;
        
        this.modelGroup.add(core);
        
        // Create outer ice shell (larger, more transparent sphere)
        const shellGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const shellMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xaaddff,
            emissive: 0xaaddff,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.4,
            metalness: 0.8,
            roughness: 0.1
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.y = 1.0;
        shell.castShadow = false;
        
        this.modelGroup.add(shell);
        
        // Create ice spikes
        this.createIceSpikes();
        
        // Create snow particles
        this.createSnowParticles();
    }
    
    /**
     * Create ice spikes protruding from the core
     */
    createIceSpikes() {
        const spikeCount = 8;
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xccffff,
            transparent: true,
            opacity: 0.7,
            metalness: 0.9,
            roughness: 0.1
        });
        
        for (let i = 0; i < spikeCount; i++) {
            // Calculate position on a sphere
            const phi = Math.acos(-1 + (2 * i) / spikeCount);
            const theta = Math.sqrt(spikeCount * Math.PI) * phi;
            
            // Create spike (cone)
            const height = 0.4 + Math.random() * 0.3;
            const spikeGeometry = new THREE.ConeGeometry(0.1, height, 4);
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position spike
            spike.position.set(
                0.7 * Math.sin(phi) * Math.cos(theta),
                1.0 + 0.7 * Math.cos(phi),
                0.7 * Math.sin(phi) * Math.sin(theta)
            );
            
            // Orient spike to point outward
            spike.lookAt(new THREE.Vector3(
                spike.position.x * 2,
                spike.position.y * 2,
                spike.position.z * 2
            ));
            
            spike.castShadow = true;
            
            this.modelGroup.add(spike);
        }
    }
    
    /**
     * Create snow particles around the elemental
     */
    createSnowParticles() {
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xaaaaaa,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the core
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.7;
            const height = 0.7 + Math.random() * 0.8;
            
            particle.position.set(
                Math.sin(angle) * radius,
                height,
                Math.cos(angle) * radius
            );
            
            // Store velocity for animation
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    -0.01 - Math.random() * 0.01,
                    (Math.random() - 0.5) * 0.01
                ),
                age: Math.random() * 2.0,
                maxAge: 2.0 + Math.random() * 1.0
            };
            
            this.particles.push(particle);
            this.modelGroup.add(particle);
        }
    }
    
    updateAnimations(delta) {
        // Pulsating core
        if (this.modelGroup && this.modelGroup.children.length > 0) {
            const time = Date.now() * 0.001; // Convert to seconds
            const core = this.modelGroup.children[0];
            const shell = this.modelGroup.children[1];
            
            if (core && shell) {
                // Pulsate the core
                const pulseFactor = 1.0 + Math.sin(time * 2.0) * 0.1;
                core.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Pulsate the outer shell more dramatically
                const shellPulseFactor = 1.0 + Math.sin(time * 1.5) * 0.15;
                shell.scale.set(shellPulseFactor, shellPulseFactor, shellPulseFactor);
            }
            
            // Rotate individual frost parts instead of the entire model
            // (Y rotation is handled by Enemy class for facing direction)
            if (this.modelGroup.children.length > 1) {
                const shell = this.modelGroup.children[1]; // Outer shell
                if (shell) {
                    shell.rotation.y += delta * 0.3;
                }
            }
        }
        
        // Update snow particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            // Update particle position
            particle.position.add(userData.velocity);
            
            // Age the particle
            userData.age += delta;
            
            // If particle is too old or too low, reset it
            if (userData.age > userData.maxAge || particle.position.y < 0.1) {
                // Reset position
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.3 + Math.random() * 0.5;
                
                particle.position.set(
                    Math.sin(angle) * radius,
                    1.5 + Math.random() * 0.5,
                    Math.cos(angle) * radius
                );
                
                // Reset velocity
                userData.velocity.set(
                    (Math.random() - 0.5) * 0.01,
                    -0.01 - Math.random() * 0.01,
                    (Math.random() - 0.5) * 0.01
                );
                
                // Reset age
                userData.age = 0;
            }
            
            // Fade out as the particle ages
            const opacity = 1.0 - (userData.age / userData.maxAge);
            particle.material.opacity = opacity * 0.8;
        }
    }
}