// Character model configurations
export const CHARACTER_MODELS = [
    {
        id: 'monk',
        name: 'Monk',
        modelPath: 'assets/models/monk.glb',
        path: 'assets/models/monk.glb', // Keep for backward compatibility
        description: 'Default monk character model',
        baseScale: 1.5, // Base scale to fit the model to game world
        multiplier: 1.0,  // Default multiplier (1x size)
        // Default position and rotation adjustments
        defaultAdjustments: {
            position: { x: 0, y: -2.04, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            heightOffset: 2.04 // Default height offset for movement
        },
        // Add animations array for the model preview
        animations: [
            { name: 'idle', displayName: 'Idle' },
            { name: 'walk', displayName: 'Walk' },
            { name: 'run', displayName: 'Run' }
        ]
        // Preview position and rotation are handled dynamically by the adjustment system
    },
    {
        id: 'monk-v3',
        name: 'Monk V3',
        modelPath: 'assets/models/monk-v3.glb',
        path: 'assets/models/monk-v3.glb', // Keep for backward compatibility
        description: 'Enhanced monk character model',
        baseScale: 0.7, // Base scale to fit the model to game world
        multiplier: 1.0,  // Default multiplier (1x size)
        // Default position and rotation adjustments
        defaultAdjustments: {
            position: { x: 0, y: -2.04, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            heightOffset: 2.04 // Default height offset for movement
        },
        // Add animations array for the model preview
        animations: [
            { name: 'idle', displayName: 'Idle' },
            { name: 'walk', displayName: 'Walk' },
            { name: 'run', displayName: 'Run' }
        ]
        // Preview position and rotation are handled dynamically by the adjustment system
    },
];

// Default character model ID
export const DEFAULT_CHARACTER_MODEL = 'monk';

// Available model size multipliers
export const MODEL_SIZE_MULTIPLIERS = [
    { value: 1.0, label: '1x (Normal)' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2x' },
    { value: 3.0, label: '3x' }
];
