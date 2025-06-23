/**
 * AnimationUtils.js
 * Shared utilities for handling animations across different model classes
 */

/**
 * Play a specific animation with crossfade
 * @param {Object} animations - Object containing all available animations
 * @param {string|null} currentAnimation - Name of the currently playing animation (can be null)
 * @param {string} primaryName - Primary animation name to play
 * @param {string} fallbackName - Fallback animation name if primary not found (deprecated, kept for compatibility)
 * @param {number} transitionDuration - Duration of crossfade transition in seconds
 * @returns {Object} - Object containing success status, animation played, and updated current animation name
 */
export function playAnimation(animations, currentAnimation, primaryName, fallbackName = null, transitionDuration = 0.5) {
    // If we don't have animations, exit early with a warning
    if (!animations || Object.keys(animations).length === 0) {
        console.warn('AnimationUtils: No animations available to play');
        return { 
            success: false, 
            animation: null, 
            currentAnimation: currentAnimation 
        };
    }
    
    // Get all available animation names
    const allAnimNames = Object.keys(animations);
    let animationToPlay = null;

    if (primaryName == "idle" || primaryName == "walking") {
        animationToPlay = animations[primaryName];
        if (!animationToPlay) {
            return { 
                success: false, 
                animation: null, 
                currentAnimation: currentAnimation 
            };
        }
    }

    // Check if primaryName is a direct animation name
    if (primaryName && animations[primaryName]) {
        animationToPlay = animations[primaryName];
        console.debug(`AnimationUtils: Found direct animation match: ${primaryName}`);
    }
    
    // If no match found, use the first animation as fallback
    if (!animationToPlay && allAnimNames.length > 0) {
        const firstAnim = allAnimNames[0];
        animationToPlay = animations[firstAnim];
        console.debug(`AnimationUtils: Using first available animation as fallback: ${firstAnim}`);
    }
    
    // If no matching animation is found after all attempts, return false
    if (!animationToPlay) {
        console.warn(`AnimationUtils: No matching animation found for ${primaryName} and no animations available to fall back to`);
        return { 
            success: false, 
            animation: null, 
            currentAnimation: currentAnimation 
        };
    }
    
    // Get the name of the animation we're about to play
    const newAnimationName = animationToPlay._clip.name;
    
    // If this is already the current animation, don't restart it but return true
    if (currentAnimation === newAnimationName) {
        return { 
            success: true, 
            animation: animationToPlay, 
            currentAnimation: newAnimationName 
        };
    }
    
    // Crossfade to the new animation
    animationToPlay.reset().fadeIn(transitionDuration).play();
    
    // If there was a previous animation, fade it out
    if (currentAnimation && animations[currentAnimation]) {
        animations[currentAnimation].fadeOut(transitionDuration);
    }
    
    // Return success with the new animation and updated current animation name
    return { 
        success: true, 
        animation: animationToPlay, 
        currentAnimation: newAnimationName 
    };
}

/**
 * Find animations by type (e.g., idle, walk, attack)
 * @param {Object} animations - Object containing all available animations
 * @param {string} type - Type of animation to find (e.g., 'idle', 'walk', 'attack')
 * @returns {Array} - Array of animation names that match the type
 */
export function findAnimationsByType(animations, type) {
    if (!animations || !type) return [];
    
    const animationNames = Object.keys(animations);
    return animationNames.filter(name => 
        name.toLowerCase().includes(type.toLowerCase())
    );
}

/**
 * Get the best matching animation for a specific type
 * @param {Object} animations - Object containing all available animations
 * @param {Array} typeKeywords - Array of keywords to match (in order of preference)
 * @returns {string|null} - Name of the best matching animation or null if none found
 */
export function getBestMatchingAnimation(animations, typeKeywords) {
    if (!animations || !typeKeywords || typeKeywords.length === 0) return null;
    
    const animationNames = Object.keys(animations);
    
    // Try each keyword in order of preference
    for (const keyword of typeKeywords) {
        const matches = animationNames.filter(name => 
            name.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matches.length > 0) {
            return matches[0]; // Return the first match
        }
    }
    
    return null; // No matches found
}

/**
 * Update animation mixer with the given delta time
 * @param {THREE.AnimationMixer} mixer - The animation mixer to update
 * @param {number} delta - Delta time in seconds
 * @returns {boolean} - Whether the update was performed
 */
export function updateAnimation(mixer, delta) {
    if (!mixer) return false;
    
    mixer.update(delta);
    return true;
}

/**
 * Detect the model type based on animation names
 * @param {Array} animationNames - Array of animation names
 * @returns {Object} - Object containing model type information
 */
