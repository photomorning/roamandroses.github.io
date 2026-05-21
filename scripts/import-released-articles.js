const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const releasedDir = path.join(root, "released");
const releasedArchiveDir = path.join(root, "released-archive");
const contentDir = path.join(root, "content");
const imageDir = path.join(root, "assets", "images");
const outputPath = path.join(contentDir, "articles.json");
const stockImageSources = {
  "Brand Spotlights": [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=82",
  ],
  "City Lifestyle": [
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=82",
  ],
  "Fashion Tips and Tricks": [
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=82",
  ],
  "Neighborhood Gossip": [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=82",
  ],
  Skincare: [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=82",
  ],
  default: [
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=82",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=82",
  ],
};

function cleanText(value = "") {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/鈥\?/g, "—")
    .replace(/鈥檚/g, "'s")
    .replace(/鈥檛/g, "n't")
    .replace(/鈥檙/g, "'r")
    .replace(/鈥檒/g, "'l")
    .replace(/鈥檝/g, "'v")
    .replace(/鈥/g, "’")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€\u009d/g, '"');
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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[#?'"()$]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function cleanImageAlt(value = "") {
  const alt = stripMarkdown(value);
  if (!alt || /^(mid|top|image|img|photo|picture)(\s+\d+)?$/i.test(alt)) return "";
  return alt;
}

function stableViews(slug) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 100 + (hash % 201);
}

function categoryFor(title, body) {
  const text = `${title} ${body}`.toLowerCase();
  if (/airline|flight|flying|business class|hotel|itinerary|theatre|theater|travel|trip|singapore|dubai|nyc|new york/.test(text)) return "City Lifestyle";
  if (/vitamin|skincare|skin|sunscreen|wrinkle|dermatologist|peptide|licorice|volufiline|anti-aging|face/.test(text)) return "Skincare";
  if (/nail|manicure|haircut|haircuts|burgundy|amethyst|plaid|tweed/.test(text)) return "Fashion Tips and Tricks";
  if (/dior|louis vuitton|brand|designer|sza/.test(text)) return "Brand Spotlights";
  if (/rihanna|dakota|katy|hailey|golden globe|critics choice|red carpet|celebrity|winona|rocky|noah wyle/.test(text)) return "Neighborhood Gossip";
  if (/office|holiday|strike|shutdown|city|sidewalk|home/.test(text)) return "City Lifestyle";
  return "Trendy Outfits";
}

function imageFileName(url, slug, index) {
  const hash = crypto.createHash("sha1").update(`${url}:${index}`).digest("hex").slice(0, 10);
  return `${slug.slice(0, 46)}-${String(index + 1).padStart(2, "0")}-${hash}.avif`;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function clearDirectory(target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(target);
  await Promise.all(entries.map((entry) => fs.rm(path.join(target, entry), { recursive: true, force: true })));
}

async function loadExistingArticles() {
  if (!(await pathExists(outputPath))) return [];
  const articles = JSON.parse(await fs.readFile(outputPath, "utf8"));
  return Array.isArray(articles) ? articles : [];
}

async function uniqueArchivePath(targetDir, fileName) {
  const parsed = path.parse(fileName);
  let target = path.join(targetDir, fileName);
  let counter = 2;
  while (await pathExists(target)) {
    target = path.join(targetDir, `${parsed.name}-${counter}${parsed.ext}`);
    counter += 1;
  }
  return target;
}

function localDateStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function archiveReleasedFiles(files) {
  if (!files.length) return;
  const today = localDateStamp();
  const targetDir = path.join(releasedArchiveDir, today);
  await fs.mkdir(targetDir, { recursive: true });
  for (const file of files) {
    const source = path.join(releasedDir, file);
    if (!(await pathExists(source))) continue;
    await fs.rename(source, await uniqueArchivePath(targetDir, file));
  }
  console.log(`Archived ${files.length} source files to ${path.relative(root, targetDir)}.`);
}

async function downloadAvif(url, slug, index) {
  await fs.mkdir(imageDir, { recursive: true });
  const fileName = imageFileName(url, slug, index);
  const filePath = path.join(imageDir, fileName);
  if (await pathExists(filePath)) return `assets/images/${fileName}`;

  const candidates = [
    url,
    url.replace(/\.(jpg|jpeg|png|webp)$/i, "."),
    url.endsWith(".") ? `${url}jpg` : "",
    url.endsWith(".") ? `${url}png` : "",
    url.endsWith(".") ? `${url}jpeg` : "",
  ].filter(Boolean);
  let response;
  let finalUrl = url;
  for (const candidate of [...new Set(candidates)]) {
    response = await fetch(candidate, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GlossAndCityReleasedImporter/1.0)",
        "Referer": "https://citygirldaily.cc/",
      },
    });
    if (response.ok) {
      finalUrl = candidate;
      break;
    }
  }
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const converted = await sharp(bytes, { limitInputPixels: false })
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .avif({ quality: 76, effort: 5 })
    .toBuffer();
  await fs.writeFile(filePath, converted);
  if (finalUrl !== url) console.warn(`Recovered image URL: ${url} -> ${finalUrl}`);
  return `assets/images/${fileName}`;
}

