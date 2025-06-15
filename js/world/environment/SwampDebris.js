import * as THREE from 'three';

/**
 * SwampDebris - Creates various debris objects for swamp environments
 */
export class SwampDebris {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the swamp debris mesh
     * @param {THREE.Vector3} position - Position of the debris
     * @param {number} size - Size scale of the debris
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The debris group
     */
    createMesh(position, size, data = {}) {
        const debrisGroup = new THREE.Group();
        
        // Determine the type of debris
        const debrisType = data.debrisType || Math.floor(Math.random() * 4);
        
        switch (debrisType) {
            case 0: // Fallen log with moss
                this.createFallenLog(debrisGroup, size);
                break;
            case 1: // Pile of sticks and leaves
                this.createStickPile(debrisGroup, size);
                break;
            case 2: // Rotting stump
                this.createRottingStump(debrisGroup, size);
                break;
            case 3: // Mud and debris pile
            default:
                this.createMudPile(debrisGroup, size);
                break;
        }
        
        // Position the entire group
        debrisGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(debrisGroup);
        
        return debrisGroup;
    }
    
    /**
     * Create a fallen log with moss
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createFallenLog(group, size) {
        // Create the main log
        const logGeometry = new THREE.CylinderGeometry(0.3 * size, 0.25 * size, 2 * size, 8);
        const logMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4E342E,
            roughness: 0.9,
            metalness: 0.1
        });
        const log = new THREE.Mesh(logGeometry, logMaterial);
        
        // Rotate to lie on the ground
        log.rotation.z = Math.PI / 2;
        // Random rotation around vertical axis
        log.rotation.y = Math.random() * Math.PI;
        
        // Position slightly above ground
        log.position.y = 0.2 * size;
        
        group.add(log);
        
        // Add moss patches
        const mossCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < mossCount; i++) {
            // Create a moss patch using a modified plane
            const mossGeometry = new THREE.PlaneGeometry(0.3 * size, 0.3 * size);
            const mossMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x33691E,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            
            // Position on the log
            const angle = Math.random() * Math.PI * 2;
            const axialPosition = (Math.random() - 0.5) * 1.8 * size;
            
            moss.position.x = axialPosition;
            moss.position.y = 0.2 * size + Math.cos(angle) * 0.3 * size;
            moss.position.z = Math.sin(angle) * 0.3 * size;
            
            // Rotate to follow log surface
            moss.rotation.z = Math.PI / 2;
            moss.rotation.x = angle;
            
            group.add(moss);
        }
        
        // Add some small mushrooms
        const mushroomCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < mushroomCount; i++) {
            // Create a small mushroom
            const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.1 * size, 8);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Create cap
            const capGeometry = new THREE.SphereGeometry(0.05 * size, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const capMaterial = new THREE.MeshLambertMaterial({ color: 0x795548 });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = 0.05 * size;
            
            // Create a mushroom group
            const mushroom = new THREE.Group();
            mushroom.add(stem);
            mushroom.add(cap);
            
            // Position on the log
            const angle = Math.random() * Math.PI * 2;
            const axialPosition = (Math.random() - 0.5) * 1.8 * size;
            
            mushroom.position.x = axialPosition;
            mushroom.position.y = 0.2 * size + Math.cos(angle) * 0.3 * size;
            mushroom.position.z = Math.sin(angle) * 0.3 * size;
            
            // Rotate to grow perpendicular to log surface
            mushroom.rotation.z = Math.PI / 2;
            mushroom.rotation.x = angle;
            
            group.add(mushroom);
        }
    }
    
    /**
     * Create a pile of sticks and leaves
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createStickPile(group, size) {
        // Create a base mound for the pile
        const moundGeometry = new THREE.SphereGeometry(0.5 * size, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const moundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x33691E,
            roughness: 1.0,
            metalness: 0.0
        });
        const mound = new THREE.Mesh(moundGeometry, moundMaterial);
        
        // Flatten the mound
        mound.scale.y = 0.3;
        
        // Position on the ground
        mound.position.y = 0.15 * size;
        
        group.add(mound);
        
        // Add sticks
        const stickCount = 10 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < stickCount; i++) {
            // Create a stick
            const stickLength = (0.3 + Math.random() * 0.7) * size;
            const stickGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, stickLength, 4);
            const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            
            // Position randomly in the pile
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4 * size;
            
            stick.position.x = Math.cos(angle) * radius;
            stick.position.z = Math.sin(angle) * radius;
            stick.position.y = 0.2 * size + Math.random() * 0.1 * size;
            
            // Random rotation
            stick.rotation.x = (Math.random() - 0.5) * Math.PI;
            stick.rotation.z = (Math.random() - 0.5) * Math.PI;
            
            group.add(stick);
        }
        
        // Add leaves
        const leafCount = 15 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < leafCount; i++) {
            // Create a leaf using a plane
            const leafSize = (0.1 + Math.random() * 0.1) * size;
            const leafGeometry = new THREE.PlaneGeometry(leafSize, leafSize * 1.5);
            
            // Vary leaf colors
            const leafColors = [
                0x33691E, // Dark green
                0x558B2F, // Medium green
                0x827717, // Olive
                0x4E342E  // Brown (dead leaf)
            ];
            
            const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
            
            const leafMaterial = new THREE.MeshLambertMaterial({ 
                color: leafColor,
                side: THREE.DoubleSide
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position randomly in the pile
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5 * size;
            
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = 0.15 * size + Math.random() * 0.2 * size;
            
            // Random rotation
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI;
            leaf.rotation.z = Math.random() * Math.PI;
            
            group.add(leaf);
        }
    }
    
    /**
     * Create a rotting stump
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createRottingStump(group, size) {
        // Create the main stump
        const stumpGeometry = new THREE.CylinderGeometry(0.4 * size, 0.5 * size, 0.8 * size, 12);
        const stumpMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4E342E,
            roughness: 0.9,
            metalness: 0.1
        });
        const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
        
        // Position on the ground
        stump.position.y = 0.4 * size;
        
        group.add(stump);
        
        // Create a hollow in the stump
        const hollowGeometry = new THREE.CylinderGeometry(0.25 * size, 0.25 * size, 0.5 * size, 12);
        const hollowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x1A1A1A,
            side: THREE.BackSide
        });
        const hollow = new THREE.Mesh(hollowGeometry, hollowMaterial);
        
        // Position inside the stump
        hollow.position.y = 0.5 * size;
        
        group.add(hollow);
        
        // Add moss and fungi
        this.addMossAndFungi(group, size, stump.position);
        
        // Add some debris inside the hollow
        const debrisCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < debrisCount; i++) {
            // Create small debris pieces
            const debrisGeometry = new THREE.BoxGeometry(0.05 * size, 0.05 * size, 0.05 * size);
            const debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            // Position inside the hollow
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2 * size;
            
            debris.position.x = Math.cos(angle) * radius;
            debris.position.z = Math.sin(angle) * radius;
            debris.position.y = 0.2 * size + Math.random() * 0.1 * size;
            
            // Random rotation
            debris.rotation.x = Math.random() * Math.PI;
            debris.rotation.y = Math.random() * Math.PI;
            debris.rotation.z = Math.random() * Math.PI;
            
            group.add(debris);
        }
    }
    
    /**
     * Create a mud and debris pile
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createMudPile(group, size) {
        // Create the mud pile
        const mudGeometry = new THREE.SphereGeometry(0.6 * size, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const mudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3E2723,
            roughness: 1.0,
            metalness: 0.0
        });
        const mud = new THREE.Mesh(mudGeometry, mudMaterial);
        
        // Flatten the mud pile
        mud.scale.y = 0.3;
        
        // Position on the ground
        mud.position.y = 0.18 * size;
        
        group.add(mud);
        
        // Add various debris items
        this.addDebrisItems(group, size);
    }
    
    /**
     * Add moss and fungi to a surface
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {THREE.Vector3} position - Position to center around
     */
    addMossAndFungi(group, size, position) {
        // Add moss patches
        const mossCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < mossCount; i++) {
            // Create a moss patch
            const mossGeometry = new THREE.CircleGeometry(0.15 * size, 8);
            const mossMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x33691E,
                side: THREE.DoubleSide
            });
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            
            // Position on the surface
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.4 * size;
            const height = position.y + (Math.random() - 0.5) * 0.3 * size;
            
            moss.position.x = Math.cos(angle) * radius;
            moss.position.z = Math.sin(angle) * radius;
            moss.position.y = height;
            
            // Rotate to follow surface
            moss.rotation.x = Math.PI / 2;
            moss.rotation.y = Math.random() * Math.PI;
            
            group.add(moss);
        }
        
        // Add fungi
        const fungiCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < fungiCount; i++) {
            // Create a fungus
            const fungiGeometry = new THREE.SphereGeometry(0.1 * size, 8, 8);
            const fungiMaterial = new THREE.MeshLambertMaterial({ color: 0xD7CCC8 });
            const fungi = new THREE.Mesh(fungiGeometry, fungiMaterial);
            
            // Position on the surface
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.4 * size;
            const height = position.y + (Math.random() - 0.5) * 0.3 * size;
            
            fungi.position.x = Math.cos(angle) * radius;
            fungi.position.z = Math.sin(angle) * radius;
            fungi.position.y = height;
            
            // Flatten the fungi to look like shelf fungi
            fungi.scale.y = 0.3;
            
            // Rotate to attach to surface
            fungi.rotation.x = Math.PI / 2;
            fungi.rotation.z = angle;
            
            group.add(fungi);
        }
    }
    
    /**
     * Add various debris items to a pile
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addDebrisItems(group, size) {
        // Add sticks
        const stickCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < stickCount; i++) {
            // Create a stick
            const stickLength = (0.3 + Math.random() * 0.5) * size;
            const stickGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, stickLength, 4);
            const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            
            // Position in the mud
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5 * size;
            
            stick.position.x = Math.cos(angle) * radius;
            stick.position.z = Math.sin(angle) * radius;
            stick.position.y = 0.2 * size + Math.random() * 0.1 * size;
            
            // Random rotation
            stick.rotation.x = (Math.random() - 0.5) * Math.PI;
            stick.rotation.z = (Math.random() - 0.5) * Math.PI;
            
            group.add(stick);
        }
        
        // Add leaves
        const leafCount = 8 + Math.floor(Math.random() * 7);
        
        for (let i = 0; i < leafCount; i++) {
            // Create a leaf
            const leafSize = (0.1 + Math.random() * 0.1) * size;
            const leafGeometry = new THREE.PlaneGeometry(leafSize, leafSize * 1.5);
            
            // Mostly dead leaves in mud
            const leafColors = [
                0x4E342E, // Brown
                0x3E2723, // Dark brown
                0x5D4037, // Medium brown
                0x33691E  // Occasional green
            ];
            
            const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
            
            const leafMaterial = new THREE.MeshLambertMaterial({ 
                color: leafColor,
                side: THREE.DoubleSide
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position in the mud
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5 * size;
            
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = 0.2 * size + Math.random() * 0.05 * size;
            
            // Random rotation
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI;
            leaf.rotation.z = Math.random() * Math.PI;
            
            group.add(leaf);
        }
        
        // Add small rocks
        const rockCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < rockCount; i++) {
            // Create a rock
            const rockGeometry = new THREE.SphereGeometry(0.1 * size, 6, 6);
            
            // Modify vertices to create irregular shape
            const positionAttribute = rockGeometry.getAttribute('position');
            const vertices = [];
            
            for (let j = 0; j < positionAttribute.count; j++) {
                vertices.push(new THREE.Vector3(
                    positionAttribute.getX(j),
                    positionAttribute.getY(j),
                    positionAttribute.getZ(j)
                ));
            }
            
            for (let j = 0; j < vertices.length; j++) {
                vertices[j].x += (Math.random() - 0.5) * 0.05 * size;
                vertices[j].y += (Math.random() - 0.5) * 0.05 * size;
                vertices[j].z += (Math.random() - 0.5) * 0.05 * size;
            }
            
            for (let j = 0; j < vertices.length; j++) {
                positionAttribute.setXYZ(j, vertices[j].x, vertices[j].y, vertices[j].z);
            }
            
            positionAttribute.needsUpdate = true;
            rockGeometry.computeVertexNormals();
            
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x757575 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Position in the mud
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4 * size;
            
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = 0.2 * size + Math.random() * 0.05 * size;
            
            // Random rotation
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            
            group.add(rock);
        }
    }
}