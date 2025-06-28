/**
 * PlayerAttackEffect.js
 * Handles the player's attack effects and animations
 */

import * as THREE from 'three';
import GeometryFactory from '../../utils/GeometryFactory.js';

export class PlayerAttackEffect {
    constructor(scene) {
        this.scene = scene;
    }

    // Left jab - quick straight punch with left hand
    createLeftPunchAnimation(modelGroup, animations, currentAnimation, playAnimation) {
        // Try to play a left punch animation from the model
        if (animations && Object.keys(animations).length > 0) {
            // Try to play a left punch animation from the model
            const animationNames = ['leftPunch', 'leftJab', 'punchLeft', 'jabLeft', 'punch_left', 'jab_left'];
            
            // Try each animation name
            for (const animName of animationNames) {
                if (playAnimation(animName, null, 0.1)) {
                    // Create punch effect - blue color for left hand
                    this.createPunchEffect(modelGroup, 'left', 0x4169e1); // Royal blue
                    return true;
                }
            }
            
            // If no specific left punch animation found, try generic punch
            if (playAnimation('punch', 'attack', 0.1)) {
                // Create punch effect - blue color for left hand
                this.createPunchEffect(modelGroup, 'left', 0x4169e1); // Royal blue
                return true;
            }
        }
        
        return false;
    }
    
    // Right cross - powerful straight punch with right hand
    createRightPunchAnimation(modelGroup, animations, currentAnimation, playAnimation) {
        if (animations && Object.keys(animations).length > 0) {
            // Try to play a right punch animation from the model
            const animationNames = ['rightPunch', 'rightCross', 'punchRight', 'crossRight', 'punch_right', 'cross_right'];
            
            // Try each animation name
            for (const animName of animationNames) {
                if (playAnimation(animName, null, 0.1)) {
                    // Create punch effect - red color for right hand
                    this.createPunchEffect(modelGroup, 'right', 0xff4500); // OrangeRed
                    return true;
                }
            }
            
            // If no specific right punch animation found, try generic punch
            if (playAnimation('punch', 'attack', 0.1)) {
                // Create punch effect - red color for right hand
                this.createPunchEffect(modelGroup, 'right', 0xff4500); // OrangeRed
                return true;
            }
        }
        
        return false;
    }
    
    // Left hook - circular punch with left hand
    createLeftHookAnimation(modelGroup, animations, currentAnimation, playAnimation) {
        if (animations && Object.keys(animations).length > 0) {
            // Try to play a left hook animation from the model
            const animationNames = ['leftHook', 'hookLeft', 'hook_left'];
            
            // Try each animation name
            for (const animName of animationNames) {
                if (playAnimation(animName, null, 0.1)) {
                    // Create punch effect - purple color for hook
                    this.createPunchEffect(modelGroup, 'left-hook', 0x9932cc); // DarkOrchid
                    return true;
                }
            }
            
            // If no specific left hook animation found, try generic hook or punch
            if (playAnimation('hook', 'punch', 0.1)) {
                // Create punch effect - purple color for hook
                this.createPunchEffect(modelGroup, 'left-hook', 0x9932cc); // DarkOrchid
                return true;
            }
        }
        
        return false;
    }
    
    // Heavy uppercut - powerful upward punch with right hand
    createHeavyPunchAnimation(modelGroup, animations, currentAnimation, playAnimation) {
        if (animations && Object.keys(animations).length > 0) {
            // Try to play an uppercut animation from the model
            const animationNames = ['uppercut', 'heavyPunch', 'heavy_punch', 'heavy_attack'];
            
            // Try each animation name
            for (const animName of animationNames) {
                if (playAnimation(animName, null, 0.1)) {
                    // Create heavy punch effect
                    this.createHeavyPunchEffect(modelGroup);
                    return true;
                }
            }
            
            // If no specific uppercut animation found, try generic strong attack
            if (playAnimation('strong_attack', 'heavy_attack', 0.1)) {
                // Create heavy punch effect
                this.createHeavyPunchEffect(modelGroup);
                return true;
            }
        }
        
        return false;
    }
    
