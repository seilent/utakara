'use client';

import { useState } from 'react';

export default function AdminSettings() {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUsername: formData.get('username'),
          newPassword: formData.get('password'),
          currentPassword: formData.get('currentPassword'),
        }),
      });

      if (response.ok) {
        setMessage('Credentials updated successfully');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to update credentials');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      setMessage('An error occurred while updating credentials');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            New Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update Credentials
        </button>
        {message && (
          <p className={`mt-4 ${message.includes('error') || message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}