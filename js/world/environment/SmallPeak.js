import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Small Peak - Creates a small mountain peak in the environment
 */
export class SmallPeak extends EnvironmentObject {
    constructor(scene, MapManager, position, size) {
        super(scene, MapManager, position, size, 'small_peak');
        return this.create();
    }
    
    /**
     * Create the small peak
     * @returns {THREE.Group} - Small peak group
     */
    create() {
        const group = new THREE.Group();
        
        // Create the peak with a cone geometry
        const peakHeight = this.size * 2;
        const peakRadius = this.size;
        const peakGeometry = new THREE.ConeGeometry(peakRadius, peakHeight, 8);
        
        // Use a rock-like material
        const peakMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080, // Gray color for rock
            roughness: 0.8,
            metalness: 0.2
        });
        
        const peak = new THREE.Mesh(peakGeometry, peakMaterial);
        
        // Position the peak
        const terrainHeight = this.getTerrainHeight(this.position.x, this.position.z);
        peak.position.set(0, peakHeight / 2, 0);
        
        // Add some smaller rocks around the base
        const rockCount = Math.floor(3 + Math.random() * 4); // 3-6 rocks
        
        for (let i = 0; i < rockCount; i++) {
            const angle = (i / rockCount) * Math.PI * 2;
            const distance = peakRadius * 0.8;
            
            const rockSize = 0.2 + Math.random() * 0.4;
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x707070, // Slightly darker gray
                roughness: 0.9,
                metalness: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                Math.cos(angle) * distance,
                rockSize,
                Math.sin(angle) * distance
            );
            
            // Add some random rotation
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            group.add(rock);
        }
        
        // Add the peak to the group
        group.add(peak);
        
        // Position the group
        group.position.set(
            this.position.x,
            terrainHeight,
            this.position.z
        );
        
        group.userData = { type: 'small_peak' };
        this.addToScene(group);
        
        return group;
    }
}