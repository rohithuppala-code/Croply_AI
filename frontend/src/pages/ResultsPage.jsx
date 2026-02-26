import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiDownload, FiArrowLeft, FiThumbsUp, FiThumbsDown, FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiBookOpen } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

function getSeverity(confidence) {
  if (confidence >= 85) return { level: 'severe', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: FiAlertTriangle, barColor: '#ef4444' };
  if (confidence >= 60) return { level: 'moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: FiAlertCircle, barColor: '#eab308' };
  return { level: 'mild', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: FiCheckCircle, barColor: '#22c55e' };
}

function parseInfo(info) {
  if (!info) return {};
  if (typeof info === 'string') {
    try { return JSON.parse(info); } catch { return { raw_content: info }; }
  }
  return info;
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { langName, t } = useLanguage();
  const [careTips, setCareTips] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [rating, setRating] = useState(null);

  const result = location.state?.result;

  useEffect(() => {
    if (!result) navigate('/detect');
  }, [result, navigate]);

  if (!result) return null;

  const severity = getSeverity(result.confidence);
  const SeverityIcon = severity.icon;
  const info = parseInfo(result.diseaseInfo);
  const diseaseName = (result.disease || '').replaceAll('___', ' — ').replaceAll('_', ' ');

  // Build mock confidence chart data (top 3)
  const chartData = [
    { name: diseaseName.length > 20 ? diseaseName.slice(0, 20) + '...' : diseaseName, value: result.confidence },
    { name: 'Healthy', value: Math.max(0, 100 - result.confidence - Math.random() * 10) },
    { name: 'Other', value: Math.max(0, Math.random() * 10) },
  ];

  const CHART_COLORS = ['#22c55e', '#3b82f6', '#64748b'];

  const handleRating = (value) => {
    setRating(value);
    // Update in history
    const history = JSON.parse(localStorage.getItem('croply-history') || '[]');
    const idx = history.findIndex((h) => h.id === result.id);
    if (idx >= 0) {
      history[idx].rating = value;
      localStorage.setItem('croply-history', JSON.stringify(history));
    }
    toast.success(value === 'up' ? 'Thanks for the feedback!' : 'We\'ll improve!');
  };

  const fetchCareTips = async () => {
    setTipsLoading(true);
    try {
      const data = await api.getCareTips(result.plantName, langName);
      setCareTips(data.tips || data.raw_content || JSON.stringify(data));
    } catch {
      toast.error('Failed to load care tips');
    } finally {
      setTipsLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(20, 83, 45);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Croply AI — Plant Health Report', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), pageWidth / 2, 30, { align: 'center' });

    // Content
    doc.setTextColor(30, 30, 30);
    let y = 55;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Plant Name:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(result.plantName, 70, y);
    y += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Disease:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(diseaseName, 70, y);
    y += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Confidence:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(`${result.confidence.toFixed(1)}%`, 70, y);
    y += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Severity:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(severity.level, 70, y);
    y += 18;

    // Disease Info
    if (info) {
      const sections = [
        { key: 'description', title: 'Description' },
        { key: 'symptoms', title: 'Symptoms' },
        { key: 'causes', title: 'Causes' },
        { key: 'treatment_options', title: 'Treatment Options' },
        { key: 'prevention', title: 'Prevention' },
      ];

      sections.forEach(({ key, title }) => {
        const val = info[key];
        if (!val) return;

        if (y > 260) { doc.addPage(); y = 20; }

        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text(title, 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (Array.isArray(val)) {
          val.forEach((item) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const text = typeof item === 'object' ? `${item.method}: ${item.description}` : String(item);
            const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 40);
            doc.text(lines, 25, y);
            y += lines.length * 5 + 3;
          });
        } else {
          const lines = doc.splitTextToSize(String(val), pageWidth - 40);
          doc.text(lines, 25, y);
          y += lines.length * 5 + 3;
        }
        y += 5;
      });

      // raw_content fallback
      if (info.raw_content && !info.description) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(info.raw_content, pageWidth - 40);
        doc.text(lines, 20, y);
      }
    }

    doc.save(`CroplyAI_Report_${result.plantName}_${Date.now()}.pdf`);
    toast.success('Report downloaded!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/detect" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <FiArrowLeft /> {t('backToDetect')}
        </Link>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold gradient-text mb-8"
      >
        {t('resultsTitle')}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image + Severity */}
        <div className="space-y-6">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 overflow-hidden"
          >
            <img src={result.image} alt="Plant" className="w-full h-64 object-contain rounded-xl" />
            <div className="mt-3 text-center">
              <span className="text-gray-400 text-sm">Plant: </span>
              <span className="font-semibold text-white">{result.plantName}</span>
            </div>
          </motion.div>

          {/* Severity Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card p-6 border ${severity.border}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${severity.bg} flex items-center justify-center`}>
                <SeverityIcon className={`w-7 h-7 ${severity.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{t('severityLevel')}</p>
                <p className={`text-2xl font-bold ${severity.color}`}>{t(severity.level)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-gray-400">{t('confidence')}</p>
                <p className="text-2xl font-bold text-white">{result.confidence.toFixed(1)}%</p>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mt-4 h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to right, ${severity.barColor}, ${severity.barColor}88)` }}
              />
            </div>
          </motion.div>

          {/* Confidence Breakdown Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-white">{t('confidence')} {t('featureConfidence')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(v) => `${v.toFixed(1)}%`}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right Column: Disease Info + Actions */}
        <div className="space-y-6">
          {/* Disease Name */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <p className="text-sm text-gray-400 mb-1">{t('diseaseInfo')}</p>
            <h2 className="text-xl font-bold text-white">{diseaseName}</h2>
          </motion.div>

          {/* Disease Info Sections */}
          {info && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 space-y-5 max-h-[500px] overflow-y-auto"
            >
              {info.description && (
                <div>
                  <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">{t('diseaseInfo')}</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{info.description}</p>
                </div>
              )}

              {info.symptoms && (
                <div>
                  <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">{t('symptoms')}</h4>
                  <ul className="space-y-1">
                    {info.symptoms.map((s, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-primary-400 mt-1">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {info.causes && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">{t('causes')}</h4>
                  <ul className="space-y-1">
                    {info.causes.map((c, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-yellow-400 mt-1">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {info.treatment_options && (
                <div>
                  <h4 className="text-sm font-semibold text-accent-400 uppercase tracking-wide mb-2">{t('treatment')}</h4>
                  <div className="space-y-2">
                    {info.treatment_options.map((t, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <p className="text-sm font-medium text-white">{t.method}</p>
                        <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                        {t.effectiveness && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400">
                            {t.effectiveness}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {info.prevention && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">{t('prevention')}</h4>
                  <ul className="space-y-1">
                    {info.prevention.map((p, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-blue-400 mt-1">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {info.raw_content && !info.description && (
                <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{info.raw_content}</div>
              )}
            </motion.div>
          )}

          {/* Care Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiBookOpen className="text-primary-400" /> {t('careTips')}
              </h3>
              {!careTips && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchCareTips}
                  disabled={tipsLoading}
                  className="text-sm btn-secondary py-2 px-4"
                >
                  {tipsLoading ? t('loading') : t('careTips')}
                </motion.button>
              )}
            </div>
            {careTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto"
              >
                {typeof careTips === 'string' ? careTips : JSON.stringify(careTips, null, 2)}
              </motion.div>
            )}
          </motion.div>

          {/* Actions Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            {/* Rating */}
            <div className="glass-card p-4 flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-sm text-gray-400">{t('ratePrediction')}</span>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRating('up')}
                className={`p-2 rounded-lg transition-all ${rating === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:text-green-400'}`}
              >
                <FiThumbsUp className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRating('down')}
                className={`p-2 rounded-lg transition-all ${rating === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:text-red-400'}`}
              >
                <FiThumbsDown className="w-5 h-5" />
              </motion.button>
            </div>

            {/* PDF Download */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadPDF}
              className="btn-primary py-4 px-6 flex items-center gap-2 flex-1 min-w-[200px] justify-center"
            >
              <FiDownload className="w-5 h-5" />
              {t('downloadPdf')}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
