/**
 * ControlsDisplay.js
 * Dynamically generates and updates the controls display in the settings menu
 */

import { MOVEMENT_KEYS, ACTION_KEYS, UI_KEYS, SKILL_KEYS } from '../config/input.js';

export class ControlsDisplay {
    /**
     * Initialize the controls display
     */
    static initialize() {
        // Update keyboard controls
        this.updateKeyboardControls();
        
        // Update mobile controls
        this.updateMobileControls();
    }
    
    /**
     * Update the keyboard controls display based on the input configuration
     */
    static updateKeyboardControls() {
        const keyboardControlsContainer = document.getElementById('keyboard-controls-container');
        if (!keyboardControlsContainer) return;
        
        // Get the controls info container or create it if it doesn't exist
        let controlsInfo = keyboardControlsContainer.querySelector('.controls-info');
        if (!controlsInfo) {
            controlsInfo = document.createElement('div');
            controlsInfo.className = 'controls-info controls-info-vertical-scroll';
            keyboardControlsContainer.appendChild(controlsInfo);
        } else {
            // Clear existing controls
            controlsInfo.innerHTML = '';
            // Remove two-column class if it exists
            controlsInfo.classList.remove('controls-info-two-columns');
            // Add vertical scroll class
            controlsInfo.classList.add('controls-info-vertical-scroll');
        }
        
        // Create a single column for vertical scrolling
        const controlsColumn = document.createElement('div');
        controlsColumn.className = 'controls-column controls-column-full';
        
        // Add column to the controls info container
        controlsInfo.appendChild(controlsColumn);
        
        // Add movement section title
        const movementTitle = document.createElement('h4');
        movementTitle.textContent = 'Movement';
        controlsColumn.appendChild(movementTitle);
        
        // Add movement controls
        this.addControlRow(controlsColumn, this.formatKeys(MOVEMENT_KEYS.FORWARD.concat(MOVEMENT_KEYS.BACKWARD, MOVEMENT_KEYS.LEFT, MOVEMENT_KEYS.RIGHT)), 'Movement');
        
        // Add combat section title
        const combatTitle = document.createElement('h4');
        combatTitle.textContent = 'Combat';
        controlsColumn.appendChild(combatTitle);
        
        // Add primary attack
        this.addControlRow(controlsColumn, this.formatKey(SKILL_KEYS.PRIMARY_ATTACK), 'Primary Attack');
        
        // Add skill keys
        const skillKeys = [];
        for (let i = 1; i <= 9; i++) {
            const key = SKILL_KEYS[`SKILL_${i}`];
            if (key) skillKeys.push(key);
        }
        this.addControlRow(controlsColumn, this.formatKeys(skillKeys), 'Skills');
        
        // Add actions section title
        const actionsTitle = document.createElement('h4');
        actionsTitle.textContent = 'Actions';
        controlsColumn.appendChild(actionsTitle);
        
        // Add action keys
        for (const [action, key] of Object.entries(ACTION_KEYS)) {
            const description = this.formatActionDescription(action);
            this.addControlRow(controlsColumn, this.formatKey(key), description);
        }
        
        // Add UI section title
        const uiTitle = document.createElement('h4');
        uiTitle.textContent = 'UI Controls';
        controlsColumn.appendChild(uiTitle);
        
        // Add UI keys
        for (const [action, key] of Object.entries(UI_KEYS)) {
            const description = this.formatActionDescription(action);
            this.addControlRow(controlsColumn, this.formatKey(key), description);
        }
    }
    
