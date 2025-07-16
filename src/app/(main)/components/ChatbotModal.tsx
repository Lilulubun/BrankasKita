// src/app/components/ChatbotModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ChatbotModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ open, onClose }: ChatbotModalProps) {
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState('User');
  // const [file, setFile] = useState<File | null>(null); // This was unused
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hello! I am BrankasBot, how can I help you? :D' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const name = user?.user_metadata?.full_name || user?.email?.split('@')[0];
      setDisplayName(name || 'User');
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messages, isLoading, open]);

  const handleSend = async () => {
    if (!message || isLoading) return;
    setIsLoading(true);
    
    const userMessage = { role: 'user', content: message };
    const updatedMessagesForApi = [...messages.slice(1), userMessage]; // Don't send the initial greeting to the API
    setMessages([...messages, userMessage]);
    setMessage('');
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
    
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessagesForApi }),
      });
      const data = await res.json();
      // FIX: Removed setBotReply as it was unused. Directly update the messages state.
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch { // FIX: Removed unused 'err' variable
      setMessages(prev => [...prev, { role: 'model', content: 'Maaf, terjadi kesalahan.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // FIX: Removed the unused handleFileChange function.

  if (!open) return null;

  return (
    // ... your original JSX remains here ...
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 transition-colors duration-300 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-6 relative" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <button className="absolute top-4 right-4 text-xl" onClick={onClose}>✕</button>
        <div className="flex items-center space-x-2 font-semibold text-lg mb-4">
          <span>BrankasBot</span>
          <Image src="/bot.svg" width={24} height={24} alt="Bot Icon" />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold flex justify-center items-center gap-2">
            Hi, {displayName}
            <Image src="/bot.svg" width={28} height={28} alt="Bot Icon" />
          </h2>
          <p className="text-gray-600 mt-1">How can I help you today?</p>
        </div>
        <div
          ref={chatAreaRef}
          className="mb-4 max-h-64 sm:max-h-80 overflow-y-auto px-2"
          style={{ minHeight: '80px' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                (msg.role === 'user'
                  ? 'flex justify-end mb-2'
                  : 'flex justify-start mb-2')
              }
            >
              <div
                className={
                  (msg.role === 'user'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-800') +
                  ' rounded-2xl px-4 py-2 max-w-[80%] break-words shadow'
                }
                style={{ wordBreak: 'break-word' }}
              >
                <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-2">
              <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2 max-w-[80%] break-words shadow flex items-center gap-2">
                <span className="animate-pulse">Typing...</span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce inline-block ml-1" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce inline-block ml-1" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce inline-block ml-1" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-black rounded-2xl px-5 py-3 flex items-center justify-between w-full max-w-xl mx-auto shadow-2xl shadow-black/40 border border-black/60">
        <textarea
            ref={textareaRef}
            placeholder="Ask anything..."
            className="bg-transparent text-white text-left placeholder:text-gray-400 flex-grow outline-none resize-none h-auto text-base mx-3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            disabled={isLoading}
        />
        <button onClick={handleSend} className="text-white text-2xl leading-none">↑</button>
        </div>
      </div>
    </div>
  );
}