const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const assetDir = path.join(root, "assets");
const imageDir = path.join(assetDir, "images");
const contentDir = path.join(root, "content");
const publishedArticlesPath = path.join(contentDir, "articles.json");
// released is the pending-publish drop folder; imported markdown is archived after publishing.
const releasedDir = path.join(root, "released");
const archiveDir = path.join(root, "archive", "released");
const outPath = path.join(root, "index.html");

const site = {
  name: "Roam & Roses",
  domain: "www.roamandroses.com",
  url: "https://www.roamandroses.com/",
  title: "Roam & Roses - Style, Beauty, Culture and Visual Stories",
  description:
    "Roam & Roses covers style, beauty, skincare, red carpet moments, fashion week notes, and visual culture with polished editorial taste.",
};

const images = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1480365501497-199581be0e66?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80",
];

let featured = [
  {
    category: "Lighting",
    title: "The One-Light Portrait Setup That Still Looks Expensive",
    image: images[0],
  },
  {
    category: "Originals",
    title: "Why Photographers Keep Returning to Imperfect Color",
    image: images[1],
  },
  {
    category: "News",
    title: "A Small Mirrorless Body Is Starting a Big Studio Debate",
    image: images[2],
  },
];

let articles = [
  ["Tutorials", "The Shutter Speed Habit Most Beginners Learn Too Late", "A practical field rule can rescue handheld work before stabilization, tripods, or editing software ever enter the conversation.", images[3], "May 21st, 2026"],
  ["Reviews", "Can a Compact Cinema Camera Replace a Hybrid Body?", "A tiny production camera promises serious files, simple rigging, and fewer excuses when the light starts to fall.", images[4], "May 21st, 2026"],
  ["Originals", "When Perfect Technique Starts Making Boring Photographs", "The gear forum version of excellence is not always the same thing as a photograph that holds attention.", images[5], "May 21st, 2026"],
  ["News", "A New Zoom Lens Makes Travel Kits Feel Less Compromised", "The newest power zoom is lighter than expected and aimed squarely at creators who move between stills and video.", images[6], "May 20th, 2026"],
  ["Post", "Can You Match Camera Color in Lightroom?", "Color science is real, but the final look often depends on profiles, light, and a much more disciplined editing pass.", images[7], "May 20th, 2026"],
  ["Tutorials", "Manual Retouching Versus AI: What Happens at 200 Percent", "Fast tools are useful, but pores, edges, hair, and expression still reveal how carefully a portrait was finished.", images[8], "May 20th, 2026"],
  ["Originals", "Why Landscape Photographers Make Good Street Photographers", "Patience, timing, light, and composition transfer better than most photographers expect once the location gets louder.", images[9], "May 19th, 2026"],
  ["Business", "Fully Booked and Still Broke: The Studio Math Problem", "A packed calendar can hide weak pricing, slow delivery systems, and expenses that quietly drain every good month.", images[10], "May 19th, 2026"],
  ["Reviews", "A Budget Editing Console That Speeds Up the Boring Work", "The best workflow accessories disappear into muscle memory and make repetitive edits feel less like admin.", images[11], "May 18th, 2026"],
  ["Tutorials", "How to Read the Same Landscape for Twelve Different Frames", "The location is only the first ingredient. The photograph changes when weather, light direction, and patience begin to work.", images[12], "May 18th, 2026"],
];

const community = [
  ["May 16", "Ari Coleman", "Window Light, Old Hotel", images[10], 8],
  ["May 15", "Mina Torres", "Harbor Blue Hour", images[11], 3],
  ["May 14", "Ryan Bell", "Vapor Trail", images[12], 5],
  ["May 13", "Sasha Kim", "A Quiet Mountain Road", images[13], 1],
  ["May 12", "Dean Mallory", "Late Dinner Service", images[14], 4],
  ["May 11", "Nora Leigh", "Moonlit Dunes", images[1], 2],
];

const reviewLinks = [
  "Editing With the Pilot Pro Console",
  "Canon RF 24-105mm f/2.8 Field Review",
  "The New Ultra-Wide Fisheye Zoom Tested",
  "A Slim Desktop Hub for Working Photographers",
  "Sony's High-Resolution Body Gets a Surprise Rival",
  "Taking a 100-400mm Lens to a Night Match",
];

const imageVariants = {
  feature: { width: 920, height: 640, fit: "cover", quality: 78 },
  story: { width: 520, height: 352, fit: "cover", quality: 76 },
  body: { width: 1080, fit: "inside", quality: 78 },
  thumb: { width: 180, height: 135, fit: "cover", quality: 72 },
  square: { width: 180, height: 180, fit: "cover", quality: 72 },
  contest: { width: 680, height: 390, fit: "cover", quality: 76 },
};

let imageAssetMap = new Map();
let categories = [...new Set([...featured.map((item) => item.category), ...articles.map((article) => article[0])])];
let importedReleasedFiles = [];

