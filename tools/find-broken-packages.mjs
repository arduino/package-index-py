// This script helps to find packages in the Arduino package index that are missing the package.json file.
// Without the package.json file, the package cannot be installed using mpremote or the Arduino Package Installer.

import yaml from 'js-yaml';

function convertToRawURL(url, suffix = null) {
    url = url.replace('https://github.com/', '');
    const parts = url.split('/');
    const owner = parts[0];
    const repoName = parts[1];
    const branch = 'HEAD';
    let path = parts[2] ? "/" + parts[2] : '';
    if (suffix) {
        path += "/" + suffix;
    }
    return `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}${path}`;
}

const indexURL = "https://raw.githubusercontent.com/arduino/package-index-py/refs/heads/main/package-list.yaml";
const data = await fetch(indexURL);
const doc = yaml.load(await data.text());

// Filter packages that have the package_descriptor field
// which overrides the package.json file
doc.packages = doc.packages.filter(pkg => pkg.package_descriptor == undefined);
doc.packages.map(pkg => {
    // Convert the URLs to https://raw.githubusercontent.com/... format
    pkg.rawURL = convertToRawURL(pkg.url, 'package.json');
    return pkg;
});

let incompletePackages = [];

// Check the existence of the package.json file for each package
for (const aPackage of doc.packages) {
    const response = await fetch(aPackage.rawURL);
    if (!response.ok) {
        incompletePackages.push(aPackage.url);
        console.log(`❌ Package file ${aPackage.rawURL} not found.`);
    } else {
        console.log(`✅ Package file ${aPackage.rawURL} found.`);
    }
}

console.log("\n👀 Packages with missing package.json:");
console.log(incompletePackages);
const message = `
Consider making pull requests to add a package.json file to these repositories
or add the package_descriptor field to the package in the package-list.yaml file
`;
console.log(message);