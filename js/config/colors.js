/**
 * Color configuration for the game
 * Contains color definitions for various game elements
 * Updated for Monk Journey theme with extended zone types
 */

// Environment colors by zone type
export const ZONE_COLORS = {
    // Original Environments
    // Forest environment
    'Forest': {
        'foliage': '#2F4F4F', // Dark Green
        'trunk': '#8B4513', // Earth Brown
        'ground': '#8F9779', // Moss Green
        'rock': '#708090', // Slate Gray
        'structure': '#36454F', // Charcoal
        'accent': '#6B8E23' // Olive Drab - a natural forest accent
    },
    // Desert environment
    'Desert': {
        'sand': '#F4A460', // Sandy Brown
        'rock': '#A0522D', // Dark Sienna
        'vegetation': '#6B8E23', // Olive Drab
        'sky': '#87CEEB', // Sky Blue
        'structure': '#EDC9AF', // Desert Sand
        'accent': '#FF4500' // Sunset Orange
    },
    // Icy environment
    'Mountain': {
        'snow': '#FFFAFA', // Snow White
        'ice': '#B0E0E6', // Ice Blue
        'rock': '#A9A9A9', // Frost Gray
        'structure': '#ADD8E6', // Glacier Blue
        'vegetation': '#2E8B57', // Pine Green
        'accent': '#8FBC8F' // Arctic Moss
    },
    // Swamp environment
    'Swamp': {
        'water': '#4682B4', // Oasis Blue
        'vegetation': '#556B2F', // Olive Green
        'ground': '#8F9779', // Moss Green
        'structure': '#708090', // Slate Gray
        'rock': '#36454F', // Charcoal
        'accent': '#40E0D0' // Turquoise
    },
    // Ruins environment
    'Ruins': {
        'stone': '#A9A9A9', // Stone Gray
        'ground': '#8F9779', // Moss Green
        'vegetation': '#556B2F', // Olive Green
        'structure': '#708090', // Slate Gray
        'accent': '#D8BFD8' // Soft Pink
    },
    // Dark Sanctum environment
    'Dark Sanctum': {
        'structure': '#0C0C0C', // Obsidian Black
        'fire': '#FF4500', // Flame Orange
        'ground': '#5C4033', // Charred Brown
        'accent': '#8B0000', // Blood Red
        'glow': '#E3CF57' // Sulfur Yellow
    },
    // Terrant (Ground) environment
    'Terrant': {
        'soil': '#E5C09A', // Light Earth Brown (3x lighter)
        'rock': '#696969', // Dim Gray
        'vegetation': '#228B22', // Forest Green
        'crystal': '#7B68EE', // Medium Slate Blue
        'structure': '#4A4A4A', // Dark Charcoal
        'accent': '#DAA520', // Golden Rod
        'water': '#1E90FF', // Dodger Blue
        'glow': '#32CD32'  // Lime Green
    },
    
    // Fantasy Realms
    // Enchanted Grove - Magical forest with bioluminescent elements
    'Enchanted Grove': {
        'foliage': '#4B0082', // Indigo
        'trunk': '#8B4513', // Earth Brown
        'ground': '#006400', // Dark Green
        'rock': '#9370DB', // Medium Purple
        'structure': '#483D8B', // Dark Slate Blue
        'accent': '#00FFFF', // Cyan - glowing elements
        'glow': '#7FFFD4', // Aquamarine
        'water': '#1E90FF' // Dodger Blue
    },
    // Crystal Caverns - Underground crystal formations
    'Crystal Caverns': {
        'ground': '#2F4F4F', // Dark Slate Gray
        'rock': '#4B0082', // Indigo
        'crystal': '#E0FFFF', // Light Cyan
        'accent': '#FF00FF', // Magenta
        'glow': '#9400D3', // Dark Violet
        'water': '#00BFFF', // Deep Sky Blue
        'structure': '#191970' // Midnight Blue
    },
    // Celestial Realm - Heavenly, cloud-like environment
    'Celestial Realm': {
        'ground': '#E6E6FA', // Lavender
        'structure': '#B0C4DE', // Light Steel Blue
        'accent': '#FFD700', // Gold
        'glow': '#FFFACD', // Lemon Chiffon
        'cloud': '#F0F8FF', // Alice Blue
        'crystal': '#E0FFFF', // Light Cyan
        'water': '#87CEFA' // Light Sky Blue
    },
    // Volcanic Wastes - Fiery, lava-filled landscape
    'Volcanic Wastes': {
        'ground': '#8B0000', // Dark Red
        'rock': '#A52A2A', // Brown
        'lava': '#FF4500', // Orange Red
        'ash': '#696969', // Dim Gray
        'glow': '#FFD700', // Gold
        'accent': '#FF8C00', // Dark Orange
        'structure': '#2F4F4F' // Dark Slate Gray
    },
    // Twilight Veil - Mysterious shadowy realm
    'Twilight Veil': {
        'ground': '#2F4F4F', // Dark Slate Gray
        'vegetation': '#483D8B', // Dark Slate Blue
        'accent': '#9932CC', // Dark Orchid
        'glow': '#9400D3', // Dark Violet
        'structure': '#191970', // Midnight Blue
        'water': '#000080', // Navy
        'mist': '#E6E6FA' // Lavender
    },
    
    // Realistic Biomes
    // Tundra - Cold, sparse landscape
    'Tundra': {
        'ground': '#F5F5F5', // White Smoke
        'vegetation': '#708090', // Slate Gray
        'rock': '#A9A9A9', // Dark Gray
        'ice': '#F0FFFF', // Azure
        'water': '#4682B4', // Steel Blue
        'structure': '#D3D3D3', // Light Gray
        'accent': '#87CEEB' // Sky Blue
    },
    // Savanna - Grassy plains with scattered trees
    'Savanna': {
        'ground': '#F0E68C', // Khaki
        'vegetation': '#BDB76B', // Dark Khaki
        'tree': '#8B4513', // Saddle Brown
        'rock': '#CD853F', // Peru
        'water': '#4682B4', // Steel Blue
        'structure': '#D2B48C', // Tan
        'accent': '#DAA520' // Goldenrod
    },
    // Rainforest - Dense, lush tropical forest
    'Rainforest': {
        'ground': '#556B2F', // Dark Olive Green
        'vegetation': '#006400', // Dark Green
        'canopy': '#228B22', // Forest Green
        'water': '#4169E1', // Royal Blue
        'rock': '#696969', // Dim Gray
        'structure': '#8FBC8F', // Dark Sea Green
        'accent': '#32CD32' // Lime Green
    },
    // Coral Reef - Underwater environment
    'Coral Reef': {
        'water': '#00BFFF', // Deep Sky Blue
        'coral': '#FF7F50', // Coral
        'sand': '#FFE4B5', // Moccasin
        'vegetation': '#20B2AA', // Light Sea Green
        'rock': '#5F9EA0', // Cadet Blue
        'accent': '#FF69B4', // Hot Pink
        'glow': '#00FFFF' // Cyan
    },
    // Alpine - High mountain environment
    'Alpine': {
        'snow': '#FFFAFA', // Snow
        'rock': '#708090', // Slate Gray
        'vegetation': '#2E8B57', // Sea Green
        'water': '#B0E0E6', // Powder Blue
        'structure': '#A9A9A9', // Dark Gray
        'accent': '#4682B4', // Steel Blue
        'ice': '#E0FFFF' // Light Cyan
    },
    
    // Abstract/Stylized
    // Neon Grid - Cyberpunk-inspired digital landscape
    'Neon Grid': {
        'ground': '#000000', // Black
        'structure': '#1E90FF', // Dodger Blue
        'accent': '#FF00FF', // Magenta
        'glow': '#00FF00', // Lime
        'grid': '#00FFFF', // Cyan
        'highlight': '#FF1493', // Deep Pink
        'shadow': '#4B0082' // Indigo
    },
    // Candy Kingdom - Vibrant, colorful sweet-themed world
    'Candy Kingdom': {
        'ground': '#FFB6C1', // Light Pink
        'structure': '#FF69B4', // Hot Pink
        'accent': '#00FFFF', // Cyan
        'highlight': '#FFFF00', // Yellow
        'vegetation': '#32CD32', // Lime Green
        'water': '#1E90FF', // Dodger Blue
        'glow': '#FF4500' // Orange Red
    },
    // Monochrome - Black and white stylized world
    'Monochrome': {
        'ground': '#D3D3D3', // Light Gray
        'structure': '#000000', // Black
        'accent': '#FFFFFF', // White
        'highlight': '#A9A9A9', // Dark Gray
        'shadow': '#696969', // Dim Gray
        'water': '#F5F5F5', // White Smoke
        'vegetation': '#2F4F4F' // Dark Slate Gray
    },
    // Pastel Dream - Soft, dreamy color palette
    'Pastel Dream': {
        'ground': '#E6E6FA', // Lavender
        'structure': '#FFB6C1', // Light Pink
        'accent': '#98FB98', // Pale Green
        'water': '#AFEEEE', // Pale Turquoise
        'vegetation': '#DDA0DD', // Plum
        'highlight': '#FFFACD', // Lemon Chiffon
        'cloud': '#F0F8FF' // Alice Blue
    },
    
    // Mixed Themes
    // Corrupted Sanctuary - Once beautiful area now tainted
    'Corrupted Sanctuary': {
        'ground': '#2E8B57', // Sea Green
        'corruption': '#800080', // Purple
        'structure': '#A9A9A9', // Dark Gray
        'accent': '#FF00FF', // Magenta
        'water': '#4682B4', // Steel Blue
        'glow': '#9400D3', // Dark Violet
        'vegetation': '#006400' // Dark Green
    },
    // Ancient Tech - Blend of ancient ruins and advanced technology
    'Ancient Tech': {
        'ground': '#CD853F', // Peru
        'structure': '#A9A9A9', // Dark Gray
        'tech': '#4682B4', // Steel Blue
        'accent': '#00FFFF', // Cyan
        'glow': '#7FFF00', // Chartreuse
        'vegetation': '#556B2F', // Dark Olive Green
        'energy': '#FFD700' // Gold
    },
    // Fungal Network - Alien-like fungal ecosystem
    'Fungal Network': {
        'ground': '#8B4513', // Saddle Brown
        'fungi': '#FF69B4', // Hot Pink
        'spore': '#9370DB', // Medium Purple
        'vegetation': '#556B2F', // Dark Olive Green
        'glow': '#00FA9A', // Medium Spring Green
        'water': '#4682B4', // Steel Blue
        'structure': '#2F4F4F' // Dark Slate Gray
    },
    // Quantum Flux - Reality-bending environment
    'Quantum Flux': {
        'ground': '#483D8B', // Dark Slate Blue
        'energy': '#00FFFF', // Cyan
        'void': '#000000', // Black
        'structure': '#9932CC', // Dark Orchid
        'accent': '#FF00FF', // Magenta
        'glow': '#FFFF00', // Yellow
        'distortion': '#FF1493' // Deep Pink
    }
};

