---
name: סיימתי
description: A private record of every title finished or stopped, in a calm light room where the posters carry the color.
colors:
  lavender-ground: "#eef0fa"
  surface-white: "#ffffff"
  navy-ink: "#1e2140"
  ink-soft: "#565a7e"
  well: "#dde0ef"
  violet-accent: "#5b4bdb"
  violet-soft: "#e5e2fb"
  violet-deep: "#3f32a8"
  danger: "#b3261e"
  placeholder-lilac: "#d9d4fb"
  placeholder-sky: "#cfe0fa"
  placeholder-blush: "#f7d9e6"
  placeholder-mint: "#d3efe6"
  placeholder-apricot: "#fbe6c8"
  placeholder-mauve: "#e3d9f5"
typography:
  display:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.2
  count:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
  title-field:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
  section-title:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
  item-title:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
  body:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  control:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  group-label:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
  poster-title:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  note:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.25
  tab-label:
    fontFamily: "Rubik, -apple-system, BlinkMacSystemFont, 'Arial Hebrew', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
rounded:
  tile: "28px"
  panel: "26px"
  card: "20px"
  poster: "18px"
  poster-small: "12px"
  bar: "5px"
  pill: "999px"
spacing:
  pill-gap: "6px"
  group-gap: "8px"
  page-stack: "10px"
  tile-gap: "12px"
  sheet-stack: "14px"
  gutter: "16px"
  tab-clearance: "96px"
components:
  type-tile:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.tile}"
    height: "148px"
  fan-poster:
    rounded: "{rounded.poster-small}"
    width: "52px"
    height: "78px"
  other-row:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "48px"
  panel:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.panel}"
    padding: "14px 16px"
  icon-button:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.violet-accent}"
    rounded: "{rounded.pill}"
    size: "48px"
  icon-button-primary:
    backgroundColor: "{colors.violet-accent}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    size: "48px"
  icon-button-stepper:
    backgroundColor: "{colors.lavender-ground}"
    textColor: "{colors.violet-accent}"
    rounded: "{rounded.pill}"
    size: "44px"
  field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "46px"
  text-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  pill:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  pill-selected:
    backgroundColor: "{colors.violet-accent}"
    textColor: "{colors.surface-white}"
  segmented:
    backgroundColor: "{colors.well}"
    rounded: "{rounded.pill}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.group-label}"
    rounded: "{rounded.pill}"
    height: "44px"
  button-soft:
    backgroundColor: "{colors.violet-soft}"
    textColor: "{colors.violet-deep}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-save:
    backgroundColor: "{colors.violet-accent}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-delete:
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    height: "48px"
  sheet:
    backgroundColor: "{colors.lavender-ground}"
    rounded: "{rounded.tile}"
  floating-tab-bar:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.tab-label}"
    rounded: "30px"
    height: "60px"
---

# Design System: סיימתי

## Overview

**Creative North Star: "The Calm Light Room"**

The owner named this style "Soft and light". A whole collection across every medium hangs in a pale, quiet room, and the interface stays back so the posters can be looked at. The app's own surfaces are white and lavender, its ink is navy, and its one accent is violet; the rest of the color on screen comes from the things the owner has actually finished.

This is an iPhone app first: Ionic in iOS mode, a Hebrew right-to-left interface carrying left-to-right titles, phone-width only, and light only for now. Density is relaxed. Logging is rare and browsing is the reward, so controls are large, round and few, and the screens hold plain facts.

The owner rejected black poster grids, for both their structure and their colors. The Home screen is the answer to that rejection: six white tiles, each holding a small fan of recent posters, so the whole collection reads at a glance.

**Key Characteristics:**
- Pale lavender ground with white rounded surfaces and navy ink.
- One violet for action, selection and counts; posters carry the rest of the color.
- Round corners on everything the app draws.
- The rotated three-poster fan on each Home tile is the signature.
- A 44pt floor on every control.
- Light only for now.

## Colors

A tinted, cool neutral room with one violet voice and pictures supplying the rest.

### Primary
- **Quiet Violet** (violet-accent): The only interface accent. Fills the add button, selected pills, the save button and the stats bars; colors counts, cancel and settings actions, the selected tab and the focus ring. It stays readable on white and on the ground.
- **Violet Wash** (violet-soft): The quiet action surface: the manual-entry button, the duplicate hint and the "already listed" badge. Also the text selection color.
- **Deep Violet** (violet-deep): Text on the wash only.

### Neutral
- **Lavender Ground** (lavender-ground): Every page and the sheet, and also the status bar and manifest color. Doubles as the stepper button fill and the empty rating track when it sits on white.
- **Surface White** (surface-white): Tiles, panels, fields, pills, the tab bar. Depth comes mostly from white against lavender.
- **Navy Ink** (navy-ink): Titles, body and poster-placeholder text. Also the tint of the poster shadows and of the sheet backdrop.
- **Soft Ink** (ink-soft): Secondary facts: rating words under posters, totals, placeholders, notes, inactive tabs.
- **Well** (well): The recessed track behind segmented controls, and nothing else.

