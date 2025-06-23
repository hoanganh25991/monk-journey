/**
 * MultiplayerConnectionManager.js
 * Handles WebRTC connections, peer management, and data transfer
 */

import { DEFAULT_CHARACTER_MODEL } from '../config/player-models.js';
import { BinarySerializer } from './BinarySerializer.js';

export class MultiplayerConnectionManager {
    /**
     * Initialize the multiplayer connection manager
     * @param {MultiplayerManager} multiplayerManager - Reference to the main multiplayer manager
     */
    constructor(multiplayerManager) {
        this.multiplayerManager = multiplayerManager;
        this.peer = null; // PeerJS instance
        this.peers = new Map(); // Map of connected peers
        this.isHost = false;
        this.isConnected = false;
        this.hostId = null; // ID of the host (if member)
        this.roomId = null; // Room ID (if host)
        this.serializer = new BinarySerializer(); // Binary serializer for efficient data transfer
        this.useBinaryFormat = false; // Flag to indicate if binary format is enabled
    }

    /**
     * Initialize the connection manager
     */
    async init() {
        try {
            // Initialize binary serializer
            const serializerInitialized = await this.serializer.init();
            if (serializerInitialized) {
                this.useBinaryFormat = true;
                console.debug('[MultiplayerConnectionManager] Binary serialization enabled');
            } else {
                console.warn('[MultiplayerConnectionManager] Binary serialization failed to initialize, falling back to JSON');
                this.useBinaryFormat = false;
            }
            return true;
        } catch (error) {
            console.error('[MultiplayerConnectionManager] Initialization error:', error);
            this.useBinaryFormat = false;
            return true; // Still return true to allow connection without binary format
        }
    }

    /**
     * Host a new game
     * Creates a PeerJS instance and waits for connections
     */
    async hostGame() {
        try {
            this.multiplayerManager.ui.updateConnectionStatus('Initializing host...');
            
            // Initialize PeerJS
            this.peer = new Peer();
            
            // Wait for peer to open
            await new Promise((resolve, reject) => {
                this.peer.on('open', id => {
                    this.roomId = id;
                    resolve();
                });
                this.peer.on('error', err => reject(err));
            });
            
            // Set host flag
            this.isHost = true;
            this.isConnected = true;
            
            // Update multiplayer button to show "Disconnect"
            this.multiplayerManager.ui.updateMultiplayerButton(true);

            // Assign a color to the host
            const hostColor = this.multiplayerManager.playerColors[0]; // First color for host
            this.multiplayerManager.assignedColors.set(this.roomId, hostColor);
            
            // Update host entry in the player list
            this.multiplayerManager.ui.updateHostEntry(this.roomId, hostColor);
            
            // Set up connection handler
            this.peer.on('connection', conn => {
                this.handleNewConnection(conn);
                // Show connection info screen when a player joins
                this.multiplayerManager.ui.showConnectionInfoScreen();
            });
            
            // Show connection info screen immediately
            this.multiplayerManager.ui.showConnectionInfoScreen();
            
            // Update connection status
            this.multiplayerManager.ui.updateConnectionStatus('Waiting for players to join...');
            
            // Disable start button until at least one player joins
            this.multiplayerManager.ui.setStartButtonEnabled(false);
            
            return true;
        } catch (error) {
            console.error('Error hosting game:', error);
            this.multiplayerManager.ui.updateConnectionStatus('Error hosting game: ' + error.message);
            return false;
        }
    }

