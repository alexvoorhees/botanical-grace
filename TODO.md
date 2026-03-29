# BOTANICAL GRACE 8 — Site Improvements & Remaining Work

## Missing from Original Site

These items exist on the current botanicalgrace8.com but were not replicated in the rebuild.

### Content Gaps

- [x] **4 missing testimonials** — Added M.Y (30s, medical professional), H.M (30s, business owner), M.K (30s, office worker), M.T (40s, herbalism instructor) — JA + EN
- [x] **4 missing blog articles** — Added minerals, drug-herb interactions, phytochemicals, nutrition types & functions — JA + EN
- [ ] **Classroom features section** on voice page — Original has 3 highlighted features (AEAJ/JAMHA accreditation, flexible scheduling, 1:1 accessibility) displayed as feature cards alongside testimonials
- [ ] **Privacy policy page** (`/privacy-policy/`) — Original has a full Japanese privacy policy; we have no equivalent page
- [ ] **Specified Commercial Transaction Act page** (特定商取引法に基づく表記) — Required by Japanese e-commerce law, linked in original footer

### Course Detail Gaps

- [ ] **Schedule option tables** — Original therapist course page shows 4 schedule patterns (1x/week, 2x/week, etc.) with hours and timeline. None of our course pages have this
- [ ] **Installment payment info** — Therapist course offers ¥7,600/unit installment option, not shown in rebuild
- [ ] **Promotional pricing / discount banners** — Original shows ¥20,000 discount for therapist course (limited spots), group discount callouts
- [ ] **Course enrollment status** — Some courses on original are marked "enrollment closed" (受付停止中). No mechanism for this in rebuild
- [ ] **Detailed curriculum tables** — Original has per-unit herb/oil breakdowns in table format. Our markdown content covers the curriculum but less structured

### Contact Page Gaps

- [ ] **Furigana field** (フリガナ) — Original contact form has a phonetic name field, important for Japanese names
- [ ] **Email confirmation field** — Original has a second email input to prevent typos
- [ ] **Privacy consent checkbox** — Original requires checking a privacy policy consent box before submit
- [ ] **Access directions section** — Original includes station info (Tameike-Sanno 2 min, Toranomon Hills 8 min) and "reservation only" notice directly on the contact page
- [ ] **Google Maps embed** — Not present on original either, but would be a clear improvement

### Homepage Gaps

- [x] **Hero carousel** — 3-slide gradient carousel with auto-rotation and dot indicators (can swap gradients for real images later)
- [x] **Announcements section** — Gold-accent bar below hero with news items (free consultations, group discounts, installment options)
- [x] **Classroom features callout** — 5-column feature grid: JAMHA/AEAJ accredited, station access, flexible scheduling, 1:1 lessons, free exam prep

### Navigation & Footer Gaps

- [x] **Dropdown nav with course categories** — Desktop hover dropdown + mobile accordion, grouped by JAMHA/AEAJ/Other
- [x] **JAMHA/AEAJ banner links** — Added to footer brand section as linked badges
- [x] **Email address in footer** — info@botanicalgrace8.com added to contact column
- [x] **Operating hours** — "11:00〜20:00" added to footer contact column

---

## Smart Additions (Not on Original)

Improvements that would add real value beyond what the current site offers.

### SEO & Discoverability

- [ ] **JSON-LD structured data** — `EducationalOrganization`, `Course`, and `LocalBusiness` schemas for rich Google results
- [ ] **Open Graph / Twitter meta tags** — Social sharing previews for all pages
- [ ] **Per-page meta descriptions** — Currently only the site-level description is set in BaseLayout
- [ ] **Breadcrumb structured data** — We already have visual breadcrumbs on detail pages; add schema markup
- [ ] **Google Analytics (GA4)** — Original uses deprecated UA tracking. Set up GA4 from scratch

### User Experience

- [ ] **Herb search/filter** — The herb directory has 24 entries. Add client-side filtering by action/property (e.g., "digestive", "calming", "immune")
- [ ] **Course comparison table** — A single page showing all 6 courses side-by-side: price, hours, sessions, certification body
- [ ] **FAQ section** — Common questions about enrollment, online vs in-person, payment, prerequisites. Would reduce contact form friction
- [ ] **404 page** — Custom branded 404 for broken links, with navigation back to homepage
- [ ] **Scroll-to-top button** — Long course and herb pages would benefit from this
- [ ] **"Free consultation" floating CTA** — A persistent button or banner encouraging visitors to book a free explanation session

### Contact & Conversion

- [ ] **Real Formspree ID** — Replace `f/placeholder` in both ja and en contact pages
- [ ] **Form validation feedback** — Client-side validation messages and a success/thank-you state after submission
- [ ] **LINE contact option** — Very common in Japan for business inquiries. Add a LINE official account link if Kimiko has one
- [ ] **Booking calendar integration** — Would allow students to self-schedule consultation calls

### Visual & Media

- [ ] **Real photography** — Course photos, herb images, classroom/studio photos, instructor portrait. Currently using emoji placeholders
- [ ] **YouTube video embeds** — Original references course introduction videos. Embed them on relevant course pages
- [ ] **Herb images** — Each of the 24 herb pages could have a photo or botanical illustration
- [ ] **Favicon upgrade** — Replace the simple SVG circle with a proper branded icon + Apple touch icon

### Technical & Performance

- [ ] **Image optimization pipeline** — Use Astro's `<Image>` component for automatic WebP/AVIF conversion and responsive srcsets
- [ ] **robots.txt** — Not currently present
- [ ] **Lighthouse audit** — Target 95+ on Performance, SEO, Accessibility
- [ ] **Skip-to-content link** — Accessibility improvement for keyboard/screen reader users
- [ ] **Focus trapping on mobile menu** — Current hamburger menu doesn't trap focus for accessibility
- [ ] **Print stylesheet** — Course detail pages should print cleanly for students who want a paper copy

### Content & i18n

- [ ] **Hardcoded Japanese on EN pages** — Homepage features section has Japanese text that doesn't switch with language. Several small spots like this exist
- [ ] **Course dropdown on EN contact uses correct labels** — Verified this is already correct, but worth checking after any changes

---

## Launch Checklist

These must be done before going live on the real domain.

- [ ] Replace Formspree placeholder with real form ID
- [ ] Add real images (at minimum: instructor photo, 1 hero image)
- [ ] Kimiko reviews all Japanese content for accuracy
- [ ] Privacy policy page exists
- [ ] Test contact form end-to-end (submission reaches Kimiko's email)
- [ ] Verify all 83 pages render correctly in both languages
- [ ] Mobile test on real devices (iPhone, Android)
- [ ] Configure custom domain: botanicalgrace8.com → GitHub Pages
- [ ] Submit sitemap.xml to Google Search Console
- [ ] Set up GA4 tracking
