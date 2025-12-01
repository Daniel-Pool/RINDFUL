'use client';

import React, { useState, useCallback } from 'react';
import { UserAuth } from '../context/AuthContext';
import Calendar from './Calendar';
import MoodScale from './MoodScale';
import EnergyScale from './EnergyScale';
import JournalPage from '../journal/page';
import StreakBadge from '@/components/StreakBadge';

// main dashboard page (should go here after login)
export default function DashboardPage() {
    const [refreshStreak, setRefreshStreak] = useState(0);

    // func to refresh (so streak is correct)
    const triggerStreakRefresh = useCallback(() => {
        setRefreshStreak(prev => prev + 1);
    }, []);

    return (
        <div className="bg-amber-50 min-h-screen">
            <main className="min-h-screen flex flex-col">
                <section className="bg-orange-300 p-4 flex justify-center">
                    <div className="flex flex-row items-start gap-4">
                        <Calendar />
                        <StreakBadge refreshKey={refreshStreak} />
                    </div>
                </section>

                <section className="p-6 flex flex-row gap-6">
                    <div className="w-2/3 bg-white rounded-xl shadow p-6">
                        <JournalPage onChange={triggerStreakRefresh} />
                    </div>

                    <div className="w-1/3 flex flex-col gap-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <MoodScale onChange={triggerStreakRefresh} />
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <EnergyScale onChange={triggerStreakRefresh} />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

// default page - commented out for now just in case
// const Page = () => {
//     const { user, loading } = UserAuth();

//    return (
//        <div className='p-4'>
//            {loading ? (
//                <div>Loading...</div>
//            ) : user ? (
//                <p>
//                    Welcome, {user.displayName}!
//                </p>
//            ) : (
//                <p>
//                    You are not logged in. Please log in to view your profile.
//                </p>
//            )}
//        </div>
//    );
//};

//export default Page;
