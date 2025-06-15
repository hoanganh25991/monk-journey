import * as THREE from 'three';

/**
 * SwampTree - Creates a twisted, gnarled tree suitable for swamp environments
 */
export class SwampTree {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the swamp tree mesh
     * @param {THREE.Vector3} position - Position of the tree
     * @param {number} size - Size scale of the tree
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The tree group
     */
    createMesh(position, size, data = {}) {
        const treeGroup = new THREE.Group();
        
        // Create the main trunk
        this.createTrunk(treeGroup, size);
        
        // Create branches
        this.createBranches(treeGroup, size);
        
        // Create foliage
        this.createFoliage(treeGroup, size);
        
        // Create hanging moss/vines
        this.createHangingMoss(treeGroup, size);
        
        // Create roots
        this.createRoots(treeGroup, size);
        
        // Position the entire group
        treeGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(treeGroup);
        
        return treeGroup;
    }
    
    /**
     * Create the main trunk of the swamp tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createTrunk(group, size) {
        // Create a curved, twisted trunk using multiple segments
        const segments = 5;
        const trunkHeight = 3 * size;
        const segmentHeight = trunkHeight / segments;
        
        let prevX = 0;
        let prevZ = 0;
        let prevY = 0;
        
        for (let i = 0; i < segments; i++) {
            // Each segment curves slightly
            const bendFactor = 0.2 * size;
            const xOffset = prevX + (Math.random() - 0.5) * bendFactor;
            const zOffset = prevZ + (Math.random() - 0.5) * bendFactor;
            
            // Trunk gets thinner toward the top
            const bottomRadius = 0.3 * size * (1 - i * 0.15);
            const topRadius = 0.3 * size * (1 - (i + 1) * 0.15);
            
            const segmentGeometry = new THREE.CylinderGeometry(
                topRadius, 
                bottomRadius, 
                segmentHeight, 
                8
            );
            
            const trunkMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4E342E,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const segment = new THREE.Mesh(segmentGeometry, trunkMaterial);
            
            // Position this segment
            segment.position.x = xOffset;
            segment.position.z = zOffset;
            segment.position.y = prevY + segmentHeight / 2;
            
            // Rotate to connect with previous segment
            if (i > 0) {
                const angle = Math.atan2(xOffset - prevX, zOffset - prevZ);
                segment.rotation.y = angle;
                
                const distance = Math.sqrt(
                    Math.pow(xOffset - prevX, 2) + 
                    Math.pow(zOffset - prevZ, 2)
                );
                
                const tiltAngle = Math.atan2(distance, segmentHeight);
                segment.rotation.x = tiltAngle;
            }
            
            group.add(segment);
            
            // Update previous position for next segment
            prevX = xOffset;
            prevZ = zOffset;
            prevY += segmentHeight;
        }
    }
    
    /**
     * Create branches for the swamp tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createBranches(group, size) {
        // Create 3-5 main branches
        const branchCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < branchCount; i++) {
            // Determine branch starting position (height on trunk)
            const branchHeight = (1 + Math.random() * 1.5) * size;
            
            // Determine branch direction
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create branch segments
            const segments = 3;
            const branchLength = (0.8 + Math.random() * 0.7) * size;
            const segmentLength = branchLength / segments;
            
            let prevX = 0;
            let prevZ = 0;
            let prevY = branchHeight;
            
            for (let j = 0; j < segments; j++) {
                // Each segment curves and droops
                const bendFactor = 0.2 * size;
                const xOffset = prevX + Math.cos(angle) * segmentLength + (Math.random() - 0.5) * bendFactor;
                const zOffset = prevZ + Math.sin(angle) * segmentLength + (Math.random() - 0.5) * bendFactor;
                const yOffset = prevY - (j * 0.1) * size; // Drooping effect
                
                // Branch gets thinner toward the end
                const radius = 0.1 * size * (1 - j * 0.25);
                
                const segmentGeometry = new THREE.CylinderGeometry(
                    radius * 0.8, 
                    radius, 
                    segmentLength, 
                    6
                );
                
                const branchMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x5D4037,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const segment = new THREE.Mesh(segmentGeometry, branchMaterial);
                
                // Calculate position and rotation to connect properly
                const dirX = xOffset - prevX;
                const dirY = yOffset - prevY;
                const dirZ = zOffset - prevZ;
                
                // Create a direction vector
                const dir = new THREE.Vector3(dirX, dirY, dirZ);
                dir.normalize();
                
                // Position at midpoint between previous and current point
                segment.position.x = prevX + dirX / 2;
                segment.position.y = prevY + dirY / 2;
                segment.position.z = prevZ + dirZ / 2;
                
                // Align cylinder with direction
                const axis = new THREE.Vector3(0, 1, 0);
                segment.quaternion.setFromUnitVectors(axis, dir);
                
                group.add(segment);
                
                // Update previous position for next segment
                prevX = xOffset;
                prevY = yOffset;
                prevZ = zOffset;
            }
        }
    }
    
    /**
     * Create foliage for the swamp tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createFoliage(group, size) {
        // Create 5-8 foliage clusters
        const foliageCount = 5 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < foliageCount; i++) {
            // Position foliage at the ends of branches
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.8 + Math.random() * 0.7) * size;
            const height = (1.5 + Math.random() * 1.5) * size;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = height;
            
            // Create a foliage cluster using a modified sphere
            const foliageGeometry = new THREE.SphereGeometry(0.3 * size, 8, 8);
            
            // Get the position attribute to modify vertices
            const positionAttribute = foliageGeometry.getAttribute('position');
            const vertices = [];
            
            // Extract vertices from the buffer attribute
            for (let j = 0; j < positionAttribute.count; j++) {
                vertices.push(new THREE.Vector3(
                    positionAttribute.getX(j),
                    positionAttribute.getY(j),
                    positionAttribute.getZ(j)
                ));
            }
            
            // Modify vertices to create an irregular shape
            for (let j = 0; j < vertices.length; j++) {
                vertices[j].x += (Math.random() - 0.5) * 0.2 * size;
                vertices[j].y += (Math.random() - 0.5) * 0.2 * size;
                vertices[j].z += (Math.random() - 0.5) * 0.2 * size;
            }
            
            // Update the position attribute with modified vertices
            for (let j = 0; j < vertices.length; j++) {
                positionAttribute.setXYZ(j, vertices[j].x, vertices[j].y, vertices[j].z);
            }
            
            positionAttribute.needsUpdate = true;
            foliageGeometry.computeVertexNormals();
            
            // Dark, swampy green color
            const foliageMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x33691E,
                roughness: 1.0,
                metalness: 0.0
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(x, y, z);
            
            group.add(foliage);
        }
    }
    
    /**
     * Create hanging moss/vines for the swamp tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createHangingMoss(group, size) {
        // Create 8-12 hanging moss strands
        const mossCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < mossCount; i++) {
            // Position moss on branches
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.5 + Math.random() * 0.8) * size;
            const height = (1.5 + Math.random() * 1.5) * size;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = height;
            
            // Create a hanging strand using line segments
            const points = [];
            const segments = 5 + Math.floor(Math.random() * 5);
            const mossLength = (0.5 + Math.random() * 0.8) * size;
            const segmentLength = mossLength / segments;
            
            // Start point
            points.push(new THREE.Vector3(x, y, z));
            
            // Create a drooping curve
            let currentX = x;
            let currentY = y;
            let currentZ = z;
            
            for (let j = 1; j <= segments; j++) {
                // Each segment droops and sways slightly
                currentX += (Math.random() - 0.5) * 0.1 * size;
                currentY -= segmentLength;
                currentZ += (Math.random() - 0.5) * 0.1 * size;
                
                points.push(new THREE.Vector3(currentX, currentY, currentZ));
            }
            
            const mossGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const mossMaterial = new THREE.LineBasicMaterial({ 
                color: 0x7CB342,
                linewidth: 2
            });
            
            const moss = new THREE.Line(mossGeometry, mossMaterial);
            group.add(moss);
        }
    }
    
    /**
     * Create exposed roots for the swamp tree
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createRoots(group, size) {
        // Create 4-6 exposed roots
        const rootCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < rootCount; i++) {
            // Determine root direction
            const angle = (i / rootCount) * Math.PI * 2;
            
            // Create root segments
            const segments = 3;
            const rootLength = (0.8 + Math.random() * 0.4) * size;
            const segmentLength = rootLength / segments;
            
            let prevX = 0;
            let prevZ = 0;
            let prevY = 0.1 * size; // Slightly above ground
            
            for (let j = 0; j < segments; j++) {
                // Each segment curves along the ground
                const bendFactor = 0.2 * size;
                const xOffset = prevX + Math.cos(angle) * segmentLength + (Math.random() - 0.5) * bendFactor;
                const zOffset = prevZ + Math.sin(angle) * segmentLength + (Math.random() - 0.5) * bendFactor;
                
                // Roots stay close to the ground
                const yOffset = Math.max(0, prevY - (Math.random() * 0.1) * size);
                
                // Root gets thinner toward the end
                const radius = 0.1 * size * (1 - j * 0.25);
                
                const segmentGeometry = new THREE.CylinderGeometry(
                    radius * 0.8, 
                    radius, 
                    segmentLength, 
                    6
                );
                
                const rootMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x5D4037,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const segment = new THREE.Mesh(segmentGeometry, rootMaterial);
                
                // Calculate position and rotation to connect properly
                const dirX = xOffset - prevX;
                const dirY = yOffset - prevY;
                const dirZ = zOffset - prevZ;
                
                // Create a direction vector
                const dir = new THREE.Vector3(dirX, dirY, dirZ);
                dir.normalize();
                
                // Position at midpoint between previous and current point
                segment.position.x = prevX + dirX / 2;
                segment.position.y = prevY + dirY / 2;
                segment.position.z = prevZ + dirZ / 2;
                
                // Align cylinder with direction
                const axis = new THREE.Vector3(0, 1, 0);
                segment.quaternion.setFromUnitVectors(axis, dir);
                
                group.add(segment);
                
                // Update previous position for next segment
                prevX = xOffset;
                prevY = yOffset;
                prevZ = zOffset;
            }
        }
    }
}