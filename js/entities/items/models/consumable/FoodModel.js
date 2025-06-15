import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for food consumable type
 * Creates a simple food item (bread/fruit)
 */
export class FoodModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create a food group to hold all parts
        const foodGroup = new THREE.Group();
        
        // Determine food type from item properties if available
        // Default to bread if no specific type
        const foodType = this.item.properties?.foodType || 'bread';
        
        switch (foodType) {
            case 'apple':
                this.createApple(foodGroup);
                break;
            case 'bread':
            default:
                this.createBread(foodGroup);
                break;
        }
        
        this.modelGroup.add(foodGroup);
        
        // Position the food correctly
        this.modelGroup.scale.set(0.7, 0.7, 0.7); // Scale down
    }
    
    /**
     * Create a bread model
     * @param {THREE.Group} group - The group to add the bread to
     */
    createBread(group) {
        // Create bread loaf (rounded box)
        const breadGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.3);
        const breadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD2691E, // Chocolate color for bread crust
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create the bread mesh
        const bread = new THREE.Mesh(breadGeometry, breadMaterial);
        bread.position.y = 0;
        bread.castShadow = true;
        bread.receiveShadow = true;
        
        // Create a rounded version of the bread directly
        const roundedGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const roundedMesh = new THREE.Mesh(
            roundedGeometry, 
            breadMaterial.clone()
        );
        roundedMesh.scale.set(1.1, 0.7, 0.7);
        roundedMesh.position.copy(bread.position);
        roundedMesh.castShadow = true;
        roundedMesh.receiveShadow = true;
        
        // Add the rounded bread to group
        group.add(roundedMesh);
        
        // Add bread details (cuts on top)
        this.addBreadDetails(group);
    }
    
    /**
     * Add details to the bread model
     * @param {THREE.Group} group - The group to add the details to
     */
    addBreadDetails(group) {
        // Add cuts on top of bread
        const cutGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.05);
        const cutMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xBB5500, // Darker brown for cuts
            roughness: 0.7,
            metalness: 0.1
        });
        
        // First cut
        const cut1 = new THREE.Mesh(cutGeometry, cutMaterial);
        cut1.position.set(0, 0.15, 0);
        cut1.rotation.x = Math.PI / 4; // Angle the cut
        group.add(cut1);
        
        // Second cut
        const cut2 = new THREE.Mesh(cutGeometry, cutMaterial);
        cut2.position.set(0, 0.15, -0.1);
        cut2.rotation.x = Math.PI / 4; // Angle the cut
        group.add(cut2);
        
        // Add some "flour" specks
        const flourMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFEE,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < 10; i++) {
            const size = 0.02 + Math.random() * 0.02;
            const flourGeometry = new THREE.SphereGeometry(size, 4, 4);
            const flour = new THREE.Mesh(flourGeometry, flourMaterial);
            
            // Random position on top of bread
            flour.position.set(
                (Math.random() - 0.5) * 0.4,
                0.15 + Math.random() * 0.05,
                (Math.random() - 0.5) * 0.25
            );
            
            group.add(flour);
        }
    }
    
    /**
     * Create an apple model
     * @param {THREE.Group} group - The group to add the apple to
     */
    createApple(group) {
        // Create apple body (sphere)
        const appleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const appleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000, // Red apple
            roughness: 0.7,
            metalness: 0.2
        });
        
        const apple = new THREE.Mesh(appleGeometry, appleMaterial);
        apple.position.y = 0;
        apple.castShadow = true;
        
        group.add(apple);
        
        // Add stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(0, 0.25, 0);
        stem.castShadow = true;
        
        group.add(stem);
        
        // Add leaf
        const leafGeometry = new THREE.BoxGeometry(0.1, 0.01, 0.05);
        const leafMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FF00, // Green
            roughness: 0.8,
            metalness: 0.1
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.set(0.05, 0.25, 0);
        leaf.rotation.z = Math.PI / 6; // Angle the leaf
        leaf.castShadow = true;
        
        group.add(leaf);
    }
    
    /**
     * Round the edges of a box mesh to make it look more natural
     * @param {THREE.Mesh} mesh - The mesh to round
     * @returns {THREE.Mesh} - The rounded mesh (either modified original or new one)
     */
    roundEdges(mesh) {
        // We'll use scale to create a slight rounding effect
        if (mesh.geometry.type === 'BoxGeometry') {
            mesh.scale.set(1, 0.9, 0.9);
            
            // Create a slightly larger mesh with rounded corners
            const roundedGeometry = new THREE.SphereGeometry(0.25, 16, 16);
            const roundedMesh = new THREE.Mesh(
                roundedGeometry, 
                mesh.material.clone()
            );
            roundedMesh.scale.set(1.1, 0.7, 0.7);
            roundedMesh.position.copy(mesh.position);
            roundedMesh.castShadow = mesh.castShadow;
            roundedMesh.receiveShadow = mesh.receiveShadow;
            
            // Replace the original mesh with the rounded one if it has a parent
            if (mesh.parent) {
                mesh.parent.remove(mesh);
                mesh.parent.add(roundedMesh);
                return roundedMesh;
            } else {
                console.warn('Mesh has no parent, returning rounded mesh without adding to scene');
                return roundedMesh;
            }
        }
        
        return mesh; // Return original mesh if not a BoxGeometry
    }
    
    updateAnimations(delta) {
        // Simple rotation animation
        if (this.modelGroup) {
            // Gentle rotation
            this.modelGroup.rotation.y += delta * 0.3;
        }
    }
}