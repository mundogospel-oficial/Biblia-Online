import fs from 'fs';
import path from 'path';
import { bibleBooks } from '../src/lib/bibleData.ts';

const baseUrl = 'https://online-biblia.vercel.app';
const currentDate = new Date().toISOString().split('T')[0];

const staticPages = [
  { url: '', priority: '1.0', changefreq: 'daily' },
  { url: '/pesquisar', priority: '0.8', changefreq: 'weekly' },
  { url: '/favoritos', priority: '0.6', changefreq: 'monthly' },
  { url: '/anotacoes', priority: '0.6', changefreq: 'monthly' },
  { url: '/minha-conta', priority: '0.5', changefreq: 'monthly' },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

// Add static pages
for (const page of staticPages) {
  xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
}

// Add each book and chapter
for (const book of bibleBooks) {
  for (let c = 1; c <= book.chapters; c++) {
    xml += `  <url>
    <loc>${baseUrl}/livro/${book.abbrev}/${c}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
}

xml += `</urlset>\n`;

const targetPath = path.resolve('public/sitemap.xml');
fs.writeFileSync(targetPath, xml, 'utf8');
console.log(`Generated sitemap.xml with all books and chapters at ${targetPath}`);