export function detectModelType(animationNames) {
    if (!animationNames || animationNames.length === 0) {
        return {
            isSkeletonKing: false,
            isStandardModel: false,
            modelType: 'unknown'
        };
    }
    
    // Check for Skeleton King model
    const isSkeletonKing = animationNames.some(name => 
        name.includes('_sk_') || name.includes('wk_'));
    
    // Check for standard model with common animation names
    const hasStandardAnims = animationNames.some(name => 
        name === 'idle' || name === 'walk' || name === 'run' || name === 'attack');
    
    let modelType = 'unknown';
    if (isSkeletonKing) {
        modelType = 'skeleton-king';
    } else if (hasStandardAnims) {
        modelType = 'standard';
    }
    
    return {
        isSkeletonKing,
        isStandardModel: hasStandardAnims,
        modelType
    };
}

/**
 * Update animations based on player state
 * @param {Object} params - Parameters for updating animations
 * @param {THREE.AnimationMixer} params.mixer - The animation mixer
 * @param {Object} params.animations - Object containing all available animations
 * @param {string} params.currentAnimation - Name of the currently playing animation
 * @param {Object} params.playerState - Player state object with isMoving(), isAttacking() methods
 * @param {number} params.delta - Delta time in seconds
 * @returns {Object} - Object containing success status and updated current animation name
 */
export function updateStateBasedAnimations(params) {
    const { mixer, animations, currentAnimation, playerState, delta } = params;
    
    // If we don't have a mixer or animations, exit early
    if (!mixer || !animations || Object.keys(animations).length === 0) {
        return { 
            success: false, 
            currentAnimation: currentAnimation 
        };
    }
    
    // Update the animation mixer with the delta time
    mixer.update(delta);
    
    let newCurrentAnimation = currentAnimation;
    
    // Get all animation names for logging/debugging
    const animNames = Object.keys(animations);
    // console.debug(`Available animations: ${animNames.join(', ')}`);
    
    // Use the detectModelType utility to determine the model type
    const modelInfo = detectModelType(animNames);
    
    // If no animation is currently playing, start one (similar to ModelViewer.js)
    if (!currentAnimation && animNames.length > 0) {
        console.debug("No animation currently playing, starting the first available animation");
        const firstAnim = animNames[0];
        animations[firstAnim].play();
        return {
            success: true,
            currentAnimation: firstAnim
        };
    }
    
    // For Skeleton King model, we'll use a simpler approach to ensure animations play
    if (modelInfo.isSkeletonKing) {
        // If we already have an animation playing, just keep updating it
        if (currentAnimation && animations[currentAnimation]) {
            console.debug(`Continuing to play current animation: ${currentAnimation}`);
            return {
                success: true,
                currentAnimation: currentAnimation
            };
        }
        
        // If no animation is playing, pick one based on state
        if (playerState.isAttacking()) {
            // Try to find an attack animation
            const attackAnims = animNames.filter(name => 
                name.includes('_attack') || 
                name.includes('_stab') || 
                name.includes('_kick'));
            
            if (attackAnims.length > 0) {
                const attackAnim = attackAnims[0];
                animations[attackAnim].play();
                console.debug(`Playing attack animation: ${attackAnim}`);
                return {
                    success: true,
                    currentAnimation: attackAnim
                };
            }
        }
        
        // If no attack animation or not attacking, just play the first animation
        const firstAnim = animNames[0];
        animations[firstAnim].play();
        console.debug(`Playing first available animation: ${firstAnim}`);
        return {
            success: true,
            currentAnimation: firstAnim
        };
    }
    
    // Standard animation handling for other models
    if (playerState.isMoving()) {
        const result = playAnimation(animations, currentAnimation, 'walk', 'run', 0.3);
        if (result.success) {
            newCurrentAnimation = result.currentAnimation;
        }
    } else if (playerState.isAttacking()) {
        const result = playAnimation(animations, currentAnimation, 'attack', 'punch', 0.2);
        if (result.success) {
            newCurrentAnimation = result.currentAnimation;
        }
    } else {
        const result = playAnimation(animations, currentAnimation, 'idle', 'idle', 0.5);
        if (result.success) {
            newCurrentAnimation = result.currentAnimation;
        }
    }
    
    // If we still don't have an animation playing, force play the first one
    if (!newCurrentAnimation && animNames.length > 0) {
        const firstAnim = animNames[0];
        animations[firstAnim].play();
        console.debug(`Forcing first animation to play: ${firstAnim}`);
        newCurrentAnimation = firstAnim;
    }
    
    return {
        success: true,
        currentAnimation: newCurrentAnimation
    };
}