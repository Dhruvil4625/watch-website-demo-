import fs from 'fs';
import path from 'path';

const standardFooter = `  <!-- ═══════════════════════════════════════════
       MAISON STANDARDIZED LUXURY FOOTER
  ═══════════════════════════════════════════ -->
  <footer class="footer">
    <div class="footer-top-rule"></div>
    <div class="footer-inner">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-brand-col">
          <a href="index.html" aria-label="Gujarat Time Company Home">
            <img class="footer-logo" src="/assets/photo/logo.svg" alt="Gujarat Time Company Logo" />
          </a>
          <p class="footer-tagline">Surat Manufacture · Est. 2026</p>
          <p class="footer-address">
            Gujarat Time Company Pvt. Ltd.<br>
            Surat Horological District<br>
            Gujarat 395007, India
          </p>
          <div class="footer-socials">
            <a class="footer-social" href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a class="footer-social" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a class="footer-social" href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>

        <!-- Collections Column -->
        <div class="footer-col">
          <h5 class="footer-col-title">Timepieces</h5>
          <a href="collection.html#himalayan">GTC Himalayan (Horizon 300)</a>
          <a href="collection.html">360° Virtual Atelier</a>
          <a href="collection.html#grid-section">The Himalayan Collection</a>
          <a href="craftsmanship.html">Calibre &amp; Movements</a>
          <a href="profile.html#allocations">Bespoke Allocations</a>
        </div>

        <!-- Maison Column -->
        <div class="footer-col">
          <h5 class="footer-col-title">The Maison</h5>
          <a href="about.html">About Maison GTC</a>
          <a href="heritage.html">Heritage &amp; Provenance</a>
          <a href="craftsmanship.html">Craftsmanship &amp; Finishing</a>
          <a href="about.html#manufacture">Surat Horological Atelier</a>
          <a href="index.html#ethos">Ethos &amp; Manifesto</a>
        </div>

        <!-- Client Concierge Column -->
        <div class="footer-col">
          <h5 class="footer-col-title">Client Concierge</h5>
          <a href="contact.html">Contact Us &amp; Concierge</a>
          <a href="contact.html#salon">Surat Atelier Private Salon</a>
          <a href="warranty.html">5-Year International Warranty</a>
          <a href="warranty.html#care-guide">Horological Care Guide</a>
          <a href="profile.html">Collector Sanctuary Vault</a>
        </div>

        <!-- Genesis Allocation Dossier Column -->
        <div class="footer-col footer-col-reserve">
          <h5 class="footer-col-title">Genesis Allocation</h5>
          <p class="footer-col-desc">Strictly limited to 300 numbered timepieces worldwide. Individually regulated and hand-finished by master lapidaries in Surat, India.</p>
          <a href="collection.html" class="footer-reserve-btn">Explore Allocations</a>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-legal">&copy; 2026 Gujarat Time Company Pvt. Ltd. All rights reserved. GTC, Horizon, and the GTC Himalayan are registered marks of Gujarat Time Company. Designed and hand-assembled in Surat, India.</p>
        <div class="footer-bottom-links">
          <a href="about.html">About Us</a>
          <a href="contact.html">Contact Us</a>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Allocation</a>
          <a href="warranty.html">Warranty &amp; Care</a>
        </div>
      </div>
    </div>
  </footer>`;

// 1. Update craftsmanship.html
{
  const p = path.resolve('craftsmanship.html');
  let content = fs.readFileSync(p, 'utf8');
  // Match from <footer class="footer"> to </footer>
  const regex = /<footer class="footer">[\s\S]*?<\/footer>/;
  if (regex.test(content)) {
    content = content.replace(regex, standardFooter.trim());
    console.log('[craftsmanship.html] replaced existing footer');
  } else {
    console.warn('[craftsmanship.html] footer regex not found!');
  }
  // Also update mobile sheet in craftsmanship.html if needed
  content = content.replace(
    '<h3>Maison</h3>\n      <a href="index.html">Maison Overview</a>',
    '<h3>Maison</h3>\n      <a href="about.html">About The Maison</a>\n      <a href="index.html">Maison Overview</a>'
  );
  if (!content.includes('<h3>Client Services</h3>')) {
    content = content.replace(
      '<div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line',
      '<h3>Client Services</h3>\n      <a href="contact.html">Contact Us &amp; Concierge</a>\n      <a href="warranty.html">5-Year International Warranty</a>\n\n      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line'
    );
  }
  fs.writeFileSync(p, content, 'utf8');
}

// 2. Update heritage.html (insert before <script type="module" src="./heritage.js"></script>)
{
  const p = path.resolve('heritage.html');
  let content = fs.readFileSync(p, 'utf8');
  const regex = /<footer class="footer">[\s\S]*?<\/footer>/;
  if (regex.test(content)) {
    content = content.replace(regex, standardFooter.trim());
    console.log('[heritage.html] replaced existing footer');
  } else {
    content = content.replace(
      '<script type="module" src="./heritage.js"></script>',
      standardFooter + '\n\n  <script type="module" src="./heritage.js"></script>'
    );
    console.log('[heritage.html] inserted standardized footer');
  }
  fs.writeFileSync(p, content, 'utf8');
}

// 3. Update profile.html (insert before <!-- 4. PROFILE & CALENDAR LOGIC -->)
{
  const p = path.resolve('profile.html');
  let content = fs.readFileSync(p, 'utf8');
  const regex = /<footer class="footer">[\s\S]*?<\/footer>/;
  if (regex.test(content)) {
    content = content.replace(regex, standardFooter.trim());
    console.log('[profile.html] replaced existing footer');
  } else {
    content = content.replace(
      '<!-- 4. PROFILE & CALENDAR LOGIC -->',
      standardFooter + '\n\n  <!-- 4. PROFILE & CALENDAR LOGIC -->'
    );
    console.log('[profile.html] inserted standardized footer');
  }
  fs.writeFileSync(p, content, 'utf8');
}

// 4. Update checkout.html (insert before <script type="module">)
{
  const p = path.resolve('checkout.html');
  let content = fs.readFileSync(p, 'utf8');
  const regex = /<footer class="footer">[\s\S]*?<\/footer>/;
  if (regex.test(content)) {
    content = content.replace(regex, standardFooter.trim());
    console.log('[checkout.html] replaced existing footer');
  } else {
    content = content.replace(
      '<script type="module">',
      standardFooter + '\n\n  <script type="module">'
    );
    console.log('[checkout.html] inserted standardized footer');
  }
  fs.writeFileSync(p, content, 'utf8');
}

console.log('All footers successfully updated!');