    /**
     * Join an existing game
     * @param {string} roomId - The room ID to join
     */
    async joinGame(roomId) {
        try {
            this.multiplayerManager.ui.updateConnectionStatus('Connecting to host...');
            
            // Initialize PeerJS
            this.peer = new Peer();
            
            // Wait for peer to open
            await new Promise((resolve, reject) => {
                this.peer.on('open', id => resolve());
                this.peer.on('error', err => reject(err));
            });
            
            // Connect to host
            this.hostId = roomId;
            const conn = this.peer.connect(roomId, {
                reliable: true
            });
            
            // Set up connection
            conn.on('open', () => {
                // Add to peers map
                this.peers.set(roomId, conn);
                
                // Set connected flag
                this.isConnected = true;
                
                // Update multiplayer button to show "Disconnect"
                this.multiplayerManager.ui.updateMultiplayerButton(true);
                
                // Update connection status
                this.multiplayerManager.ui.updateConnectionStatus('Connected to host! Waiting for game to start...', 'connection-info-status-bar');
                
                // Show the connection info screen instead of waiting screen
                this.multiplayerManager.ui.showConnectionInfoScreen();
                
                // The connect button is already disabled in the UI handler
                
                // Set up data handler
                conn.on('data', data => this.handleDataFromHost(this.processReceivedData(data)));
                
                // Set up close handler
                conn.on('close', () => this.handleDisconnect(roomId));
            });
            
            conn.on('error', err => {
                console.error('Connection error:', err);
                this.multiplayerManager.ui.updateConnectionStatus('Connection error: ' + err.message);
            });
            
            return true;
        } catch (error) {
            console.error('Error joining game:', error);
            this.multiplayerManager.ui.updateConnectionStatus('Error joining game: ' + error.message);
            return false;
        }
    }

    /**
     * Handle new connection from a member (host only)
     * @param {DataConnection} conn - The PeerJS connection
     */
    handleNewConnection(conn) {
        // Add to peers map
        this.peers.set(conn.peer, conn);
        
        // Assign a color to the player if not already assigned
        if (!this.multiplayerManager.assignedColors.has(conn.peer)) {
            // Get next available color
            const usedColors = Array.from(this.multiplayerManager.assignedColors.values());
            const availableColor = this.multiplayerManager.playerColors.find(color => !usedColors.includes(color)) || 
                                  this.multiplayerManager.playerColors[Math.floor(Math.random() * this.multiplayerManager.playerColors.length)];
            
            // Assign the color
            this.multiplayerManager.assignedColors.set(conn.peer, availableColor);
        }
        
        const playerColor = this.multiplayerManager.assignedColors.get(conn.peer);
        
        // Update UI
        this.multiplayerManager.ui.addPlayerToList(conn.peer, playerColor);
        
        // Enable start button if at least one player connected
        this.multiplayerManager.ui.setStartButtonEnabled(true);
        
        // Set up data handler
        conn.on('data', data => this.handleDataFromMember(conn.peer, this.processReceivedData(data)));
        
        // Set up close handler
        conn.on('close', () => this.handleDisconnect(conn.peer));
        
        // Send welcome message
        conn.send({
            type: 'welcome',
            message: 'Connected to host'
        });
        
        // Send all player colors to the new member
        const colors = {};
        this.multiplayerManager.assignedColors.forEach((color, id) => {
            colors[id] = color;
        });
        
        conn.send({
            type: 'playerColors',
            colors: colors
        });
        
        // Notify other peers about the new player and their color
        this.peers.forEach((peerConn, peerId) => {
            if (peerId !== conn.peer) {
                peerConn.send({
                    type: 'playerJoined',
                    playerId: conn.peer,
                    playerColor: playerColor
                });
            }
        });
        
        // Create remote player with the assigned color
        this.multiplayerManager.remotePlayerManager.createRemotePlayer(conn.peer, playerColor);
    }

