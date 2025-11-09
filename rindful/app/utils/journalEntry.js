// utility functions for journal entries
export const createJournalEntry = ( content ) => {
    return {
        content: content,
        mood: mood,
        date: new Date().toISOString().split('T')[0],
        wordCount: getWordCount(content),
        timestamp: new Date()
    };
};

const getWordCount = (htmlContent) => {
    // strip HTML tags and count words
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const validateEntry = (entry) => {
    return entry.content && entry.content.trim().length > 0;
};

// clean HTML content
export const cleanContent = (content) => {
    if (!content) return content;

    // remove leading empty paragraphs
    let cleaned = content.replace(/^(<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>)+/gi, '');

    // remove trailing empty paragraphs
    cleaned = cleaned.replace(/(<p>(&nbsp;|\s|<br\s*\/?>)*<\/p>)+$/gi, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
};