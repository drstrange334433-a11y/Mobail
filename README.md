# Paracha Mobile Shop — Product Images Pipeline

## How to Add Product Images

All product images displayed on the website are sourced strictly and exclusively from administrative uploads stored in the Supabase Storage bucket `product-images` and recorded in the `product_images` database table. The application never scrapes, hotlinks, or generates fake product photos.

If a product does not yet have an uploaded image, a clean, original category SVG placeholder is shown with **"Photo coming soon • تصویر جلد دستیاب ہوگی"**. Non-phone products (chargers, power banks, earbuds, cases, etc.) will always show their respective category illustration.

---

### 1. File Naming Rules (for Bulk Image Upload)

When preparing image files to upload in bulk, name your files using the product's English name converted to a hyphenated slug:

- **Rule**: Lowercase, non-alphanumerics become hyphens (`-`), trim leading and trailing hyphens.
- **Primary Image**: `<slug>.<ext>`
  - *Example*: Product "Samsung Galaxy A15 128GB" &rarr; `samsung-galaxy-a15-128gb.jpg` (or `.png`, `.webp`)
- **Secondary Gallery Images**: `<slug>-2.<ext>`, `<slug>-3.<ext>`, etc.
  - *Example*: `samsung-galaxy-a15-128gb-2.jpg`, `samsung-galaxy-a15-128gb-3.jpg`

#### More Examples:
| Product Name in Catalog | Primary Image File | Additional Photos |
| :--- | :--- | :--- |
| Samsung Galaxy A15 128GB | `samsung-galaxy-a15-128gb.webp` | `samsung-galaxy-a15-128gb-2.webp` |
| Infinix Hot 40i 128GB | `infinix-hot-40i-128gb.jpg` | `infinix-hot-40i-128gb-2.jpg` |
| iPhone 11 128GB (Used) | `iphone-11-128gb-used.png` | `iphone-11-128gb-used-2.png` |
| Samsung 20W Fast Charger | `samsung-20w-fast-charger.jpg` | `samsung-20w-fast-charger-2.jpg` |

> **Tip:** You can download the exact list of expected filenames for all products missing images by clicking **"Export Missing as CSV"** on the Admin Dashboard or Bulk Image Upload page.

---

### 2. How to Upload Images in Bulk

1. Go to the Admin Portal &rarr; **Bulk Image Upload** (`/admin/bulk-images`).
2. Drag and drop all your image files at once, or drag a single **`.ZIP` archive** containing your photos.
3. The browser will automatically extract `.zip` files and match each image to the corresponding product using the slug naming rule.
4. If a file is unmatched, use the **searchable dropdown** in the preview table to manually pick the product.
5. If you want to overwrite products that already have a photo, check **"Replace existing primary images"**.
6. Click **"Process & Upload Matched Images"**:
   - The browser automatically resizes high-resolution photos to a maximum of **1200px** on the longest side.
   - Converts the photo to optimized **WebP** (~0.85 quality) to ensure fast mobile page loads.
   - Uploads to the `product-images` storage bucket with unique paths (`<productId>/<uuid>.webp`).
   - Automatically designates the first image as the primary image (`is_primary: true`).

---

### 3. How to Upload Images for an Individual Product

1. Go to **Products** (`/admin/products`) and click **Edit** on any device.
2. Scroll to the **Product Images** section.
3. Click **Upload Images** and select one or more photos (JPEG, PNG, WebP up to 8MB).
4. Click **Set Primary** on any image to star it as the main card photo.
5. Use the arrow buttons to reorder images, or the trash icon to delete an image.
6. Click **Save Product**.

---

### 4. Category Icons, Brand Logos, and Hero Banners

- **Category Icons**: Uploaded directly on the Category Edit page to the `category-icons` bucket.
- **Brand Logos**: Uploaded on the Brand Edit page to the `brand-logos` bucket.
- **Hero Banners**: Uploaded on the Hero Banners page to the `banners` bucket.

---

### 5. Realistic Image Prompts (AI Image Generator) & Real Photo Rules

For complete copy-paste prompts ready for any AI image generator (Gemini/Imagen, Midjourney, DALL-E, Flux), see **[`docs/IMAGE_PROMPTS.md`](./docs/IMAGE_PROMPTS.md)**.

#### Core Rules:
1. **Real branded products need REAL photos**: Do NOT generate images for Samsung Galaxy, iPhone, AirPods, etc. Fake renders mislead customers. Take your own or supplier photos.
2. **AI images are permitted for**: Hero banners, category tiles, store/about visuals, generic unbranded accessories (plain cables, plain cases, universal protectors), and background scenes.
3. **No text and no brand logos inside generated images**: All text is rendered cleanly in the web app in English/Urdu.
4. **Global Style Block**: Every prompt must begin with the standard commercial photography block defined in `docs/IMAGE_PROMPTS.md`.
5. **Admin Access**: Store administrators can also view and copy all prompts directly within the Admin Portal under **AI Image Prompts** (`/admin/image-prompts`).

