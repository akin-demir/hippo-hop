# Hippo Hop

A mobile-friendly endless runner with an animated hippo, a lush jungle riverbank, rocks and logs, XP scoring, and a locally saved best score.

## Publish with GitHub Pages

Open Settings → Pages. Under Build and deployment, select Deploy from a branch, then main and / (root), and Save.

Expected address after deployment: https://akin-demir.github.io/hippo-hop/

## Play

Tap the game or press Space / Up to jump. Select Enable motion controls on mobile, grant permission if requested, hold the phone upright, and lift quickly. Adjust shake sensitivity as needed. Motion requires HTTPS and browser/device support. Tap remains available.

Pause with the pause button or Escape. Switching away pauses automatically.

No installation or build is required. Serve index.html and game.js together.

## Progression

Earn XP by running. Speed increases by 20 pixels per second every 100 XP. At 100 XP, taunting monkeys and gorillas join the rocks and logs as jumpable hazards. Restarting resets speed and unlocks.

## Verification

Run `node --check game.js` and `node check-game.cjs` for syntax and simulated milestone, obstacle, collision, pause, and restart checks. Visual appearance still needs browser testing.


JavaScript syntax and simulated logic checks pass for start, jump, no double jump, grounded physics, pause/resume, distance score, best score, and restart at mobile width. Appearance and physical motion controls still need real-browser and real-phone testing.
