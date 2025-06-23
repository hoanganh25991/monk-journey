import { UIComponent } from '../UIComponent.js';

/**
 * Quest Log UI component
 * Displays active quests and objectives
 */
export class QuestLogUI extends UIComponent {
    /**
     * Create a new QuestLogUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('quest-log', game);
        this.questList = null;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Store references to elements we need to update
        this.questList = document.getElementById('quest-list');
        
        return true;
    }
    
    /**
     * Update the quest log with active quests
     * @param {Array} activeQuests - Array of active quests
     */
    updateQuestLog(activeQuests) {
        // Clear quest list
        this.questList.innerHTML = '';
        
        if (activeQuests.length === 0) {
            // No active quests
            const noQuests = document.createElement('div');
            noQuests.className = 'no-quests';
            noQuests.textContent = 'No active quests';
            this.questList.appendChild(noQuests);
        } else {
            // Add active quests
            activeQuests.forEach(quest => {
                // Create quest item HTML
                const questHTML = `
                    <div class="quest-item">
                        <div class="quest-name ${quest.isMainQuest ? 'main-quest' : ''}">${quest.name}</div>
                        <div class="quest-objective">${this.formatObjective(quest.objective)}</div>
                    </div>
                `;
                
                // Add to quest list
                this.questList.innerHTML += questHTML;
            });
        }
    }
    
    /**
     * Format quest objective based on type
     * @param {Object} objective - Quest objective
     * @returns {string} - Formatted objective text
     */
    formatObjective(objective) {
        switch (objective.type) {
            case 'kill':
                return `Kill ${objective.progress}/${objective.count} enemies`;
            case 'interact':
                return `Find ${objective.progress}/${objective.count} ${objective.target}s`;
            case 'explore':
                return `Discover ${objective.progress}/${objective.count} zones`;
            default:
                return objective.description || 'Complete the objective';
        }
    }
}