import { motion } from 'framer-motion';
import { FiShield, FiSmile, FiZap, FiHeart, FiTarget, FiGlobe } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { useLanguage } from '../context/LanguageContext';

const features = [
  { icon: FiShield, title: 'Accurate Analysis', desc: 'ResNet50-based deep learning model trained on thousands of plant disease images.' },
  { icon: FiSmile, title: 'User-Friendly', desc: 'Intuitive interface designed for everyone — from farmers to hobbyist gardeners.' },
  { icon: FiZap, title: 'Fast & Reliable', desc: 'Get disease predictions in seconds with detailed treatment recommendations.' },
  { icon: FiGlobe, title: 'Multi-Language', desc: 'Results available in 8+ languages to serve a global community.' },
  { icon: FiTarget, title: 'Severity Scoring', desc: 'Instant severity assessment to prioritize treatment actions.' },
  { icon: FiHeart, title: 'AI-Powered Care', desc: 'Personalized plant care tips and an AI chatbot for any question.' },
];

const team = [
  { name: 'AI Disease Detection', desc: 'Powered by PyTorch ResNet50 with custom preprocessing pipeline' },
  { name: 'LLM Integration', desc: 'Groq-powered Llama3 for intelligent treatment recommendations' },
  { name: 'Modern Stack', desc: 'React, FastAPI, Tailwind CSS with beautiful animations' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="inline-block mb-4"
        >
          <PiPlantFill className="w-16 h-16 text-primary-400" />
        </motion.div>
        <h1 className="text-4xl font-bold gradient-text mb-4">{t('aboutTitle')}</h1>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {t('aboutDesc')}
        </p>
      </motion.div>

      {/* Features */}
      <motion.section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-10 gradient-text">Why Choose Croply AI?</h2>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              className="glass-card p-6 text-center group"
            >
              <div className="w-14 h-14 mx-auto bg-primary-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                <f.icon className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-10 gradient-text">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-6 text-center"
            >
              <h3 className="text-lg font-semibold text-primary-400 mb-2">{t.name}</h3>
              <p className="text-gray-400 text-sm">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Mission */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold gradient-text mb-6">Our Mission</h2>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-card p-8 max-w-2xl mx-auto border border-primary-500/20"
        >
          <p className="text-gray-300 leading-relaxed">
            Our mission is to promote healthier plants and sustainable agriculture by providing a smart,
            accessible, and efficient plant disease detection system. We believe technology can bridge the
            gap between expert plant pathology and everyday farming, ensuring food security and
            environmental sustainability.
          </p>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="text-center py-12 mt-16 border-t border-white/5">
        <p className="text-gray-500 text-sm">
          {t('copyright')}
        </p>
      </footer>
    </div>
  );
}
