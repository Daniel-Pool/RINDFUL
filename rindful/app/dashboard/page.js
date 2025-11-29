'use client';

import React, { useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import UnifiedCalendar, { getTodayString } from '../components/UnifiedCalendar';
import PlannerPage from '../planner/page.js';
import MoodScale from './MoodScale';
import EnergyScale from './EnergyScale';
import JournalPage from '../journal/page';
import { useRouter } from 'next/navigation';


// main dashboard page (should go here after login)
export default function DashboardPage() {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [calendarMode, setCalendarMode] = useState('week');
    const router = useRouter();

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const toggleCalendarMode = () => {
        router.push('/wellness-calendar');
    };

    return (
        <div className="bg-amber-50 min-h-screen">
            <main className="min-h-screen flex flex-col">
                <section className="bg-orange-300 p-4">
                    <UnifiedCalendar
                        mode={calendarMode}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                    />
                </section>

                <section className="p-6 flex flex-row gap-6">
                    <div className="w-2/3 bg-white rounded-xl shadow p-6">
                        <JournalPage 
                        key={selectedDate}
                        selectedDate={selectedDate}
                        />
                    </div>

                    <div className="w-1/3 flex flex-col gap-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <MoodScale selectedDate={selectedDate}/>
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <EnergyScale selectedDate={selectedDate}/>
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <PlannerPage selectedDate={selectedDate}/>                    
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

