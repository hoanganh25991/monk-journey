import { UIComponent } from '../UIComponent.js';
import { getSkillIcon } from '../config/skill-icons.js';
import { CAST_INTERVAL } from '../config/input.js';
import { touchManager } from './TouchManager.js';

/**
 * Skills UI component
 * Displays player skills and cooldowns
 */
export class SkillsUI extends UIComponent {
    /**
     * Create a new SkillsUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('skills-container', game);
        this.skillButtons = [];
        
        // For continuous skill casting
        this.skillCastIntervals = {};
        this.skillCastCooldowns = {};
        this.castInterval = CAST_INTERVAL * 1000; // Convert to milliseconds
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Get skills from player
        const skills = this.game.player.getSkills();
        
        // Create skill buttons HTML
        let skillsHTML = '';
        
        skills.forEach((skill, index) => {
            // Determine key display
            const keyDisplay = skill.primaryAttack ? "h" : `${index + 1}`;
            
            // Get skill icon data
            const iconData = getSkillIcon(skill.name);
            const icon = skill.icon || iconData.emoji || '✨'; // Use icon from skill, then from iconData, or default
            
            // Get color for border styling from skill-icons.js
            const color = iconData.color || '#ffffff';
            
            // Create skill button HTML
            skillsHTML += `
                <div class="skill-button" data-skill-type="${skill.type}" data-skill-index="${index}" data-skill="${skill.name}" style="border-color: ${color}; box-shadow: 0 0 10px ${color}40;">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-icon ${iconData.cssClass}">${icon}</div>
                    <div class="skill-key">${keyDisplay}</div>
                    <div class="skill-cooldown"></div>
                </div>
            `;
        });
        
        // Render the template
        this.render(skillsHTML);
        
        // Create skill overlay for right half of screen
        this.createSkillOverlay();
        
        // Add event listeners to skill buttons
        this.skillButtons = this.container.querySelectorAll('.skill-button');
        this.skillButtons.forEach(button => {
            // Prevent zoom on double tap and ensure proper touch handling
            button.style.touchAction = 'none';
            button.style.pointerEvents = 'auto';
            
            const index = parseInt(button.getAttribute('data-skill-index'));
            const skill = skills[index];
            const isPrimaryAttack = skill.primaryAttack;
            
            // Handle click events
            button.addEventListener('click', (e) => {
                // Prevent default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();
                
                // Check if this is the basic attack skill
                if (isPrimaryAttack) {
                    this.game.player.usePrimaryAttack();
                } else {
                    this.game.player.useSkill(index);
                }
                
                // Add click animation
                button.classList.add('skill-activated');
                setTimeout(() => {
                    button.classList.remove('skill-activated');
                }, 300);
            });
            
            // Add touch events for continuous casting for all skills
            // Start continuous casting on touch start
            button.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event from bubbling to other elements
                
                const touch = e.touches[0];
                
                // Try to claim the touch through the touch manager
                // Force claim for skills to ensure they work even when joystick is active
                if (touchManager.claimTouch(touch, 'skills')) {
                    // Clear any existing interval for this skill
                    this.stopContinuousCasting(index);
                    
                    // Store the touch ID for this skill button
                    button.dataset.touchId = touch.identifier;
                    
                    // Trigger first cast immediately
                    if (isPrimaryAttack) {
                        this.game.player.usePrimaryAttack();
                    } else {
                        this.game.player.useSkill(index);
                    }
                    
                    // Initialize cooldown for this skill
                    this.skillCastCooldowns[index] = 0;
                    
                    // Set up continuous casting with respect to cooldown
                    this.skillCastIntervals[index] = setInterval(() => {
                        // Reduce cooldown
                        this.skillCastCooldowns[index] -= this.castInterval / 1000;
                        
                        // If cooldown is up, cast the skill again
                        if (this.skillCastCooldowns[index] <= 0) {
                            try {
                                // Get the actual skill to check its current cooldown
                                const skills = this.game.player.getSkills();
                                const skill = skills[index];
                                
                                // Only cast if the skill is not on cooldown
                                if (skill && skill.getCooldownPercent() === 0) {
                                    if (isPrimaryAttack) {
                                        this.game.player.usePrimaryAttack();
                                    } else {
                                        this.game.player.useSkill(index);
                                    }
                                    
                                    // Reset the casting cooldown
                                    this.skillCastCooldowns[index] = CAST_INTERVAL;
                                }
                            } catch (error) {
                                console.error(`Error in continuous casting for skill ${index}:`, error);
                                // Stop the interval to prevent further errors
                                this.stopContinuousCasting(index);
                            }
                        }
                    }, 100); // Check more frequently than the cast interval for better responsiveness
                    
                    // Add active state
                    button.classList.add('skill-activated');
                }
            });
            
            // Stop continuous casting on touch end
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if any of the ended touches match this button's touch
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (button.dataset.touchId === touch.identifier.toString()) {
                        this.stopContinuousCasting(index);
                        button.classList.remove('skill-activated');
                        delete button.dataset.touchId;
                        break;
                    }
                }
            });
            
            // Also stop on touch cancel
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if any of the cancelled touches match this button's touch
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (button.dataset.touchId === touch.identifier.toString()) {
                        this.stopContinuousCasting(index);
                        button.classList.remove('skill-activated');
                        delete button.dataset.touchId;
                        break;
                    }
                }
            });
            
            // Add tooltip with description on hover
            button.title = `${skill.name}: ${skill.description}`;
        });
        
        return true;
    }
    
    /**
     * Get the skill overlay for the right half of the screen
     * This ensures skill buttons have priority over other touch events in their area
     */
    createSkillOverlay() {
        // Get the existing overlay element from the DOM
        this.skillsOverlay = document.getElementById('skills-overlay');
        
        // If for some reason the element doesn't exist in the HTML, log a warning
        if (!this.skillsOverlay) {
            console.warn('Skills overlay element not found in HTML. Touch handling may be affected.');
        }
    }
    
