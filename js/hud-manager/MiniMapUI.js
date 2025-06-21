import { UIComponent } from '../UIComponent.js';
import * as THREE from 'three';
import { STRUCTURE_OBJECTS, STRUCTURE_PROPERTIES } from '../config/structure.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';

/**
 * Mini Map UI component
 * Displays a simplified top-down view of the game world
 * 
 * Features:
 * - Shows player position and direction
 * - Shows remote players
 * - Shows enemies
 * - Shows large structures (towers, villages)
 * - Shows teleport portals with animated effects
 * - Includes grid and cardinal directions (N, E, S, W)
 */
export class MiniMapUI extends UIComponent {
    /**
     * Create a new MiniMapUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('mini-map', game);
        this.mapElement = null;
        this.canvas = null;
        this.ctx = null;
        
        // Adjust map size based on device
        this.mapSize = this.mobile ? 120 : 200; // Smaller size on mobile
        this.canvasSize = this.mapSize; // Canvas size matches map size
        this.scale = 1; // Scale factor for world coverage
        this.lastRenderTime = 0;
        this.renderInterval = 250; // Render every 250ms for better performance
        
        // For map dragging
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        this.maxMapOffset = 100; // Maximum map offset in any direction
        
        // For map zooming
        this.minScale = 0.5; // Minimum zoom level
        this.maxScale = 3.0; // Maximum zoom level
        this.defaultScale = 1.0; // Default zoom level
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // We don't need to render the template as it's already in the HTML
        // Just update the canvas size
        const canvas = document.getElementById('mini-map-canvas');
        if (canvas) {
            canvas.width = this.canvasSize;
            canvas.height = this.canvasSize;
        }
        
        // Store references to elements we need to update
        this.mapElement = document.getElementById('mini-map');
        this.canvas = document.getElementById('mini-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add event listeners for map dragging
        this.canvas.addEventListener('mousedown', this.onMapDragStart.bind(this));
        this.canvas.addEventListener('touchstart', this.onMapDragStart.bind(this), { passive: false });
        
        window.addEventListener('mousemove', this.onMapDragMove.bind(this));
        window.addEventListener('touchmove', this.onMapDragMove.bind(this), { passive: false });
        
        window.addEventListener('mouseup', this.onMapDragEnd.bind(this));
        window.addEventListener('touchend', this.onMapDragEnd.bind(this));
        
        // Add event listeners for map zooming
        const zoomInBtn = document.getElementById('mini-map-zoom-in-btn');
        const zoomOutBtn = document.getElementById('mini-map-zoom-out-btn');
        const centerBtn = document.getElementById('mini-map-center-btn');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                this.decreaseScale(); // Zoom in (decrease scale)
                e.stopPropagation();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', (e) => {
                this.increaseScale(); // Zoom out (increase scale)
                e.stopPropagation();
            });
        }
        
        if (centerBtn) {
            centerBtn.addEventListener('click', (e) => {
                this.resetMapPosition(); // Center the map
                e.stopPropagation();
            });
        }
        
        // Add wheel event for zooming
        this.canvas.addEventListener('wheel', (e) => {
            if (e.deltaY < 0) {
                // Scroll up - zoom in
                this.decreaseScale();
            } else {
                // Scroll down - zoom out
                this.increaseScale();
            }
            e.preventDefault();
        });
        
        // Set exact dimensions for both container and canvas
        this.updateMapSize();
        
        // Add window resize listener to adjust map size on screen size changes
        window.addEventListener('resize', () => {
            // Check if we're on mobile
            const mobile = window.innerWidth <= 768;
            
            // Update map size based on device
            this.mapSize = mobile ? 100 : 200;
            this.canvasSize = this.mapSize;
            
            // Update the map dimensions
            this.updateMapSize();
            
            // Force a re-render of the map
            this.renderMiniMap();
        });
        
        // Add CSS for map controls
        this.addMapControlStyles();
        
        // Check initial visibility setting
        this.checkInitialVisibility();
        
        return true;
    }
    
    /**
     * Add CSS styles for map controls
     */
    addMapControlStyles() {
        // CSS styles are now defined in css/hud/minimap.css
        // This method is kept for backward compatibility
        console.debug('Mini map styles are now defined in CSS file');
    }
    
