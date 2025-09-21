import { GoogleGenerativeAI } from '@google/generative-ai';
import { NetworkProvider, LinkedAccount, NexusData, Lobby, User, Path, Faction, NexusFeedItem, Post, WorldQuest } from "../types";
import * as db from './database';

// Get the API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Validate API key on module load
if (!GEMINI_API_KEY) {
  console.error('Gemini API Key is missing. Please check your .env.local file.');
  throw new Error("The Nexus is offline. VITE_GEMINI_API_KEY is missing from environment variables.");
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Log environment status (without exposing the actual key)
console.log('Nexus Service: Gemini API Status:', GEMINI_API_KEY ? 'Configured' : 'Not Configured');

// --- NEXUS SERVICE ---
// This service handles connections to third-party services and data aggregation.

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
    if (!GEMINI_API_KEY) {
        throw new Error("The Nexus is offline. VITE_GEMINI_API_KEY is missing from environment variables.");
    }
    if (accounts.length === 0) {
        return Promise.resolve({ nexusFeed: [] });
    }

    const linkedProviders = accounts.map(a => a.provider);
    const trophyProviders = linkedProviders.filter(p => ['steam', 'xbox', 'playstation'].includes(p));

    // Build the schema dynamically based on linked accounts
    const properties: any = {};
    if (linkedProviders.includes('steam')) {
        properties.steam = {
            type: 'object',
            description: 'Steam activity data.',
            properties: {
                activities: {
                    type: 'array',
                    description: 'List of recently played games on Steam.',
                    items: {
                        type: 'object',
                        properties: {
                            game: { type: 'string', description: 'The name of the game.' },
                            hoursPlayed: { type: 'integer', description: 'Total hours played.' },
                            lastPlayed: { type: 'string', description: 'A relative time string like "Yesterday" or "2 weeks ago".' }
                        },
                        required: ["game", "hoursPlayed", "lastPlayed"]
                    }
                }
            }
        };
    }
    if (linkedProviders.includes('twitch')) {
        properties.twitch = {
            type: 'object',
            description: 'Twitch live status. isLive should be true about 30% of the time. If not live, other fields can be omitted.',
            properties: {
                isLive: { type: 'boolean', description: 'Whether the user is currently streaming.' },
                title: { type: 'string', description: 'The title of the stream, if live.' },
                game: { type: 'string', description: 'The game being streamed, if live.' },
                viewers: { type: 'integer', description: 'Number of viewers, if live.' }
            },
            required: ["isLive"]
        };
    }

    if (trophyProviders.length > 0) {
        properties.trophies = {
            type: 'array',
            description: 'A list of games and the trophies/achievements unlocked for them. Should only include platforms from the linked accounts list.',
            items: {
                type: 'object',
                properties: {
                    gameName: { type: 'string', description: 'The name of the game.' },
                    platform: { type: 'string', description: `The platform for this set of trophies. Must be one of: ${trophyProviders.join(', ')}` },
                    trophies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'The name of the trophy.' },
                                description: { type: 'string', description: 'A short description of how to unlock it.' },
                                rarity: { type: 'string', description: 'Rarity of the trophy: common, uncommon, rare, epic, or legendary.' },
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
        type: 'array',
        description: 'A list of friends from linked networks. Should only include platforms from the linked accounts list.',
        items: {
            type: 'object',
            properties: {
                soulName: { type: 'string', description: 'The friend\'s name.' },
                path: { type: 'string', description: 'The friend\'s Path: Sage, Seer, Warrior, Architect, or Sovereign.' },
                isOnline: { type: 'boolean', description: 'Whether the friend is currently online.' },
                currentGame: { type: 'string', description: 'The game they are currently playing, if online.' },
                platform: { type: 'string', description: `The platform the friend is on. Must be one of: ${linkedProviders.join(', ')}` },
                bondScore: { type: 'integer', description: 'A score from 20-100 representing friendship strength.' }
            },
            required: ["soulName", "path", "isOnline", "platform", "bondScore"]
        }
    };

    properties.nexusFeed = {
        type: 'array',
        description: "A summary of the generated data, phrased as user achievements or events. Create one item for each major data block (e.g., one for all trophies, one for all friends).",
        items: {
            type: 'object',
            properties: {
                type: { type: 'string', description: "Type of event: 'Trophy', 'Friend', 'AccountLink'" },
                text: { type: 'string', description: "A descriptive string, e.g. 'Unlocked 5 new trophies in Celestial Arena.' or 'Connected with 3 new allies via Steam.'"},
                sourceProvider: { type: 'string', description: `The provider that sourced this event, e.g., 'steam'`}
            },
            required: ["type", "text"]
        }
    }
    
    const responseSchema = {
        type: 'object',
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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const jsonText = text.trim();
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
    if (!GEMINI_API_KEY) throw new Error("The Nexus is offline. VITE_GEMINI_API_KEY is missing from environment variables.");

    const prompt = 'Generate 5 initial factions for a fantasy game world with unique characteristics and relationships.';
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const jsonText = text.trim();
        const generatedData = JSON.parse(jsonText) as Faction[];

        console.log('[Nexus AI] Generated factions:', generatedData);
        return generatedData;
    } catch (err) {
        console.error('[Nexus AI Error]', err);
        throw err;
    }
};

export const updateFactionDynamics = async (factions: Faction[]): Promise<{ updatedFactions: Faction[], eventPostContent: string }> => {
    console.log('[Nexus AI] Simulating faction dynamics...');
    if (!GEMINI_API_KEY) {
        throw new Error("The Nexus is offline. VITE_GEMINI_API_KEY is missing from environment variables.");
    }
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
        type: 'object',
        properties: {
            updates: {
                type: 'array',
                description: "An array containing ONLY the faction objects that have been modified.",
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        power: { type: 'integer' },
                        status: { type: 'string' },
                        relatedFactionId: { type: 'string' },
                    }
                }
            },
            postContent: { type: 'string', description: "A short, feed-friendly summary of the event." }
        },
        required: ["updates", "postContent"]
    };

     try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const jsonText = text.trim();
        const { updates, postContent } = JSON.parse(jsonText);
        
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

    const ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY });
    const factionData = JSON.stringify(factions.map(f => ({id: f.id, name: f.name, status: f.status, relatedFactionId: f.relatedFactionId})), null, 2);

    const prompt = `Generate a world quest based on these factions: ${factionData}`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const questData = JSON.parse(text.trim());

        return questData;
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
