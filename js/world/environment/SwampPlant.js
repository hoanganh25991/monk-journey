import * as THREE from 'three';

/**
 * SwampPlant - Creates various plant types suitable for swamp environments
 */
export class SwampPlant {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the swamp plant mesh
     * @param {THREE.Vector3} position - Position of the plant
     * @param {number} size - Size scale of the plant
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The plant group
     */
    createMesh(position, size, data = {}) {
        const plantGroup = new THREE.Group();
        
        // Determine the type of swamp plant
        const plantType = data.plantType || Math.floor(Math.random() * 4);
        
        switch (plantType) {
            case 0: // Cattails
                this.createCattails(plantGroup, size);
                break;
            case 1: // Ferns
                this.createSwampFern(plantGroup, size);
                break;
            case 2: // Reeds
                this.createReeds(plantGroup, size);
                break;
            case 3: // Pitcher plants
            default:
                this.createPitcherPlants(plantGroup, size);
                break;
        }
        
        // Position the entire group
        plantGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(plantGroup);
        
        return plantGroup;
    }
    
    /**
     * Create cattails
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createCattails(group, size) {
        // Create 3-7 cattails
        const cattailCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < cattailCount; i++) {
            // Create a cattail stem
            const stemHeight = (1 + Math.random() * 0.5) * size;
            const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, stemHeight, 8);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x33691E });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Create the cattail head
            const headGeometry = new THREE.CylinderGeometry(0.04 * size, 0.04 * size, 0.3 * size, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            
            // Position the head at the top of the stem
            head.position.y = stemHeight / 2 - 0.05 * size;
            
            // Create a cattail group
            const cattail = new THREE.Group();
            cattail.add(stem);
            cattail.add(head);
            
            // Position within the cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3 * size;
            
            cattail.position.x = Math.cos(angle) * radius;
            cattail.position.z = Math.sin(angle) * radius;
            cattail.position.y = stemHeight / 2;
            
            // Slight random tilt
            cattail.rotation.x = (Math.random() - 0.5) * 0.2;
            cattail.rotation.z = (Math.random() - 0.5) * 0.2;
            
            group.add(cattail);
            
            // Add a leaf or two to each cattail
            const leafCount = 1 + Math.floor(Math.random() * 2);
            
            for (let j = 0; j < leafCount; j++) {
                // Create a long, thin leaf
                const leafGeometry = new THREE.PlaneGeometry(0.05 * size, stemHeight * 0.8);
                const leafMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x558B2F,
                    side: THREE.DoubleSide
                });
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                
                // Position the leaf on the stem
                leaf.position.y = (Math.random() - 0.3) * stemHeight * 0.4;
                
                // Rotate the leaf outward
                const leafAngle = Math.random() * Math.PI * 2;
                leaf.rotation.x = Math.PI / 2;
                leaf.rotation.y = leafAngle;
                
                // Add a slight curve to the leaf
                leaf.rotation.z = Math.PI / 6;
                
                cattail.add(leaf);
            }
        }
    }
    
    /**
     * Create swamp ferns
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createSwampFern(group, size) {
        // Create a cluster of 3-5 ferns
        const fernCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < fernCount; i++) {
            // Create a fern group
            const fern = new THREE.Group();
            
            // Create 5-9 fronds per fern
            const frondCount = 5 + Math.floor(Math.random() * 5);
            
            for (let j = 0; j < frondCount; j++) {
                // Create a frond using a custom shape
                this.createFernFrond(fern, size, j / frondCount);
            }
            
            // Position within the cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3 * size;
            
            fern.position.x = Math.cos(angle) * radius;
            fern.position.z = Math.sin(angle) * radius;
            
            // Random rotation
            fern.rotation.y = Math.random() * Math.PI * 2;
            
            group.add(fern);
        }
    }
    
    /**
     * Create a single fern frond
     * @param {THREE.Group} fernGroup - The fern group to add to
     * @param {number} size - Size scale
     * @param {number} angleRatio - Position around the fern (0-1)
     */
    createFernFrond(fernGroup, size, angleRatio) {
        // Create a curved frond with leaflets
        const frondLength = (0.6 + Math.random() * 0.4) * size;
        const frondAngle = angleRatio * Math.PI * 2;
        
        // Create the main stem of the frond
        const points = [];
        const segments = 10;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = t * frondLength * Math.cos(frondAngle);
            const z = t * frondLength * Math.sin(frondAngle);
            
            // Add a curve that starts flat and curves upward
            const y = 0.5 * size * Math.sin(t * Math.PI / 2);
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const stemGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const stemMaterial = new THREE.LineBasicMaterial({ 
            color: 0x33691E,
            linewidth: 2
        });
        
        const stem = new THREE.Line(stemGeometry, stemMaterial);
        fernGroup.add(stem);
        
        // Add leaflets along the frond
        const leafletCount = Math.min(12, points.length - 1);
        
        for (let i = 1; i < leafletCount; i++) {
            const t = i / leafletCount;
            
            // Skip the very base of the frond
            if (t < 0.1) continue;
            
            // Leaflets get smaller toward the tip
            const leafletSize = (0.2 - 0.15 * t) * size;
            
            // Create left and right leaflets
            // Ensure we don't exceed the points array bounds
            const pointIndex = Math.min(i, points.length - 1);
            this.createFernLeaflet(fernGroup, points[pointIndex], frondAngle, leafletSize, true);
            this.createFernLeaflet(fernGroup, points[pointIndex], frondAngle, leafletSize, false);
        }
    }
    