const infoPages = [
  {
    file: "contact-us.html",
    title: "Contact Us",
    description: "Contact the Roam & Roses editorial, partnership, and support team.",
    eyebrow: "Get in touch",
    heading: "Contact Us",
    body: [
      "Roam & Roses welcomes notes from readers, photographers, brands, publicists, and working creatives. Send story tips, portfolio leads, correction requests, and partnership questions to the right desk so we can respond clearly.",
      "Editorial: editor@roamandroses.com",
      "Partnerships: partnerships@roamandroses.com",
      "Support: hello@roamandroses.com",
    ],
  },
  {
    file: "advertise.html",
    title: "Advertise",
    description: "Advertise with Roam & Roses through display placements, sponsored stories, and photography-focused campaigns.",
    eyebrow: "Media kit",
    heading: "Advertise",
    body: [
      "Roam & Roses reaches photographers, camera buyers, visual creators, travel editors, and creative professionals who care about gear, craft, and image-led storytelling.",
      "Available placements include homepage sponsorships, category takeovers, newsletter features, sponsored tutorials, gear launch packages, and contest partnerships.",
      "For current rates, audience details, and campaign availability, contact partnerships@roamandroses.com.",
    ],
  },
  {
    file: "privacy-policy.html",
    title: "Privacy Policy",
    description: "Read the Roam & Roses privacy policy for data collection, analytics, advertising, and contact form handling.",
    eyebrow: "Site policy",
    heading: "Privacy Policy",
    body: [
      "Roam & Roses collects limited information needed to operate the site, understand aggregate readership, respond to messages, and maintain advertising or partnership records.",
      "We may use analytics tools, cookies, server logs, and embedded media providers to measure traffic and improve the publication. These tools may process browser, device, and referral information.",
      "Messages sent to our team may be retained so we can answer questions, investigate corrections, manage partnerships, or protect the site from abuse. We do not sell personal contact messages.",
      "For privacy questions or deletion requests, contact privacy@roamandroses.com.",
    ],
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug.replace(/^-+|-+$/g, "");
}

function cleanText(value = "") {
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/鈥\?/g, " - ")
    .replace(/脳/g, "x")
    .replace(/掳/g, "deg")
    .replace(/鈥檚/g, "'s")
    .replace(/鈥檛/g, "n't")
    .replace(/鈥檙/g, "'r")
    .replace(/鈥檒/g, "'l")
    .replace(/鈥檝/g, "'v")
    .replace(/芒鈧€?/g, " - ")
    .replace(/芒鈧渱芒鈧劉/g, "'")
    .replace(/芒鈧搢芒鈧琝u009d/g, '"');
}

