import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Fire Elemental enemy type
 * Creates a flame-like creature with particle effects
 */
export class FireElementalModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.particles = [];
        this.createModel();
    }
    
    createModel() {
        // Create core (glowing sphere)
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1.0;
        core.castShadow = true;
        
        this.modelGroup.add(core);
        
        // Create outer flame (larger, more transparent sphere)
        const flameGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const flameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 1.0;
        flame.castShadow = false;
        
        this.modelGroup.add(flame);
        
        // Create flame tendrils
        this.createFlameTendrils();
        
        // Create flame particles
        this.createFlameParticles();
    }
    
    /**
     * Create flame tendrils extending from the core
     */
    createFlameTendrils() {
        const tendrilCount = 5;
        const tendrilMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < tendrilCount; i++) {
            const angle = (i / tendrilCount) * Math.PI * 2;
            const height = 0.8 + Math.random() * 0.6;
            
            // Create a curved path for the tendril
            const curve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 1.0, 0),
                new THREE.Vector3(Math.sin(angle) * 0.5, 1.2, Math.cos(angle) * 0.5),
                new THREE.Vector3(Math.sin(angle) * 0.7, 1.5, Math.cos(angle) * 0.7),
                new THREE.Vector3(Math.sin(angle) * 0.3, 1.0 + height, Math.cos(angle) * 0.3)
            );
            
            const tendrilGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
            const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
            tendril.castShadow = false;
            
            this.modelGroup.add(tendril);
        }
    }
    
    /**
     * Create flame particles around the elemental
     */
    createFlameParticles() {
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00,
            emissive: 0xffcc00,
            emissiveIntensity: 1.0,
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
                    (Math.random() - 0.5) * 0.02,
                    0.02 + Math.random() * 0.02,
                    (Math.random() - 0.5) * 0.02
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
            const flame = this.modelGroup.children[1];
            
            if (core && flame) {
                // Pulsate the core
                const pulseFactor = 1.0 + Math.sin(time * 3.0) * 0.1;
                core.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Pulsate the outer flame more dramatically
                const flamePulseFactor = 1.0 + Math.sin(time * 2.0) * 0.2;
                flame.scale.set(flamePulseFactor, flamePulseFactor, flamePulseFactor);
            }
            
            // Rotate individual flame parts instead of the entire model
            // (Y rotation is handled by Enemy class for facing direction)
            if (this.modelGroup.children.length > 1) {
                const flame = this.modelGroup.children[1]; // Outer flame
                if (flame) {
                    flame.rotation.y += delta * 0.5;
                }
            }
        }
        
        // Update flame particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            // Update particle position
            particle.position.add(userData.velocity);
            
            // Age the particle
            userData.age += delta;
            
            // If particle is too old, reset it
            if (userData.age > userData.maxAge) {
                // Reset position
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.3 + Math.random() * 0.5;
                
                particle.position.set(
                    Math.sin(angle) * radius,
                    0.7 + Math.random() * 0.5,
                    Math.cos(angle) * radius
                );
                
                // Reset velocity
                userData.velocity.set(
                    (Math.random() - 0.5) * 0.02,
                    0.02 + Math.random() * 0.02,
                    (Math.random() - 0.5) * 0.02
                );
                
                // Reset age
                userData.age = 0;
            }
            
            // Fade out as the particle ages
            const opacity = 1.0 - (userData.age / userData.maxAge);
            particle.material.opacity = opacity * 0.8;
            
            // Scale down as the particle rises
            const scale = 1.0 - (userData.age / userData.maxAge) * 0.5;
            particle.scale.set(scale, scale, scale);
        }
    }
}