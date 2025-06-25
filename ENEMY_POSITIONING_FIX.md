# Enemy Positioning Fix

## Issue Description
Enemies were not properly considering terrain height during spawning and movement, causing them to:
- Deploy at incorrect heights (floating or buried)
- Move weirdly on uneven terrain
- Not follow the ground properly during pathfinding

## Root Causes Identified

### 1. Incorrect Spawn Position Calculation
**File:** `js/entities/enemies/EnemyManager.js`
**Line:** 304
**Problem:** The code was adding terrain height to an existing Y position instead of setting it to the terrain height.

**Before:**
```javascript
spawnPosition.y += terrainHeight + enemy.heightOffset + 2.04 * enemy.scale;
```

**After:**
```javascript
if (terrainHeight !== null) {
    // Set Y position to terrain height + enemy height offset
    spawnPosition.y = terrainHeight + enemy.heightOffset;
} else {
    // Fallback if terrain height is not available
    spawnPosition.y = enemy.heightOffset;
}
```

### 2. Movement Not Considering Terrain Height
**File:** `js/entities/enemies/Enemy.js`
**Lines:** 364-371
**Problem:** When enemies moved to new positions, they kept their old Y coordinate instead of calculating the proper terrain height for the new position.

**Before:**
```javascript
const newPosition = {
    x: this.position.x + normalizedDirectionX * moveSpeed,
    y: this.position.y, // This was wrong - kept old Y position
    z: this.position.z + normalizedDirectionZ * moveSpeed
};
```

**After:**
```javascript
const newX = this.position.x + normalizedDirectionX * moveSpeed;
const newZ = this.position.z + normalizedDirectionZ * moveSpeed;

// Calculate proper Y position based on terrain height
let newY = this.position.y;
if (this.world && this.allowTerrainHeightUpdates) {
    const terrainHeight = this.world.getTerrainHeight(newX, newZ);
    if (terrainHeight !== null) {
        newY = terrainHeight + this.heightOffset;
    }
}
```

### 3. Knockback Not Considering Terrain Height
**File:** `js/entities/enemies/Enemy.js`
**Lines:** 680-686
**Problem:** Similar to movement, knockback used the old Y position instead of calculating terrain height.

**Fixed:** Applied the same terrain height calculation pattern to knockback movement.

### 4. World Reference Timing Issue
**File:** `js/entities/enemies/EnemyManager.js`
**Lines:** 301-303
**Problem:** The world reference was set after attempting to calculate terrain height, causing potential null reference issues.

**Fixed:** Set the world reference before position calculation.

### 5. Multiple Y Position Setting Issues
**Files:** `js/entities/enemies/EnemyManager.js`
**Lines:** 610, 966, 1284
**Problem:** Multiple methods were setting Y positions directly to terrain height, which conflicted with the centralized terrain height calculation in `spawnEnemy()`.

**Fixed:** All spawn position generation methods now set Y to 0 and let the centralized `spawnEnemy()` method handle terrain height calculation.

### 6. Inconsistent Position Coordinate System
**File:** `js/entities/enemies/EnemyManager.js`
**Line:** 966
**Problem:** `getRandomSpawnPosition()` was generating positions around world origin instead of relative to player position.

**Fixed:** Changed to generate positions relative to player position for more logical enemy spawning.

### 7. Multiplayer Position Synchronization Issues
**File:** `js/entities/enemies/EnemyManager.js`
**Line:** 396
**Problem:** When synchronizing enemy positions from multiplayer host, the system was using the Y position directly from network data without considering local terrain height.

**Fixed:** Added terrain height calculation for multiplayer synchronized positions.

### 8. Performance Issues with Terrain Height Calculation
**File:** `js/entities/enemies/Enemy.js`
**Lines:** 998-1023
**Problem:** Terrain height was being calculated every frame even when enemy position didn't change significantly, causing performance issues.

**Fixed:** Added throttling to only calculate terrain height when enemy moves more than 0.5 units.

### 9. Position Validation and Error Recovery
**File:** `js/entities/enemies/Enemy.js`
**Lines:** 1115-1157
**Problem:** No mechanism to detect or fix invalid enemy positions that could occur due to calculation errors or edge cases.

**Fixed:** Added comprehensive position validation with automatic correction.

## Changes Made

### EnemyManager.js
1. **Line 303:** Set `enemy.world` reference before position calculation
2. **Lines 306-313:** Fixed spawn position calculation to properly use terrain height
3. **Lines 955-970:** Fixed getRandomSpawnPosition() to not set Y position prematurely
4. **Lines 609-612:** Fixed group spawning (dangerous groups) to use consistent terrain height
5. **Lines 1283-1286:** Fixed regular group spawning to use consistent terrain height
6. **Lines 397-405:** Fixed multiplayer enemy position synchronization
7. **Lines 998-1012:** Added validateAllEnemyPositions() method for debugging
8. **Removed:** The incorrect `2.04 * enemy.scale` addition that was causing floating enemies

