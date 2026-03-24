import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Sparkles, Brain, Heart, Lightbulb, CheckCircle, Languages, FileText, AlertCircle } from 'lucide-react';
import { evaluateScript } from '../services/gemini';
import { EvaluationResult, Dialect, User, SiteConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { db, collection, addDoc, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

const DIALECTS: Dialect[] = [
  'اللهجة المصرية',
  'اللهجة السعودية',
  'اللهجة الخليجية',
  'اللهجة الكويتية',
  'اللغة العربية الفصحى',
  'اللغة الإنجليزية',
  'اللهجة العامية الإنجليزية'
];

interface EvaluationSectionProps {
  isEnglish: boolean;
  user: User;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function EvaluationSection({ isEnglish, user, config, onSelectElement }: EvaluationSectionProps) {
  const [script, setScript] = useState('');
  const [dialect, setDialect] = useState<Dialect>(DIALECTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null);
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

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setSeconds(0);
      setLastGenerationTime(null);
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (seconds > 0) {
      setLastGenerationTime(seconds);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script.trim()) return;

    setIsLoading(true);
    setError(null);
    setScriptId(null);
    try {
      // Check limits
      if (user.role !== 'admin' && user.role !== 'manager' && user.usage_limit <= 0) {
        throw new Error(isEnglish ? 'Usage limit exceeded. Please upgrade your subscription.' : 'لقد استنفدت الحد المسموح لك. يرجى ترقية اشتراكك.');
      }

      const evaluation = await evaluateScript(script, dialect);
      setResult(evaluation);

      // Save to history and decrement limit
      try {
        const docRef = await addDoc(collection(db, 'scripts'), {
          user_id: user.id,
          title: isEnglish ? 'Script Evaluation' : 'تقييم اسكربت',
          content: JSON.stringify(evaluation),
          inputs: JSON.stringify({ script, dialect }),
          type: 'evaluation',
          is_saved: false,
          is_filmed: false,
          created_at: new Date().toISOString()
        });
        setScriptId(docRef.id);

        // Decrement user limit
        if (user.role !== 'admin' && user.role !== 'manager') {
          await updateDoc(doc(db, 'users', user.id), {
            usage_limit: user.usage_limit - 1
          });
        }
      } catch (saveErr) {
        console.error('Failed to save evaluation:', saveErr);
        handleFirestoreError(saveErr, OperationType.CREATE, 'scripts');
      }
    } catch (err: any) {
      setError(err.message || (isEnglish ? 'An error occurred during evaluation' : 'حدث خطأ أثناء التقييم'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scriptId) return;
    try {
      await updateDoc(doc(db, 'scripts', scriptId), {
        is_saved: true
      });
      alert(isEnglish ? 'Evaluation saved successfully' : 'تم حفظ التقييم بنجاح');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `scripts/${scriptId}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]">
            <CheckCircle className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 
              {...getEditableProps('pages.textLab.title', 'text', 'Text Lab Page Title')}
              className="text-4xl font-black text-white tracking-tight mb-3"
            >
              {config?.pages?.textLab?.title || t.evaluate}
            </h2>
            <p 
              {...getEditableProps('pages.textLab.subtitle', 'text', 'Text Lab Page Subtitle')}
              className="text-dim text-xl max-w-2xl leading-relaxed font-medium"
            >
              {config?.pages?.textLab?.subtitle || (isEnglish 
                ? 'Submit your script for a deep narrative audit based on viral retention psychology.' 
                : 'ضع الاسكربت الخاص بك هنا وسنقوم بتقييمه بناءً على عوامل نجاح الفيديوهات الفايرال.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
          <Brain className="w-5 h-5 text-brand-secondary" />
          <span className="text-sm font-black uppercase tracking-widest text-dim">
            {isEnglish ? 'AI Auditor Active' : 'مدقق الذكاء الاصطناعي نشط'}
          </span>
        </div>
      </div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="glass-card p-10 md:p-12 space-y-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
        
        <div className="space-y-4">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Your Script' : 'الاسكربت الخاص بك'}
          </label>
          <textarea
            value={script || ''}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            placeholder={isEnglish ? "Paste your script here for analysis..." : "اكتب الاسكربت هنا..."}
            className="input-field resize-y text-lg leading-relaxed min-h-[250px]"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-end">
          <div className="space-y-4">
            <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
              <Languages className="w-4 h-4 text-brand-primary" />
              {isEnglish ? 'Target Dialect / Language' : 'اللهجة / اللغة (لإعادة الكتابة)'}
            </label>
            <div className="relative">
              <select
                value={dialect || ''}
                onChange={(e) => setDialect(e.target.value as Dialect)}
                className="input-field appearance-none cursor-pointer pr-12"
              >
                {DIALECTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={isLoading || !script.trim()}
              className="btn-nover w-full py-5 text-xl group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {isEnglish ? `Auditing... (${seconds}s)` : `جاري التقييم... (${seconds} ثانية)`}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  {isEnglish ? 'Analyze Script' : 'تقييم الاسكربت'}
                </div>
              )}
            </button>
            
            {!isLoading && lastGenerationTime !== null && (
              <div className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 text-center">
                {isEnglish ? `Evaluation completed in ${lastGenerationTime} seconds` : `تم التقييم في ${lastGenerationTime} ثانية`}
              </div>
            )}
          </div>
        </div>
      </motion.form>

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

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hook Evaluation */}
              <div className="glass-card p-10 space-y-8 rounded-[3rem] border border-white/5 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] group-hover:bg-amber-500/10 transition-colors" />
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white flex items-center gap-4">
                    <Lightbulb className="w-7 h-7 text-amber-500" />
                    {isEnglish ? 'Hook Audit' : 'تقييم الهوك'}
                  </h3>
                  {result.hasHook ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <XCircle className="w-6 h-6 text-rose-500" />
                    </div>
                  )}
                </div>
                <p className="text-dim text-lg leading-relaxed font-medium">{result.hookAnalysis}</p>
                
                <div className="pt-8 border-t border-white/5">
                  <h4 className="text-xs font-black text-dim uppercase tracking-widest mb-6">{isEnglish ? 'Viral Hook Alternatives:' : 'هوكات مقترحة:'}</h4>
                  <ul className="space-y-4">
                    {result.suggestedHooks.map((hook, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-white bg-white/5 p-5 rounded-2xl border border-white/5 group/item hover:bg-white/10 transition-colors">
                        <span className="text-brand-primary font-black bg-brand-primary/10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm border border-brand-primary/20">{idx + 1}</span>
                        <span className="leading-relaxed font-bold">{hook}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payoff Evaluation */}
              <div className="glass-card p-10 space-y-8 rounded-[3rem] border border-white/5 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[50px] group-hover:bg-brand-primary/10 transition-colors" />
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white flex items-center gap-4">
                    <Sparkles className="w-7 h-7 text-brand-primary" />
                    {isEnglish ? 'The Payoff' : 'النتيجة النهائية (Payoff)'}
                  </h3>
                  {result.hasPayoff ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <XCircle className="w-6 h-6 text-rose-500" />
                    </div>
                  )}
                </div>
                <p className="text-dim text-lg leading-relaxed font-medium">{result.payoffAnalysis}</p>
              </div>

              {/* Open Loops & Emotions */}
              <div className="glass-card p-10 space-y-8 rounded-[3rem] border border-white/5 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-colors" />
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <Brain className="w-7 h-7 text-blue-500" />
                  {isEnglish ? 'Curiosity Loops' : 'حلقات الفضول (Open Loops)'}
                </h3>
                <p className="text-dim text-lg leading-relaxed font-medium">{result.openLoopsAnalysis}</p>
              </div>

              <div className="glass-card p-10 space-y-8 rounded-[3rem] border border-white/5 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] group-hover:bg-rose-500/10 transition-colors" />
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <Heart className="w-7 h-7 text-rose-500" />
                  {isEnglish ? 'Emotional Resonance' : 'تحليل المشاعر'}
                </h3>
                <p className="text-dim text-lg leading-relaxed font-medium">{result.emotionsAnalysis}</p>
              </div>
            </div>

            {/* Storytelling Rewrite */}
            <div className="glass-card p-12 rounded-[3.5rem] border border-brand-primary/20 space-y-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-brand-primary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div>
                    <h3 className="text-4xl font-black text-white flex items-center gap-4 mb-3">
                      <Sparkles className="w-10 h-10 text-brand-primary" />
                      {isEnglish ? 'Narrative Masterpiece' : 'إعادة الكتابة بأسلوب السرد القصصي'}
                    </h3>
                    <p className="text-dim text-lg font-bold">
                      {isEnglish 
                        ? 'We injected conflict, stakes, and high-retention transitions into your script.' 
                        : 'تمت إضافة صراع، مخاطرة، وكلمات انتقالية لزيادة التوتر والاحتفاظ بالمشاهد.'}
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-brand-primary/20 rounded-full border border-brand-primary/30 text-brand-primary text-xs font-black uppercase tracking-widest">
                    {isEnglish ? 'Optimized for Retention' : 'محسن للاحتفاظ بالمشاهد'}
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 whitespace-pre-wrap text-white leading-relaxed font-bold text-xl shadow-2xl">
                  {result.storytellingRewrite}
                </div>
                
                {scriptId && (
                  <div className="mt-10 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className="px-10 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      {isEnglish ? 'Save Evaluation' : 'حفظ التقييم'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
