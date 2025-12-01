'use client';

import { deleteConfirmation } from './deleteAccount';

export default function SettingPage() {
  
  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

        <button
        onClick={deleteConfirmation}
        className ={`bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border 
        border-blue-500 hover:border-transparent rounded`}> Delete My Data </button>
    </div>

    </div>
  );
}

