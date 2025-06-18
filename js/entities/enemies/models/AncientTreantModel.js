import * as THREE from 'three';
import { EnemyModel } from './EnemyModel.js';

/**
 * Model for Ancient Treant enemy type
 * Creates a massive, ancient tree-like creature with intricate branches and mystical elements
 */
export class AncientTreantModel extends EnemyModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create trunk (cylinder) - larger than regular treant
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 2.2, 12);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817, // Darker, more aged wood color
            roughness: 1.0,
            metalness: 0.05,
            bumpScale: 0.2
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        
        this.modelGroup.add(trunk);
        
        // Create bark texture (cracks and crevices)
        this.addBarkTexture(trunk);
        
        // Create mystical runes on trunk
        this.addAncientRunes(trunk);
        
        // Create branches (arms) - more elaborate than regular treant
        this.createBranches();
        
        // Create roots (legs) - deeper and more spread out
        this.createRoots();
        
        // Create foliage (head) - more majestic crown
        this.createFoliage();
        
        // Create glowing eyes
        this.createEyes();
    }
    
    /**
     * Add bark texture to the trunk
     */
    addBarkTexture(trunk) {
        // Add bark cracks and crevices to the trunk
        const crackGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
        const crackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1A0D00, // Very dark brown
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add several cracks
        const crackCount = 12;
        for (let i = 0; i < crackCount; i++) {
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // Position around the trunk
            const angle = (i / crackCount) * Math.PI * 2;
            const height = -0.8 + i * 0.15;
            
            crack.position.set(
                Math.sin(angle) * 0.48,
                height,
                Math.cos(angle) * 0.48
            );
            
            // Rotate to follow trunk curvature
            crack.rotation.y = angle + Math.PI/2;
            
            // Randomize size slightly
            const scaleVar = 0.7 + Math.random() * 0.6;
            crack.scale.set(scaleVar, 0.8 + Math.random() * 0.4, 1);
            
            trunk.add(crack);
        }
    }
    
    /**
     * Add ancient magical runes to the trunk
     */
    addAncientRunes(trunk) {
        // Add glowing runes to the trunk
        const runeGeometry = new THREE.CircleGeometry(0.08, 8);
        const runeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88FF88, // Soft green glow
            emissive: 0x44AA44,
            emissiveIntensity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Add several runes in patterns
        const runeCount = 7;
        for (let i = 0; i < runeCount; i++) {
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position around the trunk in a spiral pattern
            const angle = (i / runeCount) * Math.PI * 4;
            const height = -0.9 + i * 0.3;
            
            rune.position.set(
                Math.sin(angle) * 0.5,
                height,
                Math.cos(angle) * 0.5
            );
            
            // Rotate to face outward
            rune.rotation.y = angle + Math.PI/2;
            rune.rotation.x = Math.PI/6;
            
            trunk.add(rune);
        }
    }
    
    /**
     * Create branches (arms) for the ancient treant
     */
    createBranches() {
        // Create more complex branch structure
        this.createMainBranches();
        this.createSecondaryBranches();
    }
    
    /**
     * Create main branches
     */
    createMainBranches() {
        // Create left branch
        const leftBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.5, 0),
            new THREE.Vector3(-0.7, 1.7, 0),
            new THREE.Vector3(-1.0, 1.2, 0),
            new THREE.Vector3(-1.5, 1.0, 0.3)
        );
        
        const leftBranchGeometry = new THREE.TubeGeometry(leftBranchCurve, 20, 0.2, 8, false);
        const branchMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817, // Match trunk color
            roughness: 1.0,
            metalness: 0.05
        });
        const leftBranch = new THREE.Mesh(leftBranchGeometry, branchMaterial);
        leftBranch.castShadow = true;
        
        this.modelGroup.add(leftBranch);
        
        // Create right branch
        const rightBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.5, 0),
            new THREE.Vector3(0.7, 1.7, 0),
            new THREE.Vector3(1.0, 1.2, 0),
            new THREE.Vector3(1.5, 1.0, 0.3)
        );
        
        const rightBranchGeometry = new THREE.TubeGeometry(rightBranchCurve, 20, 0.2, 8, false);
        const rightBranch = new THREE.Mesh(rightBranchGeometry, branchMaterial);
        rightBranch.castShadow = true;
        
        this.modelGroup.add(rightBranch);
        
        // Add smaller branches/twigs
        this.addTwigs(leftBranch, new THREE.Vector3(-1.5, 1.0, 0.3));
        this.addTwigs(rightBranch, new THREE.Vector3(1.5, 1.0, 0.3));
    }
    
    /**
     * Create secondary branches
     */
    createSecondaryBranches() {
        // Create additional branches for a more complex appearance
        const branchMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817,
            roughness: 1.0,
            metalness: 0.05
        });
        
        // Back branch
        const backBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.3, 0),
            new THREE.Vector3(0, 1.5, -0.5),
            new THREE.Vector3(0, 1.2, -0.8),
            new THREE.Vector3(0, 0.9, -1.2)
        );
        
        const backBranchGeometry = new THREE.TubeGeometry(backBranchCurve, 20, 0.18, 8, false);
        const backBranch = new THREE.Mesh(backBranchGeometry, branchMaterial);
        backBranch.castShadow = true;
        
        this.modelGroup.add(backBranch);
        
        // Front branch
        const frontBranchCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 1.3, 0),
            new THREE.Vector3(0, 1.5, 0.5),
            new THREE.Vector3(0, 1.2, 0.8),
            new THREE.Vector3(0, 0.9, 1.2)
        );
        
        const frontBranchGeometry = new THREE.TubeGeometry(frontBranchCurve, 20, 0.18, 8, false);
        const frontBranch = new THREE.Mesh(frontBranchGeometry, branchMaterial);
        frontBranch.castShadow = true;
        
        this.modelGroup.add(frontBranch);
        
        // Add twigs to these branches too
        this.addTwigs(backBranch, new THREE.Vector3(0, 0.9, -1.2));
        this.addTwigs(frontBranch, new THREE.Vector3(0, 0.9, 1.2));
    }
    
    /**
     * Add smaller twigs to branches
     */
    addTwigs(parentBranch, startPosition) {
        const twigCount = 5; // More twigs than regular treant
        const twigMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817,
            roughness: 1.0,
            metalness: 0.05
        });
        
        for (let i = 0; i < twigCount; i++) {
            const angle = (i / twigCount) * Math.PI * 2; // Full 360 degrees
            const length = 0.4 + Math.random() * 0.4;
            
            const endPosition = new THREE.Vector3(
                startPosition.x + Math.sin(angle) * length,
                startPosition.y + Math.cos(angle) * length * 0.5,
                startPosition.z + Math.cos(angle + Math.PI/4) * length * 0.5
            );
            
            const twigCurve = new THREE.LineCurve3(startPosition, endPosition);
            const twigGeometry = new THREE.TubeGeometry(twigCurve, 5, 0.06, 8, false);
            const twig = new THREE.Mesh(twigGeometry, twigMaterial);
            twig.castShadow = true;
            
            this.modelGroup.add(twig);
            
            // Add leaf clusters to the end of some twigs
            if (Math.random() > 0.5) {
                this.addLeafCluster(endPosition);
            }
        }
    }
    
    /**
     * Add a small cluster of leaves at the given position
     */
    addLeafCluster(position) {
        const leafGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x225522,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const leafCluster = new THREE.Mesh(leafGeometry, leafMaterial);
        leafCluster.position.copy(position);
        leafCluster.scale.set(1, 0.5, 1);
        leafCluster.castShadow = true;
        
        this.modelGroup.add(leafCluster);
    }
    
    /**
     * Create roots (legs) for the ancient treant
     */
    createRoots() {
        const rootCount = 6; // More roots than regular treant
        const rootMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817,
            roughness: 1.0,
            metalness: 0.05
        });
        
        for (let i = 0; i < rootCount; i++) {
            const angle = (i / rootCount) * Math.PI * 2;
            
            const rootCurve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.sin(angle) * 0.4, -0.3, Math.cos(angle) * 0.4),
                new THREE.Vector3(Math.sin(angle) * 0.8, -0.4, Math.cos(angle) * 0.8),
                new THREE.Vector3(Math.sin(angle) * 1.2, 0, Math.cos(angle) * 1.2)
            );
            
            const rootGeometry = new THREE.TubeGeometry(rootCurve, 12, 0.12, 8, false);
            const root = new THREE.Mesh(rootGeometry, rootMaterial);
            root.castShadow = true;
            
            this.modelGroup.add(root);
            
            // Add smaller root offshoots
            this.addRootOffshoots(root, new THREE.Vector3(Math.sin(angle) * 1.2, 0, Math.cos(angle) * 1.2));
        }
    }
    
    /**
     * Add smaller offshoots to the main roots
     */
    addRootOffshoots(parentRoot, startPosition) {
        const offshootCount = 3;
        const rootMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817,
            roughness: 1.0,
            metalness: 0.05
        });
        
        for (let i = 0; i < offshootCount; i++) {
            const angle = (i / offshootCount) * Math.PI;
            const length = 0.3 + Math.random() * 0.2;
            
            const endPosition = new THREE.Vector3(
                startPosition.x + Math.sin(angle) * length,
                startPosition.y - 0.1,
                startPosition.z + Math.cos(angle) * length
            );
            
            const offshootCurve = new THREE.LineCurve3(startPosition, endPosition);
            const offshootGeometry = new THREE.TubeGeometry(offshootCurve, 5, 0.05, 8, false);
            const offshoot = new THREE.Mesh(offshootGeometry, rootMaterial);
            offshoot.castShadow = true;
            
            this.modelGroup.add(offshoot);
        }
    }
    
    /**
     * Create foliage (head) for the ancient treant
     */
    createFoliage() {
        // Create main foliage - larger and more elaborate than regular treant
        const foliageGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x336633, // Deeper green
            roughness: 0.8,
            metalness: 0.1
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2.4;
        foliage.castShadow = true;
        
        this.modelGroup.add(foliage);
        
        // Add glowing areas to foliage
        const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88FF88,
            emissive: 0x44AA44,
            emissiveIntensity: 0.7,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Add several glowing patches
        const patchCount = 6;
        for (let i = 0; i < patchCount; i++) {
            const patch = new THREE.Mesh(glowGeometry, glowMaterial);
            
            // Position around the foliage
            const phi = Math.acos(-1 + (2 * i) / patchCount);
            const theta = Math.sqrt(patchCount * Math.PI) * phi;
            
            patch.position.set(
                0.8 * Math.sin(phi) * Math.cos(theta),
                0.8 * Math.cos(phi) + 2.4,
                0.8 * Math.sin(phi) * Math.sin(theta)
            );
            
            patch.scale.set(0.7, 0.7, 0.7);
            
            this.modelGroup.add(patch);
        }
        
        // Add some smaller leaf clusters around the main foliage
        this.addFoliageDetail();
    }
    
    /**
     * Add detailed leaf clusters around the main foliage
     */
    addFoliageDetail() {
        const detailCount = 8;
        const detailGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const detailMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x336633,
            roughness: 0.8,
            metalness: 0.1
        });
        
        for (let i = 0; i < detailCount; i++) {
            const detail = new THREE.Mesh(detailGeometry, detailMaterial);
            
            // Position around the main foliage
            const angle = (i / detailCount) * Math.PI * 2;
            const radius = 0.9;
            const height = 2.4 + (Math.random() * 0.4 - 0.2);
            
            detail.position.set(
                Math.sin(angle) * radius,
                height,
                Math.cos(angle) * radius
            );
            
            // Randomize scale
            const scale = 0.8 + Math.random() * 0.4;
            detail.scale.set(scale, scale, scale);
            
            this.modelGroup.add(detail);
        }
    }
    
    /**
     * Create glowing eyes for the ancient treant
     */
    createEyes() {
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88FF88, // Green eyes instead of red
            emissive: 0x44AA44,
            emissiveIntensity: 1.0
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 2.4, 0.6);
        
        this.modelGroup.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 2.4, 0.6);
        
        this.modelGroup.add(rightEye);
    }
    
    updateAnimations(delta) {
        // Implement ancient treant-specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Slower, more majestic swaying motion
            this.modelGroup.rotation.x = Math.sin(time * 0.2) * 0.04;
            this.modelGroup.rotation.z = Math.sin(time * 0.3) * 0.04;
            
            // Pulse the glowing areas
            const children = this.modelGroup.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                
                // Check if this is a glowing element (green material)
                if (child.material && child.material.emissive && 
                    child.material.emissive.g > 0.4 && child.material.emissive.r < 0.5) {
                    
                    // Pulse the emissive intensity
                    child.material.emissiveIntensity = 0.7 + Math.sin(time * 1.5 + i * 0.2) * 0.3;
                }
            }
        }
    }
}