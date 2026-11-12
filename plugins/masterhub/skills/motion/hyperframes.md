# HyperFrames: how to work

HyperFrames is a free engine (Apache 2.0 license): it takes an HTML page with GSAP animation and records it to MP4 frame by frame in a headless browser. The version this skill was checked on is 0.8.205. You need Node 22+ and ffmpeg.

## Installation (no global flags)

In the project folder (not a system one):

```
npm install hyperframes gsap
```

Run through `npx hyperframes <command>` from this folder. If npx should not download extras, add `--no-install`.

## Browser

HyperFrames uses Chrome. The headless build chrome-headless-shell is more reliable: it opens no windows. Install it with `npx hyperframes browsers install chrome-headless-shell@stable --path ./browsers` (if your version has no such command, see `npx hyperframes --help`) and give its path in the environment variable `HYPERFRAMES_BROWSER_PATH`.

On Windows the engine starts an ordinary Chrome as `chrome.exe --version`, and that can open a visible window. So do not run the `doctor` command without a set browser.

To turn off statistics, the update check and self-installing extras, set environment variables before the commands:
`HYPERFRAMES_NO_TELEMETRY=1`, `HYPERFRAMES_NO_UPDATE_CHECK=1`, `HYPERFRAMES_NO_AUTO_INSTALL=1`, `HYPERFRAMES_NO_OPTIONAL_INSTALL=1`, `HYPERFRAMES_SKIP_SKILLS=1`.

## Commands

- `init <name> --example blank --resolution portrait --non-interactive --skip-skills --skip-transcribe`: a project blank.
- `lint <folder>`: checks the markup rules.
- `validate <folder>`: console errors and contrast in a headless browser.
- `snapshot <folder> -o <where> --at 0,1.5,... --no-end`: PNG frames and contact sheets.
- `render <folder> -o file.mp4`: render.

## How a video is built

- Root: `data-composition-id="main"`, `data-duration`, `data-width`, `data-height`. Every timed element: `class="clip"`, `data-start`, `data-duration` (in seconds).
- One GSAP line: `gsap.timeline({paused:true})` and `window.__timelines["main"] = tl`. No `Date.now`, random numbers, timers or `repeat:-1`.
- Do not change `display` and `visibility` of a `.clip`: animate nested elements. Do not move `top`, `left`, `width`; for movement use `x`, `y`, `scale`, `opacity`.
- GSAP is a file in the project (`assets/gsap.min.js` from `node_modules/gsap/dist/`), not a CDN link.
- Fonts: the built-in ones are Latin only. For Russian: `@font-face { font-family: "Ru"; src: local("Segoe UI Black"); }` (on Mac any bold system font with Cyrillic, for example `local("Helvetica Neue Bold")`).
- A scene is a function of time `t`: the same frame on every run. This makes the render repeatable.

## What breaks

| What | Cause | Fix |
|---|---|---|
| A Chrome window opens on `doctor` or `render` | an ordinary Chrome starts as `chrome.exe --version` | a headless browser through `HYPERFRAMES_BROWSER_PATH` |
| Frames are static, all words visible at once | `assets/gsap.min.js` was not copied | `validate` says "404 loading assets/gsap.min.js"; always read its output |
| Letters of two scenes stuck together | the previous scene's text leaves after the next one enters | finish the text exit before the new entrance |
| `lint`: gsap_non_transform_motion | `top` was animated | replace with `y` |
| `lint`: gsap_repeated_fromto_without_baseline | two `fromTo` on one element | a warning; if there are problems, `immediateRender:false` on the later ones |
| A shell command broke off | a long `cat <<EOF` with quotes inside | create files with an editor or a write tool |
| `init` or `render` print EISDIR (link ... owner.pid) | Windows does not allow a hard link to a folder | harmless: the blank and the MP4 are created, only the statistics record is lost |

## Load on the computer

Rendering is heavy. Run one process, not several. Render big scenes with motion blur one at a time. A parallel render in pieces on a weak laptop will hang the system.
