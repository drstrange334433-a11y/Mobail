/**
 * Paracha Mobile Shop — AI Image Prompts & Visual Asset Guide
 * Interactive prompt book and copy-paste reference for store administrators
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Camera,
  Layers,
  Image as ImageIcon,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Smartphone,
  UploadCloud,
  FileText
} from 'lucide-react';

const GLOBAL_STYLE_BLOCK =
  'Photorealistic commercial photography, shot on a full-frame camera, 85mm lens, soft diffused studio lighting, natural shadows, sharp focus, high detail, clean modern retail look, realistic materials and reflections, color-accurate, 8k quality.';

const GLOBAL_NEGATIVE_PROMPT =
  'text, letters, watermark, logo, brand name, apple logo, deformed hands, extra fingers, distorted device, warped screen, blurry, low resolution, cartoon, illustration, 3d render look, plastic skin, oversaturated, cluttered background, cracked screen';

interface PromptItem {
  id: string;
  fileName: string;
  bucket: string;
  dimensions: string;
  title: string;
  description: string;
  rawPrompt: string;
}

const BANNERS_PROMPTS: PromptItem[] = [
  {
    id: 'hero-new-arrivals',
    fileName: 'hero-new-arrivals.jpg',
    bucket: 'banners',
    dimensions: '1920x720 px',
    title: 'New Arrivals Banner',
    description: 'Wide hero banner featuring generic modern smartphones with blue wallpapers',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Wide hero banner, three generic unbranded modern smartphones with edge-to-edge screens showing abstract blue gradient wallpapers, arranged diagonally on a clean white-and-soft-blue glossy surface, subtle reflections, empty space on the left third for website text, bright optimistic mood, no text, no logos.`,
  },
  {
    id: 'hero-accessories-sale',
    fileName: 'hero-accessories-sale.jpg',
    bucket: 'banners',
    dimensions: '1920x720 px',
    title: 'Accessories Sale Banner',
    description: 'Neat flat-lay of unbranded fast charger, braided USB-C cable, earbuds, power bank',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Wide hero banner, neat flat-lay of generic unbranded phone accessories: white fast charger, braided USB-C cable, wireless earbuds with charging case, small power bank, on a soft light-grey background with gentle blue accent shapes, empty space on the right third, no text, no logos.`,
  },
  {
    id: 'hero-used-phones-certified',
    fileName: 'hero-used-phones-certified.jpg',
    bucket: 'banners',
    dimensions: '1920x720 px',
    title: 'Certified Used Phones Banner',
    description: 'Technician holding a generic phone under lamp at a tidy repair bench',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Wide banner, a technician hand holding a generic unbranded used smartphone under a bright worktable lamp, tidy repair bench with small screwdrivers softly blurred in background, trustworthy professional mood, empty space on the left, no text, no logos.`,
  },
  {
    id: 'hero-installments',
    fileName: 'hero-installments.jpg',
    bucket: 'banners',
    dimensions: '1920x720 px',
    title: 'Installments & Easy Payments Banner',
    description: 'Generic smartphone on clean desk beside notebook and calculator',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Wide banner, generic unbranded smartphone resting on a clean desk beside a small notebook and calculator, soft window light, warm friendly mood suggesting easy monthly payments, empty space on the right, no text, no logos.`,
  },
  {
    id: 'hero-pta-approved',
    fileName: 'hero-pta-approved.jpg',
    bucket: 'banners',
    dimensions: '1920x720 px',
    title: 'PTA Approved Sealed Box Banner',
    description: 'Sealed generic retail box on light wooden counter with blurred shop shelves',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Wide banner, a sealed generic unbranded smartphone retail box with a plain white label, placed on a light wooden counter in a modern mobile shop, shelves of boxes softly blurred behind, empty space on the left, no text, no logos.`,
  },
];

const CATEGORY_PROMPTS: PromptItem[] = [
  {
    id: 'smartphones',
    fileName: 'smartphones.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Smartphones Category Tile',
    description: 'Front and angled back view floating on light-blue gradient',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Generic unbranded modern smartphone, front and slightly angled back view, floating on a pure light-blue gradient background, soft shadow, no text, no logo.`,
  },
  {
    id: 'used-phones',
    fileName: 'used-phones.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Used Phones Category Tile',
    description: 'Two unbranded phones with microfiber cloth on light-grey surface',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Two generic unbranded smartphones, one slightly worn but clean, on a light-grey surface with a soft microfiber cloth, no text, no logo.`,
  },
  {
    id: 'tablets',
    fileName: 'tablets.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Tablets Category Tile',
    description: 'Generic 10-inch tablet with stand-up angle on light-blue gradient',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Generic unbranded 10-inch tablet with a stand-up angle on a light-blue gradient background, soft shadow, no text, no logo.`,
  },
  {
    id: 'smart-watches',
    fileName: 'smart-watches.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Smart Watches Category Tile',
    description: 'Smartwatch with black silicone strap and blank dark face',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Generic unbranded smartwatch with a black silicone strap and a blank dark face, angled view, light-grey gradient background, no text, no logo.`,
  },
  {
    id: 'chargers-cables',
    fileName: 'chargers-cables.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Chargers & Cables Category Tile',
    description: 'White fast wall charger with coiled braided USB-C cable',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} White fast wall charger with a coiled braided USB-C cable, on a light-blue gradient background, no text, no logo.`,
  },
  {
    id: 'power-banks',
    fileName: 'power-banks.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Power Banks Category Tile',
    description: 'Slim power bank with LED indicator and short cable',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Slim generic unbranded power bank with a small LED indicator, with a short cable beside it, light-grey gradient background, no text, no logo.`,
  },
  {
    id: 'earbuds-headphones',
    fileName: 'earbuds-headphones.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Earbuds & Audio Category Tile',
    description: 'White wireless earbuds with an open charging case',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Generic unbranded white wireless earbuds with an open charging case, light-blue gradient background, no text, no logo.`,
  },
  {
    id: 'cases-covers',
    fileName: 'cases-covers.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Cases & Covers Category Tile',
    description: 'Three phone cases in navy, clear, and grey stacked at an angle',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Three generic unbranded phone cases in navy, clear and grey stacked at an angle, light background, no text, no logo.`,
  },
  {
    id: 'screen-protectors',
    fileName: 'screen-protectors.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Screen Protectors Category Tile',
    description: 'Tempered glass held at an angle above generic phone with reflections',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Clear tempered glass screen protector being held at an angle above a generic unbranded phone, light reflections on the glass, light background, no text, no logo.`,
  },
  {
    id: 'bluetooth-speakers',
    fileName: 'bluetooth-speakers.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Bluetooth Speakers Category Tile',
    description: 'Compact cylindrical speaker with fabric grille',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Compact cylindrical generic unbranded Bluetooth speaker with a fabric grille, light-grey gradient background, no text, no logo.`,
  },
  {
    id: 'memory-cards-usb',
    fileName: 'memory-cards-usb.jpg',
    bucket: 'category-icons',
    dimensions: '800x800 px',
    title: 'Memory Cards & USB Category Tile',
    description: 'MicroSD card with adapter and silver USB flash drive macro shot',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Generic unbranded microSD card with an adapter and a small silver USB flash drive, macro shot, light-blue gradient background, no text, no logo.`,
  },
];

const GENERIC_ACCESSORIES: PromptItem[] = [
  {
    id: 'micro-usb-cable-1m',
    fileName: 'micro-usb-cable-1m.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Micro USB Cable (1m)',
    description: '1 meter black micro USB cable, loosely coiled',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a 1 meter black micro USB cable, loosely coiled, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'type-c-fast-charging-cable-1m',
    fileName: 'type-c-fast-charging-cable-1m.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Type-C Fast Charging Cable (1m)',
    description: '1 meter white braided USB-C to USB-C cable, loosely coiled',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a 1 meter white braided USB-C to USB-C cable, loosely coiled, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'dual-usb-car-charger',
    fileName: 'dual-usb-car-charger.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Dual USB Car Charger',
    description: 'Compact black dual-port USB car charger',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a compact black dual-port USB car charger, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'silicone-back-case-universal',
    fileName: 'silicone-back-case-universal.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Universal Silicone Back Case',
    description: 'Matte navy-blue silicone phone case, back view',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a matte navy-blue silicone phone case, back view, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'shockproof-armor-case',
    fileName: 'shockproof-armor-case.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Shockproof Armor Rugged Case',
    description: 'Black shockproof rugged phone case with raised corners',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a black shockproof rugged phone case with raised corners, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'flip-wallet-case-universal',
    fileName: 'flip-wallet-case-universal.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Universal Flip Wallet Leather Case',
    description: 'Brown leather-look flip wallet phone case, slightly open',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a brown leather-look flip wallet phone case, slightly open, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'tempered-glass-screen-protector',
    fileName: 'tempered-glass-screen-protector.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Tempered Glass Screen Protector',
    description: 'Clear tempered glass with thin black border',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a clear tempered glass screen protector with a thin black border, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'mini-power-bank-5000mah',
    fileName: 'mini-power-bank-5000mah.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Mini Portable Power Bank (5000mAh)',
    description: 'Small lipstick-sized white power bank',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a small lipstick-sized white power bank, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: 'wired-earphones-with-mic',
    fileName: 'wired-earphones-with-mic.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Wired 3.5mm Earphones with Mic',
    description: 'White wired earphones with inline mic, neatly coiled',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of white wired earphones with an inline mic, neatly coiled, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
  {
    id: '32gb-usb-flash-drive',
    fileName: '32gb-usb-flash-drive.jpg',
    bucket: 'product-images',
    dimensions: '1200x1200 px',
    title: 'Silver Metal USB Flash Drive',
    description: 'Small silver metal USB flash drive with keyring hole',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Product photo of a small silver metal USB flash drive with a keyring hole, centered, pure white seamless background, soft contact shadow, front three-quarter angle, no text, no logo, no brand marking.`,
  },
];

const STORE_TRUST_PROMPTS: PromptItem[] = [
  {
    id: 'about-shop-interior',
    fileName: 'about-shop-interior.jpg',
    bucket: 'banners',
    dimensions: '1600x900 px',
    title: 'Shop Interior Visual',
    description: 'Clean modern phone shop in Pakistan, glass display counters, warm lighting',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Interior of a clean modern mobile phone shop in Pakistan, glass display counters with generic unbranded phones and accessories, warm lighting, a shopkeeper in a smart shirt arranging items seen from behind, no readable signage, no logos, no text.`,
  },
  {
    id: 'about-repair-bench',
    fileName: 'about-repair-bench.jpg',
    bucket: 'banners',
    dimensions: '1600x900 px',
    title: 'Repair Bench & Diagnostics',
    description: 'Close-up of tidy repair workbench with precision screwdrivers, anti-static mat',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Close-up of a tidy mobile repair workbench with precision screwdrivers, a generic phone opened for battery replacement, anti-static mat, shallow depth of field, no text, no logos.`,
  },
  {
    id: 'trust-delivery',
    fileName: 'trust-delivery.jpg',
    bucket: 'banners',
    dimensions: '1600x900 px',
    title: 'Doorstep Courier Delivery',
    description: 'Courier passing small neatly packed parcel to customer at doorstep',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} A courier hand passing a small neatly packed parcel box to a customer's hand at a doorstep, daylight, friendly mood, faces not visible, no text, no logos.`,
  },
  {
    id: 'trust-warranty',
    fileName: 'trust-warranty.jpg',
    bucket: 'banners',
    dimensions: '1600x900 px',
    title: 'Shop Warranty & Unboxing Flat-lay',
    description: 'Generic smartphone box, blank warranty card, pen, earbuds on light wooden desk',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Neat flat-lay of a generic unbranded smartphone box, a blank warranty card, a pen and a pair of earbuds on a light wooden desk, no readable text, no logos.`,
  },
  {
    id: 'contact-map-background',
    fileName: 'contact-map-background.jpg',
    bucket: 'banners',
    dimensions: '1600x600 px',
    title: 'Contact Street Background',
    description: 'Abstract soft-focus city street at golden hour with blurred shop bokeh lights',
    rawPrompt: `${GLOBAL_STYLE_BLOCK} Abstract soft-focus city street at golden hour with blurred shop lights and bokeh, calm background for a contact section, no signage, no text, no logos.`,
  },
  {
    id: 'testimonials-background',
    fileName: 'testimonials-background.jpg',
    bucket: 'banners',
    dimensions: '1600x700 px',
    title: 'Testimonials Abstract Background',
    description: 'Soft abstract light-blue and white gradient with subtle bokeh circles',
    rawPrompt: 'Soft abstract light-blue and white gradient with subtle bokeh circles, very clean, no objects, no people, no text.',
  },
];

type TabCategory = 'rules' | 'banners' | 'categories' | 'accessories' | 'store' | 'real-photos' | 'specs';

export const ImagePromptsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const [activeTab, setActiveTab] = useState<TabCategory>('rules');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Asset Generation Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Realistic AI Image Prompts & Visual Standards
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Standardized prompt book for generating photorealistic hero banners, category tiles, store visuals, and generic accessories. Compatible with Gemini / Imagen, Midjourney, DALL-E, and Flux.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/bulk-images"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Bulk Image Upload</span>
            </Link>
          </div>
        </div>

        {/* Global Copier Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Global Style Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Global Style Block (Paste at start of every prompt)
              </span>
              <button
                type="button"
                onClick={() => handleCopy('global-style', GLOBAL_STYLE_BLOCK)}
                className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'global-style' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'global-style' ? 'Copied!' : 'Copy Block'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
              {GLOBAL_STYLE_BLOCK}
            </p>
          </div>

          {/* Global Negative Prompt */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Global Negative Prompt (To avoid artifacts)
              </span>
              <button
                type="button"
                onClick={() => handleCopy('global-neg', GLOBAL_NEGATIVE_PROMPT)}
                className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'global-neg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'global-neg' ? 'Copied!' : 'Copy Negative'}</span>
              </button>
            </div>
            <p className="text-xs text-rose-800 font-mono bg-white p-2.5 rounded-lg border border-rose-200 leading-relaxed">
              {GLOBAL_NEGATIVE_PROMPT}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Zero-pill compliant segmented buttons) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rules' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Important Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'banners' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 1: Home Banners ({BANNERS_PROMPTS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 2: Category Tiles ({CATEGORY_PROMPTS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accessories')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'accessories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 3: Generic Accessories ({GENERIC_ACCESSORIES.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'store' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 4: Store & Trust Visuals ({STORE_TRUST_PROMPTS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('real-photos')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'real-photos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 5: Real Photos Required
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'specs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Section 6 & 7: Specs & Checklist
        </button>
      </div>

      {/* TAB CONTENT: RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">What AI Images CAN Be Used For</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span><strong>Store Hero Banners:</strong> Landscape backgrounds for sales, PTA approval, easy installments, and certified pre-owned highlights.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span><strong>Category Tiles:</strong> Clean generic device and accessory icons for category navigation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span><strong>About & Trust Section Visuals:</strong> Shop interior, repair workbenches, doorstep delivery scenes, and warranty displays.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span><strong>Generic Unbranded Accessories:</strong> Plain cables, universal shockproof cases, plain memory cards, and USB-C adapters without brand marks.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Strict Restrictions (Do NOT Generate)</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span><strong>No Branded Products:</strong> Never generate Samsung Galaxy A15, iPhone 13, AirPods Pro 2, etc. Customers expect real design accuracy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span><strong>No Real Brand Logos:</strong> No Apple logo, Samsung wordmark, or Xiaomi icons in generated artwork.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span><strong>No Text Inside Images:</strong> English and Urdu headings and buttons are rendered on the site so they stay sharp and dynamic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span><strong>No Fake People as Customers:</strong> Never use AI portraits for customer reviews. Use initials avatars instead.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANNERS, CATEGORIES, ACCESSORIES, STORE */}
      {['banners', 'categories', 'accessories', 'store'].includes(activeTab) && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Instructions:</p>
              <p className="text-blue-800 mt-0.5">
                Click <strong>"Copy Full Prompt"</strong> on any item to copy the ready-to-use prompt (including the Global Style Block). Paste directly into Gemini, Midjourney, DALL-E, or Flux. Save with the exact filename shown and upload to the designated storage bucket.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(activeTab === 'banners'
              ? BANNERS_PROMPTS
              : activeTab === 'categories'
              ? CATEGORY_PROMPTS
              : activeTab === 'accessories'
              ? GENERIC_ACCESSORIES
              : STORE_TRUST_PROMPTS
            ).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</h4>
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                        {item.fileName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-slate-400">
                      Bucket: <strong className="text-slate-700 font-mono">{item.bucket}</strong>
                    </span>
                    <span className="text-slate-400">
                      Target: <strong className="text-slate-700 font-mono">{item.dimensions}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.rawPrompt)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedKey === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === item.id ? 'Copied!' : 'Copy Full Prompt'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Prompt:
                  </span>
                  <p className="text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed select-all">
                    {item.rawPrompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REAL PHOTOS REQUIRED */}
      {activeTab === 'real-photos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Real Photos Required (Do NOT Generate with AI)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every branded smartphone, tablet, smartwatch, and premium accessory in your catalog must use actual photos taken by you or provided by official brand distributors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Branded Products List:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>• All smartphones by <strong>Samsung, Apple, Xiaomi/Redmi, Infinix, Tecno, Oppo, Vivo, Realme, Itel</strong>.</li>
                <li>• All <strong>used / pre-owned phones</strong> (take photos of the specific unit: screen, back, edges, battery health).</li>
                <li>• Branded fast chargers & adapters (Anker, Baseus, Oraimo, Samsung, Apple).</li>
                <li>• Branded power banks, true wireless earbuds, and portable speakers.</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Photo Checklist for Real Products:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>1. <strong>Background:</strong> Plain white or light-grey sheet of paper or table near a natural window.</li>
                <li>2. <strong>Lighting:</strong> Soft daylight, no direct camera flash, no fingers obstructing the frame.</li>
                <li>3. <strong>Angle Shots:</strong> Front screen, back, sides, and sealed box.</li>
                <li>4. <strong>Naming:</strong> Name files <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">&lt;slug&gt;.jpg</code>, <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">&lt;slug&gt;-2.jpg</code> for auto-matching in Bulk Upload.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SPECS & CHECKLIST */}
      {activeTab === 'specs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Sizes, Storage Buckets, and Quality Checks
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Always adhere to maximum file size limits to ensure snappy browsing on Pakistani mobile networks (Jazz, Telenor, Zong, Ufone).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Asset Type</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Target Size</th>
                  <th className="p-3">Storage Bucket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                <tr>
                  <td className="p-3 font-sans font-semibold">Hero Banners</td>
                  <td className="p-3">1920x720 px</td>
                  <td className="p-3">webp / jpg</td>
                  <td className="p-3">&lt; 400 KB</td>
                  <td className="p-3 text-blue-600">banners</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold">Category Tiles</td>
                  <td className="p-3">800x800 px</td>
                  <td className="p-3">webp / jpg</td>
                  <td className="p-3">&lt; 150 KB</td>
                  <td className="p-3 text-blue-600">category-icons</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold">Product Images</td>
                  <td className="p-3">1200x1200 px</td>
                  <td className="p-3">webp / jpg</td>
                  <td className="p-3">&lt; 200 KB</td>
                  <td className="p-3 text-blue-600">product-images</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold">Store / Trust Visuals</td>
                  <td className="p-3">1600x900 px</td>
                  <td className="p-3">webp / jpg</td>
                  <td className="p-3">&lt; 300 KB</td>
                  <td className="p-3 text-blue-600">banners</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Final Quality Check Before Uploading:</span>
            </h4>
            <ul className="space-y-1 text-amber-800 list-disc list-inside">
              <li><strong>Zoom in:</strong> Check for warped camera bumps, extra holes, broken text, or melted buttons.</li>
              <li><strong>Check Hands:</strong> If hands appear in the frame, verify correct finger count (5 fingers).</li>
              <li><strong>No brand logos:</strong> Ensure no copyright trademarks (e.g. Apple logo or Samsung typography) are present.</li>
              <li><strong>WebP Optimization:</strong> Use our Bulk Image Upload page to automatically resize and compress photos in the browser.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
