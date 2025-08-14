import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verificar si hay una preferencia guardada
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      try {
        // Intentar parsear como JSON (boolean)
        return JSON.parse(saved);
      } catch (error) {
        // Si falla, manejar valores string como 'light'/'dark'
        if (saved === 'dark') return true;
        if (saved === 'light') return false;
        
        // Si es cualquier otro valor, usar preferencia del sistema
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    // Si no hay preferencia guardada, usar la preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Aplicar la clase al documento
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Guardar la preferencia como boolean
    localStorage.setItem('theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return [isDarkMode, toggleDarkMode];
};