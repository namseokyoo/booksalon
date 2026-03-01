const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'dist', 'sitemap.xml');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

if (fs.existsSync(sitemapPath)) {
  let content = fs.readFileSync(sitemapPath, 'utf8');
  content = content.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  fs.writeFileSync(sitemapPath, content);
  console.log(`sitemap.xml lastmod updated to ${today}`);
} else {
  console.log('sitemap.xml not found in dist/ — skipping');
}
