import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const cloneRepository = (url, directory) => {
  try {
    // Clone the repository
    execSync(`git clone ${url} ${directory}`);
    return true;
  } catch (error) {
    console.error(`Error cloning repository: ${error.message}`);
    return false;
  }
};

const getGitHubUrl = (rootPath) => {
  try {
    // Get the GitHub repository URL
    const remoteUrl = execSync('git config --get remote.origin.url', { cwd: rootPath, encoding: 'utf-8' }).trim();

    // Convert SSH format to HTTPS format
    const httpsUrl = remoteUrl.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');

    return httpsUrl;
  } catch (error) {
    console.error(`Error getting GitHub repository URL: ${error.message}`);
    return null;
  }
};

const getCurrentBranch = (rootPath) => {
  try {
    // Get the current branch name
    const branchName = execSync('git branch --show-current', { cwd: rootPath, encoding: 'utf-8' }).trim();
    return branchName;
  } catch (error) {
    console.error(`Error getting current branch: ${error.message}`);
    return null;
  }
};

const getRepositoryRoot = (rootPath) => {
  try {
    // Get the root folder of the repository
    const repositoryRoot = execSync('git rev-parse --show-toplevel', { cwd: rootPath, encoding: 'utf-8' }).trim();
    return repositoryRoot;
  } catch (error) {
    console.error(`Error getting repository root: ${error.message}`);
    return null;
  }
};

const searchPackages = (directory, outputFilename, indexUrl) => {
  const result = { packages: [] };

  const repositoryRoot = getRepositoryRoot(directory);
  const gitHubUrl = getGitHubUrl(repositoryRoot);
  const currentBranch = getCurrentBranch(repositoryRoot);

  if (!repositoryRoot || !gitHubUrl || !currentBranch) {
    return;
  }

  const search = (dir, rootPath) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        search(filePath, rootPath);
      } else {
        const isPackageJson = file === 'package.json';
        const isManifestPy = file === 'manifest.py';
        const packageName = path.basename(dir);

        if(packageName.startsWith("_")) {
          continue; // Skip "private" packages
        }

        if (isPackageJson || isManifestPy) {
          const packageInfo = {
            name: packageName,
            docs: constructGitHubUrl(gitHubUrl, currentBranch, repositoryRoot, dir),
            index: indexUrl,
            author: 'MicroPython',
          };

          if (isManifestPy) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const descriptionMatch = /description="(.*?)"/.exec(content);

              if (descriptionMatch && descriptionMatch[1]) {
                packageInfo.description = descriptionMatch[1];
              }
            } catch (error) {
              console.error(`Error reading ${file}: ${error.message}`);
            }
          }

          result.packages.push(packageInfo);
        }
      }
    }
  };

  const constructGitHubUrl = (baseUrl, branch, repositoryRoot, dirPath) => {
    const relativePath = path.relative(repositoryRoot, dirPath);
    const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize path separators for Windows

    return `${baseUrl}/tree/${branch}/${normalizedPath}`;
  };

  search(directory, repositoryRoot);

  try {
    const yamlData = yaml.dump(result);
    fs.writeFileSync(outputFilename, `---\n${yamlData}`);
    console.log(`YAML file saved to ${outputFilename}`);
  } catch (error) {
    console.error(`Error writing YAML file: ${error.message}`);
  }
};

// Check if command line arguments are provided
if (process.argv.length < 3) {
  // Note: Official MicroPython lib index is: https://micropython.org/pi/v2
  // Example usage: node create-index.mjs micropython-lib.yml
  console.error('Usage: node create-index.mjs <outputFilename.yml>');
} else {
  // Make build directory if it doesn't exist
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }

  if(!fs.existsSync('build/micropython-lib')) {
    cloneRepository("git@github.com:micropython/micropython-lib.git", "build/micropython-lib");
  }
  const directory = "build/micropython-lib";
  const indexUrl = "https://micropython.org/pi/v2";
  const outputFilename = process.argv[2];

  searchPackages(directory, outputFilename, indexUrl);
}
