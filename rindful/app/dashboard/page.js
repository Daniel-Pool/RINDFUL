'use client';

import React from 'react';
import { UserAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Calendar from './Calendar';
import MoodScale from './MoodScale';

// main dashboard page (should go here after login)
export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-amber-50 flex flex-col">
            <Navbar />
            <section className="p-6 flex flex-col gap-6 items-center">
                <h1 className="text-2xl font-bold text-green-700">
                    Welcome to Your Dashboard
                </h1>
                <Calendar />
                <MoodScale />
            </section>
        </main>
    )
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