    /**
     * Update the mobile controls display
     */
    static updateMobileControls() {
        const mobileControlsContainer = document.getElementById('mobile-controls-container');
        if (!mobileControlsContainer) return;
        
        // Get the controls info container or create it if it doesn't exist
        let controlsInfo = mobileControlsContainer.querySelector('.controls-info');
        if (!controlsInfo) {
            controlsInfo = document.createElement('div');
            controlsInfo.className = 'controls-info controls-info-vertical-scroll';
            mobileControlsContainer.appendChild(controlsInfo);
        } else {
            // Clear existing controls
            controlsInfo.innerHTML = '';
            // Remove two-column class if it exists
            controlsInfo.classList.remove('controls-info-two-columns');
            // Add vertical scroll class
            controlsInfo.classList.add('controls-info-vertical-scroll');
        }
        
        // Create a single column for vertical scrolling
        const controlsColumn = document.createElement('div');
        controlsColumn.className = 'controls-column controls-column-full';
        
        // Add column to the controls info container
        controlsInfo.appendChild(controlsColumn);
        
        // Add mobile controls section title
        const touchControlsTitle = document.createElement('h4');
        touchControlsTitle.textContent = 'Touch Controls';
        controlsColumn.appendChild(touchControlsTitle);
        
        // Add mobile controls
        this.addControlRow(controlsColumn, 'Left Joystick', 'Movement');
        this.addControlRow(controlsColumn, 'Skill Buttons', 'Activate Skills');
        this.addControlRow(controlsColumn, 'Tap Enemy', 'Attack Target');
        this.addControlRow(controlsColumn, 'Tap Object', 'Interact');
        
        // Add UI buttons section title
        const uiButtonsTitle = document.createElement('h4');
        uiButtonsTitle.textContent = 'UI Buttons';
        controlsColumn.appendChild(uiButtonsTitle);
        
        // Add UI buttons
        this.addControlRow(controlsColumn, '🌲 Button', 'Open Skill Tree');
        this.addControlRow(controlsColumn, '✨ Button', 'Open Skill Selection');
        this.addControlRow(controlsColumn, 'Map Button', 'Toggle Mini Map');
        this.addControlRow(controlsColumn, '⛩️ Button', 'Open Game Menu');
    }
    
    /**
     * Add a control row to the controls info container
     * @param {HTMLElement} container - The container to add the row to
     * @param {string} key - The key or control
     * @param {string} description - The description of the control
     */
    static addControlRow(container, key, description) {
        const row = document.createElement('div');
        row.className = 'control-row';
        
        const keySpan = document.createElement('span');
        keySpan.className = 'control-key';
        keySpan.textContent = key;
        
        const descSpan = document.createElement('span');
        descSpan.className = 'control-description';
        descSpan.textContent = description;
        
        row.appendChild(keySpan);
        row.appendChild(descSpan);
        container.appendChild(row);
    }
    
    /**
     * Format a key code to a user-friendly display
     * @param {string} keyCode - The key code
     * @returns {string} - The formatted key
     */
    static formatKey(keyCode) {
        if (!keyCode) return '';
        
        // Handle special cases
        switch (keyCode) {
            case 'Space':
                return 'Space';
            case 'ArrowUp':
                return '↑';
            case 'ArrowDown':
                return '↓';
            case 'ArrowLeft':
                return '←';
            case 'ArrowRight':
                return '→';
            case 'BracketLeft':
                return '[';
            case 'BracketRight':
                return ']';
            default:
                // For Digit keys, just return the number
                if (keyCode.startsWith('Digit')) {
                    return keyCode.charAt(5);
                }
                // For Key keys, just return the letter
                if (keyCode.startsWith('Key')) {
                    return keyCode.charAt(3);
                }
                return keyCode;
        }
    }
    
    /**
     * Format multiple keys into a user-friendly display
     * @param {string[]} keyCodes - The key codes
     * @returns {string} - The formatted keys
     */
    static formatKeys(keyCodes) {
        if (!keyCodes || keyCodes.length === 0) return '';
        
        // Format each key and join with commas
        return keyCodes.map(key => this.formatKey(key)).join(', ');
    }
    
    /**
     * Format an action name to a user-friendly description
     * @param {string} action - The action name
     * @returns {string} - The formatted description
     */
    static formatActionDescription(action) {
        if (!action) return '';
        
        // Split by underscore and capitalize each word
        const words = action.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
        
        // Handle special cases
        switch (action) {
            case 'TOGGLE_HUD':
                return 'Toggle HUD Visibility';
            case 'TOGGLE_INVENTORY':
                return 'Toggle Inventory';
            case 'TOGGLE_SKILL_TREE':
                return 'Toggle Skill Tree';
            case 'TOGGLE_MINIMAP':
                return 'Toggle Mini Map';
            case 'MINIMAP_ZOOM_IN':
                return 'Zoom In Mini Map';
            case 'MINIMAP_ZOOM_OUT':
                return 'Zoom Out Mini Map';
            case 'START_GAME':
                return 'Start Game';
            default:
                return words.join(' ');
        }
    }
}