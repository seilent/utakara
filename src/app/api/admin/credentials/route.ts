import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateEnvFile } from '@/lib/env-utils';

const DEFAULT_PASSWORD = "admin";

export async function POST(request: NextRequest) {
  const session = await getSession(request);

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newUsername, newPassword } = await request.json();

    // Verify current password against env or default
    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    if (currentPassword !== adminPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    // Update credentials in .env file
    const success = await updateEnvFile(newUsername, newPassword);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Credentials updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}