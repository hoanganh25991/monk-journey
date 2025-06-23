/**
 * ControlsTab.js
 * Manages the controls display tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { ControlsDisplay } from '../ControlsDisplay.js';

export class ControlsTab extends SettingsTab {
    /**
     * Create a controls display tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('controls', game, settingsMenu);
        
        this.init();
    }
    
    /**
     * Initialize the controls display
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeControlsDisplay();
        return true;
    }
    
    /**
     * Initialize the controls display
     * @private
     */
    initializeControlsDisplay() {
        // Initialize the controls display using static methods
        ControlsDisplay.initialize();
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // Update the controls display when the tab is activated
        ControlsDisplay.updateKeyboardControls();
        ControlsDisplay.updateMobileControls();
    }
}