/**
 * SkillsPreviewTab.js
 * Manages the skills preview tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { SkillPreview } from './SkillPreview.js';
import { SKILLS } from '../../config/skills.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import { SKILL_TREES } from '../../config/skill-tree.js';

export class SkillsPreviewTab extends SettingsTab {
    /**
     * Create a skills preview tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('skills-preview', game, settingsMenu);
        
        // Skills preview elements
        this.skillsPreviewContainer = document.getElementById('skills-preview-container');
        this.skillsPreviewSelect = document.getElementById('skills-preview-select');
        this.prevSkillButton = document.getElementById('prev-skill-button');
        this.nextSkillButton = document.getElementById('next-skill-button');
        this.skillDetailsContainer = document.getElementById('skill-details');
        
        // Variant selection elements
        this.variantsContainer = document.getElementById('skill-variants-container');
        this.variantsSelect = document.getElementById('skill-variants-select');
        this.prevVariantButton = document.getElementById('prev-variant-button');
        this.nextVariantButton = document.getElementById('next-variant-button');
        this.variantInfo = document.getElementById('variant-info');
        
        this.skillPreview = null;
        this.currentSkill = null;
        this.currentSkillEffect = null;
        this.currentVariant = null;
        
        this.init();
    }
    
    /**
     * Initialize the skills preview
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Initialize skills select dropdown
        this.initializeSkillsOptions();
        
        // Set up navigation buttons for skills preview
        this.setupSkillsNavigationButtons();
        
        // Initialize the skills preview container
        this.initializeSkillsPreviewContainer();
        
        // Initialize variants selection
        this.initializeVariantsSelection();
        
        return true;
    }
    
    /**
     * Initialize skills options in the select element
     * @private
     */
    initializeSkillsOptions() {
        if (!this.skillsPreviewSelect) return;
        
        // Clear existing options
        while (this.skillsPreviewSelect.options.length > 0) {
            this.skillsPreviewSelect.remove(0);
        }
        
        // Add skill options
        SKILLS.forEach((skill, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = skill.name;
            option.title = skill.description;
            this.skillsPreviewSelect.appendChild(option);
        });
        
        // Get the stored selected skill index or default to 0
        let selectedSkillIndex = 0;
        const storedSkillIndex = localStorage.getItem(STORAGE_KEYS.SELECTED_SKILL_PREVIEW);
        
        if (storedSkillIndex !== null && !isNaN(parseInt(storedSkillIndex)) && 
            parseInt(storedSkillIndex) >= 0 && parseInt(storedSkillIndex) < SKILLS.length) {
            selectedSkillIndex = parseInt(storedSkillIndex);
        }
        
        // Set the selected skill
        this.skillsPreviewSelect.value = selectedSkillIndex;
        this.currentSkill = SKILLS[selectedSkillIndex];
        
        // Add change event listener
        this.skillsPreviewSelect.addEventListener('change', () => {
            const selectedIndex = parseInt(this.skillsPreviewSelect.value);
            localStorage.setItem(STORAGE_KEYS.SELECTED_SKILL_PREVIEW, selectedIndex);
            
            // Update the current skill
            this.currentSkill = SKILLS[selectedIndex];
            
            // Reset current variant
            this.currentVariant = null;
            
            // Update variants selection
            this.updateVariantsSelection();
            
            // Update the skill preview
            this.updateSkillPreview();
            
            // Update the skill details
            this.updateSkillDetails();
            
            // Play the skill effect
            this.playCurrentSkillEffect();
        });
    }
    
    /**
     * Set up navigation buttons for skills preview
     * @private
     */
    setupSkillsNavigationButtons() {
        if (this.prevSkillButton) {
            this.prevSkillButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.skillsPreviewSelect.value);
                const newIndex = (currentIndex - 1 + SKILLS.length) % SKILLS.length;
                this.skillsPreviewSelect.value = newIndex;
                this.skillsPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextSkillButton) {
            this.nextSkillButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.skillsPreviewSelect.value);
                const newIndex = (currentIndex + 1) % SKILLS.length;
                this.skillsPreviewSelect.value = newIndex;
                this.skillsPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
    }
    
    /**
     * Initialize the skills preview container
     * @private
     */
    initializeSkillsPreviewContainer() {
        if (!this.skillsPreviewContainer) return;
        
        // Create skill preview
        this.skillPreview = new SkillPreview(this.skillsPreviewContainer);
        
        // Update the skill preview with the current skill
        this.updateSkillPreview();
        
        // Update the skill details
        this.updateSkillDetails();
    }
    
    /**
     * Set up navigation buttons for variants preview
     * @private
     */
    setupVariantsNavigationButtons() {
        // Add event listeners
        this.prevVariantButton.addEventListener('click', () => {
            if (!this.variantsSelect || this.variantsSelect.options.length <= 1) return;
            
            const currentIndex = this.variantsSelect.selectedIndex;
            const optionsLength = this.variantsSelect.options.length;
            const newIndex = (currentIndex - 1 + optionsLength) % optionsLength;
            
            this.variantsSelect.selectedIndex = newIndex;
            this.variantsSelect.dispatchEvent(new Event('change'));
        });
        
        this.nextVariantButton.addEventListener('click', () => {
            if (!this.variantsSelect || this.variantsSelect.options.length <= 1) return;
            
            const currentIndex = this.variantsSelect.selectedIndex;
            const optionsLength = this.variantsSelect.options.length;
            const newIndex = (currentIndex + 1) % optionsLength;
            
            this.variantsSelect.selectedIndex = newIndex;
            this.variantsSelect.dispatchEvent(new Event('change'));
        });
    }
    
    /**
     * Initialize variants selection
     * @private
     */
    initializeVariantsSelection() {
        this.setupVariantsNavigationButtons();
        // Add change event listener to variants select
        this.variantsSelect.addEventListener('change', () => {
            const selectedVariant = this.variantsSelect.value;
            this.currentVariant = selectedVariant === 'base' ? null : selectedVariant;
            
            // Save the selected variant
            if (this.currentSkill) {
                const variantKey = `${STORAGE_KEYS.SELECTED_SKILL_VARIANT}_${this.currentSkill.name}`;
                localStorage.setItem(variantKey, selectedVariant);
            }
            
            // Update the skill preview with the selected variant
            this.updateSkillPreview();
            
            // Update the skill details
            this.updateSkillDetails();
            
            // Play the skill effect
            this.playCurrentSkillEffect();
        });
        
        // Initialize variants for the current skill
        this.updateVariantsSelection();
    }
    
    /**
     * Update variants selection based on the current skill
     * @private
     */
    updateVariantsSelection() {
        if (!this.variantsSelect || !this.currentSkill) return;
        
        // Clear existing options
        while (this.variantsSelect.options.length > 0) {
            this.variantsSelect.remove(0);
        }
        
        // Add base skill option
        const baseOption = document.createElement('option');
        baseOption.value = 'base';
        baseOption.textContent = 'Base Skill';
        this.variantsSelect.appendChild(baseOption);
        
        // Check if this skill has variants in the skill tree
        const skillTree = SKILL_TREES[this.currentSkill.name];
        if (skillTree && skillTree.variants) {
            // Add variant options
            Object.keys(skillTree.variants).forEach(variantName => {
                const option = document.createElement('option');
                option.value = variantName;
                option.textContent = variantName;
                
                const variantData = skillTree.variants[variantName];
                if (variantData && variantData.description) {
                    option.title = variantData.description;
                }
                
                this.variantsSelect.appendChild(option);
            });
            
            // Show the variants container and navigation buttons
            if (this.variantsContainer) {
                this.variantsContainer.style.display = 'block';
            }
            
            // Show navigation buttons if there are multiple variants
            if (this.prevVariantButton && this.nextVariantButton) {
                const showButtons = this.variantsSelect.options.length > 1;
                this.prevVariantButton.style.display = showButtons ? 'inline-block' : 'none';
                this.nextVariantButton.style.display = showButtons ? 'inline-block' : 'none';
            }
            
            // Get the stored selected variant or default to base
            const variantKey = `${STORAGE_KEYS.SELECTED_SKILL_VARIANT}_${this.currentSkill.name}`;
            const storedVariant = localStorage.getItem(variantKey) || 'base';
            
            // Set the selected variant
            if (storedVariant === 'base' || this.variantsSelect.querySelector(`option[value="${storedVariant}"]`)) {
                this.variantsSelect.value = storedVariant;
                this.currentVariant = storedVariant === 'base' ? null : storedVariant;
            } else {
                this.variantsSelect.value = 'base';
                this.currentVariant = null;
            }
        } else {
            // Hide the variants container and navigation buttons if no variants
            if (this.variantsContainer) {
                this.variantsContainer.style.display = 'none';
            }
            
            // Hide navigation buttons
            if (this.prevVariantButton && this.nextVariantButton) {
                this.prevVariantButton.style.display = 'none';
                this.nextVariantButton.style.display = 'none';
            }
            
            // Reset current variant
            this.currentVariant = null;
        }
    }
    
    /**
     * Update the skill preview with the current skill and variant
     * @private
     */
    updateSkillPreview() {
        if (!this.skillPreview || !this.currentSkill) return;
        
        // Create a copy of the current skill data
        const skillData = { ...this.currentSkill };
        
        // Add variant if selected
        if (this.currentVariant) {
            skillData.variant = this.currentVariant;
        }
        
        // Create the skill effect
        this.skillPreview.createSkillEffect(skillData);
    }
    
    /**
     * Update the skill details display
     * @private
     */
    updateSkillDetails() {
        if (!this.skillDetailsContainer || !this.currentSkill) return;
        
        // Create the skill details HTML
        this.skillDetailsContainer.innerHTML = `
            <h4>${this.currentSkill.name}</h3>
            <p class="skill-preview-description">${this.currentSkill.description}</p>
            <br/>
            <div class="skill-stats">
                <div class="skill-stat">
                    <span class="stat-label">Damage:</span>
                    <span class="stat-value">${this.currentSkill.damage !== undefined ? this.currentSkill.damage : 'N/A'}</span>
                </div>
                <div class="skill-stat">
                    <span class="stat-label">Cooldown:</span>
                    <span class="stat-value">${this.currentSkill.cooldown !== undefined ? this.currentSkill.cooldown : 'N/A'}</span>
                </div>
                <div class="skill-stat">
                    <span class="stat-label">Range:</span>
                    <span class="stat-value">${this.currentSkill.range !== undefined ? this.currentSkill.range : 'N/A'}</span>
                </div>
                <div class="skill-stat">
                    <span class="stat-label">Mana Cost:</span>
                    <span class="stat-value">${this.currentSkill.manaCost !== undefined ? this.currentSkill.manaCost : 'N/A'}</span>
                </div>
            </div>
        `;

        // Get variant description if available
        if (this.currentVariant) {
            const skillTree = SKILL_TREES[this.currentSkill.name];
            if (skillTree && skillTree.variants && skillTree.variants[this.currentVariant]) {
                this.variantInfo.innerHTML = `
                    <h4>${this.currentVariant}</h4>
                    <p class="skill-preview-description">${skillTree.variants[this.currentVariant].description || 'No description available.'}</p>
                `;
            }
        } else {
            this.variantInfo.innerHTML = ``;
        }
    }
    
    /**
     * Play the current skill effect
     */
    playCurrentSkillEffect() {
        if (!this.skillPreview || !this.currentSkill) return;
        
        // Clear any existing skill effect
        if (this.currentSkillEffect) {
            clearTimeout(this.currentSkillEffect);
            this.currentSkillEffect = null;
        }
        
        // Create a copy of the current skill data
        const skillData = { ...this.currentSkill };
        
        // Add variant if selected
        if (this.currentVariant) {
            skillData.variant = this.currentVariant;
        }
        
        // Play the skill effect
        this.skillPreview.createSkillEffect(skillData);
        
        // Set a timeout to replay the skill effect
        this.currentSkillEffect = setTimeout(() => {
            this.playCurrentSkillEffect();
        }, 3000);
    }
    
    /**
     * Resize the skills preview to fit the container
     */
    resize() {
        this.resizeSkillsPreview();
    }
    
    /**
     * Resize the skills preview to fit the container
     * @private
     */
    resizeSkillsPreview() {
        if (!this.skillPreview) return;
        
        const container = this.skillsPreviewContainer;
        if (!container) return;
        
        // Get the container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Update the skills preview size
        this.skillPreview.setSize(width, height);
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // Resize the skills preview when the tab is activated
        setTimeout(() => {
            this.resize();
            
            // Force restart the animation when the skills preview tab is clicked
            if (this.skillPreview) {
                this.skillPreview.forceRestartAnimation();
            }
            
            // Also play the current skill effect
            this.playCurrentSkillEffect();
        }, 50);
    }
    
    /**
     * Called when the tab is deactivated
     */
    onDeactivate() {
        // Clear any existing skill effect
        if (this.currentSkillEffect) {
            clearTimeout(this.currentSkillEffect);
            this.currentSkillEffect = null;
        }
    }
    
    /**
     * Save the skills preview settings
     */
    saveSettings() {
        if (this.skillsPreviewSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_SKILL_PREVIEW, this.skillsPreviewSelect.value);
        }
        
        if (this.currentSkill && this.variantsSelect) {
            const variantKey = `${STORAGE_KEYS.SELECTED_SKILL_VARIANT}_${this.currentSkill.name}`;
            localStorage.setItem(variantKey, this.variantsSelect.value);
        }
    }
}