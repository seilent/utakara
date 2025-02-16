'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

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
      setMessage('An error occurred');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block mb-2">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">New Username</label>
          <input
            type="text"
            name="username"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">New Password</label>
          <input
            type="password"
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
          <p className={`mt-4 ${message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}