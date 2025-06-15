import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Snow Patch - Creates a patch of snow in the environment
 */
export class SnowPatch extends EnvironmentObject {
    constructor(scene, worldManager, position, size) {
        super(scene, worldManager, position, size, 'snow_patch');
        return this.create();
    }
    
    /**
     * Create the snow patch
     * @returns {THREE.Mesh} - Snow patch mesh
     */
    create() {
        // Create a slightly irregular shape for the snow patch
        const segments = 8;
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
            color: 0xFFFFFF, // White for snow
            transparent: true,
            opacity: 0.9
        });
        
        const snowPatch = new THREE.Mesh(geometry, material);
        snowPatch.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        
        // Position slightly above terrain to prevent z-fighting
        const terrainHeight = this.getTerrainHeight(this.position.x, this.position.z);
        snowPatch.position.set(
            this.position.x,
            terrainHeight + 0.05,
            this.position.z
        );
        
        // Add some subtle bumps to the snow for realism
        const bumpCount = Math.floor(3 + Math.random() * 4); // 3-6 bumps
        const bumpGroup = new THREE.Group();
        
        for (let i = 0; i < bumpCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size * 0.7; // Within 70% of the patch radius
            
            const bumpSize = 0.1 + Math.random() * 0.2;
            const bumpGeometry = new THREE.SphereGeometry(bumpSize, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
            const bumpMaterial = new THREE.MeshLambertMaterial({
                color: 0xF8F8F8, // Slightly off-white
                transparent: true,
                opacity: 0.9
            });
            
            const bump = new THREE.Mesh(bumpGeometry, bumpMaterial);
            bump.position.set(
                Math.cos(angle) * distance,
                0.05, // Slightly above the patch
                Math.sin(angle) * distance
            );
            
            bumpGroup.add(bump);
        }
        
        // Create a complete snow patch group
        const group = new THREE.Group();
        group.add(snowPatch);
        group.add(bumpGroup);
        
        group.userData = { type: 'snow_patch' };
        this.addToScene(group);
        
        return group;
    }
}