    // Standard punch effect for normal punches
    createPunchEffect(modelGroup, hand, color) {
        // Calculate position in front of the player based on hand
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(modelGroup.rotation);
        let sideOffset = 0;
        
        // Adjust position based on which hand is punching
        if (hand === 'left') {
            sideOffset = -0.3;
        } else if (hand === 'right') {
            sideOffset = 0.3;
        } else if (hand === 'left-hook') {
            sideOffset = -0.4;
            // Adjust direction for hook punch
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8);
        }
        
        // Calculate final punch position
        const punchPosition = new THREE.Vector3(
            modelGroup.position.x + direction.x * 1.2 + (direction.z * sideOffset),
            modelGroup.position.y + 0.6, // At arm height
            modelGroup.position.z + direction.z * 1.2 - (direction.x * sideOffset)
        );
        
        // Create main punch effect (sphere)
        const punchGeometry = GeometryFactory.createSphereGeometry(0.3, 12, 12);
        const punchMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const punchMesh = new THREE.Mesh(punchGeometry, punchMaterial);
        punchMesh.position.copy(punchPosition);
        
        // Add to scene
        this.scene.add(punchMesh);
        
        // Create secondary effect (ring)
        const ringGeometry = new THREE.RingGeometry(0.2, 0.4, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff, // White color
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.copy(punchPosition);
        ringMesh.lookAt(modelGroup.position); // Orient ring to face player
        
        // Add ring to scene
        this.scene.add(ringMesh);
        
        // Create impact lines (small cylinders radiating outward)
        const impactLines = [];
        const numLines = 8;
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const lineDirection = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).applyEuler(new THREE.Euler(0, modelGroup.rotation.y, 0));
            
