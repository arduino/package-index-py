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

async function findLicenseURL(url) {
    const licenseFileURL = convertToRawURL(url, 'LICENSE');
    // Fetch the license file
    const licenseResponse = await fetch(licenseFileURL);
    if (licenseResponse.ok) {
        const licenseText = await licenseResponse.text();
        // Get the first line of the license file
        const license = licenseText.split('\n')[0];
        return license;
    }
    return null;
}

if(process.argv.length < 3) {
    console.error('Usage: node find-license.mjs <GitHub URL>');
    process.exit(1);
}

const license = await findLicenseURL(process.argv[2]);
if (license) console.log(license);