# Feed Search Bar — Design Spec

**Date:** 2026-04-26

## Summary

Replace the tag-chip filter on the feed page with a text search bar that searches across all user content (username, about, tags) via a MongoDB regex query. Sort chips are kept. The page stays fully server-rendered; a small client component handles debounced URL navigation.

---

## Architecture

The feed page (`src/app/feed/page.tsx`) remains a Next.js server component. A new client component `SearchInput` owns the text input and URL navigation. The server reads `?q=` from search params, applies a MongoDB `$or` regex filter, and returns results as before.

**Data flow:**

1. User types in `SearchInput`
2. After 300 ms debounce, `router.push(/feed?q=<term>&sort=<sort>)` fires
3. Server re-renders with filtered users from MongoDB
4. Left panel updates; selected user (`?u=`) is preserved if still in results

---

## Components

### `SearchInput` (new — `src/app/feed/SearchInput.tsx`)

- `"use client"` component
- Controlled `<input type="search">` with `placeholder="Search people…"`
- Reads initial value from `?q=` via `useSearchParams()` so the field is populated on load
- 300 ms debounce via `useRef` timeout before calling `router.push`
- Calls `feedHref({ q, sort })` — a utility that builds the URL string

### `feed/page.tsx` changes

- Add `q` to `Search` type
- When `q` is non-empty, add `$or` regex clause to MongoDB query (case-insensitive, across `username`, `about`, `tags`)
- Remove `allTagsRaw` distinct query
- Remove `selectedTag` param, query branch, and all tag chip rendering
- Replace tag chips section in JSX with `<SearchInput q={q} sort={sort} />`

### `globals.css` changes

- Add `.search-input` style: full-width, border using `--cream-border`, background `--cream`, ink color, amber focus ring — consistent with existing form inputs

---

## MongoDB Query

**No search term** (empty or missing `q`):
```js
{ isVerified: true, isHidden: false, isAdmin: false }
```

**With search term:**
```js
{
  isVerified: true,
  isHidden: false,
  isAdmin: false,
  $or: [
    { username: { $regex: q, $options: "i" } },
    { about:    { $regex: q, $options: "i" } },
    { tags:     { $regex: q, $options: "i" } },
  ]
}
```

`q` is trimmed before use. Empty string after trim → no filter applied.

---

## What Is Removed

- `allTagsRaw` distinct query
- `selectedTag` URL param and all related logic
- Tag chip rendering (both "All" chip and per-tag chips)
- `query.tags` filter branch

---

## Error Handling

- Regex special characters in `q` are escaped before being passed to MongoDB to avoid query errors.
- If `q` results in zero matches, the existing empty-state message ("No profiles match this filter.") is shown.

---

## Out of Scope

- Pagination
- Result ranking / relevance scoring
- Highlighting matched terms in results
