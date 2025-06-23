/**
 * Handles serialization and deserialization of quest data
 */
export class QuestSerializer {
    /**
     * Serialize quest data for saving
     * @param {Object} questManager - The quest manager object
     * @returns {Object} Serialized quest data
     */
    static serialize(questManager) {
        if (!questManager) {
            console.warn('Quest manager is null or undefined');
            return {};
        }
        
        // For active quests, we need to save progress information
        const activeQuestsData = questManager.activeQuests.map(quest => ({
            id: quest.id,
            objective: {
                progress: quest.objective.progress,
                discovered: quest.objective.discovered || []
            }
        }));
        
        // For completed quests, only save the IDs
        const completedQuestIds = questManager.completedQuests.map(quest => quest.id);
        
        return {
            activeQuests: activeQuestsData,
            completedQuestIds: completedQuestIds
        };
    }
    
    /**
     * Deserialize quest data from save
     * @param {Object} questManager - The quest manager to update
     * @param {Object} questData - The saved quest data
     */
    static deserialize(questManager, questData) {
        if (!questManager || !questData) {
            console.error('Quest manager or quest data is null or undefined');
            return;
        }
        
        console.debug('Loading quest data:', Object.keys(questData));
        
        // Reset quest state
        questManager.activeQuests = [];
        questManager.completedQuests = [];
        
        // Load active quests with their progress
        if (questData.activeQuests && Array.isArray(questData.activeQuests)) {
            console.debug(`Loading ${questData.activeQuests.length} active quests`);
            
            questData.activeQuests.forEach(savedQuest => {
                try {
                    // Find the original quest template
                    const originalQuest = questManager.quests.find(q => q.id === savedQuest.id);
                    
                    if (originalQuest) {
                        // Create a new quest object with progress from saved data
                        const questWithProgress = {
                            ...originalQuest,
                            objective: {
                                ...originalQuest.objective,
                                progress: savedQuest.objective && savedQuest.objective.progress ? 
                                    savedQuest.objective.progress : 0,
                                discovered: savedQuest.objective && savedQuest.objective.discovered ? 
                                    savedQuest.objective.discovered : []
                            }
                        };
                        
                        questManager.activeQuests.push(questWithProgress);
                        
                        // Remove from available quests
                        questManager.quests = questManager.quests.filter(q => q.id !== savedQuest.id);
                    } else {
                        console.warn(`Original quest template not found for ID: ${savedQuest.id}`);
                    }
                } catch (questError) {
                    console.error('Error processing quest:', questError, savedQuest);
                }
            });
        }
        
        // Load completed quests (using only IDs)
        if (questData.completedQuestIds && Array.isArray(questData.completedQuestIds)) {
            console.debug(`Loading ${questData.completedQuestIds.length} completed quest IDs`);
            
            questData.completedQuestIds.forEach(questId => {
                // Find the original quest template
                const originalQuest = questManager.quests.find(q => q.id === questId);
                
                if (originalQuest) {
                    // Add to completed quests
                    questManager.completedQuests.push(originalQuest);
                    
                    // Remove from available quests
                    questManager.quests = questManager.quests.filter(q => q.id !== questId);
                } else {
                    console.warn(`Original quest template not found for completed quest ID: ${questId}`);
                    // Add a minimal quest object with just the ID to maintain completion status
                    questManager.completedQuests.push({ id: questId });
                }
            });
        } else if (questData.completedQuests && Array.isArray(questData.completedQuests)) {
            // Backward compatibility with old save format
            console.debug(`Loading ${questData.completedQuests.length} completed quests (legacy format)`);
            
            questData.completedQuests.forEach(quest => {
                // Find the original quest template
                const originalQuest = questManager.quests.find(q => q.id === quest.id);
                
                if (originalQuest) {
                    questManager.completedQuests.push(originalQuest);
                    questManager.quests = questManager.quests.filter(q => q.id !== quest.id);
                } else {
                    questManager.completedQuests.push(quest);
                }
            });
        }
        
        // Filter available quests to remove active and completed ones
        if (questManager.quests && Array.isArray(questManager.quests)) {
            console.debug('Filtering available quests');
            questManager.quests = questManager.quests.filter(quest => {
                const isActive = questManager.activeQuests.some(q => q.id === quest.id);
                const isCompleted = questManager.completedQuests.some(q => q.id === quest.id);
                return !isActive && !isCompleted;
            });
        }
        
        console.debug('Quest data loaded successfully');
    }
}