function stripMarkdown(value = "") {
  return cleanText(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMarkdownImages(markdown = "") {
  const urls = [];
  const pattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(pattern)) {
    const url = normalizeImageUrl(match[1]);
    if (/^https?:\/\//i.test(url)) urls.push(url);
  }
  return [...new Set(urls)];
}

function normalizeImageUrl(url = "") {
  return String(url).replace(/(citygirldaily\.cc\/uploads\/\d+)\.$/i, "$1.jpg");
}

function inlineMarkdown(value = "") {
  return escapeHtml(cleanText(value))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function previewText(value = "", maxLength = 152) {
  const text = stripMarkdown(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function categoryFor(title, body) {
  const text = `${title} ${body}`.toLowerCase();
  if (/ingrown|face oil|skincare|skin-care|skin care|cortisol|anti-aging|dermatologist|hair|oil|hormone/.test(text)) return "Skincare";
  if (/fashion week|nyfw|front row|spring 2026/.test(text)) return "Fashion Week";
  if (/red carpet|festival|greta lee|katharine hepburn|toronto|venice|celebrity|stars/.test(text)) return "Celebrity Style";
  if (/street style|new york|katie holmes|phil oh|summer to fall/.test(text)) return "Street Style";
  return "Style Notes";
}

function imageSlug(url) {
  const photoId = url.match(/photo-([a-z0-9-]+)/i)?.[1] || "photo";
  return slugify(photoId);
}

function imageFileName(url, variant) {
  const hash = crypto.createHash("sha1").update(`${url}:${variant}`).digest("hex").slice(0, 10);
  return `${imageSlug(url)}-${variant}-${hash}.avif`;
}

function categoryPath(category) {
  return `category-${slugify(category)}.html`;
}

function articlePath(article) {
  return article[5] ? `article-${article[5]}.html` : "#";
}

function homeHref() {
  return "/";
}

function categoryDescription(category, count = 0) {
  const total = count || articles.filter((article) => article[0] === category).length;
  return `${site.name} ${category.toLowerCase()} coverage with ${total} stories, practical notes, and polished editorial updates.`;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url) {
  const source = new URL(url);
  const referer = `${source.protocol}//${source.hostname}/`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    Referer: referer,
    "Accept-Language": "en-US,en;q=0.9",
  };
  let response = await fetch(url, {
    headers,
  });
  if (!response.ok) {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//i, ""))}`;
    response = await fetch(proxyUrl, {
    headers: {
        ...headers,
        Referer: "https://images.weserv.nl/",
      },
    });
    if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function writeVariant(sourceBuffer, url, variantName, options) {
  const fileName = imageFileName(url, variantName);
  const filePath = path.join(imageDir, fileName);
  if (!(await pathExists(filePath))) {
    await sharp(sourceBuffer, { limitInputPixels: false })
      .rotate()
      .resize({
        width: options.width,
        height: options.height,
        fit: options.fit,
        position: "attention",
        withoutEnlargement: true,
      })
      .avif({ quality: options.quality, effort: 5 })
      .toFile(filePath);
  }
  return `assets/images/${fileName}`;
}

async function localizeImages() {
  await fs.mkdir(imageDir, { recursive: true });
  const localized = new Map();
  const articleImageUrls = articles.flatMap((article) => article.imageUrls || []);
  const bodyImageUrls = new Set(articleImageUrls);
  const uniqueUrls = [...new Set([...images, ...articleImageUrls])];

  for (const url of uniqueUrls) {
    const variants = {};
    let sourceBuffer = null;
    const variantEntries = Object.entries(imageVariants).filter(([variantName]) => variantName !== "body" || bodyImageUrls.has(url));
    for (const [variantName, options] of variantEntries) {
      const fileName = imageFileName(url, variantName);
      const filePath = path.join(imageDir, fileName);
      if (await pathExists(filePath)) {
        variants[variantName] = `assets/images/${fileName}`;
        continue;
      }
      try {
        sourceBuffer ||= await downloadImage(url);
        variants[variantName] = await writeVariant(sourceBuffer, url, variantName, options);
      } catch (error) {
        console.warn(`Image localization skipped: ${url} (${error.message})`);
        const fallbackVariant = variantName === "body" ? "feature" : variantName;
        variants[variantName] = localized.get(images[0])?.[fallbackVariant] || imageSrc(images[0], fallbackVariant);
      }
    }
    localized.set(url, variants);
  }

  imageAssetMap = localized;
}

function imageSrc(url, variant = "story") {
  return imageAssetMap.get(url)?.[variant] || url;
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return stripMarkdown(match?.[1] || fallback.replace(/\.md$/i, ""));
}

function extractDeck(markdown) {
  const withoutTitle = markdown.replace(/^#\s+.+$/m, "");
  const paragraph = withoutTitle
    .split(/\n\s*\n/)
    .map((block) => stripMarkdown(block))
    .find((block) => block && !/^faq$/i.test(block) && block.length > 70);
  return previewText(paragraph || "A Roam & Roses story on style, beauty, culture, and modern visual taste.");
}

function isGenericImageLabel(value = "") {
  const label = stripMarkdown(value).trim().toLowerCase();
  return !label || /^(mid|image|photo|picture|article image|img|media)$/i.test(label);
}

function imageCaption(alt, options, sectionTitle, imageNumber) {
  const cleanAlt = stripMarkdown(alt || "");
  if (!isGenericImageLabel(cleanAlt)) return cleanAlt;
  const title = stripMarkdown(options.title || "Roam & Roses story");
  const section = stripMarkdown(sectionTitle || "");
  if (section && section.toLowerCase() !== title.toLowerCase()) return `${title} - ${section}`;
  return `${title} - image ${imageNumber}`;
}

function markdownToHtml(markdown, options = {}) {
  const lines = cleanText(markdown).split("\n");
  const html = [];
  let paragraph = [];
  let listItems = [];
  let skippedHeroImage = false;
  let currentSection = "";
  let imageNumber = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^-{3,}$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      const url = normalizeImageUrl(imageMatch[2]);
      if (options.skipFirstImage && !skippedHeroImage) {
        skippedHeroImage = true;
        continue;
      }
      imageNumber += 1;
      const caption = imageCaption(imageMatch[1], options, currentSection, imageNumber);
      const src = imageSrc(url, "body");
      html.push(
        `<figure class="article-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" loading="lazy" /><figcaption>${escapeHtml(caption)}</figcaption></figure>`
      );
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) continue;
    if (/^###\s+/.test(line)) {
      flushParagraph();
      flushList();
      currentSection = stripMarkdown(line.replace(/^###\s+/, ""));
      html.push(`<h3>${escapeHtml(currentSection)}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushParagraph();
      flushList();
      currentSection = stripMarkdown(line.replace(/^##\s+/, ""));
      html.push(`<h2>${escapeHtml(currentSection)}</h2>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

function localDate(value) {
  return value.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function articleRecordToArray(record) {
  const markdown = cleanText(record.markdown || "");
  const imageUrls = Array.isArray(record.imageUrls) ? record.imageUrls : extractMarkdownImages(markdown);
  const image = imageUrls[0] || images[record.imageIndex % images.length] || images[0];
  const article = [
    cleanText(record.category),
    cleanText(record.title),
    cleanText(record.deck),
    image,
    cleanText(record.date),
    record.slug,
    markdownToHtml(markdown, { skipFirstImage: Boolean(imageUrls.length), title: record.title }),
    cleanText(record.author),
  ];
  article.sourceFile = record.sourceFile;
  article.imageUrls = imageUrls;
  article.markdown = markdown;
  return article;
}

function refreshArticleBodies() {
  for (const article of articles) {
    if (article.markdown) {
      article[6] = markdownToHtml(article.markdown, { skipFirstImage: Boolean(article.imageUrls?.length), title: article[1] });
    }
  }
}

async function loadPublishedRecords() {
  if (!(await pathExists(publishedArticlesPath))) return [];
  const records = JSON.parse(await fs.readFile(publishedArticlesPath, "utf8"));
  if (!Array.isArray(records)) return [];
  return records.map((record) => ({
    ...record,
    markdown: cleanText(record.markdown || ""),
    imageUrls: Array.isArray(record.imageUrls) ? record.imageUrls : extractMarkdownImages(record.markdown || ""),
  }));
}

async function readReleasedFiles() {
  if (!(await pathExists(releasedDir))) return [];
  return (await fs.readdir(releasedDir)).filter((file) => /\.md$/i.test(file)).sort((a, b) => a.localeCompare(b));
}

async function archiveReleasedFiles(files) {
  if (!files.length) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetDir = path.join(archiveDir, stamp);
  await fs.mkdir(targetDir, { recursive: true });
  for (const file of files) {
    const from = path.join(releasedDir, file);
    const to = path.join(targetDir, file);
    if (await pathExists(from)) {
      await fs.rename(from, to);
    }
  }
}

async function loadArticleContent() {
  const authors = ["Mara Ellison", "Felicia Bloom", "Nina Vale", "June Hart", "Cleo Nash", "Ari Lane"];
  const records = await loadPublishedRecords();
  const skipReleased = process.env.SKIP_RELEASED === "1";
  const files = skipReleased ? [] : await readReleasedFiles();
  importedReleasedFiles = files;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const sourceFile = `released/${file}`;
    const filePath = path.join(releasedDir, file);
    const stat = await fs.stat(filePath);
    const markdown = cleanText(await fs.readFile(filePath, "utf8"));
    const title = extractTitle(markdown, file);
    const slug = slugify(title);
    const category = categoryFor(title, markdown);
    const existingIndex = records.findIndex((record) => record.sourceFile === sourceFile || record.slug === slug);
    const existing = existingIndex >= 0 ? records[existingIndex] : {};
    const nextRecord = {
      sourceFile,
      title,
      slug,
      category,
      deck: extractDeck(markdown),
      date: localDate(stat.mtime),
      author: existing.author || authors[records.length % authors.length],
      imageIndex: existing.imageIndex ?? records.length % images.length,
      imageUrls: extractMarkdownImages(markdown),
      markdown,
    };
    if (existingIndex >= 0) {
      records.splice(existingIndex, 1);
      records.push({ ...existing, ...nextRecord });
    } else {
      records.push(nextRecord);
    }
  }

  if (records.length) {
    await fs.mkdir(contentDir, { recursive: true });
    await fs.writeFile(publishedArticlesPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }

  const loadedArticles = records.map(articleRecordToArray);
  if (!loadedArticles.length) return;

  articles = loadedArticles;
  featured = loadedArticles.slice(0, 3).map((article) => ({
    category: article[0],
    title: article[1],
    image: article[3],
    slug: article[5],
  }));
  categories = [...new Set(loadedArticles.map((article) => article[0]))].slice(0, 5);
}

async function cleanupGeneratedPages() {
  const files = await fs.readdir(root);
  const generated = files.filter((file) => /^(category|article)-.+\.html$/i.test(file));
  await Promise.all(generated.map((file) => fs.unlink(path.join(root, file))));
}

function brandHtml() {
  return `<span class="brand-mark" aria-hidden="true"><span class="brand-initial">R</span><span class="brand-rose"></span></span><span class="brand-wordmark"><span class="brand-text">Roam</span><span class="brand-amp">&amp;</span><span class="brand-text">Roses</span></span>`;
}

function navCategory(index, fallback) {
  return categories[index] || fallback;
}

function categoryNavHtml(active) {
  return categories
    .slice(0, 5)
    .map((category) => `<a class="${active === category ? "active" : ""}" href="${categoryPath(category)}">${escapeHtml(category)}</a>`)
    .join("");
}

function feedFilterHtml() {
  return [
    `<button class="active" type="button" data-filter="all">Latest</button>`,
    ...categories.slice(0, 5).map((category) => `<button type="button" data-filter="${escapeHtml(slugify(category))}">${escapeHtml(category)}</button>`),
  ].join("");
}

function articleDateValue(article) {
  const value = String(article[4] || "").replace(/\b(\d{1,2})(st|nd|rd|th)\b/g, "$1");
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestArticles() {
  return articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => articleDateValue(b.article) - articleDateValue(a.article) || b.index - a.index)
    .map((entry) => entry.article);
}

function headerHtml(active = "articles") {
  const navOne = navCategory(0, "Reviews");
  const navTwo = navCategory(1, "Originals");
  const navThree = navCategory(2, "Business");
  return `<header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${homeHref()}" aria-label="${escapeHtml(site.name)} home">
          ${brandHtml()}
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">
          <span></span><span></span><span></span>
        </button>
        <nav id="main-nav" class="main-nav" aria-label="Main navigation">
          <a href="${homeHref()}">Articles</a>
          <a href="${categoryPath(navOne)}">${escapeHtml(navOne)}</a>
          <a href="${categoryPath(navTwo)}">Community</a>
          <a href="${categoryPath(navThree)}">Contests</a>
          <a href="advertise.html">Store</a>
        </nav>
        <form class="site-search" role="search">
          <input type="search" placeholder="Search" aria-label="Search stories" />
        </form>
        <div class="auth-links">
          <a href="contact-us.html">Log In</a>
          <a class="join" href="contact-us.html">Sign Up</a>
        </div>
      </div>
      <nav class="section-nav" aria-label="Category navigation">
        <a class="${active === "articles" ? "active" : ""}" href="${homeHref()}">Latest</a>
        ${categoryNavHtml(active)}
      </nav>
    </header>`;
}

function footerHtml() {
  const footerCategories = categories.length ? categories : ["Skincare"];
  const articleLinks = footerCategories.slice(0, 3).map((category) => `<a href="${categoryPath(category)}">${escapeHtml(category)}</a>`).join("");
  const communityLinks = footerCategories.slice(3, 6).map((category) => `<a href="${categoryPath(category)}">${escapeHtml(category)}</a>`).join("");
  return `<footer class="site-footer">
      <div class="footer-inner">
        <div>
          <a class="brand footer-brand" href="${homeHref()}" aria-label="${escapeHtml(site.name)} home">${brandHtml()}</a>
          <p>A static photography front page for ${escapeHtml(site.domain)} with localized AVIF imagery.</p>
        </div>
        <nav aria-label="Footer articles">
          <h2>Articles</h2>
          ${articleLinks}
        </nav>
        <nav aria-label="Footer community">
          <h2>Community</h2>
          ${communityLinks || `<a href="contact-us.html">Join the Community</a>`}
        </nav>
        <nav aria-label="Footer about">
          <h2>About</h2>
          <a href="contact-us.html">Contact Us</a>
          <a href="advertise.html">Advertise</a>
          <a href="privacy-policy.html">Privacy Policy</a>
        </nav>
      </div>
      <div class="copyright">Copyright 2026 ${escapeHtml(site.name)}. Published at ${escapeHtml(site.domain)}.</div>
    </footer>`;
}

function pageShell({ title, description, canonical, body, active = "articles" }) {
  const canonicalUrl = new URL(canonical || "/", site.url).href;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="assets/fstoppers-inspired.css" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to main content</a>
    ${headerHtml(active)}
    ${body}
    ${footerHtml()}
    <script src="assets/fstoppers-inspired.js" defer></script>
  </body>
</html>`;
}

function articleCard(article, index) {
  const [category, title, deck, image, date] = article;
  const href = articlePath(article);
  return `
    <article class="story-card" data-category="${escapeHtml(slugify(category))}" data-search="${escapeHtml(`${title} ${deck} ${category}`.toLowerCase())}">
      <a class="story-image" href="${escapeHtml(href)}" aria-label="${escapeHtml(title)}">
        <img src="${escapeHtml(imageSrc(image, "story"))}" alt="${escapeHtml(title)}" loading="${index < 3 ? "eager" : "lazy"}" />
        <span>${escapeHtml(category)}</span>
      </a>
      <div class="story-copy">
        <time>${escapeHtml(date)}</time>
        <h2><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></h2>
        <p>${escapeHtml(deck)}</p>
        <div class="story-meta">
          <span>By Staff</span>
          <span>${12 + index * 3} comments</span>
        </div>
      </div>
    </article>`;
}

function communityItem(item, index) {
  const [date, author, title, image, votes] = item;
  const linkedArticle = articles[index % articles.length];
  const href = linkedArticle ? articlePath(linkedArticle) : categoryPath(categories[0]);
  return `
    <a class="photo-row" href="${escapeHtml(href)}">
      <img src="${escapeHtml(imageSrc(image, "square"))}" alt="${escapeHtml(title)}" loading="lazy" />
      <span class="photo-date">${escapeHtml(date)}</span>
      <strong>${escapeHtml(author)}</strong>
      <span>${escapeHtml(title)}</span>
      <em>${votes}</em>
    </a>`;
}

function renderHtml() {
  const homeLatestArticles = latestArticles();
  const homeFeatured = homeLatestArticles.slice(0, 3).map((article) => ({
    category: article[0],
    title: article[1],
    image: article[3],
    slug: article[5],
  }));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(site.title)}</title>
    <meta name="description" content="${escapeHtml(site.description)}" />
    <link rel="canonical" href="${escapeHtml(site.url)}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:url" content="${escapeHtml(site.url)}" />
    <meta property="og:title" content="${escapeHtml(site.title)}" />
    <meta property="og:description" content="${escapeHtml(site.description)}" />
    <link rel="stylesheet" href="assets/fstoppers-inspired.css" />
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to main content</a>
    ${headerHtml("articles")}

    <main id="content">
      <section class="top-grid" aria-label="Featured photography content">
        <div class="featured-panel">
          <div class="section-heading">
            <h1>Featured Articles</h1>
            <a href="${categoryPath(categories[0])}">View All</a>
          </div>
          <div class="featured-grid">
            ${homeFeatured
              .map(
                (item, index) => `
                <a class="feature-card feature-${index + 1}" href="${escapeHtml(item.slug ? `article-${item.slug}.html` : homeHref())}">
                  <img src="${escapeHtml(imageSrc(item.image, "feature"))}" alt="${escapeHtml(item.title)}" />
                  <span>${escapeHtml(item.category)}</span>
                  <h2>${escapeHtml(item.title)}</h2>
                </a>`
              )
              .join("")}
          </div>
        </div>

        <aside class="community-panel" aria-label="${escapeHtml(site.name)} community">
          <div class="section-heading">
            <h2><a href="${categoryPath(categories[0])}">${escapeHtml(site.name)} Community</a></h2>
          </div>
          <div class="community-tabs" role="tablist" aria-label="Community galleries">
            <button class="active" type="button">Photo of the Day</button>
            <button type="button">Editors' Picks</button>
          </div>
          <div class="photo-list">
            ${community.map(communityItem).join("")}
          </div>
          <button class="load-more" type="button">Load More</button>
        </aside>
      </section>

      <section class="content-grid" aria-label="Latest stories">
        <div class="feed-column">
          <div class="feed-tabs" role="tablist" aria-label="Article filters">
            ${feedFilterHtml()}
          </div>
          <div class="story-list">
            ${homeLatestArticles.map(articleCard).join("")}
          </div>
          <nav class="pagination" aria-label="Pagination">
            <span>Page 1</span>
            <a href="${categoryPath(categories[0])}">Next page</a>
          </nav>
        </div>

        <aside class="sidebar" aria-label="More photography content">
          <section class="side-block">
            <h2>Editor's Picks</h2>
            <div class="review-list">
              ${reviewLinks
                .map(
                  (title, index) => `
                  <a href="${escapeHtml(articlePath(articles[(index + 4) % articles.length]))}">
                    <img src="${escapeHtml(imageSrc(images[(index + 4) % images.length], "thumb"))}" alt="${escapeHtml(title)}" loading="lazy" />
                    <span>${escapeHtml(title)}</span>
                  </a>`
                )
                .join("")}
            </div>
          </section>

          <section class="contest-card">
            <img src="${escapeHtml(imageSrc(images[13], "contest"))}" alt="Low-key studio contest sample" loading="lazy" />
            <div>
              <span class="contest-stats">7 entries - 252 votes</span>
              <h2>Critique the Community: Dark</h2>
              <p>Enter your best low-key image and compare your edit with the community's favorite photographs.</p>
              <a href="contact-us.html">Enter Contest</a>
              <small>Deadline: May 30, 2026 12:30pm EDT</small>
            </div>
          </section>

          <section class="side-block exclusives">
            <h2>${escapeHtml(site.name)} Exclusives</h2>
            ${articles.slice(0, 6).map((article) => `<a href="${escapeHtml(articlePath(article))}">${escapeHtml(article[1])}</a>`).join("")}
          </section>
        </aside>
      </section>
    </main>

    ${footerHtml()}

    <script src="assets/fstoppers-inspired.js" defer></script>
  </body>
</html>`;
}

function categoryEntries(category) {
  const matchingArticles = articles.filter((article) => article[0] === category);
  if (matchingArticles.length) return matchingArticles;
  const featuredEntries = featured
    .filter((item) => item.category === category)
    .map((item) => [
      item.category,
      item.title,
      "Featured field notes from the Roam & Roses front page, selected for composition, timing, and creative direction.",
      item.image,
      "Featured",
      item.slug,
    ]);
  return featuredEntries;
}

function renderCategoryPage(category) {
  const entries = categoryEntries(category);
  const fallbackEntries = entries.length ? entries : articles.slice(0, 4);
  const description = categoryDescription(category, fallbackEntries.length);
  const body = `<main id="content" class="page-main">
      <section class="page-hero">
        <span>${escapeHtml(site.name)} Categories</span>
        <h1>${escapeHtml(category)}</h1>
        <p>${escapeHtml(description)}</p>
      </section>
      <section class="category-layout" aria-label="${escapeHtml(category)} articles">
        <div class="feed-column">
          <div class="section-heading">
            <h2>${escapeHtml(category)} Stories</h2>
            <a href="${homeHref()}">Back to Home</a>
          </div>
          <div class="story-list">
            ${fallbackEntries.map(articleCard).join("")}
          </div>
        </div>
        <aside class="sidebar" aria-label="All categories">
          <section class="side-block category-menu">
            <h2>Categories</h2>
            ${categories.map((item) => `<a class="${item === category ? "active" : ""}" href="${categoryPath(item)}">${escapeHtml(item)}</a>`).join("")}
          </section>
          <section class="contest-card">
            <img src="${escapeHtml(imageSrc(images[13], "contest"))}" alt="Low-key studio contest sample" loading="lazy" />
            <div>
              <span class="contest-stats">Open call</span>
              <h2>Submit Your Best Frame</h2>
              <p>Share a photograph that fits this category's mood and tell us what made the frame work.</p>
              <a href="contact-us.html">Send a Pitch</a>
            </div>
          </section>
        </aside>
      </section>
    </main>`;

  return pageShell({
    title: `${category} - ${site.name}`,
    description,
    canonical: categoryPath(category),
    body,
    active: category,
  });
}

function renderArticlePage(article) {
  const [category, title, deck, image, date, slug, bodyHtml, author = "Roam & Roses Editors"] = article;
  const related = articles.filter((item) => item[5] !== slug && item[0] === category).slice(0, 4);
  const body = `<main id="content" class="page-main">
      <article class="article-page">
        <header class="article-hero">
          <a href="${categoryPath(category)}">${escapeHtml(category)}</a>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(deck)}</p>
          <div class="article-byline">
            <span>By ${escapeHtml(author)}</span>
            <time>${escapeHtml(date)}</time>
          </div>
          <img src="${escapeHtml(imageSrc(image, "feature"))}" alt="${escapeHtml(title)}" />
        </header>
        <div class="article-layout">
          <div class="article-body">
            ${bodyHtml || `<p>${escapeHtml(deck)}</p>`}
          </div>
          <aside class="sidebar" aria-label="Related stories">
            <section class="side-block category-menu">
              <h2>Categories</h2>
              ${categories.map((item) => `<a class="${item === category ? "active" : ""}" href="${categoryPath(item)}">${escapeHtml(item)}</a>`).join("")}
            </section>
            <section class="side-block exclusives">
              <h2>Related</h2>
              ${(related.length ? related : articles.filter((item) => item[5] !== slug).slice(0, 4)).map((item) => `<a href="${articlePath(item)}">${escapeHtml(item[1])}</a>`).join("")}
            </section>
          </aside>
        </div>
      </article>
    </main>`;

  return pageShell({
    title: `${title} - ${site.name}`,
    description: deck,
    canonical: `article-${slug}.html`,
    body,
    active: category,
  });
}

function renderInfoPage(page) {
  const body = `<main id="content" class="page-main">
      <section class="page-hero info-hero">
        <span>${escapeHtml(page.eyebrow)}</span>
        <h1>${escapeHtml(page.heading)}</h1>
        <p>${escapeHtml(page.description)}</p>
      </section>
      <section class="info-page" aria-label="${escapeHtml(page.heading)}">
        <article class="info-card">
          ${page.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </article>
        <aside class="side-block category-menu">
          <h2>Explore</h2>
          ${categories.slice(0, 6).map((item) => `<a href="${categoryPath(item)}">${escapeHtml(item)}</a>`).join("")}
        </aside>
      </section>
    </main>`;

  return pageShell({
    title: `${page.title} - ${site.name}`,
    description: page.description,
    canonical: page.file,
    body,
    active: page.file === "contact-us.html" ? "members" : "articles",
  });
}

function renderCss() {
  return `:root {
  --bg: #f4f4f4;
  --paper: #ffffff;
  --ink: #151515;
  --muted: #666666;
  --line: #d8d8d8;
  --dark: #121212;
  --dark-2: #222222;
  --accent: #e54b24;
  --accent-dark: #b9361a;
  --max: 1180px;
}

* {
  box-sizing: border-box;
}

html {
  color-scheme: light;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.45;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #dddddd;
}

.skip-link {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 20;
  background: var(--accent);
  color: #ffffff;
  padding: 10px 12px;
}

.skip-link:focus {
  top: 12px;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--dark);
  color: #ffffff;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.22);
}

.header-inner {
  max-width: var(--max);
  margin: 0 auto;
  min-height: 64px;
  display: grid;
  grid-template-columns: auto 1fr minmax(180px, 260px) auto;
  gap: 18px;
  align-items: center;
  padding: 0 18px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: max-content;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: none;
}

.brand-mark {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  isolation: isolate;
  background: linear-gradient(135deg, #e54b24 0%, #b9361a 58%, #7f2619 100%);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22), 0 8px 18px rgba(0, 0, 0, 0.28);
  transform: rotate(-6deg);
}

.brand-mark::before,
.brand-mark::after,
.brand-rose {
  content: "";
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.58);
  pointer-events: none;
}

.brand-mark::before {
  inset: 6px;
}

.brand-mark::after {
  right: 6px;
  bottom: 6px;
  width: 9px;
  height: 9px;
  border-left: 0;
  border-top: 0;
}

.brand-rose {
  top: 6px;
  left: 7px;
  width: 10px;
  height: 10px;
  border-radius: 50% 50% 50% 0;
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(38deg);
}

.brand-initial {
  position: relative;
  z-index: 1;
  font-size: 27px;
  line-height: 1;
  font-family: Georgia, serif;
  font-weight: 800;
  transform: rotate(6deg);
}

.brand-wordmark {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.brand-text {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.brand-amp {
  color: #ffb59f;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  font-style: italic;
  font-weight: 700;
  line-height: 1;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.main-nav a {
  padding: 22px 12px;
  color: #e8e8e8;
  font-size: 14px;
  font-weight: 700;
}

.main-nav a:hover,
.main-nav a:focus-visible {
  background: var(--dark-2);
}

.section-nav {
  border-top: 1px solid #2d2d2d;
  background: linear-gradient(180deg, #202020 0%, #181818 100%);
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 0 18px;
  overflow-x: auto;
}

.section-nav a {
  position: relative;
  min-width: max-content;
  padding: 11px 16px 12px;
  color: #d8d8d8;
  font-size: 13px;
  font-weight: 800;
}

.section-nav a::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 3px;
  background: transparent;
}

.section-nav a:hover,
.section-nav a:focus-visible,
.section-nav a.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
}

.section-nav a.active::after {
  background: var(--accent);
}

.site-search input {
  width: 100%;
  height: 34px;
  border: 1px solid #3a3a3a;
  background: #080808;
  color: #ffffff;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
}

.site-search input:focus {
  border-color: var(--accent);
}

.auth-links {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.auth-links .join {
  border: 1px solid #555555;
  padding: 7px 10px;
}

.nav-toggle {
  display: none;
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  padding: 8px;
}

.nav-toggle span {
  display: block;
  height: 2px;
  margin: 6px 0;
  background: #ffffff;
}

main {
  max-width: var(--max);
  margin: 22px auto 0;
  padding: 0 18px 42px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 3px solid var(--dark);
  margin-bottom: 12px;
}

.section-heading h1,
.section-heading h2 {
  margin: 0;
  padding: 0 0 7px;
  font-size: 22px;
  line-height: 1.15;
}

.section-heading a {
  color: var(--accent-dark);
  font-size: 13px;
  font-weight: 700;
}

.top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 352px;
  gap: 24px;
  align-items: start;
}

.featured-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  grid-template-rows: 238px 238px;
  gap: 12px;
}

.feature-card {
  position: relative;
  overflow: hidden;
  min-height: 180px;
  background: #111111;
}

.feature-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 34%, rgba(0, 0, 0, 0.86));
}

.feature-card img {
  transition: transform 260ms ease;
}

.feature-card:hover img {
  transform: scale(1.035);
}

.feature-card span,
.feature-card h2 {
  position: absolute;
  z-index: 1;
  left: 16px;
  right: 16px;
}

.feature-card span {
  bottom: 76px;
  display: inline-block;
  width: max-content;
  max-width: calc(100% - 32px);
  background: var(--accent);
  color: #ffffff;
  padding: 4px 7px;
  font-size: 12px;
  font-weight: 800;
}

.feature-card h2 {
  bottom: 12px;
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  line-height: 1.12;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.35);
}

.feature-1 {
  grid-row: 1 / span 2;
}

.feature-1 h2 {
  font-size: 31px;
}

.community-panel,
.side-block,
.contest-card {
  background: var(--paper);
  border: 1px solid var(--line);
}

.community-panel {
  padding: 14px;
}

.community-tabs,
.feed-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.community-tabs button,
.feed-tabs button,
.load-more {
  border: 1px solid var(--line);
  background: #eeeeee;
  color: #222222;
  height: 34px;
  padding: 0 11px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
}

.community-tabs button.active,
.feed-tabs button.active {
  border-color: var(--accent);
  background: var(--accent);
  color: #ffffff;
}

.photo-list {
  display: grid;
  gap: 10px;
}

.photo-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 28px;
  grid-template-areas:
    "image date votes"
    "image author votes"
    "image title votes";
  gap: 1px 10px;
  align-items: center;
  min-height: 72px;
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 10px;
}

.photo-row img {
  grid-area: image;
  aspect-ratio: 1;
}

.photo-date {
  grid-area: date;
  color: var(--muted);
  font-size: 12px;
}

.photo-row strong {
  grid-area: author;
  min-width: 0;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-row span:last-of-type {
  grid-area: title;
  min-width: 0;
  color: #333333;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-row em {
  grid-area: votes;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f0f0f0;
  color: var(--accent-dark);
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
}

.load-more {
  width: 100%;
  margin-top: 14px;
  background: #222222;
  color: #ffffff;
  border-color: #222222;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 26px;
  margin-top: 28px;
}

.feed-tabs {
  border-bottom: 3px solid var(--dark);
  padding-bottom: 8px;
}

.story-list {
  display: grid;
  gap: 18px;
}

.story-card {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 16px;
  background: var(--paper);
  border: 1px solid var(--line);
  padding: 12px;
}

.story-card.is-hidden {
  display: none;
}

.story-image {
  position: relative;
  min-height: 168px;
  overflow: hidden;
}

.story-image span {
  position: absolute;
  left: 8px;
  bottom: 8px;
  background: var(--accent);
  color: #ffffff;
  padding: 4px 7px;
  font-size: 11px;
  font-weight: 800;
}

.story-copy time {
  display: block;
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 4px;
}

.story-copy h2 {
  margin: 0 0 7px;
  font-size: 24px;
  line-height: 1.14;
}

.story-copy h2 a:hover,
.side-block a:hover,
.exclusives a:hover {
  color: var(--accent-dark);
}

.story-copy p {
  margin: 0 0 12px;
  color: #333333;
  font-size: 15px;
}

.story-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
}

.side-block {
  padding: 14px;
}

.side-block h2,
.contest-card h2 {
  margin: 0 0 12px;
  border-bottom: 3px solid var(--dark);
  padding-bottom: 7px;
  font-size: 20px;
}

.review-list {
  display: grid;
  gap: 10px;
}

.review-list a {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 10px;
  font-weight: 800;
  font-size: 13px;
  line-height: 1.25;
}

.review-list img {
  aspect-ratio: 4 / 3;
}

.contest-card {
  overflow: hidden;
}

.contest-card img {
  height: 188px;
}

.contest-card div {
  padding: 14px;
}

.contest-stats {
  display: block;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}

.contest-card p {
  margin: 0 0 12px;
  color: #333333;
  font-size: 14px;
}

.contest-card a {
  display: inline-block;
  background: var(--accent);
  color: #ffffff;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
}

.contest-card small {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  font-weight: 700;
}

.exclusives {
  display: grid;
  gap: 9px;
}

.exclusives a {
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 8px;
  font-size: 14px;
  font-weight: 800;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
}

.pagination span,
.pagination a {
  border: 1px solid var(--line);
  background: #ffffff;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 800;
}

.pagination a {
  color: var(--accent-dark);
}

.page-main {
  display: grid;
  gap: 24px;
}

.page-hero {
  background: #ffffff;
  border: 1px solid var(--line);
  border-top: 4px solid var(--accent);
  padding: 24px;
}

.page-hero span {
  display: block;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.page-hero h1 {
  margin: 5px 0 8px;
  font-size: 36px;
  line-height: 1.08;
}

.page-hero p {
  max-width: 720px;
  margin: 0;
  color: #333333;
  font-size: 16px;
}

.category-layout,
.info-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 26px;
  align-items: start;
}

.category-menu {
  display: grid;
  gap: 8px;
}

.category-menu a {
  border-bottom: 1px solid #eeeeee;
  padding: 8px 0;
  color: #222222;
  font-size: 14px;
  font-weight: 800;
}

.category-menu a.active,
.category-menu a:hover {
  color: var(--accent-dark);
}

.info-card {
  background: #ffffff;
  border: 1px solid var(--line);
  padding: 24px;
}

.info-card p {
  max-width: 780px;
  margin: 0 0 15px;
  color: #303030;
  font-size: 16px;
}

.info-card p:last-child {
  margin-bottom: 0;
}

.article-page {
  display: grid;
  gap: 24px;
}

.article-hero {
  background: #ffffff;
  border: 1px solid var(--line);
}

.article-hero > a,
.article-hero h1,
.article-hero p,
.article-byline {
  margin-left: 24px;
  margin-right: 24px;
}

.article-hero > a {
  display: inline-block;
  margin-top: 24px;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.article-hero h1 {
  max-width: 900px;
  margin-top: 8px;
  margin-bottom: 10px;
  font-size: 42px;
  line-height: 1.06;
}

.article-hero p {
  max-width: 820px;
  margin-top: 0;
  color: #333333;
  font-size: 18px;
}

.article-byline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.article-hero img {
  height: 430px;
}

.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 26px;
  align-items: start;
}

.article-body {
  background: #ffffff;
  border: 1px solid var(--line);
  padding: 28px;
}

.article-body h2 {
  margin: 30px 0 10px;
  font-size: 25px;
  line-height: 1.18;
}

.article-body h3 {
  margin: 22px 0 8px;
  font-size: 20px;
}

.article-body p,
.article-body li {
  color: #242424;
  font-size: 17px;
  line-height: 1.72;
}

.article-body p {
  margin: 0 0 17px;
}

.article-image {
  margin: 28px 0;
}

.article-image img {
  width: 100%;
  max-height: 620px;
  object-fit: cover;
}

.article-image figcaption {
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.article-body ul {
  margin: 0 0 18px 22px;
  padding: 0;
}

.site-footer {
  background: #181818;
  color: #e8e8e8;
  padding: 34px 18px 22px;
}

.footer-inner {
  max-width: var(--max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 28px;
}

.footer-brand {
  margin-bottom: 12px;
}

.site-footer p {
  max-width: 330px;
  margin: 0;
  color: #bfbfbf;
  font-size: 14px;
}

.site-footer nav {
  display: grid;
  align-content: start;
  gap: 7px;
}

.site-footer h2 {
  margin: 0 0 5px;
  color: #ffffff;
  font-size: 15px;
}

.site-footer a {
  color: #cfcfcf;
  font-size: 13px;
}

.copyright {
  max-width: var(--max);
  margin: 26px auto 0;
  border-top: 1px solid #2c2c2c;
  padding-top: 16px;
  color: #9a9a9a;
  font-size: 12px;
}

@media (max-width: 980px) {
  .header-inner {
    grid-template-columns: auto auto 1fr;
  }

  .nav-toggle {
    display: block;
  }

  .main-nav {
    display: none;
    grid-column: 1 / -1;
    flex-wrap: wrap;
    padding: 0 0 12px;
  }

  .main-nav.is-open {
    display: flex;
  }

  .main-nav a {
    padding: 10px 12px;
    background: #202020;
  }

  .site-search {
    justify-self: stretch;
  }

  .auth-links {
    display: none;
  }

  .top-grid,
  .content-grid,
  .category-layout,
  .info-page,
  .article-layout {
    grid-template-columns: 1fr;
  }

  .community-panel {
    order: 2;
  }

  .sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .exclusives {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .header-inner {
    grid-template-columns: auto auto;
    gap: 10px;
    padding: 10px 14px;
  }

  .brand-text {
    font-size: 18px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
  }

  .brand-wordmark {
    gap: 5px;
  }

  .brand-amp {
    font-size: 15px;
  }

  .site-search {
    grid-column: 1 / -1;
  }

  main {
    margin-top: 14px;
    padding: 0 12px 30px;
  }

  .featured-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }

  .feature-card,
  .feature-1 {
    grid-row: auto;
    height: 245px;
  }

  .feature-1 h2,
  .feature-card h2 {
    font-size: 22px;
  }

  .story-card {
    grid-template-columns: 1fr;
  }

  .story-image {
    min-height: 218px;
  }

  .story-copy h2 {
    font-size: 21px;
  }

  .page-hero {
    padding: 18px;
  }

  .page-hero h1 {
    font-size: 29px;
  }

  .article-hero > a,
  .article-hero h1,
  .article-hero p,
  .article-byline {
    margin-left: 18px;
    margin-right: 18px;
  }

  .article-hero h1 {
    font-size: 31px;
  }

  .article-hero p {
    font-size: 16px;
  }

  .article-hero img {
    height: 260px;
  }

  .article-body {
    padding: 20px;
  }

  .sidebar,
  .footer-inner {
    grid-template-columns: 1fr;
  }

  .contest-card img {
    height: 220px;
  }
}

@media (max-width: 430px) {
  .photo-row {
    grid-template-columns: 58px minmax(0, 1fr) 26px;
    min-height: 58px;
  }

  .story-image {
    min-height: 190px;
  }
}
`;
}

function renderJs() {
  return `const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = document.querySelectorAll(".feed-tabs button");
const stories = document.querySelectorAll(".story-card");
const searchInput = document.querySelector(".site-search input");

navToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

function applyFilters() {
  const active = document.querySelector(".feed-tabs button.active")?.dataset.filter || "all";
  const query = searchInput?.value.trim().toLowerCase() || "";

  stories.forEach((story) => {
    const category = story.dataset.category || "";
    const searchable = story.dataset.search || "";
    const categoryMatch = active === "all" || category === active;
    const searchMatch = !query || searchable.includes(query);
    story.classList.toggle("is-hidden", !(categoryMatch && searchMatch));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

document.querySelectorAll(".community-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".community-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});
`;
}

async function main() {
  await fs.mkdir(assetDir, { recursive: true });
  await loadArticleContent();
  await localizeImages();
  refreshArticleBodies();
  await cleanupGeneratedPages();
  await fs.writeFile(outPath, renderHtml(), "utf8");
  for (const category of categories) {
    await fs.writeFile(path.join(root, categoryPath(category)), renderCategoryPage(category), "utf8");
  }
  for (const article of articles) {
    if (article[5]) {
      await fs.writeFile(path.join(root, articlePath(article)), renderArticlePage(article), "utf8");
    }
  }
  for (const page of infoPages) {
    await fs.writeFile(path.join(root, page.file), renderInfoPage(page), "utf8");
  }
  await fs.writeFile(path.join(assetDir, "fstoppers-inspired.css"), renderCss(), "utf8");
  await fs.writeFile(path.join(assetDir, "fstoppers-inspired.js"), renderJs(), "utf8");
  await archiveReleasedFiles(importedReleasedFiles);
  console.log(`Built ${site.domain} front page, ${categories.length} category pages, ${articles.length} article pages, and ${infoPages.length} info pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
