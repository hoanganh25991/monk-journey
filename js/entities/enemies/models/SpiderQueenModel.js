import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Spider Queen - A large, menacing spider boss
 * Features multiple eyes, venomous fangs, and web-spinning abilities
 */
export class SpiderQueenModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Create main abdomen (large and bulbous)
        const abdomenGeometry = new THREE.SphereGeometry(0.8, 16, 12);
        const abdomenMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a0d00,
            roughness: 0.6,
            metalness: 0.2,
            emissive: 0x330000,
            emissiveIntensity: 0.1
        });
        const abdomen = new THREE.Mesh(abdomenGeometry, abdomenMaterial);
        abdomen.position.set(0, 0.6, -0.3);
        abdomen.scale.set(1, 0.8, 1.2);
        abdomen.castShadow = true;
        
        this.modelGroup.add(abdomen);
        
        // Create cephalothorax (head/chest section)
        const cephGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        const cephMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a1800,
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x440000,
            emissiveIntensity: 0.15
        });
        const cephalothorax = new THREE.Mesh(cephGeometry, cephMaterial);
        cephalothorax.position.set(0, 0.8, 0.5);
        cephalothorax.scale.set(1, 0.9, 0.8);
        cephalothorax.castShadow = true;
        
        this.modelGroup.add(cephalothorax);
        
        // Create multiple eyes
        this.createEyes();
        
        // Create venomous fangs
        this.createFangs();
        
        // Create 8 spider legs
        this.createLegs();
        
        // Create pedipalps (feeding appendages)
        this.createPedipalps();
        
        // Create web spinnerets
        this.createSpinnerets();
        
        // Create markings on abdomen
        this.createAbdomenMarkings();
        
        // Create egg sac (for queen variant)
        this.createEggSac();
    }
    
    /**
     * Create multiple spider eyes
     */
    createEyes() {
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        // Main eyes (larger)
        const mainEyeGeometry = new THREE.SphereGeometry(0.08, 12, 12);
        
        // Left main eye
        const leftMainEye = new THREE.Mesh(mainEyeGeometry, eyeMaterial);
        leftMainEye.position.set(-0.15, 1.0, 0.8);
        leftMainEye.castShadow = true;
        this.modelGroup.add(leftMainEye);
        
        // Right main eye
        const rightMainEye = new THREE.Mesh(mainEyeGeometry, eyeMaterial);
        rightMainEye.position.set(0.15, 1.0, 0.8);
        rightMainEye.castShadow = true;
        this.modelGroup.add(rightMainEye);
        
        // Secondary eyes (smaller)
        const secondaryEyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyePositions = [
            { x: -0.25, y: 1.1, z: 0.75 },
            { x: 0.25, y: 1.1, z: 0.75 },
            { x: -0.1, y: 1.15, z: 0.8 },
            { x: 0.1, y: 1.15, z: 0.8 },
            { x: -0.3, y: 0.95, z: 0.7 },
            { x: 0.3, y: 0.95, z: 0.7 }
        ];
        
        eyePositions.forEach(pos => {
            const eye = new THREE.Mesh(secondaryEyeGeometry, eyeMaterial);
            eye.position.set(pos.x, pos.y, pos.z);
            eye.castShadow = true;
            this.modelGroup.add(eye);
        });
    }
    
    /**
     * Create venomous fangs
     */
    createFangs() {
        const fangMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x006600,
            emissiveIntensity: 0.2
        });
        
        const fangGeometry = new THREE.ConeGeometry(0.03, 0.2, 8);
        
        // Left fang
        const leftFang = new THREE.Mesh(fangGeometry, fangMaterial);
        leftFang.position.set(-0.1, 0.6, 0.9);
        leftFang.rotation.x = Math.PI;
        leftFang.castShadow = true;
        this.modelGroup.add(leftFang);
        
        // Right fang
        const rightFang = new THREE.Mesh(fangGeometry, fangMaterial);
        rightFang.position.set(0.1, 0.6, 0.9);
        rightFang.rotation.x = Math.PI;
        rightFang.castShadow = true;
        this.modelGroup.add(rightFang);
    }
    
    /**
     * Create 8 spider legs
     */
    createLegs() {
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a0d00,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Create 4 legs on each side
        for (let side = 0; side < 2; side++) {
            const sideMultiplier = side === 0 ? -1 : 1;
            
            for (let i = 0; i < 4; i++) {
                this.createLeg(legMaterial, sideMultiplier, i);
            }
        }
    }
    
    /**
     * Create a single spider leg
     */
    createLeg(material, side, index) {
        const legGroup = new THREE.Group();
        
        // Leg segments
        const segments = [
            { length: 0.3, radius: 0.05 }, // Coxa
            { length: 0.4, radius: 0.04 }, // Femur
            { length: 0.5, radius: 0.03 }, // Tibia
            { length: 0.3, radius: 0.02 }  // Tarsus
        ];
        
        let currentPos = new THREE.Vector3(side * 0.4, 0.8, 0.2 - index * 0.3);
        let currentAngle = side * Math.PI / 4 + index * Math.PI / 8;
        
        segments.forEach((segment, segIndex) => {
            const segmentGeometry = new THREE.CylinderGeometry(segment.radius, segment.radius * 0.8, segment.length, 8);
            const segmentMesh = new THREE.Mesh(segmentGeometry, material);
            
            // Position and rotate segment
            segmentMesh.position.copy(currentPos);
            segmentMesh.rotation.z = currentAngle;
            segmentMesh.rotation.y = side * Math.PI / 6;
            
            // Update position for next segment
            currentPos.x += Math.cos(currentAngle) * segment.length * side;
            currentPos.y -= Math.sin(Math.abs(currentAngle)) * segment.length * 0.5;
            currentPos.z += Math.sin(currentAngle) * segment.length * 0.3;
            
            // Adjust angle for more natural leg bend
            currentAngle -= Math.PI / 8;
            
            segmentMesh.castShadow = true;
            legGroup.add(segmentMesh);
        });
        
        this.modelGroup.add(legGroup);
    }
    
    /**
     * Create pedipalps (feeding appendages)
     */
    createPedipalps() {
        const palpMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a1800,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const palpGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.15, 8);
        
        // Left pedipalp
        const leftPalp = new THREE.Mesh(palpGeometry, palpMaterial);
        leftPalp.position.set(-0.2, 0.7, 0.8);
        leftPalp.rotation.z = Math.PI / 6;
        leftPalp.rotation.x = -Math.PI / 4;
        leftPalp.castShadow = true;
        this.modelGroup.add(leftPalp);
        
        // Right pedipalp
        const rightPalp = new THREE.Mesh(palpGeometry, palpMaterial);
        rightPalp.position.set(0.2, 0.7, 0.8);
        rightPalp.rotation.z = -Math.PI / 6;
        rightPalp.rotation.x = -Math.PI / 4;
        rightPalp.castShadow = true;
        this.modelGroup.add(rightPalp);
    }
    
    /**
     * Create web spinnerets
     */
    createSpinnerets() {
        const spinneretMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0d0700,
            roughness: 0.5,
            metalness: 0.3
        });
        
        const spinneretGeometry = new THREE.ConeGeometry(0.03, 0.1, 6);
        
        // Create 3 spinnerets
        for (let i = 0; i < 3; i++) {
            const spinneret = new THREE.Mesh(spinneretGeometry, spinneretMaterial);
            const angle = (i / 3) * Math.PI * 2;
            spinneret.position.set(
                Math.sin(angle) * 0.15,
                0.1,
                -1.0 + Math.cos(angle) * 0.1
            );
            spinneret.rotation.x = Math.PI;
            spinneret.castShadow = true;
            this.modelGroup.add(spinneret);
        }
    }
    
    /**
     * Create markings on the abdomen
     */
    createAbdomenMarkings() {
        const markingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        // Create hourglass marking
        const markingGeometry = new THREE.RingGeometry(0.1, 0.2, 8);
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.position.set(0, 0.6, -0.2);
        marking.rotation.x = Math.PI / 2;
        this.modelGroup.add(marking);
        
        // Create stripe patterns
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.RingGeometry(0.05, 0.1, 8);
            const stripe = new THREE.Mesh(stripeGeometry, markingMaterial);
            stripe.position.set(0, 0.6 - i * 0.1, -0.5 - i * 0.1);
            stripe.rotation.x = Math.PI / 2;
            stripe.scale.set(1, 1 - i * 0.2, 1);
            this.modelGroup.add(stripe);
        }
    }
    
    /**
     * Create egg sac for the queen
     */
    createEggSac() {
        const eggSacMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xfff8dc,
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        const eggSacGeometry = new THREE.SphereGeometry(0.3, 12, 12);
        const eggSac = new THREE.Mesh(eggSacGeometry, eggSacMaterial);
        eggSac.position.set(0, 0.3, -1.2);
        eggSac.scale.set(1, 0.8, 1.2);
        eggSac.castShadow = true;
        
        this.modelGroup.add(eggSac);
        
        // Add webbing around egg sac
        const webbingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const webbingGeometry = new THREE.SphereGeometry(0.35, 8, 8, 0, Math.PI * 2, 0, Math.PI);
        const webbing = new THREE.Mesh(webbingGeometry, webbingMaterial);
        webbing.position.set(0, 0.3, -1.2);
        this.modelGroup.add(webbing);
    }
    
    updateAnimations(delta) {
        if (!this.modelGroup) return;
        
        const time = Date.now() * 0.001;
        
        // Pulsing eye glow
        this.modelGroup.children.forEach(child => {
            if (child.material && child.material.emissive && 
                child.geometry instanceof THREE.SphereGeometry && 
                child.position.y > 0.9) {
                // This is likely an eye
                child.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
            }
        });
        
        // Leg movement simulation
        const legGroups = this.modelGroup.children.filter(child => child instanceof THREE.Group);
        legGroups.forEach((legGroup, index) => {
            legGroup.rotation.y = Math.sin(time * 1.5 + index) * 0.1;
            legGroup.position.y = 0.8 + Math.sin(time * 2 + index) * 0.05;
        });
        
        // Abdomen breathing motion
        const abdomen = this.modelGroup.children.find(child => 
            child.position.z < 0 && child.geometry instanceof THREE.SphereGeometry
        );
        if (abdomen) {
            abdomen.scale.y = 0.8 + Math.sin(time * 1.2) * 0.1;
        }
        
        // Pedipalp movement
        this.modelGroup.children.forEach(child => {
            if (child.geometry instanceof THREE.CylinderGeometry && 
                child.position.z > 0.7 && child.position.y < 0.8) {
                // This is likely a pedipalp
                child.rotation.x = -Math.PI / 4 + Math.sin(time * 3) * 0.2;
            }
        });
        
        // Fang dripping animation
        const fangs = this.modelGroup.children.filter(child => 
            child.geometry instanceof THREE.ConeGeometry && child.position.z > 0.8
        );
        fangs.forEach((fang, index) => {
            if (fang.material) {
                fang.material.emissiveIntensity = 0.2 + Math.sin(time * 4 + index * Math.PI) * 0.15;
            }
        });
        
        // Egg sac subtle movement
        const eggSac = this.modelGroup.children.find(child => 
            child.position.z < -1 && child.geometry instanceof THREE.SphereGeometry
        );
        if (eggSac) {
            eggSac.rotation.y += delta * 0.2;
            eggSac.scale.x = 1 + Math.sin(time * 1.5) * 0.05;
            eggSac.scale.z = 1.2 + Math.sin(time * 1.5) * 0.05;
        }
    }
}