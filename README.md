# andreas-mitschke-site

Personal site of Andreas Mitschke. One static page, no build step.

```
index.html        page, styles and scripts (all inline)
assets/
  kbb-*.jpg       book cover: front, back, spine (used by the 3D book)
  og.png          share preview, 1200×630
  favicon.svg     favicon (plus favicon-32.png, apple-touch-icon.png)
```

Run it locally by opening `index.html`, or `python3 -m http.server` in this folder.

## Deploy (GitHub Pages)

Settings → Pages → Deploy from branch → `main` / root.

## Before going live

Search `index.html` for these placeholders and replace them:

- `[EMAIL]` — contact address (appears in several mailto links and the footer)
- `href="#"` — LinkedIn, SSRN, knownbeforebuilt.com, "Get the book", paper and template links
- `[YOUR-DOMAIN]` — in the `og:image` and `twitter:image` tags; social previews need the absolute URL

Fonts load from Google Fonts (Archivo, Bodoni Moda, IBM Plex Mono).
Motion respects `prefers-reduced-motion`. Below 760px the page switches to the mobile layout (sticky header, full-screen menu).
