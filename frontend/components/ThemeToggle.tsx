"use client";
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [dark]);
  return (
    <button className="btn-glow" onClick={() => setDark(v => !v)}>{dark ? 'Light' : 'Dark'} Mode</button>
  );
}
