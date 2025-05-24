import { UIComponent } from "../UIComponent.js";
import { SKILLS } from "../config/skills.js";
import { getSkillIcon, getBuffIcon } from "../config/skill-icons.js";
import { SKILL_TREES } from "../config/skill-tree.js";
import { applyBuffsToVariants } from "../utils/SkillTreeUtils.js";
import { STORAGE_KEYS } from "../config/storage-keys.js";

/**
 * Skill Tree UI component
 * Displays the monk skill tree and allows skill customization with variants and buffs
 * Based on the SKILL_TREES data structure
 * Uses DOM elements defined in index.html
 */
export class SkillTreeUI extends UIComponent {
  /**
   * Create a new SkillTreeUI component
   * @param {Object} game - Reference to the game instance
   */
  constructor(game) {
    super("skill-tree", game);
    this.isSkillTreeOpen = false;
    this.selectedSkill = null;
    this.selectedVariant = null;
    this.selectedBuff = null;
    this.skillPoints = 10_000_000; // Will be loaded from player data

    // Custom skills flag
    this.customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';

    // Get the skill trees and apply buffs to variants
    this.skillTrees = JSON.parse(JSON.stringify(SKILL_TREES)); // Create a deep copy
    applyBuffsToVariants(this.skillTrees);

    // Initialize player skills data structure
    this.playerSkills = {};
    
    // DOM elements
    this.elements = {
      skillPointsValue: null,
      skillTreeSkills: null,
      skillDetailName: null,
      skillDetailDescription: null,
      skillVariants: null,
      skillBuffs: null,
      saveButton: null
    };
  }
  
  /**
   * Filter skills based on the custom skills flag
   * @param {Object} skills - Object containing skill configurations
   * @returns {Object} - Filtered object of skill configurations
   */
  filterCustomSkills(skills) {
    if (this.customSkillsEnabled) {
      // Include all skills
      return skills;
    } else {
      // Filter out custom skills
      const filteredSkills = {};
      Object.entries(skills).forEach(([skillName, skillData]) => {
        // Check if the skill is in SKILLS array and has isCustomSkill property
        const skillConfig = SKILLS.find(skill => skill.name === skillName);
        if (!skillConfig || !skillConfig.isCustomSkill) {
          filteredSkills[skillName] = skillData;
        }
      });
      return filteredSkills;
    }
  }
  
  /**
   * Refresh the skill tree when custom skills setting changes
   */
  refreshSkillTree() {
    // Update the flag
    this.customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';
    console.debug(`Custom skills ${this.customSkillsEnabled ? 'enabled' : 'disabled'} in SkillTreeUI`);
    
    // Re-render the skill tree
    this.renderSkillTree();
  }

  /**
   * Initialize the component
   * @returns {boolean} - True if initialization was successful
   */
  async init() {
    // Check if the container exists in the DOM
    if (!this.container) {
      console.error(`Container element with ID "skill-tree" not found. Creating it dynamically.`);
      this.container = document.createElement('div');
      this.container.id = 'skill-tree';
      
      // Add to UI container
      document.body.appendChild(this.container);
    }

    // Initialize DOM element references
    this.initDOMElements();

    // Hide initially
    this.hide();
    
    // Make sure the container has pointer-events set to auto when visible
    this.container.style.pointerEvents = 'auto';

    // Initialize player skills data structure
    this.initPlayerSkills();

    // Render the skill tree
    this.renderSkillTree();
    
    // Add event listener for save button
    if (this.elements.saveButton) {
      this.elements.saveButton.addEventListener('click', () => {
        this.saveSkillTree();
      });
    } else {
      console.error("Save button element not found in the DOM");
    }
    
    // Initialize available points display
    this.updateAvailablePoints();

    return true;
  }
  
