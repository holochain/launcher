import { createWriteStream, chmodSync, unlink } from 'fs';
import { join } from 'path';
import https from 'https';

const fetchFile = (url, file) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          https
            .get(redirectUrl, (redirectResponse) => {
              handleResponse(redirectResponse, file, resolve, reject);
            })
            .on('error', reject);
        } else if (response.statusCode === 404) {
          reject(new Error('No file found at the given URL'));
        } else {
          handleResponse(response, file, resolve, reject);
        }
      })
      .on('error', reject);
  });
};

const handleResponse = (response, file, resolve, reject) => {
  const totalSize = parseInt(response.headers['content-length'], 10);
  let downloadedSize = 0;
  let lastLoggedSize = 0;

  response.pipe(file);
  response.on('data', (chunk) => {
    downloadedSize += chunk.length;
    if (downloadedSize - lastLoggedSize >= 10 * 1024 * 1024) {
      console.log(
        `Downloaded ${(downloadedSize / (1024 * 1024)).toFixed(2)} MB, ${(totalSize - downloadedSize) / (1024 * 1024).toFixed(2)} MB remaining`,
      );
      lastLoggedSize = downloadedSize;
    }
  });
  response.on('end', resolve);
  response.on('error', reject);
};

export async function downloadFile(url, targetDir, fileName) {
  const destinationPath = join(targetDir, fileName);
  const file = createWriteStream(destinationPath);
  console.log(`Fetching ${fileName} from `, url);

  try {
    await fetchFile(url, file);
    file.close(() => {
      console.log(`${fileName} saved successfully.`);
    });
    chmodSync(destinationPath, 511);
  } catch (err) {
    unlink(destinationPath, () => {});
    console.error(err.message);
  }
  console.log(`Download process for ${fileName} completed.`);
}
