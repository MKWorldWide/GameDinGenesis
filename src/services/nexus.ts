

import { GoogleGenAI, Type } from '@google/genai';
import { NetworkProvider, LinkedAccount, NexusData, Lobby, User, Path, Faction, NexusFeedItem, Post, WorldQuest } from "../types";
import * as db from './database';


// --- MOCK NEXUS SERVICE ---
// In a real application, these functions would handle OAuth flows,
// secure API calls to third-party services, and data transformation.

/**
 * Mocks connecting a new third-party account.
 * @param provider The network to connect to.
 * @param gamedinUsername The current user's name for mock data generation.
 * @returns A promise that resolves to a new LinkedAccount object.
 */
export const connectAccount = (provider: NetworkProvider, gamedinUsername: string): Promise<LinkedAccount> => {
    console.log(`[Nexus Mock] Initiating connection for ${provider}...`);
    return new Promise(resolve => {
        setTimeout(() => {
            const mockUsernames: Record<NetworkProvider, string> = {
                steam: `${gamedinUsername}_steam`,
                xbox: `X_${gamedinUsername}_X`,
                playstation: `ps_${gamedinUsername}`,
                discord: `${gamedinUsername}#${Math.floor(1000 + Math.random() * 9000)}`,
                twitch: `${gamedinUsername}_tv`,
                twitter: `@${gamedinUsername}_tweets`,
            }
            const newAccount: LinkedAccount = {
                provider,
                userId: `nexus_${provider}_${Date.now()}`,
                username: mockUsernames[provider],
                linkedAt: new Date().toISOString(),
            };
            console.log(`[Nexus Mock] Account for ${provider} created:`, newAccount);
            resolve(newAccount);
        }, 1000); // Simulate network delay
    });
};

/**
 * Fetches aggregated data from all linked networks by using Gemini to generate it.
 * @param accounts The user's array of linked accounts.
 * @param user The user for whom data is being fetched.
 * @returns A promise that resolves to a NexusData and NexusFeed object.
 */
