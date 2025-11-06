'use client';

import { useState } from 'react';
import JournalEditor from '../components/JournalEditor';

export default function JournalPage() {
  const [savedContent, setSavedContent] = useState('');

  const handleSave = (content) => {
    console.log('Saving:', content);
    setSavedContent(content);
    // Placeholder, no actual save functionality yet
    alert('Journal entry saved!');
  };

  return (
    <div style={{maxWidth: '50%', margin: '8 auto'}} className="container mx-left p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-500">My Journal</h1>
      <JournalEditor 
        initialValue="<p></p>"
	onSave={handleSave}
      />
    </div>
  );
}
