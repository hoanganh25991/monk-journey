import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a mountain cave environment object styled for Monk Journey
 */
export class MountainCave {
    /**
     * Create a new mountain cave
     * @param {THREE.Scene} scene - The scene to add the mountain cave to
     * @param {Object} MapManager - The map manager
     * @param {THREE.Vector3} position - The position of the mountain cave
     * @param {number} size - The size of the mountain cave
     * @param {Object} data - Additional data for the mountain cave
     */
    constructor(scene, MapManager, position, size = 1, data = {}) {
        // Store references
        this.scene = scene;
        this.MapManager = MapManager;
        this.position = position;
        
        // Randomize cave properties
        this.random = Math.random;
        this.size = size * (1 + this.random() * 0.5); // Apply size with some variation
        
        // Store zone type for color selection (get from data or default to Mountains)
        this.zoneType = data.zoneType || 'Mountain';
    }
    
    /**
     * Create the mountain cave mesh
     * @returns {THREE.Group} - The mountain cave group
     */
    createMesh(position = this.position, size = this.size, data = {}) {
        const caveGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Mountain;
        
        // Create the mountain/hill that contains the cave
        const mountainGeometry = new THREE.ConeGeometry(this.size * 2, this.size * 2.5, 8);
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x808080, // Gray default
            roughness: 0.9,
            metalness: 0.1
        });
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.y = this.size * 1.25; // Half the height
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        
        // Add some deformation to the mountain
        const mountainVertices = mountain.geometry.attributes.position;
        for (let i = 0; i < mountainVertices.count; i++) {
            const x = mountainVertices.getX(i);
            const y = mountainVertices.getY(i);
            const z = mountainVertices.getZ(i);
            
            // Add some noise to the vertices
            mountainVertices.setX(i, x + (this.random() - 0.5) * 0.4 * this.size);
            mountainVertices.setY(i, y + (this.random() - 0.5) * 0.2 * this.size);
            mountainVertices.setZ(i, z + (this.random() - 0.5) * 0.4 * this.size);
        }
        
        caveGroup.add(mountain);
        
        // Create the cave entrance (a dark hole in the mountain)
        const entranceRadius = this.size * 0.6;
        const entranceGeometry = new THREE.CircleGeometry(entranceRadius, 32);
        const entranceMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(0, this.size * 0.8, this.size * 1.9); // Position at the front of the mountain
        entrance.rotation.x = Math.PI / 2;
        entrance.rotation.y = Math.PI;
        
        caveGroup.add(entrance);
        
        // Add some rocks around the entrance
        const rockCount = 4 + Math.floor(this.random() * 3);
        for (let i = 0; i < rockCount; i++) {
            const rockSize = this.size * (0.2 + this.random() * 0.3);
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.rock || 0x808080,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Position rocks around the entrance
            const angle = this.random() * Math.PI * 2;
            const distance = entranceRadius * (0.8 + this.random() * 0.5);
            
            rock.position.set(
                Math.cos(angle) * distance,
                this.size * 0.4 + this.random() * this.size * 0.4,
                this.size * 1.9 + Math.sin(angle) * distance
            );
            
            rock.rotation.set(
                this.random() * Math.PI,
                this.random() * Math.PI,
                this.random() * Math.PI
            );
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            caveGroup.add(rock);
        }
        
        // Add some ambient light inside the cave for a subtle glow
        const caveLight = new THREE.PointLight(0x6666ff, 0.5, this.size * 4);
        caveLight.position.set(0, this.size * 0.8, this.size * 1.5);
        caveGroup.add(caveLight);
        
        // Position the entire group at the specified position
        if (position) {
            caveGroup.position.copy(position);
        }
        
        // Add to scene
        this.scene.add(caveGroup);
        
        return caveGroup;
    }
}