import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Link as LinkIcon, File as FileIcon, CheckCircle, XCircle, User as UserIcon, Phone, Mail, Search, Plus, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { User, Suggestion, SiteConfig } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, query, getDocs, orderBy, addDoc, handleFirestoreError, OperationType } from '../firebase';

interface SuggestionsProps {
  user: User;
  isEnglish: boolean;
  isAdmin?: boolean;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function Suggestions({ user, isEnglish, isAdmin = false, config, onSelectElement }: SuggestionsProps) {
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

  const [content, setContent] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [files, setFiles] = useState<{ name: string, data: string }[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchSuggestions();
    }
  }, [isAdmin]);

  const fetchSuggestions = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, 'suggestions'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Suggestion[];
      setSuggestions(data);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, 'suggestions');
    } finally {
      setFetching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => [...prev, { name: file.name, data: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.status === 'frozen') {
      setMessage({ type: 'error', text: t.accountFrozenMsg });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_phone: user.phone,
        content,
        links: links.filter(l => l.trim()),
        files,
        created_at: new Date().toISOString()
      });
      setMessage({ type: 'success', text: t.saveSuccess });
      setContent('');
      setLinks(['']);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t.error });
      handleFirestoreError(err, OperationType.CREATE, 'suggestions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdmin) {
    return (
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-[0_0_30px_rgba(0,102,255,0.1)]">
                <MessageSquare className="w-6 h-6 text-brand-primary" />
              </div>
              {t.userSuggestions}
            </h2>
            <p className="text-dim font-bold tracking-wide px-16">{suggestions.length} {t.suggestions}</p>
          </div>
          <div className="relative w-full md:w-96 group">
            <input
              type="text"
              placeholder={t.search}
              className={`input-field py-4 ${isEnglish ? 'pl-16' : 'pr-16'} text-lg`}
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors`}>
              <Search className="w-5 h-5" />
            </div>
          </div>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-8">
            <video 
              src="/logo-video.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-32 h-32 object-contain"
            />
            <p className="text-dim font-black uppercase tracking-[0.3em] text-xs animate-pulse">{t.loading}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSuggestions.map((s, index) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-10 space-y-8 rounded-[3rem] border border-white/5 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <UserIcon className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-white uppercase tracking-tight">{s.user_name}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-dim">
                          <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5"><Mail className="w-3 h-3 text-brand-primary" /> {s.user_email}</span>
                          <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5"><Phone className="w-3 h-3 text-brand-primary" /> {s.user_phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">{new Date(s.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG')}</span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.created_at).toLocaleTimeString(isEnglish ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-dim leading-relaxed text-lg italic relative z-10 bg-white/5 p-8 rounded-[2rem] border border-white/5">
                    "{s.content}"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {s.links.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-3">
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                          {t.links}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {s.links.map((link: string, idx: number) => (
                            <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="px-5 py-3 bg-sky-500/10 text-sky-400 rounded-xl text-xs font-black flex items-center gap-3 border border-sky-500/20 hover:bg-sky-500/20 transition-all">
                              <LinkIcon className="w-4 h-4" />
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.files.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          {t.files}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {s.files.map((file: any, idx: number) => (
                            <div key={idx} className="px-5 py-3 bg-amber-500/10 text-amber-400 rounded-xl text-xs font-black flex items-center gap-3 border border-amber-500/20">
                              <FileIcon className="w-4 h-4" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredSuggestions.length === 0 && (
              <div className="text-center py-32 glass-card rounded-[3rem] border border-white/5">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <MessageSquare className="w-12 h-12 text-dim/20" />
                </div>
                <p className="text-dim font-black uppercase tracking-[0.3em] text-sm">{t.noScripts}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h2 
          {...getEditableProps('pages.suggestions.title', 'text', 'Suggestions Page Title')}
          className="text-5xl font-black text-white uppercase tracking-tight"
        >
          {config?.pages?.suggestions?.title || t.suggestions}
        </h2>
        <p 
          {...getEditableProps('pages.suggestions.subtitle', 'text', 'Suggestions Page Subtitle')}
          className="text-xl text-dim font-bold tracking-wide"
        >
          {config?.pages?.suggestions?.subtitle || (isEnglish ? 'Help us improve by sharing your thoughts and ideas.' : 'شاركنا أفكارك لتحسين المنصة')}
        </p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-6 rounded-[2rem] flex items-center gap-4 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]'}`}
          >
            {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <p className="font-black uppercase tracking-widest text-sm">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit} 
        className="glass-card p-12 space-y-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
        
        <div className="space-y-4 relative z-10">
          <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.suggestionContent}</label>
          <textarea
            className="input-field min-h-[200px] resize-none text-lg py-6"
            value={content || ''}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="..."
            disabled={user.status === 'frozen'}
          />
        </div>

        <div className="space-y-6 relative z-10">
          <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.links}</label>
          <div className="space-y-4">
            {links.map((link, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="relative flex-1 group">
                  <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    className={`input-field py-4 ${isEnglish ? 'pl-16' : 'pr-16'}`}
                    value={link || ''}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[idx] = e.target.value;
                      setLinks(newLinks);
                    }}
                    placeholder="https://..."
                    disabled={user.status === 'frozen'}
                  />
                </div>
                {idx === links.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setLinks([...links, ''])}
                    className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 hover:bg-brand-primary/20 transition-all flex items-center justify-center group"
                    disabled={user.status === 'frozen'}
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                    className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center group"
                  >
                    <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.files}</label>
          <div className="space-y-6">
            <label className={`group flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[2.5rem] hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all cursor-pointer ${user.status === 'frozen' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <Plus className="w-10 h-10 text-dim group-hover:text-brand-primary transition-colors" />
              </div>
              <span className="text-lg font-black text-dim group-hover:text-white transition-colors uppercase tracking-widest">{isEnglish ? 'UPLOAD FILES' : 'اضغط لرفع ملفات'}</span>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={user.status === 'frozen'} />
            </label>
            
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-wrap gap-3"
                >
                  {files.map((f, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-5 py-3 bg-brand-primary/10 rounded-xl text-xs font-black text-brand-primary border border-brand-primary/20 flex items-center gap-3 group"
                    >
                      <FileIcon className="w-4 h-4" />
                      {f.name}
                      <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-dim hover:text-rose-500 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !content || user.status === 'frozen'}
          className="btn-nover w-full py-6 text-xl flex items-center justify-center gap-4 relative z-10"
        >
          <Send className="w-6 h-6" />
          {t.sendSuggestion}
        </button>
      </motion.form>
    </div>
  );
}
