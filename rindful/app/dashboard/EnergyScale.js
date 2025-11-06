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

// energy scale (should be same design as moodscale)
export default function EnergyScale() {
    const [selectedEnergy, setSelectedEnergy] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    const energies = [
        { emoji: '💤', value: 1, label: 'Exhausted' },
        { emoji: '😴', value: 2, label: 'Low Energy' },
        { emoji: '🟡', value: 3, label: 'Okay' },
        { emoji: '⚡', value: 4, label: 'Energetic' },
        { emoji: '🔥', value: 5, label: 'Very Energized' },
    ];

    // load user's energy entry for today
    useEffect(() => {
        const fetchEnergy = async () => {
            const user = auth.currentUser;
            if (!user) return setLoading(false);

            const q = query(
                collection(db, 'energyEntries'),
                where('userId', '==', user.uid),
                where('date', '==', today)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setSelectedEnergy(snapshot.docs[0].data().energyValue);
            }

            setLoading(false);
        };
        
        fetchEnergy;
    }, []);

    // save to firestore
    const handleEnergySelect = async (value) => {
        setSelectedEnergy(value);

        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, 'energyEntries'),
            where('userId', '==', user.uid),
            where('date', '==', today)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docRef = doc(db, 'energyEntries', snapshot.docs[0].id);
            await updateDoc(docRef, { energyValue: value });
        } else {
            await addDoc(collection(db, 'energyEntries'), {
                userId: user.uid,
                date: today,
                energyValue: value,
                timestamp: new Date(),
            });
        }
    };

    if (loading) return <p>Loading energy...</p>;

    return (
        <div className="flex flex-col items-center gap-3 mt-2">
            <h2 className="text-lg font-semibold text-gray-800">
                {selectedEnergy ? 'Your energy today:' : 'How is your energy level today?'}
            </h2>

            <div className="flex gap-3">
                {energyLevels.map((lvl) => (
                    <button
                        key={lvl.value}
                        onClick={() => handleSelect(lvl.value)}
                        className={`text-3xl transition transform hover:scale-110 ${
                            selectedEnergy === lvl.value ? 'opacity-100 drop-shadow' : 'opacity-50'
                        }`}
                        title={lvl.label}
                    >
                        {lvl.emoji}
                    </button>
                ))}
            </div>

            {selectedEnergy && (
                <p className="text-sm text-gray-600 mt-1">
                    You selected: {energyLevels.find((l) => l.value === selectedEnergy)?.label}
                </p>
            )}
        </div>
    );
}