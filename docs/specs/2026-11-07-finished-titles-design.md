# סיימתי: design

A personal iPhone PWA that records every anime, series, movie, book, game and comic its owner has finished or stopped. This file is the source of truth for product behaviour. New behaviour is added as a new numbered decision: "(added YYYY-MM-DD, extends/clarifies N)".

## Decisions

### What gets recorded

1. **Types are anime, series, movies, books, games, comics and Other.** Why: these are what the owner finishes. Documentaries count as movies or series and audiobooks as books. Other covers anything else.
2. **Status is finished or stopped.** There is no want-to-watch or in-progress status. Why: the owner logs once, when something ends, so there is nothing to keep up to date.
3. **One entry per show.** A finished series or anime has an optional seasons-watched number. A new season updates the existing entry. Why: the grid stays free of near-duplicates. The cost is one rating for the whole show.
4. **Any type can be stopped.** Stopped entries have an optional reason in the owner's words. Series and anime also have an optional stopped-at season. Other types can mention where they stopped in the reason. Why: abandoned books and games are part of the history too, without extra fields to fill in.
5. **Season fields apply only where they fit.** Seasons-watched is kept only for finished series and anime, stopped-at season only for stopped series and anime, and the reason only for stopped entries. Saving normalises away anything else, so changing the type or status leaves no stale values.
6. **Ratings are words, and optional:** אהוב במיוחד, אהבתי מאוד, אהבתי, היה בסדר, לא אהבתי. Why: the owner asked for how it felt rather than a score, with a way to mark true favourites. Optional so a half-remembered title never blocks logging.
7. **The note is optional free text.**
8. **The finish date is an exact date, a year, or blank.** It defaults to today, and future dates are not allowed. Why: right after finishing, no extra tap is needed; for old titles, blank is more honest than an invented year.
9. **A title is required, and nothing else is.** Why: PRODUCT principle "Never blocked". Type and status always have a value.

### Finding and adding titles

10. **Search fills in the poster, year and type, with manual entry always available.** Search covers anime, series, movies, books and games. Comics and Other are manual. Why: search coverage for comics is uneven, and a search failure must never block logging.
11. **Anime, series and movies come from TMDB, books from Open Library, and games from IGDB.** TV animation from Japan is suggested as anime; everything else keeps TMDB's movie or series type. The type stays editable on the form.
12. **AniList is not used.** Its terms prohibit competing list or tracker services, with no personal-use exception found. TMDB also gives one record per show, which matches decision 3 with no season grouping. Decided by the owner on 2026-11-06. This replaces the idea of grouping AniList's per-season records.
13. **Searching for a logged title opens the existing entry.** Results already in the list are marked "כבר ברשימה". A match is the same source and source ID. A manual entry matches on type plus title, ignoring case and surrounding spaces. Why: this is how decision 3 stays true.
14. **There is no rewatch count and no bulk backlog mode.** Old titles go through the normal add flow, decided by the owner.
36. **A TMDB source ID includes its media type,** such as `movie/1396` and `tv/1396`. Why: TMDB numbers movies and shows separately, so the bare number can name two different titles (added 2026-11-07, clarifies 13).
38. **A manual entry matching an existing title shows a hint with a way to open it, and can still be saved.** Why: different titles can share a name, and PRODUCT principle "Never blocked". The hint isn't shown when editing (added 2026-11-07, clarifies 13).
39. **New entries start as finished, with the current list's type, or movie outside a type list.** Why: most logging happens when something ends (added 2026-11-07, clarifies 9).
40. **The release year from search shows on the form. Manual entries have no poster or year field.** Why: comics and Other stay quick to log (added 2026-11-07, clarifies 10).
41. **Search covers every source wherever it was opened,** in the order TMDB, Open Library, IGDB, keeping at most 8, 5 and 5 results. Why: the type stays editable, and a wrong list must not hide a title (added 2026-11-07, extends 25).
42. **Until game search is on, the Games list still opens search,** with manual entry one tap away, so nothing changes in the flow once it's on (added 2026-11-07, clarifies 29).
43. **Search queries are 2 to 100 characters.** The field stops at 100. Why: a basic limit on upstream calls (added 2026-11-07, extends 25).

### Screens

