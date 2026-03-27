import React, { useState, useEffect } from 'react';
import { User, ScriptHistory, SiteConfig } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Link as LinkIcon, Plus, CheckCircle2, MessageCircle, ExternalLink, Trash2, Search, X, Wand2 } from 'lucide-react';
import { db, collection, query, where, getDocs, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

interface FilmedScriptsProps {
  user: User;
  isEnglish: boolean;
  isAdmin?: boolean;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function FilmedScripts({ user, isEnglish, isAdmin, config, onSelectElement }: FilmedScriptsProps) {
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

  const [scripts, setScripts] = useState<any[]>([]);
  const [availableScripts, setAvailableScripts] = useState<ScriptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFilmedScripts();
    if (!isAdmin) {
      fetchAvailableScripts();
    }
  }, [isAdmin]);

  const fetchFilmedScripts = async () => {
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'scripts'), where('video_link', '!=', null));
      } else {
        q = query(collection(db, 'scripts'), where('user_id', '==', user.id), where('video_link', '!=', null));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setScripts(data);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, 'scripts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableScripts = async () => {
    try {
      const q = query(collection(db, 'scripts'), where('user_id', '==', user.id));
      const querySnapshot = await getDocs(q);
      const allScripts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as ScriptHistory[];
      
      // Filter out scripts that already have a video_link
      const available = allScripts.filter(s => !s.video_link);
      setAvailableScripts(available);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, 'scripts');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScriptId || !videoLink) return;

    try {
      await updateDoc(doc(db, 'scripts', selectedScriptId), {
        video_link: videoLink
      });

      setIsAdding(false);
      setVideoLink('');
      setSelectedScriptId(null);
      fetchFilmedScripts();
      alert(isEnglish ? 'Video link added successfully! Contact support for bonus credits.' : 'تم إضافة رابط الفيديو بنجاح! تواصل مع الدعم للحصول على رصيد إضافي.');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `scripts/${selectedScriptId}`);
    }
  };

  const filteredScripts = scripts.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title?.toLowerCase().includes(q) || 
           s.user_name?.toLowerCase().includes(q) || 
           s.user_phone?.includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <video 
          src="/logo-video.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-32 h-32 object-contain"
        />
        <p className="text-dim font-black uppercase tracking-[0.3em] text-xs animate-pulse">{isEnglish ? 'Loading...' : 'جاري التحميل...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20" dir={isEnglish ? 'ltr' : 'rtl'}>
      {!isAdmin && (
        <div className="relative rounded-[2rem] overflow-hidden border border-brand-primary/30 shadow-[0_0_40px_rgba(0,102,255,0.15)] group">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop" 
              alt="Filming" 
              className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"></div>
          </div>
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 text-brand-primary font-bold text-sm mb-6 border border-brand-primary/30">
                <Wand2 className="w-4 h-4" />
                {isEnglish ? 'Special Offer' : 'عرض خاص'}
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                {isEnglish ? 'Turn your videos into' : 'حول فيديوهاتك إلى'} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                  {isEnglish ? 'Free Balance!' : 'رصيد مجاني!'}
                </span>
              </h3>
              <ul className="space-y-4 text-dim font-medium text-lg">
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold shadow-lg">1</div>
                  {isEnglish ? 'Create a script using our AI' : 'أنشئ اسكربت باستخدام الذكاء الاصطناعي'}
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold shadow-lg">2</div>
                  {isEnglish ? 'Shoot a video based on it' : 'قم بتصوير فيديو بناءً على الاسكربت'}
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/30 text-brand-primary flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,102,255,0.3)]">3</div>
                  <span className="text-white">{isEnglish ? 'Upload the link here & get points!' : 'ارفع الرابط هنا واحصل على نقاط!'}</span>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative w-48 h-48 md:w-64 md:h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full blur-[60px] opacity-30 animate-pulse"></div>
                <div className="relative w-full h-full bg-[#0a0a0a] rounded-full border-2 border-brand-primary/30 flex items-center justify-center shadow-2xl">
                  <Video className="w-20 h-20 md:w-28 md:h-28 text-brand-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]">
            <Video className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 
              {...getEditableProps('pages.filmedScripts.title', 'text', 'Filmed Scripts Page Title')}
              className="text-4xl font-black text-white tracking-tight mb-2"
            >
              {config?.pages?.filmedScripts?.title || (isAdmin ? (isEnglish ? 'Scripts Filmed' : 'اسكربتات تم تصويرها') : (isEnglish ? 'Free Balance' : 'رصيد مجاني'))}
            </h2>
            <p 
              {...getEditableProps('pages.filmedScripts.subtitle', 'text', 'Filmed Scripts Page Subtitle')}
              className="text-dim text-lg font-medium"
            >
              {config?.pages?.filmedScripts?.subtitle || (isAdmin 
                ? (isEnglish ? 'View all filmed scripts from users' : 'عرض جميع الاسكربتات التي تم تصويرها من قبل المستخدمين')
                : (isEnglish ? 'Log your filmed scripts to earn bonus credits' : 'سجل الاسكربتات التي قمت بتصويرها للحصول على رصيد إضافي'))}
            </p>
          </div>
        </div>
        
        {!isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn-nover px-8 py-4 flex items-center gap-3 text-lg"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEnglish ? (isAdding ? 'Cancel' : 'Add Video Link') : (isAdding ? 'إلغاء' : 'إضافة رابط فيديو')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && !isAdmin && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="glass-card p-8 rounded-[2rem] border border-brand-primary/30 space-y-6 overflow-hidden"
          >
            <div className="space-y-4">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1">
                {isEnglish ? 'Select Script (Saved or Archive)' : 'اختر الاسكربت (من المحفوظات أو الأرشيف)'}
              </label>
              <select
                value={selectedScriptId || ''}
                onChange={(e) => setSelectedScriptId(e.target.value)}
                className="input-field appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>{isEnglish ? 'Select a script...' : 'اختر اسكربت...'}</option>
                {availableScripts.map(s => {
                  const generatedTitle = s.content?.[0]?.title;
                  const displayTitle = generatedTitle ? generatedTitle : (s.title || (isEnglish ? 'Untitled Script' : 'اسكربت بدون عنوان'));
                  return (
                    <option key={s.id} value={s.id}>{displayTitle}</option>
                  );
                })}
              </select>
            </div>

            {selectedScriptId && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                <h4 className="font-bold text-brand-primary text-sm">
                  {isEnglish ? 'Script Content:' : 'محتوى الاسكربت:'}
                </h4>
                <p className="text-sm text-dim whitespace-pre-wrap leading-relaxed">
                  {availableScripts.find(s => s.id === selectedScriptId)?.content?.[0]?.script || ''}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1">
                {isEnglish ? 'Video Link' : 'رابط الفيديو'}
              </label>
              <div className="relative group">
                <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="url"
                  value={videoLink || ''}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://tiktok.com/@user/video/..."
                  className={`input-field ${isEnglish ? '!pl-16' : '!pr-16'}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-nover px-8 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                {isEnglish ? 'Save & Submit' : 'حفظ وإرسال'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isAdmin && (
        <div className="relative group">
          <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder={isEnglish ? "Search by user name, phone, or title..." : "ابحث باسم المستخدم، رقم الهاتف، أو العنوان..."}
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`input-field ${isEnglish ? '!pl-16' : '!pr-16'}`}
          />
        </div>
      )}

      {filteredScripts.length === 0 ? (
        <div className="glass-card p-16 rounded-[3rem] border border-white/5 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Video className="w-10 h-10 text-dim" />
          </div>
          <p className="text-xl font-bold text-dim">
            {isEnglish ? 'No filmed scripts found.' : 'لم يتم العثور على اسكربتات مصورة.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script) => (
            <motion.div 
              key={script.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col h-full group hover:border-brand-primary/30 transition-colors"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-black text-lg text-white line-clamp-2">
                    {script.content?.[0]?.title || script.title || (isEnglish ? 'Untitled Script' : 'اسكربت بدون عنوان')}
                  </h3>
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-brand-primary" />
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="bg-white/5 p-4 rounded-xl space-y-2">
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-dim">{isEnglish ? 'User:' : 'المستخدم:'}</span> {script.user_name}
                    </p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-dim">{isEnglish ? 'Phone:' : 'الهاتف:'}</span> <span dir="ltr">{script.user_phone}</span>
                    </p>
                  </div>
                )}

                <a 
                  href={script.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-secondary hover:text-brand-primary transition-colors font-bold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate">{script.video_link}</span>
                </a>
              </div>

              {!isAdmin && (
                <div className="pt-6 mt-6 border-t border-white/5">
                  <a 
                    href={`https://wa.me/201022049346?text=${encodeURIComponent(`مرحباً، لقد قمت بتصوير هذا الاسكربت وأرغب في الحصول على رصيد إضافي:\n\nالعنوان: ${script.title}\nالرابط: ${script.video_link}`)}`}
                    target="_blank"
                    className="w-full py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {isEnglish ? 'Claim Bonus via WhatsApp' : 'احصل على المكافأة عبر واتساب'}
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
