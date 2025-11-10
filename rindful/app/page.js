'use client';

import React from 'react';
import { UserAuth } from './context/AuthContext';

export default function Home() {
  const { user, googleSignIn, loading } = UserAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleGetStarted = async () => {
    try {
      setIsSigningIn(true);
      await googleSignIn();
    } catch (error) {
      console.log(error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className='text-center mb-16'>
        <h3 className="text-2xl font-light tracking-wider p-2 text-green-400">Welcome to,</h3>
        <h1 className="text-7xl font-extrabold tracking-widest text-orange-400 p-2">RINDFUL</h1>
        <h4 className="text-2xl font-normal italic tracking-widest text-orange-300 p-2 mb-8">
          Helping You Get Better, One Slice at a Time
        </h4>
        
        <div className="max-w-4xl mx-auto mt-8">
          <p className="text-xl text-gray-600 leading-relaxed">
            RINDFUL is your all-in-one companion for daily mental wellness and organization. 
            Our intuitive dashboard connects you directly to the tools you need to plan, reflect, and track your progress.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
          📝 Seamless Reflection & Tracking
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-semibold text-green-600 mb-4">✍️ Private Daily Journaling</h3>
            <p className="text-gray-700 mb-6">
              Capture your thoughts and feelings effortlessly with a journal that supports your journey.
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span><strong>Focused Entry:</strong> Write one meaningful journal entry per day</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span><strong>Prompt Support:</strong> Receive helpful mental health-related prompts to guide your reflection</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span><strong>Automatic History:</strong> Time and date stored instantly, building a private Journal History</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-semibold text-blue-600 mb-4">📈 Simple Mood Scale</h3>
            <p className="text-gray-700 mb-6">
              Quickly check in with yourself and build powerful emotional awareness.
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Precise Tracking:</strong> Use the 1-10 Mood Scale for detailed emotional scoring</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Flexible Logging:</strong> Record your mood once or twice daily to capture emotional shifts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
          🗓️ Organized Wellness & Productivity
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow col-span-full max-w-lg mx-auto">
            <h3 className="text-2xl font-semibold text-purple-600 mb-4">🧘 Structured Wellness Planning</h3>
            <p className="text-gray-700 mb-6">
              Look ahead and ensure self-care is a non-negotiable part of your life.
            </p>
            <ul className="space-y-3 text-gray-600">

              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Planner:</strong> Input custom events alongside dedicated wellness activities</span>
              </li>

              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                 <span><strong>Time Management:</strong> Add and adjust activities</span>
              </li>
              
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Goal Execution:</strong> Todo List Feature to format events into checklists</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            📊 Insightful Progress & Analytics
          </h2>
          <p className="text-xl text-gray-700 text-center mb-8">
            Move beyond simply tracking data—understand your patterns and celebrate your consistency.
          </p>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Your Personal Analytics Hub</h3>
            <p className="text-gray-600 text-center mb-8">
              Access a dedicated Analytics Tab that clearly visualizes your growth and habits.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-indigo-600 text-lg font-semibold mb-2">Mood Patterns</div>
                <p className="text-gray-600 text-sm">
                  View your average mood scale over five weeks and see typical moods for specific days
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-green-600 text-lg font-semibold mb-2">Consistency Score</div>
                <p className="text-gray-600 text-sm">
                  See Journal Completion History over five weeks to maintain your reflection habit
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-orange-600 text-lg font-semibold mb-2">Productivity Metrics</div>
                <p className="text-gray-600 text-sm">
                  Track efficiency with average daily task completion rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 mb-8">
        <button 
          onClick={handleGetStarted}
          disabled={isSigningIn || loading}
          className="bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningIn ? 'Starting Your Journey...' : 'Start Your Journey Today'}
        </button>
      </div>
    </main>
  );
}