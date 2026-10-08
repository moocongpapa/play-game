# Jelly app icons

Created with the built-in imagegen tool on 2026-10-08, using the existing app's Jelly character as the identity reference. Jelly's lavender ears, white face, pink flower, plum eyes and purple heart dress are preserved. The source illustrations were resized with macOS `sips`; no new runtime dependency is needed.

## Files

- `jelly-app-1024.png`: general-purpose master / downloadable artwork.
- `jelly-app-512.png` and `jelly-app-192.png`: web app manifest icons (`purpose: any`).
- `jelly-app-180.png`: iOS home-screen icon (`apple-touch-icon`).
- `jelly-app-32.png`: browser tab favicon.
- `jelly-maskable-1024.png`: padded master for adaptive icon masks.
- `jelly-maskable-512.png`: Android adaptive icon (`purpose: maskable`).

All images are opaque square PNGs. Do not bake rounded corners into them; the operating system applies its own mask. The maskable variant keeps Jelly's face, ears and hands inside the central safe area. The manifest enables standalone launch; it does not provide offline caching or an App Store package. Existing installed shortcuts may need to be removed and added again to refresh their cached icon. Actual iOS/Android installation still needs a device check.

References: [web app manifest](https://web.dev/learn/pwa/web-app-manifest), [Apple home-screen icons](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

## Generation prompt — general icon

Use case: stylized-concept. Asset type: production-ready mobile home-screen app icon for the existing Korean toddler game '유하의 작은 놀이숲'. Create ONE square, opaque, edge-to-edge icon, preferably 1024 by 1024. Reference image role: character identity and existing soft pastel game palette ONLY. In the supplied app screenshot, Jelly is the lavender-and-white rabbit in a purple dress, shown beside the instruction near the upper left and in the top right. Do not reproduce the screenshot, UI, text, cards, or other objects. Subject: Jelly, a very cute friendly bunny with long upright lavender ears and blush-pink inner ears, a round white face bordered by pale lavender fur, dark plum sparkling oval eyes with tiny white highlights, small pink triangular nose, gentle smiling rabbit mouth, rosy cheeks, one tiny pink flower with a buttery-yellow center on the viewer's right ear near its base. Lavender dress with a small creamy heart on the chest; one rounded paw raised in a welcoming wave. Composition: recognizable oversized head-and-shoulders portrait, straight-on, centered, generous breathing room around both ear tips and waving paw. The complete identifying silhouette including ears and paw fits INSIDE a circle centered at image center with radius 39% of image width so Android circular/squircle masking cannot crop it. Large face stays clear at 48px. Background: full-bleed warm soft lavender with a subtly brighter center, no detailed scenery. Style: premium children's interactive storybook meets soft matte 3D toy, delicately rounded volume, restrained highlights and soft shadows, clean polished edges, not furry or photorealistic. Preserve the recognizable character and gentle pastel palette. No letters, no title, no badge, no border, no rounded outer corners, no phone mockup, no transparency, no watermark, no extra characters.

## Edit prompt — maskable icon

Use case: identity-preserve. Create the Android MASKABLE variant of this exact supplied app icon. Keep the SAME lavender and white rabbit Jelly, exact face, eyes, nose, smile, pink flower on viewer-right ear, purple heart dress, soft 3D storybook material, welcoming pose and warm lavender backdrop. Change ONLY framing: zoom OUT substantially, make the entire existing illustration about 70 percent of its present size, moving its visual center to the CENTER of the square. Add a seamless continuation of the lavender background all around. Both ear tips must start NO HIGHER than 20 percent of image height. Face and waving hand MUST stay inside the CENTRAL 70 percent of the square. A generous lavender border of background is essential for circular Android masking, but do not DRAW a border or frame. Dress may continue softly downward but keep all face, ears and hands within a centered circle of radius 38 percent of image width. One square opaque full-bleed image, high resolution. Do not change the character design, no new objects or text, no rounded corners, no transparency, no UI, no watermark.
