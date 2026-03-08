import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cat, Heart } from 'lucide-react';

export default function InteractiveCat({ isEnglish }: { isEnglish: boolean }) {
  const [isHappy, setIsHappy] = useState(false);
  const [clicks, setClicks] = useState(0);

  const handleClick = () => {
    setIsHappy(true);
    setClicks(c => c + 1);
    setTimeout(() => setIsHappy(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="relative group cursor-pointer"
      >
        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 ${isHappy ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'bg-white/5 border-white/10 hover:bg-brand-primary/20 hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(0,102,255,0.2)]'}`}
        >
          <Cat className={`w-12 h-12 transition-colors duration-500 ${isHappy ? 'text-rose-400' : 'text-dim group-hover:text-brand-primary'}`} />
        </div>
        
        <AnimatePresence>
          {isHappy && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-rose-400"
            >
              <Heart className="w-8 h-8 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-black text-white tracking-tight">
          {isEnglish ? "You've reached the end!" : "لقد وصلت إلى النهاية!"}
        </p>
        <p className="text-sm text-dim font-bold">
          {clicks > 0 
            ? (isEnglish ? `You pet the cat ${clicks} times` : `لقد قمت بملاعبة القط ${clicks} مرات`)
            : (isEnglish ? "Pet the cat for good luck" : "لاعب القط لجلب الحظ")}
        </p>
      </div>
    </div>
  );
}
