import React from 'react';
import Logo from './Logo';

export default function AnimatedLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="relative flex flex-col items-center justify-center gap-8">
        {/* Logo Component */}
        <Logo size={256} animate={true} className="text-brand-primary" />

        {/* Text Branding */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] animate-pulse">
            Viral AI
          </h3>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
