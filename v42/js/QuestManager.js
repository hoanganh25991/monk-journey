export class QuestManager {
    constructor(game) {
        this.game = game;
        this.quests = [];
        this.activeQuests = [];
        this.completedQuests = [];
        
        // Initialize with some default quests
        this.initializeQuests();
    }
    
    initializeQuests() {
        // Main storyline quests
        const mainQuests = [
            {
                id: 'main_quest_1',
                name: 'The Beginning of the Journey',
                description: 'Defeat the enemies in the forest to prove your worth.',
                objective: {
                    type: 'kill',
                    target: 'any',
                    count: 5,
                    progress: 0
                },
                reward: {
                    experience: 100,
                    gold: 50,
                    items: [
                        { name: 'Health Potion', amount: 2 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 1,
                nextQuestId: 'main_quest_2'
            },
            {
                id: 'main_quest_2',
                name: 'The Skeleton Threat',
                description: 'Skeletons have been spotted in the ruins. Defeat them to secure the area.',
                objective: {
                    type: 'kill',
                    target: 'skeleton',
                    count: 8,
                    progress: 0
                },
                reward: {
                    experience: 200,
                    gold: 100,
                    items: [
                        { name: 'Monk Bracers', type: 'accessory', damage: 0, damageReduction: 0.05, amount: 1 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 2,
                nextQuestId: 'main_quest_3'
            },
            {
                id: 'main_quest_3',
                name: 'The Skeleton King',
                description: 'The Skeleton King has risen in the ancient ruins. Defeat him to restore peace.',
                objective: {
                    type: 'kill',
                    target: 'skeleton_king',
                    count: 1,
                    progress: 0
                },
                reward: {
                    experience: 500,
                    gold: 250,
                    items: [
                        { name: 'Monk Staff', type: 'weapon', damage: 15, damageReduction: 0, amount: 1 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 4,
                nextQuestId: 'main_quest_4'
            },
            {
                id: 'main_quest_4',
                name: 'The Swamp of Despair',
                description: 'Zombies have infested the swamp. Clear them out to make the area safe again.',
                objective: {
                    type: 'kill',
                    target: 'zombie',
                    count: 12,
                    progress: 0
                },
                reward: {
                    experience: 800,
                    gold: 350,
                    items: [
                        { name: 'Monk Robe', type: 'armor', damage: 0, damageReduction: 0.1, amount: 1 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 6,
                nextQuestId: 'main_quest_5'
            },
            {
                id: 'main_quest_5',
                name: 'The Demon Invasion',
                description: 'Demons have begun invading from the mountains. Defeat them to protect the realm.',
                objective: {
                    type: 'kill',
                    target: 'demon',
                    count: 15,
                    progress: 0
                },
                reward: {
                    experience: 1200,
                    gold: 500,
                    items: [
                        { name: 'Monk Sandals', type: 'boots', damage: 0, damageReduction: 0.05, amount: 1 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 8,
                nextQuestId: 'main_quest_6'
            },
            {
                id: 'main_quest_6',
                name: 'The Final Battle',
                description: 'The Demon Lord has appeared. Defeat him to save the world from destruction.',
                objective: {
                    type: 'kill',
                    target: 'demon_lord',
                    count: 1,
                    progress: 0
                },
                reward: {
                    experience: 2000,
                    gold: 1000,
                    items: [
                        { name: 'Legendary Monk Helmet', type: 'helmet', damage: 5, damageReduction: 0.15, amount: 1 }
                    ]
                },
                isMainQuest: true,
                requiredLevel: 10,
                nextQuestId: null
            }
        ];
        
        // Side quests
        const sideQuests = [
            {
                id: 'side_quest_1',
                name: 'Treasure Hunter',
                description: 'Find and open treasure chests scattered around the world.',
                objective: {
                    type: 'interact',
                    target: 'chest',
                    count: 3,
                    progress: 0
                },
                reward: {
                    experience: 50,
                    gold: 100
                },
                isMainQuest: false,
                requiredLevel: 1
            },
            {
                id: 'side_quest_2',
                name: 'Explorer',
                description: 'Discover all zones in the world.',
                objective: {
                    type: 'explore',
                    target: 'zone',
                    count: 4,
                    progress: 0,
                    discovered: []
                },
                reward: {
                    experience: 150,
                    gold: 75,
                    items: [
                        { name: 'Map Fragment', amount: 1 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 1
            },
            {
                id: 'side_quest_3',
                name: 'Skeleton Slayer',
                description: 'Defeat 20 skeletons to thin their numbers.',
                objective: {
                    type: 'kill',
                    target: 'skeleton',
                    count: 20,
                    progress: 0
                },
                reward: {
                    experience: 200,
                    gold: 150,
                    items: [
                        { name: 'Bone Dust', amount: 5 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 3
            },
            {
                id: 'side_quest_4',
                name: 'Zombie Hunter',
                description: 'Cleanse the swamp by defeating 25 zombies.',
                objective: {
                    type: 'kill',
                    target: 'zombie',
                    count: 25,
                    progress: 0
                },
                reward: {
                    experience: 300,
                    gold: 200,
                    items: [
                        { name: 'Putrid Essence', amount: 3 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 5
            },
            {
                id: 'side_quest_5',
                name: 'Demon Slayer',
                description: 'Defeat 30 demons to weaken their invasion force.',
                objective: {
                    type: 'kill',
                    target: 'demon',
                    count: 30,
                    progress: 0
                },
                reward: {
                    experience: 400,
                    gold: 300,
                    items: [
                        { name: 'Demon Heart', amount: 2 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 7
            },
            {
                id: 'side_quest_6',
                name: 'Master Treasure Hunter',
                description: 'Find and open 10 treasure chests throughout the world.',
                objective: {
                    type: 'interact',
                    target: 'chest',
                    count: 10,
                    progress: 0
                },
                reward: {
                    experience: 500,
                    gold: 400,
                    items: [
                        { name: 'Lucky Charm', type: 'accessory', damage: 2, damageReduction: 0.02, amount: 1 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 5
            },
            {
                id: 'side_quest_7',
                name: 'Rare Materials',
                description: 'Collect rare materials from defeated bosses.',
                objective: {
                    type: 'kill',
                    target: 'boss',
                    count: 3,
                    progress: 0
                },
                reward: {
                    experience: 600,
                    gold: 500,
                    items: [
                        { name: 'Enchanted Crystal', amount: 1 }
                    ]
                },
                isMainQuest: false,
                requiredLevel: 8
            }
        ];
        
        // Combine all quests
        this.quests = [...mainQuests, ...sideQuests];
    }
    
    startQuest(quest) {
        // Find the quest in the available quests
        const questToStart = this.quests.find(q => q.name === quest.name);
        
        if (questToStart) {
            // Check if quest is already active
            if (!this.activeQuests.some(q => q.id === questToStart.id)) {
                // Add to active quests
                this.activeQuests.push(questToStart);
                
                // Remove from available quests
                this.quests = this.quests.filter(q => q.id !== questToStart.id);
                
                // Notify UI
                this.game.hudManager.updateQuestLog(this.activeQuests);
                
                return true;
            }
        }
        
        return false;
    }
    
    updateEnemyKill(enemy) {
        // Update kill objectives for active quests
        this.activeQuests.forEach(quest => {
            if (quest.objective.type === 'kill') {
                // Check if this enemy type matches the quest target
                if (quest.objective.target === 'any' || quest.objective.target === enemy.type) {
                    quest.objective.progress++;
                    
                    // Check if objective is complete
                    if (quest.objective.progress >= quest.objective.count) {
                        this.completeQuest(quest);
                    } else {
                        // Update UI
                        this.game.hudManager.updateQuestLog(this.activeQuests);
                        this.game.hudManager.showNotification(`Quest progress: ${quest.objective.progress}/${quest.objective.count} enemies defeated`);
                    }
                }
            }
        });
    }
    
    updateInteraction(objectType) {
        // Update interaction objectives for active quests
        this.activeQuests.forEach(quest => {
            if (quest.objective.type === 'interact' && quest.objective.target === objectType) {
                quest.objective.progress++;
                
                // Check if objective is complete
                if (quest.objective.progress >= quest.objective.count) {
                    this.completeQuest(quest);
                } else {
                    // Update UI
                    this.game.hudManager.updateQuestLog(this.activeQuests);
                    this.game.hudManager.showNotification(`Quest progress: ${quest.objective.progress}/${quest.objective.count} ${objectType}s found`);
                }
            }
        });
    }
    
    updateExploration(zoneName) {
        // Update exploration objectives for active quests
        this.activeQuests.forEach(quest => {
            if (quest.objective.type === 'explore' && quest.objective.target === 'zone') {
                // Check if this zone has already been discovered for this quest
                if (!quest.objective.discovered.includes(zoneName)) {
                    quest.objective.discovered.push(zoneName);
                    quest.objective.progress++;
                    
                    // Check if objective is complete
                    if (quest.objective.progress >= quest.objective.count) {
                        this.completeQuest(quest);
                    } else {
                        // Update UI
                        this.game.hudManager.updateQuestLog(this.activeQuests);
                        this.game.hudManager.showNotification(`Zone discovered: ${zoneName}`);
                    }
                }
            }
        });
    }
    
    completeQuest(quest) {
        // Remove from active quests
        this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
        
        // Add to completed quests
        this.completedQuests.push(quest);
        
        // Award rewards
        this.awardQuestRewards(quest);
        
        // Play quest complete sound
        if (this.game && this.game.audioManager) {
            this.game.audioManager.playSound('questComplete');
        }
        
        // Update UI
        this.game.hudManager.updateQuestLog(this.activeQuests);
        this.game.hudManager.showDialog(
            `Quest Completed: ${quest.name}`,
            `You have completed the quest and received your rewards!`
        );
        
        // Check for next quest in the storyline
        this.checkForNextQuest(quest);
    }
    
    checkForNextQuest(completedQuest) {
        // Check if this quest has a next quest in the storyline
        if (completedQuest.isMainQuest && completedQuest.nextQuestId) {
            // Find the next quest
            const nextQuest = this.quests.find(q => q.id === completedQuest.nextQuestId);
            
            if (nextQuest) {
                // Check if player meets level requirement
                if (this.game.player.getLevel() >= nextQuest.requiredLevel) {
                    // Automatically start the next main quest
                    setTimeout(() => {
                        this.game.hudManager.showDialog(
                            `New Quest Available: ${nextQuest.name}`,
                            `${nextQuest.description}\n\nWould you like to accept this quest?`,
                            () => this.startQuest(nextQuest)
                        );
                    }, 2000); // Show after a short delay
                } else {
                    // Inform player about level requirement
                    setTimeout(() => {
                        this.game.hudManager.showNotification(
                            `New quest "${nextQuest.name}" will be available at level ${nextQuest.requiredLevel}.`
                        );
                    }, 2000);
                }
            }
        }
    }
    
    awardQuestRewards(quest) {
        // Award experience
        if (quest.reward.experience) {
            this.game.player.addExperience(quest.reward.experience);
            this.game.hudManager.showNotification(`Gained ${quest.reward.experience} experience`);
        }
        
        // Award gold
        if (quest.reward.gold) {
            this.game.player.addGold(quest.reward.gold);
            this.game.hudManager.showNotification(`Gained ${quest.reward.gold} gold`);
        }
        
        // Award items
        if (quest.reward.items) {
            quest.reward.items.forEach(item => {
                this.game.player.addToInventory(item);
                this.game.hudManager.showNotification(`Received ${item.name} x${item.amount}`);
            });
        }
    }
    
    getActiveQuests() {
        return this.activeQuests;
    }
    
    getCompletedQuests() {
        return this.completedQuests;
    }
    
    getAvailableQuests() {
        const playerLevel = this.game.player.getLevel();
        
        // Filter quests based on player level and completed quests
        return this.quests.filter(quest => {
            // Check if quest is already completed
            const isCompleted = this.completedQuests.some(q => q.id === quest.id);
            if (isCompleted) return false;
            
            // Check if quest is already active
            const isActive = this.activeQuests.some(q => q.id === quest.id);
            if (isActive) return false;
            
            // Check if player meets level requirement
            return playerLevel >= quest.requiredLevel;
        });
    }
    
    checkForAvailableQuests() {
        const availableQuests = this.getAvailableQuests();
        
        // Check for main quests first
        const mainQuests = availableQuests.filter(q => q.isMainQuest);
        if (mainQuests.length > 0) {
            // Offer the first available main quest
            const mainQuest = mainQuests[0];
            this.game.hudManager.showDialog(
                `New Main Quest Available: ${mainQuest.name}`,
                `${mainQuest.description}\n\nWould you like to accept this quest?`,
                () => this.startQuest(mainQuest)
            );
            return;
        }
        
        // If no main quests, check for side quests
        const sideQuests = availableQuests.filter(q => !q.isMainQuest);
        if (sideQuests.length > 0) {
            // Offer a random side quest
            const randomIndex = Math.floor(Math.random() * sideQuests.length);
            const sideQuest = sideQuests[randomIndex];
            this.game.hudManager.showDialog(
                `New Side Quest Available: ${sideQuest.name}`,
                `${sideQuest.description}\n\nWould you like to accept this quest?`,
                () => this.startQuest(sideQuest)
            );
        }
    }
}