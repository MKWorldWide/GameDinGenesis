import { useState, useEffect } from 'react';
import { getDivineWisdom } from '../services/mockApi';

interface DivineMessage {
  speaker: string;
  domain: string;
  message: string;
  color: string;
  timestamp: string;
}

const DivineOracle = () => {
  const [messages, setMessages] = useState<DivineMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchWisdom = async () => {
    setIsSpeaking(true);
    try {
      const wisdom = await getDivineWisdom();
      setMessages(prev => [wisdom, ...prev].slice(0, 5)); // Keep last 5 messages
    } catch (error) {
      console.error('Failed to fetch divine wisdom:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Auto-fetch wisdom every 10-20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpeaking && Math.random() > 0.7) { // 30% chance to speak
        fetchWisdom();
      }
    }, 10000 + Math.random() * 10000);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg overflow-hidden z-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 text-white font-semibold">
        Divine Oracle
        <button 
          onClick={fetchWisdom}
          disabled={isSpeaking}
          className="ml-2 px-2 py-1 bg-white/20 rounded text-sm hover:bg-white/30 disabled:opacity-50 float-right"
        >
          {isSpeaking ? 'Channeling...' : 'Ask the Gods'}
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 italic">The gods are silent... for now.</p>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className="p-3 rounded-lg border-l-4"
              style={{ borderColor: msg.color }}
            >
              <div className="flex justify-between items-baseline">
                <span className="font-bold" style={{ color: msg.color }}>{msg.speaker}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{msg.domain}</div>
              <p className="text-sm">{msg.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DivineOracle;
