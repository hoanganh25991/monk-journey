/**
 * EnemyPreviewTab.js
 * Manages the enemy preview tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { EnemyPreview } from '../EnemyPreview.js';
import { ENEMY_TYPES, BOSS_TYPES } from '../../config/game-balance.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

export class EnemyPreviewTab extends SettingsTab {
    /**
     * Create an enemy preview tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('enemy-preview', game, settingsMenu);
        
        // Enemy preview elements
        this.enemyPreviewContainer = document.getElementById('enemy-preview-container');
        this.enemyPreviewSelect = document.getElementById('enemy-preview-select');
        this.prevEnemyButton = document.getElementById('prev-enemy-button');
        this.nextEnemyButton = document.getElementById('next-enemy-button');
        this.enemyAnimationSelect = document.getElementById('enemy-animation-select');
        this.prevEnemyAnimButton = document.getElementById('prev-enemy-anim-button');
        this.nextEnemyAnimButton = document.getElementById('next-enemy-anim-button');
        this.enemyDetailsContainer = document.getElementById('enemy-details');
        this.resetEnemyCameraButton = document.getElementById('reset-enemy-camera-button');
        
        this.enemyPreview = null;
        this.currentEnemy = null;
        
        this.init();
    }
    
    /**
     * Initialize the enemy preview
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Initialize enemy select dropdown
        this.initializeEnemyOptions();
        
        // Set up navigation buttons for enemy preview
        this.setupEnemyNavigationButtons();
        
        // Initialize the enemy preview container
        this.initializeEnemyPreviewContainer();
        
        // Initialize enemy animation options
        this.initializeEnemyAnimationOptions();
        
        return true;
    }
    
    /**
     * Initialize enemy options in the select element
     * @private
     */
    initializeEnemyOptions() {
        if (!this.enemyPreviewSelect) return;
        
        // Clear existing options
        while (this.enemyPreviewSelect.options.length > 0) {
            this.enemyPreviewSelect.remove(0);
        }
        
        // Combine regular enemies and bosses
        const allEnemies = [...ENEMY_TYPES, ...BOSS_TYPES];
        
        // Add enemy options
        allEnemies.forEach((enemy, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = enemy.name;
            this.enemyPreviewSelect.appendChild(option);
        });
        
        // Get the stored selected enemy index or default to 0
        let selectedEnemyIndex = 0;
        const storedEnemyIndex = localStorage.getItem(STORAGE_KEYS.SELECTED_ENEMY_PREVIEW);
        
        if (storedEnemyIndex !== null && !isNaN(parseInt(storedEnemyIndex)) && 
            parseInt(storedEnemyIndex) >= 0 && parseInt(storedEnemyIndex) < allEnemies.length) {
            selectedEnemyIndex = parseInt(storedEnemyIndex);
        }
        
        // Set the selected enemy
        this.enemyPreviewSelect.value = selectedEnemyIndex;
        this.currentEnemy = allEnemies[selectedEnemyIndex];
        
        // Add change event listener
        this.enemyPreviewSelect.addEventListener('change', () => {
            const selectedIndex = parseInt(this.enemyPreviewSelect.value);
            localStorage.setItem(STORAGE_KEYS.SELECTED_ENEMY_PREVIEW, selectedIndex);
            
            // Update the current enemy
            this.currentEnemy = allEnemies[selectedIndex];
            
            // Update the enemy preview
            this.updateEnemyPreview();
            
            // Update the enemy details
            this.updateEnemyDetails();
            
            // Update the enemy animation options
            this.initializeEnemyAnimationOptions();
        });
    }
    
    /**
     * Set up navigation buttons for enemy preview
     * @private
     */
    setupEnemyNavigationButtons() {
        // Combine regular enemies and bosses
        const allEnemies = [...ENEMY_TYPES, ...BOSS_TYPES];
        
        if (this.prevEnemyButton) {
            this.prevEnemyButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.enemyPreviewSelect.value);
                const newIndex = (currentIndex - 1 + allEnemies.length) % allEnemies.length;
                this.enemyPreviewSelect.value = newIndex;
                this.enemyPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextEnemyButton) {
            this.nextEnemyButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.enemyPreviewSelect.value);
                const newIndex = (currentIndex + 1) % allEnemies.length;
                this.enemyPreviewSelect.value = newIndex;
                this.enemyPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
    }
    
    /**
     * Initialize the enemy preview container
     * @private
     */
    initializeEnemyPreviewContainer() {
        if (!this.enemyPreviewContainer) return;
        
        // Create enemy preview
        this.enemyPreview = new EnemyPreview(this.enemyPreviewContainer);
        
        // Initialize the enemy preview
        this.enemyPreview.init();
        
        // Update the enemy preview with the current enemy
        this.updateEnemyPreview();
        
        // Update the enemy details
        this.updateEnemyDetails();
        
        // Set up reset camera button
        if (this.resetEnemyCameraButton) {
            this.resetEnemyCameraButton.addEventListener('click', () => {
                if (this.enemyPreview) {
                    this.enemyPreview.resetCamera();
                }
            });
        }
    }
    
    /**
     * Initialize enemy animation options in the select element
     * @private
     */
    initializeEnemyAnimationOptions() {
        if (!this.enemyAnimationSelect || !this.currentEnemy) return;
        
        // Clear existing options
        while (this.enemyAnimationSelect.options.length > 0) {
            this.enemyAnimationSelect.remove(0);
        }
        
        // Add animation options
        if (this.currentEnemy.animations && this.currentEnemy.animations.length > 0) {
            this.currentEnemy.animations.forEach((animation, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = animation.name || `Animation ${index + 1}`;
                this.enemyAnimationSelect.appendChild(option);
            });
        }
        
        // Get the stored selected animation index or default to 0
        let selectedAnimationIndex = 0;
        const storedAnimationIndex = localStorage.getItem(STORAGE_KEYS.SELECTED_ENEMY_ANIMATION);
        
        if (storedAnimationIndex !== null && !isNaN(parseInt(storedAnimationIndex)) && 
            parseInt(storedAnimationIndex) >= 0 && this.currentEnemy.animations && 
            parseInt(storedAnimationIndex) < this.currentEnemy.animations.length) {
            selectedAnimationIndex = parseInt(storedAnimationIndex);
        }
        
        // Set the selected animation
        this.enemyAnimationSelect.value = selectedAnimationIndex;
        
        // Add change event listener
        this.enemyAnimationSelect.addEventListener('change', () => {
            const selectedIndex = parseInt(this.enemyAnimationSelect.value);
            localStorage.setItem(STORAGE_KEYS.SELECTED_ENEMY_ANIMATION, selectedIndex);
            
            // Update the enemy preview animation
            if (this.enemyPreview && this.currentEnemy.animations && this.currentEnemy.animations.length > 0) {
                this.enemyPreview.setAnimation(this.currentEnemy.animations[selectedIndex]);
            }
        });
        
        // Set up animation navigation buttons
        if (this.prevEnemyAnimButton) {
            this.prevEnemyAnimButton.addEventListener('click', () => {
                if (!this.currentEnemy.animations || this.currentEnemy.animations.length === 0) return;
                
                const currentIndex = parseInt(this.enemyAnimationSelect.value);
                const newIndex = (currentIndex - 1 + this.currentEnemy.animations.length) % this.currentEnemy.animations.length;
                this.enemyAnimationSelect.value = newIndex;
                this.enemyAnimationSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextEnemyAnimButton) {
            this.nextEnemyAnimButton.addEventListener('click', () => {
                if (!this.currentEnemy.animations || this.currentEnemy.animations.length === 0) return;
                
                const currentIndex = parseInt(this.enemyAnimationSelect.value);
                const newIndex = (currentIndex + 1) % this.currentEnemy.animations.length;
                this.enemyAnimationSelect.value = newIndex;
                this.enemyAnimationSelect.dispatchEvent(new Event('change'));
            });
        }
    }
    
    /**
     * Update the enemy preview with the current enemy
     * @private
     */
    updateEnemyPreview() {
        if (!this.enemyPreview || !this.currentEnemy) return;
        
        // Load the enemy model
        this.enemyPreview.loadEnemyModel(this.currentEnemy);
        
        // Get the selected animation
        const selectedAnimationIndex = parseInt(this.enemyAnimationSelect.value || 0);
        
        // Set the animation if available
        if (this.currentEnemy.animations && this.currentEnemy.animations.length > 0) {
            // Note: Animation handling is done within loadEnemyModel
            // If we need to set a specific animation, we would need to add that functionality
        }
    }
    
    /**
     * Update the enemy details display
     * @private
     */
    updateEnemyDetails() {
        if (!this.enemyDetailsContainer || !this.currentEnemy) return;
        
        // Create the enemy details HTML
        const html = `
            <h3>${this.currentEnemy.name}</h3>
            <p>${this.currentEnemy.description || 'No description available.'}</p>
            <div class="enemy-stats">
                <div class="enemy-stat">
                    <span class="stat-label">Health:</span>
                    <span class="stat-value">${this.currentEnemy.health || 'N/A'}</span>
                </div>
                <div class="enemy-stat">
                    <span class="stat-label">Damage:</span>
                    <span class="stat-value">${this.currentEnemy.damage || 'N/A'}</span>
                </div>
                <div class="enemy-stat">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">${this.currentEnemy.speed || 'N/A'}</span>
                </div>
                <div class="enemy-stat">
                    <span class="stat-label">Type:</span>
                    <span class="stat-value">${this.currentEnemy.type || 'Regular'}</span>
                </div>
            </div>
        `;
        
        // Set the enemy details HTML
        this.enemyDetailsContainer.innerHTML = html;
    }
    
    /**
     * Resize the enemy preview to fit the container
     */
    resize() {
        this.resizeEnemyPreview();
    }
    
    /**
     * Resize the enemy preview to fit the container
     * @private
     */
    resizeEnemyPreview() {
        if (!this.enemyPreview) return;
        
        const container = this.enemyPreviewContainer;
        if (!container) return;
        
        // Get the container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Update the enemy preview size
        this.enemyPreview.setSize(width, height);
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // Resize the enemy preview when the tab is activated
        setTimeout(() => {
            this.resize();
            
            // Force restart the animation when the enemy preview tab is clicked
            if (this.enemyPreview) {
                this.enemyPreview.forceRestartAnimation();
            }
        }, 50);
    }
    
    /**
     * Save the enemy preview settings
     */
    saveSettings() {
        if (this.enemyPreviewSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ENEMY_PREVIEW, this.enemyPreviewSelect.value);
        }
        
        if (this.enemyAnimationSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ENEMY_ANIMATION, this.enemyAnimationSelect.value);
        }
    }
}