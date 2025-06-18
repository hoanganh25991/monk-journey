import * as THREE from 'three';

/**
 * AncientStone - Creates an ancient stone with mysterious properties
 */
export class AncientStone {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the ancient stone mesh
     * @param {THREE.Vector3} position - Position of the stone
     * @param {number} size - Size scale of the stone
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The stone group
     */
    createMesh(position, size, data = {}) {
        const stoneGroup = new THREE.Group();
        
        // Determine the stone type
        const stoneType = data.stoneType || Math.floor(Math.random() * 3);
        
        switch (stoneType) {
            case 0: // Monolith
                this.createMonolith(stoneGroup, size);
                break;
            case 1: // Spherical stone
                this.createSphericalStone(stoneGroup, size);
                break;
            case 2: // Irregular stone
            default:
                this.createIrregularStone(stoneGroup, size);
                break;
        }
        
        // Add ancient markings
        this.addAncientMarkings(stoneGroup, size);
        
        // Add a subtle glow effect if specified
        if (data.glowing) {
            this.addGlowEffect(stoneGroup, size);
        }
        
        // Position the entire group
        stoneGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(stoneGroup);
        
        return stoneGroup;
    }
    
    /**
     * Create a monolith-style ancient stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createMonolith(group, size) {
        // Create a tall, rectangular stone
        const monolithGeometry = new THREE.BoxGeometry(0.8 * size, 2.5 * size, 0.8 * size);
        const stoneMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x424242,
            roughness: 0.9,
            metalness: 0.1
        });
        const monolith = new THREE.Mesh(monolithGeometry, stoneMaterial);
        
        // Slightly tilt the monolith for a more natural look
        monolith.rotation.z = (Math.random() - 0.5) * 0.15;
        monolith.rotation.x = (Math.random() - 0.5) * 0.15;
        
        // Position to stand on the ground
        monolith.position.y = 1.25 * size;
        
        group.add(monolith);
    }
    
    /**
     * Create a spherical ancient stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createSphericalStone(group, size) {
        // Create a spherical stone
        const sphereGeometry = new THREE.SphereGeometry(size, 16, 16);
        const stoneMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x424242,
            roughness: 0.9,
            metalness: 0.1
        });
        const sphere = new THREE.Mesh(sphereGeometry, stoneMaterial);
        
        // Position to sit on the ground
        sphere.position.y = size;
        
        group.add(sphere);
        
        // Add a small base/pedestal
        const baseGeometry = new THREE.CylinderGeometry(0.8 * size, 1 * size, 0.3 * size, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x616161 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Position at the bottom
        base.position.y = 0.15 * size;
        
        group.add(base);
    }
    
    /**
     * Create an irregular ancient stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createIrregularStone(group, size) {
        // Create an irregular stone using a modified box geometry
        const geometry = new THREE.BoxGeometry(size, 1.5 * size, size);
        
        // Get the position attribute to modify vertices
        const positionAttribute = geometry.getAttribute('position');
        const vertices = [];
        
        // Extract vertices from the buffer attribute
        for (let i = 0; i < positionAttribute.count; i++) {
            vertices.push(new THREE.Vector3(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            ));
        }
        
        // Modify vertices to create an irregular shape
        for (let i = 0; i < vertices.length; i++) {
            // Don't modify bottom vertices too much to keep it stable
            if (vertices[i].y > -0.5) {
                vertices[i].x += (Math.random() - 0.5) * 0.4 * size;
                vertices[i].y += (Math.random() - 0.5) * 0.4 * size;
                vertices[i].z += (Math.random() - 0.5) * 0.4 * size;
            }
        }
        
        // Update the position attribute with modified vertices
        for (let i = 0; i < vertices.length; i++) {
            positionAttribute.setXYZ(i, vertices[i].x, vertices[i].y, vertices[i].z);
        }
        
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const stoneMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x424242,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const stone = new THREE.Mesh(geometry, stoneMaterial);
        
        // Position to sit on the ground
        stone.position.y = 0.75 * size;
        
        group.add(stone);
    }
    
    /**
     * Add ancient markings to the stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addAncientMarkings(group, size) {
        // Create markings using line segments
        const markingMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFFD700,
            linewidth: 2
        });
        
        // Define some simple marking patterns
        const markingPatterns = [
            // Circular pattern
            () => {
                const points = [];
                const segments = 16;
                const radius = 0.3 * size;
                
                for (let i = 0; i <= segments; i++) {
                    const theta = (i / segments) * Math.PI * 2;
                    points.push(new THREE.Vector3(
                        Math.cos(theta) * radius,
                        Math.sin(theta) * radius,
                        0.41 * size
                    ));
                }
                
                return points;
            },
            
            // Spiral pattern
            () => {
                const points = [];
                const segments = 32;
                const maxRadius = 0.4 * size;
                
                for (let i = 0; i <= segments; i++) {
                    const theta = (i / segments) * Math.PI * 6;
                    const radius = (i / segments) * maxRadius;
                    points.push(new THREE.Vector3(
                        Math.cos(theta) * radius,
                        Math.sin(theta) * radius,
                        0.41 * size
                    ));
                }
                
                return points;
            },
            
            // Grid pattern
            () => {
                const points = [];
                const gridSize = 3;
                const spacing = 0.2 * size;
                
                // Horizontal lines
                for (let i = 0; i < gridSize; i++) {
                    const y = (i - (gridSize - 1) / 2) * spacing;
                    points.push(new THREE.Vector3(-spacing * (gridSize - 1) / 2, y, 0.41 * size));
                    points.push(new THREE.Vector3(spacing * (gridSize - 1) / 2, y, 0.41 * size));
                }
                
                // Vertical lines
                for (let i = 0; i < gridSize; i++) {
                    const x = (i - (gridSize - 1) / 2) * spacing;
                    points.push(new THREE.Vector3(x, -spacing * (gridSize - 1) / 2, 0.41 * size));
                    points.push(new THREE.Vector3(x, spacing * (gridSize - 1) / 2, 0.41 * size));
                }
                
                return points;
            }
        ];
        
        // Add 1-3 marking patterns to the stone
        const markingCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < markingCount; i++) {
            // Select a random marking pattern
            const patternFunc = markingPatterns[Math.floor(Math.random() * markingPatterns.length)];
            const points = patternFunc();
            
            // Position the marking on the stone
            const yOffset = (i - markingCount/2) * 0.8 * size;
            const transformedPoints = points.map(p => {
                return new THREE.Vector3(p.x, p.y + yOffset, p.z);
            });
            
            const markingGeometry = new THREE.BufferGeometry().setFromPoints(transformedPoints);
            const marking = new THREE.Line(markingGeometry, markingMaterial);
            
            group.add(marking);
        }
    }
    
    /**
     * Add a subtle glow effect to the stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addGlowEffect(group, size) {
        // Add a point light for the glow effect
        const light = new THREE.PointLight(0xFFD700, 1, 3 * size);
        light.position.set(0, size, 0);
        
        group.add(light);
    }
}