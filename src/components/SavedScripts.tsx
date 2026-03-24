import React, { useState, useEffect } from 'react';
import { Star, Search, FileText, User as UserIcon, Mail, Phone, ExternalLink, X, Calendar, ArrowRight, CheckSquare, FileDown } from 'lucide-react';
import { ScriptHistory, User } from '../types';
import { translations } from '../translations';
import ScriptResults from './ScriptResults';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, query, where, getDocs, handleFirestoreError, OperationType } from '../firebase';

interface SavedScriptsProps {
  user: User;
  isEnglish: boolean;
  isAdmin?: boolean;
}

export default function SavedScripts({ user, isEnglish, isAdmin = false }: SavedScriptsProps) {
  const t = isEnglish ? translations.en : translations.ar;
  const [scripts, setScripts] = useState<ScriptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScript, setSelectedScript] = useState<ScriptHistory | null>(null);
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchScripts();
  }, [isAdmin]);

  const toggleSelectScript = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedScripts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedScripts(newSelected);
  };

  const exportToPDF = async () => {
    if (selectedScripts.size === 0) {
      alert(isEnglish ? 'Please select at least one script to download' : 'يجب عليك أن تختار اسكربتات أولاً لتتمكن من تحميلها');
      return;
    }

    const scriptsToExport = scripts.filter(s => selectedScripts.has(s.id));
    const pdfTitle = isEnglish ? 'Starred Scripts' : 'الاسكربتات المميزة بنجمة';
    
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, Tahoma, sans-serif';
    container.style.color = '#000';
    container.style.backgroundColor = '#fff';
    container.dir = isEnglish ? 'ltr' : 'rtl';
    
    const titleEl = document.createElement('h1');
    titleEl.textContent = pdfTitle;
    titleEl.style.textAlign = 'center';
    titleEl.style.marginBottom = '30px';
    titleEl.style.fontSize = '24px';
    container.appendChild(titleEl);
    
    scriptsToExport.forEach((script, i) => {
      const scriptContainer = document.createElement('div');
      scriptContainer.style.marginBottom = '40px';
      scriptContainer.style.pageBreakInside = 'avoid';
      
      const scriptTitle = document.createElement('h2');
      scriptTitle.textContent = `${i + 1}. ${script.title}`;
      scriptTitle.style.fontSize = '18px';
      scriptTitle.style.marginBottom = '15px';
      scriptTitle.style.color = '#0a0a0a';
      scriptContainer.appendChild(scriptTitle);
      
      const scriptContent = document.createElement('div');
      
      if (Array.isArray(script.content)) {
        script.content.forEach((c, idx) => {
          const resultContainer = document.createElement('div');
          resultContainer.style.marginBottom = '20px';
          
          const resultTitle = document.createElement('h3');
          resultTitle.textContent = c.title || `Result ${idx + 1}`;
          resultTitle.style.fontSize = '16px';
          resultTitle.style.marginBottom = '10px';
          resultTitle.style.color = '#333';
          resultContainer.appendChild(resultTitle);
          
          const textContent = document.createElement('div');
          textContent.textContent = c.script;
          textContent.style.whiteSpace = 'pre-wrap';
          textContent.style.fontSize = '14px';
          textContent.style.lineHeight = '1.6';
          textContent.style.marginBottom = '15px';
          resultContainer.appendChild(textContent);
          
          if (c.sceneAnalysis) {
            const sceneTitle = document.createElement('h4');
            sceneTitle.textContent = isEnglish ? 'Visual Direction:' : 'تحليل المشاهد:';
            sceneTitle.style.fontSize = '14px';
            sceneTitle.style.marginTop = '10px';
            sceneTitle.style.color = '#555';
            resultContainer.appendChild(sceneTitle);
            
            const sceneContent = document.createElement('div');
            sceneContent.textContent = c.sceneAnalysis;
            sceneContent.style.whiteSpace = 'pre-wrap';
            sceneContent.style.fontSize = '12px';
            sceneContent.style.color = '#555';
            resultContainer.appendChild(sceneContent);
          }
          
          scriptContent.appendChild(resultContainer);
        });
      } else {
        scriptContent.textContent = typeof script.content === 'string' ? script.content : JSON.stringify(script.content);
        scriptContent.style.whiteSpace = 'pre-wrap';
        scriptContent.style.fontSize = '14px';
        scriptContent.style.lineHeight = '1.6';
      }
      
      scriptContainer.appendChild(scriptContent);
      
      container.appendChild(scriptContainer);
    });
    
    document.body.appendChild(container);
    
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().from(container).set({
        margin: 10,
        filename: `${pdfTitle}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(isEnglish ? 'Failed to generate PDF. Please try again.' : 'فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      document.body.removeChild(container);
    }
  };

  const fetchScripts = async () => {
    setLoading(true);
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'scripts'), where('is_saved', '==', true));
      } else {
        q = query(collection(db, 'scripts'), where('user_id', '==', user.id), where('is_saved', '==', true));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as ScriptHistory[];
      setScripts(data);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, 'scripts');
    } finally {
      setLoading(false);
    }
  };

  const filteredScripts = scripts.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-dim font-black uppercase tracking-widest text-xs">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-[0_0_30px_rgba(0,102,255,0.1)]">
              <Star className="w-6 h-6 text-brand-primary" />
            </div>
            {t.savedScripts}
          </h2>
          <p className="text-dim font-bold tracking-wide px-16">{scripts.length} {t.scripts}</p>
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

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (selectedScripts.size === filteredScripts.length) {
                setSelectedScripts(new Set());
              } else {
                setSelectedScripts(new Set(filteredScripts.map(s => s.id)));
              }
            }}
            className="flex items-center gap-2 text-sm font-bold text-dim hover:text-white transition-colors"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedScripts.size === filteredScripts.length && filteredScripts.length > 0 ? 'bg-brand-primary border-brand-primary text-white' : 'border-white/20'}`}>
              {selectedScripts.size === filteredScripts.length && filteredScripts.length > 0 && <CheckSquare className="w-3 h-3" />}
            </div>
            {isEnglish ? 'Select All' : 'تحديد الكل'}
          </button>
          <span className="text-xs font-bold text-dim bg-white/5 px-3 py-1 rounded-full">
            {selectedScripts.size} {isEnglish ? 'Selected' : 'محدد'}
          </span>
        </div>
        <button
          onClick={exportToPDF}
          disabled={selectedScripts.size === 0}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedScripts.size > 0 ? 'bg-brand-primary text-white hover:shadow-[0_0_20px_rgba(0,102,255,0.3)]' : 'bg-white/5 text-dim cursor-not-allowed'}`}
        >
          <FileDown className="w-4 h-4" />
          {isEnglish ? 'Download PDF' : 'تحميل PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredScripts.map((script, index) => (
            <motion.div 
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card group cursor-pointer relative overflow-hidden rounded-[2.5rem] border border-white/5 hover:border-brand-primary/30 transition-all duration-500"
              onClick={() => setSelectedScript(script)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[40px] group-hover:bg-brand-primary/10 transition-colors" />
              <div className="p-8 space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => toggleSelectScript(script.id, e)}
                      className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${selectedScripts.has(script.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-white/20 hover:border-brand-primary/50 bg-deep/50'}`}
                    >
                      {selectedScripts.has(script.id) && <CheckSquare className="w-4 h-4" />}
                    </button>
                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
                      <FileText className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">
                      {new Date(script.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG')}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {new Date(script.created_at).toLocaleTimeString(isEnglish ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white line-clamp-2 leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    {script.title}
                  </h3>
                  {isAdmin && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-1">{script.user_name}</span>
                        <span className="text-[9px] font-bold text-dim line-clamp-1">{script.user_email}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
                    {isEnglish ? 'VIEW DETAILS' : 'عرض التفاصيل'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredScripts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 glass-card rounded-[3rem] border border-white/5"
        >
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Star className="w-12 h-12 text-dim/20" />
          </div>
          <p className="text-dim font-black uppercase tracking-[0.3em] text-sm">{t.noScripts}</p>
        </motion.div>
      )}

      {/* Modal for Script Details */}
      <AnimatePresence>
        {selectedScript && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScript(null)}
              className="absolute inset-0 bg-deep/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10"
            >
              <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                      <FileText className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">{selectedScript.title}</h3>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-4 px-16">
                      <div className="flex items-center gap-2 text-dim">
                        <UserIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{selectedScript.user_name}</span>
                      </div>
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      <div className="flex items-center gap-2 text-dim">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-bold">{selectedScript.user_email}</span>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedScript(null)} 
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-colors border border-white/10 group"
                >
                  <X className="w-6 h-6 text-dim group-hover:text-white transition-colors" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                {selectedScript.inputs && (
                  <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 blur-[60px] pointer-events-none" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-8 flex items-center gap-3">
                      <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                      {isEnglish ? 'INPUT PARAMETERS' : 'المدخلات'}
                    </h4>
                    <div className="space-y-8 relative z-10">
                      {(selectedScript.inputs as any).text && (
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-dim leading-relaxed text-lg italic">"{(selectedScript.inputs as any).text}"</p>
                        </div>
                      )}
                      {(selectedScript.inputs as any).files?.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{isEnglish ? 'ATTACHED FILES' : 'الملفات المرفقة'}</p>
                          <div className="flex flex-wrap gap-3">
                            {(selectedScript.inputs as any).files.map((f: any, i: number) => (
                              <div key={i} className="px-5 py-3 bg-brand-primary/10 rounded-xl text-xs font-black text-brand-primary border border-brand-primary/20 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {f.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    {isEnglish ? 'GENERATED CONTENT' : 'المحتوى المولد'}
                  </h4>
                  <ScriptResults results={selectedScript.content as any} isEnglish={isEnglish} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
