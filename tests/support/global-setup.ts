import { execSync } from 'child_process';

async function globalSetup() {
  console.warn('🌱 Seeding test users...');
  execSync('pnpm seed:users', { stdio: 'inherit' });
}

export default globalSetup;
