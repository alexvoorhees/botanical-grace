# BOTANICAL GRACE 8 — Kimiko Site

## Quick Reference

- **Framework:** Astro 6 (SSG) + Tailwind CSS 4
- **Node:** >=22.12.0
- **Dev:** `npm run dev` (localhost:4321)
- **Build:** `npm run build` → `./dist/`
- **Deploy:** Auto via GitHub Actions on push to `main` → GitHub Pages

## Architecture

### i18n
- File-based routing: `/ja/...` and `/en/...` mirrors
- Root `/` redirects to `/ja/`
- UI strings in `src/i18n/ui.ts`, translation helper `t(lang, key)` in `src/i18n/utils.ts`
- Language detection and URL switching in `src/i18n/languages.ts`

### BASE_URL Pattern
Astro's `BASE_URL` is `/Kimiko_Site` (no trailing slash). Every file that builds URLs must use:
```ts
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// then: `${base}/${lang}/path/`
```
Never concatenate `base` directly with a lang prefix — always include the `/` separator.

### Content Collections
- Defined in `src/content.config.ts` with glob loader
- Custom `generateId` prefixes IDs with language folder to avoid duplicates (e.g., `ja-therapist`, `en-therapist`)
- Collections: `courses`, `herbs`, `articles`, `testimonials`, `teacher`
- Each collection has `ja/` and `en/` subdirectories with Markdown files

### Design System
- **Colors:** Sage green (#4A7C59), earth brown (#8B6F47), gold accent (#C4A35A), off-white bg (#FAFAF5)
- **Fonts:** Noto Sans JP (Japanese), Inter (English) — loaded via Google Fonts in BaseLayout
- **Style:** Generous whitespace, rounded corners, card-based layouts, botanical/wellness aesthetic
- Custom Tailwind theme defined in `src/styles/global.css`

## Key Conventions

- All page files follow the same URL construction pattern with `base` and `lang` variables
- Dynamic routes (courses, herbs, articles) use `[slug].astro` with `getStaticPaths()` filtering by language
- Components are language-agnostic — they receive `lang` as a prop or derive it from the URL
- Contact form uses Formspree (placeholder ID — needs real one before launch)
