---
name: motion
description: Makes short motion videos in code (HTML + GSAP, rendered to MP4 by the HyperFrames engine) under strict scene rules. A frame list before building, numbers only from the client, a phone-width frame check, a score for every scene. Use when asked for an animation, a motion video, an animated chart, titles, graphics for a video, or inserts for speech editing (sound by motion, editing order). Do not use for image or video generation by a neural network, and not for ordinary website layout.
---

# Motion

A video is built in code: an HTML page + GSAP, rendered frame by frame to MP4. Nothing in this is paid.
Details are in the files next to this one. Read them when you reach the step:

- `rules.md`: rules for scene, look and movement (with numbers in frames).
- `hyperframes.md`: how to install and run the engine, how a video is built, common breakages.
- `review.md`: checking the video and scoring scenes.
- `montage.md`: speech editing and sound by motion.

## Order of work

1. **Idea, then questions.** Find out: what changes on the screen (before, after), words and numbers, format and length, a reference. Ask for what is missing in one message, at most four questions. Format not named: 1920x1080, 30 frames per second, 15 seconds; for a phone, 1080x1920.
2. **Numbers and words come only from the client.** No number: a video without a number. Do not invent reviews, percentages, other companies' logos. Every number in a frame has a source in the video's `README.md`.
3. **Frame list before building.** A `storyboard.md` file next to the video: a table "scene, seconds, main word, caption, what happens (before, after)". Do not write HTML without the frame list. Scene rules: `rules.md`.
4. **Build** by `hyperframes.md`: the project's working folder, GSAP as a file from the project (not from a link), a font with Cyrillic if the text is Russian.
5. **Check before rendering:** `lint`, `validate` (console errors), frame snapshots. Order and scores: `review.md`.
6. **Render** and write down the render time. The result is an MP4 in plain sight; the rest stays in the working folder.
7. **Sound** (if needed): `montage.md`, section "Sound by motion".
8. **Handover:** the path to the MP4, the length, the scene scores, doubts with timecodes. "Done" only after a new render and a look at the frames.

## Main rules

- One scene, one idea, 3-6 s, one main object on 60-70 % of the frame, one change.
- The main word from 120 px, a caption from 34 px, up to five words in a frame. Important things not closer than 60 px to the edge.
- Phone 1080x1920: everything important between 168 and 1330 px of height; below it only background.
- Springs with little settling; an entrance eases out smoothly, an exit is half as long as the entrance. Words come in with a step of about 0.09 s, list items with 0.2 s.
- The result of a step stays from 1.2 s, the final from 2 s. Text does not move while it is being read.
- Scenes overlap by an object, not by text: the text of the previous scene leaves before the next enters.
- One peak moment per video. The first frame is not empty.
- Not allowed: centered text on a gradient, glow, particles, confetti, emoji, clip art, gray placeholders, invented numbers.

## Scoring scenes

Each scene gets 1 to 10 on five axes: the idea without sound, composition, movement, typography, rhythm. The target is 9 and above, or two rounds in a row without growth. Details: `review.md`.

## Common mistakes

The full list with fixes is in `hyperframes.md`, section "What breaks".

- The GSAP script did not load: the frames are static, all words are visible at once. Always run `validate` and look at the frames.
- Text of two scenes in one place during an overlap gives a mess of letters. Text leaves earlier than the next one enters.
- The fonts built into HyperFrames are Latin only. For Russian, use a system font through `@font-face` with `local()`.

## Paid things

Nothing in this skill is paid. If a paid service is needed along the way (image and video generation by a neural network, voice cleaning through a website, music subscriptions, DaVinci Resolve Studio), first name the price and ask for consent. Without a clear "yes" for that run, do not run it.
