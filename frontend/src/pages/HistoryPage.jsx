import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiTrash2, FiClock, FiSearch, FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

function getSeverityInfo(confidence) {
  if (confidence >= 85) return { level: 'Severe', color: 'text-red-400', bg: 'bg-red-500/10', icon: FiAlertTriangle };
  if (confidence >= 60) return { level: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: FiAlertCircle };
  return { level: 'Mild', color: 'text-green-400', bg: 'bg-green-500/10', icon: FiCheckCircle };
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('croply-history') || '[]');
    setHistory(stored);
  }, []);

  const filtered = history.filter((h) =>
    h.plantName?.toLowerCase().includes(search.toLowerCase()) ||
    h.disease?.toLowerCase().includes(search.toLowerCase())
  );

  const clearHistory = () => {
    localStorage.removeItem('croply-history');
    setHistory([]);
    toast.success('History cleared');
  };

  const deleteItem = (id) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('croply-history', JSON.stringify(updated));
    toast.success('Entry removed');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-1">{t('historyTitle')}</h1>
          <p className="text-gray-500 text-sm">{history.length} {t('historyDesc')}</p>
        </div>
        {history.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm hover:bg-red-500/20 transition-all"
          >
            <FiTrash2 className="w-4 h-4" /> {t('clearAll')}
          </motion.button>
        )}
      </motion.div>

      {/* Search */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 relative"
        >
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-field pl-12"
          />
        </motion.div>
      )}

      {/* History List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FiClock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            {history.length === 0 ? t('noHistory') : t('error')}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {history.length === 0 ? t('noHistoryDesc') : t('retry')}
          </p>
          {history.length === 0 && (
            <Link to="/detect" className="btn-primary inline-flex items-center gap-2">
              {t('detectDisease')}
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((item, idx) => {
              const sev = getSeverityInfo(item.confidence);
              const SevIcon = sev.icon;
              const diseaseName = (item.disease || '').replaceAll('___', ' — ').replaceAll('_', ' ');

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass-card p-4 flex items-center gap-4 group"
                >
                  {/* Thumbnail */}
                  {item.image && (
                    <Link to="/results" state={{ result: item }}>
                      <img
                        src={item.image}
                        alt=""
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to="/results" state={{ result: item }} className="hover:underline">
                      <h3 className="font-semibold text-white truncate">{item.plantName}</h3>
                    </Link>
                    <p className="text-sm text-gray-400 truncate">{diseaseName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {/* Severity Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${sev.bg} flex-shrink-0`}>
                    <SevIcon className={`w-4 h-4 ${sev.color}`} />
                    <span className={`text-xs font-medium ${sev.color}`}>
                      {item.confidence.toFixed(0)}%
                    </span>
                  </div>

                  {/* Rating */}
                  {item.rating && (
                    <div className="flex-shrink-0">
                      {item.rating === 'up' ? (
                        <FiThumbsUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <FiThumbsDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}

                  {/* Delete */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteItem(item.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 flex-shrink-0"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
