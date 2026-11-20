import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Info, 
  Phone, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Percent, 
  Headphones, 
  MapPin, 
  Mail, 
  Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {t('brand.shortName')}
        </span>
        <h1 className={`text-3xl sm:text-4xl font-extrabold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
          {t('nav.about')}
        </h1>
        <p className={`text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
          {t('footer.about')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Trust</h3>
          <p className="text-xs text-slate-500">100% genuine verified PTA devices with authentic paperwork.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Quality</h3>
          <p className="text-xs text-slate-500">Every used phone undergoes comprehensive 30-point diagnostics.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto">
            <Percent className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Technology</h3>
          <p className="text-xs text-slate-500">Latest flagships from Apple, Samsung, and top innovators.</p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className={`text-3xl sm:text-4xl font-extrabold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
          {t('nav.contact')}
        </h1>
        <p className="text-slate-600 text-sm">
          Get in touch with Paracha Mobile Shop for phone inquiries, orders, and warranty support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <div className="space-y-6">
          <h3 className="font-bold text-slate-900 text-lg border-b pb-3">Store Information</h3>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Location:</strong>
                <p>{t('footer.location')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Phone & WhatsApp:</strong>
                <p dir="ltr">{t('footer.phone')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Email:</strong>
                <p>{t('footer.email')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>Shop Hours:</strong>
                <p>Monday - Sunday: 11:00 AM – 11:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Direct Shop Helpline</h4>
            <p className="text-xs text-slate-500 mt-1">Speak directly with our technical sales team</p>
          </div>
          <a
            href="tel:+923001234567"
            dir="ltr"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>+92 300 1234567</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const CartPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.cart')}</h1>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Your cart is currently empty. Direct WhatsApp ordering and multi-item cart management are scheduled for Phase 3.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <span>Explore Store</span>
        </Link>
        <Link
          to="/order-history"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          <span>{t('nav.orderHistory')}</span>
        </Link>
      </div>
    </div>
  );
};

export const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
        <CreditCard className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.checkout')}</h1>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Checkout foundation with customer address, payment method, and instant WhatsApp notification will activate in Phase 3.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <span>Return to Home</span>
        </Link>
        <Link
          to="/order-history"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          <span>{t('nav.orderHistory')}</span>
        </Link>
      </div>
    </div>
  );
};

export const OffersPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('nav.offers')}</h1>
        <p className="text-slate-500 text-sm">Special promotions, bundles, and seasonal discounts</p>
      </div>

      <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <Percent className="w-12 h-12 text-blue-300 mx-auto" />
        <h2 className="text-2xl font-bold">Special Store Deals Coming Soon</h2>
        <p className="text-blue-100 text-xs sm:text-sm max-w-md mx-auto">
          Promotional banners and discounted bundles configured in the database will appear here.
        </p>
        <Link
          to="/shop"
          className="inline-block py-2.5 px-6 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors"
        >
          View All Mobiles
        </Link>
      </div>
    </div>
  );
};

export const AccessoriesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('nav.accessories')}</h1>
        <p className="text-slate-500 text-sm">Original chargers, cables, cases, screen protectors, and audio devices</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
        <Headphones className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Accessories Department</h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
          Original accessories catalog items from Anker, Apple, Samsung, and Joyroom will be populated in Phase 2.
        </p>
        <Link
          to="/shop"
          className="inline-block py-2.5 px-6 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
        >
          Explore Store
        </Link>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{t('footer.privacyPolicy')}</h1>
      <div className="prose prose-slate text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <p>
          At <strong>Paracha Mobile Shop</strong>, your privacy and trust are paramount. This privacy notice explains how we handle your information when you browse our catalog or place an order.
        </p>
        <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
        <p>
          When you place an order, we collect only necessary delivery information: customer name, contact phone number, and physical shipping address.
        </p>
        <h3 className="text-base font-bold text-slate-900">2. Row Level Security & Protection</h3>
        <p>
          All customer order data is protected by Supabase Row Level Security (RLS) policies, ensuring records are never publicly exposed.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{t('footer.termsOfService')}</h1>
      <div className="prose prose-slate text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <p>
          Welcome to <strong>Paracha Mobile Shop</strong>. By using our website and purchasing products, you agree to our terms and conditions.
        </p>
        <h3 className="text-base font-bold text-slate-900">1. Authenticity & PTA Status</h3>
        <p>
          All devices listed as PTA Approved are certified in accordance with Pakistan Telecommunication Authority guidelines.
        </p>
        <h3 className="text-base font-bold text-slate-900">2. Warranty Coverage</h3>
        <p>
          Official brand warranty applies to new devices according to manufacturer policies. Shop testing warranty applies to pre-owned devices as specified at purchase.
        </p>
      </div>
    </div>
  );
};
