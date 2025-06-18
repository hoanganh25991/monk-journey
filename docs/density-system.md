# World Density System Documentation

## Overview

The Monk Journey game uses a sophisticated multi-layered density system to control object placement throughout the game world. This system balances visual quality with performance by adjusting the number of objects generated based on both biome-specific characteristics and global performance settings.

## Density System Architecture

The density system consists of multiple layers that work together:

### 1. Global Density Levels

Global density levels are defined in `WorldManager.js` as multipliers that affect all object generation:

```javascript
this.densityLevels = {
    high: 2.0,    // Reduced from 3.0
    medium: 1.2,  // Reduced from 2.0
    low: 0.6,     // Reduced from 1.0
    minimal: 0.3  // Reduced from 0.5
};
```

These values serve as global multipliers that affect all object generation throughout the world:

- **high (2.0)**: Twice as many objects as the base amount - for high-end systems
- **medium (1.2)**: 20% more objects than the base amount - default balanced setting
- **low (0.6)**: 40% fewer objects than the base amount - for mid-range systems
- **minimal (0.3)**: 70% fewer objects than the base amount - for low-end systems

The current global density level is stored in `this.environmentDensity` and defaults to `medium`.

### 2. Biome-Specific Density Values

Each biome has its own density settings defined in `this.zoneDensities`:

```javascript
this.zoneDensities = {
    [BIOMES.FOREST]: { 
        environment: 1.5, // Reduced from 2.5
        structures: 0.25, // Reduced from 0.4
        // ...
    },
    [BIOMES.DESERT]: { 
        environment: 1.0, // Reduced from 1.8
        structures: 0.2, // Reduced from 0.35
        // ...
    },
    // Other biomes...
};
```

Each biome has separate multipliers for:
- **environment**: Controls density of trees, rocks, plants, etc.
- **structures**: Controls probability of buildings, ruins, etc.

For example, the Desert biome has:
- environment: 1.0 (standard density for environment objects)
- structures: 0.2 (low density for structures)

### 3. World Scale Factor

The `worldScale` property (default: 1.0) is a global scale factor that affects spacing between objects. Higher values make the world feel larger by spacing objects further apart.

## How The Density System Works

### Environment Object Generation

When generating environment objects (trees, rocks, plants, etc.), the system calculates the number of objects to create using this formula:

```
count = baseCount * biome-environment-density * global-density * worldScale
```

For example, in a Desert biome with high density settings:
```
count = 10 * 1.0 * 2.0 * 1.0 = 20 objects per chunk
```

This means:
- Base count: 10 objects per chunk
- Desert environment density: 1.0
- Global high density setting: 2.0
- World scale: 1.0
- Result: 20 objects per chunk

### Structure Generation

For structures (buildings, ruins, etc.), the system calculates the probability of placing a structure using:

```
probability = baseProbability * biome-structure-density * worldScale
```

For example, in a Desert biome:
```
probability = 0.2 * 0.2 * 1.0 = 0.04 (4% chance per chunk)
```

This means:
- Base probability: 20% chance
- Desert structure density: 0.2
- World scale: 1.0
- Result: 4% chance of placing a structure in a chunk

## Performance Management

The `PerformanceManager` can dynamically adjust density levels based on the current frame rate:

1. When frame rate drops below thresholds, the system automatically reduces the density level
2. When frame rate is consistently high, the system can increase density for better visuals
3. The system balances visual quality with performance automatically

## Implementation Details

The density system is implemented across several files:

- **WorldManager.js**: Defines global density levels and biome-specific densities
- **EnvironmentManager.js**: Uses density values to determine how many objects to generate
- **StructureManager.js**: Uses density values to determine structure placement probability
- **PerformanceManager.js**: Dynamically adjusts density levels based on performance

## Usage Examples

### Example 1: Desert Biome with High Density

- Global density: high (2.0)
- Desert environment density: 1.0
- Result: 20 environment objects per chunk (10 * 1.0 * 2.0)
- Desert structure density: 0.2
- Result: 4% chance of structure per chunk (0.2 * 0.2)

### Example 2: Forest Biome with Low Density

- Global density: low (0.6)
- Forest environment density: 1.5
- Result: 9 environment objects per chunk (10 * 1.5 * 0.6)
- Forest structure density: 0.25
- Result: 5% chance of structure per chunk (0.2 * 0.25)

## Conclusion

The multi-layered density system provides fine-grained control over world generation, allowing the game to adapt to different hardware capabilities while maintaining the unique characteristics of each biome. This system is crucial for balancing visual quality with performance across a wide range of devices.