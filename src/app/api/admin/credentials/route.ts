import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateEnvFile } from '@/lib/env-utils';

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newUsername, newPassword } = await request.json();

    // Verify current password
    if (currentPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    // Update credentials in .env file
    const success = await updateEnvFile(newUsername, newPassword);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Credentials updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}