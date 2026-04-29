// ─── Empty & Error State Components ──────────────────────────────────────────
// Professional fallback UIs for when data is missing or something fails.
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description = 'Data will appear here once available.', action, actionLabel = 'Refresh' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">{description}</p>
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'We encountered an unexpected error. Please try again.', onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export function OfflineState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium"
    >
      <WifiOff size={16} />
      You appear to be offline. Some features may be unavailable.
    </motion.div>
  );
}
