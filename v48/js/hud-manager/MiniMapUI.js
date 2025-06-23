import { UIComponent } from '../UIComponent.js';
import * as THREE from 'three';

/**
 * Mini Map UI component
 * Displays a simplified top-down view of the game world
 * 
 * CSS classes used:
 * - #mini-map-container: Outer container for the mini map and header
 * - #mini-map-header: Header text for the mini map (stays visible when map is toggled)
 * - #mini-map: Container for the mini map canvas (can be toggled)
 * - #mini-map-canvas: Canvas element for rendering the circular map
 */
export class MiniMapUI extends UIComponent {
    /**
     * Create a new MiniMapUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('mini-map', game);
        this.mapElement = null;
        this.headerElement = null;
        this.canvas = null;
        this.ctx = null;
        
        // Adjust map size based on device
        this.mapSize = this.mobile ? 160 : 200; // Smaller size on mobile
        this.canvasSize = this.mapSize; // Canvas size matches map size
        this.scale = 1; // Increased scale factor for better world coverage
        this.lastRenderTime = 0;
        this.renderInterval = 250; // Increased to 250ms for better performance
        this.maxDrawDistance = this.mapSize / 2 - 2; // Maximum draw distance from center
        
        // For teleport portals
        this.showTeleportLines = true; // Show lines between teleport portals
        this.teleportLineColor = 'rgba(0, 255, 255, 0.4)'; // Cyan color for teleport lines
        this.teleportPortalColor = 'rgba(0, 255, 255, 0.8)'; // Cyan color for teleport portals
        this.teleportPortalSize = 6; // Size of teleport portals on minimap
        
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
        
        // For teleport visualization
        this.highlightedPortal = null; // Currently highlighted portal
        this.teleportAnimationTime = 0; // For teleport animation
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        const template = `
            <div id="mini-map-controls">
                <button id="mini-map-center-btn" title="Center Map">⌖</button>
                <button id="mini-map-zoom-in-btn" title="Zoom In">+</button>
                <button id="mini-map-zoom-out-btn" title="Zoom Out">−</button>
            </div>
            <canvas id="mini-map-canvas" width="${this.canvasSize}" height="${this.canvasSize}"></canvas>
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.mapElement = document.getElementById('mini-map');
        this.canvas = document.getElementById('mini-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add event listener to the opacity toggle checkbox
        const opacityToggle = document.getElementById('mini-map-opacity-toggle');
        if (opacityToggle) {
            // Store the timeout ID so we can clear it if needed
            let opacityTimeoutId = null;
            
            opacityToggle.addEventListener('change', (e) => {
                if (opacityToggle.checked) {
                    // Clear any existing timeout
                    if (opacityTimeoutId) {
                        clearTimeout(opacityTimeoutId);
                    }
                    
                    // Set a new timeout to uncheck after 3 seconds
                    opacityTimeoutId = setTimeout(() => {
                        opacityToggle.checked = false;
                        opacityTimeoutId = null;
                    }, 3000);
                }
            });
        }
        
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
        
        // Add click handler for teleport portals
        this.canvas.addEventListener('click', (e) => {
            // Get click position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if a teleport portal was clicked
            const portal = this.checkPortalClick(clickX, clickY);
            if (portal) {
                // Highlight the portal and its destination
                this.highlightedPortal = portal;
                
                // Show portal info
                if (this.game && this.game.hudManager) {
                    this.game.hudManager.showNotification(
                        `Teleport Portal: ${portal.name} → ${portal.targetName}`,
                        3000
                    );
                }
                
                // Force a redraw
                this.renderMiniMap();
                
                // Prevent the event from bubbling up
                e.stopPropagation();
                return;
            }
            
            // If no portal was clicked and opacity toggle exists, toggle it
            const opacityToggle = document.getElementById('mini-map-opacity-toggle');
            if (opacityToggle) {
                // Toggle the checkbox state
                opacityToggle.checked = true;
                
                // Manually trigger the change event
                const changeEvent = new Event('change');
                opacityToggle.dispatchEvent(changeEvent);
            }
            
            // Prevent the event from bubbling up
            e.stopPropagation();
        });
        
        // Add window resize listener to adjust map size on screen size changes
        // window.addEventListener('resize', () => {
        //     // Check if we're on mobile
        //     const mobile = window.innerWidth <= 768;
        //     // Update map size based on device
        //     this.mapSize = mobile ? 100 : 200;
        //     this.canvasSize = this.mapSize;
        //     // Force a re-render of the map
        //     this.renderMiniMap();
        // });
        
        // Add CSS for map controls
        this.addMapControlStyles();
        
        return true;
    }
    
    /**
     * Add CSS styles for map controls
     */
    addMapControlStyles() {
        // Create a style element if it doesn't exist
        let styleEl = document.getElementById('mini-map-control-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'mini-map-control-styles';
            document.head.appendChild(styleEl);
        }
        
        // Add CSS rules
        styleEl.textContent = `
            #mini-map-controls {
                position: absolute;
                top: 5px;
                right: 5px;
                z-index: 10;
                display: flex;
                flex-direction: column;
            }
            
            #mini-map-controls button {
                width: 24px;
                height: 24px;
                margin-bottom: 5px;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 3px;
                font-size: 14px;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: background 0.2s;
            }
            
            #mini-map-controls button:hover {
                background: rgba(0, 0, 0, 0.8);
                border-color: rgba(255, 255, 255, 0.6);
            }
            
            #mini-map-center-btn {
                font-size: 16px !important;
            }
        `;
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
     * Check if a teleport portal was clicked
     * @param {number} x - Click X position on canvas
     * @param {number} y - Click Y position on canvas
     * @returns {Object|null} - The clicked portal or null
     */
    checkPortalClick(x, y) {
        // Get player position
        const player = this.game.player;
        if (!player) return null;
        
        const playerX = player.getPosition().x;
        const playerY = player.getPosition().z; // Using z as y for top-down view
        
        // Center of the mini map
        const centerX = this.mapSize / 2;
        const centerY = this.mapSize / 2;
        
        // Get teleport portals
        const portals = this.game.world.getTeleportPortals ? 
            this.game.world.getTeleportPortals() : [];
        
        // Check each portal
        for (const portal of portals) {
            // Calculate position relative to player
            const relX = (portal.position.x - playerX) * this.scale;
            const relY = (portal.position.z - playerY) * this.scale;
            
            // Apply map offset
            const screenX = centerX + relX + this.mapOffsetX;
            const screenY = centerY + relY + this.mapOffsetY;
            
            // Check if click is within portal radius
            const clickDistance = Math.sqrt(
                Math.pow(x - screenX, 2) + 
                Math.pow(y - screenY, 2)
            );
            
            if (clickDistance <= this.teleportPortalSize + 2) {
                return portal;
            }
        }
        
        return null;
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
                    
                    // Track camera rotation for orbit controls
                    let cameraRotation = 0;
                    if (this.game.controls && this.game.controls.enabled) {
                        // Get camera's forward direction
                        const cameraDirection = new THREE.Vector3(0, 0, -1);
                        cameraDirection.applyQuaternion(this.game.camera.quaternion);
                        
                        // Project onto the XZ plane and normalize
                        cameraDirection.y = 0;
                        cameraDirection.normalize();
                        
                        // Calculate the angle in the XZ plane
                        cameraRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
                    }
                    
                    if (!this._lastPlayerRot) {
                        this._lastPlayerRot = currentRot;
                    }
                    
                    if (!this._lastCameraRot) {
                        this._lastCameraRot = cameraRotation;
                    }
                    
                    const hasMoved = this._lastPlayerPos.distanceTo(currentPos) > 1;
                    const hasRotated = Math.abs(this._lastPlayerRot - currentRot) > 0.1;
                    const hasCameraRotated = Math.abs(this._lastCameraRot - cameraRotation) > 0.05;
                    
                    if (hasMoved || hasRotated || hasCameraRotated) {
                        this.renderMiniMap();
                        this._lastPlayerPos.copy(currentPos);
                        this._lastPlayerRot = currentRot;
                        this._lastCameraRot = cameraRotation;
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
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.75)'; // Darker, more opaque background
        this.ctx.fillRect(0, 0, this.mapSize, this.mapSize);
        
        // Add a subtle radial gradient for depth
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, radius * 0.1,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(30, 30, 40, 0.1)');
        gradient.addColorStop(1, 'rgba(5, 5, 10, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.mapSize, this.mapSize);
        
        // Draw grid lines for reference
        this.drawGrid(centerX, centerY, radius);
        
        // Draw terrain/environment
        this.drawEnvironment(playerX, playerY, centerX, centerY);
        
        // Draw teleport portals
        this.drawTeleportPortals(playerX, playerY, centerX, centerY);
        
        // Draw NPCs and enemies
        this.drawEntities(playerX, playerY, centerX, centerY);
        
        // Apply map offset for player position
        const offsetCenterX = centerX + this.mapOffsetX;
        const offsetCenterY = centerY + this.mapOffsetY;
        
        // Draw player (always in center unless map is dragged)
        // First draw a white halo/glow effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player marker
        this.ctx.fillStyle = '#00ff00'; // Bright green
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a white border to make it pop
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(offsetCenterX, offsetCenterY, 4, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw player direction indicator
        // Get direction from camera or player rotation depending on which is active
        let directionAngle;
        
        if (this.game.controls && this.game.controls.enabled) {
            // When orbit controls are active, use camera's horizontal rotation
            // Create a vector pointing in the camera's forward direction
            const cameraDirection = new THREE.Vector3(0, 0, -1);
            cameraDirection.applyQuaternion(this.game.camera.quaternion);
            
            // Project onto the XZ plane and normalize
            cameraDirection.y = 0;
            cameraDirection.normalize();
            
            // Calculate the angle in the XZ plane
            directionAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
        } else {
            // Use player's rotation when orbit controls are not active
            directionAngle = player.getRotation().y;
        }
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(offsetCenterX, offsetCenterY);
        this.ctx.lineTo(
            offsetCenterX + Math.sin(directionAngle) * 10,
            offsetCenterY + Math.cos(directionAngle) * 10
        );
        this.ctx.stroke();
        
        // Restore context and draw border
        this.ctx.restore();
        
        // Draw circular border with gradient
        const borderGradient = this.ctx.createLinearGradient(
            centerX - radius, centerY - radius,
            centerX + radius, centerY + radius
        );
        borderGradient.addColorStop(0, 'rgba(100, 100, 180, 0.7)');
        borderGradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.7)');
        borderGradient.addColorStop(1, 'rgba(100, 100, 180, 0.7)');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw cardinal directions
        this.drawCardinalDirections(centerX, centerY, radius);
        
        // Draw map controls (they're already added in the HTML)
    }
    
    /**
     * Draw teleport portals on the minimap
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawTeleportPortals(playerX, playerY, centerX, centerY) {
        // Get teleport portals
        const portals = this.game.world.getTeleportPortals ? 
            this.game.world.getTeleportPortals() : [];
        
        if (!portals || portals.length === 0) return;
        
        // First draw connection lines between portals
        if (this.showTeleportLines) {
            this.ctx.strokeStyle = this.teleportLineColor;
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([5, 3]); // Dashed line
            
            portals.forEach(portal => {
                // Calculate source position relative to player
                const sourceRelX = (portal.position.x - playerX) * this.scale;
                const sourceRelY = (portal.position.z - playerY) * this.scale;
                
                // Calculate target position relative to player
                const targetRelX = (portal.targetPosition.x - playerX) * this.scale;
                const targetRelY = (portal.targetPosition.z - playerY) * this.scale;
                
                // Apply map offset
                const sourceScreenX = centerX + sourceRelX + this.mapOffsetX;
                const sourceScreenY = centerY + sourceRelY + this.mapOffsetY;
                const targetScreenX = centerX + targetRelX + this.mapOffsetX;
                const targetScreenY = centerY + targetRelY + this.mapOffsetY;
                
                // Calculate distance from center (for circular bounds check)
                const sourceDistFromCenter = Math.sqrt(
                    Math.pow(sourceScreenX - centerX, 2) + 
                    Math.pow(sourceScreenY - centerY, 2)
                );
                
                const targetDistFromCenter = Math.sqrt(
                    Math.pow(targetScreenX - centerX, 2) + 
                    Math.pow(targetScreenY - centerY, 2)
                );
                
                // Only draw if at least one end is within circular mini map bounds
                const maxDist = this.mapSize / 2 - 2;
                if (sourceDistFromCenter <= maxDist || targetDistFromCenter <= maxDist) {
                    // Draw connection line
                    this.ctx.beginPath();
                    this.ctx.moveTo(sourceScreenX, sourceScreenY);
                    this.ctx.lineTo(targetScreenX, targetScreenY);
                    this.ctx.stroke();
                    
                    // Draw direction arrow
                    const arrowLength = 8;
                    const dx = targetScreenX - sourceScreenX;
                    const dy = targetScreenY - sourceScreenY;
                    const angle = Math.atan2(dy, dx);
                    
                    // Calculate arrow position (halfway between source and target)
                    const arrowX = sourceScreenX + dx * 0.5;
                    const arrowY = sourceScreenY + dy * 0.5;
                    
                    // Draw arrow
                    this.ctx.beginPath();
                    this.ctx.moveTo(arrowX, arrowY);
                    this.ctx.lineTo(
                        arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
                        arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
                    );
                    this.ctx.moveTo(arrowX, arrowY);
                    this.ctx.lineTo(
                        arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
                        arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
                    );
                    this.ctx.stroke();
                }
            });
            
            // Reset line dash
            this.ctx.setLineDash([]);
        }
        
        // Now draw the portal markers
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
                // Check if this is the highlighted portal
                const isHighlighted = this.highlightedPortal && 
                    this.highlightedPortal.position.x === portal.position.x && 
                    this.highlightedPortal.position.z === portal.position.z;
                
                // Draw portal glow
                if (isHighlighted) {
                    // Pulsating glow for highlighted portal
                    const pulseSize = 1.5 + Math.sin(Date.now() / 200) * 0.5;
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, this.teleportPortalSize * pulseSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Normal glow
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, this.teleportPortalSize * 1.3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Draw portal marker
                this.ctx.fillStyle = this.teleportPortalColor;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, this.teleportPortalSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add a white border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, this.teleportPortalSize, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw portal icon (teleport symbol)
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, this.teleportPortalSize * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw "T" letter
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('T', screenX, screenY);
                
                // If highlighted, also highlight the destination
                if (isHighlighted) {
                    // Calculate target position relative to player
                    const targetRelX = (portal.targetPosition.x - playerX) * this.scale;
                    const targetRelY = (portal.targetPosition.z - playerY) * this.scale;
                    
                    // Apply map offset
                    const targetScreenX = centerX + targetRelX + this.mapOffsetX;
                    const targetScreenY = centerY + targetRelY + this.mapOffsetY;
                    
                    // Calculate distance from center (for circular bounds check)
                    const targetDistFromCenter = Math.sqrt(
                        Math.pow(targetScreenX - centerX, 2) + 
                        Math.pow(targetScreenY - centerY, 2)
                    );
                    
                    // Only draw if within circular mini map bounds
                    if (targetDistFromCenter <= (this.mapSize / 2 - 2)) {
                        // Draw destination marker
                        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.arc(targetScreenX, targetScreenY, this.teleportPortalSize * 1.5, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Draw X marker
                        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(targetScreenX - 5, targetScreenY - 5);
                        this.ctx.lineTo(targetScreenX + 5, targetScreenY + 5);
                        this.ctx.moveTo(targetScreenX + 5, targetScreenY - 5);
                        this.ctx.lineTo(targetScreenX - 5, targetScreenY + 5);
                        this.ctx.stroke();
                    }
                }
            }
        });
    }
    
    /**
     * Draw grid lines for reference
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     * @param {number} radius - Radius of the mini map
     */
    drawGrid(centerX, centerY, radius) {
        // Enhanced grid lines for better visibility
        this.ctx.lineWidth = 1.5; // Increased line width
        
        // Draw concentric circles
        for (let r = radius / 4; r <= radius; r += radius / 4) {
            // Make outer circles more visible
            const opacity = 0.15 + (r / radius) * 0.1; // Gradually increase opacity for outer circles
            this.ctx.strokeStyle = `rgba(120, 140, 200, ${opacity})`;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw radial lines
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            // Make cardinal directions more visible
            if (angle % (Math.PI/2) < 0.01) {
                // Cardinal directions (N, E, S, W)
                this.ctx.strokeStyle = 'rgba(150, 150, 220, 0.35)';
                this.ctx.lineWidth = 2; // Thicker lines for cardinal directions
            } else if (angle % (Math.PI/4) < 0.01) {
                // Intercardinal directions (NE, SE, SW, NW)
                this.ctx.strokeStyle = 'rgba(120, 120, 180, 0.25)';
                this.ctx.lineWidth = 1.5;
            } else {
                // Other angles
                this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.18)';
                this.ctx.lineWidth = 1;
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
        // Create a glow effect for the text
        this.ctx.shadowColor = 'rgba(100, 100, 255, 0.8)';
        this.ctx.shadowBlur = 4;
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
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw environment elements on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawEnvironment(playerX, playerY, centerX, centerY) {
        // Get world reference
        const world = this.game.world;
        
        // Draw terrain features (walls, obstacles, trees, etc.)
        if (world.getTerrainFeatures) {
            const features = world.getTerrainFeatures();
            
            // Limit the number of features to draw for performance
            const maxFeatures = 100; // Limit to 100 features
            const featuresToDraw = features.length > maxFeatures ? 
                features.slice(0, maxFeatures) : features;
            
            // Group features by type for batch rendering
            const featuresByType = {
                wall: [],
                door: [],
                water: [],
                tree: [],
                rock: [],
                path: [],
                other: []
            };
            
            // Pre-calculate positions and filter out-of-bounds features
            featuresToDraw.forEach(feature => {
                // Calculate position relative to player
                const relX = (feature.position.x - playerX) * this.scale;
                const relY = (feature.position.z - playerY) * this.scale;
                
                // Calculate screen position
                const screenX = centerX + relX;
                const screenY = centerY + relY;
                
                // Fast distance check (avoid sqrt for performance)
                const distSquared = (screenX - centerX) * (screenX - centerX) + 
                                   (screenY - centerY) * (screenY - centerY);
                const maxDistSquared = (this.mapSize / 2 - 2) * (this.mapSize / 2 - 2);
                
                // Only include if within circular mini map bounds
                if (distSquared <= maxDistSquared) {
                    const type = feature.type || 'other';
                    const group = featuresByType[type] || featuresByType.other;
                    
                    group.push({
                        x: screenX,
                        y: screenY
                    });
                }
            });
            
            // Batch render each feature type
            // Walls
            if (featuresByType.wall.length > 0) {
                this.ctx.fillStyle = 'rgba(85, 85, 85, 0.8)';
                featuresByType.wall.forEach(pos => {
                    this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
                });
            }
            
            // Doors
            if (featuresByType.door.length > 0) {
                this.ctx.fillStyle = 'rgba(136, 85, 85, 0.8)';
                featuresByType.door.forEach(pos => {
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
            
            // Water
            if (featuresByType.water.length > 0) {
                this.ctx.fillStyle = 'rgba(85, 85, 255, 0.5)';
                featuresByType.water.forEach(pos => {
                    this.ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
                });
            }
            
            // Trees
            if (featuresByType.tree.length > 0) {
                this.ctx.fillStyle = 'rgba(34, 139, 34, 0.7)';
                featuresByType.tree.forEach(pos => {
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
            
            // Rocks
            if (featuresByType.rock.length > 0) {
                this.ctx.fillStyle = 'rgba(120, 120, 120, 0.7)';
                featuresByType.rock.forEach(pos => {
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
            
            // Paths
            if (featuresByType.path.length > 0) {
                this.ctx.fillStyle = 'rgba(210, 180, 140, 0.5)';
                featuresByType.path.forEach(pos => {
                    this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
                });
            }
            
            // Other features
            if (featuresByType.other.length > 0) {
                this.ctx.fillStyle = 'rgba(119, 119, 119, 0.5)';
                featuresByType.other.forEach(pos => {
                    this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
                });
            }
        }
        
        // Only draw additional world elements if the map is visible
        if (this.visible) {
            this.drawWorldElements(playerX, playerY, centerX, centerY);
        }
    }
    
    /**
     * Draw additional world elements if available
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawWorldElements(playerX, playerY, centerX, centerY) {
        const world = this.game.world;
        
        // Draw remote players if in multiplayer mode
        this.drawRemotePlayers(playerX, playerY, centerX, centerY);
        
        // Draw trees if available
        if (world.getTrees) {
            const trees = world.getTrees();
            this.drawFeatureGroup(trees, playerX, playerY, centerX, centerY, 'rgba(34, 139, 34, 0.6)', 3);
        }
        
        // Draw rocks if available
        if (world.getRocks) {
            const rocks = world.getRocks();
            this.drawFeatureGroup(rocks, playerX, playerY, centerX, centerY, 'rgba(120, 120, 120, 0.6)', 2);
        }
        
        // Draw buildings if available
        if (world.getBuildings) {
            const buildings = world.getBuildings();
            this.drawFeatureGroup(buildings, playerX, playerY, centerX, centerY, 'rgba(139, 69, 19, 0.7)', 4);
        }
        
        // Draw paths if available
        if (world.getPaths) {
            const paths = world.getPaths();
            this.drawFeatureGroup(paths, playerX, playerY, centerX, centerY, 'rgba(210, 180, 140, 0.5)', 2, true);
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
        remotePlayers.forEach((remotePlayer, peerId) => {
            // Skip if player doesn't have a position
            if (!remotePlayer.group) return;
            
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
                
                // Draw a glow effect
                this.ctx.fillStyle = `${playerColor}40`; // 25% opacity version of the color
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw player marker with their color
                this.ctx.fillStyle = playerColor;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add a white border to make it pop
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
        });
    }
    
    /**
     * Draw a group of similar features
     * @param {Array} features - Array of features to draw
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     * @param {string} color - Color to use for drawing
     * @param {number} size - Size of the feature
     * @param {boolean} isPath - Whether the feature is a path (drawn as lines)
     */
    drawFeatureGroup(features, playerX, playerY, centerX, centerY, color, size, isPath = false) {
        if (!features || !features.length) return;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        features.forEach(feature => {
            // Calculate position relative to player
            const relX = (feature.position.x - playerX) * this.scale;
            const relY = (feature.position.z - playerY) * this.scale;
            
            // Calculate screen position
            const screenX = centerX + relX;
            const screenY = centerY + relY;
            
            // Calculate distance from center (for circular bounds check)
            const distFromCenter = Math.sqrt(
                Math.pow(screenX - centerX, 2) + 
                Math.pow(screenY - centerY, 2)
            );
            
            // Only draw if within circular mini map bounds
            if (distFromCenter <= (this.mapSize / 2 - 2)) {
                if (isPath) {
                    // Draw as a line if it's a path and has a next point
                    if (feature.nextPoint) {
                        const nextRelX = (feature.nextPoint.x - playerX) * this.scale;
                        const nextRelY = (feature.nextPoint.z - playerY) * this.scale;
                        const nextScreenX = centerX + nextRelX;
                        const nextScreenY = centerY + nextRelY;
                        
                        this.ctx.lineWidth = size;
                        this.ctx.beginPath();
                        this.ctx.moveTo(screenX, screenY);
                        this.ctx.lineTo(nextScreenX, nextScreenY);
                        this.ctx.stroke();
                    } else {
                        // Draw as a point if no next point
                        this.ctx.beginPath();
                        this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else {
                    // Draw as a circle
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
    }
    
    /**
     * Draw entities (NPCs, enemies) on the mini map
     * @param {number} playerX - Player's X position in the world
     * @param {number} playerY - Player's Y position in the world (Z in 3D space)
     * @param {number} centerX - Center X of the mini map
     * @param {number} centerY - Center Y of the mini map
     */
    drawEntities(playerX, playerY, centerX, centerY) {
        // Get all entities
        const entities = this.game.world.getEntities ? this.game.world.getEntities() : [];
        
        // Limit the number of entities to draw for performance
        const maxEntities = 50; // Limit to 50 entities
        const entitiesToDraw = entities.length > maxEntities ? 
            entities.slice(0, maxEntities) : entities;
        
        // Group entities by type for batch rendering
        const enemyEntities = [];
        const npcEntities = [];
        const itemEntities = [];
        const otherEntities = [];
        
        // Reset any shadow effects before starting
        this.ctx.shadowBlur = 0;
        
        // Pre-calculate positions and filter out-of-bounds entities
        entitiesToDraw.forEach(entity => {
            // Skip player entity
            if (entity === this.game.player) return;
            
            // Skip entities without position
            if (!entity.getPosition) return;
            
            // Calculate position relative to player
            const relX = (entity.getPosition().x - playerX) * this.scale;
            const relY = (entity.getPosition().z - playerY) * this.scale;
            
            // Calculate screen position
            const screenX = centerX + relX;
            const screenY = centerY + relY;
            
            // Fast distance check (avoid sqrt for performance)
            const distSquared = (screenX - centerX) * (screenX - centerX) + 
                               (screenY - centerY) * (screenY - centerY);
            const maxDistSquared = (this.mapSize / 2 - 2) * (this.mapSize / 2 - 2);
            
            // Only include if within circular mini map bounds
            if (distSquared <= maxDistSquared) {
                const entityData = {
                    x: screenX,
                    y: screenY,
                    size: 2 // Default size
                };
                
                // Group by entity type
                if (entity.isEnemy) {
                    enemyEntities.push(entityData);
                } else if (entity.isNPC) {
                    npcEntities.push(entityData);
                } else if (entity.isItem) {
                    itemEntities.push(entityData);
                } else {
                    otherEntities.push(entityData);
                }
            }
        });
        
        // Batch render each entity type
        // Enemies - no glow effects for better performance
        if (enemyEntities.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            enemyEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw outlines in a single batch
            this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
            this.ctx.lineWidth = 1;
            enemyEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
                this.ctx.stroke();
            });
        }
        
        // NPCs
        if (npcEntities.length > 0) {
            this.ctx.fillStyle = 'rgba(200, 200, 0, 0.6)';
            npcEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw outlines in a single batch
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            this.ctx.lineWidth = 1;
            npcEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size + 1, 0, Math.PI * 2);
                this.ctx.stroke();
            });
        }
        
        // Items
        if (itemEntities.length > 0) {
            this.ctx.fillStyle = 'rgba(0, 180, 180, 0.6)';
            itemEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // Other entities
        if (otherEntities.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            otherEntities.forEach(entity => {
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // No shadow effects for better performance
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
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
        
        // Recalculate maxDrawDistance based on current scale
        this.maxDrawDistance = this.mapSize / 2 - 2;
        
        // Force a redraw of the minimap
        this.renderMiniMap();
        
        // Show notification if scale changed significantly
        if (this.game && this.game.hudManager && Math.abs(this.defaultScale - scale) > 0.3) {
            const zoomLevel = scale < this.defaultScale ? 
                `Zoomed in (${(this.defaultScale/scale).toFixed(1)}x)` : 
                `Zoomed out (${(scale/this.defaultScale).toFixed(1)}x)`;
            
            this.game.hudManager.showNotification(zoomLevel, 1500);
        }
        
        console.debug(`Mini map scale set to: ${scale}`);
    }
    
    /**
     * Resize the minimap
     * @param {number} size - New size in pixels
     */
    resize(size) {
        // Update sizes
        this.mapSize = size;
        this.canvasSize = size;
        
        // Update container dimensions
        this.mapElement.style.width = `${this.mapSize}px`;
        this.mapElement.style.height = `${this.mapSize}px`;
        
        // Update canvas dimensions
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        
        // Recalculate maxDrawDistance
        this.maxDrawDistance = this.mapSize / 2 - 2;
        
        // Force a redraw
        this.renderMiniMap();
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
        // Toggle only the map element, not the header
        if (this.mapElement) {
            // Get current visibility state
            
            // Toggle visibility
            const newVisibility = !this.visible;
            this.mapElement.style.display = newVisibility ? 'block' : 'none';
            
            // If becoming visible, force a render
            if (newVisibility) {
                this.renderMiniMap();
            } else {
                // If becoming invisible, clear any cached data to free memory
                this._lastPlayerPos = null;
                this._lastPlayerRot = null;
            }
            
            console.debug(`Mini map visibility set to: ${newVisibility}`);
            return newVisibility;
        }
        return false;
    }
}