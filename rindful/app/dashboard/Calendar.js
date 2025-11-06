'use client';

import { useState, useEffect } from 'react';

// calendar (fixed sun-sat ver)
export default function Calendar() {
    // past 7 days - consider this a placeholder
    const [weekDays, setWeekDays] = useState([]);

    useEffect(() => {
        // get current day
        const today = new Date()

        // find last sunday (sunday = 0)
        const dayOfWeek = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);

        // set up array for week/7 consecutive days
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            return d;
        });
        // save array to state
        setWeekDays(days);
    }, []); // run once on mount

    const today = new Date();

    return (
        <div className="grid grid-cols-7 gap-3 mt-1">
            {weekDays.map((day, i) => {
                // compare this day to today
                const isToday = day.toDateString() === today.toDateString();
                const isFuture = day > today;

                // choose background color based on relation to today
                const bgClass = isToday
                    ? 'bg-emerald-400 text-white'
                    : isFuture
                    ? 'bg-amber-100 text-gray-800'
                    : 'bg-amber-100 text-gray-800';

                return (
                    <div
                        key={i}
                        className={`h-15 w-15 flex flex-col items-center justify-center rounded-lg shadow-inner font-semibold ${bgClass}`}
                    >
                        <span className="text-sm">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>

                        <span className="text-lg">{day.getDate()}</span>
                    </div>
                );
            })}
        </div>
    );
}