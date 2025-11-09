'use client';

import { useEffect } from 'react';
import { initDB } from '../utils/db';

export default function DBInitializer() {
  useEffect(() => {
    // initialize database when app loads
    initDB()
      .then(() => console.log('Database initialized'))
      .catch(err => console.error('Failed to initialize database:', err));
  }, []);

  return null; // this component doesn't render anything
}