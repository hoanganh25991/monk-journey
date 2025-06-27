import * as THREE from 'three';

/**
 * Represents ruins structure
 */
export class Ruins {
    /**
     * Create new ruins
     */
    constructor() {
        
        this.size = 5 + Math.random() * 10; // Size between 5-15 units
    }
    
    /**
     * Create the ruins mesh
     * @returns {THREE.Group} - The ruins group
     */
    createMesh() {
        const ruinsGroup = new THREE.Group();
        
        // Create stone material with variations
        const stoneMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.2),
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create broken walls
        const numWalls = 3 + Math.floor(Math.random() * 4); // 3-6 wall sections
        
        for (let i = 0; i < numWalls; i++) {
            // Randomize wall dimensions
            const wallWidth = 0.5 + Math.random() * 0.5;
            const wallHeight = 1 + Math.random() * 3;
            const wallDepth = 2 + Math.random() * 4;
            
            // Create wall geometry
            const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
            const wall = new THREE.Mesh(wallGeometry, stoneMaterial);
            
            // Position wall in a circular pattern
            const angle = (i / numWalls) * Math.PI * 2;
            const radius = this.size / 2;
            
            wall.position.set(
                Math.cos(angle) * radius,
                wallHeight / 2,
                Math.sin(angle) * radius
            );
            
            // Rotate wall to face center
            wall.rotation.y = angle + Math.PI / 2;
            
            // Add some random rotation to make it look broken
            wall.rotation.z = (Math.random() - 0.5) * 0.5;
            wall.rotation.x = (Math.random() - 0.5) * 0.2;
            
            wall.castShadow = true;
            wall.receiveShadow = true;
            
            ruinsGroup.add(wall);
        }
        
        // Create fallen columns
        const numColumns = 2 + Math.floor(Math.random() * 3); // 2-4 columns
        
        for (let i = 0; i < numColumns; i++) {
            const columnRadius = 0.5 + Math.random() * 0.3;
            const columnHeight = 3 + Math.random() * 2;
            
            const columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 8);
            const column = new THREE.Mesh(columnGeometry, stoneMaterial);
            
            // Position column randomly within the ruins
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (this.size / 3);
            
            column.position.set(
                Math.cos(angle) * distance,
                columnHeight / 2,
                Math.sin(angle) * distance
            );
            
            // Make column fallen
            column.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            column.rotation.z = Math.random() * Math.PI * 2;
            
            column.castShadow = true;
            column.receiveShadow = true;
            
            ruinsGroup.add(column);
        }
        
        // Create rubble piles
        const numRubblePiles = 4 + Math.floor(Math.random() * 5); // 4-8 rubble piles
        
        for (let i = 0; i < numRubblePiles; i++) {
            // Create a small pile of rocks
            const rubbleGroup = new THREE.Group();
            
            const numRocks = 3 + Math.floor(Math.random() * 5); // 3-7 rocks per pile
            
            for (let j = 0; j < numRocks; j++) {
                const rockSize = 0.2 + Math.random() * 0.4;
                const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
                const rock = new THREE.Mesh(rockGeometry, stoneMaterial);
                
                // Position rocks in a small pile
                rock.position.set(
                    (Math.random() - 0.5) * 0.5,
                    j * rockSize * 0.8,
                    (Math.random() - 0.5) * 0.5
                );
                
                // Random rotation
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                rock.castShadow = true;
                rock.receiveShadow = true;
                
                rubbleGroup.add(rock);
            }
            
            // Position rubble pile randomly within the ruins
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.size / 2;
            
            rubbleGroup.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            ruinsGroup.add(rubbleGroup);
        }
        
        return ruinsGroup;
    }
}