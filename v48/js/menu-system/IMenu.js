/**
 * IMenu.js
 * Interface for menu components in the game
 */

import { UIComponent } from "../UIComponent.js";

/**
 * Interface for menu components
 * @interface
 */
export class IMenu extends UIComponent{
    /**
     * Get the menu type/name
     * @returns {string} The menu type/name
     */
    getType() {
        throw new Error('Method not implemented');
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        throw new Error('Method not implemented');
    }
}