### Functional
- **Danger Red** (danger): Destructive text and form errors only, never a fill.

### Poster placeholders
- **Six pale tints** (placeholder-lilac, placeholder-sky, placeholder-blush, placeholder-mint, placeholder-apricot, placeholder-mauve): Stand in for a missing or failed poster, chosen from the title so a title always gets the same one. They are the only other hues the app supplies, they stay pale, and they appear only in a poster's silhouette.

### Named Rules
**The Posters Carry the Color Rule.** Posters are the only saturated color outside two functional signals: the violet accent and danger text. Violet marks action, selection, counts and chart bars; it never decorates. No second accent, no colored tile, no colored ground. The one outside exception is TMDB's required attribution logo on settings, which keeps its own colors.

**The Plain Rating Rule.** Rating words are never color-coded. Every rating bar is the same violet and every rating word is ink, so how it felt is read, not decoded.

## Typography

**Display Font:** Rubik (with -apple-system, BlinkMacSystemFont, Arial Hebrew, sans-serif)
**Body Font:** Rubik, the same family

**Character:** One soft-cornered family, self-hosted in Hebrew and Latin subsets at regular, medium and bold. Its round terminals match the room, and it holds mixed Hebrew and English on one line without a visible seam. Numerals are tabular everywhere.

### Hierarchy
- **Display** (700, 2.125rem, 1.2): Page titles, one per screen.
- **Count** (700, 1.375rem): The violet total on each Home tile.
- **Title field** (700, 1.1875rem): The title being edited in the sheet.
- **Section title** (700, 1.0625rem): Panel headings on stats and settings.
- **Item title** (500, 1.0625rem): Tile labels and search result titles.
- **Body** (400, 1rem): Field text and settings actions.
- **Control** (400, 0.9375rem): Pills, segments, secondary facts. **Group label** is its bold twin, heading form groups.
- **Poster title** (500, 0.8125rem, 1.3): Titles under posters, cut to one line with an ellipsis.
- **Note** (400, 0.8125rem, 1.4): Storage and attribution notes.
- **Caption** (400, 0.75rem, 1.25): Rating words under posters, chart year labels, stats notes.
- **Tab label** (400, 0.6875rem): Tab bar labels, bold when selected.

### Named Rules
**The Three Weights Rule.** Regular, medium and bold are the only weights loaded. Hierarchy comes from size and weight in navy; there is no uppercase and no tracking.

**The Foreign Title Rule.** English and romanized titles keep left-to-right direction but sit on the screen's right edge, aligned with the Hebrew around them.

## Layout

A single phone column with 16px gutters and no width breakpoints; columns flex with the screen. Page tops and bottoms respect the safe area, and every tabbed page reserves 96px of bottom clearance so the last row clears the floating tab bar.

Home is a large title with total and add button, a search pill, then a two-column tile grid with 12px gaps and a full-width Other row. Lists are a three-column poster grid (16px between rows, 10px between columns). Stats and settings are stacks of white panels 10px apart. The add and edit sheet is a stack of groups 14px apart, opening from 54px below the safe area so the page behind stays visible at the top.

Reading order runs right to left: the title sits at the right, the add button at the left. Poster aspect is always 2:3.

## Elevation & Depth

