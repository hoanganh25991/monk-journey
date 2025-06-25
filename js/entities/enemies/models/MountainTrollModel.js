import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Mountain Troll enemy type
 * Creates a large, bulky troll with rocky features
 */
export class MountainTrollModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create body (large, irregular box)
        const bodyGeometry = new THREE.BoxGeometry(1.4, 1.8, 1.0);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        
        // Add some irregularity to the body
        // Using BufferGeometry API for newer Three.js versions
        const positionAttribute = body.geometry.getAttribute('position');
        const positions = positionAttribute.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += (Math.random() - 0.5) * 0.1;     // x
            positions[i + 1] += (Math.random() - 0.5) * 0.1; // y
            positions[i + 2] += (Math.random() - 0.5) * 0.1; // z
        }
        
        positionAttribute.needsUpdate = true;
        
        this.modelGroup.add(body);
        
        // Create head (large, irregular sphere)
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.2;
        head.scale.set(1.2, 0.9, 1.0);
        head.castShadow = true;
        
        this.modelGroup.add(head);
        
        // Create arms (thick cylinders)
        this.createArms();
        
        // Create legs (thick cylinders)
        this.createLegs();
        
        // Add rocky features
        this.addRockyFeatures();
        
        // Add face features
        this.addFaceFeatures(head);
        
        // Add club weapon
        this.createClub();
    }
    
    /**
     * Create arms for the troll
     */
    createArms() {
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.2
        });
        
        // Left arm (upper)
        const leftUpperArmGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
        const leftUpperArm = new THREE.Mesh(leftUpperArmGeometry, armMaterial);
        leftUpperArm.position.set(-0.9, 1.5, 0);
        leftUpperArm.rotation.z = Math.PI * 0.25;
        leftUpperArm.castShadow = true;
        
        this.modelGroup.add(leftUpperArm);
        
        // Left arm (lower)
        const leftLowerArmGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.9, 8);
        const leftLowerArm = new THREE.Mesh(leftLowerArmGeometry, armMaterial);
        leftLowerArm.position.set(-1.4, 1.1, 0);
        leftLowerArm.rotation.z = Math.PI * 0.5;
        leftLowerArm.castShadow = true;
        
        this.modelGroup.add(leftLowerArm);
        
        // Right arm (upper)
        const rightUpperArmGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
        const rightUpperArm = new THREE.Mesh(rightUpperArmGeometry, armMaterial);
        rightUpperArm.position.set(0.9, 1.5, 0);
        rightUpperArm.rotation.z = -Math.PI * 0.25;
        rightUpperArm.castShadow = true;
        
        this.modelGroup.add(rightUpperArm);
        
        // Right arm (lower)
        const rightLowerArmGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.9, 8);
        const rightLowerArm = new THREE.Mesh(rightLowerArmGeometry, armMaterial);
        rightLowerArm.position.set(1.4, 1.1, 0);
        rightLowerArm.rotation.z = -Math.PI * 0.5;
        rightLowerArm.castShadow = true;
        
        this.modelGroup.add(rightLowerArm);
    }
    
    /**
     * Create legs for the troll
     */
    createLegs() {
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.2
        });
        
        // Left leg
        const leftLegGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.0, 8);
        const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        leftLeg.position.set(-0.5, 0, 0);
        leftLeg.castShadow = true;
        
        this.modelGroup.add(leftLeg);
        
        // Right leg
        const rightLegGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.0, 8);
        const rightLeg = new THREE.Mesh(rightLegGeometry, legMaterial);
        rightLeg.position.set(0.5, 0, 0);
        rightLeg.castShadow = true;
        
        this.modelGroup.add(rightLeg);
    }
    
    /**
     * Add rocky features to the troll
     */
    addRockyFeatures() {
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 1.0,
            metalness: 0.3
        });
        
        // Add rocks to back
        const rockCount = 5;
        for (let i = 0; i < rockCount; i++) {
            const rockSize = 0.15 + Math.random() * 0.15;
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Position on back
            rock.position.set(
                (Math.random() - 0.5) * 0.8,
                1.0 + Math.random() * 0.8,
                -0.4 - Math.random() * 0.2
            );
            
            // Random rotation
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rock.castShadow = true;
            
            this.modelGroup.add(rock);
        }
        
        // Add rocks to shoulders
        const shoulderRockGeometry = new THREE.DodecahedronGeometry(0.25, 0);
        
        // Left shoulder rock
        const leftShoulderRock = new THREE.Mesh(shoulderRockGeometry, rockMaterial);
        leftShoulderRock.position.set(-0.7, 1.8, 0);
        leftShoulderRock.castShadow = true;
        
        this.modelGroup.add(leftShoulderRock);
        
        // Right shoulder rock
        const rightShoulderRock = new THREE.Mesh(shoulderRockGeometry, rockMaterial);
        rightShoulderRock.position.set(0.7, 1.8, 0);
        rightShoulderRock.castShadow = true;
        
        this.modelGroup.add(rightShoulderRock);
    }
    
    /**
     * Add face features to the troll
     */
    addFaceFeatures(head) {
        // Create eyes (small, deep-set spheres)
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.1, 0.4);
        head.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.1, 0.4);
        head.add(rightEye);
        
        // Create nose (small cone)
        const noseGeometry = new THREE.ConeGeometry(0.1, 0.2, 4);
        const noseMaterial = new THREE.MeshStandardMaterial({ 
            color: this.enemy.color,
            roughness: 0.9,
            metalness: 0.2
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, -0.1, 0.5);
        nose.rotation.x = -Math.PI / 2;
        head.add(nose);
        
        // Create mouth (simple line)
        const mouthGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
        const mouthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.25, 0.45);
        head.add(mouth);
        
        // Add tusks
        const tuskGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.15, 8);
        const tuskMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffcc,
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Left tusk
        const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        leftTusk.position.set(-0.15, -0.25, 0.45);
        leftTusk.rotation.set(Math.PI / 4, 0, 0);
        head.add(leftTusk);
        
        // Right tusk
        const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        rightTusk.position.set(0.15, -0.25, 0.45);
        rightTusk.rotation.set(Math.PI / 4, 0, 0);
        head.add(rightTusk);
    }
    
    /**
     * Create a club weapon for the troll
     */
    createClub() {
        // Create club handle
        const handleGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x663300,
            roughness: 0.9,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(1.9, 1.1, 0.3);
        handle.rotation.set(Math.PI / 6, 0, Math.PI / 6);
        handle.castShadow = true;
        
        this.modelGroup.add(handle);
        
        // Create club head
        const headGeometry = new THREE.DodecahedronGeometry(0.25, 0);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 1.0,
            metalness: 0.3
        });
        const clubHead = new THREE.Mesh(headGeometry, headMaterial);
        clubHead.position.set(2.2, 1.5, 0.5);
        clubHead.castShadow = true;
        
        this.modelGroup.add(clubHead);
        
        // Add spikes to club head
        const spikeCount = 5;
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.8,
            metalness: 0.5
        });
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position around club head
            const angle = (i / spikeCount) * Math.PI * 2;
            
            spike.position.set(
                2.2 + Math.sin(angle) * 0.25,
                1.5 + Math.cos(angle) * 0.25,
                0.5
            );
            
            // Orient spike to point outward
            spike.lookAt(new THREE.Vector3(
                2.2 + Math.sin(angle) * 0.5,
                1.5 + Math.cos(angle) * 0.5,
                0.5
            ));
            
            spike.castShadow = true;
            
            this.modelGroup.add(spike);
        }
    }
    
    updateAnimations(delta) {
        // Implement troll-specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // IMPORTANT: Do not modify this.modelGroup.position.y!
            // The Y position is managed by the Enemy class for proper terrain positioning.
            // Instead, apply vertical movement to individual children or use rotations.
            
            // Apply slow breathing motion to the torso instead of the whole model
            const torso = this.modelGroup.children[0]; // Torso is first child
            if (torso && torso.userData.originalY === undefined) {
                torso.userData.originalY = torso.position.y;
            }
            if (torso) {
                torso.position.y = torso.userData.originalY + Math.sin(time * 0.5) * 0.05;
            }
            
            // Slight swaying (only X and Z rotation, Y rotation handled by Enemy class)
            this.modelGroup.rotation.x = Math.sin(time * 0.3) * 0.02;
            this.modelGroup.rotation.z = Math.cos(time * 0.4) * 0.03;
            
            // Animate club
            const clubHandle = this.modelGroup.children[10]; // Club handle
            const clubHead = this.modelGroup.children[11]; // Club head
            
            if (clubHandle && clubHead) {
                // Swing the club slightly
                const swingAngle = Math.sin(time * 0.7) * 0.1;
                clubHandle.rotation.z = Math.PI / 6 + swingAngle;
                
                // Update club head position to follow handle
                clubHead.position.x = 2.2 + Math.sin(swingAngle) * 0.2;
                clubHead.position.y = 1.5 + Math.cos(swingAngle) * 0.2;
                
                // Update spikes positions
                for (let i = 0; i < 5; i++) {
                    const spike = this.modelGroup.children[12 + i]; // Spikes start at index 12
                    if (spike) {
                        const angle = (i / 5) * Math.PI * 2;
                        
                        spike.position.set(
                            clubHead.position.x + Math.sin(angle) * 0.25,
                            clubHead.position.y + Math.cos(angle) * 0.25,
                            0.5
                        );
                        
                        // Keep spikes oriented outward
                        spike.lookAt(new THREE.Vector3(
                            clubHead.position.x + Math.sin(angle) * 0.5,
                            clubHead.position.y + Math.cos(angle) * 0.5,
                            0.5
                        ));
                    }
                }
            }
        }
    }
}