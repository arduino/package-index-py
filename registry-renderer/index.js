import { load } from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';

const REGISTRY_FILE_PATH = "../librarylist.yaml";
const REPO_DESCRIPTION_PATH = "../description.md";
const TARGET_PATH = "../README.md";

function getLibraryListFromYaml(path) {    
    try {
        return load(readFileSync(path, 'utf8')).libraries;
    } catch (e) {
        console.log(e);
    }
}

function getMarkdownFromLibraryList(libraryList) {
    const libraryData = libraryList.map(library => {
        const properties = Object.values(library)[0];
        let entry = `### ${properties.name}\n${properties.description}  \n\n`;
        entry += `🌐 **URL:** ${properties.url}  \n`;
        entry += `✍️ **Author:** ${properties.author}  \n`;
        entry += `📜 **License:** ${properties.license}  \n`;
        entry += `🏷️ **Tags:** ${properties.tags.join(', ')}  \n`;
        return entry;
    }).join("\n<hr />\n");
    return `## 📚 Libraries\n${libraryData}`;
}

function writeMarkdownFile(descriptionPath, targetPath, markdownLibraryList) {
    const registryDescription = readFileSync(descriptionPath, 'utf8');
    const content = `${registryDescription}\n\n${markdownLibraryList}`;
    writeFileSync(targetPath, content);
}

const libraryList = getLibraryListFromYaml(REGISTRY_FILE_PATH);
const markdownLibraryList = getMarkdownFromLibraryList(libraryList);
console.log(markdownLibraryList);
writeMarkdownFile(REPO_DESCRIPTION_PATH, TARGET_PATH, markdownLibraryList);
