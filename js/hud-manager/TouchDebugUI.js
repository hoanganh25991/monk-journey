import { UIComponent } from '../UIComponent.js';
import { touchManager } from './TouchManager.js';

/**
 * Touch Debug UI - Shows active touches for debugging
 * Remove this in production
 */
export class TouchDebugUI extends UIComponent {
    constructor(game) {
        super('touch-debug-container', game);
        this.debugInfo = null;
    }
    
    init() {
        // Use existing container from HTML
        this.container = document.getElementById('touch-debug-container');
        if (!this.container) {
            console.error('Touch debug container not found in HTML');
            return false;
        }
        
        this.render('<div id="touch-debug-info">Touch Debug Info</div>');
        this.debugInfo = document.getElementById('touch-debug-info');
        
        // Update debug info every 100ms
        setInterval(() => this.updateDebugInfo(), 100);
        
        return true;
    }
    
    updateDebugInfo() {
        if (!this.debugInfo) return;
        
        const debug = touchManager.getDebugInfo();
        const joystickDir = this.game.hudManager?.getJoystickDirection?.() || { x: 0, y: 0 };
        
        this.debugInfo.innerHTML = `
            <div><strong>Active Touches:</strong></div>
            <div>Joystick: ${debug.joystick || 'none'}</div>
            <div>Camera: ${debug.camera || 'none'}</div>
            <div>Skills: [${debug.skills.join(', ')}]</div>
            <div><strong>Joystick Direction:</strong></div>
            <div>X: ${joystickDir.x.toFixed(2)}, Y: ${joystickDir.y.toFixed(2)}</div>
        `;
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}