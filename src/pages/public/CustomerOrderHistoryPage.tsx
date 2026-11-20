/**
 * Paracha Mobile Shop — Customer Order History & Tracking View
 * Accessible from user profile, header, footer, or direct link.
 * Allows customers to check the real-time status of past orders using their Order ID.
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Phone,
  MessageSquare,
  Printer,
  ChevronRight,
  ArrowLeft,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  ShoppingBag,
  ExternalLink,
  Trash2,
  Info
} from 'lucide-react';
import { customerOrderService } from '../../services/customerOrderService';
import type { Order, OrderStatus, OrderItem } from '../../types/order';
import { getProductImageUrl, handleProductImageError } from '../../utils/productImages';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export const CustomerOrderHistoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isUrdu = i18n.language?.startsWith('ur');

  const [inputOrderId, setInputOrderId] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [savedOrders, setSavedOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [, startTransition] = useTransition();

  // Load saved orders on mount
  useEffect(() => {
    customerOrderService.getSavedOrders().then((orders) => {
      setSavedOrders(orders);
    });
  }, []);

  // Check query params for ?orderId= or ?id=
  useEffect(() => {
    const paramId = searchParams.get('orderId') || searchParams.get('id');
    if (paramId && paramId.trim()) {
      setInputOrderId(paramId.trim());
      handleLookup(paramId.trim());
    }
  }, [searchParams]);

  const handleLookup = async (idToSearch?: string) => {
    const targetId = (idToSearch || inputOrderId).trim();
    if (!targetId) {
      setSearchError(isUrdu ? 'برائے مہربانی آرڈر آئی ڈی درج کریں۔' : 'Please enter an Order ID.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const { data, error } = await customerOrderService.lookupOrder(targetId);
    setIsSearching(false);

    if (error || !data) {
      setSearchError(error || (isUrdu ? 'آرڈر نہیں ملا۔' : 'Order not found.'));
      setActiveOrder(null);
    } else {
      setActiveOrder(data);
      setSearchError(null);
      // Update URL param without refreshing
      setSearchParams({ orderId: data.id }, { replace: true });
      // Refresh local saved list
      customerOrderService.getSavedOrders().then(setSavedOrders);
    }
  };

  const handleClearSearch = () => {
    setInputOrderId('');
    setSearchError(null);
  };

  const handleSelectSaved = (order: Order) => {
    setActiveOrder(order);
    setInputOrderId(order.id);
    setSearchError(null);
    setSearchParams({ orderId: order.id }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveSaved = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    const updated = customerOrderService.removeOrderFromLocalStorage(orderId);
    setSavedOrders(updated);
    if (activeOrder?.id === orderId) {
      setActiveOrder(null);
      setSearchParams({}, { replace: true });
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareLink = (id: string) => {
    const url = `${window.location.origin}/order-history?orderId=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp inquiry link
  const getWhatsAppInquiryUrl = (order: Order) => {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const message = isUrdu
      ? `السلام علیکم پراچہ موبائل شاپ! مجھے اپنے آرڈر نمبر #${shortId} (مکمل آئی ڈی: ${order.id}) کے حوالے سے معلومات درکار ہیں۔`
      : `Assalam-o-Alaikum Paracha Mobile Shop! I would like an update on my Order #${shortId} (ID: ${order.id}).`;
    return `https://wa.me/923001234567?text=${encodeURIComponent(message)}`;
  };

  // Filter saved orders
  const filteredOrders = useMemo(() => {
    return savedOrders.filter((order) => {
      if (filter === 'active') {
        return ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status);
      }
      if (filter === 'completed') {
        return order.status === 'delivered';
      }
      if (filter === 'cancelled') {
        return order.status === 'cancelled';
      }
      return true;
    });
  }, [savedOrders, filter]);

  // Stepper definition
  const steps: { key: OrderStatus; labelEn: string; labelUr: string; descEn: string; descUr: string }[] = [
    {
      key: 'pending',
      labelEn: 'Order Placed',
      labelUr: 'آرڈر موصول ہوا',
      descEn: 'Order submitted and awaiting verification',
      descUr: 'آرڈر موصول ہو چکا ہے اور تصدیق کے انتظار میں ہے',
    },
    {
      key: 'confirmed',
      labelEn: 'Confirmed',
      labelUr: 'تصدیق شدہ',
      descEn: 'Verified by Paracha Mobile store team',
      descUr: 'اسٹور کی جانب سے فون اور دستیابی کی تصدیق',
    },
    {
      key: 'processing',
      labelEn: 'Packaging & Check',
      labelUr: 'پیکنگ اور کوالٹی چیک',
      descEn: '30-point diagnostics & tamper-proof pack',
      descUr: 'کوالٹی جانچ اور محفوظ پیکنگ',
    },
    {
      key: 'shipped',
      labelEn: 'Out for Delivery',
      labelUr: 'ارسال کر دیا گیا',
      descEn: 'Dispatched with insured courier tracking',
      descUr: 'کورئیر کو سونپ دیا گیا، جلد ڈیلیوری ہوگی',
    },
    {
      key: 'delivered',
      labelEn: 'Delivered',
      labelUr: 'ڈیلیور ہو چکا',
      descEn: 'Successfully delivered to your address',
      descUr: 'آرڈر باحفاظت ڈیلیور ہو چکا ہے',
    },
  ];

  const getStepStatus = (stepKey: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'cancelled') return 'cancelled';

    const orderHierarchy: Record<OrderStatus, number> = {
      pending: 1,
      confirmed: 2,
      processing: 3,
      shipped: 4,
      delivered: 5,
      cancelled: 0,
    };

    const stepIndex = orderHierarchy[stepKey];
    const currentIndex = orderHierarchy[currentStatus];

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          dotClass: 'bg-amber-500',
          textClass: 'text-amber-700',
          label: isUrdu ? 'زیر التواء (Pending)' : 'Pending Verification',
        };
      case 'confirmed':
        return {
          dotClass: 'bg-blue-500',
          textClass: 'text-blue-700',
          label: isUrdu ? 'تصدیق شدہ (Confirmed)' : 'Order Confirmed',
        };
      case 'processing':
        return {
          dotClass: 'bg-purple-500',
          textClass: 'text-purple-700',
          label: isUrdu ? 'تیاری کے مراحل میں (Processing)' : 'In Processing',
        };
      case 'shipped':
        return {
          dotClass: 'bg-indigo-500',
          textClass: 'text-indigo-700',
          label: isUrdu ? 'راستے میں (Out for Delivery)' : 'Out for Delivery',
        };
      case 'delivered':
        return {
          dotClass: 'bg-emerald-500',
          textClass: 'text-emerald-700',
          label: isUrdu ? 'ڈیلیور ہو چکا (Delivered)' : 'Delivered',
        };
      case 'cancelled':
        return {
          dotClass: 'bg-rose-500',
          textClass: 'text-rose-700',
          label: isUrdu ? 'منسوخ شدہ (Cancelled)' : 'Cancelled',
        };
      default:
        return {
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-600',
          label: status,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Banner / Header */}
      <div className="bg-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto space-y-4 text-center sm:text-left sm:flex sm:items-end sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-400">
              <Package className="w-4 h-4" />
              <span>{isUrdu ? 'کسٹمر پورٹل' : 'Customer Service'}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold text-white tracking-tight ${isUrdu ? 'font-urdu' : ''}`}>
              {t('customerOrders.title')}
            </h1>
            <p className={`text-slate-300 text-xs sm:text-sm leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
              {t('customerOrders.subtitle')}
            </p>
          </div>

          <div className="pt-4 sm:pt-0 flex items-center justify-center sm:justify-end gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              {isUrdu ? 'ملک بھر میں تیز ترسیل' : 'Express Delivery PK'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-400" />
              <span dir="ltr">+92 300 1234567</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {/* Search & Lookup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className={`text-base font-bold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                {t('customerOrders.lookupTitle')}
              </h2>
              <p className={`text-xs text-slate-500 mt-0.5 ${isUrdu ? 'font-urdu' : ''}`}>
                {t('customerOrders.lookupSubtitle')}
              </p>
            </div>
            {activeOrder && (
              <button
                type="button"
                onClick={() => {
                  setActiveOrder(null);
                  setSearchParams({}, { replace: true });
                }}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('customerOrders.backToList')}</span>
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                placeholder={t('customerOrders.lookupPlaceholder')}
                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-tight transition-all"
              />
              {inputOrderId && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-2 px-2 text-xs text-slate-400 hover:text-slate-600 flex items-center"
                >
                  {t('customerOrders.clear')}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('customerOrders.tracking')}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t('customerOrders.trackBtn')}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Order Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              {t('customerOrders.samplePrompt')}
            </span>
            {customerOrderService.getDemoOrders().map((demo, idx) => {
              const statusBadge = getStatusBadge(demo.status);
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    setInputOrderId(demo.id);
                    handleLookup(demo.id);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-md transition-colors text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                  title={`Status: ${demo.status} • Total: PKR ${demo.total_price.toLocaleString()}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                  <span>Sample #{idx + 1} ({demo.status})</span>
                </button>
              );
            })}
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{searchError}</p>
                <p className="text-rose-600 mt-0.5">
                  {isUrdu
                    ? 'برائے مہربانی اپنا 36 ہندسوں کا آرڈر آئی ڈی چیک کریں یا واٹس ایپ ہیلپ لائن پر رابطہ کریں۔'
                    : 'Check your confirmation SMS or WhatsApp invoice. If you made the purchase in-store, please contact customer support.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE ORDER DETAILS VIEW */}
        {activeOrder ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8 animate-fadeIn">
            {/* Order Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {t('customerOrders.orderNumber')}
                  </span>
                  <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-md">
                    <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      {activeOrder.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(activeOrder.id)}
                      className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                      title={t('customerOrders.copyId')}
                      aria-label="Copy order id"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(activeOrder.created_at).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full ${getStatusBadge(activeOrder.status).dotClass}`} />
                    <span className={getStatusBadge(activeOrder.status).textClass}>
                      {getStatusBadge(activeOrder.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={() => handleShareLink(activeOrder.id)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? t('customerOrders.copiedLink') : t('customerOrders.shareLink')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('customerOrders.printReceipt')}</span>
                </button>

                <a
                  href={getWhatsAppInquiryUrl(activeOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('customerOrders.contactSupport')}</span>
                </a>
              </div>
            </div>

            {/* Cancelled Banner if status is cancelled */}
            {activeOrder.status === 'cancelled' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">{t('customerOrders.cancelledNotice.title')}</h3>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {t('customerOrders.cancelledNotice.desc')}
                  </p>
                </div>
              </div>
            )}

            {/* Visual Status Progress Stepper */}
            {activeOrder.status !== 'cancelled' && (
              <div className="space-y-4 pt-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-400 ${isUrdu ? 'font-urdu' : ''}`}>
                  {t('customerOrders.statusTimeline')}
                </h3>

                <div className="relative">
                  {/* Desktop horizontal progress bar */}
                  <div className="hidden md:grid md:grid-cols-5 gap-2 relative">
                    {steps.map((step, idx) => {
                      const state = getStepStatus(step.key, activeOrder.status);
                      const isCompleted = state === 'completed';
                      const isCurrent = state === 'current';

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                          {/* Connector line */}
                          {idx < steps.length - 1 && (
                            <div
                              className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          {/* Node circle */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors z-10 ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isCurrent
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="space-y-0.5">
                            <p
                              className={`text-xs font-semibold ${
                                isCurrent
                                  ? 'text-blue-700 font-bold'
                                  : isCompleted
                                  ? 'text-slate-900'
                                  : 'text-slate-400'
                              } ${isUrdu ? 'font-urdu' : ''}`}
                            >
                              {isUrdu ? step.labelUr : step.labelEn}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {isUrdu ? step.descUr : step.descEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile vertical progress list */}
                  <div className="md:hidden space-y-4 border-l-2 border-slate-200 ml-4 pl-4">
                    {steps.map((step) => {
                      const state = getStepStatus(step.key, activeOrder.status);
                      const isCompleted = state === 'completed';
                      const isCurrent = state === 'current';

                      return (
                        <div key={step.key} className="relative space-y-1">
                          <div
                            className={`absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 bg-white ${
                              isCompleted
                                ? 'border-emerald-600 bg-emerald-600'
                                : isCurrent
                                ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-100'
                                : 'border-slate-300'
                            }`}
                          />
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                            } ${isUrdu ? 'font-urdu' : ''}`}
                          >
                            {isUrdu ? step.labelUr : step.labelEn}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {isUrdu ? step.descUr : step.descEn}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Details: Customer info & Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              {/* Left Column: Customer & Delivery Information */}
              <div className="space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-400 ${isUrdu ? 'font-urdu' : ''}`}>
                  {t('customerOrders.customerDetails')}
                </h3>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3.5 border border-slate-200/80 text-xs">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider">{t('customerOrders.customerName')}</p>
                      <p className="font-semibold text-slate-900">{activeOrder.customer_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider">{t('customerOrders.phone')}</p>
                      <p className="font-semibold text-slate-900 font-mono" dir="ltr">
                        {activeOrder.customer_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider">{t('customerOrders.deliveryAddress')}</p>
                      <p className="font-medium text-slate-700 leading-relaxed">{activeOrder.delivery_address}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <p className="text-slate-400 text-[11px] uppercase tracking-wider">{t('customerOrders.paymentMethod')}</p>
                    <p className="font-semibold text-slate-800">{t('customerOrders.cod')}</p>
                  </div>
                </div>

                {/* Helpline Box */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
                  <p className="font-bold text-blue-900">Need Immediate Help?</p>
                  <p className="text-blue-700 text-[11px] leading-relaxed">
                    Our sales representatives are available from 11:00 AM to 11:00 PM for tracking assistance.
                  </p>
                  <a
                    href="tel:+923001234567"
                    className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+92 300 1234567</span>
                  </a>
                </div>
              </div>

              {/* Right Column (2 cols wide): Purchased Items & Summary */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-400 ${isUrdu ? 'font-urdu' : ''}`}>
                  {t('customerOrders.itemsPurchased')}
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {Array.isArray(activeOrder.items) && activeOrder.items.length > 0 ? (
                    activeOrder.items.map((item: OrderItem, idx: number) => {
                      const fallbackImg = getProductImageUrl(null, 'smartphones');
                      const imgSrc = item.image_url || fallbackImg;

                      return (
                        <div key={idx} className="p-4 flex items-center gap-4 bg-white hover:bg-slate-50 transition-colors">
                          <img
                            src={imgSrc}
                            alt={item.name_en || 'Product item'}
                            loading="lazy"
                            onError={(e) => handleProductImageError(e, 'smartphones')}
                            className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {item.name_en}
                            </p>
                            {item.name_ur && (
                              <p className="text-xs text-slate-500 font-urdu truncate" dir="rtl">
                                {item.name_ur}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>Qty: {item.quantity || 1}</span>
                              <span aria-hidden="true">·</span>
                              <span>PKR {Number(item.price || 0).toLocaleString()} each</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">
                              PKR {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Standard package verified with store team.
                    </div>
                  )}
                </div>

                {/* Price Breakdown Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{t('customerOrders.subtotal')}</span>
                    <span className="font-medium">
                      PKR {Number(activeOrder.total_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('customerOrders.shipping')}</span>
                    <span className="text-emerald-600 font-semibold">{t('customerOrders.freeDelivery')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold text-sm">
                    <span>{t('customerOrders.grandTotal')}</span>
                    <span className="text-blue-700">
                      PKR {Number(activeOrder.total_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* SAVED PAST ORDERS LIST SECTION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className={`text-lg font-bold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                {t('customerOrders.savedHistoryTitle')}
              </h2>
              <p className={`text-xs text-slate-500 ${isUrdu ? 'font-urdu' : ''}`}>
                {t('customerOrders.savedHistorySubtitle')}
              </p>
            </div>

            {/* Filter buttons (Zero-pill compliant segmented control) */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('customerOrders.filterAll')}
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('customerOrders.filterActive')}
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('customerOrders.filterCompleted')}
              </button>
              <button
                type="button"
                onClick={() => setFilter('cancelled')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('customerOrders.filterCancelled')}
              </button>
            </div>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const isSelected = activeOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectSaved(order)}
                    className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer relative hover:shadow-md space-y-3 ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 truncate">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
                            <span className={badge.textClass}>{badge.label}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveSaved(e, order.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title={t('customerOrders.orderCard.remove')}
                        aria-label="Remove saved order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Items preview */}
                    <div className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <p className="truncate">
                          {order.items.map((it) => it.name_en || 'Device').join(', ')}
                        </p>
                      ) : (
                        <p>Store Package</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">{t('customerOrders.totalPayable')}</span>
                        <span className="font-bold text-slate-900">
                          PKR {Number(order.total_price || 0).toLocaleString()}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700">
                        <span>{t('customerOrders.orderCard.viewStatus')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t('customerOrders.noSavedOrders')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('customerOrders.noSavedOrdersDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
