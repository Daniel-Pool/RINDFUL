'use client';

import { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase';

const db = getFirestore(app);
const auth = getAuth(app);

// mood selector
export default function MoodSelector() {
    // value picked by user (1-5)
    const [selectedMood, setSelectedMood] = useState(null);

    // loading
    const [loading, setLoading] = useState(true);

    // today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // array for mood choices
    // emojis used as placeholders for the graphics
    const moods = [
        { emoji: '⚫', value: 1, label: 'Very Low' },
        { emoji: '🔴', value: 2, label: 'Low' },
        { emoji: '🟠', value: 3, label: 'Neutral' },
        { emoji: '🟡', value: 4, label: 'Good' },
        { emoji: '🟢', value: 5, label: 'Great' },
    ];

    // check Firebase for existing mood entry
    // assuming users only can enter once per day for now
    useEffect(() => {
        const fetchMood = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            // get the mood entry for today
            const q = query(
                collection(db, 'moodEntries'),
                where('userId', '==', user.uid),
                where('date', '==', today)
            );
            
            // use mood value of existing record (if it exists)
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setSelectedMood(data.moodValue);
            }
            
            setLoading(false);
        };

        fetchMood();
    }, []); // should run once

    // save/update a mood
    const handleMoodSelect = async (value) => {
        setSelectedMood(value);
        const user = auth.currentUser;
        if (!user) return;

        // check if user already has mood entry again
        const q = query(
            collection(db, 'moodEntries'),
            where('userId', '==', user.uid),
            where('date', '==', today)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // update existing entry
            const docRef = doc(db, 'moodEntries', snapshot.docs[0].id);
            await updateDoc(docRef, { moodValue: value });
        } else {
            // add new entry
            await addDoc(collection(db, 'moodEntries'), {
                userId: user.uid,
                date: today,
                moodValue: value,
                timestamp: new Date(),
            });
        }
    };

    // while firestore is being checked
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