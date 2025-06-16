import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Bog Pit - Creates a murky, swampy pit in the environment
 */
export class BogPit extends EnvironmentObject {
    constructor(scene, worldManager, position, size) {
        super(scene, worldManager, position, size, 'bog_pit');
        return this.create();
    }
    
    /**
     * Create the bog pit
     * @returns {THREE.Group} - Bog pit group
     */
    create() {
        const bogGroup = new THREE.Group();
        
        // Create the main bog pit (murky water)
        const segments = 12;
        const shape = new THREE.Shape();
        
        // Create an irregular circle by varying the radius
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = this.size * (0.8 + Math.random() * 0.4); // Vary radius between 80-120% of size
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new THREE.Vector2(x, y));
        }
        
        // Create shape from points
        shape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        shape.lineTo(points[0].x, points[0].y);
        
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshLambertMaterial({
            color: 0x2D4F2F, // Dark murky green
            transparent: true,
            opacity: 0.9
        });
        
        const bogSurface = new THREE.Mesh(geometry, material);
        bogSurface.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        
        // Position slightly above terrain to prevent z-fighting
        const terrainHeight = this.getTerrainHeight(this.position.x, this.position.z);
        bogSurface.position.set(
            this.position.x,
            terrainHeight + 0.05,
            this.position.z
        );
        
        bogGroup.add(bogSurface);
        
        // Add bubbles to the bog surface
        const bubbleCount = Math.floor(3 + Math.random() * 5); // 3-7 bubbles
        
        for (let i = 0; i < bubbleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size * 0.7; // Within 70% of the bog radius
            
            const bubbleSize = 0.05 + Math.random() * 0.1;
            const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 8, 6);
            const bubbleMaterial = new THREE.MeshLambertMaterial({
                color: 0x4F6D4F, // Slightly lighter green
                transparent: true,
                opacity: 0.7
            });
            
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            bubble.position.set(
                Math.cos(angle) * distance,
                0.08, // Slightly above the bog surface
                Math.sin(angle) * distance
            );
            
            bogGroup.add(bubble);
        }
        
        // Add some mud around the edges
        const mudCount = Math.floor(5 + Math.random() * 4); // 5-8 mud patches
        
        for (let i = 0; i < mudCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * (0.8 + Math.random() * 0.3); // Around the edges
            
            const mudSize = 0.2 + Math.random() * 0.3;
            const mudGeometry = new THREE.CircleGeometry(mudSize, 8);
            const mudMaterial = new THREE.MeshLambertMaterial({
                color: 0x3D2C1F, // Dark brown
                transparent: false
            });
            
            const mud = new THREE.Mesh(mudGeometry, mudMaterial);
            mud.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            mud.position.set(
                Math.cos(angle) * distance,
                0.06, // Slightly above the terrain
                Math.sin(angle) * distance
            );
            
            bogGroup.add(mud);
        }
        
        // Add some gas emissions (particle effect simulation)
        const gasEmissionCount = Math.floor(2 + Math.random() * 3); // 2-4 gas emissions
        
        for (let i = 0; i < gasEmissionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size * 0.5; // Within 50% of the bog radius
            
            // Create a simple gas emission using a cone
            const emissionGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
            const emissionMaterial = new THREE.MeshLambertMaterial({
                color: 0x7D8F7D, // Grayish green
                transparent: true,
                opacity: 0.4
            });
            
            const emission = new THREE.Mesh(emissionGeometry, emissionMaterial);
            emission.rotation.x = Math.PI; // Point upward
            emission.position.set(
                Math.cos(angle) * distance,
                0.1, // Above the bog surface
                Math.sin(angle) * distance
            );
            
            bogGroup.add(emission);
        }
        
        // Position the entire group
        bogGroup.position.copy(this.position);
        
        // Set user data for identification
        bogGroup.userData = { type: 'bog_pit' };
        
        // Add to scene
        this.addToScene(bogGroup);
        
        return bogGroup;
    }
}