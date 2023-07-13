import { load } from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';

const REGISTRY_FILE_PATH = "./package-list.yaml";
const REPO_DESCRIPTION_PATH = "./description.md";
const TARGET_PATH = "./README.md";

/**
 * Reads the package list from the YAML file and returns it as a JavaScript object.
 * @param {String} path 
 * @returns an Object representing the package list
 */
function getPackageListFromYaml(path) {    
    try {
        let libraries = load(readFileSync(path, 'utf8')).packages;
        
        // Sort libraries by name alphabetically
        libraries.sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });

        return libraries;
    } catch (e) {
        console.log(e);
    }
}

/**
 * Turns the properties of the library list into a Markdown string.
 * @param {Object} packageList 
 * @returns A string containing the library list in Markdown format
 */
function getMarkdownFromPackageList(packageList) {
    const libraryData = packageList.map(aPackage => {
        let entry = `### [${aPackage.name}](${aPackage.url})\n\n`;

        if (aPackage.description) {
            entry += `${aPackage.description}  \n\n`;
        }

        entry += "<details><summary>Details</summary>\n";
        entry += "<ul>\n";

        if (aPackage.url) {
            entry += `<li>🌐 <strong>URL:</strong> ${aPackage.url}</li>\n`;
        }
        if (aPackage.author) {
            entry += `<li>👤 <strong>Author:</strong> ${aPackage.author}</li>\n`;
        }
        if (aPackage.license) {
            entry += `<li>📜 <strong>License:</strong> ${aPackage.license}</li>\n`;
        }
        if (aPackage.tags) {
            entry += `<li>🏷️ <strong>Tags:</strong> ${aPackage.tags.join(', ')}</li>\n`;
        }

        if (aPackage.verification) {
            entry += "<li>✅ <strong>Verification:</strong>\n<ul>\n";
            let verification = aPackage.verification.map(verification => {
                const libraryVersion = verification.library_version ? ` v${verification.library_version}` : "";
                return `<li>Verified${libraryVersion} with <code>${verification.fqbn}</code> on MicroPython v${verification.micropython_version}</li>`;
            }).join("\n");
            entry += `${verification}\n</ul></li>\n`;
        }

        entry += "</ul>\n";
        entry += "</details>\n\n";

        return entry;

    }).join("<hr />\n\n");
    return `## 📦 Packages\n${libraryData}`;
}


/**
 * Merges the repo description and the library list into a 
 * single Markdown string and writes it to the target file.
 * @param {String} descriptionPath
 * @param {String} targetPath 
 * @param {Object} markdownLibraryList 
 */
function writeMarkdownFile(descriptionPath, targetPath, markdownLibraryList) {
    const registryDescription = readFileSync(descriptionPath, 'utf8');
    const content = `${registryDescription}\n\n${markdownLibraryList}`;
    writeFileSync(targetPath, content);
}

console.log("📚 Rendering package list...");
const packageList = getPackageListFromYaml(REGISTRY_FILE_PATH);
const markdownLibraryList = getMarkdownFromPackageList(packageList);
writeMarkdownFile(REPO_DESCRIPTION_PATH, TARGET_PATH, markdownLibraryList);
console.log("✅ Done");
