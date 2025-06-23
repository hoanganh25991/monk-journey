import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for robe armor type
 * Creates a monk-style robe with flowing fabric
 */
export class RobeModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create main robe body (tapered cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.2, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create collar/shoulders (flattened torus)
        const collarGeometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
        const collarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            roughness: 0.9,
            metalness: 0.1
        });
        const collar = new THREE.Mesh(collarGeometry, collarMaterial);
        collar.position.y = 0.5;
        collar.rotation.x = Math.PI / 2;
        collar.scale.set(1, 1, 0.3); // Flatten
        collar.castShadow = true;
        
        this.modelGroup.add(collar);
        
        // Create sleeves
        this.createSleeves();
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the robe correctly
        this.modelGroup.scale.set(0.6, 0.6, 0.6); // Scale down
    }
    
    /**
     * Create sleeves for the robe
     */
    createSleeves() {
        const sleeveMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left sleeve
        const leftSleeveGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.6, 8);
        const leftSleeve = new THREE.Mesh(leftSleeveGeometry, sleeveMaterial);
        leftSleeve.position.set(-0.4, 0.3, 0);
        leftSleeve.rotation.z = Math.PI / 3; // Angle outward
        leftSleeve.castShadow = true;
        
        this.modelGroup.add(leftSleeve);
        
        // Right sleeve
        const rightSleeveGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.6, 8);
        const rightSleeve = new THREE.Mesh(rightSleeveGeometry, sleeveMaterial);
        rightSleeve.position.set(0.4, 0.3, 0);
        rightSleeve.rotation.z = -Math.PI / 3; // Angle outward
        rightSleeve.castShadow = true;
        
        this.modelGroup.add(rightSleeve);
        
        // Create sleeve ends (cuffs)
        const cuffMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Left cuff
        const leftCuffGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
        const leftCuff = new THREE.Mesh(leftCuffGeometry, cuffMaterial);
        leftCuff.position.set(-0.7, 0.1, 0);
        leftCuff.rotation.x = Math.PI / 2;
        leftCuff.castShadow = true;
        
        this.modelGroup.add(leftCuff);
        
        // Right cuff
        const rightCuffGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
        const rightCuff = new THREE.Mesh(rightCuffGeometry, cuffMaterial);
        rightCuff.position.set(0.7, 0.1, 0);
        rightCuff.rotation.x = Math.PI / 2;
        rightCuff.castShadow = true;
        
        this.modelGroup.add(rightCuff);
    }
    
    /**
     * Add decorative elements to the robe
     */
    addDecorativeElements() {
        // Add belt/sash
        const beltGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.5);
        const beltMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.5,
            metalness: 0.7
        });
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.position.y = 0;
        belt.castShadow = true;
        
        this.modelGroup.add(belt);
        
        // Add embroidery pattern (simple geometric shapes)
        const embroideryMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000, // Red
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0xFF0000,
            emissiveIntensity: 0.2
        });
        
        // Create circular pattern on front
        const circleGeometry = new THREE.CircleGeometry(0.15, 16);
        const circle = new THREE.Mesh(circleGeometry, embroideryMaterial);
        circle.position.set(0, 0.2, 0.41);
        circle.castShadow = false;
        
        this.modelGroup.add(circle);
        
        // Create triangular patterns
        const triangleCount = 3;
        for (let i = 0; i < triangleCount; i++) {
            const triangleGeometry = new THREE.ConeGeometry(0.05, 0.1, 3);
            const triangle = new THREE.Mesh(triangleGeometry, embroideryMaterial);
            
            // Position triangles around the circle
            const angle = (i / triangleCount) * Math.PI * 2;
            triangle.position.set(
                Math.sin(angle) * 0.25,
                0.2,
                Math.cos(angle) * 0.25 + 0.41
            );
            
            triangle.rotation.x = Math.PI / 2;
            triangle.rotation.z = angle;
            
            this.modelGroup.add(triangle);
        }
        
        // Add hanging tassels from belt
        const tasselCount = 2;
        const tasselMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.5,
            metalness: 0.7
        });
        
        for (let i = 0; i < tasselCount; i++) {
            const tasselGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.3, 8);
            const tassel = new THREE.Mesh(tasselGeometry, tasselMaterial);
            
            // Position tassels on either side of belt
            const offset = (i === 0) ? -0.3 : 0.3;
            tassel.position.set(offset, -0.2, 0.2);
            
            this.modelGroup.add(tassel);
        }
    }
    
    updateAnimations(delta) {
        // Subtle animations for the robe
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Gentle swaying of the robe
            this.modelGroup.rotation.y = Math.sin(time * 0.5) * 0.05;
            
            // Animate the tassels
            const leftTassel = this.modelGroup.children[9]; // Left tassel
            const rightTassel = this.modelGroup.children[10]; // Right tassel
            
            if (leftTassel && rightTassel) {
                leftTassel.rotation.x = Math.sin(time * 2) * 0.1;
                rightTassel.rotation.x = Math.sin(time * 2 + 0.5) * 0.1;
            }
            
            // Pulse the embroidery
            for (let i = 0; i < 4; i++) {
                const embroidery = this.modelGroup.children[7 + i]; // Embroidery elements
                if (embroidery && embroidery.material) {
                    embroidery.material.emissiveIntensity = 0.2 + Math.sin(time * 1.5) * 0.1;
                }
            }
        }
    }
}