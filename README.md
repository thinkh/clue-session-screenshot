# CLUE Session Screenshot

This little script takes some exported CLUE sessions (aka provenance graphs) and imports them programmatically
and takes a screenshot of every step/state in the session.

The tool iterates over all JSON files found in the *sessions* directory.
The captured screenshots are then stored in the *screenshots* directory.

The script uses puppeteer to launch a headless Chromium browser and navigates to the app. Currently, the script is
customized to the Vega Gapminder app, but can be easily adapted for other CLUE applications.

## Prerequisite

* Node.js >= v12

## Setup and run

1. `git clone https://github.com/thinkh/clue-session-screenshot`
2. `npm install` -> can take a few minutes as it downloads the headless Chromium (~120 MB)
3. Copy all session JSON files into *session* directory
4. `npm start`
5. Find the captured screenshots for each session in the *screenshots* directory

## Settings

Change the URL to the app and the pathes to the local directories can be changed in the *index.js* file.

## Known issues

Chromium does not work in *Windows Subsystem for Linux* (WSL) due to missing graphical output.
Please setup this repository directly on a native Windows or Linux.