  /**
   * Initialize DOM element references
   * Stores references to DOM elements defined in index.html
   */
  initDOMElements() {
    // Get references to DOM elements
    this.elements.skillPointsValue = document.getElementById('skill-points-value');
    this.elements.skillTreeSkills = document.getElementById('skill-tree-skills');
    this.elements.skillDetailName = document.getElementById('skill-detail-name');
    this.elements.skillDetailDescription = document.getElementById('skill-detail-description');
    this.elements.skillVariants = document.getElementById('skill-variants');
    this.elements.skillBuffs = document.getElementById('skill-buffs');
    this.elements.saveButton = document.getElementById('skill-tree-save-btn');
    
    // Update skill points display
    if (this.elements.skillPointsValue) {
      this.elements.skillPointsValue.textContent = this.skillPoints;
    } else {
      console.error("Skill points value element not found in the DOM");
    }
    
    // Log any missing elements
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.error(`DOM element "${key}" not found in the skill tree UI`);
      }
    });
  }

  /**
   * Initialize player skills data structure
   */
  initPlayerSkills() {
    // Create a structure to track player's skill allocations
    this.playerSkills = {};

    // Filter skill trees based on custom skills flag
    const filteredSkillTrees = this.filterCustomSkills(this.skillTrees);

    // Initialize for each skill in the filtered skill trees
    if (filteredSkillTrees) {
      Object.keys(filteredSkillTrees).forEach((skillName) => {
        this.playerSkills[skillName] = {
          activeVariant: null,
          buffs: {},
          points: 0,
        };
      });
    }

    // Also initialize for skills from SKILLS array that might not be in skillTrees
    // Filter out custom skills if disabled
    const filteredSkills = this.customSkillsEnabled 
      ? SKILLS 
      : SKILLS.filter(skill => !skill.isCustomSkill);
      
    filteredSkills.forEach((skill) => {
      if (!this.playerSkills[skill.name]) {
        this.playerSkills[skill.name] = {
          activeVariant: null,
          buffs: {},
          points: 0,
        };
      }
    });
  }

  /**
   * Render the skill tree
   */
  renderSkillTree() {
    // Check if the skill tree container exists
    if (!this.elements.skillTreeSkills) {
      console.error("Skill tree skills container not found in the DOM");
      return;
    }

    // Clear the container
    this.elements.skillTreeSkills.innerHTML = "";

    // Create the skill tree structure
    const skillsHtml = [];

    // Filter skills based on custom skills flag
    const filteredSkillTrees = this.filterCustomSkills(this.skillTrees);

    // Add skills from the filtered skill tree
    Object.keys(filteredSkillTrees).forEach((skillName) => {
      const skill = filteredSkillTrees[skillName];
      const iconData = getSkillIcon(skillName);

      // Create the skill node
      const skillNode = `
<div class="skill-node" data-skill="${skillName}">
<div class="skill-icon ${iconData.cssClass}" style="background-color: rgba(0, 0, 0, 0.7); border: 2px solid ${iconData.color}; box-shadow: 0 0 10px ${iconData.color}40;">
${iconData.emoji}
</div>
<div class="skill-info">
  <div class="skill-name">${skillName}</div>
  <div class="skill-description">${this.truncateDescription(skill.baseDescription) || "No description available."}</div>
</div>
</div>
`;

      skillsHtml.push(skillNode);
    });

    // Add the skills to the container
    this.elements.skillTreeSkills.innerHTML = skillsHtml.join("");

    // Add click event to skill nodes
    document.querySelectorAll(".skill-node").forEach((node) => {
      node.addEventListener("click", () => {
        const skillName = node.dataset.skill;
        this.selectSkill(skillName);
      });
    });
  }

  /**
   * Select a skill and show its details
   * @param {string} skillName - Name of the skill to select
   */
  selectSkill(skillName) {
    // Update selected skill
    this.selectedSkill = skillName;

    // Update UI to show the selected skill
    document.querySelectorAll(".skill-node").forEach((node) => {
      node.classList.toggle("selected", node.dataset.skill === skillName);
    });

    // Update skill details
    this.updateSkillDetails(skillName);

    // Show variants for the selected skill
    this.showSkillVariants(skillName);

    // Clear buffs container initially
    if (this.elements.skillBuffs) {
      this.elements.skillBuffs.innerHTML = "";
    } else {
      console.error("Skill buffs container not found in the DOM");
    }
  }

  /**
   * Update the skill details section
   * @param {string} skillName - Name of the skill
   */
  updateSkillDetails(skillName) {
    // Check if the DOM elements exist
    if (!this.elements.skillDetailName || !this.elements.skillDetailDescription) {
      console.error("Skill detail elements not found in the DOM");
      return;
    }

    // Check if we have data for this skill
    if (!this.skillTrees || !this.skillTrees[skillName]) {
      this.elements.skillDetailName.textContent = "Unknown Skill";
      this.elements.skillDetailDescription.textContent =
        "No information available for this skill.";
      return;
    }

    const skillData = this.skillTrees[skillName];

    // Update skill name
    this.elements.skillDetailName.textContent = skillName;

    // Update skill description
    this.elements.skillDetailDescription.textContent =
      skillData.baseDescription || "No description available.";
  }

  /**
   * Show variants for a skill
   * @param {string} skillName - Name of the skill
   */
  showSkillVariants(skillName) {
    // Check if the variants container exists
    if (!this.elements.skillVariants) {
      console.error("Skill variants container not found in the DOM");
      return;
    }

    // Clear container
    this.elements.skillVariants.innerHTML = "";

    // Check if we have data for this skill
    if (
      !this.skillTrees ||
      !this.skillTrees[skillName] ||
      !this.skillTrees[skillName].variants
    ) {
      this.elements.skillVariants.innerHTML =
        '<div class="no-variants">No variants available for this skill.</div>';
      return;
    }

    const skillData = this.skillTrees[skillName];
    const playerSkillData = this.playerSkills[skillName];
    const variants = skillData.variants;
    
    // Add base skill info at the top
    const hasActiveVariant = playerSkillData && playerSkillData.activeVariant !== null;
    
    // Create HTML for variants
    const variantsHtml = [];

    // For each variant
    Object.entries(variants).forEach(([variantName, variantData]) => {
      // Determine if this variant is active
      const isActive =
        playerSkillData && playerSkillData.activeVariant === variantName;

      // Get variant cost and requirements
      const cost = variantData.cost || 5;
      const requiredPoints = variantData.requiredPoints || 0;

      // Get icon for the variant
      const iconData = getSkillIcon(variantName);

      // Create the variant element
      const variantHtml = `
        <div class="skill-variant ${isActive ? "active" : ""}" data-variant="${variantName}">
          <div class="variant-header">
            <div class="variant-icon ${iconData.cssClass}" style="background-color: rgba(0, 0, 0, 0.7); border: 2px solid ${iconData.color}; box-shadow: 0 0 10px ${iconData.color}40;">
              ${iconData.emoji}
            </div>
            <div class="variant-name">${variantName}</div>
            <div class="variant-cost">${cost} points</div>
          </div>
          <div class="variant-description">${variantData.description || "No description available."}</div>
          <div class="variant-effects">
            ${
              variantData.effects
                ? variantData.effects
                    .map((effect) => `<span class="effect-tag">${effect}</span>`)
                    .join("")
                : ""
            }
          </div>
          <button class="variant-select-btn" data-variant="${variantName}" ${isActive ? "disabled" : ""}>
            ${isActive ? "Selected" : "Select Variant"}
          </button>
        </div>
      `;

      variantsHtml.push(variantHtml);
    });

    // Add the variants to the container
    this.elements.skillVariants.innerHTML = variantsHtml.join("");

    // Add click event to variant select buttons
    document.querySelectorAll(".variant-select-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const variantName = button.dataset.variant;
        this.selectVariant(skillName, variantName);
      });
    });
    
    // Add "Use Base Skill" button event listener
    const useBaseSkillBtn = document.getElementById("use-base-skill-btn");
    if (useBaseSkillBtn) {
      useBaseSkillBtn.addEventListener("click", () => {
        this.unselectAllVariants(skillName);
      });
    }
    
    // Add click event to variant containers for toggling selection
    document.querySelectorAll(".skill-variant").forEach((variant) => {
      variant.addEventListener("click", (event) => {
        // Don't trigger if clicking on the button (button has its own handler)
        if (event.target.tagName !== 'BUTTON' && !event.target.closest('button')) {
          const variantName = variant.dataset.variant;
          this.selectVariant(skillName, variantName);
        }
      });
    });
  }

  /**
   * Unselect all variants for a skill and revert to base skill
   * @param {string} skillName - Name of the skill
   */
  unselectAllVariants(skillName) {
    // Clear all active variants in UI
    document.querySelectorAll(".skill-variant").forEach((variant) => {
      variant.classList.remove("active");
    });

    // Reset all variant buttons
    document.querySelectorAll(".variant-select-btn").forEach((button) => {
      button.disabled = false;
      button.textContent = "Select Variant";
    });

    // Update the base skill status text
    const baseSkillStatus = document.querySelector(".base-skill-status");
    if (baseSkillStatus) {
      baseSkillStatus.textContent = "Currently Using Base Skill";
    }

    // Unselect the variant in data
    if (this.playerSkills[skillName]) {
      this.playerSkills[skillName].activeVariant = null;
      // Clear any selected buffs for this skill
      this.playerSkills[skillName].buffs = {};
    }
    
    // Clear the buffs display
    if (this.elements.skillBuffs) {
      this.elements.skillBuffs.innerHTML = "";
    } else {
      console.error("Skill buffs container not found in the DOM");
    }
    
    // Update available points display
    this.updateAvailablePoints();
  }

  /**
   * Select or unselect a variant for a skill
   * @param {string} skillName - Name of the skill
   * @param {string} variantName - Name of the variant
   */
  selectVariant(skillName, variantName) {
    // Check if this variant is already active (for toggling)
    const isAlreadyActive = 
      this.playerSkills[skillName] && 
      this.playerSkills[skillName].activeVariant === variantName;

    // Clear all active variants first
    document.querySelectorAll(".skill-variant").forEach((variant) => {
      variant.classList.remove("active");
    });

    // Reset all variant buttons
    document.querySelectorAll(".variant-select-btn").forEach((button) => {
      button.disabled = false;
      button.textContent = "Select Variant";
    });

    // Clear buffs container if unselecting
    if (isAlreadyActive) {
      // Unselect the variant
      if (this.playerSkills[skillName]) {
        this.playerSkills[skillName].activeVariant = null;
        // Clear any selected buffs for this skill
        this.playerSkills[skillName].buffs = {};
      }
      
      // Clear the buffs display
      document.getElementById("skill-buffs").innerHTML = "";
      
      // Update available points display
      this.updateAvailablePoints();
      return;
    }

    // Otherwise, select the new variant
    if (this.playerSkills[skillName]) {
      // If there was a previous variant selected, clear its buffs
      if (this.playerSkills[skillName].activeVariant && this.playerSkills[skillName].activeVariant !== variantName) {
        this.playerSkills[skillName].buffs = {};
      }
      
      this.playerSkills[skillName].activeVariant = variantName;
    }

    // Update UI for the selected variant
    const selectedVariant = document.querySelector(
      `.skill-variant[data-variant="${variantName}"]`
    );
    if (selectedVariant) {
      selectedVariant.classList.add("active");
    }

    // Update button for the selected variant
    const button = document.querySelector(
      `.variant-select-btn[data-variant="${variantName}"]`
    );
    if (button) {
      button.disabled = true;
      button.textContent = "Selected";
    }
    
    // Update the base skill status text
    const baseSkillStatus = document.querySelector(".base-skill-status");
    if (baseSkillStatus) {
      baseSkillStatus.textContent = "Select a variant below or click on selected variant to unselect it";
    }

    // Show buffs for the selected variant
    this.showVariantBuffs(skillName, variantName);
    
    // Update available points display
    this.updateAvailablePoints();
  }

  /**
   * Show buffs for a variant
   * @param {string} skillName - Name of the skill
   * @param {string} variantName - Name of the variant
   */
  showVariantBuffs(skillName, variantName) {
    // Check if the buffs container exists
    if (!this.elements.skillBuffs) {
      console.error("Skill buffs container not found in the DOM");
      return;
    }

    // Clear container
    this.elements.skillBuffs.innerHTML = "";

    // Check if we have data for this skill and variant
    if (
      !this.skillTrees ||
      !this.skillTrees[skillName] ||
      !this.skillTrees[skillName].variants ||
      !this.skillTrees[skillName].variants[variantName] ||
      !this.skillTrees[skillName].variants[variantName].buffs
    ) {
      this.elements.skillBuffs.innerHTML =
        '<div class="no-buffs">No buffs available for this variant.</div>';
      return;
    }

    const variantData = this.skillTrees[skillName].variants[variantName];
    const playerSkillData = this.playerSkills[skillName];
    const buffs = variantData.buffs;

    // Create HTML for buffs
    const buffsHtml = [];

    // For each buff
    Object.entries(buffs).forEach(([buffName, buffData]) => {
      // Determine if this buff is active
      const isActive =
        playerSkillData &&
        playerSkillData.buffs &&
        playerSkillData.buffs[buffName];

      // Get buff cost
      const cost = buffData.cost || 5;

      // Get icon for the buff
      const iconData = getBuffIcon(
        buffData.effects && buffData.effects.length > 0
          ? buffData.effects[0]
          : ""
      );

      // Create the buff element
      const buffHtml = `
        <div class="skill-buff ${isActive ? "active" : ""}" data-buff="${buffName}">
          <div class="buff-header">
            <div class="buff-icon ${iconData.cssClass}" 
                style="background-color: rgba(0, 0, 0, 0.7); 
                        border: 2px solid ${iconData.color}; 
                        box-shadow: 0 0 10px ${iconData.color}40;">
              ${iconData.emoji}
            </div>
            <div class="buff-name">${buffName}</div>
            <div class="buff-cost">${cost} points</div>
          </div>
          <div class="buff-description">
            ${buffData.description || "No description available."}
          </div>
          <div class="buff-effects">
            ${buffData.effects
              ? buffData.effects
                  .map((effect) => `<span class="effect-tag">${effect}</span>`)
                  .join("")
              : ""
            }
          </div>
          <button class="buff-select-btn" 
                  data-buff="${buffName}" 
                  ${isActive ? "disabled" : ""}>
            ${isActive ? "Selected" : "Select Buff"}
          </button>
        </div>
      `;

      buffsHtml.push(buffHtml);
    });

    // Add the buffs to the container
    this.elements.skillBuffs.innerHTML = buffsHtml.join("");

    // Add click event to buff select buttons
    document.querySelectorAll(".buff-select-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const buffName = button.dataset.buff;
        this.selectBuff(skillName, buffName);
      });
    });
    
    // Add click event to buff containers for toggling selection
    document.querySelectorAll(".skill-buff").forEach((buff) => {
      buff.addEventListener("click", (event) => {
        // Don't trigger if clicking on the button (button has its own handler)
        if (event.target.tagName !== 'BUTTON' && !event.target.closest('button')) {
          const buffName = buff.dataset.buff;
          this.selectBuff(skillName, buffName);
        }
      });
    });
  }

  /**
   * Select a buff for a skill
   * @param {string} skillName - Name of the skill
   * @param {string} buffName - Name of the buff
   */
  selectBuff(skillName, buffName) {
    // Update player skills data
    if (this.playerSkills[skillName]) {
      if (!this.playerSkills[skillName].buffs) {
        this.playerSkills[skillName].buffs = {};
      }
      
      // Toggle buff selection
      const isAlreadyActive = this.playerSkills[skillName].buffs[buffName];
      
      if (isAlreadyActive) {
        // Unselect the buff
        delete this.playerSkills[skillName].buffs[buffName];
        
        // Update UI
        const selectedBuff = document.querySelector(
          `.skill-buff[data-buff="${buffName}"]`
        );
        if (selectedBuff) {
          selectedBuff.classList.remove("active");
        }
        
        // Update button
        const button = document.querySelector(
          `.buff-select-btn[data-buff="${buffName}"]`
        );
        if (button) {
          button.disabled = false;
          button.textContent = "Select Buff";
        }
      } else {
        // Select the buff
        this.playerSkills[skillName].buffs[buffName] = true;
        
        // Update UI
        const selectedBuff = document.querySelector(
          `.skill-buff[data-buff="${buffName}"]`
        );
        if (selectedBuff) {
          selectedBuff.classList.add("active");
        }
        
        // Update button
        const button = document.querySelector(
          `.buff-select-btn[data-buff="${buffName}"]`
        );
        if (button) {
          button.disabled = true;
          button.textContent = "Selected";
        }
      }
      
      // Update available points display
      this.updateAvailablePoints();
    }
  }

  /**
   * Truncate a description to a maximum length and add ellipsis
   * @param {string} description - The description to truncate
   * @param {number} maxLength - Maximum length before truncation (default: 60)
   * @returns {string} - Truncated description with ellipsis if needed
   */
  truncateDescription(description, maxLength = 60) {
    if (!description) return "";
    
    if (description.length <= maxLength) {
      return description;
    }
    
    return description.substring(0, maxLength) + "...";
  }
  
  /**
   * Save the skill tree configuration
   * This method will save the player's skill selections and close the skill tree
   */
  saveSkillTree() {
    // Calculate total points spent
    let totalPointsSpent = 0;
    
    // Count points spent on variants and buffs
    Object.values(this.playerSkills).forEach(skill => {
      if (skill.activeVariant) {
        // Get the variant cost
        const variantCost = this.getVariantCost(skill.activeVariant);
        totalPointsSpent += variantCost;
        
        // Add costs of selected buffs
        if (skill.buffs) {
          Object.keys(skill.buffs).forEach(buffName => {
            if (skill.buffs[buffName]) {
              const buffCost = this.getBuffCost(skill.activeVariant, buffName);
              totalPointsSpent += buffCost;
            }
          });
        }
      }
    });
    
    // Check if player has enough points
    const remainingPoints = this.skillPoints - totalPointsSpent;
    if (remainingPoints < 0) {
      // Show error message - not enough points
      this.game && this.game.hudManager.showNotification("You don't have enough skill points! Please remove some skills or buffs.");
      return;
    }
    
    // Save the configuration to localStorage
    console.debug("Saving skill tree configuration:", this.playerSkills);
    
    try {
      localStorage.setItem(STORAGE_KEYS.SKILL_TREE_DATA, JSON.stringify(this.playerSkills));
      console.debug('Skill tree data saved to localStorage successfully');
    } catch (error) {
      console.error('Error saving skill tree data to localStorage:', error);
      // Show error notification
      if (this.game && this.game.hudManager) {
        this.game.hudManager.showNotification('Failed to save skill tree data. Please try again.');
        return;
      }
    }
    
    // Update the game with the new skills
    if (this.game && this.game.player) {
      // Reload the player skills to apply the new variants
      this.game.player.loadSkillTreeData();
      console.debug("Player skills updated with new variants");
    }
    
    // Show success message
    this.game && this.game.hudManager.showNotification("Skill tree saved successfully!");
    
    // Close the skill tree
    this.game.hudManager.toggleSkillTree();
  }
  
  /**
   * Get the cost of a variant
   * @param {string} variantName - Name of the variant
   * @returns {number} - Cost of the variant
   */
  getVariantCost(variantName) {
    // Search for the variant in all skills
    for (const skillName in this.skillTrees) {
      const skill = this.skillTrees[skillName];
      if (skill.variants && skill.variants[variantName]) {
        return skill.variants[variantName].cost || 5; // Default cost is 5
      }
    }
    return 5; // Default cost if not found
  }
  
  /**
   * Get the cost of a buff
   * @param {string} variantName - Name of the variant
   * @param {string} buffName - Name of the buff
   * @returns {number} - Cost of the buff
   */
  getBuffCost(variantName, buffName) {
    // Search for the buff in all skills
    for (const skillName in this.skillTrees) {
      const skill = this.skillTrees[skillName];
      if (skill.variants && 
          skill.variants[variantName] && 
          skill.variants[variantName].buffs && 
          skill.variants[variantName].buffs[buffName]) {
        return skill.variants[variantName].buffs[buffName].cost || 3; // Default cost is 3
      }
    }
    return 3; // Default cost if not found
  }
  
  /**
   * Update the available points display
   * Calculates points spent and updates the UI
   */
  updateAvailablePoints() {
    // Check if the points element exists
    if (!this.elements.skillPointsValue) {
      console.error("Skill points value element not found in the DOM");
      return;
    }
    
    // Calculate total points spent
    let totalPointsSpent = 0;
    
    // Count points spent on variants and buffs
    Object.values(this.playerSkills).forEach(skill => {
      if (skill.activeVariant) {
        // Get the variant cost
        const variantCost = this.getVariantCost(skill.activeVariant);
        totalPointsSpent += variantCost;
        
        // Add costs of selected buffs
        if (skill.buffs) {
          Object.keys(skill.buffs).forEach(buffName => {
            if (skill.buffs[buffName]) {
              const buffCost = this.getBuffCost(skill.activeVariant, buffName);
              totalPointsSpent += buffCost;
            }
          });
        }
      }
    });
    
    // Calculate remaining points
    const remainingPoints = this.skillPoints - totalPointsSpent;
    
    // Update the UI
    this.elements.skillPointsValue.textContent = remainingPoints;
    
    // Add visual indicator if points are low or negative
    if (remainingPoints < 0) {
      this.elements.skillPointsValue.style.color = "#ff3333"; // Red for negative
    } else if (remainingPoints < 5) {
      this.elements.skillPointsValue.style.color = "#ffaa33"; // Orange for low
    } else {
      this.elements.skillPointsValue.style.color = "#ffcc00"; // Default yellow
    }
  }
}
