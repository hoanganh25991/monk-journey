/**
 * Handles serialization and deserialization of game settings
 */
export class SettingsSerializer {
    /**
     * Serialize game settings for saving
     * @param {Object} game - The game object
     * @returns {Object} Serialized settings data
     */
    static serialize(game) {
        if (!game) {
            console.warn('Game object is null or undefined');
            return {};
        }
        
        try {
            const settings = {
                difficulty: game.difficulty || 'basic',
                audioSettings: {}
            };
            
            // Only add audio settings if audioManager exists and is initialized
            if (game.audioManager) {
                settings.audioSettings = {
                    isMuted: game.audioManager.isMuted !== undefined ? 
                        game.audioManager.isMuted : false,
                    musicVolume: game.audioManager.musicVolume !== undefined ? 
                        game.audioManager.musicVolume : 0.5,
                    sfxVolume: game.audioManager.sfxVolume !== undefined ? 
                        game.audioManager.sfxVolume : 0.8
                };
            }
            
            return settings;
        } catch (error) {
            console.warn('Error getting game settings, returning defaults:', error);
            // Return default settings if there's an error
            return {
                difficulty: 'basic',
                audioSettings: {
                    isMuted: false,
                    musicVolume: 0.5,
                    sfxVolume: 0.8
                }
            };
        }
    }
    
    /**
     * Deserialize settings data from save
     * @param {Object} game - The game object to update
     * @param {Object} settings - The saved settings data
     */
    static deserialize(game, settings) {
        if (!game || !settings) {
            return;
        }
        
        try {
            // Load difficulty
            if (settings.difficulty !== undefined) {
                game.difficulty = settings.difficulty;
                // Apply difficulty to enemy manager if available
                if (game.enemyManager) {
                    game.enemyManager.setDifficulty(settings.difficulty);
                }
            }
            
            // Load audio settings
            if (settings.audioSettings && game.audioManager) {
                // Check if audioManager exists and is initialized
                if (settings.audioSettings.isMuted !== undefined) {
                    game.audioManager.isMuted = settings.audioSettings.isMuted;
                }
                
                if (settings.audioSettings.musicVolume !== undefined) {
                    try {
                        game.audioManager.setMusicVolume(settings.audioSettings.musicVolume);
                    } catch (audioError) {
                        console.warn('Error setting music volume:', audioError);
                    }
                }
                
                if (settings.audioSettings.sfxVolume !== undefined) {
                    try {
                        game.audioManager.setSFXVolume(settings.audioSettings.sfxVolume);
                    } catch (audioError) {
                        console.warn('Error setting SFX volume:', audioError);
                    }
                }
            }
        } catch (error) {
            console.warn('Error applying game settings, continuing with defaults:', error);
        }
    }
}