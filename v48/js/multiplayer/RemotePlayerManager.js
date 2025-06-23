/**
 * RemotePlayerManager.js
 * Manages remote players in the multiplayer game
 */

import * as THREE from 'three';
import { RemotePlayer } from './RemotePlayer.js';

export class RemotePlayerManager {
    /**
     * Initialize the remote player manager
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        this.game = game;
        this.remotePlayers = new Map(); // Map of remote players by peer ID
    }
    
    /**
     * Update a remote player's position and state
     * @param {string} peerId - The ID of the remote player
     * @param {Object} position - The position of the remote player
     * @param {Object} rotation - The rotation of the remote player
     * @param {string} animation - The current animation of the remote player
     * @param {string} [modelId] - The ID of the model to use for this player
     * @param {string} [playerColor] - The color assigned to the player
     */
    updatePlayer(peerId, position, rotation, animation, modelId, playerColor) {
        // Check if player exists
        if (!this.remotePlayers.has(peerId)) {
            // Create new remote player with model ID and color
            console.debug(`[RemotePlayerManager] Creating new remote player for peer ${peerId} with model ${modelId}`);
            this.createRemotePlayer(peerId, playerColor, modelId);
        } else if (modelId) {
            // If player exists but model ID is provided and different from current, update it
            const remotePlayer = this.remotePlayers.get(peerId);
            if (remotePlayer.modelId !== modelId) {
                console.debug(`[RemotePlayerManager] Updating model for player ${peerId} from ${remotePlayer.modelId} to ${modelId}`);
                remotePlayer.modelId = modelId;
                // Re-initialize the player with the new model
                remotePlayer.init();
            }
        }
        
        // Get remote player
        const remotePlayer = this.remotePlayers.get(peerId);
        
        // Validate position and rotation data
        const validPosition = this.validateVector(position);
        const validRotation = this.validateVector(rotation);
        
        // Update position, rotation, and animation
        console.debug(`[RemotePlayerManager] Updating player ${peerId} - Position:`, validPosition, 
                    "Rotation:", validRotation, "Animation:", animation);
        remotePlayer.updatePosition(validPosition);
        remotePlayer.updateRotation(validRotation);
        remotePlayer.updateAnimation(animation);
        
        // Update color if provided
        if (playerColor && remotePlayer.playerColor !== playerColor) {
            remotePlayer.setPlayerColor(playerColor);
        }
    }
    
    /**
     * Validate a vector object to ensure it has no NaN values
     * @param {Object} vector - The vector to validate
     * @returns {Object} A validated vector with no NaN values
     */
    validateVector(vector) {
        if (!vector) {
            return { x: 0, y: 0, z: 0 };
        }
        
        return {
            x: isNaN(vector.x) ? 0 : vector.x,
            y: isNaN(vector.y) ? 0 : vector.y,
            z: isNaN(vector.z) ? 0 : vector.z
        };
    }
    
    /**
     * Create a new remote player
     * @param {string} peerId - The ID of the remote player
     * @param {string} [playerColor] - The color assigned to the player
     * @param {string} [modelId] - The ID of the model to use for this player
     * @returns {RemotePlayer} The created remote player
     */
    createRemotePlayer(peerId, playerColor, modelId) {
        // Create new remote player with model ID
        const remotePlayer = new RemotePlayer(this.game, peerId, playerColor, modelId);
        
        // Add to map
        this.remotePlayers.set(peerId, remotePlayer);
        
        // Initialize remote player
        remotePlayer.init();
        
        return remotePlayer;
    }
    
    /**
     * Remove a remote player
     * @param {string} peerId - The ID of the remote player to remove
     */
    removePlayer(peerId) {
        // Check if player exists
        if (this.remotePlayers.has(peerId)) {
            // Get remote player
            const remotePlayer = this.remotePlayers.get(peerId);
            
            // Dispose remote player
            remotePlayer.dispose();
            
            // Remove from map
            this.remotePlayers.delete(peerId);
        }
    }
    
    /**
     * Update all remote players
     * @param {number} deltaTime - Time elapsed since the last frame
     */
    update(deltaTime) {
        // Update all remote players
        this.remotePlayers.forEach(remotePlayer => {
            remotePlayer.update(deltaTime);
        });
    }
    
    /**
     * Get all remote players
     * @returns {Map<string, RemotePlayer>} Map of remote players
     */
    getPlayers() {
        return this.remotePlayers;
    }
    
    /**
     * Get a specific remote player by ID
     * @param {string} peerId - The ID of the remote player
     * @returns {RemotePlayer|null} The remote player or null if not found
     */
    getPlayer(peerId) {
        return this.remotePlayers.get(peerId) || null;
    }
    
    /**
     * Get the number of remote players
     * @returns {number} The number of remote players
     */
    getPlayerCount() {
        return this.remotePlayers.size;
    }
    
    /**
     * Handle a remote player casting a skill
     * @param {string} peerId - The ID of the remote player
     * @param {string} skillName - The name of the skill being cast
     * @param {string} [variant] - The variant of the skill being cast (optional)
     * @param {string} [targetEnemyId] - The ID of the target enemy (optional)
     * @returns {boolean} True if the skill animation was played successfully
     */
    handleSkillCast(peerId, skillName, variant, targetEnemyId) {
        // Check if player exists
        if (!this.remotePlayers.has(peerId)) {
            console.debug(`[RemotePlayerManager] Cannot cast skill: Remote player ${peerId} not found - player may have disconnected`);
            return false;
        }
        
        try {
            // Get remote player
            const remotePlayer = this.remotePlayers.get(peerId);
            
            // Cast the skill with variant and target enemy information
            return remotePlayer.castSkill(skillName, variant, targetEnemyId);
        } catch (error) {
            console.error(`[RemotePlayerManager] Error casting skill ${skillName} for player ${peerId}:`, error);
            return false;
        }
    }
    
    /**
     * Remove all remote players
     * Cleans up all remote player instances and clears the map
     */
    removeAllPlayers() {
        console.debug(`[RemotePlayerManager] Removing all remote players (${this.remotePlayers.size} players)`);
        
        // Dispose all remote players
        this.remotePlayers.forEach(remotePlayer => {
            remotePlayer.dispose();
        });
        
        // Clear the map
        this.remotePlayers.clear();
    }
}