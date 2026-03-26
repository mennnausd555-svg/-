import React from 'react';

interface LoadingVideoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function LoadingVideo({ className = '', size = 'md' }: LoadingVideoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64 md:w-80 md:h-80'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <video 
        src="/logo-video.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
