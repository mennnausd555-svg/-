import React from 'react';
import { motion } from 'motion/react';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden"
    >
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-72 h-72 md:w-96 md:h-96 flex flex-col items-center justify-center"
      >
        <img
          src="/logo-video.mp4 (1).gif"
          alt="Loading..."
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
