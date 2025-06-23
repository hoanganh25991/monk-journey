/**
 * Interface for the save system
 * Defines the contract that any save implementation must follow
 */
export class ISaveSystem {
    /**
     * Initialize the save system
     * @returns {boolean} Success status
     */
    init() { throw new Error('Method not implemented'); }
    
    /**
     * Save the current game state
     * @param {boolean} forceSave - Whether to force save regardless of conditions
     * @returns {boolean} Success status
     */
    saveGame(forceSave) { throw new Error('Method not implemented'); }
    
    /**
     * Load a saved game
     * @returns {boolean} Success status
     */
    loadGame() { throw new Error('Method not implemented'); }
    
    /**
     * Start auto-save functionality
     */
    startAutoSave() { throw new Error('Method not implemented'); }
    
    /**
     * Stop auto-save functionality
     */
    stopAutoSave() { throw new Error('Method not implemented'); }
    
    /**
     * Delete all save data
     * @returns {boolean} Success status
     */
    deleteSave() { throw new Error('Method not implemented'); }
    
    /**
     * Check if save data exists
     * @returns {boolean} Whether save data exists
     */
    hasSaveData() { throw new Error('Method not implemented'); }
}