    /**
     * Check initial visibility setting from localStorage
     */
    checkInitialVisibility() {
        try {
            // Get the setting from localStorage (default to true if not set)
            const showMinimap = localStorage.getItem(STORAGE_KEYS.SHOW_MINIMAP);
            const isVisible = showMinimap === null ? true : (showMinimap === 'true');
            
            console.debug('MiniMapUI: Initial visibility setting:', isVisible);
            
            // Set initial visibility
            if (isVisible) {
                this.show();
            } else {
                this.hide();
            }
        } catch (error) {
            console.error('MiniMapUI: Error checking initial visibility:', error);
            // Default to visible if there's an error
            this.show();
        }
    }
    
    /**
     * Handle map drag start
     * @param {Event} e - Mouse or touch event
     */
    onMapDragStart(e) {
        e.preventDefault();
        
        // Only allow dragging when map is visible
        if (!this.visible) return;
        
        this.isDragging = true;
        
        // Get start position
        if (e.type === 'touchstart') {
            this.dragStartX = e.touches[0].clientX;
            this.dragStartY = e.touches[0].clientY;
        } else {
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        }
    }
    
    /**
     * Handle map drag move
     * @param {Event} e - Mouse or touch event
     */
    onMapDragMove(e) {
        // Only process if dragging
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        // Get current position
        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }
        
        // Calculate drag distance
        const deltaX = currentX - this.dragStartX;
        const deltaY = currentY - this.dragStartY;
        
        // Update map offset
        this.mapOffsetX += deltaX;
        this.mapOffsetY += deltaY;
        
        // Limit offset to prevent dragging too far
        this.mapOffsetX = Math.max(-this.maxMapOffset, Math.min(this.mapOffsetX, this.maxMapOffset));
        this.mapOffsetY = Math.max(-this.maxMapOffset, Math.min(this.mapOffsetY, this.maxMapOffset));
        
        // Update drag start position
        this.dragStartX = currentX;
        this.dragStartY = currentY;
        
