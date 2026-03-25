import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget() {
  return (
    <a 
      href="https://wa.me/201022049346" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </a>
  );
}
