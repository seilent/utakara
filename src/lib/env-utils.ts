import { promises as fs } from 'fs';
import path from 'path';

export async function updateEnvFile(newUsername: string, newPassword: string) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    const updatedContent = envContent
      .replace(/^ADMIN_USERNAME=.*$/m, `ADMIN_USERNAME=${newUsername}`)
      .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${newPassword}`);
    
    await fs.writeFile(envPath, updatedContent);
    return true;
  } catch (error) {
    console.error('Error updating .env file:', error);
    return false;
  }
}