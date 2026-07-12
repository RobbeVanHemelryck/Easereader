# Easereader

Simple web app to search EPUB books and send them to your ebook device via email profiles.

## Run

### npm start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Open: http://localhost:3000

Set `SOURCE` to the hostname of an Anna's Archive-compatible source to use the
search and slow-download strategy (for example, `SOURCE=example.org`). Without
`SOURCE`, Easereader keeps using its original search/download strategy.

You can also set the `SOURCE` constant near the top of `server.js`. A non-empty
constant takes precedence over the environment variable; leave it empty or
`null` to use `process.env.SOURCE`.

Selectable source URLs are defined in `BOOK_SOURCE_OPTIONS` near the top of
`server.js`. Add or remove `{ label, url }` entries there to change the choices
shown under Settings > Book sources. The browser stores the active strategy and
one selected URL per strategy in local storage.

### Docker (published image)
1. Pull image:
   ```bash
   docker pull taltiko/easereader
   ```
2. Run container:
   ```bash
   docker run --rm -p 3000:3000 -v easereader-config:/config taltiko/easereader
   ```
3. Open: http://localhost:3000

## Sender/Profile setup
1. Open Settings.
2. Add a Sender (SMTP account that sends emails).
3. Add a Profile (device email + sender to use).
4. Use profile buttons on search results to send books.

Note: your device/service may require sender whitelisting.

## Screenshots

### Desktop
![Desktop](docs/desktop.png)

### Settings
![Settings](docs/settings.png)

### Mobile
![Mobile](docs/mobile.png)
