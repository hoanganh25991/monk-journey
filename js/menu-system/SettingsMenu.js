/**
 * SettingsMenu.js
 * Manages the settings menu UI component
 */

import { UIComponent } from '../UIComponent.js';
import { PerformanceTab } from './settings-menu/PerformanceTab.js';
import { GameplayTab } from './settings-menu/GameplayTab.js';
import { CharacterModelTab } from './settings-menu/CharacterModelTab.js';
import { SkillsPreviewTab } from './settings-menu/SkillsPreviewTab.js';
import { AudioTab } from './settings-menu/AudioTab.js';
import { ControlsTab } from './settings-menu/ControlsTab.js';
import { EnemyPreviewTab } from './settings-menu/EnemyPreviewTab.js';
import { ReleaseTab } from './settings-menu/ReleaseTab.js';
import { SaveOperationProgress } from '../save-manager/utils/SaveOperationProgress.js';

export class SettingsMenu extends UIComponent {
    /**
     * Create a settings menu
     * @param {Game} game - The game instance
     */
    constructor(game) {
        super('main-options-menu', game);
        
        // Footer buttons
        this.backButton = document.getElementById('settings-back-button');
        this.saveButton = document.getElementById('settings-save-button');
        
        this.fromInGame = false;
        this.mainMenu = null;
        
        // Tab components
        this.tabs = {};
        
        this.init();
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeTabs();
        this.initializeTabComponents();
        this.setupBackButton();
        this.setupSaveButton();
        return true;
    }
    
    /**
     * Initialize tab functionality
     * @private
     */
    initializeTabs() {
        // Get all tab buttons and content (including icon tabs)
        const tabButtons = document.querySelectorAll('.tab-button, .tab-icon');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Add click event to each tab button
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Get the tab id from the button id
                const tabId = button.id.replace('tab-', '');
                
                // Show the corresponding tab content
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                    
                    // Call onActivate for the active tab
                    if (this.tabs[tabId]) {
                        this.tabs[tabId].onActivate();
                    }
                    
                    // Call onDeactivate for all other tabs
                    Object.keys(this.tabs).forEach(key => {
                        if (key !== tabId && this.tabs[key]) {
                            this.tabs[key].onDeactivate();
                        }
                    });
                }
            });
        });
    }
    
    /**
     * Initialize all tab components
     * @private
     */
    initializeTabComponents() {
        // Create tab components
        this.tabs.performance = new PerformanceTab(this.game, this);
        this.tabs.game = new GameplayTab(this.game, this);
        this.tabs['model-preview'] = new CharacterModelTab(this.game, this);
        this.tabs['skills-preview'] = new SkillsPreviewTab(this.game, this);
        this.tabs.audio = new AudioTab(this.game, this);
        this.tabs.controls = new ControlsTab(this.game, this);
        this.tabs['enemy-preview'] = new EnemyPreviewTab(this.game, this);
        this.tabs.release = new ReleaseTab(this.game, this);
    }
    
    /**
     * Set up back button
     * @private
     */
    setupBackButton() {
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                // Save settings before going back
                // this.saveSettings();
                
                // Hide settings menu
                this.hide();
                
                // Show main menu if available
                this.game.menuManager.showMenu('gameMenu');
                
                // Resume game if coming from in-game
                this.game.resume(false);
            });
        }
    }
    
    /**
     * Set up save button
     * @private
     */
    setupSaveButton() {
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                // Save settings
                this.saveSettings();
                
                // Use SaveOperationProgress to show a simple "Settings saved!" message
                const saveProgress = new SaveOperationProgress(this.game, 'save');
                saveProgress.start('Settings saved!');
                saveProgress.update('Settings saved!', 100);
                
                // Show main menu and resume game after a delay
                setTimeout(() => {
                    // Hide the progress indicator
                    saveProgress.hide();
                    
                    // Show main menu if available
                    this.game.menuManager.showMenu('gameMenu');
                    // Resume game if coming from in-game
                    this.game.resume(false);
                }, 300);
            });
        }
    }
    
    /**
     * Save all settings
     * @private
     */
    saveSettings() {
        // Save settings for all tabs
        Object.values(this.tabs).forEach(tab => {
            if (tab && typeof tab.saveSettings === 'function') {
                tab.saveSettings();
            }
        });
    }
    
    /**
     * Show the settings menu
     * @param {boolean|HTMLElement} fromInGameOrElement - Whether the settings menu is being shown from in-game or the element that triggered the show
     * @param {MainMenu|boolean} mainMenuOrIsPaused - Reference to the main menu or whether the game is paused
     */
    showSettings(fromInGameOrElement = false, mainMenuOrIsPaused = null) {
        // Handle both old and new parameter formats
        if (typeof fromInGameOrElement === 'boolean') {
            // New format: showSettings(fromInGame, mainMenu)
            this.fromInGame = fromInGameOrElement;
            this.mainMenu = mainMenuOrIsPaused;
        } else {
            // Old format: show(element, isPaused)
            this.fromInGame = mainMenuOrIsPaused || false;
            this.mainMenu = null;
        }
        
        // Show the settings menu
        this.show();
        
        // Resize all tab components
        this.resizeAllTabs();
        
        // Activate the first tab
        const firstTabButton = document.querySelector('.tab-button, .tab-icon');
        if (firstTabButton) {
            firstTabButton.click();
        }
    }
    
    /**
     * Resize all tab components
     * @private
     */
    resizeAllTabs() {
        // Resize all tab components
        Object.values(this.tabs).forEach(tab => {
            if (tab && typeof tab.resize === 'function') {
                tab.resize();
            }
        });
    }
    
    /**
     * Update the component
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Update all tab components
        Object.values(this.tabs).forEach(tab => {
            if (tab && typeof tab.update === 'function') {
                tab.update(delta);
            }
        });
    }
    
    /**
     * Clean up the component
     */
    dispose() {
        // Dispose all tab components
        Object.values(this.tabs).forEach(tab => {
            if (tab && typeof tab.dispose === 'function') {
                tab.dispose();
            }
        });
        
        // Clear tabs
        this.tabs = {};
    }
}