import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Analyzing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-primary-500/20"
          style={{ borderTopColor: '#22c55e' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-accent-500/20"
          style={{ borderBottomColor: '#10b981' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <motion.p
        className="text-gray-400 text-sm font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
}
