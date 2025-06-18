import { UIComponent } from '../UIComponent.js';
import { getSkillIcon } from '../config/skill/skill-icons.js';
import { PRIMARY_ATTACKS, NORMAL_SKILLS } from '../config/skill/skills.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';
import { SKILL_TREES } from '../config/skill/skill-trees.js';

/**
 * SkillSelectionUI component
 * Allows players to select skills for battle
 * Requirements:
 * - Must have 1 primary attack
 * - Only allow 7 normal skills to be picked
 * - In total, only 8 skills (1+7) can be used in battle
 */
export class SkillSelectionUI extends UIComponent {
    /**
     * Create a new SkillSelectionUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('skill-selection', game);
        
        // Track selected skills
        this.selectedPrimaryAttack = null;
        this.selectedNormalSkills = [];
        
        // Maximum number of normal skills that can be selected
        this.maxNormalSkills = 7;
        
        // Get ordered skills based on skill-trees.js
        this.orderedSkills = this.getOrderedSkills();
        
        // Create HTML templates
        this.createTemplates();
        
        // Load saved skills from localStorage or use defaults
        this.loadSavedSkills();
    }
    
    /**
     * Get skills ordered according to skill-trees.js
     * @returns {Object} Object containing ordered primary attacks and normal skills
     */
    getOrderedSkills() {
        // Get skill names from skill-trees.js
        const skillTreeNames = Object.keys(SKILL_TREES);
        
        // Filter primary attacks and normal skills based on skill-tree order
        const orderedPrimaryAttacks = PRIMARY_ATTACKS.slice().sort((a, b) => {
            const aIndex = skillTreeNames.indexOf(a.name);
            const bIndex = skillTreeNames.indexOf(b.name);
            
            // If both skills are in the skill tree, sort by their order in the tree
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            
            // If only one skill is in the tree, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither skill is in the tree, maintain original order
            return 0;
        });
        
        // Do the same for normal skills
        const orderedNormalSkills = NORMAL_SKILLS.slice().sort((a, b) => {
            const aIndex = skillTreeNames.indexOf(a.name);
            const bIndex = skillTreeNames.indexOf(b.name);
            
            // If both skills are in the skill tree, sort by their order in the tree
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            
            // If only one skill is in the tree, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither skill is in the tree, maintain original order
            return 0;
        });
        
        return {
            primaryAttacks: orderedPrimaryAttacks,
            normalSkills: orderedNormalSkills
        };
    }
    
    /**
     * Create HTML templates for dynamic content
     */
    createTemplates() {
        // Template for skill selection item
        this.skillItemTemplate = `
            <div class="skill-selection-item" data-skill-name="{{skillName}}" data-skill-type="{{skillType}}">
                <div class="skill-icon-container">
                    <div class="skill-icon {{cssClass}}" style="border-color: {{color}}; box-shadow: 0 0 10px {{color}}40;">
                        {{icon}}
                    </div>
                </div>
                <div class="skill-info">
                    <div class="skill-name">{{skillName}}</div>
                    <div class="skill-description">{{description}}</div>
                </div>
            </div>
        `;
        
        // Template for preview skill button
        this.previewSkillTemplate = `
            <div class="skill-button {{extraClass}}" data-skill-type="{{skillType}}" data-skill="{{skillName}}" 
                 style="border-color: {{color}}; {{boxShadow}}">
                {{skillNameDiv}}
                <div class="skill-icon {{cssClass}}">{{icon}}</div>
                <div class="skill-key">{{keyDisplay}}</div>
                <div class="skill-cooldown"></div>
            </div>
        `;
        
        // Template for no skills selected message
        this.noSkillsTemplate = `
            <div class="no-skills-selected">
                <p>No skills selected yet</p>
                <p class="hint">Select at least one primary attack</p>
            </div>
        `;
    }
    
