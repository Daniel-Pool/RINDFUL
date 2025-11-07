'use client';

import React from 'react';
import { UserAuth } from '../context/AuthContext';
import Calendar from './Calendar';
import MoodScale from './MoodScale';
import EnergyScale from './EnergyScale';
import JournalPage from '../journal/page';


// main dashboard page (should go here after login)
export default function DashboardPage() {
    return (
        <div className="bg-amber-50 min-h-screen">
            <main className="min-h-screen flex flex-col">
                <section className="bg-orange-300 p-4 flex justify-center">
                    <Calendar />
                </section>

                <section className="p-6 flex flex-row gap-6">
                    <div className="w-2/3 bg-white rounded-xl shadow p-6">
                        <JournalPage />
                    </div>

                    <div className="w-1/3 flex flex-col gap-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <MoodScale />
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <EnergyScale />
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
