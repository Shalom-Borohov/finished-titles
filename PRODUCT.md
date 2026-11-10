# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Stack

React + TypeScript + Vite, Ionic React forced to iOS mode, Dexie (IndexedDB), `vite-plugin-pwa`, the same stack as the owner's אימונים and תפילות apps. Hosted on GitHub Pages, plus one small Cloudflare Worker that holds the search API keys.

## Users

One person, the owner. They watch anime, series and movies, and read and play, finishing each over days or weeks. They open the app when something ends, usually at the end of the evening on the couch, and sometimes when they remember an old title.

## Product Purpose

A complete personal record of every anime, series, movie, book, game and comic the owner has finished or stopped. Success means the list feels like their own history: anything can be found, how they felt about it is there, and the collection is satisfying to look at and browse.

## Positioning

One private list across every medium, which single-medium sites like Letterboxd, AniList and Goodreads can't be. It has no social features and no account, and it's shaped around logging once at the end, with no progress tracking.

## Operating Context

Logging is rare, roughly once per finished title, so the app is not a daily habit and needn't compete for attention. A log takes under a minute, and there is time for a rating and a line of thought. Browsing and stats are the rewards. Installed as an iPhone Home Screen web app.

## Capabilities and Constraints

- Types: anime, series, movies, books, games, comics, and Other.
- Status: finished or stopped. There is no in-progress or want-to-watch list.
- Search fills in poster, year and type; manual entry is always available. Comics and Other are manual.
- One entry per show, with an optional seasons-watched number. Stopped entries record why, and shows also record the season.
- Rating words, optional: אהוב במיוחד, אהבתי מאוד, אהבתי, היה בסדר, לא אהבתי.
- Optional note. Finish date is an exact date, a year, or blank.
- A stats screen: totals by type, titles per year, rating breakdown, finished versus stopped.
- Data lives on the device, with a JSON backup file. The list works offline; search needs a connection.
- Hebrew UI, full RTL. Titles stay in English or romanized form, so every screen mixes RTL and LTR text.

## Brand Commitments

- Name: כותרים. Folder and repo: `finished-titles`.
- Voice: quiet and factual, a private record, not a coach.
- Must feel at home as an iPhone app.

## Evidence on Hand

- Single-user tool: no testimonials, customers or metrics exist, and none should be invented.
- Posters come from third-party sources at runtime; design mockups use labelled placeholder artwork.

## Product Principles

1. The collection is the reward: browsing what you've finished should feel good, since logging itself is rare.
2. Your words, not a score: ratings are how it felt, in plain Hebrew.
3. Honest history: blanks and stopped titles are allowed, and nothing gets invented to fill a form.
4. Never blocked: if search, a date or a rating isn't available, you can still log the title.

## Accessibility & Inclusion

Touch targets of at least 44pt; follows the system text size where Ionic allows. Rating words must stay readable without relying on colour.
