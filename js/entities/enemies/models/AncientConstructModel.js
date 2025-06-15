import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

export class AncientConstructModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create body (ancient stone structure, weathered)
        const bodyGeometry = new THREE.BoxGeometry(1.6, 1.8, 1.1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556655,
            roughness: 0.9,
            metalness: 0.1,
            map: this.createStoneTexture()
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        
        this.modelGroup.add(body);
        
        // Create head (ancient carved stone head)
        const headGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556655,
            roughness: 0.8,
            metalness: 0.1,
            map: this.createStoneTexture()
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.1;
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create ancient runes on the body
        const runeGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const runeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88aa88,
            emissive: 0x224422,
            emissiveIntensity: 0.5
        });
        
        // Create multiple runes in a pattern
        const runePositions = [
            { x: 0, y: 1.2, z: 0.56 },
            { x: -0.3, y: 0.8, z: 0.56 },
            { x: 0.3, y: 0.8, z: 0.56 },
            { x: 0, y: 0.4, z: 0.56 }
        ];
        
        runePositions.forEach(pos => {
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(pos.x, pos.y, pos.z);
            this.modelGroup.add(rune);
        });
        
        // Create moss/vegetation growing on the construct
        const mossGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const mossMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x336633,
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add moss patches
        for (let i = 0; i < 8; i++) {
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            const angle = (i / 8) * Math.PI * 2;
            moss.position.set(
                Math.cos(angle) * 0.8,
                0.3 + Math.random() * 1.2,
                Math.sin(angle) * 0.6
            );
            moss.scale.set(
                0.5 + Math.random() * 0.5,
                0.3 + Math.random() * 0.3,
                0.5 + Math.random() * 0.5
            );
            this.modelGroup.add(moss);
        }
        
        // Create arms (weathered stone cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556655,
            roughness: 0.9,
            metalness: 0.1,
            map: this.createStoneTexture()
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.1, 1.0, 0);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.castShadow = true;
        
        this.modelGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.1, 1.0, 0);
        rightArm.rotation.z = -Math.PI / 2;
        rightArm.castShadow = true;
        
        this.modelGroup.add(rightArm);
        
        // Create hands (stone fists with ancient carvings)
        const handGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const handMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556655,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Left hand
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-1.9, 1.0, 0);
        leftHand.castShadow = true;
        
        this.modelGroup.add(leftHand);
        
        // Right hand
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(1.9, 1.0, 0);
        rightHand.castShadow = true;
        
        this.modelGroup.add(rightHand);
        
        // Create legs (thick stone pillars)
        const legGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.9, 12);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556655,
            roughness: 0.9,
            metalness: 0.1,
            map: this.createStoneTexture()
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.5, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.5, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
        
        // Create ancient crown/headpiece
        const crownGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.2, 8);
        const crownMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x778877,
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0x112211,
            emissiveIntensity: 0.2
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 2.6;
        crown.castShadow = true;
        
        this.modelGroup.add(crown);
        
        // Create ancient crystals embedded in the construct
        const crystalGeometry = new THREE.OctahedronGeometry(0.2, 1);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x66aa66,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
            emissive: 0x224422,
            emissiveIntensity: 0.6
        });
        
        // Chest crystal
        const chestCrystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        chestCrystal.position.set(0, 1.2, 0.6);
        chestCrystal.castShadow = true;
        
        this.modelGroup.add(chestCrystal);
        
        // Shoulder crystals
        const leftShoulder = new THREE.Mesh(crystalGeometry, crystalMaterial);
        leftShoulder.position.set(-0.8, 1.6, 0.3);
        leftShoulder.scale.set(0.7, 0.7, 0.7);
        leftShoulder.castShadow = true;
        
        this.modelGroup.add(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(crystalGeometry, crystalMaterial);
        rightShoulder.position.set(0.8, 1.6, 0.3);
        rightShoulder.scale.set(0.7, 0.7, 0.7);
        rightShoulder.castShadow = true;
        
        this.modelGroup.add(rightShoulder);
        
        // Add glowing eyes (ancient magic)
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x66aa66,
            emissive: 0x66aa66,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 2.1, 0.46);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 2.1, 0.46);
        
        this.modelGroup.add(rightEye);
        
        // Add ancient energy particles
        const particleCount = 15;
        const particleGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x88bb88,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.4;
            const height = Math.random() * 2 + 0.5;
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            particle.scale.set(
                Math.random() * 0.6 + 0.4,
                Math.random() * 0.6 + 0.4,
                Math.random() * 0.6 + 0.4
            );
            
            this.modelGroup.add(particle);
        }
    }
    
    // Helper method to create a simple stone texture
    createStoneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Create a simple stone pattern
        context.fillStyle = '#556655';
        context.fillRect(0, 0, 128, 128);
        
        // Add some darker spots for weathering
        context.fillStyle = '#445544';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 10 + 5;
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        
        return texture;
    }
    
    updateAnimations(delta) {
        // Implement ancient construct-specific animations here if needed
        // For example, slowly pulsating crystals or floating particles
        super.updateAnimations(delta);
    }
}