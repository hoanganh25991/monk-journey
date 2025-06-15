/**
 * BinarySerializer.js
 * Handles binary serialization and deserialization of multiplayer data
 * Uses MessagePack for efficient binary encoding
 */

// Message types enum - used to identify different message types with minimal bytes
export const MessageType = {
    WELCOME: 0,
    GAME_STATE: 1,
    START_GAME: 2,
    PLAYER_JOINED: 3,
    PLAYER_LEFT: 4,
    PLAYER_COLORS: 5,
    SKILL_CAST: 6,
    PLAYER_INPUT: 7,
    PLAYER_POSITION: 8,
    HOST_LEFT: 9,
    PLAYER_DAMAGE: 10,
    SHARE_EXPERIENCE: 11
};

// Schema definitions for different message types
// These define the structure and order of fields for each message type
const SCHEMAS = {
    [MessageType.WELCOME]: ['message'],
    [MessageType.GAME_STATE]: ['players', 'enemies'],
    [MessageType.START_GAME]: [],
    [MessageType.PLAYER_JOINED]: ['playerId', 'playerColor'],
    [MessageType.PLAYER_LEFT]: ['playerId'],
    [MessageType.PLAYER_COLORS]: ['colors'],
    [MessageType.SKILL_CAST]: ['skillName', 'playerId', 'variant', 'targetEnemyId'],
    [MessageType.PLAYER_INPUT]: ['input'],
    [MessageType.PLAYER_POSITION]: ['position', 'rotation', 'animation', 'modelId'],
    [MessageType.HOST_LEFT]: [],
    [MessageType.PLAYER_DAMAGE]: ['amount', 'enemyId'],
    [MessageType.SHARE_EXPERIENCE]: ['amount', 'enemyId', 'playerCount']
};

export class BinarySerializer {
    constructor() {
        this.msgpack = null;
        this.initialized = false;
    }

    /**
     * Initialize the serializer
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
        try {
            console.debug('[BinarySerializer] Initializing...');
            
            // MessagePack is now loaded directly in index.html
            if (window.msgpack) {
                this.msgpack = window.msgpack;
            } else if (window.MessagePack) {
                this.msgpack = window.MessagePack;
            } else {
                // Use fallback if MessagePack is not available
                this.useFallbackImplementation();
            }
            
            // Test serialization to ensure it works
            const testData = { test: "Hello World" };
            const encoded = this.msgpack.encode(testData);
            const decoded = this.msgpack.decode(encoded);
            
            if (decoded.test === testData.test) {
                this.initialized = true;
                console.debug('[BinarySerializer] Initialized successfully');
                return true;
            } else {
                console.warn('[BinarySerializer] Serialization test failed, falling back to JSON');
                this.useFallbackImplementation();
                
                // Test the fallback implementation
                const retestData = { test: "Hello World" };
                const reencoded = this.msgpack.encode(retestData);
                const redecoded = this.msgpack.decode(reencoded);
                
                if (redecoded.test === retestData.test) {
                    this.initialized = true;
                    console.debug('[BinarySerializer] Initialized with fallback implementation');
                    return true;
                }
                
                return false;
            }
        } catch (error) {
            console.error('[BinarySerializer] Initialization failed:', error);
            
            // Try to use the fallback implementation
            try {
                this.useFallbackImplementation();
                
                // Test the fallback implementation
                const testData = { test: "Hello World" };
                const encoded = this.msgpack.encode(testData);
                const decoded = this.msgpack.decode(encoded);
                
                if (decoded.test === testData.test) {
                    this.initialized = true;
                    console.debug('[BinarySerializer] Initialized with fallback implementation');
                    return true;
                }
            } catch (fallbackError) {
                console.error('[BinarySerializer] Fallback initialization failed:', fallbackError);
            }
            
            return false;
        }
    }
    
    /**
     * Use a simple fallback implementation if MessagePack can't be loaded
     */
    useFallbackImplementation() {
        // Create a simple implementation that uses JSON
        this.msgpack = {
            encode: (data) => {
                // Convert to JSON string and then to Uint8Array
                const jsonString = JSON.stringify(data);
                const encoder = new TextEncoder();
                return encoder.encode(jsonString);
            },
            decode: (binary) => {
                // Convert from Uint8Array to JSON string and then parse
                const decoder = new TextDecoder();
                const jsonString = decoder.decode(binary);
                return JSON.parse(jsonString);
            }
        };
        
        console.debug('[BinarySerializer] Using fallback implementation');
    }