export const fetchNexusData = async (accounts: LinkedAccount[], user: User): Promise<Partial<NexusData> & { nexusFeed: NexusFeedItem[] }> => {
    console.log('[Nexus AI] Fetching dynamic data for all linked accounts...');
    if (!process.env.API_KEY) {
        throw new Error("The Nexus is offline. API_KEY is missing.");
    }
    if (accounts.length === 0) {
        return Promise.resolve({ nexusFeed: [] });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const linkedProviders = accounts.map(a => a.provider);
    const trophyProviders = linkedProviders.filter(p => ['steam', 'xbox', 'playstation'].includes(p));

    // Build the schema dynamically based on linked accounts
    const properties: any = {};
    if (linkedProviders.includes('steam')) {
        properties.steam = {
            type: Type.OBJECT,
            description: 'Steam activity data.',
            properties: {
                activities: {
                    type: Type.ARRAY,
                    description: 'List of recently played games on Steam.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            game: { type: Type.STRING, description: 'The name of the game.' },
                            hoursPlayed: { type: Type.INTEGER, description: 'Total hours played.' },
                            lastPlayed: { type: Type.STRING, description: 'A relative time string like "Yesterday" or "2 weeks ago".' }
                        },
                        required: ["game", "hoursPlayed", "lastPlayed"]
                    }
                }
            }
        };
    }
    if (linkedProviders.includes('twitch')) {
        properties.twitch = {
            type: Type.OBJECT,
            description: 'Twitch live status. isLive should be true about 30% of the time. If not live, other fields can be omitted.',
            properties: {
                isLive: { type: Type.BOOLEAN, description: 'Whether the user is currently streaming.' },
                title: { type: Type.STRING, description: 'The title of the stream, if live.' },
                game: { type: Type.STRING, description: 'The game being streamed, if live.' },
                viewers: { type: Type.INTEGER, description: 'Number of viewers, if live.' }
            },
            required: ["isLive"]
        };
    }

    if (trophyProviders.length > 0) {
        properties.trophies = {
            type: Type.ARRAY,
            description: 'A list of games and the trophies/achievements unlocked for them. Should only include platforms from the linked accounts list.',
            items: {
                type: Type.OBJECT,
                properties: {
                    gameName: { type: Type.STRING, description: 'The name of the game.' },
                    platform: { type: Type.STRING, description: `The platform for this set of trophies. Must be one of: ${trophyProviders.join(', ')}` },
                    trophies: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'The name of the trophy.' },
                                description: { type: Type.STRING, description: 'A short description of how to unlock it.' },
                                rarity: { type: Type.STRING, description: 'Rarity of the trophy: common, uncommon, rare, epic, or legendary.' },
                            },
                            required: ["name", "description", "rarity"]
                        }
                    }
                },
                required: ["gameName", "platform", "trophies"]
            }
        };
    }
    
    properties.friends = {
        type: Type.ARRAY,
        description: 'A list of friends from linked networks. Should only include platforms from the linked accounts list.',
        items: {
            type: Type.OBJECT,
            properties: {
                soulName: { type: Type.STRING, description: 'The friend\'s name.' },
                path: { type: Type.STRING, description: 'The friend\'s Path: Sage, Seer, Warrior, Architect, or Sovereign.' },
                isOnline: { type: Type.BOOLEAN, description: 'Whether the friend is currently online.' },
                currentGame: { type: Type.STRING, description: 'The game they are currently playing, if online.' },
                platform: { type: Type.STRING, description: `The platform the friend is on. Must be one of: ${linkedProviders.join(', ')}` },
                bondScore: { type: Type.INTEGER, description: 'A score from 20-100 representing friendship strength.' }
            },
            required: ["soulName", "path", "isOnline", "platform", "bondScore"]
        }
    };

    properties.nexusFeed = {
        type: Type.ARRAY,
        description: "A summary of the generated data, phrased as user achievements or events. Create one item for each major data block (e.g., one for all trophies, one for all friends).",
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Type of event: 'Trophy', 'Friend', 'AccountLink'" },
                text: { type: Type.STRING, description: "A descriptive string, e.g. 'Unlocked 5 new trophies in Celestial Arena.' or 'Connected with 3 new allies via Steam.'"},
                sourceProvider: { type: Type.STRING, description: `The provider that sourced this event, e.g., 'steam'`}
            },
            required: ["type", "text"]
        }
    }
    
    const responseSchema = {
        type: Type.OBJECT,
        properties
    };

    const prompt = `
        Generate a realistic and varied set of mock gaming and social data for a user on a platform called Gamedin Genesis.
        The user's name is "${user.name}".
        Their chosen path is "${user.path}", which reflects their personality (e.g., Warrior likes action, Sage likes strategy, Architect likes building).
        Their dream is "${user.dream}".
        Their linked accounts are: ${linkedProviders.join(', ')}.

        Generate data that fits the user's profile.
        - Generate between 2 and 5 friends.
        - Generate between 1 and 3 games for trophies, but only if trophy-enabled platforms are linked (${trophyProviders.join(', ')}). Each game should have 2-5 trophies.
        - Ensure all generated platforms for friends and trophies are from the user's list of linked accounts.
        - For Twitch, there is a 30% chance they are live.
        - Create a 'nexusFeed' array that summarizes the data you generated in plain English.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const generatedData = JSON.parse(jsonText) as (NexusData & { nexusFeed: NexusFeedItem[] });
        
        // Post-processing to add IDs and full URLs, as AI is not good with that.
        if (generatedData.trophies) {
            generatedData.trophies.forEach(game => {
                game.trophies.forEach(trophy => {
                    trophy.id = `trophy_${game.gameName}_${trophy.name}`.replace(/\s/g, '');
                    trophy.platform = game.platform;
                    trophy.iconUrl = 'trophy-icon'; // Keep mock icon
                });
            });
        }
        if (generatedData.friends) {
            generatedData.friends.forEach(friend => {
                friend.id = `friend_${friend.soulName}`;
                friend.avatarUrl = `https://i.pravatar.cc/150?u=${friend.soulName.replace(/\s/g, '')}`;
            });
        }
        if (generatedData.nexusFeed) {
             generatedData.nexusFeed.forEach(item => {
                item.id = `feed_${Date.now()}_${Math.random()}`;
                item.timestamp = new Date().toISOString();
             });
        }
        
        console.log('[Nexus AI] Generated data:', generatedData);
        return generatedData;

    } catch (err) {
        console.error('[Nexus AI Error]', err);
        // Fallback to empty data on error
        return { nexusFeed: [] };
    }
};

/**
 * Uses Gemini to generate initial factions for the world.
 */