async function stockImage(category, slug) {
  const sources = stockImageSources[category] || stockImageSources.default;
  const hash = crypto.createHash("sha1").update(`${category}:${slug}`).digest("hex");
  const startIndex = parseInt(hash.slice(0, 8), 16) % sources.length;
  const orderedSources = [...sources.slice(startIndex), ...sources.slice(0, startIndex)];
  let lastError;
  for (const source of orderedSources) {
    try {
      return await downloadAvif(source, `stock-${slug}`, 0);
    } catch (error) {
      lastError = error;
      console.warn(`Stock image failed for ${slug}: ${error.message}`);
    }
  }
  throw new Error(`No stock image could be downloaded for ${slug}: ${lastError?.message || "unknown error"}`);
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
  return paragraph ? `${paragraph.slice(0, 152).trimEnd()}${paragraph.length > 152 ? "..." : ""}` : "A polished Gloss & City edit on fashion, beauty, celebrity style, and modern city living.";
}

async function markdownToHtml(markdown, slug, imageMap) {
  const lines = markdown.split("\n");
  const html = [];
  let paragraph = [];
  let listItems = [];

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
    if (/^#\s+/.test(line)) continue;
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      const src = imageMap.get(imageMatch[2]);
      if (src) {
        const alt = cleanImageAlt(imageMatch[1]) || slug;
        const caption = cleanImageAlt(imageMatch[1]);
        html.push(`<figure><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />${caption ? `<figcaption>${escapeHtml(caption)}.</figcaption>` : ""}</figure>`);
      }
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushParagraph();
      flushList();
      html.push(`<h3>${escapeHtml(stripMarkdown(line.replace(/^###\s+/, "")))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushParagraph();
      flushList();
      html.push(`<h2>${escapeHtml(stripMarkdown(line.replace(/^##\s+/, "")))}</h2>`);
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

async function main() {
  if (!(await pathExists(releasedDir))) throw new Error("Missing released directory.");
  await fs.mkdir(contentDir, { recursive: true });
  await fs.mkdir(imageDir, { recursive: true });

  const files = (await fs.readdir(releasedDir))
    .filter((file) => /\.md$/i.test(file))
    .sort((a, b) => a.localeCompare(b));
  const existingArticles = await loadExistingArticles();
  const existingSourceFiles = new Set(existingArticles.map((article) => article.sourceFile).filter(Boolean));
  const pendingFiles = files.filter((file) => !existingSourceFiles.has(`released/${file}`));

  if (!pendingFiles.length) {
    console.log("No new released articles to import.");
    return;
  }

  const authors = ["Mara Ellison", "Felicia Bloom", "Nina Vale", "June Hart", "Cleo Nash", "Ari Lane"];
  const articles = [];

  for (let index = 0; index < pendingFiles.length; index += 1) {
    const file = pendingFiles[index];
    const filePath = path.join(releasedDir, file);
    const stat = await fs.stat(filePath);
    const markdown = cleanText(await fs.readFile(filePath, "utf8"));
    const title = extractTitle(markdown, file);
    const slug = slugify(title);
    const imageUrls = [...new Set(Array.from(markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)).map((match) => match[1]))];
    const imageMap = new Map();
    for (let imageIndex = 0; imageIndex < imageUrls.length; imageIndex += 1) {
      imageMap.set(imageUrls[imageIndex], await downloadAvif(imageUrls[imageIndex], slug, imageIndex));
    }
    const bodyHtml = await markdownToHtml(markdown, slug, imageMap);
    const category = categoryFor(title, markdown);
    const firstImage = imageMap.values().next().value || (await stockImage(category, slug));
    articles.push({
      slug,
      title,
      category,
      author: authors[(existingArticles.length + index) % authors.length],
      date: stat.mtime.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      deck: extractDeck(markdown),
      views: stableViews(slug),
      image: [firstImage, title],
      bodyHtml,
      sourceFile: `released/${file}`,
    });
    console.log(`${index + 1}/${pendingFiles.length} ${slug} (${imageUrls.length} images)`);
  }

  await fs.writeFile(outputPath, `${JSON.stringify([...articles, ...existingArticles], null, 2)}\n`, "utf8");
  await archiveReleasedFiles(pendingFiles);
  console.log(`Imported ${articles.length} released articles to ${path.relative(root, outputPath)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
