import React, { useState } from 'react';
import ScriptForm from './ScriptForm';
import ScriptResults from './ScriptResults';
import { generateScripts } from '../services/gemini';
import { ScriptResult, User, SiteConfig } from '../types';
import { Wand2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { translations } from '../translations';
import { db, collection, addDoc, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

interface FreeCreationSectionProps {
  isEnglish: boolean;
  user: User;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function FreeCreationSection({ isEnglish, user, config, onSelectElement }: FreeCreationSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScriptResult[]>([]);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idea, setIdea] = useState<string>('');
  const t = isEnglish ? translations.en : translations.ar;

  const getEditableProps = (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => {
    if (!onSelectElement) return {};
    return {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectElement(path, type, label);
      },
      className: "cursor-pointer hover:outline hover:outline-2 hover:outline-brand-primary hover:outline-offset-4 transition-all"
    };
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setScriptId(null);
    setIdea(data.topic);
    try {
      // 1. Check limits first
      if (user.role !== 'admin' && user.role !== 'manager' && user.usage_limit < 10) {
        throw new Error(isEnglish ? 'Insufficient credits. You need at least 10 credits.' : 'رصيد غير كافٍ. تحتاج إلى 10 نقاط على الأقل.');
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
        const docRef = await addDoc(collection(db, 'scripts'), {
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          title: data.topic || (isEnglish ? 'New Script (Free Creation)' : 'اسكربت جديد (إنشاء حر)'),
          content: JSON.stringify(generatedScripts),
          inputs: JSON.stringify(data),
          type: 'free',
          is_saved: false,
          is_filmed: false,
          created_at: new Date().toISOString()
        });
        setScriptId(docRef.id);

        // Decrement user limit
        if (user.role !== 'admin' && user.role !== 'manager') {
          await updateDoc(doc(db, 'users', user.id), {
            usage_limit: user.usage_limit - 10
          });
        }
      } catch (saveErr: any) {
        console.error('Failed to save script:', saveErr);
        handleFirestoreError(saveErr, OperationType.CREATE, 'scripts');
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
            <h2 
              {...getEditableProps('pages.freeGeneration.title', 'text', 'Free Generation Page Title')}
              className="text-4xl font-black text-white tracking-tight mb-3"
            >
              {config?.pages?.freeGeneration?.title || t.freeCreation}
            </h2>
            <p 
              {...getEditableProps('pages.freeGeneration.subtitle', 'text', 'Free Generation Page Subtitle')}
              className="text-dim text-xl max-w-2xl leading-relaxed font-medium"
            >
              {config?.pages?.freeGeneration?.subtitle || (isEnglish 
                ? 'Let the AI engine select the optimal blueprint for your niche and craft a masterpiece.' 
                : 'دع الذكاء الاصطناعي يختار الفورمات الأنسب لمجالك ويبدع في كتابة الاسكربت.')}
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