15. **The app opens on Home: one tile per type, with its count and up to three recent posters.** Other is a slim row beneath them. Under the name, a line reads "מה שראיתי, קראתי ושיחקתי" with the total. Why: the owner chose to see the whole collection at a glance, across every medium.
16. **Tapping a type opens its list:** a three-column poster grid, newest first, with search and filters for all, finished and stopped. Stopped titles stay in the grid, dimmed, with their stopped label. Entries are sorted by finish date, newest first, with year-only dates after exact dates of that year, blank dates last, and later-added entries first on a tie.
17. **A list can search inside its type, and Home opens an all-titles list.** A search field on Home, or tapping the total, opens the same poster grid across every type, newest first. Why: the owner may not remember a title's type and wants to see what they finished lately across everything. Decided by the owner on 2026-11-07, replacing per-type search only.
18. **Tapping a poster opens the same form as adding, with a delete button set apart from the rest.** Deleting asks for confirmation.
19. **The tabs are בית, סטטיסטיקה and הגדרות.**
20. **Stats show:** totals by type, titles per year, the rating breakdown, and finished versus stopped. The chart shows the six most recent years that have titles. Older and undated titles are stated beneath it. They count everywhere except the chart (reworded 2026-11-07: the rating and status counts should cover every title).
21. **Settings hold:** backup export and restore, the TMDB attribution (decision 28), and the version.
51. **A Home tile fans its three most recent titles, and a title with no poster shows its coloured placeholder.** A type with fewer titles shows only those, and an empty type shows none. Why: comics and Other have no posters, and empty cards read as content that isn't there (added 2026-11-07, clarifies 15).
52. **The add and edit sheet closes with Cancel or Save, not by swiping down or tapping outside it.** Why: a stray gesture mustn't lose what was typed. Open gap: check this feels right on an iPhone (added 2026-11-07, clarifies 18).
53. **A poster's label shows the seasons watched only from two up.** Long labels stay on one line and truncate. Why: a single season says little in a small grid, and it was what got cut off (added 2026-11-07, clarifies 3 and 16).
44. **The search field on Home opens the all-titles list without focusing its search,** so typing takes a second tap. Why: iOS commonly won't open the keyboard after a route change. Open gap: check this on an iPhone, and focus it if iOS allows (added 2026-11-07, clarifies 17).

### Data

22. **All entries live on the device in IndexedDB, with a JSON backup file.** There is no account. Why: this matches the owner's other apps and keeps the list private.
23. **The backup format is versioned, and new fields must be optional** so old backups still import. Restoring replaces the whole list after confirmation.
24. **The list works offline; adding by search needs a connection.** When search fails, the add screen says so and offers manual entry.
37. **A failed save or delete says so.** A short message appears and the form stays open with what was typed, so it can be tried again. Why: otherwise the button appears to do nothing (added 2026-11-07, extends 22).
45. **Restored entries are normalised like saved ones.** Why: a hand-edited or older file can't store fields decision 5 rules out (added 2026-11-07, clarifies 5 and 23).
46. **A backup is restored whole or not at all.** An invalid or newer file leaves the list untouched and says so. Why: a partial restore would quietly lose titles (added 2026-11-07, clarifies 23).
47. **The future-date rule applies to the form only; restore keeps dates as they are.** Why: a restore must never alter history (added 2026-11-07, clarifies 8 and 23).
48. **Search with no results and at least one source failing says search is unavailable,** not that nothing was found. Why: the owner shouldn't conclude a title doesn't exist (added 2026-11-07, clarifies 24).

### Search service and third-party terms

25. **A small Cloudflare Worker holds the API keys and combines the sources:** `GET /search?q=...` returns `{ results, unavailable }`. One failing source doesn't fail the search; it's listed in `unavailable`. Why: GitHub Pages is static and the repo is public, so keys can't live in the client.
26. **The Worker only serves the app's own origins.** Why: a basic guard against other sites using the keys. Cloudflare's example CORS code isn't copied as is, because it reflects the Worker's own origin and lets callers choose the upstream.
27. **Posters are loaded from the source and never saved in the database or backup.** The entry stores the poster's URL. The service worker may cache images for up to 30 days. Offline, a poster that isn't cached shows a coloured placeholder with the title. Why: TMDB's terms limit caching to 6 months. Decided by the owner on 2026-11-06. Title and year are stored as the owner's own record, and whether TMDB's limit reaches those is unclear.
28. **Settings show TMDB's logo and the notice its terms require:** "This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."
29. **IGDB's terms still need reading before game search is switched on.** The Worker skips IGDB until its credentials exist. Open gap: `api-docs.igdb.com` refused automated reading on 2026-11-06.

35. **Each search source has an 8-second deadline.** A source that misses it is listed in `unavailable`, and the rest still return. Why: one hung source must not hang the whole search (added 2026-11-07, extends 25).
49. **A request with no `Origin` header is refused too** (added 2026-11-07, clarifies 26).
54. **The search service's address is committed in `.env.production`.** Why: GitHub Pages builds the app from the repo, so an address kept only on the laptop leaves search unavailable on the phone. The address isn't secret, because the TMDB token stays in the Worker (added 2026-11-08, clarifies 25).
50. **Small posters, on Home tiles and in the add sheet, show the placeholder's colour only,** because a title won't fit (added 2026-11-07, clarifies 27).

### Look and feel

30. **The look is "Soft and light":** a pale lavender ground, white rounded tiles, one violet accent, the Rubik font and a floating rounded tab bar. Chosen by the owner on 2026-11-06. It's light only in this version. Open gap: the owner hasn't been asked about dark mode.
31. **Corners are round throughout.** Why: the owner's stated taste.
32. **Hebrew UI, full RTL, with titles in their English or romanized form.** Titles are set left-to-right inside the RTL layout.
33. **The name is סיימתי, and the folder and repo are `finished-titles`.** Why: the owner chose both because they say what the app is for, after rejecting מדיטק, Media Library and ספריית מדיה. Hebrew names aren't written in English letters, so the folder has its own English name (changed 2026-11-07).
34. **UI first-person wording avoids gender where possible,** for example "בלי תאריך" rather than "לא זוכר".
