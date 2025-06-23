import { UIComponent } from '../UIComponent.js';

/**
 * Death Screen UI component
 * Displays death screen with respawn and quit options
 */
export class DeathScreenUI extends UIComponent {
    /**
     * Create a new DeathScreenUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('death-screen', game);
        this.isDeathScreenOpen = false;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // <div class="death-stats">
        //     <div class="death-stats-title">Battle Statistics</div>
        //     <div class="death-stats-item">
        //         <span class="death-stats-label">Time Survived:</span>
        //         <span class="death-stats-value" id="time-survived">00:00</span>
        //     </div>
        //     <div class="death-stats-item">
        //         <span class="death-stats-label">Enemies Defeated:</span>
        //         <span class="death-stats-value" id="enemies-defeated">0</span>
        //     </div>
        //     <div class="death-stats-item">
        //         <span class="death-stats-label">Level Reached:</span>
        //         <span class="death-stats-value" id="level-reached">1</span>
        //     </div>
        // </div>
        const template = `
            <div id="death-screen-content">
                <h1>You Died</h1>
                <div class="death-message">
                    Your journey has come to an end, but your spirit lives on.
                </div>

                <div class="menu-button-container">
                    <button class="menu-button" id="respawn-button">Respawn</button>
                    <button class="menu-button" id="quit-button">Quit Game</button>
                </div>
            </div>
        `;
        
        // Render the template
        this.render(template);
        
        // Create bound event handler methods to make them easier to remove later
        this.handleRespawn = () => {
            this.game.player.revive();
        };
        
        this.handleQuit = () => {
            // Reload page to restart game
            window.location.reload();
        };
        
        // Add event listeners
        const respawnButton = document.getElementById('respawn-button');
        respawnButton.addEventListener('click', this.handleRespawn);
        
        const quitButton = document.getElementById('quit-button');
        quitButton.addEventListener('click', this.handleQuit);
        
        // Hide initially
        this.hide();
        
        return true;
    }
    
    /**
     * Show the death screen
     */
    showDeathScreen() {
        // Update statistics
        this.updateDeathStats();
        
        // Show death screen
        this.show();
        this.isDeathScreenOpen = true;
        
        // Pause game
        this.game.pause(false);
    }
    
    /**
     * Update death statistics
     */
    updateDeathStats() {
        // Get player statistics
        const gameTime = this.game.gameTime || 0;
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Get enemies defeated (if available)
        const enemiesDefeated = this.game.player.enemiesDefeated || 0;
        
        // Get player level
        const playerLevel = this.game.player.level || 1;
        
        // Update UI elements
        // document.getElementById('time-survived').textContent = timeString;
        // document.getElementById('enemies-defeated').textContent = enemiesDefeated.toString();
        // document.getElementById('level-reached').textContent = playerLevel.toString();
    }
    
    /**
     * Hide the death screen
     */
    hideDeathScreen() {
        // Hide death screen
        this.hide();
        this.isDeathScreenOpen = false;
        
        // Resume game
        this.game.resume(false);
    }
    
    /**
     * Remove event listeners when component is disposed
     * Overrides the base class method
     */
    removeEventListeners() {
        // Remove event listeners from buttons if they exist
        const respawnButton = document.getElementById('respawn-button');
        if (respawnButton && this.handleRespawn) {
            respawnButton.removeEventListener('click', this.handleRespawn);
        }
        
        const quitButton = document.getElementById('quit-button');
        if (quitButton && this.handleQuit) {
            quitButton.removeEventListener('click', this.handleQuit);
        }
    }
}