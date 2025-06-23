/**
 * Utility functions for skill tree management
 */

/**
 * Clone buffs into each variant by reference
 * This function adds a reference to each buff in the variants
 * @param {Object} skillTrees - The skill trees object
 * @returns {Object} - The modified skill trees object
 */
export function cloneBuffsIntoVariants(skillTrees) {
    // Create a deep copy of the skill trees to avoid modifying the original
    const modifiedSkillTrees = JSON.parse(JSON.stringify(skillTrees));
    
    // Iterate through each skill
    Object.keys(modifiedSkillTrees).forEach(skillName => {
        const skill = modifiedSkillTrees[skillName];
        
        // Skip if skill doesn't have both variants and buffs
        if (!skill.variants || !skill.buffs) return;
        
        // Get the buffs for this skill
        const buffs = skill.buffs;
        
        // Iterate through each variant
        Object.keys(skill.variants).forEach(variantName => {
            const variant = skill.variants[variantName];
            
            // Add a reference to the buffs in the variant
            variant.buffs = {};
            
            // Filter buffs for this variant
            Object.keys(buffs).forEach(buffName => {
                const buff = buffs[buffName];
                const requiredVariant = buff.requiredVariant || "any";
                
                // If the buff is for any variant or specifically for this variant, add it
                if (requiredVariant === "any" || requiredVariant === variantName) {
                    // Store a reference to the buff
                    variant.buffs[buffName] = buff;
                }
            });
        });
    });
    
    return modifiedSkillTrees;
}

/**
 * Apply the cloned buffs to the skill trees
 * This function modifies the skill trees in place
 * @param {Object} skillTrees - The skill trees object to modify
 */
export function applyBuffsToVariants(skillTrees) {
    // Iterate through each skill
    Object.keys(skillTrees).forEach(skillName => {
        const skill = skillTrees[skillName];
        
        // Skip if skill doesn't have both variants and buffs
        if (!skill.variants || !skill.buffs) return;
        
        // Get the buffs for this skill
        const buffs = skill.buffs;
        
        // Iterate through each variant
        Object.keys(skill.variants).forEach(variantName => {
            const variant = skill.variants[variantName];
            
            // Add a reference to the buffs in the variant
            variant.buffs = {};
            
            // Filter buffs for this variant
            Object.keys(buffs).forEach(buffName => {
                const buff = buffs[buffName];
                const requiredVariant = buff.requiredVariant || "any";
                
                // If the buff is for any variant or specifically for this variant, add it
                if (requiredVariant === "any" || requiredVariant === variantName) {
                    // Store a reference to the buff
                    variant.buffs[buffName] = buff;
                }
            });
        });
    });
}