import * as THREE from 'three';

/**
 * BrokenColumn - Creates a broken ancient column
 */
export class BrokenColumn {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the broken column mesh
     * @param {THREE.Vector3} position - Position of the column
     * @param {number} size - Size scale of the column
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The column group
     */
    createMesh(position, size, data = {}) {
        const columnGroup = new THREE.Group();
        
        // Determine how much of the column remains standing (25-75%)
        const remainingHeight = data.remainingHeight || (0.25 + Math.random() * 0.5);
        
        // Create the base of the column
        const baseGeometry = new THREE.CylinderGeometry(0.6 * size, 0.7 * size, 0.3 * size, 16);
        const stoneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE0E0E0,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = 0.15 * size;
        columnGroup.add(base);
        
        // Create the shaft of the column
        const fullHeight = 3 * size;
        const shaftHeight = fullHeight * remainingHeight;
        const shaftGeometry = new THREE.CylinderGeometry(0.4 * size, 0.5 * size, shaftHeight, 16);
        const shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
        shaft.position.y = 0.15 * size + (shaftHeight / 2);
        columnGroup.add(shaft);
        
        // Create the broken top with jagged edge
        this.createBrokenTop(columnGroup, size, 0.15 * size + shaftHeight, 0.4 * size);
        
        // Create fallen pieces on the ground
        this.createFallenPieces(columnGroup, size, fullHeight - shaftHeight);
        
        // Add some weathering details
        this.addWeatheringDetails(columnGroup, size, shaftHeight);
        
        // Position the entire group
        columnGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(columnGroup);
        
        return columnGroup;
    }
    
    /**
     * Create a broken top for the column with a jagged edge
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} yPosition - Y position of the break
     * @param {number} radius - Radius of the column at the break point
     */
    createBrokenTop(group, size, yPosition, radius) {
        // Create a jagged top using multiple small cylinders of varying heights
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        
        for (let i = 0; i < segments; i++) {
            // Vary the height of each segment to create a jagged appearance
            const segmentHeight = (0.05 + Math.random() * 0.15) * size;
            
            // Create a small cylinder for each segment
            const segmentGeometry = new THREE.CylinderGeometry(
                radius / 4, radius / 4, 
                segmentHeight, 
                4, 1, 
                false,
                i * segmentAngle, segmentAngle
            );
            
            const stoneMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xE0E0E0,
                roughness: 0.7,
                metalness: 0.1
            });
            
            const segment = new THREE.Mesh(segmentGeometry, stoneMaterial);
            
            // Position at the top of the column
            segment.position.y = yPosition + (segmentHeight / 2);
            
            group.add(segment);
        }
    }
    
    /**
     * Create fallen pieces of the column on the ground
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} fallenHeight - Height of the fallen portion
     */
    createFallenPieces(group, size, fallenHeight) {
        // Create 3-5 fallen pieces
        const pieceCount = 3 + Math.floor(Math.random() * 3);
        
        // Distribute the fallen height among the pieces
        let remainingHeight = fallenHeight;
        
        for (let i = 0; i < pieceCount && remainingHeight > 0; i++) {
            // Determine the size of this piece
            const pieceHeight = Math.min(remainingHeight, (0.3 + Math.random() * 0.7) * size);
            remainingHeight -= pieceHeight;
            
            // Create the piece
            const pieceGeometry = new THREE.CylinderGeometry(0.4 * size, 0.4 * size, pieceHeight, 16);
            const stoneMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xE0E0E0,
                roughness: 0.7,
                metalness: 0.1
            });
            const piece = new THREE.Mesh(pieceGeometry, stoneMaterial);
            
            // Position the piece on the ground, scattered around the column
            const angle = Math.random() * Math.PI * 2;
            const distance = (0.8 + Math.random() * 1.5) * size;
            
            piece.position.x = Math.cos(angle) * distance;
            piece.position.z = Math.sin(angle) * distance;
            piece.position.y = pieceHeight / 2; // Half height to sit on ground
            
            // Rotate the piece to look like it fell
            piece.rotation.x = (Math.random() - 0.5) * Math.PI / 2;
            piece.rotation.z = (Math.random() - 0.5) * Math.PI / 2;
            
            group.add(piece);
        }
    }
    
    /**
     * Add weathering details to the column
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} shaftHeight - Height of the column shaft
     */
    addWeatheringDetails(group, size, shaftHeight) {
        // Add cracks using line segments
        const crackMaterial = new THREE.LineBasicMaterial({ color: 0x616161 });
        
        // Create several cracks on the column
        for (let i = 0; i < 5; i++) {
            const startY = Math.random() * shaftHeight;
            const startAngle = Math.random() * Math.PI * 2;
            
            const points = [];
            
            // Start point on the column surface
            const startPoint = new THREE.Vector3(
                Math.cos(startAngle) * 0.4 * size,
                startY,
                Math.sin(startAngle) * 0.4 * size
            );
            
            points.push(startPoint);
            
            // Add 3-5 points to create a jagged crack
            const segments = 3 + Math.floor(Math.random() * 3);
            let currentY = startY;
            let currentAngle = startAngle;
            
            for (let j = 0; j < segments; j++) {
                // Move down the column
                currentY -= (Math.random() * 0.2) * size;
                // Vary the angle slightly
                currentAngle += (Math.random() - 0.5) * 0.5;
                
                if (currentY < 0) break;
                
                points.push(new THREE.Vector3(
                    Math.cos(currentAngle) * 0.4 * size,
                    currentY,
                    Math.sin(currentAngle) * 0.4 * size
                ));
            }
            
            const crackGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const crack = new THREE.Line(crackGeometry, crackMaterial);
            
            group.add(crack);
        }
    }
}