import * as THREE from 'three';

/**
 * Represents a flower environment object
 */
export class Flower {
    /**
     * Create a new flower
     */
    constructor() {
        // Randomize flower properties
        
        // Random flower color
        this.flowerColors = [
            0xff5555, // Red
            0xffff55, // Yellow
            0x5555ff, // Blue
            0xff55ff, // Purple
            0xffffff  // White
        ];
        this.flowerColor = this.flowerColors[Math.floor(Math.random() * this.flowerColors.length)];
        
        // Randomly choose between different flower shapes
        this.flowerType = Math.random();
    }
    
    /**
     * Create the flower mesh
     * @returns {THREE.Group} - The flower group
     */
    createMesh() {
        const flowerGroup = new THREE.Group();
        
        // Create stem
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d6a4f, // Dark green
            roughness: 0.8,
            metalness: 0.2
        });
        
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        stem.castShadow = true;
        stem.receiveShadow = true;
        
        flowerGroup.add(stem);
        
        // Create flower head
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: this.flowerColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        if (this.flowerType < 0.33) {
            // Daisy-like flower (cone + disc)
            const petalGeometry = new THREE.ConeGeometry(0.2, 0.1, 8);
            const flowerHead = new THREE.Mesh(petalGeometry, flowerMaterial);
            flowerHead.rotation.x = Math.PI / 2;
            flowerHead.position.y = 0.55;
            
            const centerMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00, // Yellow center
                roughness: 0.8,
                metalness: 0.2
            });
            
            const centerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.6;
            
            flowerGroup.add(flowerHead);
            flowerGroup.add(center);
        } else if (this.flowerType < 0.66) {
            // Tulip-like flower (sphere)
            const flowerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const flowerHead = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flowerHead.scale.set(1, 1.5, 1);
            flowerHead.position.y = 0.6;
            
            flowerGroup.add(flowerHead);
        } else {
            // Multiple small petals
            const numPetals = 5 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < numPetals; i++) {
                const petalGeometry = new THREE.SphereGeometry(0.08, 8, 8);
                const petal = new THREE.Mesh(petalGeometry, flowerMaterial);
                
                const angle = (i / numPetals) * Math.PI * 2;
                const radius = 0.12;
                
                petal.position.set(
                    Math.cos(angle) * radius,
                    0.55,
                    Math.sin(angle) * radius
                );
                
                flowerGroup.add(petal);
            }
            
            // Add center
            const centerMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00, // Yellow center
                roughness: 0.8,
                metalness: 0.2
            });
            
            const centerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.55;
            
            flowerGroup.add(center);
        }
        
        return flowerGroup;
    }
}