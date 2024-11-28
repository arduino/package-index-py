import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

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

        if (isPackageJson || isManifestPy) {
          const packageInfo = {
            name: path.basename(dir),
            docs: constructGitHubUrl(gitHubUrl, currentBranch, repositoryRoot, dir),
            index: indexUrl,
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
if (process.argv.length < 5) {
  // Note: Official MicroPython lib index is: https://micropython.org/pi/v2
  // Example usage: node create-index.mjs ../micropython-lib/micropython micropython-lib.yml https://micropython.org/pi/v2
  console.error('Usage: node create-index.mjs <directory> <outputFilename.yml> <indexUrl>');
} else {
  const directory = process.argv[2];
  const outputFilename = process.argv[3];
  const indexUrl = process.argv[4];

  searchPackages(directory, outputFilename, indexUrl);
}
