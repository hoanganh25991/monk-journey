/**
 * Input Configuration
 * This file contains all key mappings and input-related configurations for the game.
 */

// Movement keys
export const MOVEMENT_KEYS = {
    FORWARD: ['KeyW', 'ArrowUp'],
    BACKWARD: ['KeyS', 'ArrowDown'],
    LEFT: ['KeyA', 'ArrowLeft'],
    RIGHT: ['KeyD', 'ArrowRight']
};

// Action keys
export const ACTION_KEYS = {
    INTERACT: 'KeyE',
    START_GAME: 'KeyG'
};

// UI toggle keys
export const UI_KEYS = {
    TOGGLE_INVENTORY: 'KeyY',
    TOGGLE_SKILL_TREE: 'KeyT',
    TOGGLE_HUD: 'KeyF',
    TOGGLE_MINIMAP: 'KeyM',
    MINIMAP_ZOOM_IN: 'BracketLeft',
    MINIMAP_ZOOM_OUT: 'BracketRight'
};

// Skill keys
export const SKILL_KEYS = {
    PRIMARY_ATTACK: 'KeyH',
    SKILL_1: 'Digit1',
    SKILL_2: 'Digit2',
    SKILL_3: 'Digit3',
    SKILL_4: 'Digit4',
    SKILL_5: 'Digit5',
    SKILL_6: 'Digit6',
    SKILL_7: 'Digit7',
    SKILL_8: 'Digit8',
    SKILL_9: 'Digit9'
};

// Get all skill keys as an array
export const getAllSkillKeys = () => {
    return Object.values(SKILL_KEYS);
};

// Get skill index from key code (returns 0-based index)
export const getSkillIndexFromKeyCode = (keyCode) => {
    if (keyCode === SKILL_KEYS.PRIMARY_ATTACK) {
        return -1; // Special case for primary attack
    }
    
    // For digit keys, extract the number and convert to 0-based index
    if (keyCode.startsWith('Digit')) {
        return parseInt(keyCode.charAt(5)) - 1;
    }
    
    return -1; // Not a skill key
};

// Check if a key is a skill key
export const isSkillKey = (keyCode) => {
    return Object.values(SKILL_KEYS).includes(keyCode);
};

// Default cooldown for continuous casting (in seconds)
export const CAST_INTERVAL = 0.1;

// Interaction range (in world units)
export const INTERACTION_RANGE = 3;

export const JOYSTICK = {
    sizeMultiplier: 1, // Size multiplier (1 = 100% of defined size)
    baseSize: 130, // Base size in pixels
    handleSize: 60  // Handle size in pixels
}