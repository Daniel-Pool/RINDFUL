'use client';

import { Editor } from '@hugerte/hugerte-react';
import { useRef, useState, useEffect } from 'react';
import { cleanContent } from '../utils/journalEntry';
import { getDailyEntry, updateJournalContent } from '../utils/db';

export default function JournalEditor({ initialValue = '', onSave }) {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const WORD_LIMIT = 200;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // load today's entry if it exists
  useEffect(() => {
    if (!isClient) return;

    const loadEntry = async () => {
      try {
        const entry = await getDailyEntry(today);
        if (entry && entry.content && editorRef.current) {
          editorRef.current.setContent(entry.content);
        }
      } catch (error) {
        console.error('Error loading entry:', error);
      }
    };
    
    if (editorRef.current) {
      loadEntry();
    }
  }, [today, isClient]);

  const handleEditorChange = (content, editor) => {
    const words = editor.plugins.wordcount.body.getWordCount();
    
    if (words > WORD_LIMIT) {
      editor.undoManager.undo();
      const actualWords = editor.plugins.wordcount.body.getWordCount();
      setWordCount(actualWords);
      setShowLimitWarning(true);
    } else {
      setWordCount(words);
      setShowLimitWarning(false);
    }
  };

  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => {
        setShowLimitWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  const getWordCount = (htmlContent) => {
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSave = async () => {
    console.log('=== SAVE STARTED ===');
    console.log('isSaving:', isSaving);
    console.log('editorRef.current:', editorRef.current);
    
    if (editorRef.current && !isSaving) {
      setIsSaving(true);
      
      try {
        const rawContent = editorRef.current.getContent();
        console.log('Raw content from editor:', rawContent);
        
        const content = cleanContent(rawContent);
        console.log('Cleaned content:', content);
        
        if (!content || content.trim().length === 0) {
          console.log('Content is empty, aborting save');
          alert('Please write something before saving');
          setIsSaving(false);
          return;
        }
        
        const wordCount = getWordCount(content);
        console.log('Word count:', wordCount);
        console.log('Date (today):', today);
        
        // save to indexDB
        const result = await updateJournalContent(today, content, wordCount);
        console.log('Save result:', result);
        
        alert('Journal entry saved!');
        
        if (onSave) {
          onSave({ content, wordCount });
        }
      } catch (error) {
        console.error('=== SAVE ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        alert(`Failed to save entry: ${error.message}`);
      } finally {
        console.log('=== SAVE COMPLETED ===');
        setIsSaving(false);
      }
    } else {
      console.log('Save blocked - isSaving:', isSaving, 'editorRef:', editorRef.current);
    }
  };

  const isAtLimit = wordCount >= WORD_LIMIT;

  if (!isClient) {
    return (
      <div className="journal-editor">
        <div className="h-[500px] bg-gray-100 animate-pulse rounded"></div>
        <button 
          disabled
          className="mt-4 px-4 py-2 rounded text-white bg-gray-400 cursor-not-allowed"
        >
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div className="journal-editor relative">
      {showLimitWarning && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          Word limit reached! Maximum {WORD_LIMIT} words.
        </div>
      )}
      
      <Editor
        onInit={(evt, editor) => {
          editorRef.current = editor;
          const words = editor.plugins.wordcount.body.getWordCount();
          setWordCount(words);
        }}
        onEditorChange={handleEditorChange}
        initialValue={initialValue}
        init={{
          placeholder: "What's on your mind?",
          height: 500,
          menubar: false,
          plugins: [
            'lists', 'link', 'image', 'charmap', 'preview',
            'searchreplace', 'fullscreen',
            'insertdatetime', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
          'bold italic | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist | ' +
          'removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          statusbar: true,
          branding: false,
          setup: (editor) => {
            editor.on('init', () => {
              const statusbar = editor.getContainer().querySelector('.tox-statusbar__text-container');
              if (statusbar) {
                statusbar.innerHTML = '';
              }
            });
            
            editor.on('NodeChange keyup', () => {
              const words = editor.plugins.wordcount.body.getWordCount();
              const statusbar = editor.getContainer().querySelector('.tox-statusbar__text-container');
              if (statusbar) {
                const color = words >= WORD_LIMIT ? '#dc2626' : '#6b7280';
                const weight = words >= WORD_LIMIT ? 'bold' : 'normal';
                statusbar.innerHTML = `<span style="color: ${color}; font-weight: ${weight};">${words} / ${WORD_LIMIT} words</span>`;
              }
            });
          }
        }}
      />
      
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className={`mt-4 px-4 py-2 rounded text-white ${
          isSaving 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isSaving ? 'Saving...' : 'Save Entry'}
      </button>
    </div>
  );
}