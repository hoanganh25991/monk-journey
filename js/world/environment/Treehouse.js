import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Treehouse - A forest dwelling built in or around a tree
 * Creates a rustic wooden structure elevated above ground
 */
export class Treehouse extends EnvironmentObject {
    constructor(scene, worldManager) {
        super(scene, worldManager);
        this.name = 'Treehouse';
    }

    /**
     * Create the treehouse mesh
     * @param {THREE.Vector3} position - Position to place the treehouse
     * @param {number} size - Scale factor for the treehouse
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} The treehouse group
     */
    createMesh(position, size = 1, data = {}) {
        const treehouseGroup = new THREE.Group();
        
        // Create the supporting tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(
            0.8 * size, 
            1.0 * size, 
            6 * size, 
            12
        );
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 // Saddle brown
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 3 * size;
        treehouseGroup.add(trunk);

        // Create tree foliage/canopy
        const foliageGeometry = new THREE.SphereGeometry(2.5 * size, 12, 8);
        const foliageMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 // Forest green
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 7 * size;
        foliage.scale.set(1.2, 0.8, 1.2); // Flatten slightly for more natural look
        treehouseGroup.add(foliage);

        // Create the main house structure (elevated platform)
        const houseGeometry = new THREE.BoxGeometry(3 * size, 2 * size, 2.5 * size);
        const houseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xD2691E // Chocolate brown
        });
        const house = new THREE.Mesh(houseGeometry, houseMaterial);
        house.position.y = 4.5 * size;
        house.position.x = 1.5 * size; // Offset from trunk center
        treehouseGroup.add(house);

        // Create the roof
        const roofGeometry = new THREE.ConeGeometry(2.2 * size, 1.5 * size, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 // Darker brown for roof
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 6.25 * size;
        roof.position.x = 1.5 * size;
        roof.rotation.y = Math.PI / 4; // Rotate to make it diamond-shaped from above
        treehouseGroup.add(roof);

        // Create supporting beams/stilts
        const beamGeometry = new THREE.CylinderGeometry(0.1 * size, 0.1 * size, 3 * size, 8);
        const beamMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321 // Dark brown
        });
        
        // Add 3-4 support beams at different angles
        const beamPositions = [
            { x: 2.5 * size, z: 1 * size },
            { x: 2.5 * size, z: -1 * size },
            { x: 0.5 * size, z: 1.5 * size },
            { x: 0.5 * size, z: -1.5 * size }
        ];

        beamPositions.forEach(pos => {
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(pos.x, 3 * size, pos.z);
            beam.rotation.z = Math.PI / 12; // Slight angle for support
            treehouseGroup.add(beam);
        });

        // Create a simple ladder
        const ladderGeometry = new THREE.BoxGeometry(0.1 * size, 4 * size, 0.3 * size);
        const ladderMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321 
        });
        const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
        ladder.position.set(0.2 * size, 2.5 * size, 1.8 * size);
        treehouseGroup.add(ladder);

        // Add ladder rungs
        const rungGeometry = new THREE.CylinderGeometry(0.05 * size, 0.05 * size, 0.4 * size, 6);
        const rungMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321 
        });
        
        for (let i = 0; i < 6; i++) {
            const rung = new THREE.Mesh(rungGeometry, rungMaterial);
            rung.position.set(0.2 * size, 1 * size + i * 0.6 * size, 1.8 * size);
            rung.rotation.z = Math.PI / 2;
            treehouseGroup.add(rung);
        }

        // Create a small window
        const windowGeometry = new THREE.PlaneGeometry(0.6 * size, 0.6 * size);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, // Sky blue
            transparent: true,
            opacity: 0.7
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(3.01 * size, 4.8 * size, 0);
        treehouseGroup.add(window);

        // Add some decorative elements - hanging rope
        const ropeGeometry = new THREE.CylinderGeometry(0.02 * size, 0.02 * size, 2 * size, 6);
        const ropeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355 // Burlywood
        });
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.set(3 * size, 2.5 * size, 1.2 * size);
        treehouseGroup.add(rope);

        // Position the entire treehouse
        treehouseGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(treehouseGroup);
        
        // Store reference for cleanup
        this.mesh = treehouseGroup;
        
        return treehouseGroup;
    }

    /**
     * Get the bounding box of the treehouse
     * @returns {THREE.Box3} Bounding box
     */
    getBoundingBox() {
        if (this.mesh) {
            const box = new THREE.Box3().setFromObject(this.mesh);
            return box;
        }
        return new THREE.Box3();
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            // Dispose of geometries and materials
            this.mesh.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.mesh = null;
        }
    }
}