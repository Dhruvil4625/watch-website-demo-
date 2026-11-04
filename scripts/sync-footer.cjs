const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.resolve(__dirname, '../index.html');
const craftsmanshipHtmlPath = path.resolve(__dirname, '../craftsmanship.html');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const craftsmanshipHtml = fs.readFileSync(craftsmanshipHtmlPath, 'utf8');

const footerRegex = /<footer class="footer">[\s\S]*?<\/footer>/;
const indexFooterMatch = indexHtml.match(footerRegex);

if (!indexFooterMatch) {
  console.error('Could not find footer in index.html');
  process.exit(1);
}

const indexFooter = indexFooterMatch[0];
const updatedCraftsmanship = craftsmanshipHtml.replace(footerRegex, indexFooter);

if (updatedCraftsmanship === craftsmanshipHtml) {
  console.error('Could not replace footer in craftsmanship.html');
  process.exit(1);
}

fs.writeFileSync(craftsmanshipHtmlPath, updatedCraftsmanship, 'utf8');
console.log('Successfully updated footer in craftsmanship.html with identical footer from index.html');
