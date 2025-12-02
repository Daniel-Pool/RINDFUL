'use client';

import React, { useState, useCallback } from 'react';
import { UserAuth } from '../context/AuthContext';
import UnifiedCalendar, { getTodayString } from '../components/UnifiedCalendar';
import PlannerPage from '../planner/page.js';
import MoodScale from './MoodScale';
import EnergyScale from './EnergyScale';
import JournalPage from '../journal/page';
import { useRouter } from 'next/navigation';
import StreakBadge from '@/components/StreakBadge';
import color, { tw } from '@/utils/colors.js'
import StatsPage from '@/stats/page.js';


// main dashboard page (should go here after login)
export default function DashboardPage() {
    const [refreshStreak, setRefreshStreak] = useState(0);

    // func to refresh (so streak is correct)
    const triggerStreakRefresh = useCallback(() => {
        setRefreshStreak(prev => prev + 1);
    }, []);

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
        <div className={`${tw.bg.main} min-h-screen`}>
            <main className={`flex flex-col`}>
                <section className={`${tw.bg.calendar} p-4`}>
                    <div className="flex flex-row items-center gap-4">
                        <UnifiedCalendar
                            mode={calendarMode}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                        />
                    </div>
                </section>

                <section className={`p-6 flex flex-row gap-6`}>
                    <div className={`w-1/3 ${tw.bg.card} rounded-xl shadow p-6 `}>
                        <JournalPage 
                        onChange={triggerStreakRefresh}
                        key={selectedDate}
                        selectedDate={selectedDate}
                        />
                    </div>

                        <div className={`${tw.bg.card} rounded-xl shadow p-6`}>
                            <PlannerPage selectedDate={selectedDate}/>                    
                        </div>

                    <div className={`w-1/3 flex flex-col gap-6`}>
                        <div className={`${tw.bg.card} rounded-xl shadow p-6`}>
                            <MoodScale
                            onChange={triggerStreakRefresh}
                            selectedDate={selectedDate}
                            />
                        </div>

                        <div className={`${tw.bg.card} rounded-xl shadow p-6`}>
                            <EnergyScale 
                            onChange={triggerStreakRefresh}
                            selectedDate={selectedDate}
                            />
                        </div>


                        <div className={`${tw.bg.card} rounded-xl shadow p-6`}>
                            <StreakBadge refreshKey={refreshStreak} />
                            <StatsPage selectedDate={selectedDate} />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

