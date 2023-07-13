import { load } from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';

const REGISTRY_FILE_PATH = "./package-list.yaml";
const REPO_DESCRIPTION_PATH = "./description.md";
const TARGET_PATH = "./README.md";

/**
 * Reads the library list from the YAML file and returns it as a JavaScript object.
 * @param {String} path 
 * @returns an Object representing the library list
 */
function getLibraryListFromYaml(path) {    
    try {
        return load(readFileSync(path, 'utf8')).libraries;
    } catch (e) {
        console.log(e);
    }
}

/**
 * Turns the properties of the library list into a Markdown string.
 * @param {Object} libraryList 
 * @returns A string containing the library list in Markdown format
 */
function getMarkdownFromLibraryList(libraryList) {
    const libraryData = libraryList.map(library => {
        let entry = `### ${library.name}\n\n${library.description}  \n\n`;
        
        if(library.url) {
            entry += `- 🌐 **URL:** ${library.url}  \n`;
        }        
        if(library.author) {            
            entry += `- 👤 **Author:** ${library.author}  \n`;
        }
        if(library.license) {
            entry += `- 📜 **License:** ${library.license}  \n`;
        }
        if(library.tags) {
            entry += `- 🏷️ **Tags:** ${library.tags.join(', ')}  \n`;
        }

        if(library.verification){
            entry += "- ✅ **Verification:**\n";
            let verification = library.verification.map(verification => {
                const libraryVersion = verification.library_version ? ` v${verification.library_version}` : "";
                return `    - Verified${libraryVersion} with \`${verification.fqbn}\` on MicroPython v${verification.micropython_version}`;
            }).join("\n");
            entry += `${verification}\n`;
        }
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

console.log("📚 Rendering library list...");
const libraryList = getLibraryListFromYaml(REGISTRY_FILE_PATH);
const markdownLibraryList = getMarkdownFromLibraryList(libraryList);
writeMarkdownFile(REPO_DESCRIPTION_PATH, TARGET_PATH, markdownLibraryList);
console.log("✅ Done");
