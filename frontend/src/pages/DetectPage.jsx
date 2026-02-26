import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiSearch, FiImage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DetectPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [plantName, setPlantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { langName, t } = useLanguage();

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const removeImage = () => {
    setFile(null);
    setPreview(null);
  };

  const handlePredict = async () => {
    if (!file) {
      toast.error('Please upload an image');
      return;
    }

    setLoading(true);
    try {
      const data = await api.predict(file, langName);

      // Extract plant name from prediction class (e.g. "Tomato___Late_blight" → "Tomato")
      const inferredName = (data.prediction.class || '').split('___')[0].replaceAll('_', ' ');

      // Save to history
      const historyItem = {
        id: Date.now(),
        plantName: plantName.trim() || inferredName || 'Plant',
        disease: data.prediction.class,
        confidence: data.prediction.confidence,
        diseaseInfo: data.disease_information,
        image: preview,
        timestamp: new Date().toISOString(),
        rating: null,
        language: langName,
      };

      const history = JSON.parse(localStorage.getItem('croply-history') || '[]');
      history.unshift(historyItem);
      localStorage.setItem('croply-history', JSON.stringify(history.slice(0, 50)));

      // Navigate to results
      navigate('/results', { state: { result: historyItem } });
    } catch (err) {
      toast.error('Prediction failed. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold gradient-text mb-3">{t('uploadTitle')}</h1>
        <p className="text-gray-400">{t('uploadDesc')}</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 mb-6"
      >
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById('file-input').click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? 'border-primary-400 bg-primary-500/10'
                  : 'border-white/10 hover:border-primary-500/50 hover:bg-white/5'
              }`}
            >
              <motion.div
                animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              >
                <FiUpload className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {dragOver ? t('dragDrop') : t('orBrowse')}
                </p>
                <p className="text-gray-500 text-sm">{t('supportedFormats')}</p>
              </motion.div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-80 object-contain rounded-xl"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={removeImage}
                className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </motion.button>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                <FiImage className="w-4 h-4" />
                {file?.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Plant Name Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-6"
      >
        <label className="block text-sm font-medium text-gray-300 mb-2">{t('plantNameLabel')}</label>
        <input
          type="text"
          value={plantName}
          onChange={(e) => setPlantName(e.target.value)}
          placeholder={t('plantNamePlaceholder')}
          className="input-field"
        />
      </motion.div>

      {/* Predict Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {loading ? (
          <LoadingSpinner text={t('analyzing')} />
        ) : (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePredict}
            disabled={!file}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
          >
            <FiSearch className="w-5 h-5" />
            {t('analyzeBtn')}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
