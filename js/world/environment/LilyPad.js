import * as THREE from 'three';

/**
 * LilyPad - Creates a lily pad for water surfaces
 */
export class LilyPad {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the lily pad mesh
     * @param {THREE.Vector3} position - Position of the lily pad
     * @param {number} size - Size scale of the lily pad
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The lily pad group
     */
    createMesh(position, size, data = {}) {
        const lilyPadGroup = new THREE.Group();
        
        // Create the main pad
        this.createPad(lilyPadGroup, size);
        
        // Randomly add a flower
        if (Math.random() > 0.6) {
            this.createFlower(lilyPadGroup, size);
        }
        
        // Position the entire group
        lilyPadGroup.position.copy(position);
        // Ensure it sits on water surface
        lilyPadGroup.position.y += 0.05 * size;
        
        // Add to scene
        this.scene.add(lilyPadGroup);
        
        return lilyPadGroup;
    }
    
    /**
     * Create the main lily pad
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createPad(group, size) {
        // Create a circular pad with a slight curve
        const padGeometry = new THREE.CircleGeometry(size, 16);
        
        // Get the position attribute to modify vertices
        const positionAttribute = padGeometry.getAttribute('position');
        const vertices = [];
        
        // Extract vertices from the buffer attribute
        for (let i = 0; i < positionAttribute.count; i++) {
            vertices.push(new THREE.Vector3(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            ));
        }
        
        // Modify vertices to create a natural shape with a slight curve
        for (let i = 0; i < vertices.length; i++) {
            // Skip the center vertex
            if (i > 0) {
                // Add a slight curve (dome shape)
                const distanceFromCenter = Math.sqrt(
                    vertices[i].x * vertices[i].x + 
                    vertices[i].z * vertices[i].z
                );
                
                // Curve formula: y = -a * (x^2 + z^2) + b
                // This creates a dome shape with the edges slightly raised
                vertices[i].y = -0.2 * Math.pow(distanceFromCenter / size, 2) + 0.1;
                
                // Add some natural irregularity to the edge
                if (distanceFromCenter > 0.8 * size) {
                    const edgeFactor = (distanceFromCenter - 0.8 * size) / (0.2 * size);
                    vertices[i].x += (Math.random() - 0.5) * 0.1 * size * edgeFactor;
                    vertices[i].z += (Math.random() - 0.5) * 0.1 * size * edgeFactor;
                }
            }
        }
        
        // Update the position attribute with modified vertices
        for (let i = 0; i < vertices.length; i++) {
            positionAttribute.setXYZ(i, vertices[i].x, vertices[i].y, vertices[i].z);
        }
        
        positionAttribute.needsUpdate = true;
        padGeometry.computeVertexNormals();
        
        // Create a material with a natural green color
        const padMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2E7D32,
            side: THREE.DoubleSide
        });
        
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        
        // Rotate to lie flat on the water
        pad.rotation.x = -Math.PI / 2;
        
        group.add(pad);
        
        // Add veins/texture to the pad
        this.addPadVeins(group, size);
    }
    
    /**
     * Add veins/texture to the lily pad
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addPadVeins(group, size) {
        // Create veins using line segments
        const veinMaterial = new THREE.LineBasicMaterial({ 
            color: 0x1B5E20,
            linewidth: 1
        });
        
        // Create radial veins
        const veinCount = 8;
        
        for (let i = 0; i < veinCount; i++) {
            const angle = (i / veinCount) * Math.PI * 2;
            
            const points = [];
            
            // Start at center
            points.push(new THREE.Vector3(0, 0.05, 0));
            
            // Create a slightly curved line to the edge
            const segments = 4;
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const radius = t * size;
                
                // Add a slight curve
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = 0.05 - 0.2 * Math.pow(t, 2) + 0.1;
                
                // Add some natural irregularity
                const xOffset = (Math.random() - 0.5) * 0.05 * size * t;
                const zOffset = (Math.random() - 0.5) * 0.05 * size * t;
                
                points.push(new THREE.Vector3(x + xOffset, y, z + zOffset));
            }
            
            const veinGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const vein = new THREE.Line(veinGeometry, veinMaterial);
            
            group.add(vein);
        }
        
        // Create circular veins
        const circularVeinCount = 3;
        
        for (let i = 1; i <= circularVeinCount; i++) {
            const radius = (i / (circularVeinCount + 1)) * size;
            
            const points = [];
            const segments = 32;
            
            for (let j = 0; j <= segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                // Follow the curve of the pad
                const distanceFromCenter = radius / size;
                const y = 0.05 - 0.2 * Math.pow(distanceFromCenter, 2) + 0.1;
                
                // Add some natural irregularity
                const xOffset = (Math.random() - 0.5) * 0.03 * size;
                const zOffset = (Math.random() - 0.5) * 0.03 * size;
                
                points.push(new THREE.Vector3(x + xOffset, y, z + zOffset));
            }
            
            const veinGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const vein = new THREE.Line(veinGeometry, veinMaterial);
            
            group.add(vein);
        }
    }
    
    /**
     * Create a flower for the lily pad
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createFlower(group, size) {
        // Determine flower color
        const flowerColors = [
            0xF06292, // Pink
            0xFFFFFF, // White
            0xFFF176  // Yellow
        ];
        const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        
        // Create the stem
        const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.3 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x33691E });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Position stem at the center of the pad
        stem.position.y = 0.15 * size;
        
        group.add(stem);
        
        // Create petals
        const petalCount = 5 + Math.floor(Math.random() * 4);
        const petalGeometry = new THREE.CircleGeometry(0.15 * size, 8);
        const petalMaterial = new THREE.MeshLambertMaterial({ 
            color: flowerColor,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            // Position around the stem
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.x = Math.cos(angle) * 0.1 * size;
            petal.position.z = Math.sin(angle) * 0.1 * size;
            petal.position.y = 0.3 * size;
            
            // Rotate to face outward
            petal.rotation.x = Math.PI / 2 - 0.3;
            petal.rotation.y = angle;
            
            group.add(petal);
        }
        
        // Create center of the flower
        const centerGeometry = new THREE.SphereGeometry(0.08 * size, 8, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFC107 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        
        center.position.y = 0.3 * size;
        
        group.add(center);
    }
}