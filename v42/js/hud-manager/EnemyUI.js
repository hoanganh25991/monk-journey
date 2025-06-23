import { UIComponent } from '../UIComponent.js';

/**
 * Enemy UI component
 * Displays enemy health and information
 */
export class EnemyUI extends UIComponent {
    /**
     * Create a new EnemyUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('enemy-health-container', game);
        this.enemyName = null;
        this.enemyHealthBar = null;
        this.enemyHealthText = null;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        const template = `
            <div id="enemy-name"></div>
            <div id="enemy-health-bar-container">
                <div id="enemy-health-bar"></div>
                <div id="enemy-health-text"></div>
            </div>
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.enemyName = document.getElementById('enemy-name');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.enemyHealthText = document.getElementById('enemy-health-text');
        
        // Hide initially
        this.hide();
        
        return true;
    }
    
    /**
     * Update the enemy UI
     */
    update() {
        // Find closest enemy - increased detection range from 10 to 30 units
        const playerPosition = this.game.player.getPosition();
        const closestEnemy = this.game.enemyManager.getClosestEnemy(playerPosition, 30);
        
        if (closestEnemy && !closestEnemy.isDead()) {
            // Show enemy health bar
            this.container.style.display = 'block'; // Explicitly set display to block
            
            // Update enemy name
            this.enemyName.textContent = closestEnemy.getName();
            
            // Get health values
            const currentHealth = Math.round(closestEnemy.getHealth());
            const maxHealth = closestEnemy.getMaxHealth();
            const healthPercent = (currentHealth / maxHealth) * 100;
            
            // Update enemy health bar
            this.enemyHealthBar.style.width = `${healthPercent}%`;
            
            // Update enemy health text
            this.enemyHealthText.textContent = `${currentHealth}/${maxHealth}`;
        } else {
            // Hide enemy health bar
            this.container.style.display = 'none'; // Explicitly set display to none
        }
    }
}