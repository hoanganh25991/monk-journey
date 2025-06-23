import * as THREE from 'three';
import { SkeletonModel } from './SkeletonModel.js';

/**
 * Model for Skeleton Archer enemy type
 * Extends the base SkeletonModel with a bow
 */
export class SkeletonArcherModel extends SkeletonModel {
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    createModel() {
        // Call the parent class's createModel to create the basic skeleton
        super.createModel();
        
        // Add a bow
        this.createBow();
    }
    
    /**
     * Create a bow for the skeleton archer
     */
    createBow() {
        // Create bow (curved cylinder)
        const bowCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, -0.4, 0),
            new THREE.Vector3(0.2, 0, 0),
            new THREE.Vector3(0.2, 0, 0),
            new THREE.Vector3(0, 0.4, 0)
        );
        
        const bowGeometry = new THREE.TubeGeometry(bowCurve, 20, 0.03, 8, false);
        const bowMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for bow
        const bow = new THREE.Mesh(bowGeometry, bowMaterial);
        bow.position.set(-0.5, 0.6, 0.1);
        bow.castShadow = true;
        
        this.modelGroup.add(bow);
        
        // Create bowstring (line)
        const stringGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.4, 0),
            new THREE.Vector3(-0.05, 0, 0),
            new THREE.Vector3(0, 0.4, 0)
        ]);
        const stringMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
        const bowstring = new THREE.Line(stringGeometry, stringMaterial);
        bowstring.position.set(-0.5, 0.6, 0.1);
        
        this.modelGroup.add(bowstring);
        
        // Create arrow
        const arrowShaftGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8);
        const arrowShaftMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const arrowShaft = new THREE.Mesh(arrowShaftGeometry, arrowShaftMaterial);
        arrowShaft.rotation.z = Math.PI / 2;
        arrowShaft.position.set(-0.3, 0.6, 0.1);
        arrowShaft.castShadow = true;
        
        this.modelGroup.add(arrowShaft);
        
        // Create arrowhead
        const arrowheadGeometry = new THREE.ConeGeometry(0.03, 0.1, 8);
        const arrowheadMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const arrowhead = new THREE.Mesh(arrowheadGeometry, arrowheadMaterial);
        arrowhead.rotation.z = Math.PI / 2;
        arrowhead.position.set(-0.05, 0.6, 0.1);
        arrowhead.castShadow = true;
        
        this.modelGroup.add(arrowhead);
    }
    
    updateAnimations(delta) {
        // Call the base class animations
        super.updateAnimations(delta);
        
        // Implement skeleton archer specific animations
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Get references to important parts
            const leftArm = this.modelGroup.children[2]; // Left arm is the third child
            const bow = this.modelGroup.children[8]; // Bow is the 9th child
            const bowstring = this.modelGroup.children[9]; // Bowstring is the 10th child
            const arrowShaft = this.modelGroup.children[10]; // Arrow shaft is the 11th child
            const arrowhead = this.modelGroup.children[11]; // Arrowhead is the 12th child
            
            // Normal aiming animation
            if (leftArm) {
                leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 0.5) * 0.1;
            }
            
            // Attack animation - draw bow and fire arrow
            if (this.enemy.state.isAttacking) {
                // Make the left arm pull back the bow
                if (leftArm) {
                    // More dramatic drawing motion during attack
                    leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 8.0) * 0.3;
                    leftArm.rotation.y = Math.sin(time * 8.0) * 0.2;
                }
                
                // Animate the bow bending more during attack
                if (bow) {
                    // Make the bow bend more during attack
                    bow.scale.x = 1.0 + Math.sin(time * 8.0) * 0.2;
                }
                
                // Animate the bowstring being pulled
                if (bowstring && bowstring.geometry) {
                    // Create a new geometry for the bowstring that changes shape
                    const stringPull = Math.abs(Math.sin(time * 8.0)) * 0.15;
                    const newStringGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(0, -0.4, 0),
                        new THREE.Vector3(-0.05 - stringPull, 0, 0),
                        new THREE.Vector3(0, 0.4, 0)
                    ]);
                    
                    bowstring.geometry.dispose();
                    bowstring.geometry = newStringGeometry;
                }
                
                // Animate the arrow being drawn and released
                if (arrowShaft && arrowhead) {
                    // Calculate arrow position based on draw cycle
                    const arrowCycle = (time * 8.0) % (2 * Math.PI);
                    
                    // Draw phase (first half of cycle)
                    if (arrowCycle < Math.PI) {
                        // Arrow is being drawn back
                        const drawAmount = Math.sin(arrowCycle) * 0.15;
                        
                        // Move arrow back with the string
                        arrowShaft.position.x = -0.3 - drawAmount;
                        arrowhead.position.x = -0.05 - drawAmount;
                    } else {
                        // Release phase (second half of cycle)
                        // Arrow is flying forward
                        const releaseProgress = (arrowCycle - Math.PI) / Math.PI; // 0 to 1
                        const releaseDistance = releaseProgress * 2.0; // How far the arrow has traveled
                        
                        // Move arrow forward rapidly
                        arrowShaft.position.x = -0.3 + releaseDistance;
                        arrowhead.position.x = -0.05 + releaseDistance;
                        
                        // Make arrow slightly transparent as it "flies away"
                        const fadeOut = 1.0 - releaseProgress;
                        if (arrowShaft.material) {
                            arrowShaft.material.opacity = fadeOut;
                            arrowShaft.material.transparent = true;
                        }
                        if (arrowhead.material) {
                            arrowhead.material.opacity = fadeOut;
                            arrowhead.material.transparent = true;
                        }
                        
                        // Reset arrow position at the end of the cycle
                        if (releaseProgress > 0.9) {
                            // Prepare for next cycle by resetting arrow
                            arrowShaft.position.x = -0.3;
                            arrowhead.position.x = -0.05;
                            
                            // Reset opacity
                            if (arrowShaft.material) {
                                arrowShaft.material.opacity = 1.0;
                            }
                            if (arrowhead.material) {
                                arrowhead.material.opacity = 1.0;
                            }
                        }
                    }
                }
            } else {
                // Reset bowstring and arrow when not attacking
                if (bowstring && bowstring.geometry) {
                    const defaultStringGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(0, -0.4, 0),
                        new THREE.Vector3(-0.05, 0, 0),
                        new THREE.Vector3(0, 0.4, 0)
                    ]);
                    
                    bowstring.geometry.dispose();
                    bowstring.geometry = defaultStringGeometry;
                }
                
                // Reset arrow position
                if (arrowShaft && arrowhead) {
                    arrowShaft.position.x = -0.3;
                    arrowhead.position.x = -0.05;
                    
                    // Reset opacity
                    if (arrowShaft.material) {
                        arrowShaft.material.opacity = 1.0;
                        arrowShaft.material.transparent = false;
                    }
                    if (arrowhead.material) {
                        arrowhead.material.opacity = 1.0;
                        arrowhead.material.transparent = false;
                    }
                }
            }
        }
    }
}