    /**
     * Apply template with data
     * @param {string} template - The template string with placeholders
     * @param {Object} data - The data to replace placeholders
     * @returns {string} - The processed template
     */
    applyTemplate(template, data) {
        let result = template;
        
        // Replace all placeholders with actual data
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, value || '');
        }
        
        return result;
    }
    
    /**
     * Load saved skills from localStorage
     * If no skills are saved, use BATTLE_SKILLS from config
     */
    loadSavedSkills() {
        try {
            // Try to get saved skills from localStorage
            const savedSkillsJson = localStorage.getItem(STORAGE_KEYS.SELECTED_SKILLS);
            
            if (savedSkillsJson) {
                // Parse the saved skills
                const savedSkills = JSON.parse(savedSkillsJson);
                
                // Check if we're using the new format (array of skill IDs)
                if (savedSkills.length > 0 && 'id' in savedSkills[0]) {
                    // New format - array of { id, isPrimary } objects
                    // Set the selected primary attack
                    const primarySkill = savedSkills.find(skill => skill.isPrimary);
                    if (primarySkill) {
                        this.selectedPrimaryAttack = primarySkill.id;
                    }
                    
                    // Set the selected normal skills
                    this.selectedNormalSkills = savedSkills
                        .filter(skill => !skill.isPrimary)
                        .map(skill => skill.id);
                } else {
                    // Old format - array of full skill objects
                    // Set the selected primary attack
                    const primaryAttack = savedSkills.find(skill => skill.primaryAttack);
                    if (primaryAttack) {
                        this.selectedPrimaryAttack = primaryAttack.name;
                    }
                    
                    // Set the selected normal skills
                    this.selectedNormalSkills = savedSkills
                        .filter(skill => !skill.primaryAttack)
                        .map(skill => skill.name);
                }
            } else {
                // If no skills are saved, use BATTLE_SKILLS from config
                this.loadDefaultSkills();
            }
        } catch (error) {
            console.error('Error loading saved skills:', error);
            // If there's an error, use BATTLE_SKILLS from config
            this.loadDefaultSkills();
        }
    }
    
    /**
     * Load default skills from BATTLE_SKILLS config, respecting skill-tree order
     */
    loadDefaultSkills() {
        // Find the primary attack in ordered skills
        if (this.orderedSkills.primaryAttacks.length > 0) {
            // Use the first primary attack from ordered list
            this.selectedPrimaryAttack = this.orderedSkills.primaryAttacks[0].name;
        } else if (PRIMARY_ATTACKS.length > 0) {
            // Fallback to first primary attack if none in ordered list
            this.selectedPrimaryAttack = PRIMARY_ATTACKS[0].name;
        }
        
        // Get normal skills from ordered list
        this.selectedNormalSkills = this.orderedSkills.normalSkills
            .map(skill => skill.name)
            .slice(0, this.maxNormalSkills); // Ensure we don't exceed max
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        console.debug('Initializing SkillSelectionUI');
        console.debug('SkillSelectionUI: Container before init:', this.container);
        
        // Update the normal skills counter with the max value
        const normalSkillsCounter = this.container.querySelector('#normal-skills-counter');
        if (normalSkillsCounter) {
            normalSkillsCounter.textContent = `0/${this.maxNormalSkills}`;
        }
        
        // Update the normal skills section header
        const normalSkillsHeader = this.container.querySelector('#normal-skills-section h3');
        if (normalSkillsHeader) {
            normalSkillsHeader.textContent = `Normal Skills (Select up to ${this.maxNormalSkills})`;
        }
        
        // Populate skill lists
        console.debug('Populating primary attacks');
        this.populatePrimaryAttacks();
        
        console.debug('Populating normal skills');
        this.populateNormalSkills();
        
        // Add event listeners
        console.debug('Adding event listeners');
        this.addEventListeners();
        
        // Update the skill counter
        console.debug('Updating skill counter');
        this.updateSkillCounter();
        
        // Update the preview
        console.debug('Updating preview');
        this.updatePreview();
        
        // Update save button state
        console.debug('Updating save button state');
        this.updateSaveButtonState();
        
        console.debug('SkillSelectionUI initialization complete');
        
        return true;
    }
    
    /**
     * Populate the primary attacks list
     */
    populatePrimaryAttacks() {
        const primaryAttackList = this.container.querySelector('#primary-attack-list');
        console.debug('Primary attack list element:', primaryAttackList);
        
        // Clear existing content
        primaryAttackList.innerHTML = '';
        
        // Generate HTML for all primary attacks using ordered skills
        const primaryAttacksHTML = this.orderedSkills.primaryAttacks.map(skill => {
            console.debug('Creating primary attack item for:', skill.name);
            
            // Get skill icon data
            const iconData = getSkillIcon(skill.name);
            const icon = skill.icon || iconData.emoji || '✨';
            
            // Get color for border styling
            const color = iconData.color || '#ffffff';
            
            // Apply template with data
            const skillItemHTML = this.applyTemplate(this.skillItemTemplate, {
                skillName: skill.name,
                skillType: 'primary',
                cssClass: iconData.cssClass || '',
                color: color,
                icon: icon,
                description: skill.description
            });
            
            return skillItemHTML;
        }).join('');
        
        // Add all items to the DOM at once
        primaryAttackList.innerHTML = primaryAttacksHTML;
        
        // Add selected class to the currently selected primary attack
        if (this.selectedPrimaryAttack) {
            const selectedItem = primaryAttackList.querySelector(`[data-skill-name="${this.selectedPrimaryAttack}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
    }
    
    /**
     * Populate the normal skills list
     */
    populateNormalSkills() {
        const normalSkillsList = this.container.querySelector('#normal-skills-list');
        console.debug('Normal skills list element:', normalSkillsList);
        
        // Clear existing content
        normalSkillsList.innerHTML = '';
        
        // Generate HTML for all normal skills using ordered skills
        const normalSkillsHTML = this.orderedSkills.normalSkills.map(skill => {
            console.debug('Creating normal skill item for:', skill.name);
            
            // Get skill icon data
            const iconData = getSkillIcon(skill.name);
            const icon = skill.icon || iconData.emoji || '✨';
            
            // Get color for border styling
            const color = iconData.color || '#ffffff';
            
            // Apply template with data
            const skillItemHTML = this.applyTemplate(this.skillItemTemplate, {
                skillName: skill.name,
                skillType: 'normal',
                cssClass: iconData.cssClass || '',
                color: color,
                icon: icon,
                description: skill.description
            });
            
            return skillItemHTML;
        }).join('');
        
        // Add all items to the DOM at once
        normalSkillsList.innerHTML = normalSkillsHTML;
        
        // Add selected class to currently selected normal skills
        this.selectedNormalSkills.forEach(skillName => {
            const selectedItem = normalSkillsList.querySelector(`[data-skill-name="${skillName}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        });
    }
    
    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // Primary attack selection - delegate events to the container
        const primaryAttackList = this.container.querySelector('#primary-attack-list');
        primaryAttackList.addEventListener('click', (event) => {
            // Find the closest skill-selection-item parent
            const skillItem = event.target.closest('.skill-selection-item');
            if (!skillItem) return;
            
            const skillName = skillItem.getAttribute('data-skill-name');
            console.debug('Primary attack clicked:', skillName);
            
            // Check if this skill is already selected
            if (this.selectedPrimaryAttack === skillName) {
                console.debug('Deselecting primary attack:', skillName);
                // Deselect this skill
                skillItem.classList.remove('selected');
                this.selectedPrimaryAttack = null;
            } else {
                console.debug('Selecting primary attack:', skillName);
                // Deselect all primary attacks
                const allItems = primaryAttackList.querySelectorAll('.skill-selection-item');
                allItems.forEach(i => i.classList.remove('selected'));
                
                // Select this one
                skillItem.classList.add('selected');
                
                // Update selected primary attack
                this.selectedPrimaryAttack = skillName;
            }
            
            console.debug('After selection, primary attack is:', this.selectedPrimaryAttack);
            
            // Update preview
            this.updatePreview();
            
            // Update save button state
            this.updateSaveButtonState();
        });
        
        // Normal skills selection - delegate events to the container
        const normalSkillsList = this.container.querySelector('#normal-skills-list');
        normalSkillsList.addEventListener('click', (event) => {
            // Find the closest skill-selection-item parent
            const skillItem = event.target.closest('.skill-selection-item');
            if (!skillItem) return;
            
            const skillName = skillItem.getAttribute('data-skill-name');
            console.debug('Normal skill clicked:', skillName);
            console.debug('Current selected normal skills:', [...this.selectedNormalSkills]);
            
            // Check if already selected
            if (skillItem.classList.contains('selected')) {
                console.debug('Deselecting normal skill:', skillName);
                // Deselect
                skillItem.classList.remove('selected');
                
                // Remove from selected skills
                const index = this.selectedNormalSkills.indexOf(skillName);
                if (index !== -1) {
                    this.selectedNormalSkills.splice(index, 1);
                }
            } else {
                // Check if we've reached the maximum
                if (this.selectedNormalSkills.length >= this.maxNormalSkills) {
                    console.debug('Maximum normal skills reached');
                    // Show notification
                    if (this.game && this.game.hudManager) {
                        this.game.hudManager.showNotification(`You can only select ${this.maxNormalSkills} normal skills`);
                    }
                    return;
                }
                
                console.debug('Selecting normal skill:', skillName);
                // Select
                skillItem.classList.add('selected');
                
                // Add to selected skills
                this.selectedNormalSkills.push(skillName);
            }
            
            console.debug('After selection, normal skills are:', [...this.selectedNormalSkills]);
            
            // Update counter
            this.updateSkillCounter();
            
            // Update preview
            this.updatePreview();
            
            // Update save button state
            this.updateSaveButtonState();
        });
        
        // Save button
        const saveButton = this.container.querySelector('#skill-selection-save');
        saveButton.addEventListener('click', () => {
            this.saveSkillSelection();
        });
    }
    
    /**
     * Update the normal skills counter
     */
    updateSkillCounter() {
        const counter = this.container.querySelector('#normal-skills-counter');
        counter.textContent = `${this.selectedNormalSkills.length}/${this.maxNormalSkills}`;
    }
    
    /**
     * Update the preview of selected skills to match the SkillsUI layout
     */
    updatePreview() {
        const previewContainer = this.container.querySelector('#selected-skills-preview');
        
        // Clear existing content
        previewContainer.innerHTML = '';
        
        // Show message if no skills are selected
        if (!this.selectedPrimaryAttack && this.selectedNormalSkills.length === 0) {
            previewContainer.innerHTML = this.noSkillsTemplate;
            return;
        }
        
        // Create an array of all skills in the order they'll appear in battle
        const battleSkills = [];
        
        // Add primary attack if selected
        if (this.selectedPrimaryAttack) {
            const primarySkill = this.orderedSkills.primaryAttacks.find(skill => skill.name === this.selectedPrimaryAttack);
            if (primarySkill) {
                battleSkills.push({
                    ...primarySkill,
                    keyDisplay: "h",
                    isPrimary: true
                });
            }
        }
        
        // Add normal skills if selected (up to 7 skills)
        for (let i = 0; i < Math.min(7, this.selectedNormalSkills.length); i++) {
            const skillName = this.selectedNormalSkills[i];
            const normalSkill = this.orderedSkills.normalSkills.find(skill => skill.name === skillName);
            if (normalSkill) {
                battleSkills.push({
                    ...normalSkill,
                    keyDisplay: `${i + 1}`,
                    isPrimary: false
                });
            }
        }
        
        // Add empty slots for remaining skills (always show 8 total slots - 1 primary + 7 normal)
        const remainingSlots = 7 - this.selectedNormalSkills.length;
        if (remainingSlots > 0) {
            for (let i = 0; i < remainingSlots; i++) {
                battleSkills.push({
                    name: "Empty Slot",
                    type: "empty",
                    keyDisplay: `${this.selectedNormalSkills.length + i + 1}`,
                    isPrimary: false,
                    isEmpty: true
                });
            }
        }
        
        // Generate HTML for all battle skills
        const battleSkillsHTML = battleSkills.map(skill => {
            // Get skill icon data
            const iconData = skill.isEmpty ? {} : (skill.isMore ? {} : getSkillIcon(skill.name));
            const icon = skill.isEmpty ? "+" : (skill.isMore ? "..." : (skill.icon || iconData.emoji || '✨'));
            
            // Get color for border styling
            const color = skill.isEmpty ? '#555555' : 
                         (skill.isMore ? '#888888' : 
                         (iconData.color || '#ffffff'));
            
            // Determine extra classes
            let extraClass = '';
            if (skill.isEmpty) extraClass += 'empty-slot ';
            if (skill.isMore) extraClass += 'more-skills ';
            
            // Create skill name div if not empty or more
            const skillNameDiv = (!skill.isEmpty && !skill.isMore) ? 
                `<div class="skill-name">${skill.name}</div>` : '';
            
            // Box shadow style
            const boxShadow = (!skill.isEmpty && !skill.isMore) ? 
                `box-shadow: 0 0 10px ${color}40;` : '';
            
            // Apply template with data
            return this.applyTemplate(this.previewSkillTemplate, {
                extraClass: extraClass.trim(),
                skillType: skill.type,
                skillName: skill.name,
                color: color,
                boxShadow: boxShadow,
                skillNameDiv: skillNameDiv,
                cssClass: (!skill.isEmpty && !skill.isMore && iconData.cssClass) ? iconData.cssClass : '',
                icon: icon,
                keyDisplay: skill.keyDisplay
            });
        }).join('');
        
        // Add all items to the DOM at once
        previewContainer.innerHTML = battleSkillsHTML;
    }
    
    /**
     * Update the save button state based on selection
     */
    updateSaveButtonState() {
        const saveButton = this.container.querySelector('#skill-selection-save');
        
        // Enable save button if at least one primary attack is selected
        saveButton.disabled = !this.selectedPrimaryAttack;
        
        // Update the counter text color based on selection
        const counter = this.container.querySelector('#normal-skills-counter');
        if (counter) {
            if (this.selectedNormalSkills.length === 0) {
                counter.style.color = '#ff9900'; // Warning color
            } else {
                counter.style.color = ''; // Reset to default
            }
        }
    }
    
    /**
     * Save the skill selection
     */
    saveSkillSelection() {
        // Validate selection
        if (!this.selectedPrimaryAttack) {
            if (this.game && this.game.hudManager) {
                this.game.hudManager.showNotification('You must select a primary attack');
            }
            return;
        }
        
        // Warn if no normal skills are selected, but allow it
        if (this.selectedNormalSkills.length === 0) {
            if (this.game && this.game.hudManager) {
                this.game.hudManager.showNotification('Warning: No normal skills selected', 'warning');
            }
        }
        
        // Create an array of skill IDs (names) instead of full skill objects
        // Primary attack first, then normal skills in their selected order
        const selectedSkillIds = [
            { id: this.selectedPrimaryAttack, isPrimary: true },
            ...this.selectedNormalSkills.map(skillName => ({ id: skillName, isPrimary: false }))
        ];
        
        // Save to localStorage - only saving the IDs now
        try {
            localStorage.setItem(STORAGE_KEYS.SELECTED_SKILLS, JSON.stringify(selectedSkillIds));
            console.debug('Skill IDs saved to localStorage successfully');
        } catch (error) {
            console.error('Error saving skill IDs to localStorage:', error);
            // Show error notification
            if (this.game && this.game.hudManager) {
                this.game.hudManager.showNotification('Failed to save skills. Please try again.');
            }
        }
        
        // Update player skills
        if (this.game && this.game.player) {
            // Reset player skills
            this.game.player.skills.skills = [];
            
            // Initialize with selected skills - load full skill config based on IDs
            this.game.player.skills.loadSkillsFromIds(selectedSkillIds);
            
            // Refresh the skills UI
            if (this.game.hudManager && this.game.hudManager.components.skillsUI) {
                this.game.hudManager.components.skillsUI.init();
            }
            
            // Show success notification
            if (this.game.hudManager) {
                this.game.hudManager.showNotification('Skills updated and saved successfully');
            }
        }

        this.hide();
        this.game.resume(false);
    }
    
    /**
     * Show the skill selection UI
     */
    show() {
        console.debug('SkillSelectionUI: show() called');
        
        // Try to load skills from localStorage first
        try {
            const savedSkillsJson = localStorage.getItem(STORAGE_KEYS.SELECTED_SKILLS);
            
            if (savedSkillsJson) {
                // Parse the saved skills
                const savedSkills = JSON.parse(savedSkillsJson);
                
                // Reset selections
                this.selectedPrimaryAttack = null;
                this.selectedNormalSkills = [];
                
                // Check if we're using the new format (array of skill IDs)
                if (savedSkills.length > 0 && 'id' in savedSkills[0]) {
                    // New format - array of { id, isPrimary } objects
                    // Set the selected primary attack
                    const primarySkill = savedSkills.find(skill => skill.isPrimary);
                    if (primarySkill) {
                        this.selectedPrimaryAttack = primarySkill.id;
                    }
                    
                    // Set the selected normal skills
                    this.selectedNormalSkills = savedSkills
                        .filter(skill => !skill.isPrimary)
                        .map(skill => skill.id);
                } else {
                    // Old format - array of full skill objects
                    // Set the selected primary attack
                    const primaryAttack = savedSkills.find(skill => skill.primaryAttack);
                    if (primaryAttack) {
                        this.selectedPrimaryAttack = primaryAttack.name;
                    }
                    
                    // Set the selected normal skills
                    this.selectedNormalSkills = savedSkills
                        .filter(skill => !skill.primaryAttack)
                        .map(skill => skill.name);
                }
            } else if (this.game && this.game.player) {
                // If no saved skills, load from player's current skills
                this.loadSkillsFromPlayer();
            } else {
                // If no player skills, load defaults
                this.loadDefaultSkills();
            }
        } catch (error) {
            console.error('Error loading saved skills:', error);
            
            // If error, try to load from player's current skills
            if (this.game && this.game.player) {
                this.loadSkillsFromPlayer();
            } else {
                // If no player skills, load defaults
                this.loadDefaultSkills();
            }
        }
        
        // Update UI to reflect current selection
        this.populatePrimaryAttacks();
        this.populateNormalSkills();
        this.updateSkillCounter();
        this.updatePreview();
        this.updateSaveButtonState();
        
        super.show();
    }
    
    /**
     * Load skills from player's current skills
     */
    loadSkillsFromPlayer() {
        const playerSkills = this.game.player.getSkills();
        
        // Reset selections
        this.selectedPrimaryAttack = null;
        this.selectedNormalSkills = [];
        
        // Find current primary attack
        const primaryAttack = playerSkills.find(skill => skill.primaryAttack);
        if (primaryAttack) {
            this.selectedPrimaryAttack = primaryAttack.name;
        }
        
        // Find current normal skills
        playerSkills.forEach(skill => {
            if (!skill.primaryAttack && this.selectedNormalSkills.length < this.maxNormalSkills) {
                this.selectedNormalSkills.push(skill.name);
            }
        });
    }
}