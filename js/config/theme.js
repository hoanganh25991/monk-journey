/**
 * theme.js - Central theme configuration for Monk Journey
 * 
 * This file serves as the single source of truth for all colors and icons used in the game.
 * It collects colors from various components like skill-icons, fogmanager, CSS, etc.
 * to ensure consistent theming across the entire application.
 */

// Main color palette
export const COLORS = {
    // Primary colors
    primary: {
        main: '#FFCC00',       // Main yellow color (from settings-button)
        light: '#FFD700',      // Gold/Light yellow (from settings-button:hover)
        dark: '#4A3000',       // Dark brown (text color in settings-button)
        border: '#FFE696',     // Light yellow border (from settings-button)
    },

    // Secondary colors
    secondary: {
        main: '#4169E1',       // Royal blue (from Fist of Thunder skill)
        light: '#87CEEB',      // Sky blue (from Aerial Agility skill)
        dark: '#483D8B',       // Dark slate blue (from Mystic Veil skill)
    },

    // Accent colors
    accent: {
        success: '#32CD32',    // Lime green (from Quick Setup skill)
        warning: '#FF8C00',    // Dark orange (from Empowered Kicks skill)
        danger: '#FF0000',     // Red (from Seven-Sided Strike skill)
        info: '#00FFFF',       // Cyan (from Mystic Allies skill)
    },

    // UI colors
    ui: {
        background: 'rgba(0, 0, 0, 0.7)',  // Dark background with transparency
        border: 'rgba(255, 230, 150, 0.8)', // Light yellow border (from settings-button)
        text: {
            light: '#FFFFFF',   // White text (from Inner Sanctuary skill)
            dark: '#4A3000',    // Dark brown text (from settings-button)
            muted: '#CCCCCC',   // Light gray text
        },
        shadow: 'rgba(0, 0, 0, 0.2)', // Shadow color (from settings-button)
        highlight: 'rgba(255, 255, 255, 0.3)', // Highlight color (from settings-button::before)
    },

    // Environment colors (from FogManager and colors.js)
    environment: {
        // Forest environment
        forest: {
            foliage: '#2F4F4F',  // Dark Green
            trunk: '#8B4513',    // Earth Brown
            ground: '#8F9779',   // Moss Green
            rock: '#708090',     // Slate Gray
            structure: '#36454F', // Charcoal
            accent: '#6B8E23',   // Olive Drab
            fog: '#7AB07C',      // Lighter greenish fog for forest
        },
        // Desert environment
        desert: {
            sand: '#F4A460',     // Sandy Brown
            rock: '#A0522D',     // Dark Sienna
            vegetation: '#6B8E23', // Olive Drab
            sky: '#87CEEB',      // Sky Blue
            structure: '#EDC9AF', // Desert Sand
            accent: '#FF4500',   // Sunset Orange
            fog: '#D8C090',      // Lighter tan fog for desert
        },
        // Mountains environment
        mountains: {
            snow: '#FFFAFA',     // Snow White
            ice: '#B0E0E6',      // Ice Blue
            rock: '#A9A9A9',     // Frost Gray
            structure: '#ADD8E6', // Glacier Blue
            vegetation: '#2E8B57', // Pine Green
            accent: '#8FBC8F',   // Arctic Moss
            fog: '#90A0C0',      // Lighter blue fog for mountains
        },
        // Swamp environment
        swamp: {
            water: '#4682B4',    // Oasis Blue
            vegetation: '#556B2F', // Olive Green
            ground: '#8F9779',   // Moss Green
            structure: '#708090', // Slate Gray
            rock: '#36454F',     // Charcoal
            accent: '#40E0D0',   // Turquoise
            fog: '#6A8040',      // Less dark green fog for swamp
        },
        // Ruins environment
        ruins: {
            stone: '#A9A9A9',    // Stone Gray
            ground: '#8F9779',   // Moss Green
            vegetation: '#556B2F', // Olive Green
            structure: '#708090', // Slate Gray
            accent: '#D8BFD8',   // Soft Pink
            fog: '#909090',      // Lighter gray fog for ruins
        },
        // Dark Sanctum environment
        darkSanctum: {
            structure: '#0C0C0C', // Obsidian Black
            fire: '#FF4500',     // Flame Orange
            ground: '#5C4033',   // Charred Brown
            accent: '#8B0000',   // Blood Red
            glow: '#E3CF57',     // Sulfur Yellow
            fog: '#483060',      // Less dark purple fog for dark sanctum
        },
        // Default fog color
        fog: '#8AB3D5',          // Default lighter blue-gray (from FOG_CONFIG)
    },

    // Time of day colors (from FogManager)
    timeOfDay: {
        dawn: '#FFC0D0',         // Lighter pinkish tint at dawn
        day: '#90B0E0',          // Slight brightness during day
        dusk: '#FFA060',         // Lighter orange tint at dusk
        night: '#202045',        // Less dark blue at night
    },

    // Weather colors (from FogManager)
    weather: {
        clear: '#90B0E0',        // Clear weather - slight brightness
        rain: '#8090A0',         // Lighter gray fog during rain
        fog: '#C0C0C0',          // Lighter gray fog during foggy weather
        storm: '#505050',        // Less dark gray fog during storms
    },

    // Skill element colors (from skill-icons.js)
    elements: {
        fire: '#FF4500',         // Fire element (Fiery Palm)
        ice: '#AADDFF',          // Ice element (Icy Palm)
        lightning: '#FFFF00',    // Lightning element (Thunder Dragon)
        earth: '#8B4513',        // Earth element (Earth Allies)
        air: '#CCFFFF',          // Air element (Gale Dragon)
        shadow: '#666666',       // Shadow element (Shadow Dragon)
        holy: '#FFFACD',         // Holy element (Blinding Light)
    },

    // Enemy colors (from colors.js)
    enemies: {
        regular: {
            base: '#8B4513',     // Saddle Brown
            outline: '#800000',  // Maroon
            highlight: '#CD853F', // Peru
            damaged: '#DEB887',  // Burlywood
            enraged: '#FF6347',  // Tomato
        },
        elite: {
            base: '#6A5ACD',     // Slate Blue
            outline: '#191970',  // Midnight Blue
            highlight: '#9370DB', // Medium Purple
            damaged: '#B0C4DE',  // Light Steel Blue
            enraged: '#7B68EE',  // Medium Slate Blue
        },
        champion: {
            base: '#DAA520',     // Golden Rod
            outline: '#8B4513',  // Saddle Brown
            highlight: '#F0E68C', // Khaki
            damaged: '#EEE8AA',  // Pale Goldenrod
            enraged: '#FF8C00',  // Dark Orange
        },
        boss: {
            base: '#B22222',     // Fire Brick
            outline: '#4B0082',  // Indigo
            highlight: '#FF4500', // Orange Red
            damaged: '#CD5C5C',  // Indian Red
            enraged: '#8B0000',  // Dark Red
        },
    },
};

