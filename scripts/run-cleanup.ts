import { cleanupUnusedAudio } from '../src/lib/audio-cleanup';

console.log('Running audio cleanup...');
cleanupUnusedAudio().then(() => {
  console.log('Cleanup complete');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});