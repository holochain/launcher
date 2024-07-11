import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { downloadFile } from './utils.mjs';

const packageJSON = readFileSync('package.json');
const packageJson = JSON.parse(packageJSON);

const targetDir = join('resources', 'default-apps');

// Ensure the target directory exists
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

const defaultApps = packageJson.defaultApps;

const getFileName = (appName) => (appName === 'kando' ? `${appName}.webhapp` : `${appName}.happ`);

const downloadAllFiles = async () => {
  const downloadPromises = Object.entries(defaultApps).map(([appName, appUrl]) => {
    const fileName = getFileName(appName);
    return downloadFile(appUrl, targetDir, fileName);
  });

  await Promise.all(downloadPromises);
};

const main = async () => {
  try {
    await downloadAllFiles();
    // Add a small delay to ensure all file operations are complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Operation completed successfully.');
  } catch (err) {
    console.error('Error downloading files:', err);
    process.exit(1);
  }
};

main();
