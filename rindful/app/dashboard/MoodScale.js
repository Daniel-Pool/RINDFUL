'use client';

import React, { useState, useEffect } from 'react';
import { getDailyEntry, updateMood } from '../utils/db';

export default function MoodSelector({ selectedDate, onChange }) {
    const [selectedMood, setSelectedMood] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = selectedDate || new Date().toISOString().split('T')[0];

    const moods = [
        { emoji: '⚫', value: 1, label: 'Very Low' },
        { emoji: '🔴', value: 2, label: 'Low' },
        { emoji: '🟠', value: 3, label: 'Neutral' },
        { emoji: '🟡', value: 4, label: 'Good' },
        { emoji: '🟢', value: 5, label: 'Great' },
    ];

    // check database for existing mood entry, assuming users can only enter once per day
    useEffect(() => {
        // get mood entry for the day using call from database
        const fetchMood = async () => {
            try {
                const entry = await getDailyEntry(today);
                if (entry && entry.mood) {
                    setSelectedMood(entry.mood);
                }
            } catch (error) {
                console.error('Error fetching mood:', error);
            }
            
            setLoading(false);
        };

        fetchMood();
    }, [today]); 

    // save/update the mood level, again using call from database
    const handleMoodSelect = async (value) => {
        setSelectedMood(value);

        try {
            await updateMood(today, value);

            // trigger streak refresh
            if (onChange) onChange();
        } catch (error) {
            console.error('Error updating mood:', error);
            alert('Failed to save mood');
        }
    };

    // while database is being checked
    if (loading) return <p>Loading mood...</p>;

    return (
        <div className="flex flex-col items-center gap-3 mt-6">
            <h2 className="text-lg font-semibold text-gray-500">
                {selectedMood ? 'Your mood today:' : 'How are you feeling today?'}
            </h2>

            <div className="flex gap-3">
                {moods.map((mood) => (
                    <button
                        key={mood.value}
                        onClick={() => handleMoodSelect(mood.value)}
                        className={`text-3xl transition transform hover:scale-110 ${
                            selectedMood === mood.value
                                ? 'opacity-100 drop-shadow-md'
                                : 'opacity-50'
                        }`}
                        title={mood.label}
                    >
                        {mood.emoji}
                    </button>
                ))}
            </div>

            {selectedMood && (
                <p className="text-sm text-gray-500 mt-1">
                    You selected: {moods.find((m) => m.value === selectedMood)?.label}
                </p>
            )}
        </div>
    );
}