
import * as db from './database';
import * as nexus from './nexus';
import { Post, WorldQuest } from '../types';

/**
 * The SimulationEngine is responsible for making the world of Gamedin Genesis feel alive.
 * It runs on a "tick" to generate new world events, manage factions, and create emergent narratives.
 */
export class SimulationEngine {
    private isInitialized = false;

    constructor() {
        console.log('[SimulationEngine] A new world is stirring...');
    }

    /**
     * Initializes the engine, primarily by ensuring persistent world data like factions exists.
     * This should be called once when the app starts.
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[SimulationEngine] Awakening...');
        const existingFactions = db.getFactions();
        if (existingFactions.length === 0) {
            console.log('[SimulationEngine] The dawn is new. Forging initial Factions...');
            try {
                const newFactions = await nexus.generateInitialFactions();
                if (newFactions.length > 0) {
                    db.saveFactions(newFactions);
                    console.log(`[SimulationEngine] ${newFactions.length} Factions have been established.`);

                    // Create a post announcing the factions
                     const announcementPost: Post = {
                        id: `post_event_${Date.now()}`,
                        authorHandle: 'oracle_ai',
                        authorName: 'The Oracle',
                        authorAvatarUrl: 'https://i.pravatar.cc/150?u=oracle',
                        content: `The great Factions have revealed themselves: ${newFactions.map(f => f.name).join(', ')}. A new era of allegiance and conflict begins. #Factions #WorldEvent`,
                        timestamp: new Date().toISOString(),
                        likes: Math.floor(Math.random() * 100),
                        commentsCount: Math.floor(Math.random() * 20),
                        sharesCount: Math.floor(Math.random() * 15),
                        type: 'event',
                        icon: 'Faction',
                    };
                    db.addPost(announcementPost);
                }
            } catch (error) {
                console.error('[SimulationEngine] Failed to forge initial factions:', error);
            }
        }
        this.isInitialized = true;
    }

    /**
     * The main loop of the simulation. This function is called periodically.
     * It triggers an update to the world's faction dynamics and may create quests.
     */
    async tick() {
        if (!this.isInitialized) {
            console.warn('[SimulationEngine] Tick called before initialization.');
            return;
        }

        console.log('[SimulationEngine] World tick...');
        
        try {
            const factions = db.getFactions();
            if (factions.length === 0) return;

            // Update Faction Dynamics
            console.log('[SimulationEngine] A thread of fate has unfurled. Simulating faction dynamics...');
            const result = await nexus.updateFactionDynamics(factions);
            db.saveFactions(result.updatedFactions);

            const eventPost: Post = {
                id: `post_event_${Date.now()}`,
                authorHandle: 'oracle_ai',
                authorName: 'The Oracle',
                authorAvatarUrl: 'https://i.pravatar.cc/150?u=oracle',
                content: result.eventPostContent,
                timestamp: new Date().toISOString(),
                likes: 0,
                commentsCount: 0,
                sharesCount: 0,
                type: 'event',
                icon: 'Scarab',
            };
            db.addPost(eventPost);
            console.log(`[SimulationEngine] New Faction Event Published:`, result.eventPostContent);

            // Have a chance to generate a new World Quest
            if (Math.random() < 0.3) { // 30% chance each tick
                console.log('[SimulationEngine] The Oracle forsees a new need. Generating World Quest...');
                const questData = await nexus.generateWorldQuest(db.getFactions());
                const newQuest: WorldQuest = {
                    ...questData,
                    id: `quest_${Date.now()}`,
                    contributions: [],
                    status: 'active',
                    createdAt: new Date().toISOString(),
                };
                db.addWorldQuest(newQuest);

                const questPost: Post = {
                    id: `post_quest_${newQuest.id}`,
                    authorHandle: 'oracle_ai',
                    authorName: 'The Oracle',
                    authorAvatarUrl: 'https://i.pravatar.cc/150?u=oracle',
                    content: `${questData.description}`,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    commentsCount: 0,
                    sharesCount: 0,
                    type: 'quest',
                    icon: 'Quest',
                    questId: newQuest.id,
                };
                db.addPost(questPost);
                console.log(`[SimulationEngine] New World Quest Published: ${newQuest.title}`);
            }

        } catch (error) {
            console.error('[SimulationEngine] Failed to complete tick:', error);
        }
    }
}