// Icon definitions
export const ICONS = {
    // Skill icons (from skill-icons.js)
    skills: {
        "Breath of Heaven": {
            emoji: "🌬️",
            cssClass: "icon-breath-heaven",
        },
        "Cyclone Strike": {
            emoji: "🌪️",
            cssClass: "icon-cyclone-strike",
        },
        "Exploding Palm": {
            emoji: "💥",
            cssClass: "icon-exploding-palm",
        },
        "Flying Dragon": {
            emoji: "🐉",
            cssClass: "icon-flying-dragon",
        },
        "Flying Kick": {
            emoji: "👣",
            cssClass: "icon-flying-kick",
        },
        "Inner Sanctuary": {
            emoji: "🛡️",
            cssClass: "icon-inner-sanctuary",
        },
        "Mystic Allies": {
            emoji: "👤",
            cssClass: "icon-mystic-allies",
        },
        "Seven-Sided Strike": {
            emoji: "🔄",
            cssClass: "icon-seven-sided-strike",
        },
        "Wave of Light": {
            emoji: "🔔",
            cssClass: "icon-wave-of-light",
        },
        "Wave Strike": {
            emoji: "🌊",
            cssClass: "icon-wave-strike",
        },
        "Fist of Thunder": {
            emoji: "⚡",
            cssClass: "icon-fist-of-thunder",
        },
        "Deadly Reach": {
            emoji: "🌀",
            cssClass: "icon-deadly-reach",
        },
        "Shield of Zen": {
            emoji: "🧘",
            cssClass: "icon-shield-of-zen",
        },
    },

    // UI icons
    ui: {
        settings: "⚙️",
        close: "✖️",
        menu: "☰",
        play: "▶️",
        pause: "⏸️",
        sound: "🔊",
        mute: "🔇",
        info: "ℹ️",
        warning: "⚠️",
        error: "❌",
        success: "✅",
        health: "❤️",
        mana: "🔷",
        stamina: "⚡",
        inventory: "🎒",
        map: "🗺️",
        quest: "📜",
        skill: "✨",
        attack: "⚔️",
        defense: "🛡️",
    },

    // Element icons
    elements: {
        fire: "🔥",
        ice: "❄️",
        lightning: "⚡",
        earth: "🏔️",
        air: "💨",
        shadow: "👥",
        holy: "✨",
    },
};

// Helper functions for working with the theme
export const ThemeUtils = {
    /**
     * Get a color with optional opacity
     * @param {string} colorPath - Dot notation path to the color (e.g., 'primary.main')
     * @param {number} opacity - Optional opacity value between 0 and 1
     * @returns {string} - CSS color value
     */
    getColor: (colorPath, opacity = 1) => {
        const parts = colorPath.split('.');
        let color = COLORS;
        
        for (const part of parts) {
            if (color[part] === undefined) {
                console.warn(`Color path "${colorPath}" not found in theme`);
                return '#CCCCCC'; // Default gray if color not found
            }
            color = color[part];
        }
        
        if (typeof color !== 'string') {
            console.warn(`Color path "${colorPath}" does not point to a color string`);
            return '#CCCCCC';
        }
        
        // If opacity is 1, return the color as is
        if (opacity >= 1) {
            return color;
        }
        
        // Convert hex to rgba
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        return color;
    },
    
    /**
     * Get an icon by its path
     * @param {string} iconPath - Dot notation path to the icon (e.g., 'ui.settings')
     * @returns {Object} - Icon object with emoji and cssClass (if available)
     */
    getIcon: (iconPath) => {
        const parts = iconPath.split('.');
        let icon = ICONS;
        
        for (const part of parts) {
            if (icon[part] === undefined) {
                console.warn(`Icon path "${iconPath}" not found in theme`);
                return { emoji: "❓", cssClass: "" }; // Default if icon not found
            }
            icon = icon[part];
        }
        
        if (typeof icon === 'string') {
            return { emoji: icon, cssClass: "" };
        }
        
        return icon;
    },
};

export default {
    COLORS,
    ICONS,
    ThemeUtils,
};