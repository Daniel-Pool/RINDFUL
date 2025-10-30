'use client';

import React from 'react';
import { UserAuth } from '../context/AuthContext';
import JournalEditor  from '../components/JournalEditor';

const Page = () => {
    const { user, loading } = UserAuth();
    
    const handleSaveJournal = (content) => {
        console.log('Journal content to save:', content);
    };

    return (
        <div className='p-4'>
            {loading ? (
                <div>Loading...</div>
            ) : user ? (
                <>
                    <p>
                        Welcome, {user.displayName}!
                    </p>
                    <h2 className="text-2xl font-bold mb-4">My Journal</h2>
                    <JournalEditor
                            onSave={handleSaveJournal}
                            initialValue={"<p></p>"}
                    />
                </>
            ): (null)}

        </div>
    );
};

export default Page;