    /**
     * Serialize data to binary format
     * @param {Object} data - The data to serialize
     * @returns {Uint8Array} The serialized binary data
     */
    serialize(data) {
        if (!this.initialized || !this.msgpack) {
            console.error('[BinarySerializer] Cannot serialize: not initialized');
            return null;
        }

        try {
            // Extract message type from data
            const messageType = this.getMessageTypeFromData(data);
            if (messageType === undefined) {
                console.error('[BinarySerializer] Unknown message type:', data.type);
                return null;
            }

            // Create optimized binary message
            const binaryMessage = this.createBinaryMessage(messageType, data);
            
            // Serialize to binary
            return this.msgpack.encode(binaryMessage);
        } catch (error) {
            console.error('[BinarySerializer] Serialization error:', error);
            return null;
        }
    }

    /**
     * Deserialize binary data to object
     * @param {Uint8Array} binaryData - The binary data to deserialize
     * @returns {Object} The deserialized data
     */
    deserialize(binaryData) {
        if (!this.initialized || !this.msgpack) {
            console.error('[BinarySerializer] Cannot deserialize: not initialized');
            return null;
        }

        try {
            // Handle the case where the buffer might contain extra data
            // This is a common issue with WebRTC data channels
            let decoded;
            try {
                // First try to decode the entire buffer
                decoded = this.msgpack.decode(binaryData);
            } catch (decodeError) {
                if (decodeError.message && decodeError.message.includes('Extra')) {
                    // If there are extra bytes, try to find the actual message length
                    // and only decode that portion
                    console.debug('[BinarySerializer] Handling extra bytes in buffer');
                    
                    // Create a view with only the valid portion of the data
                    // The MessagePack library will throw an error with the position of the extra bytes
                    const match = decodeError.message.match(/Extra \d+ of \d+ byte\(s\) found at buffer\[(\d+)\]/);
                    if (match && match[1]) {
                        const validLength = parseInt(match[1], 10);
                        if (validLength > 0 && validLength < binaryData.length) {
                            // Create a new buffer with just the valid portion
                            const validData = binaryData.slice(0, validLength);
                            decoded = this.msgpack.decode(validData);
                        } else {
                            throw decodeError; // Re-throw if we can't extract a valid length
                        }
                    } else {
                        throw decodeError; // Re-throw if we can't parse the error message
                    }
                } else {
                    throw decodeError; // Re-throw for other types of errors
                }
            }
            
            // Extract message type and data
            const messageType = decoded[0];
            const messageData = decoded[1];
            
            // Convert back to original format
            return this.createObjectFromBinary(messageType, messageData);
        } catch (error) {
            console.error('[BinarySerializer] Deserialization error:', error);
            return null;
        }
    }

    /**
     * Get message type from data object
     * @param {Object} data - The data object
     * @returns {number} The message type
     */
    getMessageTypeFromData(data) {
        switch (data.type) {
            case 'welcome': return MessageType.WELCOME;
            case 'gameState': return MessageType.GAME_STATE;
            case 'startGame': return MessageType.START_GAME;
            case 'playerJoined': return MessageType.PLAYER_JOINED;
            case 'playerLeft': return MessageType.PLAYER_LEFT;
            case 'playerColors': return MessageType.PLAYER_COLORS;
            case 'skillCast': return MessageType.SKILL_CAST;
            case 'playerInput': return MessageType.PLAYER_INPUT;
            case 'playerPosition': return MessageType.PLAYER_POSITION;
            case 'hostLeft': return MessageType.HOST_LEFT;
            case 'playerDamage': return MessageType.PLAYER_DAMAGE;
            case 'shareExperience': return MessageType.SHARE_EXPERIENCE;
            default: return undefined;
        }
    }

