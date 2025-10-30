'use client';

import Link from 'next/link';
import React from 'react';
import { UserAuth } from '../context/AuthContext';

const Navbar = () => {

    const { user, googleSignIn, logOut, loading } = UserAuth();
    const [isSigningIn, setIsSigningIn] = React.useState(false);

    const handleSignIn = async () => {
        try {
            setIsSigningIn(true);
            await googleSignIn();
        } catch (error) {
            console.log(error);
        }finally {
            setIsSigningIn(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await logOut();
        } catch (error) {
            console.log(error);
        }
    };

    if (loading) {
        return (
            <div className='h-20 w-full border-b-2 flex items-center justify-between p-2'>
                <div>Loading...</div>
                <Link href="/">RINDFUL</Link>
            </div>
        );
    }

    return (
        <div className='h-20 w-full border-b-2 flex items-center justify-between p-2'>
            <ul className='flex'>
                <li className = 'p-2 cursor-pointer'>
                    <Link href="/">RINDFUL</Link>
                </li>
                {!user ? null : (
                <li className = 'p-2 cursor-pointer'>
                    <Link href="/dashboard">Dashboard</Link>
                </li>
                )}
            </ul>
            {!user ? (
                <ul className='flex'>
                    <li onClick={handleSignIn} className = 'p-2 cursor-pointer'>
                        {isSigningIn ? 'Signing In...' : 'Login'}
                    </li>
                    <li onClick={handleSignIn} className = 'p-2 cursor-pointer'>
                        {isSigningIn ? 'Signing In...' : 'Register'}
                    </li>
                </ul>
            ) : (
               <div className = 'text-right'>
                <p className='text-lg font large'>
                    Welcome, {user.displayName}
                </p>
                <p className='p-2 cursor-pointer' onClick={handleSignOut}>
                    Logout
                </p>
               </div>
            )}
        </div>
    );
};

export default Navbar;