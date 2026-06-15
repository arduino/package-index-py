# Contributing to Arduino MicroPython Package Index
​
## Adding a package to the MicroPython Package Index
​
If you would like to make a package available for installation via the MicroPython Package Index, just submit a
[pull request](https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests)
that adds the repository URL to [the list](package-list.yaml). You are welcome to add multiple packages at once.
​
### Using the Interactive Tool (Recommended)

If you have Node.js installed, you can use our interactive CLI tool to automatically add your package to the index. It will automatically fetch metadata from GitHub and sort the list for you:

1. Clone this repository to your local machine.
2. Run `npm install` inside the `tools/` folder.
3. Run `node tools/add-entry.mjs` and follow the interactive prompts.
4. Review the generated changes in `package-list.yaml`.
5. Propose your changes via a Pull Request.

### Using the GitHub Web Interface
​
If you prefer not to download the repository, you can edit the file manually via the GitHub web interface:

1. Open this link to fork this repository and edit the list via the
   GitHub web interface: https://github.com/arduino/package-index-py/edit/main/package-list.yaml
1. Click the <kbd>Fork this repository</kbd> button.
1. Add the an [aptly formatted](#package-entry-example) section at the bottom of `package-list.yaml`. 
1. Check that indentation follows the previous sections.
1. Click the <kbd>Commit changes</kbd> button.
1. In the **"Comparing changes"** window that opens, click the <kbd>Create pull request</kbd> button.
1. Add a meaningful title.
1. Fill in the description which will be used for review.
1. Click the <kbd>Create pull request</kbd> button.
​
​
### Package entry example
```yaml
- name: Arduino Modulino
  url: https://github.com/arduino/arduino-modulino-mpy
  author: Arduino
  description: A MicroPython library to control Arduino Modulinos.
  docs: https://github.com/arduino/arduino-modulino-mpy/blob/main/docs/api.md
  tags: ["sensors", "actuators"]
  license: Mozilla Public License Version 2.0
```
​
​
Your entry will be automatically checked for correct formatting as soon as the pull request is submitted. If no problems were found, the pull request will be reviewed as quickly as possible.
Please allow for a bit of time on our end since this process is currently manual.
​
If there are any formatting errors, they will be reported in the Pull Request thread.
Please check your entry if this is the case.
​
​
## Changing the URL of a package already in MicroPython Package Index
​
Submit a pull request that changes the URL as desired in [package-list.yaml](package-list.yaml). This can be done by
following [the instructions above](#instructions).
​
Since this type of request must be reviewed by a human maintainer, please write an explanation in the pull request
description, making it clear that the URL is intentionally being changed.
​
## Removing a package from MicroPython Package Index
​
Submit a pull request that removes the URL from [package-list.yaml](package-list.yaml). This can be done by following
[the instructions above](#instructions).
​
Since this type of request must be reviewed by a human maintainer, please write an explanation in the pull request
description, making it clear that the URL is intentionally being removed or changed.
​
## Report a problem with MicroPython Package Index
​
This repository is not an appropriate place to request support or report problems with a package. Check the package's
own documentation for instructions.
​
If the problem is about something else, please submit an issue report [here](https://github.com/arduino/package-index-py/issues/new).