        // Render the map with the new offset
        this.renderMiniMap();
    }
    
    /**
     * Handle map drag end
     */
    onMapDragEnd() {
        this.isDragging = false;
    }
    
    /**
     * Reset map position (center it)
     */
    resetMapPosition() {
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;
        this.renderMiniMap();
        
        // Show notification
        if (this.game && this.game.hudManager) {
            this.game.hudManager.showNotification('Map centered', 1500);
        }
    }
    
    /**
     * Update the map size based on current settings
     */
    updateMapSize() {
        if (!this.mapElement || !this.canvas) return;
        
        // Set exact dimensions for both container and canvas
        this.mapElement.style.width = `${this.mapSize}px`;
        this.mapElement.style.height = `${this.mapSize}px`;
        
        // Ensure canvas has the correct dimensions
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        
        // Apply CSS to ensure canvas fits perfectly in the container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }
    
    /**
     * Update the mini map
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Skip updates if map is not visible
        if (!this.visible) {
            return;
        }
        
        const currentTime = Date.now();
        
        // Only render every renderInterval ms for performance
        if (currentTime - this.lastRenderTime >= this.renderInterval) {
            // Check if player has moved significantly before rendering
            const player = this.game.player;
            if (player) {
                // Store last position for movement detection
                if (!this._lastPlayerPos) {
                    this._lastPlayerPos = new THREE.Vector3();
                    this._lastPlayerPos.copy(player.getPosition());
                    this.renderMiniMap();
                } else {
                    // Only render if player has moved at least 1 unit or rotated
                    const currentPos = player.getPosition();
                    const currentRot = player.getRotation().y;
                    
                    if (!this._lastPlayerRot) {
                        this._lastPlayerRot = currentRot;
                    }
                    
                    const hasMoved = this._lastPlayerPos.distanceTo(currentPos) > 1;
                    const hasRotated = Math.abs(this._lastPlayerRot - currentRot) > 0.1;
                    
                    if (hasMoved || hasRotated) {
                        this.renderMiniMap();
                        this._lastPlayerPos.copy(currentPos);
                        this._lastPlayerRot = currentRot;
                    }
                }
            } else {
                // No player, just render on interval
                this.renderMiniMap();
            }
            
            this.lastRenderTime = currentTime;
        }
    }
    
    /**
     * Render the mini map
     */
    renderMiniMap() {
        if (!this.ctx || !this.game.world) return;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.mapSize, this.mapSize);
        
        // Get player position
        const player = this.game.player;
        if (!player) return;
        
        const playerX = player.getPosition().x;
        const playerY = player.getPosition().z; // Using z as y for top-down view
        
        // Center of the mini map
        const centerX = this.mapSize / 2;
        const centerY = this.mapSize / 2;
        const radius = this.mapSize / 2 - 2; // Slightly smaller than half the canvas
        
        // Create circular clipping path
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw background
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
        this.ctx.fillRect(0, 0, this.mapSize, this.mapSize);
        
        // Draw grid lines
        this.drawGrid(centerX, centerY, radius);
        
        // Draw large structures (towers, villages)
        this.drawStructures(playerX, playerY, centerX, centerY);

        // Draw teleport portals
        this.drawTeleportPortals(playerX, playerY, centerX, centerY);
        
        // Draw enemies
        this.drawEnemies(playerX, playerY, centerX, centerY);
        
        // Draw remote players
        this.drawRemotePlayers(playerX, playerY, centerX, centerY);
        
        // Apply map offset for player position
        const offsetCenterX = centerX + this.mapOffsetX;
        const offsetCenterY = centerY + this.mapOffsetY;
        
        // Draw player (always in center unless map is dragged)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player marker
        this.ctx.fillStyle = '#00ff00'; // Bright green
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a white border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 4, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw player direction indicator
        const playerRotation = player.getRotation().y;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(offsetCenterX, offsetCenterY);
        this.ctx.lineTo(
            offsetCenterX + Math.sin(playerRotation) * 10,
            offsetCenterY + Math.cos(playerRotation) * 10
        );
        this.ctx.stroke();
        
        // Restore context and draw border
        this.ctx.restore();
        
        // Draw circular border
        this.ctx.strokeStyle = 'rgba(150, 150, 220, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw cardinal directions
        this.drawCardinalDirections(centerX, centerY, radius);
    }
    
    /**
     * Draw grid lines for reference
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     * @param {number} radius - Radius of the mini map
     */
    drawGrid(centerX, centerY, radius) {
        // Draw concentric circles
        for (let r = radius / 4; r <= radius; r += radius / 4) {
            const opacity = 0.15 + (r / radius) * 0.1;
            this.ctx.strokeStyle = `rgba(120, 140, 200, ${opacity})`;
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw radial lines (grid lines)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            // Make cardinal directions more visible
            if (angle % (Math.PI/2) < 0.01) {
                // Cardinal directions (N, E, S, W)
                this.ctx.strokeStyle = 'rgba(150, 150, 220, 0.35)';
                this.ctx.lineWidth = 1.5;
            } else {
                // Other angles
                this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.18)';
                this.ctx.lineWidth = 0.5;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw cardinal directions (N, E, S, W)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     * @param {number} radius - Radius of the mini map
     */
    drawCardinalDirections(centerX, centerY, radius) {
        this.ctx.fillStyle = 'rgba(220, 220, 255, 0.9)';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // North
        this.ctx.fillText('N', centerX, centerY - radius + 10);
        
        // East
        this.ctx.fillText('E', centerX + radius - 10, centerY);
        
        // South
        this.ctx.fillText('S', centerX, centerY + radius - 10);
        
        // West
        this.ctx.fillText('W', centerX - radius + 10, centerY);
    }
    
    /**
     * Draw large structures (towers, villages, teleports) on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawStructures(playerX, playerY, centerX, centerY) {
        // Get structures from the structure manager
        const structures = this.game.world.structureManager.structures;
        if (!structures || structures.length === 0) return;
        
        // Create dynamic color mapping based on structure types
        // Define base colors for different structure categories
        const baseColors = {
            building: 'rgba(139, 69, 19, 0.7)',    // Brown for buildings
            landmark: 'rgba(100, 100, 100, 0.8)',  // Gray for landmarks
            religious: 'rgba(218, 165, 32, 0.7)',  // Gold for religious structures
            military: 'rgba(72, 60, 50, 0.8)',     // Dark brown for military
            ancient: 'rgba(120, 120, 120, 0.7)',   // Light gray for ruins
            magical: 'rgba(75, 0, 130, 0.8)',      // Purple for magical structures
            natural: 'rgba(90, 77, 65, 0.7)'       // Earth tone for natural structures
        };
        
        // Map structure types to color categories
        const structureCategories = {
            [STRUCTURE_OBJECTS.HOUSE]: 'building',
            [STRUCTURE_OBJECTS.VILLAGE]: 'landmark',
            [STRUCTURE_OBJECTS.TOWER]: 'military',
            [STRUCTURE_OBJECTS.TEMPLE]: 'religious',
            [STRUCTURE_OBJECTS.FORTRESS]: 'military',
            [STRUCTURE_OBJECTS.RUINS]: 'ancient',
            [STRUCTURE_OBJECTS.DARK_SANCTUM]: 'magical',
            [STRUCTURE_OBJECTS.MOUNTAIN]: 'natural',
            [STRUCTURE_OBJECTS.TAVERN]: 'building',
            [STRUCTURE_OBJECTS.SHOP]: 'building',
            [STRUCTURE_OBJECTS.ALTAR]: 'religious',
            [STRUCTURE_OBJECTS.BRIDGE]: 'landmark'
        };
        
        // Generate color map dynamically from structure objects
        const structureColorMap = Object.keys(STRUCTURE_OBJECTS).reduce((map, key) => {
            const structureType = STRUCTURE_OBJECTS[key].toLowerCase();
            const category = structureCategories[STRUCTURE_OBJECTS[key]] || 'building';
            map[structureType] = baseColors[category];
            return map;
        }, {});
        
        // Define shape categories
        const shapeCategories = {
            building: 'square',     // Buildings are squares
            landmark: 'circle',     // Landmarks are circles
            tall: 'triangle',       // Tall structures are triangles
            religious: 'square',    // Religious buildings are squares
            ancient: 'square'       // Ancient structures are squares
        };
        
        // Map structure types to shape categories
        const structureShapeCategories = {
            [STRUCTURE_OBJECTS.HOUSE]: 'building',
            [STRUCTURE_OBJECTS.VILLAGE]: 'landmark',
            [STRUCTURE_OBJECTS.TOWER]: 'tall',
            [STRUCTURE_OBJECTS.TEMPLE]: 'religious',
            [STRUCTURE_OBJECTS.FORTRESS]: 'building',
            [STRUCTURE_OBJECTS.RUINS]: 'ancient',
            [STRUCTURE_OBJECTS.DARK_SANCTUM]: 'tall',
            [STRUCTURE_OBJECTS.MOUNTAIN]: 'tall',
            [STRUCTURE_OBJECTS.TAVERN]: 'building',
            [STRUCTURE_OBJECTS.SHOP]: 'building',
            [STRUCTURE_OBJECTS.ALTAR]: 'religious',
            [STRUCTURE_OBJECTS.BRIDGE]: 'landmark'
        };
        
        // Generate shape map dynamically
        const structureShapeMap = Object.keys(STRUCTURE_OBJECTS).reduce((map, key) => {
            const structureType = STRUCTURE_OBJECTS[key].toLowerCase();
            const category = structureShapeCategories[STRUCTURE_OBJECTS[key]] || 'building';
            map[structureType] = shapeCategories[category];
            return map;
        }, {});
        
        // Generate size map dynamically based on structure properties
        const structureSizeMap = Object.keys(STRUCTURE_OBJECTS).reduce((map, key) => {
            const structureType = STRUCTURE_OBJECTS[key].toLowerCase();
            const properties = STRUCTURE_PROPERTIES[STRUCTURE_OBJECTS[key]];
            
            // Calculate size based on width and height properties
            // This ensures that larger structures in the game world appear larger on the map
            if (properties) {
                // Base size on the average of width and height, scaled down for the map
                const baseSize = (properties.width + properties.height) / 2;
                // Scale to reasonable map icon sizes (between 4 and 8)
                map[structureType] = Math.max(6, Math.min(8, Math.floor(baseSize / 3)));
            } else {
                // Default size if properties not found
                map[structureType] = 6;
            }
            
            return map;
        }, {});
        
        // Helper function to generate a consistent color from a string
        const generateColorFromString = (str) => {
            // Simple hash function to generate a number from a string
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            // Convert to RGB with good opacity for the map
            const r = Math.abs((hash & 0xFF0000) >> 16);
            const g = Math.abs((hash & 0x00FF00) >> 8);
            const b = Math.abs(hash & 0x0000FF);
            
            return `rgba(${r}, ${g}, ${b}, 0.75)`;
        };
        
        // Helper function to draw a structure at a given position
        const drawStructure = (position, type, size = 10, shape = 'square') => {
            // Calculate position relative to player
            const relX = (position.x - playerX) * this.scale;
            const relY = (position.z - playerY) * this.scale;
            
            // Apply map offset
            const screenX = centerX + relX + this.mapOffsetX;
            const screenY = centerY + relY + this.mapOffsetY;
            
            // Get color based on type (use predefined if available, otherwise generate)
            const color = structureColorMap[type] || generateColorFromString(type);
            
            // Set fill style
            this.ctx.fillStyle = color;
            
            // Draw the shape based on type
            if (shape === 'square') {
                // Square for buildings
                this.ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
            } else if (shape === 'triangle') {
                // Triangle for towers
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY - size);
                this.ctx.lineTo(screenX + size, screenY + size/2);
                this.ctx.lineTo(screenX - size, screenY + size/2);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (shape === 'circle') {
                // Circle for villages
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        };
        
        // Draw all structures from the structure manager
        structures.forEach(structure => {
            if (structure && structure.position) {
                // Get the structure type (normalize to lowercase for consistency)
                const type = (structure.type || '').toLowerCase();
                
                // Get shape and size based on type
                const shape = structureShapeMap[type] || 'square';
                const size = structureSizeMap[type] || 6;
                
                // Draw the structure
                drawStructure(structure.position, type, size, shape);
            }
        });
    }
    
    /**
     * Draw teleport portals on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawTeleportPortals(playerX, playerY, centerX, centerY) {
        const portals = this.game.world.teleportManager.getPortals();
        if (portals.length > 0) {
            portals.forEach(portal => {
                // Calculate position relative to player
                const relX = (portal.position.x - playerX) * this.scale;
                const relY = (portal.position.z - playerY) * this.scale;
                
                // Apply map offset
                const screenX = centerX + relX + this.mapOffsetX;
                const screenY = centerY + relY + this.mapOffsetY;
                
                // Calculate distance from center (for circular bounds check)
                const distFromCenter = Math.sqrt(
                    Math.pow(screenX - centerX, 2) + 
                    Math.pow(screenY - centerY, 2)
                );
                
                // Only draw if within circular mini map bounds
                if (distFromCenter <= (this.mapSize / 2 - 2)) {
                    // Simple portal representation as a circle
                    const size = 5;
                    
                    // circle (white)
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Add border
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            });
        }
    }
    
    /**
     * Draw enemies on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawEnemies(playerX, playerY, centerX, centerY) {
        // Check if enemyManager exists
        if (!this.game.enemyManager) return;
        
        // Get enemies from the Map
        const enemiesMap = this.game.enemyManager.enemies;
        
        if (enemiesMap.size > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Red color for enemies
            
            // Iterate through the Map entries
            for (const [id, enemy] of enemiesMap.entries()) {
                // Skip entities without position
                if (!enemy.getPosition) continue;
                
                // Calculate position relative to player
                const relX = (enemy.getPosition().x - playerX) * this.scale;
                const relY = (enemy.getPosition().z - playerY) * this.scale;
                
                // Apply map offset
                const screenX = centerX + relX + this.mapOffsetX;
                const screenY = centerY + relY + this.mapOffsetY;
                
                // Calculate distance from center (for circular bounds check)
                const distFromCenter = Math.sqrt(
                    Math.pow(screenX - centerX, 2) + 
                    Math.pow(screenY - centerY, 2)
                );
                
                // Only draw if within circular mini map bounds
                if (distFromCenter <= (this.mapSize / 2 - 2)) {
                    // Draw enemy marker
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Add outline
                    this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Draw remote players on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawRemotePlayers(playerX, playerY, centerX, centerY) {
        // Check if we have a multiplayer manager with remote players
        if (!this.game.multiplayerManager || !this.game.multiplayerManager.remotePlayerManager) {
            return;
        }
        
        const remotePlayerManager = this.game.multiplayerManager.remotePlayerManager;
        const remotePlayers = remotePlayerManager.getPlayers();
        
        // Skip if no remote players
        if (!remotePlayers || remotePlayers.size === 0) {
            return;
        }
        
        // Draw each remote player
        for (const [peerId, remotePlayer] of remotePlayers.entries()) {
            // Skip if player doesn't have a position
            if (!remotePlayer.group) continue;
            
            // Get position from the group
            const position = remotePlayer.group.position;
            
            // Calculate position relative to player
            const relX = (position.x - playerX) * this.scale;
            const relY = (position.z - playerY) * this.scale;
            
            // Apply map offset
            const screenX = centerX + relX + this.mapOffsetX;
            const screenY = centerY + relY + this.mapOffsetY;
            
            // Calculate distance from center (for circular bounds check)
            const distFromCenter = Math.sqrt(
                Math.pow(screenX - centerX, 2) + 
                Math.pow(screenY - centerY, 2)
            );
            
            // Only draw if within circular mini map bounds
            if (distFromCenter <= (this.mapSize / 2 - 2)) {
                // Get player color from remote player
                const playerColor = remotePlayer.playerColor || '#FFFFFF';
                
                // Draw player marker with their color
                this.ctx.fillStyle = playerColor;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add a white border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw player direction indicator if rotation is available
                if (remotePlayer.targetRotation) {
                    const rotation = remotePlayer.targetRotation.y;
                    this.ctx.strokeStyle = playerColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(screenX, screenY);
                    this.ctx.lineTo(
                        screenX + Math.sin(rotation) * 8,
                        screenY + Math.cos(rotation) * 8
                    );
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Set the scale factor for the mini map
     * @param {number} scale - New scale factor
     */
    setScale(scale) {
        // Ensure scale is within defined bounds
        if (scale < this.minScale) scale = this.minScale;
        if (scale > this.maxScale) scale = this.maxScale;
        
        this.scale = scale;
        
        // Force a redraw of the minimap
        this.renderMiniMap();
        
        // Show notification if scale changed significantly
        if (this.game && this.game.hudManager && Math.abs(this.defaultScale - scale) > 0.3) {
            const zoomLevel = scale < this.defaultScale ? 
                `Zoomed in (${(this.defaultScale/scale).toFixed(1)}x)` : 
                `Zoomed out (${(scale/this.defaultScale).toFixed(1)}x)`;
            
            this.game.hudManager.showNotification(zoomLevel, 1500);
        }
    }
    
    /**
     * Increase the scale factor (zoom out)
     */
    increaseScale() {
        this.setScale(this.scale * 1.2);
    }
    
    /**
     * Decrease the scale factor (zoom in)
     */
    decreaseScale() {
        this.setScale(this.scale / 1.2);
    }
    
    /**
     * Toggle the mini map visibility
     * @returns {boolean} - New visibility state
     */
    toggleMiniMap() {
        if (this.mapElement) {
            const newVisibility = !this.visible;
            this.mapElement.style.display = newVisibility ? 'block' : 'none';
            
            if (newVisibility) {
                this.renderMiniMap();
            } else {
                this._lastPlayerPos = null;
                this._lastPlayerRot = null;
            }
            
            return newVisibility;
        }
        return false;
    }
}