            const lineGeometry = GeometryFactory.createCylinderGeometry(0.03, 0.03, 0.4, 4);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7
            });
            
            const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
            
            // Position and rotate line
            lineMesh.position.copy(punchPosition);
            lineMesh.position.add(lineDirection.multiplyScalar(0.3));
            
            // Rotate to point outward
            lineMesh.lookAt(punchPosition.clone().add(lineDirection));
            lineMesh.rotateX(Math.PI / 2);
            
            // Add to scene and store reference
            this.scene.add(lineMesh);
            impactLines.push({
                mesh: lineMesh,
                direction: lineDirection.normalize(),
                geometry: lineGeometry,
                material: lineMaterial
            });
        }
        
        // Animate the punch effect
        let mainScale = 1.0;
        let mainOpacity = 0.8;
        let ringScale = 1.0;
        let ringOpacity = 0.6;
        
        const animatePunch = () => {
            // Update main punch effect
            mainScale += 0.15;
            mainOpacity -= 0.06;
            punchMesh.scale.set(mainScale, mainScale, mainScale);
            punchMaterial.opacity = mainOpacity;
            
            // Update ring effect
            ringScale += 0.2;
            ringOpacity -= 0.05;
            ringMesh.scale.set(ringScale, ringScale, ringScale);
            ringMaterial.opacity = ringOpacity;
            
            // Update impact lines
            impactLines.forEach(line => {
                // Move line outward
                line.mesh.position.add(line.direction.clone().multiplyScalar(0.1));
                
                // Fade out
                line.material.opacity -= 0.05;
            });
            
            // Continue animation until main effect is nearly invisible
            if (mainOpacity > 0) {
                requestAnimationFrame(animatePunch);
            } else {
                // Remove all effects from scene
                this.scene.remove(punchMesh);
                this.scene.remove(ringMesh);
                impactLines.forEach(line => this.scene.remove(line.mesh));
                
                // Dispose geometries and materials
                punchGeometry.dispose();
                punchMaterial.dispose();
                ringGeometry.dispose();
                ringMaterial.dispose();
                impactLines.forEach(line => {
                    line.geometry.dispose();
                    line.material.dispose();
                });
            }
        };
        
        // Start animation
        animatePunch();
    }
    
    // Special effect for the heavy uppercut (combo finisher)
    createHeavyPunchEffect(modelGroup) {
        // Calculate position in front of the player
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(modelGroup.rotation);
        const punchPosition = new THREE.Vector3(
            modelGroup.position.x + direction.x * 1.3 + (direction.z * 0.3),
            modelGroup.position.y + 0.8, // Slightly higher for uppercut
            modelGroup.position.z + direction.z * 1.3 - (direction.x * 0.3)
        );
        
        // Create main punch effect (larger sphere)
        const punchGeometry = GeometryFactory.createSphereGeometry(0.4, 16, 16);
        const punchMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300, // Fiery orange-red
            transparent: true,
            opacity: 0.9
        });
        
        const punchMesh = new THREE.Mesh(punchGeometry, punchMaterial);
        punchMesh.position.copy(punchPosition);
        
        // Add to scene
        this.scene.add(punchMesh);
        
        // Create shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.3, 0.6, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff7700, // Orange
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.copy(punchPosition);
        ringMesh.lookAt(modelGroup.position); // Orient ring to face player
        
        // Add ring to scene
        this.scene.add(ringMesh);
        
        // Create secondary smaller rings
        const smallRings = [];
        for (let i = 0; i < 3; i++) {
            const smallRingGeometry = new THREE.RingGeometry(0.1 + (i * 0.1), 0.2 + (i * 0.1), 16);
            const smallRingMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xffff00 : (i === 1 ? 0xff9900 : 0xff3300), // Yellow to orange to red
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const smallRingMesh = new THREE.Mesh(smallRingGeometry, smallRingMaterial);
            smallRingMesh.position.copy(punchPosition);
            smallRingMesh.lookAt(modelGroup.position);
            
            // Add to scene and store reference
            this.scene.add(smallRingMesh);
            smallRings.push({
                mesh: smallRingMesh,
                geometry: smallRingGeometry,
                material: smallRingMaterial,
                initialScale: 1.0 + (i * 0.3)
            });
        }
        
        // Create fire particles
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            // Random direction with upward bias
            const angle = Math.random() * Math.PI * 2;
            const particleDirection = new THREE.Vector3(
                Math.cos(angle) * 0.7,
                0.5 + Math.random() * 0.5, // Upward bias
                Math.sin(angle) * 0.7
            ).normalize();
            
            // Create particle
            const size = 0.05 + Math.random() * 0.15;
            const particleGeometry = GeometryFactory.createSphereGeometry(size, 8, 8);
            
            // Random color from yellow to red
            const colorValue = Math.random();
            let particleColor;
            if (colorValue < 0.3) {
                particleColor = 0xffff00; // Yellow
            } else if (colorValue < 0.6) {
                particleColor = 0xff9900; // Orange
            } else {
                particleColor = 0xff3300; // Red
            }
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position at punch point
            particle.position.copy(punchPosition);
            
            // Add to scene and store reference
            this.scene.add(particle);
            particles.push({
                mesh: particle,
                direction: particleDirection,
                speed: 0.05 + Math.random() * 0.15,
                geometry: particleGeometry,
                material: particleMaterial,
                gravity: 0.003 + Math.random() * 0.002
            });
        }
        
        // Create impact lines (thicker for heavy punch)
        const impactLines = [];
        const numLines = 12;
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const lineDirection = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).applyEuler(new THREE.Euler(0, modelGroup.rotation.y, 0));
            
            const lineGeometry = GeometryFactory.createCylinderGeometry(0.04, 0.04, 0.6, 4);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: 0xff5500,
                transparent: true,
                opacity: 0.8
            });
            
            const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
            
            // Position and rotate line
            lineMesh.position.copy(punchPosition);
            lineMesh.position.add(lineDirection.multiplyScalar(0.4));
            
            // Rotate to point outward
            lineMesh.lookAt(punchPosition.clone().add(lineDirection));
            lineMesh.rotateX(Math.PI / 2);
            
            // Add to scene and store reference
            this.scene.add(lineMesh);
            impactLines.push({
                mesh: lineMesh,
                direction: lineDirection.normalize(),
                geometry: lineGeometry,
                material: lineMaterial
            });
        }
        
        // Animate the heavy punch effect
        let mainScale = 1.0;
        let mainOpacity = 0.9;
        let ringScale = 1.0;
        let ringOpacity = 0.8;
        let time = 0;
        
        const animateHeavyPunch = () => {
            time += 0.05;
            
            // Update main punch effect
            mainScale += 0.2;
            mainOpacity -= 0.04;
            punchMesh.scale.set(mainScale, mainScale, mainScale);
            punchMaterial.opacity = mainOpacity;
            
            // Update main ring effect
            ringScale += 0.25;
            ringOpacity -= 0.04;
            ringMesh.scale.set(ringScale, ringScale, ringScale);
            ringMaterial.opacity = ringOpacity;
            
            // Update small rings with pulsing effect
            smallRings.forEach((ring, index) => {
                const pulseScale = ring.initialScale + Math.sin(time * 3 + index) * 0.2;
                ring.mesh.scale.set(pulseScale + (time * 0.2), pulseScale + (time * 0.2), pulseScale + (time * 0.2));
                ring.material.opacity = Math.max(0, 0.7 - (time * 0.1));
            });
            
            // Update particles
            particles.forEach(particle => {
                // Apply gravity (reduce y component)
                particle.direction.y -= particle.gravity;
                
                // Move particle
                particle.mesh.position.add(
                    particle.direction.clone().multiplyScalar(particle.speed)
                );
                
                // Fade out
                particle.material.opacity -= 0.02;
                
                // Shrink slightly
                particle.mesh.scale.multiplyScalar(0.97);
            });
            
            // Update impact lines
            impactLines.forEach(line => {
                // Move line outward faster
                line.mesh.position.add(line.direction.clone().multiplyScalar(0.15));
                
                // Fade out
                line.material.opacity -= 0.04;
            });
            
            // Continue animation until main effect is nearly invisible
            if (mainOpacity > 0) {
                requestAnimationFrame(animateHeavyPunch);
            } else {
                // Remove all effects from scene
                this.scene.remove(punchMesh);
                this.scene.remove(ringMesh);
                
                smallRings.forEach(ring => {
                    this.scene.remove(ring.mesh);
                    ring.geometry.dispose();
                    ring.material.dispose();
                });
                
                particles.forEach(particle => {
                    this.scene.remove(particle.mesh);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                
                impactLines.forEach(line => {
                    this.scene.remove(line.mesh);
                    line.geometry.dispose();
                    line.material.dispose();
                });
                
                // Dispose geometries and materials
                punchGeometry.dispose();
                punchMaterial.dispose();
                ringGeometry.dispose();
                ringMaterial.dispose();
            }
        };
        
        // Start animation
        animateHeavyPunch();
    }
    
    createAttackEffect(modelGroup, direction) {
        // Create a simple attack effect (a cone)
        const attackGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const attackMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });
        
        const attackMesh = new THREE.Mesh(attackGeometry, attackMaterial);
        
        // Position and rotate attack effect
        attackMesh.position.copy(modelGroup.position);
        attackMesh.position.y += 1;
        attackMesh.rotation.x = Math.PI / 2;
        attackMesh.rotation.y = modelGroup.rotation.y;
        
        // Move attack effect forward
        attackMesh.position.x += direction.x * 1.5;
        attackMesh.position.z += direction.z * 1.5;
        
        // Add to scene
        this.scene.add(attackMesh);
        
        // Remove after delay
        setTimeout(() => {
            this.scene.remove(attackMesh);
            attackGeometry.dispose();
            attackMaterial.dispose();
        }, 300);
    }
    
    createKnockbackEffect(position) {
        // Create a shockwave effect at the knockback point
        const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Flat on ground
        
        this.scene.add(ring);
        
        // Animate the shockwave
        let scale = 1.0;
        let opacity = 0.7;
        
        const animateShockwave = () => {
            scale += 0.2;
            opacity -= 0.03;
            
            ring.scale.set(scale, scale, scale);
            ringMaterial.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animateShockwave);
            } else {
                this.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
            }
        };
        
        animateShockwave();
    }
}