### Enemy.js
1. **Lines 364-377:** Fixed movement calculation to consider terrain height
2. **Lines 680-692:** Fixed knockback calculation to consider terrain height
3. **Lines 1095-1109:** Added forceTerrainHeightUpdate() method for debugging
4. **Lines 1115-1157:** Added validatePosition() method for automatic position correction
5. **Lines 254-256:** Added periodic position validation during enemy updates
6. **Lines 998-1023:** Enhanced updateTerrainHeight() with performance optimization
7. **Enhanced:** Both movement and knockback now properly check for world reference and terrain height updates flag

## Key Improvements

1. **Proper Ground Following:** Enemies now properly follow the terrain contours during movement
2. **Accurate Spawning:** New enemies spawn at the correct height on any terrain
3. **Boss Protection:** Boss enemies retain their special positioning logic to prevent sinking
4. **Performance Conscious:** Terrain height calculations only occur when necessary and are throttled for performance
5. **Null Safety:** Added proper null checks for terrain height values
6. **Multiplayer Compatibility:** Fixed enemy positioning synchronization in multiplayer games
7. **Automatic Error Recovery:** Added position validation and automatic correction for invalid positions
8. **Debug Support:** Added debugging methods for manual position validation and correction

## Technical Notes

- The `heightOffset` property ensures enemies are positioned slightly above the ground surface
- Boss enemies have special handling to prevent position changes after initial placement
- The `allowTerrainHeightUpdates` flag provides control over which enemies should follow terrain
- All position changes now consistently use the `setPosition()` method for proper model synchronization

## Testing Recommendations

1. Test enemy spawning on various terrain types (hills, valleys, flat areas)
2. Verify enemies properly follow the player up and down slopes
3. Check that knockback effects work correctly on uneven terrain
4. Ensure boss enemies maintain their fixed positions
5. Test in multiplayer scenarios to ensure position synchronization works correctly

---

## Additional Fix - Animation Y Position Override Issue

### Issue Description (NEW)
After the initial terrain positioning fix, some enemies were still appearing "in the sky" due to enemy model classes directly modifying the `modelGroup.position.y` property in their animation methods, which conflicts with the Enemy class's terrain positioning system.

### Affected Models (FIXED)
- **SimpleEnemyModel.js**: Applied base height offsets and bobbing animations directly to modelGroup.position.y ✅ FIXED
- **ZombieModel.js**: Used Math.max to ensure minimum height on modelGroup.position.y ✅ FIXED
- **MountainTrollModel.js**: Applied breathing motion directly to modelGroup.position.y ✅ FIXED
- **ZombieBruteModel.js**: Applied breathing motion with minimum height to modelGroup.position.y ✅ FIXED
- **SwampWitchModel.js**: Applied hovering motion directly to modelGroup.position.y ✅ FIXED
- **VoidWraithModel.js**: Applied hovering motion directly to modelGroup.position.y ✅ FIXED

### Solution Applied
Modified all affected enemy models to:

1. **Remove direct modifications** to `this.modelGroup.position.y`
2. **Apply animations to individual child objects** instead of the entire model group
3. **Store original Y positions** in child userData for proper animation restoration
4. **Add documentation comments** explaining the positioning system

### Key Changes Made

#### For SimpleEnemyModel.js:
- Replaced modelGroup Y positioning with individual child positioning
- Applied bobbing animation to all children while preserving their original positions
- Added proper state management for original Y positions
- Enhanced animation with state-aware bobbing (only when not moving/attacking)

#### For Other Models:
- Applied breathing/hovering motions to the torso (first child) instead of the entire model
- Preserved original child positions using userData.originalY
- Maintained all visual effects while respecting the Enemy class positioning system
- Removed minimum height constraints (now handled by Enemy class)

### Animation Guidelines for Future Development
Enemy models should follow these rules:
1. **Never modify** `this.modelGroup.position.y` in updateAnimations
2. **Apply vertical animations** to individual children
3. **Use userData.originalY** to store and restore original positions
4. **Only modify** modelGroup rotations (X and Z axes, Y rotation is managed by Enemy class)
5. **Test with different terrain heights** to ensure proper positioning

### Files Modified in This Additional Fix
- `/js/entities/enemies/models/SimpleEnemyModel.js` - Complete rewrite of updateAnimations method
- `/js/entities/enemies/models/ZombieModel.js` - Removed Y position modification
- `/js/entities/enemies/models/MountainTrollModel.js` - Applied breathing to torso child
- `/js/entities/enemies/models/ZombieBruteModel.js` - Applied breathing to torso child
- `/js/entities/enemies/models/SwampWitchModel.js` - Applied hovering to torso child
- `/js/entities/enemies/models/VoidWraithModel.js` - Applied hovering to torso child

### Results
- ✅ Enemies spawn at proper terrain height
- ✅ Animation effects are preserved (bobbing, breathing, hovering)
- ✅ No enemies appear floating in the sky
- ✅ Boss positioning remains stable
- ✅ Animations work correctly for moving and stationary states

This completes the comprehensive fix for enemy positioning issues.