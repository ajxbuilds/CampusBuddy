import React, { useState, useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { Sparkles } from 'lucide-react';

export const GamificationToast: React.FC = () => {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = Math.random().toString(36).substr(2, 9);

      setMessages(prev => [...prev, { id, text: customEvent.detail }]);

      // Automatically remove after 4s
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
      }, 4000);
    };

    window.addEventListener('gamification-toast', handleToast);
    return () => window.removeEventListener('gamification-toast', handleToast);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      const el = containerRef.current.lastElementChild;
      if (el) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          animate(el, {
            translateY: [20, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
          });
        }
      }
    }
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 sm:bottom-8 right-4 sm:right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
      {messages.map(m => (
        <div key={m.id} className="bg-slate-900 border border-slate-700 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-bold text-[13px] sm:text-sm tracking-wide">{m.text}</span>
        </div>
      ))}
    </div>
  );
};
