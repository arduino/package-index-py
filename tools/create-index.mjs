import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

/**
 * Clones a Git repository to a specified directory
 * @param {string} url The URL of the Git repository
 * @param {string} directory The target directory to clone the repository to
 * @returns 
 */
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

/**
 * Gets the GitHub URL of a Git repository from the local filesystem
 * @param {string} rootPath The root path of the Git repository
 * @returns {string} The GitHub URL of the repository
 * @returns {null} If an error occurs
 */
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

/**
 * Gets the current Git branch of a local repository
 * @param {string} rootPath The root path of the Git repository
 * @returns {string} The name of the current branch
 * @returns {null} If an error occurs
 */
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

/**
 * Gets the root folder of a Git repository (the one containing the .git folder)
 * @param {string} aPath The path to a file or directory within the repository
 * @returns {string} The root folder of the repository
 * @returns {null} If an error occurs
 */
const getRepositoryRoot = (aPath) => {
  try {
    // Get the root folder of the repository
    const repositoryRoot = execSync('git rev-parse --show-toplevel', { cwd: aPath, encoding: 'utf-8' }).trim();
    return repositoryRoot;
  } catch (error) {
    console.error(`Error getting repository root: ${error.message}`);
    return null;
  }
};

/**
 * Constructs a GitHub URL for a specific directory in a Git repository.
 * @param {string} baseUrl The base URL of the GitHub repository
 * @param {string} branch The current branch of the repository
 * @param {string} repositoryRoot The root folder of the repository
 * @param {string} dirPath The path to the directory within the repository
 * @returns {string} The GitHub URL for the directory
 */
const constructGitHubUrl = (baseUrl, branch, repositoryRoot, dirPath) => {
  const relativePath = path.relative(repositoryRoot, dirPath);
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize path separators for Windows

  return `${baseUrl}/tree/${branch}/${normalizedPath}`;
};

/**
 * Extracts the description from a manifest.py file
 * @param {string} filePath The path to the manifest.py file
 * @returns {string} The description extracted from the file
 * @returns {null} If an error occurs
 */
function extractDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const descriptionMatch = /description="(.*?)"/.exec(content);

    if (descriptionMatch && descriptionMatch[1]) {
      return descriptionMatch[1];
    }
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Generates a list of packages from directories containing a package.json file
 * @param {string} directory The starting directory to search for packages
 * @param {string} indexUrl The URL of the package index to be assigned to each package
 * @param {RegExp} excludePattern A regular expression to exclude certain directories
 * @returns {string} A YAML representation of the package list as a string
 */
const generatePackageList = (directory, indexUrl, excludePattern) => {
  const result = { packages: [] };

  const repositoryRoot = getRepositoryRoot(directory);
  console.log(`Repository root: ${repositoryRoot} from ${directory}`);
  const gitHubUrl = getGitHubUrl(repositoryRoot);
  const currentBranch = getCurrentBranch(repositoryRoot);

  if (!repositoryRoot || !gitHubUrl || !currentBranch) {
    return;
  }

  const collectPackages = (dir, rootPath) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        collectPackages(filePath, rootPath);
      } else {
        const isPackageJson = file === 'package.json';
        const isManifestPy = file === 'manifest.py';
        const packageName = path.basename(dir);

        if (excludePattern && excludePattern.test(dir)) {
          continue; // Skip excluded packages
        }

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
            const description = extractDescription(filePath, packageInfo, file);
            packageInfo.description = description;
          }

          result.packages.push(packageInfo);
        }
      }
    }
  };

  collectPackages(directory, repositoryRoot);
  return yaml.dump(result);
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
  const excludePattern = /\/unix-ffi\//; // Skip Unix-specific packages

  const packageList = generatePackageList(directory, indexUrl, excludePattern);
  try {
    fs.writeFileSync(outputFilename, `---\n${packageList}`);
    console.log(`YAML file saved to ${outputFilename}`);
  } catch (error) {
    console.error(`Error writing YAML file: ${error.message}`);
  }
}