    /**
     * Stop continuous casting for a specific skill
     * @param {number} skillIndex - Index of the skill to stop casting
     */
    stopContinuousCasting(skillIndex) {
        if (this.skillCastIntervals[skillIndex]) {
            clearInterval(this.skillCastIntervals[skillIndex]);
            this.skillCastIntervals[skillIndex] = null;
            this.skillCastCooldowns[skillIndex] = 0;
        }
    }
    
    /**
     * Stop all continuous casting
     */
    stopAllContinuousCasting() {
        Object.keys(this.skillCastIntervals).forEach(index => {
            if (this.skillCastIntervals[index]) {
                clearInterval(this.skillCastIntervals[index]);
                this.skillCastIntervals[index] = null;
                this.skillCastCooldowns[index] = 0;
            }
        });
    }
    
    /**
     * Update the skills UI
     */
    update() {
        // Update skill cooldowns
        const skills = this.game.player.getSkills();
        
        skills.forEach((skill, index) => {
            const skillButton = this.skillButtons[index];
            if (!skillButton) return; // Skip if button doesn't exist
            
            const cooldownOverlay = skillButton.querySelector('.skill-cooldown');
            const cooldownPercent = skill.getCooldownPercent() * 100;
            
            // Update cooldown overlay
            cooldownOverlay.style.height = `${cooldownPercent}%`;
            
            // Add visual feedback based on cooldown state
            if (cooldownPercent > 0) {
                // Skill is on cooldown
                skillButton.style.opacity = '0.7';
                
                // Show cooldown time if significant
                if (cooldownPercent > 5) {
                    const skillIcon = skillButton.querySelector('.skill-icon');
                    if (skillIcon) {
                        // If cooldown is active, show the remaining time
                        const remainingTime = (skill.cooldown * (cooldownPercent / 100)).toFixed(1);
                        if (remainingTime > 0.1) {
                            skillIcon.setAttribute('data-cooldown', remainingTime);
                            skillIcon.classList.add('showing-cooldown');
                        } else {
                            skillIcon.removeAttribute('data-cooldown');
                            skillIcon.classList.remove('showing-cooldown');
                        }
                    }
                }
            } else {
                // Skill is ready
                skillButton.style.opacity = '1';
                
                const skillIcon = skillButton.querySelector('.skill-icon');
                if (skillIcon) {
                    skillIcon.removeAttribute('data-cooldown');
                    skillIcon.classList.remove('showing-cooldown');
                }
                
                // Add subtle pulsing effect to ready skills
                if (!skillButton.classList.contains('ready-pulse')) {
                    skillButton.classList.add('ready-pulse');
                }
            }
            
            // Check if player has enough mana for this skill
            const hasEnoughMana = this.game.player.getMana() >= skill.manaCost;
            
            if (!hasEnoughMana) {
                skillButton.classList.add('not-enough-mana');
            } else {
                skillButton.classList.remove('not-enough-mana');
            }
        });
    }
    
    /**
     * Clean up resources when component is destroyed
     */
    destroy() {
        // Stop all continuous casting
        this.stopAllContinuousCasting();
        
        // We don't remove the skills overlay from DOM since it's defined in HTML
        // Just clear the reference
        this.skillsOverlay = null;
        
        // Call parent destroy method if it exists
        if (super.destroy) {
            super.destroy();
        }
    }
}