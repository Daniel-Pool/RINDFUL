'use client';

import { useState, useEffect } from 'react';
import { getDailyEntry, updateEnergy } from '../utils/db';

export default function EnergyScale({ selectedDate }) {
    const [selectedEnergy, setSelectedEnergy] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = selectedDate || new Date().toISOString().split('T')[0];

    const energyLevels = [
        { emoji: '💤', value: 1, label: 'Exhausted' },
        { emoji: '😴', value: 2, label: 'Low Energy' },
        { emoji: '🟡', value: 3, label: 'Okay' },
        { emoji: '⚡', value: 4, label: 'Energetic' },
        { emoji: '🔥', value: 5, label: 'Very Energized' },
    ];

    // check database for existing energy entry, assuming users can only enter once per day
    useEffect(() => {
        // get energy entry for the day using call from database
        const fetchEnergy = async () => {
            try {
                const entry = await getDailyEntry(today);
                if (entry && entry.energy) {
                    setSelectedEnergy(entry.energy);
                }
            } catch (error) {
                console.error('Error fetching energy:', error);
            }

            setLoading(false);
        };
        
        fetchEnergy();
    }, [today]);

    // save/update the energy level, again using call from database
    const handleEnergySelect = async (value) => {
        setSelectedEnergy(value);

        try {
            await updateEnergy(today, value);
        } catch (error) {
            console.error('Error updating energy:', error);
            alert('Failed to save energy level');
        }
    };

    // while database is being checked
    if (loading) return <p>Loading energy...</p>;

    return (
        <div className="flex flex-col items-center gap-3 mt-6">
            <h2 className="text-lg font-semibold text-gray-500">
                {selectedEnergy ? 'Your energy today:' : 'How is your energy level today?'}
            </h2>

            <div className="flex gap-3">
                {energyLevels.map((lvl) => (
                    <button
                        key={lvl.value}
                        onClick={() => handleEnergySelect(lvl.value)}
                        className={`text-3xl transition transform hover:scale-110 ${
                            selectedEnergy === lvl.value 
                            ? 'opacity-100 drop-shadow' 
                            : 'opacity-50'
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