# Paracha Mobile Shop: Realistic Image Prompts (AI image generator)

Use with any image generator (Gemini/Imagen, Midjourney, DALL-E, Flux, etc.).
Prompts are in English because generators follow English best.

## IMPORTANT RULES (read first)

1. **Real branded products need REAL photos.** Do NOT generate images of "Samsung Galaxy A15", "iPhone 13", "AirPods Pro 2" and similar. An AI image will show a wrong design and misleads customers. Use your own photos or supplier photos for those. See `Section 5`.
2. **AI images are fine for:** banners, category tiles, store/about page visuals, generic unbranded accessories (plain cable, plain case, plain memory card), and background scenes.
3. **No fake people as customers.** Never use AI faces as testimonial photos. Use initials avatars instead.
4. **No text inside images.** Generators spell text badly, and Urdu/English text must change with the language toggle. Add all text (titles, prices, buttons) in the website, not in the image. Every prompt below says "no text".
5. **No real brand logos** in generated images. Generic devices only (no apple logo, no Samsung wordmark).
6. Leave empty space on one side of banners so website text can sit on top.

## GLOBAL STYLE BLOCK (paste at the START of every prompt)

```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality.
```

## GLOBAL NEGATIVE PROMPT (for generators that support it)

```
text, letters, watermark, logo, brand name, apple logo, deformed hands, extra fingers, distorted device, warped screen, blurry, low resolution, cartoon, illustration, 3d render look, plastic skin, oversaturated, cluttered background, cracked screen
```

---

## SECTION 1: HOME PAGE BANNERS (bucket: `banners`)

Size: 1920x720 px, landscape. Save as `.webp` or `.jpg`.

**1.1 `hero-new-arrivals.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Wide hero banner, three generic unbranded modern smartphones with edge-to-edge screens showing abstract blue gradient wallpapers, arranged diagonally on a clean white-and-soft-blue glossy surface, subtle reflections, empty space on the left third for website text, bright optimistic mood, no text, no logos.
```

**1.2 `hero-accessories-sale.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Wide hero banner, neat flat-lay of generic unbranded phone accessories: white fast charger, braided USB-C cable, wireless earbuds with charging case, small power bank, on a soft light-grey background with gentle blue accent shapes, empty space on the right third, no text, no logos.
```

**1.3 `hero-used-phones-certified.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Wide banner, a technician hand holding a generic unbranded used smartphone under a bright worktable lamp, tidy repair bench with small screwdrivers softly blurred in background, trustworthy professional mood, empty space on the left, no text, no logos.
```

**1.4 `hero-installments.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Wide banner, generic unbranded smartphone resting on a clean desk beside a small notebook and calculator, soft window light, warm friendly mood suggesting easy monthly payments, empty space on the right, no text, no logos.
```

**1.5 `hero-pta-approved.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Wide banner, a sealed generic unbranded smartphone retail box with a plain white label, placed on a light wooden counter in a modern mobile shop, shelves of boxes softly blurred behind, empty space on the left, no text, no logos.
```

---

## SECTION 2: CATEGORY TILES (bucket: `category-icons`)

Size: 800x800 px square, subject centered, plain light background (easy to crop into circles). File name = category slug.

| File | Prompt (after the global style block) |
|---|---|
| `smartphones.jpg` | Generic unbranded modern smartphone, front and slightly angled back view, floating on a pure light-blue gradient background, soft shadow, no text, no logo. |
| `used-phones.jpg` | Two generic unbranded smartphones, one slightly worn but clean, on a light-grey surface with a soft microfiber cloth, no text, no logo. |
| `tablets.jpg` | Generic unbranded 10-inch tablet with a stand-up angle on a light-blue gradient background, soft shadow, no text, no logo. |
| `smart-watches.jpg` | Generic unbranded smartwatch with a black silicone strap and a blank dark face, angled view, light-grey gradient background, no text, no logo. |
| `chargers-cables.jpg` | White fast wall charger with a coiled braided USB-C cable, on a light-blue gradient background, no text, no logo. |
| `power-banks.jpg` | Slim generic unbranded power bank with a small LED indicator, with a short cable beside it, light-grey gradient background, no text, no logo. |
| `earbuds-headphones.jpg` | Generic unbranded white wireless earbuds with an open charging case, light-blue gradient background, no text, no logo. |
| `cases-covers.jpg` | Three generic unbranded phone cases in navy, clear and grey stacked at an angle, light background, no text, no logo. |
| `screen-protectors.jpg` | Clear tempered glass screen protector being held at an angle above a generic unbranded phone, light reflections on the glass, light background, no text, no logo. |
| `bluetooth-speakers.jpg` | Compact cylindrical generic unbranded Bluetooth speaker with a fabric grille, light-grey gradient background, no text, no logo. |
| `memory-cards-usb.jpg` | Generic unbranded microSD card with an adapter and a small silver USB flash drive, macro shot, light-blue gradient background, no text, no logo. |

---

## SECTION 3: GENERIC ACCESSORY PHOTOS (bucket: `product-images`)

Only for items with NO brand name. Size 1200x1200, white background (product page and card).
File names must match the product slug (example: `micro-usb-cable-1m.jpg`).

