import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Ice Formation - Creates an ice formation in the environment
 */
export class IceFormation extends EnvironmentObject {
    constructor(scene, worldManager, position, size) {
        super(scene, worldManager, position, size, 'ice_formation');
        return this.create();
    }
    
    /**
     * Create the ice formation
     * @returns {THREE.Group} - Ice formation group
     */
    create() {
        const iceGroup = new THREE.Group();
        
        // Create the main ice formation with multiple ice crystals
        const crystalCount = 3 + Math.floor(Math.random() * 4); // 3-6 crystals
        
        for (let i = 0; i < crystalCount; i++) {
            // Create a crystal with random properties
            const height = this.size * (0.8 + Math.random() * 1.2);
            const width = this.size * (0.3 + Math.random() * 0.4);
            
            // Use different geometries for variety
            let crystalGeometry;
            const geometryType = Math.floor(Math.random() * 3);
            
            if (geometryType === 0) {
                // Pointed crystal
                crystalGeometry = new THREE.ConeGeometry(width, height, 6);
            } else if (geometryType === 1) {
                // Hexagonal crystal
                crystalGeometry = new THREE.CylinderGeometry(width, width * 0.8, height, 6);
            } else {
                // Irregular crystal
                crystalGeometry = new THREE.OctahedronGeometry(width, 0);
                // Scale to make it taller
                crystalGeometry.scale(1, height / width, 1);
            }
            
            // Create ice material with slight transparency
            const crystalMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xADD8E6, // Light blue
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.1,
                transmission: 0.5, // Makes it more glass-like
                thickness: 0.5,    // Refraction thickness
                envMapIntensity: 1.0
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position crystals in a cluster
            const angle = (i / crystalCount) * Math.PI * 2;
            const distance = i === 0 ? 0 : this.size * (0.3 + Math.random() * 0.3);
            
            crystal.position.x = Math.cos(angle) * distance;
            crystal.position.z = Math.sin(angle) * distance;
            crystal.position.y = height / 2;
            
            // Random rotation
            crystal.rotation.y = Math.random() * Math.PI;
            
            // Add slight tilt for more natural look
            crystal.rotation.x = (Math.random() - 0.5) * 0.2;
            crystal.rotation.z = (Math.random() - 0.5) * 0.2;
            
            crystal.castShadow = true;
            crystal.receiveShadow = true;
            
            iceGroup.add(crystal);
            
            // Add inner glow effect to some crystals
            if (Math.random() > 0.5) {
                // Create a smaller inner crystal with emissive material
                const innerGeometry = geometryType === 0 
                    ? new THREE.ConeGeometry(width * 0.6, height * 0.6, 6)
                    : geometryType === 1 
                        ? new THREE.CylinderGeometry(width * 0.6, width * 0.5, height * 0.6, 6)
                        : new THREE.OctahedronGeometry(width * 0.6, 0);
                
                if (geometryType === 2) {
                    innerGeometry.scale(1, height / width, 1);
                }
                
                const innerMaterial = new THREE.MeshStandardMaterial({
                    color: 0xE0FFFF, // Light cyan
                    emissive: 0xADD8E6,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.7
                });
                
                const innerCrystal = new THREE.Mesh(innerGeometry, innerMaterial);
                innerCrystal.position.y = 0;
                
                crystal.add(innerCrystal);
            }
        }
        
        // Add snow at the base
        const snowGeometry = new THREE.CircleGeometry(this.size * 1.2, 32);
        const snowMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, // White
            transparent: false
        });
        
        const snow = new THREE.Mesh(snowGeometry, snowMaterial);
        snow.rotation.x = -Math.PI / 2;
        snow.position.y = 0.02; // Slightly above ground to prevent z-fighting
        
        iceGroup.add(snow);
        
        // Add small ice shards around the formation
        const shardCount = 5 + Math.floor(Math.random() * 6); // 5-10 shards
        
        for (let i = 0; i < shardCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * (0.8 + Math.random() * 0.6);
            
            const shardSize = this.size * (0.1 + Math.random() * 0.2);
            const shardGeometry = new THREE.TetrahedronGeometry(shardSize, 0);
            
            const shardMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xADD8E6, // Light blue
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.1,
                transmission: 0.5
            });
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            
            shard.position.set(
                Math.cos(angle) * distance,
                shardSize,
                Math.sin(angle) * distance
            );
            
            // Random rotation
            shard.rotation.x = Math.random() * Math.PI;
            shard.rotation.y = Math.random() * Math.PI;
            shard.rotation.z = Math.random() * Math.PI;
            
            shard.castShadow = true;
            
            iceGroup.add(shard);
        }
        
        // Add frost patterns on the ground
        const frostCount = 3 + Math.floor(Math.random() * 4); // 3-6 frost patterns
        
        for (let i = 0; i < frostCount; i++) {
            const angle = (i / frostCount) * Math.PI * 2;
            const distance = this.size * (0.5 + Math.random() * 1.0);
            
            // Create a frost pattern using a plane with a custom shape
            const frostGeometry = new THREE.PlaneGeometry(
                this.size * (0.3 + Math.random() * 0.4),
                this.size * (0.3 + Math.random() * 0.4)
            );
            
            const frostMaterial = new THREE.MeshLambertMaterial({
                color: 0xF0FFFF, // Azure
                transparent: true,
                opacity: 0.7
            });
            
            const frost = new THREE.Mesh(frostGeometry, frostMaterial);
            frost.rotation.x = -Math.PI / 2;
            
            frost.position.set(
                Math.cos(angle) * distance,
                0.03, // Slightly above ground
                Math.sin(angle) * distance
            );
            
            // Random rotation around y-axis
            frost.rotation.z = Math.random() * Math.PI;
            
            iceGroup.add(frost);
        }
        
        // Position the entire group
        iceGroup.position.copy(this.position);
        
        // Set user data for identification
        iceGroup.userData = { type: 'ice_formation' };
        
        // Add to scene
        this.addToScene(iceGroup);
        
        return iceGroup;
    }
}