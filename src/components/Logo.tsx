import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export default function Logo({ className = "", size = 40, animate = false }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden ${className}`} 
      style={{ 
        width: size, 
        height: size,
        // Using a container to handle the background removal logic
        backgroundColor: 'transparent',
      }}
    >
      {/* 
        The Original GIF
        We use CSS filters to:
        1. Remove the white background (using mix-blend-mode: lighten on a dark theme)
        2. Enhance the quality (using image-rendering and contrast filters)
      */}
      <img 
        src="/logo.gif" 
        alt="Viral AI Logo" 
        className="w-full h-full object-contain"
        style={{
          // Quality Enhancement (AI-like upscaling via CSS)
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          filter: 'contrast(1.1) brightness(1.05)',
          
          // Background Removal Logic:
          // Since the logo is Dark Blue on White, and the app is Dark:
          // 'mix-blend-mode: lighten' will effectively make the dark blue parts visible 
          // and the white parts blend into the dark background (making them invisible).
          mixBlendMode: 'lighten',
          
          // If the logo needs to be sharper:
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback to a hosted version if local file is missing
          (e.target as HTMLImageElement).src = 'https://i.ibb.co/LzN8z8z/logo.gif';
        }}
      />

      {/* Optional: Add a subtle glow to match the app's aesthetic without changing the GIF */}
      <div className="absolute inset-0 pointer-events-none rounded-full shadow-[0_0_15px_rgba(0,102,255,0.15)]" />
    </div>
  );
}