    /**
     * Create a single fern leaflet
     * @param {THREE.Group} fernGroup - The fern group to add to
     * @param {THREE.Vector3} position - Position on the frond
     * @param {number} frondAngle - Angle of the main frond
     * @param {number} size - Size of the leaflet
     * @param {boolean} isLeft - Whether this is a left or right leaflet
     */
    createFernLeaflet(fernGroup, position, frondAngle, size, isLeft) {
        // Safety check for position
        if (!position || position.x === undefined || position.y === undefined || position.z === undefined) {
            console.warn('SwampPlant: Invalid position provided to createFernLeaflet');
            return;
        }
        
        // Create a tapered rectangle for the leaflet
        const leafletGeometry = new THREE.PlaneGeometry(size, size * 0.3);
        const leafletMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x558B2F,
            side: THREE.DoubleSide
        });
        const leaflet = new THREE.Mesh(leafletGeometry, leafletMaterial);
        
        // Position at the point on the frond
        leaflet.position.copy(position);
        
        // Rotate to face outward from the frond
        const sideAngle = frondAngle + (isLeft ? Math.PI / 2 : -Math.PI / 2);
        leaflet.rotation.z = sideAngle;
        
        // Tilt slightly upward
        leaflet.rotation.x = Math.PI / 2 - 0.3;
        
        fernGroup.add(leaflet);
    }
    
    /**
     * Create reeds
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createReeds(group, size) {
        // Create 8-15 reeds
        const reedCount = 8 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < reedCount; i++) {
            // Create a reed stem
            const reedHeight = (0.8 + Math.random() * 0.7) * size;
            const reedGeometry = new THREE.CylinderGeometry(0.01 * size, 0.02 * size, reedHeight, 6);
            const reedMaterial = new THREE.MeshLambertMaterial({ color: 0x7CB342 });
            const reed = new THREE.Mesh(reedGeometry, reedMaterial);
            
            // Position within the cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4 * size;
            
            reed.position.x = Math.cos(angle) * radius;
            reed.position.z = Math.sin(angle) * radius;
            reed.position.y = reedHeight / 2;
            
            // Slight random tilt
            reed.rotation.x = (Math.random() - 0.5) * 0.3;
            reed.rotation.z = (Math.random() - 0.5) * 0.3;
            
            group.add(reed);
        }
    }
    
    /**
     * Create pitcher plants
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    createPitcherPlants(group, size) {
        // Create 3-6 pitcher plants
        const plantCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < plantCount; i++) {
            // Create a pitcher plant group
            const pitcher = new THREE.Group();
            
            // Create the main pitcher tube
            const pitcherHeight = (0.4 + Math.random() * 0.3) * size;
            
            // Use a custom geometry to create the pitcher shape
            const pitcherPoints = [];
            
            // Bottom point
            pitcherPoints.push(new THREE.Vector2(0, 0));
            
            // Bulge out in the middle
            const segments = 10;
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                
                // Create a bulging profile
                let radius;
                if (t < 0.7) {
                    // Bulge out in the lower part
                    radius = 0.05 * size * (1 + 2 * Math.sin(t * Math.PI));
                } else {
                    // Taper at the top
                    const topT = (t - 0.7) / 0.3;
                    radius = 0.05 * size * (1 + 2 * Math.sin(0.7 * Math.PI)) * (1 - 0.5 * topT);
                }
                
                pitcherPoints.push(new THREE.Vector2(radius, t * pitcherHeight));
            }
            
            // Top point
            pitcherPoints.push(new THREE.Vector2(0.08 * size, pitcherHeight));
            
            // Create the pitcher geometry
            const pitcherShape = new THREE.LatheGeometry(pitcherPoints, 12);
            
            // Choose a color for the pitcher
            const pitcherColors = [
                0x8BC34A, // Light green
                0x4CAF50, // Green
                0xAED581, // Pale green
                0xF44336  // Red (for some varieties)
            ];
            
            const pitcherColor = pitcherColors[Math.floor(Math.random() * pitcherColors.length)];
            
            const pitcherMaterial = new THREE.MeshLambertMaterial({ color: pitcherColor });
            const pitcherMesh = new THREE.Mesh(pitcherShape, pitcherMaterial);
            
            // Add some veins/texture to the pitcher
            this.addPitcherVeins(pitcher, pitcherHeight, size, pitcherColor);
            
            pitcher.add(pitcherMesh);
            
            // Create a lid for the pitcher
            const lidGeometry = new THREE.CircleGeometry(0.1 * size, 8);
            const lidMaterial = new THREE.MeshLambertMaterial({ 
                color: pitcherColor,
                side: THREE.DoubleSide
            });
            const lid = new THREE.Mesh(lidGeometry, lidMaterial);
            
            // Position the lid at the top of the pitcher
            lid.position.y = pitcherHeight;
            
            // Rotate the lid to hang over the opening
            lid.rotation.x = Math.PI / 2 - 0.8;
            
            pitcher.add(lid);
            
            // Position within the cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3 * size;
            
            pitcher.position.x = Math.cos(angle) * radius;
            pitcher.position.z = Math.sin(angle) * radius;
            
            // Slight random tilt
            pitcher.rotation.x = (Math.random() - 0.5) * 0.2;
            pitcher.rotation.z = (Math.random() - 0.5) * 0.2;
            
            group.add(pitcher);
        }
    }
    
    /**
     * Add veins/texture to a pitcher plant
     * @param {THREE.Group} pitcher - The pitcher group to add to
     * @param {number} height - Height of the pitcher
     * @param {number} size - Size scale
     * @param {number} baseColor - Base color of the pitcher
     */
    addPitcherVeins(pitcher, height, size, baseColor) {
        // Create veins using line segments
        const veinColor = new THREE.Color(baseColor);
        veinColor.offsetHSL(0, 0, -0.2); // Darker version of the base color
        
        const veinMaterial = new THREE.LineBasicMaterial({ 
            color: veinColor,
            linewidth: 1
        });
        
        // Create vertical veins
        const veinCount = 8;
        
        for (let i = 0; i < veinCount; i++) {
            const angle = (i / veinCount) * Math.PI * 2;
            
            const points = [];
            const segments = 10;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                
                // Follow the contour of the pitcher
                let radius;
                if (t < 0.7) {
                    // Bulge out in the lower part
                    radius = 0.05 * size * (1 + 2 * Math.sin(t * Math.PI));
                } else {
                    // Taper at the top
                    const topT = (t - 0.7) / 0.3;
                    radius = 0.05 * size * (1 + 2 * Math.sin(0.7 * Math.PI)) * (1 - 0.5 * topT);
                }
                
                // Add some waviness to the veins
                const waveFactor = 0.01 * size * Math.sin(t * Math.PI * 4);
                
                points.push(new THREE.Vector3(
                    (radius + waveFactor) * Math.cos(angle),
                    t * height,
                    (radius + waveFactor) * Math.sin(angle)
                ));
            }
            
            const veinGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const vein = new THREE.Line(veinGeometry, veinMaterial);
            
            pitcher.add(vein);
        }
    }
}