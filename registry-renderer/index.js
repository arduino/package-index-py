import { load } from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';

const REGISTRY_FILE_PATH = "../librarylist.yaml";
const REPO_DESCRIPTION_PATH = "../description.md";
const TARGET_PATH = "../README.md";

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
        const properties = Object.values(library)[0];
        let entry = `### ${properties.name}\n\n${properties.description}  \n\n`;
        
        if(properties.url) {
            entry += `🌐 **URL:** ${properties.url}  \n`;
        }        
        if(properties.author) {            
            entry += `👤 **Author:** ${properties.author}  \n`;
        }
        if(properties.license) {
            entry += `📜 **License:** ${properties.license}  \n`;
        }
        if(properties.tags) {
            entry += `🏷️ **Tags:** ${properties.tags.join(', ')}  \n`;
        }
        return entry;
        
    }).join("<hr />\n\n");
    return `## 📚 Libraries\n${libraryData}`;
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
