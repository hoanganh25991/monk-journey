import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Inferno Lord - A powerful fire-based boss enemy
 * Features molten armor, fiery aura, and lava weapons
 */
export class InfernoLordModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create main body (armored and imposing)
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x330000,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xFF4500,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (helmeted and menacing)
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1A0000,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0xFF6600,
            emissiveIntensity: 0.4
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.9;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create crown of flames
        this.createFlameCrown(head);
        
        // Create armor plating
        this.createArmorPlating();
        
        // Create massive arms
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.18, 1.0, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x440000,
            roughness: 0.4,
            metalness: 0.6,
            emissive: 0xFF4500,
            emissiveIntensity: 0.2
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 0.75, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 0.75, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create powerful legs
        const legGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x440000,
            roughness: 0.4,
            metalness: 0.6,
            emissive: 0xFF4500,
            emissiveIntensity: 0.2
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.35, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.35, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Create lava sword
        this.createLavaSword();
        
        // Create cape of flames
        this.createFlameCape();
        
        // Add fire particles effect points
        this.createFirePoints();
    }
    
    /**
     * Create crown of flames around the head
     */
    createFlameCrown(head) {
        const flameCount = 8;
        const flameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF8C00,
            emissive: 0xFF4500,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < flameCount; i++) {
            const flameGeometry = new THREE.ConeGeometry(0.08, 0.3, 6);
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            
            const angle = (i / flameCount) * Math.PI * 2;
            flame.position.set(
                Math.sin(angle) * 0.35,
                2.2 + Math.random() * 0.1,
                Math.cos(angle) * 0.35
            );
            
            flame.rotation.x = Math.random() * 0.2 - 0.1;
            flame.rotation.z = Math.random() * 0.2 - 0.1;
            
            this.modelGroup.add(flame);
        }
    }
    
    /**
     * Create armor plating details
     */
    createArmorPlating() {
        const armorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0xFF0000,
            emissiveIntensity: 0.1
        });
        
        // Chest plate
        const chestGeometry = new THREE.BoxGeometry(1.0, 0.8, 0.1);
        const chestPlate = new THREE.Mesh(chestGeometry, armorMaterial);
        chestPlate.position.set(0, 1.0, 0.45);
        chestPlate.castShadow = true;
        
        this.modelGroup.add(chestPlate);
        
        // Shoulder pads
        const shoulderGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        
        const leftShoulder = new THREE.Mesh(shoulderGeometry, armorMaterial);
        leftShoulder.position.set(-0.7, 1.3, 0);
        leftShoulder.castShadow = true;
        
        this.modelGroup.add(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(shoulderGeometry, armorMaterial);
        rightShoulder.position.set(0.7, 1.3, 0);
        rightShoulder.castShadow = true;
        
        this.modelGroup.add(rightShoulder);
    }
    
    /**
     * Create lava sword weapon
     */
    createLavaSword() {
        // Sword handle
        const handleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x220000,
            roughness: 0.3,
            metalness: 0.8
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(1.2, 0.75, 0);
        handle.rotation.z = -Math.PI / 2;
        handle.castShadow = true;
        
        this.modelGroup.add(handle);
        
        // Sword blade (glowing lava)
        const bladeGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF8C00,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.3
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(1.95, 0.75, 0);
        blade.castShadow = true;
        
        this.modelGroup.add(blade);
        
        // Crossguard
        const guardGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.08);
        const guardMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.2,
            metalness: 0.9
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.set(1.2, 0.75, 0);
        guard.castShadow = true;
        
        this.modelGroup.add(guard);
    }
    
    /**
     * Create cape of flames
     */
    createFlameCape() {
        const capeGeometry = new THREE.PlaneGeometry(1.2, 1.5);
        const capeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF6600,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const cape = new THREE.Mesh(capeGeometry, capeMaterial);
        cape.position.set(0, 0.75, -0.8);
        cape.rotation.x = Math.PI / 6;
        
        this.modelGroup.add(cape);
    }
    
    /**
     * Create fire effect points for particle systems
     */
    createFirePoints() {
        // Store fire points for potential particle effects
        this.firePoints = [
            new THREE.Vector3(0, 2.2, 0), // Crown flames
            new THREE.Vector3(1.95, 0.75, 0), // Sword blade
            new THREE.Vector3(-0.7, 1.3, 0), // Left shoulder
            new THREE.Vector3(0.7, 1.3, 0), // Right shoulder
            new THREE.Vector3(0, 0.75, -0.8) // Cape
        ];
    }
    
    updateAnimations(delta) {
        if (!this.modelGroup) return;
        
        const time = Date.now() * 0.001;
        
        // Pulsing fire effects
        this.modelGroup.children.forEach((child, index) => {
            if (child.material && child.material.emissive) {
                // Vary emissive intensity for fire effects
                const baseIntensity = child.material.emissiveIntensity || 0.3;
                child.material.emissiveIntensity = baseIntensity + Math.sin(time * 3 + index) * 0.2;
            }
        });
        
        // Cape animation
        const cape = this.modelGroup.children.find(child => 
            child.geometry instanceof THREE.PlaneGeometry
        );
        if (cape) {
            cape.rotation.x = Math.PI / 6 + Math.sin(time * 2) * 0.1;
            cape.position.z = -0.8 + Math.sin(time * 1.5) * 0.1;
        }
        
        // Crown flames flickering
        const flames = this.modelGroup.children.filter(child => 
            child.geometry instanceof THREE.ConeGeometry && child.position.y > 2
        );
        flames.forEach((flame, index) => {
            flame.scale.y = 1 + Math.sin(time * 4 + index) * 0.3;
            flame.rotation.y += delta * (1 + index * 0.2);
        });
        
        // Sword blade glow
        const blade = this.modelGroup.children.find(child => 
            child.position.x > 1.8 && child.geometry instanceof THREE.BoxGeometry
        );
        if (blade && blade.material) {
            blade.material.emissiveIntensity = 0.6 + Math.sin(time * 5) * 0.3;
        }
    }
}