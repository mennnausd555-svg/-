import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, FileText, Settings, Clock, Languages, Brain, Sparkles, Wand2 } from 'lucide-react';
import { FORMATS, Dialect, VideoLength, FileData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ScriptFormProps {
  isFormatMode: boolean;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEnglish: boolean;
}

const DIALECTS_AR: Dialect[] = [
  'اللهجة المصرية',
  'اللهجة السعودية',
  'اللهجة الخليجية',
  'اللهجة الكويتية',
  'اللغة العربية الفصحى',
  'اللغة الإنجليزية',
  'اللهجة العامية الإنجليزية'
];

const DIALECTS_EN: string[] = [
  'Egyptian Dialect',
  'Saudi Dialect',
  'Gulf Dialect',
  'Kuwaiti Dialect',
  'Modern Standard Arabic',
  'English Language',
  'English Slang'
];

const CURIOSITY_LEVELS_AR = [
  'تلقائي (يحدده الذكاء الاصطناعي)',
  'مبتدئ (تفتح وتقفل فوراً)',
  'متوسط (تفتح، تقفل، تفتح غيرها)',
  'متقدم / فايرال (تفتح حلقة وتأجل إجابتها للآخر)'
];

const CURIOSITY_LEVELS_EN = [
  'Auto (AI Determined)',
  'Beginner (Open & Close Instantly)',
  'Intermediate (Open, Close, Open Another)',
  'Advanced / Viral (Open Loop & Delay Answer)'
];

const EMOTIONS_AR = [
  'تلقائي (يحدده الذكاء الاصطناعي)',
  'الحماس',
  'التوتر',
  'الإلهام',
  'الاستفزاز',
  'الصدمة',
  'الرضا',
  'الفضول الشديد',
  'الضحك',
  'الألم',
  'الأمل'
];

const EMOTIONS_EN = [
  'Auto (AI Determined)',
  'Excitement',
  'Tension',
  'Inspiration',
  'Provocation',
  'Shock',
  'Satisfaction',
  'Intense Curiosity',
  'Laughter',
  'Pain',
  'Hope'
];

export default function ScriptForm({ isFormatMode, onSubmit, isLoading, isEnglish }: ScriptFormProps) {
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState(FORMATS[0]);
  const [length, setLength] = useState<VideoLength>('قصير');
  const [minutes, setMinutes] = useState('1');
  const [curiosityLevel, setCuriosityLevel] = useState(isEnglish ? CURIOSITY_LEVELS_EN[0] : CURIOSITY_LEVELS_AR[0]);
  const [emotion, setEmotion] = useState(isEnglish ? EMOTIONS_EN[0] : EMOTIONS_AR[0]);
  const [dialect, setDialect] = useState<Dialect>(DIALECTS_AR[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [seconds, setSeconds] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileData({
          mimeType: selectedFile.type,
          data: base64String
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      topic,
      format: isFormatMode ? format : null,
      length,
      minutes: length === 'طويل' ? parseInt(minutes) : null,
      curiosityLevel,
      emotion,
      dialect,
      fileData
    });
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="glass-card p-10 md:p-12 space-y-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          {isFormatMode && (
            <div className="space-y-4">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-primary" />
                {isEnglish ? 'Select Blueprint' : 'اختر الفورمات'}
              </label>
              <div className="relative">
                <select
                  value={format || ''}
                  onChange={(e) => setFormat(e.target.value)}
                  className="input-field appearance-none cursor-pointer !pr-12"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              {isEnglish ? 'Topic / Niche' : 'مجالك أو الموضوع'} 
              <span className="text-dim/50 font-medium lowercase tracking-normal">
                ({isEnglish ? 'Optional if file uploaded' : 'اختياري إذا رفعت ملفاً'})
              </span>
            </label>
            <textarea
              value={topic || ''}
              onChange={(e) => setTopic(e.target.value)}
              rows={6}
              placeholder={isEnglish ? "Describe your topic or the core idea..." : "اكتب هنا عن مجالك أو الفكرة التي تريد التحدث عنها..."}
              className="input-field resize-none leading-relaxed min-h-[180px]"
              required={!file}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Knowledge Base' : 'ارفع ملفاً عن مجالك'}
            <span className="text-dim/50 font-medium lowercase tracking-normal">
              ({isEnglish ? 'Optional if topic written' : 'اختياري إذا كتبت الموضوع'})
            </span>
          </label>
          <div className="h-[calc(100%-2rem)] min-h-[250px] flex flex-col justify-center px-8 py-10 border-2 border-white/5 border-dashed rounded-[2.5rem] hover:bg-white/5 hover:border-brand-primary/30 transition-all duration-500 group relative overflow-hidden">
            <div className="space-y-6 text-center relative z-10">
              {file ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-[0_0_30px_rgba(0,102,255,0.1)]">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="flex items-center gap-4 text-white font-bold bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button type="button" onClick={removeFile} className="p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-full transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-dim font-black uppercase tracking-widest">{isEnglish ? 'File Ready for Processing' : 'تم رفع الملف بنجاح'}</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-brand-primary/10 transition-all duration-500 border border-white/5 group-hover:border-brand-primary/20">
                    <Upload className="h-10 w-10 text-dim group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-black text-white hover:text-brand-primary transition-colors text-xl">
                      <span>{isEnglish ? 'Upload Intelligence' : 'اختر ملفاً'}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                    </label>
                    <p className="text-dim font-medium">{isEnglish ? 'or drag and drop here' : 'أو اسحب وأفلت هنا'}</p>
                  </div>
                  <p className="text-[10px] text-dim/40 font-black uppercase tracking-[0.2em] mt-6">PDF, Image, Audio, or Video</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
        <div className="space-y-6">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Content Format' : 'مدة الفيديو'}
          </label>
          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${length === 'قصير' ? 'border-brand-primary bg-brand-primary/10 text-white shadow-[0_0_30px_rgba(0,102,255,0.1)]' : 'border-white/5 hover:border-white/20 text-dim bg-white/5'}`}>
              <input type="radio" name="length" value="قصير" checked={length === 'قصير'} onChange={() => setLength('قصير')} className="sr-only" />
              <span className="font-black text-lg">{isEnglish ? 'Shorts / Reels' : 'قصير (Short/Reel)'}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">9:16 Vertical</span>
            </label>
            <label className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${length === 'طويل' ? 'border-brand-primary bg-brand-primary/10 text-white shadow-[0_0_30px_rgba(0,102,255,0.1)]' : 'border-white/5 hover:border-white/20 text-dim bg-white/5'}`}>
              <input type="radio" name="length" value="طويل" checked={length === 'طويل'} onChange={() => setLength('طويل')} className="sr-only" />
              <span className="font-black text-lg">{isEnglish ? 'YouTube Long' : 'طويل (YouTube)'}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">16:9 Horizontal</span>
            </label>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {length === 'طويل' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                {isEnglish ? 'Duration (Minutes)' : 'عدد الدقائق (حتى 50)'}
              </label>
              <div className="relative">
                <select
                  value={minutes || ''}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="input-field appearance-none cursor-pointer !pr-12"
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {isEnglish ? 'Minutes' : 'دقائق'}</option>
                  ))}
                </select>
                <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
        <div className="space-y-4">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Curiosity Engine' : 'مستوى الفضول'}
          </label>
          <div className="relative">
            <select
              value={curiosityLevel || ''}
              onChange={(e) => setCuriosityLevel(e.target.value)}
              className="input-field appearance-none cursor-pointer !pr-12"
            >
              {(isEnglish ? CURIOSITY_LEVELS_EN : CURIOSITY_LEVELS_AR).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Emotional Tone' : 'نوع المشاعر'}
          </label>
          <div className="relative">
            <select
              value={emotion || ''}
              onChange={(e) => setEmotion(e.target.value)}
              className="input-field appearance-none cursor-pointer !pr-12"
            >
              {(isEnglish ? EMOTIONS_EN : EMOTIONS_AR).map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-dim uppercase tracking-widest px-1 flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand-primary" />
            {isEnglish ? 'Output Dialect' : 'اللهجة / اللغة'}
          </label>
          <div className="relative">
            <select
              value={dialect || ''}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="input-field appearance-none cursor-pointer !pr-12"
            >
              {(isEnglish ? DIALECTS_EN : DIALECTS_AR).map((d, idx) => (
                <option key={idx} value={DIALECTS_AR[idx]}>{d}</option>
              ))}
            </select>
            <div className={`absolute inset-y-0 ${isEnglish ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-dim`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-10 flex flex-col items-center gap-4">
        <button
          type="submit"
          disabled={isLoading || (!topic && !file)}
          className="btn-nover w-full py-6 text-2xl group"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              {isEnglish ? `Synthesizing Narrative... (${seconds}s)` : `جاري توليد الاسكربتات... (${seconds} ثانية)`}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Wand2 className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              {isEnglish ? 'Generate Masterpiece' : 'توليد النتائج'}
            </div>
          )}
        </button>
        
        {!isLoading && lastGenerationTime !== null && (
          <div className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
            {isEnglish ? `Generation completed in ${lastGenerationTime} seconds` : `تم التوليد في ${lastGenerationTime} ثانية`}
          </div>
        )}
      </div>
    </motion.form>
  );
}
