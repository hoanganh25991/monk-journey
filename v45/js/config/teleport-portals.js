/**
 * Teleport portal configuration file
 * Contains multiplier portals for enemy spawning
 */

// Multiplier portal configurations
export const MULTIPLIER_PORTALS = [
    {
        id: 'x2',
        name: 'x2 Enemies',
        multiplier: 2,
        color: 0x00ff00, // Green
        emissiveColor: 0x00ff00,
        size: 3.5,
        description: 'Doubles the number of enemies'
    },
    {
        id: 'x5',
        name: 'x5 Enemies',
        multiplier: 5,
        color: 0x00ffff, // Cyan
        emissiveColor: 0x00ffff,
        size: 4,
        description: 'Spawns 5x more enemies'
    },
    {
        id: 'x10',
        name: 'x10 Enemies',
        multiplier: 10,
        color: 0x0000ff, // Blue
        emissiveColor: 0x0000ff,
        size: 4.5,
        description: 'Spawns 10x more enemies'
    },
    {
        id: 'x20',
        name: 'x20 Enemies',
        multiplier: 20,
        color: 0xff00ff, // Purple
        emissiveColor: 0xff00ff,
        size: 5,
        description: 'Spawns 20x more enemies'
    },
    {
        id: 'x50',
        name: 'x50 Enemies',
        multiplier: 50,
        color: 0xff0000, // Red
        emissiveColor: 0xff0000,
        size: 5.5,
        description: 'Spawns 50x more enemies'
    },
    {
        id: 'x100',
        name: 'x100 Enemies',
        multiplier: 100,
        color: 0xffaa00, // Orange
        emissiveColor: 0xffaa00,
        size: 6,
        description: 'Spawns 100x more enemies'
    },
    {
        id: 'x500',
        name: 'x500 Enemies',
        multiplier: 500,
        color: 0xffff00, // Yellow
        emissiveColor: 0xffff00,
        size: 7,
        description: 'Spawns 500x more enemies'
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