import React, { useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  Eye, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle,
  XCircle,
  Phone,
  MapPin,
  ExternalLink,
  DollarSign,
  Loader2,
  X
} from 'lucide-react';
import { orderAdminService } from '../../services/orderAdminService';
import type { Order, OrderStatus, OrderStats } from '../../types/order';
import { getStatusDisplay, openWhatsAppChat, generateOrderStatusMessage } from '../../utils/whatsapp';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';

export const OrdersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [markingSentId, setMarkingSentId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setErrorMessage(null);
      const [ordersRes, statsRes] = await Promise.all([
        orderAdminService.getAdminOrders({
          status: statusFilter,
          search: searchQuery,
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
        orderAdminService.getOrderStats(),
      ]);

      if (ordersRes.error) {
        setErrorMessage(ordersRes.error);
      } else {
        setOrders(ordersRes.data);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error fetching orders from database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      loadData();
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuickWhatsApp = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateOrderStatusMessage(order);
    openWhatsAppChat(order.customer_phone, msg);
    // Explicitly does NOT automatically log whatsapp_sent_at. Opening wa.me does not guarantee sent message.
  };

  const handleQuickMarkSent = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingSentId(order.id);
    setErrorMessage(null);
    try {
      const res = await orderAdminService.markWhatsAppSent(order.id);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setOrders(prev => prev.map(o => o.id === order.id ? res.data! : o));
        setToastMessage(`Order #${order.id.slice(0, 8).toUpperCase()}: WhatsApp marked as sent.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to mark WhatsApp as sent');
    } finally {
      setMarkingSentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('orders.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {stats?.total ?? orders.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('orders.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? t('common.loading') : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">{t('orders.stats.totalOrders')}</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-bold">{t('orders.stats.pending')}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-xs font-bold">{t('orders.stats.processing')}</span>
              <Truck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600">{stats.processing + stats.shipped}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold">{t('orders.stats.delivered')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.delivered}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">{t('orders.stats.totalRevenue')}</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-700 font-mono">
              PKR {stats.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? t('orders.allStatuses') : t(`orders.status.${status}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Query Warning: </strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Orders Table / Cards */}
      {loading ? (
        <LoadingState message="Loading orders directly from Supabase database..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title={t('orders.noOrders')}
          message={t('orders.noOrdersDesc')}
          icon={<ShoppingBag className="w-8 h-8 text-blue-600" />}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">{t('orders.tableOrderId')}</th>
                  <th className="py-3 px-4">{t('orders.tableCustomer')}</th>
                  <th className="py-3 px-4">{t('orders.tableItems')}</th>
                  <th className="py-3 px-4">{t('orders.tableTotal')}</th>
                  <th className="py-3 px-4">{t('orders.tableStatus')}</th>
                  <th className="py-3 px-4">{t('orders.tableDate')}</th>
                  <th className="py-3 px-4 text-center">{t('orders.tableWhatsApp')}</th>
                  <th className="py-3 px-4 text-right">{t('orders.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((order) => {
                  const statusInfo = getStatusDisplay(order.status, isUrdu ? 'ur' : 'en');
                  const shortId = order.id.slice(0, 8).toUpperCase();
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
                    : 0;
                  const dateFormatted = new Date(order.created_at).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>#{shortId}</span>
                        </Link>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customer_phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{order.delivery_address}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                        {Array.isArray(order.items) && order.items[0] && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {order.items[0].name_en || order.items[0].name_ur}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900">
                        PKR {Number(order.total_price).toLocaleString()}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {dateFormatted}
                      </td>

                      {/* WhatsApp Quick Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleQuickWhatsApp(order, e)}
                            title="Open WhatsApp chat with formatted order notification"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          {order.whatsapp_sent_at ? (
                            <span 
                              className="text-[9px] text-emerald-700 font-semibold inline-flex items-center gap-0.5"
                              title={`Sent on ${new Date(order.whatsapp_sent_at).toLocaleString('en-PK')}`}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Sent {new Date(order.whatsapp_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={markingSentId === order.id}
                              onClick={(e) => handleQuickMarkSent(order, e)}
                              title="Mark WhatsApp as sent manually"
                              className="text-[9px] text-slate-500 hover:text-emerald-700 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {markingSentId === order.id ? (
                                <>
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                                  <span>Marking...</span>
                                </>
                              ) : (
                                <span>Mark as Sent</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('orders.viewDetails')}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
