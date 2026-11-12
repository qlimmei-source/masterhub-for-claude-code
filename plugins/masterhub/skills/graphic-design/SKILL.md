---
name: graphic-design
description: Graphic design in any project: presentations, slides, pages, layouts, covers. The order "references, a trial of 3 frames, a reference standard, then everything else"; a grid and spacing on a scale; buttons and badges by one set of rules; a program check before showing; a PNG at every stage. Switches on by itself when something visible is made or edited; call it with /graphic-design or /graphic-design <style>.
argument-hint: "[style name or empty]"
---

# Graphic design: the order of work and layout discipline

The skill holds two things: **the order of work** (the same for any style) and **layout discipline** (spacing, grid, buttons: in numbers, not by eye). The style itself is a separate file in `styles/` next to the project, or a description built from the person's references.

## 1. The order of work

1. **Style.** The person names a style or sends references. Take each reference apart in one line: "which technique, where it goes in our piece". Colors and fonts belong to **the brand of this project** (the brand book, or what the person named); only techniques come from references. The main mistake is copying someone else's style one to one.
2. **Trial: 3 frames**, as different in structure as possible: a start frame, a frame with several equal blocks, a frame with a complex diagram. Show the PNGs and stop until the person answers.
3. **Reference standard.** The person says "I like it": those 3 frames are the standard. Compare every next frame with them; at the end compare the last three with the first three. Put a copy of the standard into `_archive/<date>_approved/`.
4. **Everything else**, in stages of 10-12 frames, with a PNG for every stage. A remark about one frame changes only that frame.
5. **Program check before showing** (section 3). Until it says "no errors", do not show the person.
6. Texts on the frames come only from the person's materials. Do not put invented numbers or facts.

## 2. Layout discipline

Everything below is numbers. Set them as CSS variables at the top of the file and never write a spacing as a number outside the scale.

**Frame and margins** (a 1920x1080 slide; for pages, the same proportions from the width):
- margins left and right: 120 px; from the top to the header: 40 px; footer: the bottom 80 px; only the frame furniture (logo, number, footer) goes into the margin;
- grid: 12 columns, gap 32 px; three equal blocks are 4 + 4 + 4 columns, not "about a third".

**Spacing scale, only these values:** 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px.
- inside a group (title and caption, icon and text): 8-16;
- between groups in one block: 24-32;
- between blocks of a frame: 48-64;
- between the header, the frame title and the content: 64-96;
- proximity rule: what is related stands closer than what is not.

**Fonts: at most 5 sizes on a frame:** 16 (service captions) · 24 (text) · 32 (subtitle) · 56-72 (frame title) · 120-160 (cover). Line height: text 1.35, titles 1.05-1.1. A line of text is no longer than about 60 characters.

**Alignment.** One left edge per frame. Centered only on the cover and on "thank you". Numbers in tables are right-aligned or in a monospaced font.

**Buttons, badges, labels: one set for the whole project:**
- button height 48 px (large 64); inner padding 12 top and bottom, 24 left and right; a press area of at least 44 x 44 px;
- one corner radius per project (0, 4 or 8 px) for all buttons, badges, windows;
- button states: normal, hover, pressed, disabled, all four described at once;
- text contrast on a colored badge is at least 4.5 : 1 (light background, black text).

**The same thing looks the same.** Numbers, captions, labels and icons of one type stand in the same place and size on every frame. A new element goes into the style first (a CSS class), then onto a frame.

## 3. Program check before showing

Write a short script (Puppeteer with headless Chrome) or check by hand on every frame:

1. text lines of two different blocks do not overlap;
2. text does not leave the frame and does not enter the 120 px margin;
3. text is not cut off by a block with `overflow:hidden`;
4. text does not run onto the footer;
5. a badge does not cover the letters of the next line.

Besides the program, look at every PNG with your eyes: a program does not see uneven spacing. Run the browser one at a time so the computer is not overloaded.

## 4. Styles

A new style is a separate file `styles/<name>.md`: what the style is, the person's words about it, techniques, fonts (with licenses), components (button, badge, window), pitfalls, the path to a sample. No style yet: start with step 1 of the order of work.
