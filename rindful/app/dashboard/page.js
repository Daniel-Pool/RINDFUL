'use client';

import React from 'react';
import { UserAuth } from '../context/AuthContext';

const Page = () => {
    const { user, loading } = UserAuth();

    return (
        <div className='p-4'>
            {loading ? (
                <div>Loading...</div>
            ) : user ? (
                <p>
                    Welcome, {user.displayName}!
                </p>
            ) : (
                <p>
                    You are not logged in. Please log in to view your profile.
                </p>
            )}
        </div>
    );
};

export default Page;
