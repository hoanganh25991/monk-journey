import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for scroll consumable type
 * Creates a magical scroll with parchment and mystical symbols
 */
export class ScrollModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.particles = []; // Store particle references for safer access
        this.symbols = []; // Store symbol references for safer access
        this.glow = null; // Store glow reference
        this.createModel();
    }
    
    createModel() {
        // Create scroll group
        const scrollGroup = new THREE.Group();
        
        // Create parchment (cylinder)
        const parchmentGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
        const parchmentMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xF5DEB3, // Wheat color for parchment
            roughness: 0.8,
            metalness: 0.1
        });
        const parchment = new THREE.Mesh(parchmentGeometry, parchmentMaterial);
        parchment.rotation.z = Math.PI / 2; // Rotate to horizontal
        parchment.castShadow = true;
        
        scrollGroup.add(parchment);
        
        // Create scroll ends (wooden rods)
        const rodGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
        const rodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown for wood
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left rod
        const leftRod = new THREE.Mesh(rodGeometry, rodMaterial);
        leftRod.position.set(-0.24, 0, 0);
        leftRod.rotation.z = Math.PI / 2;
        leftRod.castShadow = true;
        scrollGroup.add(leftRod);
        
        // Right rod
        const rightRod = new THREE.Mesh(rodGeometry, rodMaterial);
        rightRod.position.set(0.24, 0, 0);
        rightRod.rotation.z = Math.PI / 2;
        rightRod.castShadow = true;
        scrollGroup.add(rightRod);
        
        this.modelGroup.add(scrollGroup);
        
        // Add mystical symbols
        this.addMysticalSymbols();
        
        // Add magical glow effect
        this.addMagicalGlow();
        
        // Position the scroll correctly
        this.modelGroup.scale.set(0.8, 0.8, 0.8); // Scale down slightly
    }
    
    /**
     * Add mystical symbols to the scroll
     */
    addMysticalSymbols() {
        // Create symbols on the parchment
        const symbolCount = 3;
        const symbolMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4B0082, // Indigo for mystical symbols
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x4B0082,
            emissiveIntensity: 0.2
        });
        
        for (let i = 0; i < symbolCount; i++) {
            // Create different symbol shapes
            let symbolGeometry;
            switch (i % 3) {
                case 0:
                    // Circle symbol
                    symbolGeometry = new THREE.RingGeometry(0.02, 0.03, 8);
                    break;
                case 1:
                    // Triangle symbol
                    symbolGeometry = new THREE.ConeGeometry(0.025, 0.01, 3);
                    break;
                case 2:
                    // Star symbol (simplified as octahedron)
                    symbolGeometry = new THREE.OctahedronGeometry(0.02);
                    break;
            }
            
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            symbol.position.set(
                -0.15 + (i * 0.15), // Spread along the scroll
                0,
                0.06 // Slightly above the parchment surface
            );
            
            // Random rotation for variety
            symbol.rotation.z = Math.random() * Math.PI * 2;
            
            this.modelGroup.add(symbol);
            this.symbols.push(symbol); // Store reference for safer access
        }
    }
    
    /**
     * Add magical glow effect around the scroll
     */
    addMagicalGlow() {
        // Create a subtle glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x9370DB, // Medium purple
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.set(1.2, 0.8, 0.8); // Flatten the glow slightly
        
        this.modelGroup.add(glow);
        this.glow = glow; // Store reference for safer access
        
        // Add particle-like effects
        const particleCount = 8;
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700, // Gold particles
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.005, 4, 4);
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the scroll
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.1;
            particle.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.3,
                Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                originalPosition: particle.position.clone(),
                orbitSpeed: 0.5 + Math.random() * 0.5,
                bobSpeed: 1 + Math.random() * 2
            };
            
            this.modelGroup.add(particle);
            this.particles.push(particle); // Store reference for safer access
        }
    }
    
    updateAnimations(delta) {
        // Animations for the scroll
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Animate mystical symbols using stored references
            for (let i = 0; i < this.symbols.length; i++) {
                const symbol = this.symbols[i];
                if (symbol && symbol.material) {
                    // Pulsing glow effect
                    symbol.material.emissiveIntensity = 0.2 + Math.sin(time * 2 + i) * 0.15;
                    
                    // Gentle rotation
                    symbol.rotation.z += delta * (0.5 + i * 0.2);
                }
            }
            
            // Animate glow effect using stored reference
            if (this.glow && this.glow.material) {
                this.glow.material.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;
                this.glow.rotation.y += delta * 0.3;
            }
            
            // Animate particles using stored references
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                if (particle && particle.userData && particle.userData.originalPosition) {
                    const userData = particle.userData;
                    
                    // Orbit around the scroll
                    const angle = time * userData.orbitSpeed;
                    const radius = 0.2;
                    particle.position.x = userData.originalPosition.x + Math.cos(angle) * 0.05;
                    particle.position.z = userData.originalPosition.z + Math.sin(angle) * 0.05;
                    
                    // Bob up and down
                    particle.position.y = userData.originalPosition.y + Math.sin(time * userData.bobSpeed) * 0.02;
                    
                    // Fade in and out
                    if (particle.material) {
                        particle.material.opacity = 0.6 + Math.sin(time * 3 + i) * 0.3;
                    }
                }
            }
            
            // Gentle floating motion for the entire scroll
            this.modelGroup.position.y = Math.sin(time * 0.8) * 0.02;
            this.modelGroup.rotation.y += delta * 0.2;
        }
    }
    
    /**
     * Clean up resources when the model is no longer needed
     */
    dispose() {
        // Clear references to prevent memory leaks
        this.particles = [];
        this.symbols = [];
        this.glow = null;
        
        // Dispose of geometries and materials
        if (this.modelGroup) {
            this.modelGroup.traverse(child => {
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
        }
    }
}