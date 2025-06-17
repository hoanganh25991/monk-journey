import * as THREE from 'three';

/**
 * SpatialGrid class for efficient spatial partitioning and object lookup
 * Extracted from WorldManager for better maintainability
 */
export class SpatialGrid {
    constructor(cellSize = 50) {
        this.grid = new Map(); // Grid-based spatial partitioning
        this.cellSize = cellSize; // Size of each grid cell
    }
    
    /**
     * Add object to spatial grid for faster lookup
     * @param {Object} objectInfo - Object info with position
     */
    addObject(objectInfo) {
        if (!objectInfo.position) return;
        
        // Calculate grid cell coordinates
        const cellX = Math.floor(objectInfo.position.x / this.cellSize);
        const cellZ = Math.floor(objectInfo.position.z / this.cellSize);
        const cellKey = `${cellX},${cellZ}`;
        
        // Get or create cell
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, []);
        }
        
        // Add object to cell
        this.grid.get(cellKey).push(objectInfo);
        
        // Store cell key on object for faster removal
        objectInfo.cellKey = cellKey;
    }
    
    /**
     * Remove object from spatial grid
     * @param {Object} objectInfo - Object info to remove
     */
    removeObject(objectInfo) {
        if (!objectInfo.cellKey) return;
        
        const cell = this.grid.get(objectInfo.cellKey);
        if (!cell) return;
        
        // Remove object from cell
        const index = cell.indexOf(objectInfo);
        if (index !== -1) {
            cell.splice(index, 1);
        }
        
        // Remove cell if empty
        if (cell.length === 0) {
            this.grid.delete(objectInfo.cellKey);
        }
        
        // Clear cell key from object
        delete objectInfo.cellKey;
    }
    
    /**
     * Get objects near a position
     * @param {THREE.Vector3} position - Position to check
     * @param {number} radius - Radius to check
     * @returns {Array} - Array of objects within radius
     */
    getObjectsNear(position, radius) {
        const result = [];
        
        // Calculate cell range to check
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(position.x / this.cellSize);
        const centerCellZ = Math.floor(position.z / this.cellSize);
        
        // Check all cells in range
        for (let x = centerCellX - cellRadius; x <= centerCellX + cellRadius; x++) {
            for (let z = centerCellZ - cellRadius; z <= centerCellZ + cellRadius; z++) {
                const cellKey = `${x},${z}`;
                const cell = this.grid.get(cellKey);
                
                if (cell) {
                    // Filter objects by actual distance
                    cell.forEach(objectInfo => {
                        if (objectInfo.position) {
                            const distance = position.distanceTo(objectInfo.position);
                            if (distance <= radius) {
                                result.push(objectInfo);
                            }
                        }
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Clear all objects from the grid
     */
    clear() {
        this.grid.clear();
    }
    
    /**
     * Get all objects in the grid
     * @returns {Array} - Array of all objects
     */
    getAllObjects() {
        const result = [];
        
        // Collect all objects from all cells
        for (const cell of this.grid.values()) {
            result.push(...cell);
        }
        
        return result;
    }
    
    /**
     * Get statistics about the grid
     * @returns {Object} - Grid statistics
     */
    getStats() {
        let totalObjects = 0;
        let emptyCells = 0;
        let maxObjectsInCell = 0;
        
        for (const cell of this.grid.values()) {
            totalObjects += cell.length;
            if (cell.length === 0) emptyCells++;
            maxObjectsInCell = Math.max(maxObjectsInCell, cell.length);
        }
        
        return {
            cellCount: this.grid.size,
            totalObjects,
            emptyCells,
            maxObjectsInCell,
            averageObjectsPerCell: totalObjects / Math.max(1, this.grid.size)
        };
    }
}