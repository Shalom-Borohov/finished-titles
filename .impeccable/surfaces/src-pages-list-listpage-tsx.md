---
version: 1
slug: "src-pages-list-listpage-tsx"
primary_target: "src/pages/list/ListPage.tsx"
related_targets: ["src/pages/entry/EntryForm.tsx","src/pages/settings/SettingsPage.tsx"]
---

Scope: issue #21's additions to three existing screens: the list's rating and genre filters, the form's genre field, and the Settings genre fill. Mode: Operate. This extends the world in the app brief (`src/App.tsx`); DESIGN.md is unchanged.

Audience and job: the owner browsing a list wants every אהוב במיוחד, or every title of one genre, without the filters crowding the posters. Constraints: one rating and one genre at a time (spec 73, 75), only values the list has, 44pt targets, Hebrew RTL.

Chosen direction: picked by the owner on the decision page on 2026-11-15, one round per screen, each from three sketches ranked by the designer rather than dealt. Approved sketches: `.impeccable/mocks/decision/filters-menus.html`, `genres-inplace.html`, `fill-card.html`.

Unresolved: whether the menu pills keep a steady width on iOS when the chosen word changes.

## Direction contract

THESIS: Filtering stays out of the collection's way: the list gains one row, the form one row, Settings one card. It refuses the wall of filter chips stacked above the posters.

OWN-WORLD: The app's own: lavender ground, white pills and cards, navy ink, Rubik, one violet. A chosen filter is a violet pill showing its word. Pills inside a white card take the ground colour, as the stepper buttons do.

STORY: The owner opens a list, taps the rating or genre pill, picks a word from the iPhone's menu, and sees only those posters. On the form, a ז׳אנרים row shows what is ticked and opens in place. In Settings, one tap fills genres for older TMDB titles.

FIRST VIEWPORT: List: back and add buttons, the title with its count, the search pill, the status pills, then one row with two menu pills at the leading edge, rating then genre, each ending in a small chevron. The poster grid starts 14px below.

FORM: "Two menu pills", first of three ranked candidates, with "Opens in place" on the form and "Its own card" in Settings. Standard iOS controls; no new signature move. seed:7b65eb902069c81f

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