export const generateInitialFactions = async (): Promise<Faction[]> => {
    console.log('[Nexus AI] Generating initial world factions...');
    if (!process.env.API_KEY) throw new Error("API_KEY is missing.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const paths: Path[] = ['Sage', 'Seer', 'Warrior', 'Architect', 'Sovereign'];

    const prompt = `
        Create a set of 5 distinct, persistent factions for the world of Gamedin Genesis.
        Each faction must be thematically tied to one of the core "Paths": ${paths.join(', ')}.
        For each faction, provide a unique and compelling name, a short, evocative description (1-2 sentences), and its Path allegiance.
        Initial power level should be between 40 and 60. Initial status for all should be 'neutral'.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            factions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The unique name of the faction." },
                        description: { type: Type.STRING, description: "A short, evocative description of the faction's goals and identity." },
                        pathAllegiance: { type: Type.STRING, description: `The core Path this faction is aligned with. Must be one of: ${paths.join(', ')}.` },
                        power: { type: Type.INTEGER, description: "An initial power level between 40 and 60." },
                    },
                    required: ["name", "description", "pathAllegiance", "power"]
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema },
        });

        const { factions } = JSON.parse(response.text);

        return factions.map((f: any) => ({
            ...f,
            id: `faction_${f.name.replace(/\s/g, '_')}`,
            status: 'neutral'
        }));
    } catch (e) {
        console.error('[Nexus AI Faction Error]', e);
        return [];
    }
}

/**
 * Uses Gemini to simulate a world event and update faction dynamics.
 */
export const updateFactionDynamics = async (factions: Faction[]): Promise<{ updatedFactions: Faction[], eventPostContent: string }> => {
    console.log('[Nexus AI] Simulating faction dynamics...');
    if (!process.env.API_KEY) throw new Error("API_KEY is missing.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const factionData = JSON.stringify(factions, null, 2);

    const prompt = `
        You are the simulation engine for Gamedin Genesis. Given the current state of world factions, create a single, logical political event.
        Current Faction State:
        ${factionData}

        Choose one of the following events and apply it:
        1.  **Start War**: Two neutral factions become 'at war'. Set their 'relatedFactionId' to each other. Slightly decrease their power.
        2.  **Form Alliance**: Two neutral factions become 'allied'. Set their 'relatedFactionId' to each other. Slightly increase their power.
        3.  **End War/Alliance**: An 'at war' or 'allied' pair becomes 'neutral'. Clear their 'relatedFactionId'.
        4.  **Expansion**: One faction has a breakthrough. Its status becomes 'expanding' and its power increases significantly (e.g., +5-10).
        5.  **Hardship**: One faction suffers a setback. Its status becomes 'defensive' and its power decreases (e.g., -5-10).

        Rules:
        - Only modify the factions directly involved in the event.
        - Ensure changes are symmetrical (e.g., if A is at war with B, B must be at war with A).
        - Return ONLY the factions that were modified.
        - Generate a compelling, news-style "post content" string (max 400 chars, include hashtags) describing the event from the perspective of an omniscient observer called The Oracle.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            updates: {
                type: Type.ARRAY,
                description: "An array containing ONLY the faction objects that have been modified.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        power: { type: Type.INTEGER },
                        status: { type: Type.STRING },
                        relatedFactionId: { type: Type.STRING },
                    }
                }
            },
            postContent: { type: Type.STRING, description: "A short, feed-friendly summary of the event." }
        },
        required: ["updates", "postContent"]
    };

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema },
        });

        const { updates, postContent } = JSON.parse(response.text.trim());
        
        // Create a full map of original factions to merge updates into
        const updatedFactions = [...factions];
        const factionMap = new Map(updatedFactions.map(f => [f.id, f]));

        for (const update of updates) {
            const originalFaction = factionMap.get(update.id);
            if (originalFaction) {
                // Merge the update. Ensure relatedFactionId can be set to undefined.
                const newFactionData = { ...originalFaction, ...update, relatedFactionId: update.relatedFactionId || undefined };
                factionMap.set(update.id, newFactionData);
            }
        }
        
        return {
            updatedFactions: Array.from(factionMap.values()),
            eventPostContent: postContent
        };

    } catch (e) {
        console.error('[Nexus AI Faction Dynamics Error]', e);
        throw e;
    }
};

