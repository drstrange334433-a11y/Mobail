import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight, 
  ShoppingBag, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  PackageCheck,
  Send,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';
import { orderAdminService } from '../../services/orderAdminService';
import type { Order, OrderStatus } from '../../types/order';
import { 
  getStatusDisplay, 
  generateOrderStatusMessage, 
  openWhatsAppChat, 
  formatPakistaniPhoneNumber 
} from '../../utils/whatsapp';
import { normalizeImageUrl, getCategoryPlaceholderUrl, handleProductImageError } from '../../utils/productImages';
import { LoadingState } from '../../components/common/LoadingState';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status and WhatsApp notes
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [adminNote, setAdminNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const res = await orderAdminService.getOrderById(id);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setOrder(res.data);
        setSelectedStatus(res.data.status);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await orderAdminService.updateOrderStatus(order.id, newStatus);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setOrder(res.data);
        setSelectedStatus(res.data.status);
        setSuccessMessage(t('orders.details.statusUpdated'));
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!order) return;
    const msg = generateOrderStatusMessage(order, adminNote.trim() || undefined);
    openWhatsAppChat(order.customer_phone, msg);
    // Note: Opening wa.me does NOT automatically mark whatsapp_sent_at.
  };

  const handleMarkWhatsAppSent = async () => {
    if (!order) return;
    setMarkingSent(true);
    setErrorMessage(null);
    try {
      const res = await orderAdminService.markWhatsAppSent(order.id);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setOrder(res.data);
        setSuccessMessage(t('orders.details.markedSentSuccess'));
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to mark WhatsApp as sent');
    } finally {
      setMarkingSent(false);
    }
  };

  const handleCopyMessage = () => {
    if (!order) return;
    const msg = generateOrderStatusMessage(order, adminNote.trim() || undefined);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    if (!order) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      const res = await orderAdminService.deleteOrder(order.id);
      if (res.error) {
        setErrorMessage(res.error);
        setDeleting(false);
        setShowDeleteModal(false);
      } else {
        navigate('/admin/orders', { replace: true });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete order');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading order details from Supabase..." />;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested order ID may have been deleted or does not exist in the database.
        </p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          {isUrdu ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{t('orders.details.backToList')}</span>
        </Link>
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const statusInfo = getStatusDisplay(order.status, isUrdu ? 'ur' : 'en');
  const previewMessage = generateOrderStatusMessage(order, adminNote.trim() || undefined);
  const formattedPhone = formatPakistaniPhoneNumber(order.customer_phone);

  const statusesList: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'confirmed', label: t('orders.status.confirmed') },
    { value: 'processing', label: t('orders.status.processing') },
    { value: 'shipped', label: t('orders.status.shipped') },
    { value: 'delivered', label: t('orders.status.delivered') },
    { value: 'cancelled', label: t('orders.status.cancelled') },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-2xs"
          >
            {isUrdu ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Order #{shortId}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Full UUID: {order.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : t('orders.details.deleteOrder')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Items (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{t('orders.details.customerSection')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  {t('orders.details.customerName')}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {order.customer_name}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  {t('orders.details.customerPhone')}
                </span>
                <a
                  href={`tel:+${formattedPhone}`}
                  dir="ltr"
                  className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.customer_phone}</span>
                </a>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  {t('orders.details.deliveryAddress')}
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {order.delivery_address}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 sm:col-span-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('orders.details.createdOn')}:</span>
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {new Date(order.created_at).toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>

          {/* Purchased Items Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>{t('orders.details.itemsSection')}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {Array.isArray(order.items) ? order.items.length : 0} line items
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0">
                        {item.image_url ? (
                          <img
                            src={normalizeImageUrl(item.image_url)}
                            alt={item.name_en}
                            loading="lazy"
                            onError={(e) => handleProductImageError(e, null)}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={getCategoryPlaceholderUrl(null)}
                            alt={item.name_en}
                            loading="lazy"
                            className="w-full h-full object-contain opacity-80"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {isUrdu ? item.name_ur || item.name_en : item.name_en}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Qty: <span className="font-semibold text-slate-800">{item.quantity}</span> × PKR {Number(item.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold font-mono text-sm text-slate-900">
                      PKR {(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No line items detailed for this record.
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">
                {t('orders.details.totalAmount')}
              </span>
              <span className="text-xl font-black text-blue-700 font-mono">
                PKR {Number(order.total_price).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Status Update & WhatsApp Workflow */}
        <div className="space-y-6">
          {/* Status Control Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              <span>{t('orders.details.statusSection')}</span>
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('orders.details.updateStatus')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {statusesList.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => handleStatusUpdate(st.value)}
                    disabled={updating || order.status === st.value}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                      order.status === st.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {updating && (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('orders.details.updating')}</span>
              </div>
            )}
          </div>

          {/* WhatsApp Direct Workflow Card */}
          <div className="bg-linear-to-b from-emerald-50/50 to-white border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{t('orders.details.whatsappSection')}</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Direct Sync
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dispatch bilingual Urdu/English order confirmation, dispatch updates, and delivery notes straight to the customer's phone via WhatsApp.
            </p>

            {/* Optional Admin Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('orders.details.optionalNote')}
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={t('orders.details.optionalNotePlaceholder')}
                className="w-full text-xs p-2.5 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold">{t('orders.details.whatsAppTemplate')}</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? t('orders.details.copied') : t('orders.details.copyMessage')}</span>
                </button>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                {previewMessage}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{t('orders.details.sendWhatsApp')}</span>
              </button>

              <button
                type="button"
                onClick={handleMarkWhatsAppSent}
                disabled={markingSent}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
              >
                {markingSent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{markingSent ? t('orders.details.marking') : t('orders.details.markWhatsAppSent')}</span>
              </button>

              <div className="text-[11px] text-center text-slate-500 pt-1 border-t border-emerald-100">
                {order.whatsapp_sent_at ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1 justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('orders.details.lastSent')} {new Date(order.whatsapp_sent_at).toLocaleString('en-PK')}</span>
                  </span>
                ) : (
                  <span>{t('orders.details.neverSent')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation In-App Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {t('orders.details.deleteOrder')}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t('orders.details.deleteConfirm')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                Order #{shortId} — {order.customer_name}
              </div>
              <div className="text-slate-500 text-[11px]">
                Total: PKR {Number(order.total_price).toLocaleString()} • {order.customer_phone}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
