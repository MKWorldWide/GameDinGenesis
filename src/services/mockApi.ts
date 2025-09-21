// Mock API service for development
const gods = [
  { id: 1, name: 'Athena', domain: 'Wisdom & Strategy', sentiment: 'wise', color: '#4F46E5' },
  { id: 2, name: 'Zeus', domain: 'Sky & Thunder', sentiment: 'commanding', color: '#F59E0B' },
  { id: 3, name: 'Hera', domain: 'Marriage & Family', sentiment: 'regal', color: '#8B5CF6' },
  { id: 4, name: 'Poseidon', domain: 'Sea & Earthquakes', sentiment: 'tempestuous', color: '#06B6D4' },
  { id: 5, name: 'Aphrodite', domain: 'Love & Beauty', sentiment: 'charming', color: '#EC4899' },
];

const responses = {
  wise: [
    "The wise see knowledge in all things.",
    "Strategy is the art of making use of time and space.",
    "In the middle of difficulty lies opportunity.",
  ],
  commanding: [
    "I am the storm that approaches!",
    "The heavens themselves bow before my might!",
    "Witness the power of the divine!",
  ],
  regal: [
    "A queen's wisdom is her greatest strength.",
    "The bonds of family are stronger than the mightiest fortress.",
    "Grace and dignity in all things.",
  ],
  tempestuous: [
    "The sea gives and the sea takes away.",
    "Beware my wrath, for it is as deep as the ocean.",
    "The tides of fate are ever-changing.",
  ],
  charming: [
    "Love is the most powerful force in the universe.",
    "Beauty is not just in the eye of the beholder, but in the soul.",
    "A kind word can open even the heaviest doors.",
  ],
};

export const getRandomGod = () => {
  return gods[Math.floor(Math.random() * gods.length)];
};

export const getDivineResponse = (sentiment: string) => {
  const sentimentResponses = responses[sentiment as keyof typeof responses] || responses.wise;
  return sentimentResponses[Math.floor(Math.random() * sentimentResponses.length)];
};

export const simulateDivineIntervention = async (userInput: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const god = getRandomGod();
  const response = getDivineResponse(god.sentiment);
  
  return {
    speaker: god.name,
    domain: god.domain,
    message: response,
    color: god.color,
    timestamp: new Date().toISOString(),
  };
};

export const getDivineWisdom = async () => {
  const god = getRandomGod();
  const response = getDivineResponse(god.sentiment);
  
  return {
    speaker: god.name,
    domain: god.domain,
    message: response,
    color: god.color,
    timestamp: new Date().toISOString(),
  };
};
