'use client';

import { Editor } from '@hugerte/hugerte-react';
import { useRef, useState, useEffect } from 'react';
import { cleanContent } from '../utils/journalEntry';
import { getDailyEntry, updateJournalContent } from '../utils/db';
import { getPrompt } from '../utils/HealthPrompts.js';

export default function JournalEditor({ initialValue = '', onSave, selectedDate }) {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currPlaceholder, changePlaceholder] = useState("What's on your mind?");
  const [editorReady, setEditorReady] = useState(false);
  const WORD_LIMIT = 200;

  const today = selectedDate || new Date().toISOString().split('T')[0];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // load entry when date changes or editor becomes ready
  useEffect(() => {
    if (!editorReady || !editorRef.current) {
      console.log('Editor not ready yet, skipping load');
      return;
    }
    
    const loadEntry = async () => {
      console.log('Loading entry for date:', today);
      
      try {
        const entry = await getDailyEntry(today);
        console.log('Loaded entry:', entry);
        
        if (entry && entry.content) {
          console.log('Setting content:', entry.content);
          editorRef.current.setContent(entry.content);
          
          // Force word count update after content is set
          setTimeout(() => {
            if (editorRef.current && editorRef.current.plugins && editorRef.current.plugins.wordcount) {
              const words = editorRef.current.plugins.wordcount.body.getWordCount();
              setWordCount(words);
              console.log('Word count updated:', words);
              
              // Also update the status bar
              const statusbar = editorRef.current.getContainer().querySelector('.tox-statusbar__text-container');
              if (statusbar) {
                const color = words >= WORD_LIMIT ? '#dc2626' : '#6b7280';
                const weight = words >= WORD_LIMIT ? 'bold' : 'normal';
                statusbar.innerHTML = `<span style="color: ${color}; font-weight: ${weight};">${words} / ${WORD_LIMIT} words</span>`;
              }
            }
          }, 100); // Small delay to ensure content is fully loaded
        } else {
          console.log('No entry found, clearing editor');
          editorRef.current.setContent('<p></p>');
          setWordCount(0);
          
          // Update status bar for empty content
          const statusbar = editorRef.current.getContainer().querySelector('.tox-statusbar__text-container');
          if (statusbar) {
            statusbar.innerHTML = `<span style="color: #6b7280; font-weight: normal;">0 / ${WORD_LIMIT} words</span>`;
          }
        }
      } catch (error) {
        console.error('Error loading entry:', error);
        editorRef.current.setContent('<p></p>');
        setWordCount(0);
      }
    };
    
    loadEntry();
  }, [today, editorReady]);

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
        
        // Save to IndexedDB
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

  // Function to check if the textbox is empty
  const checkTextBoxEmpty = () => { 
    if (!editorRef.current) return true; // Add safety check
    
    const rawContent = editorRef.current.getContent();
    const content = cleanContent(rawContent);
    if (!content || content.trim().length === 0) {
      console.log('Content is Empty');
      return true;
    }
    return false;
  };

  // Function for getting a new prompt
  const getNewPrompt = () => {
    const prompt = getPrompt();
    const emptyStatus = checkTextBoxEmpty();
    
    if (emptyStatus) {
      // If empty, just change the placeholder
      changePlaceholder(prompt);
      console.log('New placeholder:', prompt);
    } else {
      // If there's content, warn the user
      if (confirm("A journal entry is in progress. Pressing OK will clear the current entry and show a new prompt.")) {
        editorRef.current.setContent('<p></p>'); // Clear the editor
        changePlaceholder(prompt);
        setWordCount(0);
      }
    }
  };

  const isAtLimit = wordCount >= WORD_LIMIT;

  if (!isClient) {
    return (
      <div className="journal-editor">
        <div className="h-[500px] bg-gray-100 animate-pulse rounded flex items-center justify-center">
          <p className="text-gray-500">Loading editor...</p>
        </div>
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
          console.log('Editor initialized');
          editorRef.current = editor;
          const words = editor.plugins.wordcount.body.getWordCount();
          setWordCount(words);
          setEditorReady(true); // Mark editor as ready
        }}
        onEditorChange={handleEditorChange}
        initialValue={initialValue}
        key={currPlaceholder} // Re-render when placeholder changes
        init={{
          placeholder: currPlaceholder,
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

      <div className="flex gap-3">
        <button 
          onClick={handleSave}
          disabled={isSaving || !editorReady}
          className={`mt-4 px-4 py-2 rounded text-white ${
            isSaving || !editorReady
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>

        <button 
          onClick={getNewPrompt}
          disabled={!editorReady}
          className={`mt-4 px-4 py-2 rounded text-white ${
            !editorReady
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Get a new prompt
        </button>
      </div>
    </div>
  );
}