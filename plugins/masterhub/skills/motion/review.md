# Checking the video

The cycle repeats until every scene gets 9 and above, or until the score does not grow for two rounds in a row.

1. `lint` and `validate` (see `hyperframes.md`): zero errors, warnings read.
2. Frame snapshots: the start, the middle of each scene, the moment scenes overlap, the end. They lie in `_work/frames/`. Look at the contact sheet with your eyes.
3. Text overlaps, cutting at the edge, text outside the safe zone, an empty bottom of the frame, readability at a width of 360 px: by program (`validate`, `snapshot`) and by eye.
4. Score every scene from 1 to 10: the idea without sound · composition · movement · typography · rhythm. As a table in the video's `README.md`.
5. Write down the three worst places, fix them, render again, look at the frames again.
6. In the report: the path to the video, the length, the render time, the scores by round, doubts with timecodes.

## Render and sound checks (after a video by Igor Brekhov)

- **A short trial.** Before the full render, render about 120 frames and look. A mistake at the start shows up in seconds, not in an hour.
- **Watch the file size.** If a full render came out without a picture or suspiciously small, it is a defect. Render in ranges and compare the size of every piece.
- **Loudness.** Measure with the ffmpeg filter `ebur128`: voice about -14 LUFS, peak not above -1 dBFS. Music about 20 dB quieter than the voice.
- **Frame sheet.** For a long video build a contact sheet (the `tile` filter, a 4x4 or 6x6 grid) and look at it instead of the whole video.
- **Sound in place.** Every noticeable hit of motion has a sound; loudness does not fight the speech. More: `montage.md`.

Do not write "fixed" without a new render and a look at the frames.
