'use client';

import Link from 'next/link';
import React, { useEffect, useState} from 'react';
import { UserAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar = () => {
    const router = useRouter();
    const { user, googleSignIn, logOut, loading } = UserAuth();
    const [isSigningIn, setIsSigningIn] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

    React.useEffect(() => {
        if(!loading && user && router.pathname !== '/dashboard') {
            router.push('/dashboard');
            setIsMenuOpen(false);
        }
    }, [user, loading, router]);

    const toggleMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    React.useEffect(() => {
        if(!loading && !user && router.pathname !== '/') {
            router.push('/');
        }
    }, [user, loading, router]);


    const handleSignOut = async () => {
        try {
            await logOut();
            setIsMenuOpen(false);
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
        <div className='w-full'>
        <div className='bg-emerald-400 text-white p-1 flex justify-between items-center'>
            <ul className='flex'>
                <li className = 'p-2 cursor-pointer'>
                    {user ?(
                        <p>RINDFUL</p>
                    ):(
                        <Link href='/'>RINDFUL</Link>
                    )}
                </li>
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

                <div className='relative'>
                    <div className='p-2 cursor-pointer' onClick={toggleMenu}>
                        Welcome, {user.displayName} ▼
                    </div>

                    {isMenuOpen && (

                        <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10'>
                            <Link href='/dashboard' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Dashboard
                            </Link>

                            <Link href='/planner' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Planner
                            </Link>

                            <Link href='/wellness' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Wellness Calendar
                            </Link>

                            <Link href='/profile' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Profile
                            </Link>

                            <Link href='/settings' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Settings
                            </Link>

                            <Link href='/stats' className='block px-4 py-2 hover:bg-gray-200 text-black' onClick={toggleMenu}>
                                Analytics
                            </Link>

                            <hr className='boarder-gray-200' />
                                <p onClick={handleSignOut} className='block px-4 py-2 hover:bg-gray-200 text-black cursor-pointer'>
                                    Logout
                                </p>
                        </div>
                    )}
                </div>     
            )}
        </div>
        </div>
    );
};


export default Navbar;