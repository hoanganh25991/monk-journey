import * as THREE from 'three';

// Import path configuration
import { PATH_PATTERNS, PATH_TYPES, PATH_MATERIALS } from '../../config/paths.js';

// Import path types
import { StraightPath } from './StraightPath.js';
import { CurvedPath } from './CurvedPath.js';
import { SpiralPath } from './SpiralPath.js';
import { BranchingPath } from './BranchingPath.js';
import { CircularPath } from './CircularPath.js';
import { NaturalPath } from './NaturalPath.js';

/**
 * Path Factory - Creates path objects based on pattern
 * Centralizes path creation and provides a registry for all types
 */
export class PathFactory {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
        this.registry = new Map();
        
        // Register all path creators
        this.registerPathCreators();
    }
    
    /**
     * Register all path creators
     */
    registerPathCreators() {
        // Register path patterns with dedicated classes
        this.register(PATH_PATTERNS.STRAIGHT, (points, width, options) => 
            new StraightPath(this.scene, this.MapManager).createPath(points, width, options));
            
        this.register(PATH_PATTERNS.CURVED, (points, width, options) => 
            new CurvedPath(this.scene, this.MapManager).createPath(points, width, options));
            
        this.register(PATH_PATTERNS.SPIRAL, (points, width, options) => 
            new SpiralPath(this.scene, this.MapManager).createPath(points, width, options));
            
        this.register(PATH_PATTERNS.BRANCHING, (points, width, options) => 
            new BranchingPath(this.scene, this.MapManager).createPath(points, width, options));
            
        this.register(PATH_PATTERNS.CIRCULAR, (points, width, options) => 
            new CircularPath(this.scene, this.MapManager).createPath(points, width, options));
            
        this.register(PATH_PATTERNS.NATURAL, (points, width, options) => 
            new NaturalPath(this.scene, this.MapManager).createPath(points, width, options));
    }
    
    /**
     * Register a path creator function
     * @param {string} type - Path pattern type
     * @param {Function} creatorFn - Function that creates the path
     */
    register(type, creatorFn) {
        this.registry.set(type, creatorFn);
    }
    
    /**
     * Create a path of the specified pattern
     * @param {string} pattern - Path pattern
     * @param {Array} points - Path points
     * @param {number} width - Path width
     * @param {Object} options - Additional options
     * @returns {THREE.Group} - Path group
     */
    createPath(pattern, points, width, options = {}) {
        // Get the creator function for this pattern
        const creator = this.registry.get(pattern || PATH_PATTERNS.STRAIGHT);
        
        if (creator) {
            return creator(points, width, options);
        } else {
            console.warn(`No path creator registered for pattern: ${pattern}`);
            // Fall back to straight path
            return this.registry.get(PATH_PATTERNS.STRAIGHT)(points, width, options);
        }
    }
}