Template:
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Product photo of <ITEM DESCRIPTION>, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.
```

Fill `<ITEM DESCRIPTION>` with:

| File | Item description |
|---|---|
| `micro-usb-cable-1m.jpg` | a 1 meter black micro USB cable, loosely coiled |
| `type-c-fast-charging-cable-1m.jpg` | a 1 meter white braided USB-C to USB-C cable, loosely coiled |
| `dual-usb-car-charger.jpg` | a compact black dual-port USB car charger |
| `silicone-back-case-universal.jpg` | a matte navy-blue silicone phone case, back view |
| `shockproof-armor-case.jpg` | a black shockproof rugged phone case with raised corners |
| `flip-wallet-case-universal.jpg` | a brown leather-look flip wallet phone case, slightly open |
| `phone-grip-holder.jpg` | a round black phone grip holder stuck on a plain phone back |
| `tempered-glass-screen-protector.jpg` | a clear tempered glass screen protector with a thin black border |
| `matte-hydrogel-film.jpg` | a transparent matte hydrogel screen film partly peeled on a plain surface |
| `privacy-glass-protector-universal.jpg` | a dark privacy tempered glass screen protector at an angle |
| `mini-power-bank-5000mah.jpg` | a small lipstick-sized white power bank |
| `solar-power-bank-20000mah.jpg` | a rugged orange-and-black power bank with a small solar panel on top |
| `wired-earphones-with-mic.jpg` | white wired earphones with an inline mic, neatly coiled |
| `wireless-bluetooth-neckband.jpg` | a black wireless Bluetooth neckband earphone set |
| `mini-bluetooth-speaker.jpg` | a small round black Bluetooth speaker |
| `waterproof-speaker-ipx7.jpg` | a rugged blue cylindrical waterproof speaker with a small water splash |
| `32gb-memory-card.jpg` (and 16/64/128/256) | a plain microSD card with a plain blank label, macro view |
| `32gb-usb-flash-drive.jpg` (and 64GB) | a small silver metal USB flash drive with a keyring hole |
| `otg-type-c-to-usb-adapter.jpg` | a tiny silver USB-C to USB-A OTG adapter |
| `usb-c-memory-card-reader.jpg` | a small black USB-C memory card reader with a microSD card inserted |

> **Important:** Items such as "Samsung 20W Fast Charger", "Anker Power Bank", "Apple AirPods", "Redmi Buds" are BRANDED. Do not generate those. Use real photos (Section 5).

---

## SECTION 4: STORE, ABOUT AND TRUST VISUALS

Size: 1600x900 px unless noted. Use for the About, Contact and trust sections (bucket: `banners`).

**4.1 `about-shop-interior.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Interior of a clean modern mobile phone shop in Pakistan, glass display counters with generic unbranded phones and accessories, warm lighting, a shopkeeper in a smart shirt arranging items seen from behind, no readable signage, no logos, no text.
```

**4.2 `about-repair-bench.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Close-up of a tidy mobile repair workbench with precision screwdrivers, a generic phone opened for battery replacement, anti-static mat, shallow depth of field, no text, no logos.
```

**4.3 `trust-delivery.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. A courier hand passing a small neatly packed parcel box to a customer's hand at a doorstep, daylight, friendly mood, faces not visible, no text, no logos.
```

**4.4 `trust-warranty.jpg`**
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Neat flat-lay of a generic unbranded smartphone box, a blank warranty card, a pen and a pair of earbuds on a light wooden desk, no readable text, no logos.
```

**4.5 `contact-map-background.jpg`** (1600x600)
```
Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality. Abstract soft-focus city street at golden hour with blurred shop lights and bokeh, calm background for a contact section, no signage, no text, no logos.
```

**4.6 `testimonials-background.jpg`** (1600x700)
```
Soft abstract light-blue and white gradient with subtle bokeh circles, very clean, no objects, no people, no text.
```

---

## SECTION 5: REAL PHOTOS REQUIRED (do NOT generate)

Every branded product needs a real photo from you or your supplier:
- All smartphones, tablets and smart watches by Samsung, Apple, Xiaomi/Redmi, Infinix, Tecno, Oppo, Vivo, Realme, Itel.
- All used phones (take photos of the ACTUAL unit you sell: screen, back, sides, battery health screen).
- Branded chargers, power banks, earbuds and speakers (Anker, Baseus, Oraimo, Samsung, Apple, Xiaomi).

### Photo checklist for real products:
1. Plain white or light-grey background (a sheet of paper or a table near a window).
2. Daylight, no flash, no hand in the frame.
3. Shots: front, back, side, box/accessories. Name them `<slug>.jpg`, `<slug>-2.jpg`, `<slug>-3.jpg`.
4. For used phones, always show real condition and any scratches.

---

## SECTION 6: SIZES AND FILE RULES

| Use | Size | Format | Max file size | Storage Bucket |
|---|---|---|---|---|
| Hero banners | 1920x720 | webp/jpg | 400 KB | `banners` |
| Category tiles | 800x800 | webp/jpg | 150 KB | `category-icons` |
| Product images | 1200x1200 | webp/jpg | 200 KB | `product-images` |
| About/trust visuals | 1600x900 | webp/jpg | 300 KB | `banners` |

Naming: lowercase, hyphens only, no spaces (example: `hero-new-arrivals.jpg`).
Upload banners to the `banners` bucket, category tiles to `category-icons`, product images to `product-images`.

---

## SECTION 7: QUALITY CHECK BEFORE UPLOAD

- **Zoom in**: no warped buttons, extra ports, broken text, or melted edges.
- **No brand logos** or readable words appear anywhere.
- **Hands (if any)** have the right number of fingers.
- **The product looks like what you actually sell.** If not, do not use it.
- **Never present an AI image of a branded model as that exact product.**
