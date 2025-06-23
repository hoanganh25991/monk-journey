import { UIComponent } from '../UIComponent.js';

/**
 * Player UI component
 * Displays player health, mana, level, experience, and other stats
 */
export class PlayerUI extends UIComponent {
    /**
     * Create a new PlayerUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('player-stats-container', game);
        this.levelIndicator = null;
        this.healthBar = null;
        this.healthText = null;
        this.manaBar = null;
        this.manaText = null;
        this.experienceBar = null;
        this.experienceText = null;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Store references to elements we need to update
        this.levelIndicator = document.getElementById('level-indicator');
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.manaBar = document.getElementById('mana-bar');
        this.manaText = document.getElementById('mana-text');
        this.experienceBar = document.getElementById('experience-bar');
        this.experienceText = document.getElementById('experience-text');
        
        // Initialize with current player data
        this.update();
        
        return true;
    }
    
    /**
     * Update the player UI
     */
    update() {
        if (!this.game.player) return;
        
        // Update level indicator
        this.levelIndicator.textContent = `Level ${this.game.player.getLevel()}`;
        
        // Get health values
        const currentHealth = Math.round(this.game.player.getHealth());
        const maxHealth = Math.round(this.game.player.getMaxHealth());
        const healthPercent = (currentHealth / maxHealth) * 100;
        
        // Update health bar
        this.healthBar.style.width = `${healthPercent}%`;
        
        // Update health text
        this.healthText.textContent = `${currentHealth}/${maxHealth}`;
        
        // Get mana values
        const currentMana = Math.round(this.game.player.getMana());
        const maxMana = Math.round(this.game.player.getMaxMana());
        const manaPercent = (currentMana / maxMana) * 100;
        
        // Update mana bar
        this.manaBar.style.width = `${manaPercent}%`;
        
        // Update mana text
        this.manaText.textContent = `${currentMana}/${maxMana}`;
        
        // Get experience values
        const currentExperience = Math.round(this.game.player.getExperience());
        const experienceToNextLevel = Math.round(this.game.player.getExperienceToNextLevel());
        const experiencePercent = (currentExperience / experienceToNextLevel) * 100;
        
        // Update experience bar
        this.experienceBar.style.width = `${experiencePercent}%`;
        
        // Update experience text
        this.experienceText.textContent = `${currentExperience}/${experienceToNextLevel}`;
        
        // Change health bar color based on health percentage
        if (healthPercent < 25) {
            this.healthBar.style.backgroundColor = '#ff3333'; // Bright red when low
            this.healthBar.style.boxShadow = '0 0 8px #ff3333';
        } else if (healthPercent < 50) {
            this.healthBar.style.backgroundColor = '#ff6633'; // Orange-red when medium
            this.healthBar.style.boxShadow = '0 0 5px #ff6633';
        } else {
            this.healthBar.style.backgroundColor = '#ff0000'; // Normal red when high
            this.healthBar.style.boxShadow = 'none';
        }
        
        // Set experience bar color
        this.experienceBar.style.backgroundColor = '#ffcc00'; // Gold color
        this.experienceBar.style.boxShadow = '0 0 5px #ffcc00';
    }
}