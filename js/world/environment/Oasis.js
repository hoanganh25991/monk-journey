import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents an oasis environment object
 * A small water body with surrounding vegetation in arid environments
 */
export class Oasis extends EnvironmentObject {
    /**
     * Create a new oasis
     * @param {THREE.Scene} scene - The scene to add the oasis to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the oasis
     * @param {number} size - The size of the oasis
     */
    constructor(scene, worldManager, position, size = 1) {
        super(scene, worldManager, position, size, 'oasis');
        
        // Randomize oasis properties
        this.waterRadius = this.size * (1 + Math.random() * 0.5);
        this.hasPalms = Math.random() > 0.2; // 80% chance to have palm trees
        this.hasRocks = Math.random() > 0.4; // 60% chance to have rocks
        
        // Get zone type from world manager if available
        this.zoneType = worldManager?.getCurrentZoneType(position) || 'Desert';
        
        // Create the oasis
        this.object = this.create();
    }
    
    /**
     * Create the oasis mesh
     * @returns {THREE.Group} - The oasis group
     */
    create() {
        const oasisGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Desert;
        
        // Determine colors
        const waterColor = zoneColors.water || 0x4682B4; // Steel Blue
        const sandColor = zoneColors.sand || 0xF4A460; // Sandy Brown
        const vegetationColor = zoneColors.vegetation || 0x6B8E23; // Olive Drab
        const rockColor = zoneColors.rock || 0xA0522D; // Sienna
        const trunkColor = 0x8B4513; // Saddle Brown
        
        // Create water pool
        const waterGeometry = new THREE.CircleGeometry(this.waterRadius, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: waterColor,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2; // Lay flat
        water.position.y = 0.05; // Slightly above ground to prevent z-fighting
        
        oasisGroup.add(water);
        
        // Create sandy shore around water
        const shoreRadius = this.waterRadius * 1.5;
        const shoreGeometry = new THREE.RingGeometry(this.waterRadius, shoreRadius, 32);
        const shoreMaterial = new THREE.MeshStandardMaterial({
            color: sandColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
        shore.rotation.x = -Math.PI / 2; // Lay flat
        shore.position.y = 0.02; // Slightly above ground but below water
        
        oasisGroup.add(shore);
        
        // Add vegetation around the shore
        const vegetationCount = Math.floor(this.size * 10);
        
        for (let i = 0; i < vegetationCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = this.waterRadius + Math.random() * (shoreRadius - this.waterRadius) * 0.9;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create small vegetation patch
            const vegSize = 0.1 + Math.random() * 0.2;
            const vegGeometry = new THREE.SphereGeometry(vegSize, 8, 6);
            const vegMaterial = new THREE.MeshStandardMaterial({
                color: vegetationColor,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const vegetation = new THREE.Mesh(vegGeometry, vegMaterial);
            vegetation.position.set(x, vegSize * 0.7, z);
            vegetation.scale.y = 0.5; // Flatten slightly
            
            oasisGroup.add(vegetation);
        }
        
        // Add palm trees if enabled
        if (this.hasPalms) {
            const palmCount = 2 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < palmCount; i++) {
                const angle = (i / palmCount) * Math.PI * 2 + Math.random() * 0.5;
                const radius = this.waterRadius * (0.8 + Math.random() * 0.3);
                
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                // Create palm tree
                const palm = this.createPalmTree();
                palm.position.set(x, 0, z);
                
                // Random rotation and slight tilt
                palm.rotation.y = Math.random() * Math.PI * 2;
                palm.rotation.x = (Math.random() - 0.5) * 0.2;
                palm.rotation.z = (Math.random() - 0.5) * 0.2;
                
                oasisGroup.add(palm);
            }
        }
        
        // Add rocks if enabled
        if (this.hasRocks) {
            const rockCount = 3 + Math.floor(Math.random() * 4);
            
            for (let i = 0; i < rockCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = this.waterRadius * (0.7 + Math.random() * 0.9);
                
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                // Create rock
                const rockSize = 0.2 + Math.random() * 0.3;
                const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
                const rockMaterial = new THREE.MeshStandardMaterial({
                    color: rockColor,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.set(x, rockSize * 0.7, z);
                
                // Random rotation
                rock.rotation.x = Math.random() * Math.PI;
                rock.rotation.y = Math.random() * Math.PI;
                rock.rotation.z = Math.random() * Math.PI;
                
                rock.castShadow = true;
                rock.receiveShadow = true;
                
                oasisGroup.add(rock);
            }
        }
        
        // Add water reflection/ripple effect
        const rippleGeometry = new THREE.CircleGeometry(this.waterRadius, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = 0.06;
        
        oasisGroup.add(ripple);
        
        // Position the entire oasis at the specified position
        oasisGroup.position.copy(this.position);
        
        return oasisGroup;
    }
    
    /**
     * Create a palm tree for the oasis
     * @returns {THREE.Group} - The palm tree group
     */
    createPalmTree() {
        const palmGroup = new THREE.Group();
        
        // Create trunk
        const trunkHeight = 1.5 + Math.random() * 1;
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Saddle Brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        
        // Add slight curve to trunk
        trunk.rotation.x = (Math.random() - 0.5) * 0.2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.2;
        
        palmGroup.add(trunk);
        
        // Create palm fronds
        const frondCount = 5 + Math.floor(Math.random() * 4);
        const frondMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B8E23, // Olive Drab
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < frondCount; i++) {
            // Create a simple frond using a modified plane
            const frondLength = 0.8 + Math.random() * 0.4;
            const frondWidth = 0.2 + Math.random() * 0.1;
            
            const frondShape = new THREE.Shape();
            frondShape.moveTo(0, 0);
            frondShape.lineTo(frondWidth / 2, frondLength * 0.1);
            frondShape.lineTo(frondWidth * 0.7, frondLength * 0.3);
            frondShape.lineTo(frondWidth, frondLength * 0.6);
            frondShape.lineTo(frondWidth * 0.8, frondLength * 0.8);
            frondShape.lineTo(frondWidth * 0.5, frondLength);
            frondShape.lineTo(0, frondLength * 0.9);
            frondShape.lineTo(-frondWidth * 0.5, frondLength);
            frondShape.lineTo(-frondWidth * 0.8, frondLength * 0.8);
            frondShape.lineTo(-frondWidth, frondLength * 0.6);
            frondShape.lineTo(-frondWidth * 0.7, frondLength * 0.3);
            frondShape.lineTo(-frondWidth / 2, frondLength * 0.1);
            frondShape.lineTo(0, 0);
            
            const frondGeometry = new THREE.ShapeGeometry(frondShape);
            const frond = new THREE.Mesh(frondGeometry, frondMaterial);
            
            // Position frond at top of trunk
            frond.position.y = trunkHeight;
            
            // Rotate frond outward from trunk center
            const angle = (i / frondCount) * Math.PI * 2;
            frond.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3; // Slight random variation
            frond.rotation.y = angle;
            
            // Tilt frond upward
            frond.rotation.x = -Math.PI / 4 + (Math.random() - 0.5) * 0.2;
            
            frond.castShadow = true;
            
            palmGroup.add(frond);
        }
        
        // Add coconuts
        if (Math.random() > 0.5) { // 50% chance to have coconuts
            const coconutCount = 1 + Math.floor(Math.random() * 3);
            const coconutMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Saddle Brown
                roughness: 0.7,
                metalness: 0.2
            });
            
            for (let i = 0; i < coconutCount; i++) {
                const coconutGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);
                
                // Position coconut at top of trunk with slight offset
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.15;
                
                coconut.position.x = Math.cos(angle) * radius;
                coconut.position.y = trunkHeight - 0.1;
                coconut.position.z = Math.sin(angle) * radius;
                
                coconut.castShadow = true;
                
                palmGroup.add(coconut);
            }
        }
        
        return palmGroup;
    }
}