# The Museum of Us — Top-Down Pixel RPG

A self-contained browser game rebuilt from the supplied Museum of Us HTML source. It uses plain HTML, CSS, and JavaScript; no framework, build step, or package installation is required.

## Run the game

1. Extract the project folder.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari).
3. Press **Start Exploring** and allow sound if you want the spoken tour.

If your browser blocks local image loading or speech features from a `file://` page, run a simple local server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Move: **WASD** or **Arrow keys**.
- Interact with the curator or an exhibit: **E**, **Space**, or **Enter** when the prompt appears.
- Use the on-screen D-pad and Talk/Look button on touch devices.
- Click the mini-map to walk toward a location.
- Use **Next**, **Back**, and **Replay** for the guided tour. Auto Tour can advance the tour for you.
- Select an exhibit to see its photo enlarged beside the narration.
- Music from the available `assets/music/` tracks starts automatically in Z-to-A filename order at 25% volume. Adjust the volume in the **Jukebox** in the upper-right, switch songs, or select **Add Songs** to add audio files from your device. Added files join the Z-to-A playlist and play during the current visit; the browser does not save them between visits. If the browser blocks audible autoplay, click **Start Exploring** to retry.

## Personalize the museum

Edit `config.js`:

- `developer.email`: developer contact email (currently `ravenvillarante231@gmail.com`).
- `herName` and `yourName`: names shown in the welcome and closing messages.
- `guide.name`: curator's displayed name.
- `guide.voice`: language, rate, pitch, and voice-style preference.
- `musicTracks`: audio files automatically loaded from `assets/music/` and played Z-to-A. Add file paths here to include bundled tracks on every visit.
- `lobby`, `exhibits`, and `finale`: all tour narration, exhibit details, wishes, and the closing letter.

## Add your photos

Place your eight images in `assets/photos/` using these names:

- `photo1.jpg` through `photo5.jpg`, `photo6.jpeg`, and `photo7.jpg` through `photo8.jpg`

Photos stay smooth in their frames and open in a larger preview when selected. The game draws a colored pixel-art placeholder if a photo is missing. Keep the filenames or update each exhibit's `img` value in `config.js`.

## Background music

The paths in `musicTracks` in `config.js` are loaded automatically in Z-to-A filename order at 25% volume. Adjust the level with the Jukebox volume slider, choose any listed song to change the background music, or select **Add Songs** to add audio files from your device for the current visit. To include a track on every visit, place it in `assets/music/` and add its path to `musicTracks` in `config.js`.

## Voice notes

The game uses the browser's built-in Speech Synthesis API. It prefers available English voices whose names commonly indicate a male voice, then falls back to another English / US English voice. Browser and operating-system voice inventories differ, so the exact youthful male voice cannot be guaranteed on every device. If the preferred voice is unavailable, narration text and all game features still work. You can toggle voice at any time.

## Project files

- `index.html` — page structure and game interface.
- `styles.css` — responsive pixel-RPG interface styling.
- `config.js` — names, developer email, voice preference, exhibits, wishes, and letter.
- `game.js` — canvas renderer, movement, collisions, interaction, tour flow, speech, mini-map, and wishes.
- `assets/photos/` — add the eight personal exhibit photographs here.

## Compatibility

Designed for current desktop and mobile browsers with Canvas 2D support. The game is offline-capable after the project files and personal photos are present; speech depends on browser-provided voices.
