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
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

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
        <svg
          viewBox="0 0 1024 1024"
          className="w-full h-full drop-shadow-[0_0_30px_rgba(0,102,255,0.15)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Silhouette (Brain + Glasses) */}
          <path
            d="M512 128C400 128 300 180 256 260C220 260 192 288 192 324C192 360 220 388 256 388C256 420 270 450 300 470C250 500 220 550 220 600C220 720 320 820 440 820C460 820 480 815 500 805C505 810 512 815 520 815C528 815 535 810 540 805C560 815 580 820 600 820C720 820 820 720 820 600C820 550 790 500 740 470C770 450 784 420 784 388C820 388 848 360 848 324C848 288 820 260 784 260C740 180 640 128 528 128C520 128 512 128 512 128Z"
            fill="#2D328F"
          />
          
          {/* Crack in Brain */}
          <path
            d="M512 128C512 128 530 200 500 280C480 340 520 400 512 450"
            stroke="#050505"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />

          {/* Glasses Lenses (Cutouts) */}
          <circle cx="360" cy="580" r="140" fill="#050505" />
          <circle cx="664" cy="580" r="140" fill="#050505" />
          
          {/* Nose Shape (Cutout) */}
          <path
            d="M512 650C512 650 540 750 512 800C484 750 512 650 512 650Z"
            fill="#050505"
          />
          
          {/* Circuitry (Animated) */}
          <g className="circuits">
            {/* Left side circuits */}
            <path d="M350 250 L420 300 L380 360" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-1" />
            <circle cx="380" cy="360" r="6" fill="#FFFFFF" className="circuit-1" />
            
            <path d="M280 340 L320 400" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-2" />
            <circle cx="320" cy="400" r="6" fill="#FFFFFF" className="circuit-2" />

            <path d="M450 200 L480 260" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-3" />
            <circle cx="480" cy="260" r="6" fill="#FFFFFF" className="circuit-3" />

            {/* Right side circuits */}
            <path d="M650 220 L580 280 L620 340" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-4" />
            <circle cx="620" cy="340" r="6" fill="#FFFFFF" className="circuit-4" />
            
            <path d="M720 320 L680 380" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-5" />
            <circle cx="680" cy="380" r="6" fill="#FFFFFF" className="circuit-5" />
            
            <path d="M550 180 L530 240" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="circuit-6" />
            <circle cx="530" cy="240" r="6" fill="#FFFFFF" className="circuit-6" />
          </g>
        </svg>
      </motion.div>
      
      <style>{`
        .circuits path, .circuits circle {
          opacity: 0.15;
          filter: drop-shadow(0 0 0px #0066FF);
          animation: sequentialGlow 4.8s infinite;
        }
        
        .circuit-1 { animation-delay: 0s !important; }
        .circuit-2 { animation-delay: 0.8s !important; }
        .circuit-3 { animation-delay: 1.6s !important; }
        .circuit-4 { animation-delay: 2.4s !important; }
        .circuit-5 { animation-delay: 3.2s !important; }
        .circuit-6 { animation-delay: 4s !important; }

        @keyframes sequentialGlow {
          0%, 100% { 
            opacity: 0.15; 
            filter: drop-shadow(0 0 0px #0066FF); 
            stroke: #FFFFFF;
            fill: #FFFFFF;
          }
          15% { 
            opacity: 1; 
            filter: drop-shadow(0 0 15px #0066FF) drop-shadow(0 0 25px #0066FF); 
            stroke: #0066FF;
            fill: #0066FF;
          }
          30% { 
            opacity: 0.15; 
            filter: drop-shadow(0 0 0px #0066FF); 
            stroke: #FFFFFF;
            fill: #FFFFFF;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default LoadingScreen;