Hybrid and mostly flat. White on lavender does most of the work. Soft, downward, navy-tinted shadows appear only on three things: Home tiles, posters, and the floating tab bar. Panels, fields, pills, form rows and icon buttons are flat. The sheet lifts over a 20% navy backdrop with no shadow of its own.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 6px 18px rgba(60, 64, 120, 0.12)`): Home tiles and the floating tab bar.
- **Poster** (`box-shadow: 0 4px 12px rgba(30, 33, 64, 0.16)`): Full-size posters in lists.
- **Fan** (`box-shadow: 0 3px 8px rgba(30, 33, 64, 0.22)`): Each fanned poster, tighter and slightly darker so overlapping posters separate.

Small posters inside the sheet and search results carry no shadow.

### Named Rules
**The Collection Lifts Rule.** Only the collection and the bar floating over it get a shadow. A form row or a data panel stays flat.

## Shapes

Everything the app draws has round corners; this is the owner's stated taste and the shipped build honors it. Radius follows size: tiles and the top of the sheet are the softest (tile), then panels (panel), form cards and search results (card), posters (poster), and small posters and year bars (poster-small). Controls are full pills or circles. Rating tracks are fully rounded at 10px tall (bar).

The sheet's bottom corners are square because it runs off the screen edge. Line icons have round caps and joins, and the grid tab icon's squares are themselves rounded. Ionic's stock alert still shows its own tighter corners, off-white fill and hairline dividers; that is an unthemed default, not a pattern to copy.

### Named Rules
**The No Hard Corner Rule.** A new surface takes a radius from the scale, and a new control is a pill or a circle. If a corner reads as square on screen, it is wrong.

## Components

### Type Tile and Poster Fan (signature)
The Home screen's reason to exist: up to three recent posters fanned on a white tile, so a medium's history is visible before it is opened.
- **Tile:** White, softest radius, ambient shadow, 148px tall, the label at the right and a violet count at the left along the bottom.
- **Fan:** Three 52 by 78px posters overlapping. The newest sits on top on the right, 32px out, turned 10 degrees; the second sits near upright at 2 degrees; the third sits 32px out on the left, turned -9 degrees. Outer posters drop 6px.
- **Fewer posters:** The group shifts so one or two posters stay centered on the tile.
- **Press:** The fan opens, outer posters moving to 38px and 14 and -13 degrees over 240ms on a soft-landing curve, while the tile dims. With reduced motion the fan change is instant.
- **Empty and Other:** A tile with no titles keeps its label and count. Other is a slim 48px white pill with no fan.

The app icon repeats the fan in violet, so the signature starts on the Home Screen.

### Poster
- **Shape:** 2:3, clipped to the poster radius, poster shadow. Small uses (the fan, the sheet, search results) drop to the small radius with no shadow of their own.
- **Stopped titles:** Dimmed to 45% in lists, with the stopped state and season stated in text below.
- **No image:** A pale placeholder tint with the title in navy at the bottom left. Small posters show the tint alone.

### Buttons
- **Shape:** Circles for icons, full pills for words.
- **Primary icon:** The add button, a violet 48px circle with a white plus.
- **Secondary icon:** White circle with a violet icon, such as back. On a white stepper row it becomes a 44px circle in the ground color; disabled, it fades to soft ink at 50%.
- **Save:** A violet pill in the sheet header, 44px tall. Cancel beside it is plain violet text.
- **Soft:** Manual entry, a violet wash pill with deep violet medium text, 52px tall.
- **Delete:** Danger text on no fill, 48px tall, set apart at the bottom of the sheet.
- **Press / Focus:** Pressed controls dim to 65% over 120ms. Focus is a 2px violet ring with a 2px offset. There are no hover states; this is a touch app.

### Pills and Segments
- **Pill:** White, 44px, used for rating words and status filters. Selected is solid violet with white medium text.
- **Segmented:** A 3px well track holding 44px segments. Selected is a white pill with bold ink. Unselected text sits directly on the well.

### Panels and Rows
- **Panel:** White, panel radius, no shadow, 14px by 16px padding, with a section title. Holds stats and settings.
- **Form rows and cards:** White, card radius, flat. The identity card holds a 56px poster, the title field and the type select; the stepper row is 52px and the date row 48px.
- **Duplicate hint:** Violet wash, card radius, deep violet text with a bold action.

### Inputs / Fields
- **Search pill:** White full pill, 46px, soft ink placeholder. The Home version is a link styled the same way.
- **Sheet search:** The same pill with a constant 2px violet border, which replaces the focus ring.
- **Text area:** White, card radius, two rows, no resize.
- **Error:** Danger text below the group; the field itself does not change color.

### Charts
- **Year bars:** Solid violet, small poster radius, 8px minimum height, count above in medium ink and year below in caption.
- **Rating bars:** Violet on a ground-colored 10px track, the word to the right and bold count to the left.

### Navigation
- **Floating tab bar:** A white 60px pill, 16px from each side and 12px above the safe area, ambient shadow, content scrolling beneath it.
- **Tabs:** Soft ink at rest. Selected turns violet with a bold label and a heavier icon: the grid icon fills and line icons thicken from 2.2 to 2.8.
- **Sheet:** Lavender, top corners at the tile radius, flat header with a centered title.

### Icons
Inline line SVGs in currentColor with round caps and joins, 20 to 26px, at stroke weights from 2 to 2.4, always decorative beside a label or an accessible name.

## Do's and Don'ts

### Do:
- **Do** let posters carry the color; keep every ground, tile and panel white or lavender.
- **Do** reserve violet for action, selection, counts and chart bars.
- **Do** give every control at least a 44pt target. Use 48px for standalone icon buttons, 46px for fields, 44px for pills, segments and steppers.
- **Do** take every radius from the scale, and make new controls pills or circles.
- **Do** keep titles left-to-right and aligned to the right edge, and keep them to one line under a poster.
- **Do** use the fan as Home's signature, with its rotations and overlap intact.
- **Do** say stopped and rated states in words as well as any visual treatment.

### Don't:
- **Don't** add a black poster wall or a dark poster-grid ground; the owner rejected both.
- **Don't** introduce a dark theme or dark tokens until the owner decides on one. The app is light only for now.
- **Don't** add a second accent or tint a tile, panel or ground with a saturated color.
- **Don't** color-code rating words or rating bars by sentiment.
- **Don't** use square corners on anything the app draws.
- **Don't** put a shadow on panels, fields, pills or form rows.
- **Don't** use danger red as a fill or for anything but destruction and errors.
- **Don't** load another typeface or weight.
