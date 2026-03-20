import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative p-2 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-all duration-300"
    >
      <Sun size={18} className={`text-amber-500 transition-all duration-300 ${isDark ? 'opacity-0 scale-50 absolute inset-0 m-auto' : 'opacity-100 scale-100'}`} />
      <Moon size={18} className={`text-indigo-300 transition-all duration-300 ${isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute inset-0 m-auto'}`} />
    </button>
  );
};
