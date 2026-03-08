import React, { useState } from 'react';
import ScriptForm from './ScriptForm';
import ScriptResults from './ScriptResults';
import { generateScripts } from '../services/gemini';
import { ScriptResult, User } from '../types';
import { Wand2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { translations } from '../translations';

interface FreeCreationSectionProps {
  isEnglish: boolean;
  user: User;
}

export default function FreeCreationSection({ isEnglish, user }: FreeCreationSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScriptResult[]>([]);
  const [scriptId, setScriptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idea, setIdea] = useState<string>('');
  const t = isEnglish ? translations.en : translations.ar;

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setScriptId(null);
    setIdea(data.topic);
    try {
      // 1. Check limits first
      const limitRes = await fetch('/api/check-limits');
      if (!limitRes.ok) {
        const errorData = await limitRes.json();
        throw new Error(errorData.error || (isEnglish ? 'Failed to verify permissions' : 'فشل التحقق من الصلاحيات'));
      }

      // 2. Generate scripts
      const generatedScripts = await generateScripts(
        data.topic,
        null, // No specific format
        data.length,
        data.minutes,
        data.curiosityLevel,
        data.emotion,
        data.dialect,
        data.fileData
      );

      // Save to database
      try {
        const saveRes = await fetch('/api/scripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.topic || (isEnglish ? 'New Script (Free Creation)' : 'اسكربت جديد (إنشاء حر)'),
            content: generatedScripts,
            inputs: data
          })
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          setScriptId(saveData.id);
        } else {
          let errorMsg = isEnglish ? 'Failed to save script to history' : 'فشل حفظ الاسكربت في السجل';
          try {
            const contentType = saveRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await saveRes.json();
              errorMsg = errorData.error || errorMsg;
            }
          } catch (e) {}
          console.warn(errorMsg);
        }
      } catch (saveErr: any) {
        console.error('Failed to save script:', saveErr);
      }

      setResults(generatedScripts);
    } catch (err: any) {
      setError(err.message || (isEnglish ? 'An error occurred while generating scripts' : 'حدث خطأ أثناء توليد الاسكربتات'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]">
            <Wand2 className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-3">{t.freeCreation}</h2>
            <p className="text-dim text-xl max-w-2xl leading-relaxed font-medium">
              {isEnglish 
                ? 'Let the AI engine select the optimal blueprint for your niche and craft a masterpiece.' 
                : 'دع الذكاء الاصطناعي يختار الفورمات الأنسب لمجالك ويبدع في كتابة الاسكربت.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
          <Sparkles className="w-5 h-5 text-brand-secondary" />
          <span className="text-sm font-black uppercase tracking-widest text-dim">
            {isEnglish ? 'Creative Mode Active' : 'الوضع الإبداعي نشط'}
          </span>
        </div>
      </div>
      
      <ScriptForm isFormatMode={false} onSubmit={handleSubmit} isLoading={isLoading} isEnglish={isEnglish} />
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-rose-500/10 text-rose-400 rounded-[2rem] border border-rose-500/20 flex items-center gap-4 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold text-lg">{error}</p>
        </motion.div>
      )}

      <ScriptResults results={results} isEnglish={isEnglish} scriptId={scriptId || undefined} idea={idea} />
    </div>
  );
}
