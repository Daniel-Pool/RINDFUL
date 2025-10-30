'use client';

import { Editor } from '@hugerte/hugerte-react';
import { useRef, useState, useEffect } from 'react';

export default function JournalEditor({ initialValue = '', onSave }) {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const WORD_LIMIT = 200;

  const handleEditorChange = (content, editor) => {
    const words = editor.plugins.wordcount.body.getWordCount();
    
    // ff the limit is exceeded, prevent further typing
    if (words > WORD_LIMIT) {
      // restore the previous content
      editor.undoManager.undo();
      // update word count to the actual limit
      const actualWords = editor.plugins.wordcount.body.getWordCount();
      setWordCount(actualWords);
      
      // show warning toast
      setShowLimitWarning(true);
    } else {
      setWordCount(words);
      setShowLimitWarning(false);
    }
  };

  // auto-hide warning after 3 seconds
  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => {
        setShowLimitWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  const handleSave = () => {
    if (editorRef.current) {
      let content = editorRef.current.getContent();

      content = content.replace(/^(<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>)+/gi, '');
      content = content.trim();
      onSave(content);
    }
  };

  const isAtLimit = wordCount >= WORD_LIMIT;

  return (
    <div className="journal-editor relative w-1/2 h-1/2">
      {/* Toast notification */}
      {showLimitWarning && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          You've reached the {WORD_LIMIT}-word limit.
        </div>
      )}
      
      <Editor
        onInit={(evt, editor) => {
          editorRef.current = editor;
          // initialize word count
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
          branding: false, // removes the tacky watermark
          resize: false,
          
          // custom status bar items
          setup: (editor) => {
            editor.on('init', () => {
              // adds incremental word counter to status bar
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
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Entry
      </button>
    </div>
  );
}