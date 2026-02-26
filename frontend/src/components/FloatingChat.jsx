import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiTrash2, FiMessageCircle, FiMinimize2 } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../config/api';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  '🍅 Tomato blight help',
  '🌿 Organic pest control',
  '💧 Watering schedule tips',
  '🌞 Best indoor plants',
];

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() =>
    JSON.parse(localStorage.getItem('croply-float-chat') || '[]')
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { langName, t } = useLanguage();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages
  useEffect(() => {
    localStorage.setItem('croply-float-chat', JSON.stringify(messages.slice(-80)));
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg, time: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build history for context (exclude errors, strip time)
      const chatHistory = updatedMessages
        .filter((m) => !m.error)
        .map(({ role, content }) => ({ role, content }));
      const data = await api.chat(msg, langName, chatHistory);
      const aiMsg = {
        role: 'assistant',
        content: data.response || data.raw_content || JSON.stringify(data),
        time: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Make sure the backend server is running.',
          time: Date.now(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('croply-float-chat');
  };

  return (
    <>
      {/* ── Chat Window ──────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-[9999] w-[370px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] 
                       flex flex-col rounded-2xl overflow-hidden shadow-2xl
                       bg-dark-800/95 backdrop-blur-xl border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600">
              <div className="flex items-center gap-2">
                <PiPlantFill className="w-5 h-5 text-white" />
                <span className="font-semibold text-white text-sm">{t('floatingChatTitle')}</span>
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80"
                    title="Clear chat"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80"
                  title="Minimize"
                >
                  <FiMinimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <PiPlantFill className="w-12 h-12 text-primary-500/30 mb-3" />
                  </motion.div>
                  <p className="text-gray-400 text-sm mb-1 font-medium">{t('floatingChatWelcome')}</p>
                  <p className="text-gray-500 text-xs mb-4">
                    {t('floatingChatDesc')}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {QUICK_PROMPTS.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => sendMessage(q)}
                        className="text-left text-xs p-2 rounded-lg bg-white/5 hover:bg-white/10 
                                   transition-colors text-gray-300 border border-white/5"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.time + '-' + i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-500/20 border border-primary-500/30 text-white rounded-br-sm'
                            : msg.error
                              ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
                              : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_strong]:text-primary-300">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-xs">{msg.content}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-1.5 text-right">
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary-400"
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2.5 border-t border-white/10 bg-dark-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('askAnything')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white 
                             placeholder-gray-500 outline-none focus:border-primary-500/50 transition-colors"
                  disabled={loading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-primary-500 rounded-xl text-white disabled:opacity-30 
                             disabled:cursor-not-allowed hover:bg-primary-400 transition-colors shrink-0"
                >
                  <FiSend className="w-3.5 h-3.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Toggle Button ───────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full 
                   bg-gradient-to-br from-primary-500 to-accent-600 text-white
                   shadow-lg shadow-primary-500/30 flex items-center justify-center
                   hover:shadow-xl hover:shadow-primary-500/40 transition-shadow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <FiX className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <FiMessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                         text-[10px] font-bold flex items-center justify-center text-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
