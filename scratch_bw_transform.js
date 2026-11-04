import fs from 'fs';

console.log('Beginning Black & White color palette transformation...');

// ==========================================
// 1. UPDATE style.css
// ==========================================
let styleCss = fs.readFileSync('style.css', 'utf8');

// Replace :root block with clean Black & White palette
const oldRootRegex = /:root\s*\{[\s\S]*?\/\* ─── LIVE PALETTE PRESET THEMES/;
const newRootBlock = `:root {
  /* ═══════════════════════════════════════════════════════════
     GTC MODERN BLACK & WHITE DEMO PALETTE
     Background: Clean Neutral Obsidian (#0B0C10)
     Surfaces: Sleek Neutral Slate (#14161B / #1F2229)
     Primary / CTA / Accents: Crisp Pure White (#FFFFFF)
     Secondary / Eyebrows: Cool Silver Gray (#9CA3AF / #D1D5DB)
     Typography: High-precision modern sans-serif (Plus Jakarta Sans / Inter)
     ═══════════════════════════════════════════════════════════ */
  --bg-color: #0B0C10;            /* Neutral deep black body */
  --surface-color: #14161B;       /* Clean dark surface for cards/panels */
  --surface-elevated: #1F2229;    /* Elevated hover surface */
  --primary-color: #FFFFFF;       /* Crisp pure white highlight & primary buttons */
  --accent-color: #9CA3AF;        /* Cool silver-gray for secondary text & metadata */
  --accent-glacial: #60A5FA;      /* Subtle modern blue telemetry indicator */
  --accent-glacial-glow: rgba(255, 255, 255, 0.15);
  --accent-glacial-pill: rgba(255, 255, 255, 0.08);
  --accent-glacial-border: rgba(255, 255, 255, 0.2);
  --text-color: #F3F4F6;          /* Crisp high-contrast white text */
  --btn-text: #0B0C10;            /* Dark text on white solid buttons */

  --bg-rgb: 11, 12, 16;
  --surface-rgb: 20, 22, 27;
  --primary-rgb: 255, 255, 255;
  --accent-rgb: 156, 163, 175;
  --glacial-rgb: 96, 165, 250;
  --text-rgb: 243, 244, 246;

  /* Aliases for backwards compatibility */
  --accent-gold: var(--primary-color);
  --accent-champagne: var(--accent-color);
  --charcoal: var(--surface-color);

  /* Modern Professional Typography */
  --font-hero: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'DM Mono', monospace;
  --font-accent: 'Plus Jakarta Sans', sans-serif;
  --nav-bg: rgba(11, 12, 16, 0.88);

  /* Clean subtle hairline borders */
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-glass: rgba(255, 255, 255, 0.08);
  --border-active: rgba(255, 255, 255, 0.35);
  --border-glacial: rgba(255, 255, 255, 0.18);
}

/* ─── LIVE PALETTE PRESET THEMES`;

if (oldRootRegex.test(styleCss)) {
  styleCss = styleCss.replace(oldRootRegex, newRootBlock);
  console.log('✓ :root variables updated in style.css');
} else {
  console.warn('✗ :root regex match failed in style.css');
}

// Global replacement of gold colors with Black & White equivalents
styleCss = styleCss.replace(/#C9A84C/gi, '#FFFFFF');
styleCss = styleCss.replace(/#E8D6B3/gi, '#9CA3AF');
styleCss = styleCss.replace(/#D4AF37/gi, '#FFFFFF');
styleCss = styleCss.replace(/#F8F5EF/gi, '#F3F4F6');
styleCss = styleCss.replace(/rgba\(\s*201\s*,\s*168\s*,\s*76\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
styleCss = styleCss.replace(/rgba\(\s*232\s*,\s*214\s*,\s*179\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');

// Remove flashy gold glows/text-shadows
styleCss = styleCss.replace(/text-shadow:\s*0\s*0\s*\d+px\s*rgba\(255,\s*255,\s*255,\s*[0-9.]+\)\s*!important/gi, 'text-shadow: none !important');
styleCss = styleCss.replace(/text-shadow:\s*0\s*0\s*\d+px\s*var\(--primary-color\)/gi, 'text-shadow: none');

fs.writeFileSync('style.css', styleCss, 'utf8');
console.log('✓ style.css converted to Black & White');

// ==========================================
// 2. UPDATE src/components/editorialPage.css
// ==========================================
let editorialCss = fs.readFileSync('src/components/editorialPage.css', 'utf8');
editorialCss = editorialCss.replace(/#C9A84C/gi, '#FFFFFF');
editorialCss = editorialCss.replace(/#c9a84c/gi, '#FFFFFF');
editorialCss = editorialCss.replace(/#E8D6B3/gi, '#9CA3AF');
editorialCss = editorialCss.replace(/#e8d6b3/gi, '#9CA3AF');
editorialCss = editorialCss.replace(/#F8F5EF/gi, '#F3F4F6');
editorialCss = editorialCss.replace(/rgba\(\s*201\s*,\s*168\s*,\s*76\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
editorialCss = editorialCss.replace(/rgba\(\s*232\s*,\s*214\s*,\s*179\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
fs.writeFileSync('src/components/editorialPage.css', editorialCss, 'utf8');
console.log('✓ editorialPage.css converted to Black & White');

// ==========================================
// 3. UPDATE src/components/upcomingPage.css
// ==========================================
let upcomingCss = fs.readFileSync('src/components/upcomingPage.css', 'utf8');
upcomingCss = upcomingCss.replace(/#C9A84C/gi, '#FFFFFF');
upcomingCss = upcomingCss.replace(/#c9a84c/gi, '#FFFFFF');
upcomingCss = upcomingCss.replace(/#E8D6B3/gi, '#9CA3AF');
upcomingCss = upcomingCss.replace(/#e8d6b3/gi, '#9CA3AF');
upcomingCss = upcomingCss.replace(/rgba\(\s*201\s*,\s*168\s*,\s*76\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
upcomingCss = upcomingCss.replace(/rgba\(\s*232\s*,\s*214\s*,\s*179\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
fs.writeFileSync('src/components/upcomingPage.css', upcomingCss, 'utf8');
console.log('✓ upcomingPage.css converted to Black & White');

// ==========================================
// 4. UPDATE src/components/cart.css & authModal.css
// ==========================================
['src/components/cart.css', 'src/components/authModal.css'].forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/#C9A84C/gi, '#FFFFFF');
    c = c.replace(/#c9a84c/gi, '#FFFFFF');
    c = c.replace(/#E8D6B3/gi, '#9CA3AF');
    c = c.replace(/#e8d6b3/gi, '#9CA3AF');
    c = c.replace(/rgba\(\s*201\s*,\s*168\s*,\s*76\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
    c = c.replace(/rgba\(\s*232\s*,\s*214\s*,\s*179\s*,\s*([0-9.]+)\s*\)/g, 'rgba(255, 255, 255, $1)');
    fs.writeFileSync(f, c, 'utf8');
    console.log(`✓ ${f} converted to Black & White`);
  }
});

// ==========================================
// 5. UPDATE SVG dial colors in index.html
// ==========================================
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/fill="#E8D6B3"/g, 'fill="#9CA3AF"');
indexHtml = indexHtml.replace(/fill="#C9A84C"/g, 'fill="#FFFFFF"');
indexHtml = indexHtml.replace(/stroke="#C9A84C"/g, 'stroke="#FFFFFF"');
indexHtml = indexHtml.replace(/stroke="#E8D6B3"/g, 'stroke="#6B7280"');
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('✓ index.html preloader SVG updated to Black & White');

console.log('All Black & White transformations completed!');