    /**
     * Get message type string from type number
     * @param {number} messageType - The message type number
     * @returns {string} The message type string
     */
    getMessageTypeString(messageType) {
        switch (messageType) {
            case MessageType.WELCOME: return 'welcome';
            case MessageType.GAME_STATE: return 'gameState';
            case MessageType.START_GAME: return 'startGame';
            case MessageType.PLAYER_JOINED: return 'playerJoined';
            case MessageType.PLAYER_LEFT: return 'playerLeft';
            case MessageType.PLAYER_COLORS: return 'playerColors';
            case MessageType.SKILL_CAST: return 'skillCast';
            case MessageType.PLAYER_INPUT: return 'playerInput';
            case MessageType.PLAYER_POSITION: return 'playerPosition';
            case MessageType.HOST_LEFT: return 'hostLeft';
            case MessageType.PLAYER_DAMAGE: return 'playerDamage';
            case MessageType.SHARE_EXPERIENCE: return 'shareExperience';
            default: return 'unknown';
        }
    }

    /**
     * Create optimized binary message from data
     * @param {number} messageType - The message type
     * @param {Object} data - The data to serialize
     * @returns {Array} The binary message as [type, data]
     */
    createBinaryMessage(messageType, data) {
        // Get schema for this message type
        const schema = SCHEMAS[messageType];
        if (!schema) {
            return [messageType, {}];
        }

        // Create optimized data object following the schema
        const optimizedData = {};
        schema.forEach(field => {
            if (data[field] !== undefined) {
                optimizedData[field] = data[field];
            }
        });

        // Return as [type, data] array to minimize overhead
        return [messageType, optimizedData];
    }

    /**
     * Create object from binary message
     * @param {number} messageType - The message type
     * @param {Object} data - The binary message data
     * @returns {Object} The reconstructed object
     */
    createObjectFromBinary(messageType, data) {
        // Create object with type field
        const result = {
            type: this.getMessageTypeString(messageType)
        };

        // Add all data fields
        Object.assign(result, data);

        return result;
    }

    /**
     * Optimize Vector3 for network transmission
     * Converts {x, y, z} to [x, y, z] array to save space
     * @param {Object} vector - The vector object with x, y, z properties
     * @returns {Array} The optimized vector as [x, y, z]
     */
    static optimizeVector(vector) {
        if (!vector) return null;
        return [
            vector.x !== undefined ? vector.x : 0,
            vector.y !== undefined ? vector.y : 0,
            vector.z !== undefined ? vector.z : 0
        ];
    }

    /**
     * Restore Vector3 from optimized format
     * @param {Array} array - The array [x, y, z]
     * @returns {Object} The vector object {x, y, z}
     */
    static restoreVector(array) {
        if (!array || !Array.isArray(array)) return null;
        return {
            x: array[0] || 0,
            y: array[1] || 0,
            z: array[2] || 0
        };
    }

    /**
     * Optimize rotation for network transmission
     * For most cases, we only need the Y rotation (yaw)
     * @param {Object} rotation - The rotation object
     * @returns {number} The Y rotation value
     */
    static optimizeRotation(rotation) {
        if (!rotation) return 0;
        return rotation.y !== undefined ? rotation.y : 0;
    }

    /**
     * Restore rotation from optimized format
     * @param {number} y - The Y rotation value
     * @returns {Object} The rotation object {x: 0, y, z: 0}
     */
    static restoreRotation(y) {
        return {
            x: 0,
            y: y || 0,
            z: 0
        };
    }
}