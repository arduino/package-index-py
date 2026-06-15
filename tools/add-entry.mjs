import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import readline from 'readline';

/**
 * A CLI tool designed to interactively append a new MicroPython package entry 
 * to the `package-list.yaml` index. It prompts the user for package details 
 * while smart-fetching repository metadata (like name, description, author, 
 * and license) directly from the GitHub API using a provided URL. Finally, 
 * it avoids duplicates and sorts the package list alphabetically.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("Adding a new entry to package-list.yaml...");
  
  const packageListPath = path.resolve(process.cwd(), 'package-list.yaml');
  
  if (!fs.existsSync(packageListPath)) {
    console.error(`Error: Could not find package-list.yaml at ${packageListPath}`);
    process.exit(1);
  }

  let fileContent = '';
  let doc = { packages: [] };
  try {
    fileContent = fs.readFileSync(packageListPath, 'utf8');
    doc = yaml.load(fileContent) || { packages: [] };
  } catch (err) {
    console.error(`Error parsing package-list.yaml: ${err.message}`);
    process.exit(1);
  }

  let url = "";
  while (!url) {
    const inputUrl = await question("URL (required): ");
    if (!inputUrl) {
      console.error("Error: URL is required.");
      continue;
    }
    
    try {
      new URL(inputUrl); // Validate format
    } catch (_) {
      console.error("Error: Invalid URL format. Please provide a valid HTTP/HTTPS URL.");
      continue;
    }

    try {
      process.stdout.write(`Verifying existence of ${inputUrl}... `);
      const response = await fetch(inputUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        console.log(`\nError: URL returned status ${response.status} (${response.statusText}). Repository might not exist or is private.`);
        continue;
      }
      console.log("OK!");

      // Check for duplicates
      const isDuplicate = doc.packages.some(pkg => pkg.url && pkg.url.toLowerCase() === inputUrl.toLowerCase());
      if (isDuplicate) {
        console.error(`Error: The URL '${inputUrl}' already exists in package-list.yaml.`);
        continue;
      }

      url = inputUrl;
    } catch (error) {
      console.log(`\nError: Could not reach URL. ${error.message}`);
      continue;
    }
  }

  let defaultName = "";
  let defaultAuthor = "";
  let defaultLicense = "";
  let defaultDescription = "";

  const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/);
  if (githubMatch) {
    defaultAuthor = githubMatch[1];
    defaultName = githubMatch[2];
    try {
      process.stdout.write(`Fetching repo metadata from GitHub... `);
      const apiRes = await fetch(`https://api.github.com/repos/${defaultAuthor}/${defaultName}`, {
        headers: { 'User-Agent': 'Node.js' }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.license) {
          defaultLicense = (data.license.spdx_id && data.license.spdx_id !== 'NOASSERTION') ? data.license.spdx_id : data.license.name;
        }
        if (data.description) {
          defaultDescription = data.description;
        }
      }

      const userRes = await fetch(`https://api.github.com/users/${defaultAuthor}`, {
        headers: { 'User-Agent': 'Node.js' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.name) {
          defaultAuthor = userData.name;
        }
      }
      console.log("Done.");
    } catch (e) {
      console.log(`Failed (${e.message}). Proceeding anyway.`);
    }
  }

  const nameInput = await question(`Name${defaultName ? ` [${defaultName}]` : ' (required)'}: `);
  const name = nameInput.trim() || defaultName;
  if (!name) {
    console.error("Error: name is required.");
    process.exit(1);
  }

  const descInput = await question(`Description${defaultDescription ? ` [${defaultDescription}]` : ' (required)'}: `);
  const description = descInput.trim() || defaultDescription;
  if (!description) {
    console.error("Error: description is required.");
    process.exit(1);
  }

  const authorInput = await question(`Author${defaultAuthor ? ` [${defaultAuthor}]` : ' (required)'}: `);
  const author = authorInput.trim() || defaultAuthor;
  if (!author) {
    console.error("Error: author is required.");
    process.exit(1);
  }

  const tagsInput = await question("Tags (comma separated, optional): ");
  const licenseInput = await question(`License${defaultLicense ? ` [${defaultLicense}]` : ' (optional)'}: `);
  const license = licenseInput.trim() || defaultLicense;
  const docs = await question("Docs URL (optional): ");

  // Create the new entry
  const newEntry = {
    name,
    url,
    author,
    description
  };

  if (tagsInput.trim()) {
    newEntry.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
  }
  
  if (license.trim()) {
    newEntry.license = license.trim();
  }
  
  if (docs.trim()) {
    newEntry.docs = docs.trim();
  }

  doc.packages.push(newEntry);

  // Sort alphabetically by name (case-insensitive)
  doc.packages.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const yamlContent = yaml.dump(doc, {
    lineWidth: -1,
    noRefs: true,
    flowLevel: 3
  });

  try {
    fs.writeFileSync(packageListPath, `---\n${yamlContent}`);
    console.log(`\nSuccessfully added '${name}' to package-list.yaml!`);
  } catch (error) {
    console.error(`Error saving package-list.yaml: ${error.message}`);
  }

  rl.close();
}

main();
