# BOTANICAL GRACE 8

Website for BOTANICAL GRACE 8 (ボタニカルグレイス8) — Kimiko Matsuno's herb & aromatherapy certification school in Akasaka, Tokyo.

**Live site:** https://alexvoorhees.github.io/Kimiko_Site/

## Tech Stack

- **Astro 6** — static site generator, zero JS by default
- **Tailwind CSS 4** — utility-first styling with custom botanical theme
- **i18n** — file-based routing (`/ja/...` and `/en/...`) with shared UI string translations
- **GitHub Pages** — deployed via GitHub Actions on push to `main`
- **Formspree** — contact form backend (needs real form ID)

## Project Structure

```
src/
├── components/         # Reusable Astro components (Header, Footer, cards, etc.)
├── content/            # Markdown content collections (ja + en)
│   ├── articles/       # Health/wellness column articles (3 × 2 langs)
│   ├── courses/        # Certification course pages (6 × 2 langs)
│   ├── herbs/          # Herb directory entries (24 × 2 langs)
│   ├── teacher/        # Instructor profile (1 × 2 langs)
│   └── testimonials/   # Student testimonials (5 × 2 langs)
├── i18n/               # Language definitions, UI strings, translation helpers
├── layouts/            # BaseLayout (HTML shell, fonts, meta)
├── pages/              # File-based routes
│   ├── index.astro     # Root redirect → /ja/
│   ├── ja/             # Japanese pages
│   └── en/             # English pages
└── styles/             # Global CSS + Tailwind theme
```

## Pages

| Route | Description |
|:------|:------------|
| `/` | Redirects to `/ja/` |
| `/{lang}/` | Homepage — hero, course cards, articles |
| `/{lang}/courses/` | Course listing |
| `/{lang}/courses/{slug}` | Individual course detail |
| `/{lang}/herbs/` | Herb directory (24 plants) |
| `/{lang}/herbs/{slug}` | Individual herb page |
| `/{lang}/voice` | Student testimonials |
| `/{lang}/column/` | Health articles listing |
| `/{lang}/column/{slug}` | Individual article |
| `/{lang}/teacher` | Instructor profile |
| `/{lang}/for-corporations` | Corporate training info |
| `/{lang}/contact` | Contact/registration form |

## Commands

| Command | Action |
|:--------|:-------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Remaining Work

- [ ] Replace placeholder Formspree form ID with real one
- [ ] Add real images (course photos, herb images, instructor photo)
- [ ] Content review by Kimiko (Japanese accuracy)
- [ ] Configure custom domain (botanicalgrace8.com) when ready
- [ ] SEO: JSON-LD structured data, Open Graph tags
- [ ] Lighthouse audit and performance optimization
