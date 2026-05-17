import { Settings } from './components/settings/Settings';
import { useEffect } from 'react';

function App() {
  // Apply dark mode based on system preference on initial load
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
      root.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <Settings />
    </div>
  );
}

export default App;
