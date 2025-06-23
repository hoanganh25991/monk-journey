/**
 * SettingsTab.js
 * Base class for all settings tab UI components
 */

import { UIComponent } from '../../UIComponent.js';

export class SettingsTab extends UIComponent {
    /**
     * Create a new settings tab
     * @param {string} tabId - ID of the tab
     * @param {import('../../game/Game.js').Game} game - Reference to the game instance
     * @param {SettingsMenu} settingsMenu - Reference to the parent settings menu
     */
    constructor(tabId, game, settingsMenu) {
        super(`${tabId}-tab`, game);
        this.tabId = tabId;
        this.settingsMenu = settingsMenu;
    }
    
    /**
     * Initialize the tab
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        return true;
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // To be implemented by child classes
    }
    
    /**
     * Called when the tab is deactivated
     */
    onDeactivate() {
        // To be implemented by child classes
    }
    
    /**
     * Save the tab settings
     */
    saveSettings() {
        // To be implemented by child classes
    }
    
    /**
     * Reset the tab settings to defaults
     */
    resetToDefaults() {
        // To be implemented by child classes
    }
    
    /**
     * Resize the tab content
     */
    resize() {
        // To be implemented by child classes
    }
}