// Hot zone colors
export const HOT_ZONE_COLORS = {
    'lava': '#FF4500', // Lava Red
    'magma': '#FF6347', // Molten Orange
    'ground': '#2F4F4F', // Charcoal Black
    'ash': '#BEBEBE', // Ash Gray
    'glow': '#FFD700', // Solar Yellow
    'ember': '#FF8C00' // Ember Glow
};

// Enemy colors for different types and rarities
export const ENEMY_COLORS = {
    // Regular enemy types
    'regular': {
        'base': '#8B4513', // Saddle Brown - more earthy standard enemy base color
        'outline': '#800000', // Maroon - darker outline for regular enemies
        'highlight': '#CD853F', // Peru - warmer highlight for regular enemies
        'damaged': '#DEB887', // Burlywood - lighter damaged state
        'enraged': '#FF6347'  // Tomato - brighter enraged state
    },
    // Elite enemy types (stronger than regular)
    'elite': {
        'base': '#6A5ACD', // Slate Blue - richer elite enemy base color
        'outline': '#191970', // Midnight Blue - darker outline for elite enemies
        'highlight': '#9370DB', // Medium Purple - brighter highlight for elite enemies
        'damaged': '#B0C4DE', // Light Steel Blue - lighter damaged state
        'enraged': '#7B68EE'  // Medium Slate Blue - intense enraged state
    },
    // Champion enemy types (mini-bosses)
    'champion': {
        'base': '#DAA520', // Golden Rod - richer champion enemy base color
        'outline': '#8B4513', // Saddle Brown - earthy outline for champions
        'highlight': '#F0E68C', // Khaki - softer highlight for champions
        'damaged': '#EEE8AA', // Pale Goldenrod - lighter damaged state
        'enraged': '#FF8C00'  // Dark Orange - intense enraged state
    },
    // Boss enemy types
    'boss': {
        'base': '#B22222', // Fire Brick - deeper boss enemy base color
        'outline': '#4B0082', // Indigo - mystical outline for bosses
        'highlight': '#FF4500', // Orange Red - intense highlight for bosses
        'damaged': '#CD5C5C', // Indian Red - rich damaged state
        'enraged': '#8B0000'  // Dark Red - deep enraged state
    },
    // Special enemy types by element
    'elemental': {
        'fire': '#FF4500', // Orange Red - fire elemental enemies
        'ice': '#1E90FF', // Dodger Blue - more vibrant ice elemental enemies
        'lightning': '#FFD700', // Gold - richer lightning elemental enemies
        'poison': '#228B22', // Forest Green - deeper poison elemental enemies
        'arcane': '#8A2BE2', // Blue Violet - more vibrant arcane elemental enemies
        'shadow': '#2F4F4F', // Dark Slate Gray - shadow elemental enemies
        'holy': '#FFFACD'  // Lemon Chiffon - holy elemental enemies
    },
    // Undead enemy types
    'undead': {
        'skeleton': '#E0FFFF', // Light Cyan - slightly blue-tinted skeleton enemies
        'zombie': '#556B2F', // Dark Olive Green - zombie enemies
        'ghost': '#E6E6FA', // Lavender - ghost enemies
        'vampire': '#8B0000', // Dark Red - vampire enemies
        'lich': '#483D8B'  // Dark Slate Blue - deeper lich enemies
    },
    // Demonic enemy types
    'demonic': {
        'imp': '#FF7F50', // Coral - imp enemies
        'demon': '#A52A2A', // Brown - richer demon enemies
        'hellspawn': '#B22222', // Fire Brick - hellspawn enemies
        'overlord': '#800000', // Maroon - overlord enemies
        'corruption': '#4B0082'  // Indigo - corruption enemies
    }
};

