/**
 * Enemy behavior configuration file
 * Contains settings for enemy detection range, attack range, and other behavior parameters
 */

// Global enemy behavior settings
export const ENEMY_BEHAVIOR_SETTINGS = {
    // Detection range - how far enemies can detect and start chasing the player (in units)
    detectionRange: 3000,
    
    // Attack range multiplier - multiplies the base attack range defined in enemy types
    attackRangeMultiplier: 1.2,
    
    // Aggression settings
    aggressionSettings: {
        // Whether enemies should maintain aggression even if player moves out of detection range
        persistentAggression: true,
        
        // How long (in seconds) enemies should maintain aggression after player leaves detection range
        aggressionTimeout: 5
    }
};

// Behavior settings by enemy type
export const ENEMY_TYPE_BEHAVIOR = {
    // Default behavior applied to all enemies unless overridden
    'default': {
        detectionRange: 3000,
        attackRangeMultiplier: 1.2,
        persistentAggression: true,
        aggressionTimeout: 5
    },
    
    // Specific enemy type overrides
    'skeleton_archer': {
        detectionRange: 40,
        attackRangeMultiplier: 1.5,
        persistentAggression: true,
        aggressionTimeout: 8
    },
    
    'necromancer': {
        detectionRange: 35,
        attackRangeMultiplier: 1.3,
        persistentAggression: true,
        aggressionTimeout: 10
    }
};