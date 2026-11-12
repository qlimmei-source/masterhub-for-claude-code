# Speech editing and sound by motion

The methods are collected from the free course "Editing with AI" by Igor Brekhov (the videos and materials to them). This is a retelling in our own words, not a copy. The numbers are a guide: adjust by eye and ear.

## When you need this file
- A person speaks to the camera in the video, and the speech needs inserts, graphics or sound.
- The video lacks sound: animations move, and there are no sounds.
- You need an order: what to do first, what last, how to check.

Simple editing (remove "um", cut, lay music under) is done by any model. The harder parts (inserts for the literal meaning of a phrase, masks, sound by motion) go as separate steps below.

## Principles
- Check by fact: count, measure, look at the frames. "It seems to have worked" is not accepted.
- Show before redoing: first one scene or 2-3 minutes brought to perfection, then the rest.
- Do not delete or overwrite sources: work with copies.
- Save limits: look at frame sheets (a 4x4 or 6x6 grid), not at the whole video.
- A client's remark goes as a line into the project rules file with the date and their words. Their rule beats the general ones.

## Programs (if speech editing is needed)
| Program | What for | Price |
|---|---|---|
| ffmpeg | cutting, joining, frames, loudness measuring | free |
| whisper (whisper.cpp or faster-whisper, model large-v3) | speech transcript with the time of every word | free |
| DaVinci Resolve | an editing program; the free version accepts a timeline as a file (FCPXML, OTIO, EDL) | free; Studio is paid, script control only in it |
| Auphonic | voice cleaning through a website | paid (some free hours), run only with the client's consent |
| Subscription music libraries (Epidemic Sound, Artlist, Musicbed) | music | paid, run only with the client's consent |

Install programs the usual way from their websites and tell the client exactly what you install. Premiere and After Effects also fit: the timeline can be handed to them the same way, as a file.

## Order of speech editing
1. Material and project: put the sources together, make copies, create the project.
2. Sound: clean the voice, level the loudness.
3. **Speech only.** Cut the speech and show the client, still without graphics.
4. Camera angles (if there are several cameras).
5. The plan of inserts: which words we show, with which scenes.
6. Animations (by `rules.md`).
7. Footage (video inserts), if needed.
8. Music and sounds.
9. Check (`review.md`), show, render on the client's word.

The tracks are always the same: V1 camera, V2 animations, V3 footage. Sound from top to bottom: voice, music, sounds 1-5. Mark every edit with a colored marker on the timeline.

## How to cut speech
- Cut only in silence. Keep pauses up to about 0.2 s, do not cut out breaths.
- A guide: the video is 5-10 % shorter than the source. More and the speech becomes ragged.
- The silence threshold for automatic cutting is about -40 dB.
- An angle holds from 3-4 s. A zoom (crop x1.2) not more often than once in 15 s. At the start of the video a barely visible push-in of 3-4 % is fine.
- Pace of picture change: YouTube every 5-15 s, short vertical videos (Reels, Shorts) every 1-3 s.
- Put footage only under the literal meaning of a phrase, 3-6 s. Your own shooting is better than stock.
- If full-screen animations run longer than about 15 s, keep a small window with the speaker.

## Sound by motion
The idea: a sound should land on the peak speed of the movement, not just "somewhere near".

1. For every noticeable movement find the frame where it is fastest (by the object's position on the frames or by the animation curve).
2. Choose a sound by role (the table below) and place it so that the sound's loudness peak coincides with that frame. If the sound's peak moment is known (for example in a set's catalog), shift the start of the sound by the difference.
3. Mix the loudness by hierarchy: the voice is the main one, movement sounds are quieter, the bed is the quietest.
4. Measure the loudness with ffmpeg (`ebur128`): the result about -14 LUFS, peak not above -1 dBFS.

| Event in the frame | Type of sound | Loudness relative to the voice |
|---|---|---|
| A small element enters | a soft "whoosh" | clearly quieter |
| A big object rolls in, a scene transition | a medium or big "whoosh", a rise | quieter |
| A hit, an accent, the peak moment | a hit, a sub-drop if needed | close to the voice, but not louder |
| An interface appears, a screen touch | a short click, a tick | very quiet |
| A counter, numbers spinning | ticks | very quiet |
| "Done", a notification | a soft signal | quieter |
| Scene background | an ambient bed | about 20 dB quieter than the voice |

Do not repeat the same sound in a row: change the variant. Music is about 20 dB quieter than the voice (voice about -14 LUFS, music about -34), its own track for each chapter.

Igor Brekhov published a free set of 209 sounds for this lesson (whooshes, hits, interface, beds and so on) with a catalog that gives the peak moment of every sound. The terms of the set are in its README: it can be used in your own videos, commercial ones too; it cannot be sold or given away as your own. If you have the set, use the catalog. If not, make do with any sounds you have the rights to.

## Scene recipes for inserts (after a video by Igor Brekhov)
They fit videos where a person speaks and an illustration appears on the screen:
- a word on the full screen (one main word, the rest is air);
- a word next to the person, on a "wall" behind them;
- a word behind the person by a mask (the text hides behind their silhouette);
- a phone with an interface (a live picture instead of the words "in the app");
- glass only for lists (a panel with a thin light edge);
- a chapter title (a number and a name for 2-3 s);
- a timeline that builds up before the eyes;
- before and after by a wipe (but the wipe is an object of the scene, not a template transition).

Every insert is 3-6 s, one change, a caption of up to five words.

## If a sample is given
A request "edit like these three videos that worked" is stronger than "edit a video". First write what the samples have in common (pace, length of shots, titles, sound), show the client, then edit in the same pace and style.

## Render technique
- Render long scenes in ranges, not whole. Compare the size of every piece: an empty or small piece is a defect.
- The program remembers a project by the file path: a new version gets a new file name.
- Motion blur only on short scenes, one process at a time.
- Codecs and bitrates depend on the platform: before publishing, check the platform's requirements.

## What not to do
- Do not collect all logins and passwords into one file. Do not paste keys into someone else's scripts.
- Do not upload the video to a platform and do not send it outside without the client's direct word.
- Do not use private recordings, correspondence and photos of people without their consent.
