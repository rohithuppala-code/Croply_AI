import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiTrash2, FiCpu } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { useLanguage } from '../context/LanguageContext';
import api from '../config/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'How do I prevent tomato blight?',
  'What causes yellow spots on rose leaves?',
  'Best organic fungicide for grapes?',
  'How to treat powdery mildew naturally?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState(() =>
    JSON.parse(localStorage.getItem('croply-chat') || '[]')
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { langName, t } = useLanguage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('croply-chat', JSON.stringify(messages.slice(-100)));
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg = { role: 'user', content: msg, time: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build history for context (exclude error messages, strip time field)
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
    } catch {
      const errMsg = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your request. Please make sure the backend is running.',
        time: Date.now(),
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error('Chat failed');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('croply-chat');
    toast.success('Chat cleared');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FiCpu /> {t('chatTitle')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('chatDesc')}</p>
        </div>
        {messages.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <PiPlantFill className="w-16 h-16 text-primary-500/30 mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">{t('howCanIHelp')}</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              {t('chatWelcome')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm p-3 glass-card hover:bg-white/10 transition-all text-gray-300"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.time + i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-500/20 border border-primary-500/30 text-white'
                      : msg.error
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                        : 'glass-card text-gray-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-1 [&_strong]:text-primary-300">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-card px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary-400"
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm px-2"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-primary-500 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-400 transition-colors"
          >
            <FiSend className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