export const generateWorldQuest = async (factions: Faction[]): Promise<Omit<WorldQuest, 'id' | 'contributions' | 'status' | 'createdAt'>> => {
    console.log('[Nexus AI] Generating a new World Quest...');
    if (!process.env.API_KEY) throw new Error("API_KEY is missing.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const factionData = JSON.stringify(factions.map(f => ({id: f.id, name: f.name, status: f.status, relatedFactionId: f.relatedFactionId})), null, 2);

    const prompt = `
        You are the simulation engine for Gamedin Genesis. Your task is to create a new "World Quest" based on the current political climate of the factions.
        Current Faction State:
        ${factionData}

        Analyze the state and create a single, compelling quest for ONE faction. The quest should be a creative task for players.
        - If a faction is 'at war', create a quest to design propaganda, new war machine concepts, or elite soldier outfits.
        - If a faction is 'expanding', create a quest to design a new settlement's architecture, an emblem for a new territory, or a uniform for its explorers.
        - If a faction is 'allied', create a quest to design a joint emblem for the alliance or a concept for a celebratory monument.
        - If a faction is 'defensive' or 'neutral', create a quest to bolster morale, like designing a new parade uniform, a cultural hero, or a symbolic weapon.
        
        The quest's goal is always for users to submit concepts.
        You must pick one faction to be the 'issuer' of the quest.

        Return a JSON object with:
        - issuerFactionId: The ID of the faction giving the quest.
        - title: A short, exciting title for the quest (e.g., "The Aegis of Defiance", "Forging the Frontier").
        - description: A compelling description (1-2 sentences) explaining the quest's purpose and what users should create.
        - goal: An object with type 'SUBMIT_CONCEPTS' and a targetCount between 5 and 15.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            issuerFactionId: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            goal: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Must be 'SUBMIT_CONCEPTS'" },
                    targetCount: { type: Type.INTEGER }
                },
                required: ["type", "targetCount"]
            }
        },
        required: ["issuerFactionId", "title", "description", "goal"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema },
        });

        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error('[Nexus AI World Quest Error]', e);
        throw e;
    }
}


/**
 * Mocks posting a message to a social network.
 * @param provider The network to post to.
 * @param message The content to post.
 */
export const postToNetwork = (provider: NetworkProvider, message: string): void => {
    console.log(`[Nexus Mock] Syndicating post to ${provider}...`);
    console.log(`> Message: "${message}"`);
    console.log(`> Post successful!`);
};

/**
 * Mocks finding game lobbies based on filters.
 */
export const findLobbies = (filters: any): Promise<Lobby[]> => {
    console.log('[Nexus Mock] Finding lobbies with filters:', filters);
    const mockLobbies: Lobby[] = [
        { id: 'lobby1', game: "Aethelgard's Fall", platform: 'Cross-Platform', title: "Final Boss Run (Need Healer)", currentPlayers: 3, maxPlayers: 4, skillLevel: "Divine", playstyle: "Co-op" },
        { id: 'lobby2', game: "Celestial Arena", platform: 'Cross-Platform', title: "Ranked Grind to Mythic", currentPlayers: 1, maxPlayers: 2, skillLevel: "Mythic+", playstyle: "Competitive" },
        { id: 'lobby3', game: "StarSailor's Odyssey", platform: 'steam', title: "Chill Exploration & Mining", currentPlayers: 5, maxPlayers: 8, skillLevel: "Casual", playstyle: "Social" },
        { id: 'lobby4', game: "Desert of Storms", platform: 'xbox', title: "Weekly Raid - Quick Clear", currentPlayers: 7, maxPlayers: 8, skillLevel: "Veteran", playstyle: "Co-op" },
        { id: 'lobby5', game: "Celestial Arena", platform: 'playstation', title: "Casual Matches, Noobs Welcome", currentPlayers: 4, maxPlayers: 10, skillLevel: "Beginner", playstyle: "Social" },
    ];
    
    return new Promise(resolve => {
        setTimeout(() => {
            const { query, skill, playstyle } = filters;
            let filtered = mockLobbies;
            if (query) {
                filtered = filtered.filter(l => l.game.toLowerCase().includes(query.toLowerCase()) || l.title.toLowerCase().includes(query.toLowerCase()));
            }
            if (skill && skill !== 'any') {
                 filtered = filtered.filter(l => l.skillLevel.toLowerCase() === skill.toLowerCase());
            }
            if (playstyle && playstyle !== 'any') {
                 filtered = filtered.filter(l => l.playstyle.toLowerCase() === playstyle.toLowerCase());
            }
            resolve(filtered);
        }, 500);
    });
};
