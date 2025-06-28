/**
 * Teleport portal configuration file
 * Contains multiplier portals for enemy spawning
 */

// Multiplier portal configurations - Now with wave-based system and reduced difficulty
export const MULTIPLIER_PORTALS = [
    {
        id: 'x500',
        name: 'Easy Mode (500x weaker)',
        multiplier: 500,
        difficulty: 0.002, // 500x easier
        color: 0x00ff00, // Green - easiest
        emissiveColor: 0x00ff00,
        size: 3.5,
        description: 'Enemy waves are 500x weaker. Good for learning!'
    },
    {
        id: 'x100',
        name: 'Training Mode (100x weaker)',
        multiplier: 100,
        difficulty: 0.01, // 100x easier
        color: 0x00ffff, // Cyan
        emissiveColor: 0x00ffff,
        size: 4,
        description: 'Enemy waves are 100x weaker. Great for training!'
    },
    {
        id: 'x10',
        name: 'Casual Mode (10x weaker)',
        multiplier: 10,
        difficulty: 0.1, // 10x easier
        color: 0x0000ff, // Blue
        emissiveColor: 0x0000ff,
        size: 4.5,
        description: 'Enemy waves are 10x weaker. Casual gameplay!'
    },
    {
        id: 'x5',
        name: 'Beginner Mode (5x weaker)',
        multiplier: 5,
        difficulty: 0.2, // 5x easier
        color: 0xff00ff, // Purple
        emissiveColor: 0xff00ff,
        size: 5,
        description: 'Enemy waves are 5x weaker. Perfect for beginners!'
    },
    {
        id: 'x2',
        name: 'Normal Mode (2x weaker)',
        multiplier: 2,
        difficulty: 0.5, // 2x easier
        color: 0xffaa00, // Orange
        emissiveColor: 0xffaa00,
        size: 5.5,
        description: 'Enemy waves are 2x weaker. Balanced experience!'
    },
    {
        id: 'x1',
        name: 'Standard Mode',
        multiplier: 1,
        difficulty: 1.0, // Normal difficulty
        color: 0xffff00, // Yellow
        emissiveColor: 0xffff00,
        size: 6,
        description: 'Standard enemy waves. The true challenge!'
    },
    {
        id: 'hard',
        name: 'Hard Mode (2x stronger)',
        multiplier: 0.5,
        difficulty: 2.0, // 2x harder
        color: 0xff0000, // Red
        emissiveColor: 0xff0000,
        size: 7,
        description: 'Enemy waves are 2x stronger. For veterans!'
    }
];

// Return portal configuration
export const RETURN_PORTAL = {
    id: 'return',
    name: 'Return Portal',
    color: 0xffff00, // Yellow
    emissiveColor: 0xffff00,
    size: 2.5,
    description: 'Return to previous location'
};

// Terrain configurations for multiplier destinations
export const DESTINATION_TERRAINS = [
    {
        id: 'arena',
        name: 'Battle Arena',
        groundColor: 0x555555, // Dark gray
        decorations: 'minimal',
        size: 100,
        description: 'A flat arena for combat'
    },
    {
        id: 'hellscape',
        name: 'Hellscape',
        groundColor: 0x880000, // Dark red
        decorations: 'lava',
        size: 150,
        description: 'A fiery hellscape'
    },
    {
        id: 'void',
        name: 'The Void',
        groundColor: 0x000022, // Very dark blue
        decorations: 'floating',
        size: 200,
        description: 'An empty void with floating platforms'
    },
    {
        id: 'ancient_ruins',
        name: 'Ancient Ruins',
        groundColor: 0x998866, // Sandy color
        decorations: 'ruins',
        size: 180,
        description: 'Ruins of an ancient civilization'
    },
    {
        id: 'crystal_cavern',
        name: 'Crystal Cavern',
        groundColor: 0x6688aa, // Blue-gray
        decorations: 'crystals',
        size: 120,
        description: 'A cavern filled with glowing crystals'
    }
];