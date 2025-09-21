import { useEffect } from 'react';

const HealthStatus = () => {
  useEffect(() => {
    console.log('GameDinGenesis Health Status:', {
      env: import.meta.env.VITE_APP_ENV || 'development',
      hasGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
      buildTime: new Date().toISOString()
    });
  }, []);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 z-50">
      <div className="font-mono space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-24">Environment:</span>
          <span className="font-semibold">{import.meta.env.VITE_APP_ENV || 'development'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-24">Gemini API:</span>
          {import.meta.env.VITE_GEMINI_API_KEY ? (
            <span className="text-green-600 dark:text-green-400">✅ Configured</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">⚠️ Add API Key</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthStatus;
