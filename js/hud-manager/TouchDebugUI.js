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
        // Create debug container if it doesn't exist
        if (!document.getElementById('touch-debug-container')) {
            const debugContainer = document.createElement('div');
            debugContainer.id = 'touch-debug-container';
            debugContainer.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
                min-width: 300px;
            `;
            document.body.appendChild(debugContainer);
            this.container = debugContainer;
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