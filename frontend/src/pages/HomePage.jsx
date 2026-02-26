import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiUpload, FiMessageSquare, FiShield, FiZap, FiGlobe, FiBarChart2 } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { useLanguage } from '../context/LanguageContext';

const featureKeys = [
  { icon: FiShield, titleKey: 'featureDetection', descKey: 'featureDetectionDesc' },
  { icon: FiMessageSquare, titleKey: 'featureChat', descKey: 'featureChatDesc' },
  { icon: FiBarChart2, titleKey: 'featureConfidence', descKey: 'featureConfidenceDesc' },
  { icon: FiZap, titleKey: 'featureSeverity', descKey: 'featureSeverityDesc' },
  { icon: FiGlobe, titleKey: 'featureMultiLang', descKey: 'featureMultiLangDesc' },
  { icon: FiUpload, titleKey: 'featurePdf', descKey: 'featurePdfDesc' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-20"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
          className="inline-block mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/30 rounded-full blur-2xl" />
            <PiPlantFill className="relative w-20 h-20 text-primary-400" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl sm:text-7xl font-black mb-4 tracking-tight"
        >
          <span className="gradient-text">{t('heroTitle')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-4 font-light"
        >
          {t('heroSubtitle')}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 max-w-xl mx-auto mb-10"
        >
          {t('heroDesc')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/detect">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 text-lg flex items-center gap-3"
            >
              <FiUpload className="w-5 h-5" />
              {t('detectDisease')}
            </motion.button>
          </Link>
          <Link to="/chat">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary px-8 py-4 text-lg flex items-center gap-3"
            >
              <FiMessageSquare className="w-5 h-5" />
              {t('chatNow')}
            </motion.button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
      >
        {featureKeys.map((f, i) => (
          <motion.div
            key={i}
            variants={item}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            className="glass-card p-6 group cursor-default"
          >
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
              <f.icon className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">{t(f.titleKey)}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t(f.descKey)}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <h2 className="text-3xl font-bold mb-12 gradient-text">{t('howItWorks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', titleKey: 'step01Title', descKey: 'step01Desc' },
            { step: '02', titleKey: 'step02Title', descKey: 'step02Desc' },
            { step: '03', titleKey: 'step03Title', descKey: 'step03Desc' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative"
            >
              <div className="text-6xl font-black text-primary-500/10 mb-2">{s.step}</div>
              <h3 className="text-xl font-semibold mb-2">{t(s.titleKey)}</h3>
              <p className="text-gray-400 text-sm">{t(s.descKey)}</p>
              {i < 2 && (
                <div className="hidden sm:block absolute top-8 -right-4 w-8 text-primary-500/30 text-2xl">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-white/5">
        <p className="text-gray-500 text-sm">
          {t('copyright')}
        </p>
      </footer>
    </div>
  );
}
