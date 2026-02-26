import { motion } from 'framer-motion';

const particles = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 6 + 3,
  delay: Math.random() * 4,
  duration: Math.random() * 5 + 4,
  color: i % 3 === 0 ? 'bg-primary-400/20' : i % 3 === 1 ? 'bg-accent-400/15' : 'bg-emerald-400/15',
}));

export default function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-15, 15, -15],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Glow orbs for depth */}
      <motion.div
        className="absolute w-72 h-72 bg-primary-500/8 rounded-full blur-3xl"
        style={{ top: '10%', left: '15%' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-accent-500/8 rounded-full blur-3xl"
        style={{ bottom: '15%', right: '10%' }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-48 h-48 bg-emerald-500/6 rounded-full blur-3xl"
        style={{ top: '50%', left: '60%' }}
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}