    /**
     * Handle data received from host (member only)
     * @param {Object} data - The data received from the host
     */
    handleDataFromHost(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'welcome':
                console.error('Received welcome message:', data.message);
                break;
            case 'gameState':
                this.multiplayerManager.updateGameState(data);
                break;
            case 'startGame':
                this.multiplayerManager.startGame();
                break;
            case 'playerJoined':
                // Store the player color
                if (data.playerColor) {
                    this.multiplayerManager.assignedColors.set(data.playerId, data.playerColor);
                }
                
                // Create remote player with the assigned color
                this.multiplayerManager.remotePlayerManager.createRemotePlayer(data.playerId, data.playerColor);
                break;
            case 'playerLeft':
                this.multiplayerManager.remotePlayerManager.removePlayer(data.playerId);
                
                // Remove color assignment
                this.multiplayerManager.assignedColors.delete(data.playerId);
                break;
            case 'playerColors':
                // Update all player colors
                if (data.colors) {
                    Object.entries(data.colors).forEach(([playerId, color]) => {
                        this.multiplayerManager.assignedColors.set(playerId, color);
                        
                        // Update remote player color if it exists
                        const remotePlayer = this.multiplayerManager.remotePlayerManager.getPlayer(playerId);
                        if (remotePlayer) {
                            remotePlayer.setPlayerColor(color);
                        }
                    });
                }
                break;
            case 'skillCast':
                // Handle skill cast from host or forwarded from another member
                if (!data.skillName) {
                    console.error('Received incomplete skill cast data from host');
                    return;
                }
                
                // Get the player ID who cast the skill
                const casterId = data.playerId || this.hostId;
                
                console.debug(`[MultiplayerConnectionManager] Player ${casterId} cast skill: ${data.skillName}`);
                
                // Get the remote player
                const remotePlayer = this.multiplayerManager.remotePlayerManager.getPlayer(casterId);
                
                // If position and rotation are provided, update the remote player first
                if (data.position && remotePlayer) {
                    remotePlayer.updatePosition(data.position);
                }
                
                if (data.rotation && remotePlayer) {
                    remotePlayer.updateRotation(data.rotation);
                }
                
                // Trigger skill cast animation on remote player
                this.multiplayerManager.remotePlayerManager.handleSkillCast(casterId, data.skillName, data.variant);
                break;
            case 'kicked':
                // Handle being kicked by the host
                console.debug('[MultiplayerConnectionManager] Kicked from game by host:', data.message);
                
                // Show notification
                if (this.multiplayerManager.game.hudManager) {
                    this.multiplayerManager.game.hudManager.showNotification('You have been removed from the game by the host', 'error');
                }
                
                // Clean up connection
                this.dispose();
                
                // Return to main menu
                if (this.multiplayerManager.game.state) {
                    this.multiplayerManager.game.state.setPaused();
                }
                if (this.multiplayerManager.game.menuManager) {
                    this.multiplayerManager.game.menuManager.showMenu('gameMenu');
                }
                break;
            case 'hostLeft':
                // Handle host leaving the game using the unified method
                this.handleHostDisconnection();
                break;
            case 'playerDamage':
                // Handle damage to the local player from an enemy
                if (data.amount && this.multiplayerManager.game.player) {
                    console.debug(`[MultiplayerConnectionManager] Player taking damage: ${data.amount} from enemy ID: ${data.enemyId}`);
                    this.multiplayerManager.game.player.takeDamage(data.amount);
                }
                break;
            case 'shareExperience':
                // Handle experience shared from killing an enemy
                if (data.amount && this.multiplayerManager.game.player) {
                    console.debug(`[MultiplayerConnectionManager] Player receiving experience: ${data.amount} from enemy ID: ${data.enemyId} (shared among ${data.playerCount} players)`);
                    this.multiplayerManager.game.player.addExperience(data.amount);
                }
                break;
            default:
                console.error('Unknown data type from host:', data.type);
        }
    }

    /**
     * Handle data received from member (host only)
     * @param {string} peerId - The ID of the peer
     * @param {Object} data - The data received from the member
     */
    handleDataFromMember(peerId, data) {
        if (!data || !data.type) {
            console.error('[MultiplayerConnectionManager] Received invalid data from member:', peerId);
            return;
        }
        
        try {
            switch (data.type) {
                case 'playerInput':
                    // Process player input
                    this.multiplayerManager.processPlayerInput(peerId, data);
                    break;
                case 'playerPosition':
                    // Validate position data before updating
                    if (!data.position || !data.rotation) {
                        console.error('[MultiplayerConnectionManager] Received incomplete position data from member:', peerId);
                        return;
                    }
                    
                    // Update remote player position
                    this.multiplayerManager.remotePlayerManager.updatePlayer(
                        peerId, 
                        data.position, 
                        data.rotation, 
                        data.animation || 'idle'
                    );
                    break;
                case 'skillCast':
                    // Handle skill cast from member
                    if (!data.skillName) {
                        console.error('[MultiplayerConnectionManager] Received incomplete skill cast data from member:', peerId);
                        return;
                    }
                    
                    console.debug(`[MultiplayerConnectionManager] Member ${peerId} cast skill: ${data.skillName}`);
                    
                    // Get the remote player
                    const remotePlayer = this.multiplayerManager.remotePlayerManager.getPlayer(peerId);
                    
                    // If position and rotation are provided, update the remote player first
                    if (data.position && remotePlayer) {
                        remotePlayer.updatePosition(data.position);
                    }
                    
                    if (data.rotation && remotePlayer) {
                        remotePlayer.updateRotation(data.rotation);
                    }
                    
                    // Trigger skill cast animation on remote player
                    this.multiplayerManager.remotePlayerManager.handleSkillCast(peerId, data.skillName, data.variant);
                    
                    // Forward skill cast to other members
                    this.peers.forEach((conn, id) => {
                        if (id !== peerId) {
                            conn.send({
                                type: 'skillCast',
                                skillName: data.skillName,
                                playerId: peerId,
                                position: data.position,
                                rotation: data.rotation,
                                variant: data.variant // Include the variant information
                            });
                        }
                    });
                    break;
                case 'playerDamage':
                    // Handle damage to a remote player from an enemy (host only)
                    if (data.amount && data.enemyId) {
                        console.debug(`[MultiplayerConnectionManager] Remote player ${peerId} taking damage: ${data.amount} from enemy ID: ${data.enemyId}`);
                        
                        // Apply damage to the remote player if we have a player manager
                        const remotePlayer = this.multiplayerManager.remotePlayerManager.getPlayer(peerId);
                        if (remotePlayer && typeof remotePlayer.takeDamage === 'function') {
                            remotePlayer.takeDamage(data.amount);
                        }
                        
                        // Forward damage to other members so they can see the effects
                        this.peers.forEach((conn, id) => {
                            if (id !== peerId) {
                                conn.send({
                                    type: 'playerDamage',
                                    amount: data.amount,
                                    enemyId: data.enemyId,
                                    playerId: peerId // Add the player ID so other clients know who was damaged
                                });
                            }
                        });
                    }
                    break;
                default:
                    console.error('[MultiplayerConnectionManager] Unknown data type from member:', data.type);
            }
        } catch (error) {
            console.error('[MultiplayerConnectionManager] Error handling data from member:', error);
        }
    }

    /**
     * Handle host disconnection (for members)
     * This is a unified method to handle host disconnection, called from both
     * the 'hostLeft' message handler and the handleDisconnect method
     */
    handleHostDisconnection() {
        console.debug('[MultiplayerConnectionManager] Host disconnected from game');
        
        this.isConnected = false;
        this.multiplayerManager.ui.updateMultiplayerButton(false);
        this.multiplayerManager.ui.updateConnectionStatus('Disconnected from host');
        
        // Show notification
        if (this.multiplayerManager.game.hudManager) {
            this.multiplayerManager.game.hudManager.showNotification('The host has left the game', 'error');
        }
        
        // Remove all remote players
        if (this.multiplayerManager.remotePlayerManager) {
            console.debug('[MultiplayerConnectionManager] Removing all remote players after host left');
            this.multiplayerManager.remotePlayerManager.removeAllPlayers();
        }
        
        // Take back control of enemy spawning as local mode
        if (this.multiplayerManager.game.enemyManager) {
            console.debug('[MultiplayerConnectionManager] Taking back control of enemy spawning in local mode');
            
            // Clear existing enemies (which were controlled by host)
            this.multiplayerManager.game.enemyManager.removeAllEnemies();
            
            // Start local enemy spawning
            this.multiplayerManager.game.enemyManager.enableLocalSpawning();
        }
        
        // Clean up connection
        this.dispose();
        
        // Keep the game running but in local mode instead of returning to menu
        if (this.multiplayerManager.game.state) {
            // Don't pause the game, just continue in local mode
            console.debug('[MultiplayerConnectionManager] Continuing game in local mode after host left');
        }
    }

    /**
     * Handle disconnection of a peer
     * @param {string} peerId - The ID of the peer that disconnected
     */
    handleDisconnect(peerId) {
        // Remove from peers map
        this.peers.delete(peerId);
        
        if (this.isHost) {
            // Remove player from list
            this.multiplayerManager.ui.removePlayerFromList(peerId);
            
            // Notify other peers that a player left
            this.peers.forEach(conn => {
                conn.send({
                    type: 'playerLeft',
                    playerId: peerId
                });
            });
            
            // Remove remote player
            this.multiplayerManager.remotePlayerManager.removePlayer(peerId);
            
            // Disable start button if no players connected
            if (this.peers.size === 0) {
                this.multiplayerManager.ui.setStartButtonEnabled(false);
            }
        } else {
            // If host disconnected, handle it with the unified method
            if (peerId === this.hostId) {
                this.handleHostDisconnection();
            }
        }
    }

    /**
     * Kick a player from the game (host only)
     * @param {string} peerId - The ID of the peer to kick
     */
    kickPlayer(peerId) {
        if (!this.isHost) {
            console.error('[MultiplayerConnectionManager] Only the host can kick players');
            return;
        }
        
        const conn = this.peers.get(peerId);
        if (conn) {
            // Send kick message to the player
            conn.send({
                type: 'kicked',
                message: 'You have been removed from the game by the host'
            });
            
            // Close the connection
            conn.close();
            
            // Handle the disconnection (this will clean up UI and notify other players)
            this.handleDisconnect(peerId);
            
            console.debug(`[MultiplayerConnectionManager] Player ${peerId} has been kicked by the host`);
            
            // Show notification
            if (this.multiplayerManager.game.hudManager) {
                this.multiplayerManager.game.hudManager.showNotification('Player has been removed', 'info');
            }
        }
    }
    
    /**
     * Send data to a specific peer
     * @param {string} peerId - The ID of the peer to send data to
     * @param {Object} data - The data to send
     */
    sendToPeer(peerId, data) {
        const conn = this.peers.get(peerId);
        if (conn) {
            if (this.useBinaryFormat) {
                // Serialize to binary format
                const binaryData = this.serializer.serialize(data);
                if (binaryData) {
                    conn.send(binaryData);
                } else {
                    // Fallback to JSON if serialization fails
                    conn.send(data);
                }
            } else {
                // Use JSON format
                conn.send(data);
            }
        }
    }

    /**
     * Broadcast data to all peers
     * @param {Object} data - The data to broadcast
     */
    broadcast(data) {
        if (this.useBinaryFormat) {
            // Serialize once for all peers
            const binaryData = this.serializer.serialize(data);
            if (binaryData) {
                this.peers.forEach(conn => {
                    conn.send(binaryData);
                });
            } else {
                // Fallback to JSON if serialization fails
                this.peers.forEach(conn => {
                    conn.send(data);
                });
            }
        } else {
            // Use JSON format
            this.peers.forEach(conn => {
                conn.send(data);
            });
        }
    }
    
    /**
     * Process received data - handles both binary and JSON formats
     * @param {*} data - The received data
     * @returns {Object} The processed data object
     */
    processReceivedData(data) {
        try {
            // Check if data is binary (Uint8Array or ArrayBuffer)
            if (this.useBinaryFormat && (data instanceof Uint8Array || data instanceof ArrayBuffer)) {
                // Convert ArrayBuffer to Uint8Array if needed
                const binaryData = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
                
                // Log data size for debugging
                console.debug(`[MultiplayerConnectionManager] Processing binary data of size: ${binaryData.length} bytes`);
                
                // Deserialize binary data
                const result = this.serializer.deserialize(binaryData);
                
                // Validate the result has a type property
                if (result && result.type) {
                    return result;
                } else {
                    console.warn('[MultiplayerConnectionManager] Deserialized data is missing type property, using original data');
                    return data;
                }
            }
            
            // Already in JSON format
            return data;
        } catch (error) {
            console.error('[MultiplayerConnectionManager] Error processing received data:', error);
            
            // Add more detailed error information
            if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
                const dataSize = data instanceof ArrayBuffer ? data.byteLength : data.length;
                console.error(`[MultiplayerConnectionManager] Failed to process binary data of size: ${dataSize} bytes`);
            } else if (typeof data === 'object') {
                console.error('[MultiplayerConnectionManager] Failed to process object data with keys:', Object.keys(data));
            } else {
                console.error(`[MultiplayerConnectionManager] Failed to process data of type: ${typeof data}`);
            }
            
            // Return original data as fallback
            return data;
        }
    }

    /**
     * Send player data to host (member only)
     * Optimized to send minimal data
     */
    sendPlayerData() {
        if (this.isHost || !this.isConnected) {
            // Silent return for host or not connected
            return;
        }
        
        if (!this.multiplayerManager.game.player) {
            console.error('[MultiplayerConnectionManager] Cannot send player data: game.player is null');
            return;
        }
        
        const hostConn = this.peers.get(this.hostId);
        if (!hostConn) {
            console.error('[MultiplayerConnectionManager] Cannot send player data: no connection to host');
            return;
        }
        
        try {
            // Get player position from movement component if available (more reliable)
            let position = null;
            let rotation = null;
            
            if (this.multiplayerManager.game.player.movement && this.multiplayerManager.game.player.movement.getPosition) {
                const validPos = this.multiplayerManager.game.player.movement.getPosition();
                if (validPos && !isNaN(validPos.x) && !isNaN(validPos.y) && !isNaN(validPos.z)) {
                    position = {
                        x: validPos.x,
                        y: validPos.y,
                        z: validPos.z
                    };
                }
                
                // Get rotation if available
                if (this.multiplayerManager.game.player.movement.getRotation) {
                    const validRot = this.multiplayerManager.game.player.movement.getRotation();
                    if (validRot && !isNaN(validRot.y)) {
                        rotation = {
                            y: validRot.y // Only send y rotation (yaw) to save bandwidth
                        };
                    }
                }
            }
            
            // Fallback to model position if movement position is not available
            if (!position && this.multiplayerManager.game.player.model && this.multiplayerManager.game.player.model.position) {
                const playerPos = this.multiplayerManager.game.player.model.position;
                if (!isNaN(playerPos.x) && !isNaN(playerPos.y) && !isNaN(playerPos.z)) {
                    position = {
                        x: playerPos.x,
                        y: playerPos.y,
                        z: playerPos.z
                    };
                }
            }
            
            // Fallback to model rotation if movement rotation is not available
            if (!rotation && this.multiplayerManager.game.player.model && this.multiplayerManager.game.player.model.rotation) {
                const playerRot = this.multiplayerManager.game.player.model.rotation;
                if (!isNaN(playerRot.y)) {
                    rotation = {
                        y: playerRot.y // Only send y rotation (yaw) to save bandwidth
                    };
                }
            }
            
            // If we still don't have valid position or rotation, don't send anything
            if (!position || !rotation) {
                console.error('[MultiplayerConnectionManager] Cannot send player data: unable to get valid position or rotation');
                return;
            }
            
            // Get current animation (only if it changed to save bandwidth)
            const animation = this.multiplayerManager.game.player.currentAnimation || 'idle';
            
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.05) { // ~5% of broadcasts
                console.debug('[MultiplayerConnectionManager] Member sending player data to host:', 
                        'Position:', position, 
                        'Animation:', animation);
            }

            // Get the player's model ID
            let modelId = DEFAULT_CHARACTER_MODEL;
            if (this.multiplayerManager.game.player.model && this.multiplayerManager.game.player.model.currentModelId) {
                modelId = this.multiplayerManager.game.player.model.currentModelId;
            }
            
            // Create player position data object
            const playerData = {
                type: 'playerPosition',
                position,
                rotation,
                animation,
                modelId // Include model ID
            };
            
            // Send to host using binary format if enabled
            if (this.useBinaryFormat) {
                const binaryData = this.serializer.serialize(playerData);
                if (binaryData) {
                    hostConn.send(binaryData);
                } else {
                    hostConn.send(playerData);
                }
            } else {
                hostConn.send(playerData);
            }
        } catch (error) {
            console.error('[MultiplayerConnectionManager] Error sending player data:', error);
        }
    }

    /**
     * Broadcast game state to all members (host only)
     * Optimized to focus on enemy data and minimize bandwidth
     */
    broadcastGameState() {
        if (!this.isHost) {
            return;
        }
        
        // Only log occasionally to reduce console spam
        if (Math.random() < 0.05) { // ~5% of broadcasts
            console.debug('[MultiplayerConnectionManager] Broadcasting game state to', this.peers.size, 'peers');
        }
        
        // Collect player data - simplified to save bandwidth
        const players = {};
        
        // Add host player with minimal data
        if (this.multiplayerManager.game.player) {
            let hostPosition = null;
            let hostRotation = null;
            
            // Try to get position from movement component first (more reliable)
            if (this.multiplayerManager.game.player.movement && this.multiplayerManager.game.player.movement.getPosition) {
                const validPos = this.multiplayerManager.game.player.movement.getPosition();
                if (validPos && !isNaN(validPos.x) && !isNaN(validPos.y) && !isNaN(validPos.z)) {
                    // Use optimized vector format if binary serialization is enabled
                    hostPosition = this.useBinaryFormat 
                        ? BinarySerializer.optimizeVector(validPos)
                        : {
                            x: validPos.x,
                            y: validPos.y,
                            z: validPos.z
                          };
                }
                
                // Get rotation if available
                if (this.multiplayerManager.game.player.movement.getRotation) {
                    const validRot = this.multiplayerManager.game.player.movement.getRotation();
                    if (validRot && !isNaN(validRot.y)) {
                        // Use optimized rotation format if binary serialization is enabled
                        hostRotation = this.useBinaryFormat 
                            ? BinarySerializer.optimizeRotation(validRot)
                            : { y: validRot.y }; // Only send y rotation (yaw) to save bandwidth
                    }
                }
            }
            
            // Fallback to model position if needed
            if (!hostPosition && this.multiplayerManager.game.player.model && this.multiplayerManager.game.player.model.position) {
                const playerPos = this.multiplayerManager.game.player.model.position;
                if (!isNaN(playerPos.x) && !isNaN(playerPos.y) && !isNaN(playerPos.z)) {
                    hostPosition = {
                        x: playerPos.x,
                        y: playerPos.y,
                        z: playerPos.z
                    };
                }
            }
            
            // Fallback to model rotation if needed
            if (!hostRotation && this.multiplayerManager.game.player.model && this.multiplayerManager.game.player.model.rotation) {
                const playerRot = this.multiplayerManager.game.player.model.rotation;
                if (!isNaN(playerRot.y)) {
                    hostRotation = {
                        y: playerRot.y
                    };
                }
            }
            
            // Only add host player if we have valid position and rotation
            if (hostPosition && hostRotation) {
                players[this.peer.id] = {
                    position: hostPosition,
                    rotation: hostRotation,
                    animation: this.multiplayerManager.game.player.currentAnimation || 'idle'
                };
            }
        }
        
        // Add remote players with minimal data
        this.multiplayerManager.remotePlayerManager.getPlayers().forEach((player, peerId) => {
            if (player && player.group) {
                const position = player.group.position;
                if (!isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z)) {
                    players[peerId] = {
                        position: {
                            x: position.x,
                            y: position.y,
                            z: position.z
                        },
                        rotation: player.model ? {
                            y: player.model.rotation.y // Only send y rotation to save bandwidth
                        } : { y: 0 },
                        animation: player.currentAnimation || 'idle'
                    };
                }
            }
        });
        
        // Collect enemy data - this is the primary focus
        let enemies = {};
        if (this.multiplayerManager.game.enemyManager && typeof this.multiplayerManager.game.enemyManager.getSerializableEnemyData === 'function') {
            enemies = this.multiplayerManager.game.enemyManager.getSerializableEnemyData();
        }
        
        // Create optimized game state packet
        const gameState = {
            type: 'gameState',
            players, // Still include players but with minimal data
            enemies  // Primary focus - enemy data
        };
        
        // Send to all peers
        this.broadcast(gameState);
    }


    /**
     * Clean up resources
     */
    dispose() {
        // Close all connections
        if (this.peers) {
            this.peers.forEach(conn => conn.close());
            this.peers.clear();
        }
        
        // Close peer connection
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        
        // Reset flags
        this.isHost = false;
        this.isConnected = false;
        this.hostId = null;
        this.roomId = null;
    }
}