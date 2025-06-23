import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Corrupted Treant enemy type
 * Creates a tree-like creature with twisted branches and corrupted elements
 */
export class CorruptedTreantModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create trunk (cylinder)
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x553311,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        
        this.modelGroup.add(trunk);
        
        // Create corrupted areas on trunk
        this.addCorruptedAreas(trunk);
        
        // Create branches (arms)
        this.createBranches();
        
        // Create roots (legs)
        this.createRoots();
        
        // Create foliage (head)
        this.createFoliage();
        
        // Create glowing eyes
        this.createEyes();
    }
    
    /**
     * Add corrupted areas to the trunk
     */
    addCorruptedAreas(trunk) {
        // Add corrupted patches to the trunk
        const corruptionGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const corruptionMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x660066,
            emissive: 0x330033,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Add several corruption patches
        const patchCount = 5;
        for (let i = 0; i < patchCount; i++) {
            const patch = new THREE.Mesh(corruptionGeometry, corruptionMaterial);
            
            // Position around the trunk
            const angle = (i / patchCount) * Math.PI * 2;
            const height = -0.6 + i * 0.3;
            
            patch.position.set(
                Math.sin(angle) * 0.4,
                height,
                Math.cos(angle) * 0.4
            );
            
            patch.scale.set(1, 0.5, 0.5);
            
            trunk.add(patch);
        }
    }
    
    /**
     * Create branches (arms) for the treant
     */
    createBranches() {
        // Create left branch
        const leftBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.2, 0),
            new THREE.Vector3(-0.5, 1.3, 0),
            new THREE.Vector3(-0.8, 1.0, 0),
            new THREE.Vector3(-1.2, 0.8, 0.3)
        );
        
        const leftBranchGeometry = new THREE.TubeGeometry(leftBranchCurve, 20, 0.15, 8, false);
        const branchMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x553311,
            roughness: 0.9,
            metalness: 0.1
        });
        const leftBranch = new THREE.Mesh(leftBranchGeometry, branchMaterial);
        leftBranch.castShadow = true;
        
        this.modelGroup.add(leftBranch);
        
        // Create right branch
        const rightBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.2, 0),
            new THREE.Vector3(0.5, 1.3, 0),
            new THREE.Vector3(0.8, 1.0, 0),
            new THREE.Vector3(1.2, 0.8, 0.3)
        );
        
        const rightBranchGeometry = new THREE.TubeGeometry(rightBranchCurve, 20, 0.15, 8, false);
        const rightBranch = new THREE.Mesh(rightBranchGeometry, branchMaterial);
        rightBranch.castShadow = true;
        
        this.modelGroup.add(rightBranch);
        
        // Add smaller branches/twigs
        this.addTwigs(leftBranch, new THREE.Vector3(-1.2, 0.8, 0.3));
        this.addTwigs(rightBranch, new THREE.Vector3(1.2, 0.8, 0.3));
    }
    
    /**
     * Add smaller twigs to branches
     */
    addTwigs(parentBranch, startPosition) {
        const twigCount = 3;
        const twigMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x553311,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < twigCount; i++) {
            const angle = (i / twigCount) * Math.PI;
            const length = 0.3 + Math.random() * 0.3;
            
            const endPosition = new THREE.Vector3(
                startPosition.x + Math.sin(angle) * length,
                startPosition.y + Math.cos(angle) * length * 0.5,
                startPosition.z + Math.cos(angle + Math.PI/4) * length * 0.5
            );
            
            const twigCurve = new THREE.LineCurve3(startPosition, endPosition);
            const twigGeometry = new THREE.TubeGeometry(twigCurve, 5, 0.05, 8, false);
            const twig = new THREE.Mesh(twigGeometry, twigMaterial);
            twig.castShadow = true;
            
            this.modelGroup.add(twig);
        }
    }
    
    /**
     * Create roots (legs) for the treant
     */
    createRoots() {
        const rootCount = 4;
        const rootMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x553311,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < rootCount; i++) {
            const angle = (i / rootCount) * Math.PI * 2;
            
            const rootCurve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.sin(angle) * 0.3, -0.2, Math.cos(angle) * 0.3),
                new THREE.Vector3(Math.sin(angle) * 0.6, -0.3, Math.cos(angle) * 0.6),
                new THREE.Vector3(Math.sin(angle) * 0.8, 0, Math.cos(angle) * 0.8)
            );
            
            const rootGeometry = new THREE.TubeGeometry(rootCurve, 10, 0.1, 8, false);
            const root = new THREE.Mesh(rootGeometry, rootMaterial);
            root.castShadow = true;
            
            this.modelGroup.add(root);
        }
    }
    
    /**
     * Create foliage (head) for the treant
     */
    createFoliage() {
        // Create main foliage
        const foliageGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x225522,
            roughness: 0.8,
            metalness: 0.1
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2.0;
        foliage.castShadow = true;
        
        this.modelGroup.add(foliage);
        
        // Add corrupted areas to foliage
        const corruptionGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const corruptionMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x660066,
            emissive: 0x330033,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Add several corruption patches
        const patchCount = 4;
        for (let i = 0; i < patchCount; i++) {
            const patch = new THREE.Mesh(corruptionGeometry, corruptionMaterial);
            
            // Position around the foliage
            const phi = Math.acos(-1 + (2 * i) / patchCount);
            const theta = Math.sqrt(patchCount * Math.PI) * phi;
            
            patch.position.set(
                0.6 * Math.sin(phi) * Math.cos(theta),
                0.6 * Math.cos(phi) + 2.0,
                0.6 * Math.sin(phi) * Math.sin(theta)
            );
            
            patch.scale.set(0.7, 0.7, 0.7);
            
            this.modelGroup.add(patch);
        }
    }
    
    /**
     * Create glowing eyes for the treant
     */
    createEyes() {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 2.0, 0.5);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 2.0, 0.5);
        
        this.modelGroup.add(rightEye);
    }
    
    updateAnimations(delta) {
        // Implement treant-specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Slow swaying motion like a tree in the wind
            this.modelGroup.rotation.x = Math.sin(time * 0.3) * 0.05;
            this.modelGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
            
            // Pulse the corrupted areas
            const children = this.modelGroup.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                
                // Check if this is a corruption patch (purple material)
                if (child.material && child.material.color && 
                    child.material.color.r > 0.3 && child.material.color.g < 0.3 && child.material.color.b > 0.3) {
                    
                    // Pulse the emissive intensity
                    child.material.emissiveIntensity = 0.3 + Math.sin(time * 2.0 + i) * 0.2;
                    
                    // Slightly scale the patch
                    const scale = 1.0 + Math.sin(time * 3.0 + i * 0.5) * 0.1;
                    child.scale.set(scale, scale * 0.5, scale * 0.5);
                }
            }
        }
    }
}