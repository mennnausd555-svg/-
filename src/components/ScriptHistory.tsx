import React, { useState, useEffect } from 'react';
import { Search, Calendar, Copy, FileDown, Trash2, ExternalLink, CheckCircle2, Video, Brain, Heart } from 'lucide-react';
import { ScriptHistory, ScriptResult, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LoadingVideo from './LoadingVideo';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db, collection, query, where, getDocs, orderBy, handleFirestoreError, OperationType, auth } from '../firebase';

interface ScriptHistoryProps {
  isEnglish: boolean;
  user: User;
}

const INPUT_LABELS: Record<string, { en: string; ar: string }> = {
  topic: { en: 'Topic', ar: 'الموضوع' },
  length: { en: 'Length', ar: 'الطول' },
  minutes: { en: 'Duration (Min)', ar: 'المدة (دقائق)' },
  curiosityLevel: { en: 'Curiosity', ar: 'مستوى الفضول' },
  emotion: { en: 'Emotion', ar: 'العاطفة' },
  dialect: { en: 'Dialect', ar: 'اللهجة' },
  format: { en: 'Format', ar: 'الفورمات' },
  fileData: { en: 'Attached File', ar: 'ملف مرفق' }
};

export default function ScriptHistoryView({ isEnglish, user }: ScriptHistoryProps) {
 const [history, setHistory] = useState<ScriptHistory[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedScript, setSelectedScript] = useState<ScriptHistory | null>(null);

 useEffect(() => {
  if (user) {
    fetchHistory();
  } else {
    setLoading(false);
  }
 }, [user]);

 const fetchHistory = async () => {
  try {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'scripts'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const scriptsData = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
        inputs: typeof data.inputs === 'string' ? JSON.parse(data.inputs) : data.inputs,
      };
    }) as ScriptHistory[];

    setHistory(scriptsData);
  } catch (err) {
    console.error(err);
    handleFirestoreError(err, OperationType.LIST, 'scripts');
  } finally {
    setLoading(false);
  }
 };

 const filteredHistory = history.filter(h => {
    if (!h.title) return false;
    const titleMatch = h.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let contentMatch = false;
    if (Array.isArray(h.content)) {
      contentMatch = h.content.some(s => s.script && s.script.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (h.content && typeof h.content === 'object') {
       // Handle evaluation results
       const evalContent = h.content as any;
       contentMatch = (evalContent.storytellingRewrite && evalContent.storytellingRewrite.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (evalContent.hookAnalysis && evalContent.hookAnalysis.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return titleMatch || contentMatch;
 });

 const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert(isEnglish ? 'Copied to clipboard' : 'تم النسخ إلى الحافظة');
 };

 const exportToPDF = async (script: ScriptHistory, options: { includeScenes: boolean, includeAnalysis: boolean }) => {
   const container = document.createElement('div');
   container.style.padding = '40px';
   container.style.fontFamily = 'Arial, Tahoma, sans-serif';
   container.style.color = '#000';
   container.style.backgroundColor = '#fff';
   container.dir = isEnglish ? 'ltr' : 'rtl';
   
   const titleEl = document.createElement('h1');
   titleEl.textContent = script.title;
   titleEl.style.textAlign = 'center';
   titleEl.style.marginBottom = '30px';
   titleEl.style.fontSize = '24px';
   container.appendChild(titleEl);
   
   if (Array.isArray(script.content)) {
     script.content.forEach((item, index) => {
       const scriptContainer = document.createElement('div');
       scriptContainer.style.marginBottom = '40px';
       scriptContainer.style.pageBreakInside = 'avoid';
       
       const scriptTitle = document.createElement('h2');
       scriptTitle.textContent = isEnglish ? `Result ${index + 1}: ${item.title}` : `النتيجة ${index + 1}: ${item.title}`;
       scriptTitle.style.fontSize = '18px';
       scriptTitle.style.marginBottom = '15px';
       scriptTitle.style.color = '#0a0a0a';
       scriptContainer.appendChild(scriptTitle);
       
       const scriptContent = document.createElement('div');
       scriptContent.textContent = item.script;
       scriptContent.style.whiteSpace = 'pre-wrap';
       scriptContent.style.fontSize = '14px';
       scriptContent.style.lineHeight = '1.6';
       scriptContent.style.marginBottom = '20px';
       scriptContainer.appendChild(scriptContent);
       
       if (options.includeScenes && item.sceneAnalysis) {
         const sceneTitle = document.createElement('h3');
         sceneTitle.textContent = isEnglish ? 'Scene Analysis:' : 'تحليل المشاهد:';
         sceneTitle.style.fontSize = '14px';
         sceneTitle.style.marginTop = '15px';
         sceneTitle.style.color = '#4a4a4a';
         scriptContainer.appendChild(sceneTitle);
         
         const sceneContent = document.createElement('div');
         sceneContent.textContent = item.sceneAnalysis;
         sceneContent.style.whiteSpace = 'pre-wrap';
         sceneContent.style.fontSize = '12px';
         sceneContent.style.color = '#4a4a4a';
         scriptContainer.appendChild(sceneContent);
       }
       
       container.appendChild(scriptContainer);
     });
   } else {
     // Handle evaluation result
     const evalContent = script.content as any;
     const scriptContainer = document.createElement('div');
     scriptContainer.style.marginBottom = '40px';
     scriptContainer.style.pageBreakInside = 'avoid';
     
     const scriptTitle = document.createElement('h2');
     scriptTitle.textContent = isEnglish ? `Rewrite` : `إعادة الكتابة`;
     scriptTitle.style.fontSize = '18px';
     scriptTitle.style.marginBottom = '15px';
     scriptTitle.style.color = '#0a0a0a';
     scriptContainer.appendChild(scriptTitle);
     
     const scriptText = document.createElement('div');
     scriptText.textContent = evalContent.storytellingRewrite;
     scriptText.style.whiteSpace = 'pre-wrap';
     scriptText.style.fontSize = '14px';
     scriptText.style.lineHeight = '1.6';
     scriptText.style.marginBottom = '20px';
     scriptContainer.appendChild(scriptText);

     container.appendChild(scriptContainer);
   }
   
   document.body.appendChild(container);
   
   try {
     // @ts-ignore
     const html2pdf = (await import('html2pdf.js')).default;
     await html2pdf().from(container).set({
       margin: 10,
       filename: `${script.title}.pdf`,
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: { scale: 2, useCORS: true },
       jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
     }).save();
   } catch (error) {
     console.error('PDF generation failed:', error);
     alert(isEnglish ? 'Failed to generate PDF' : 'فشل في إنشاء ملف PDF');
   } finally {
     document.body.removeChild(container);
   }
 };

   if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <LoadingVideo size="xl" />
      </div>
    );
  }

 return (
 <div className="space-y-6 animate-fade-up">
 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
 <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{isEnglish ? 'Script History' : 'سجل الاسكربتات'}</h2>
 <div className="relative w-full md:w-96">
 <Search className={`absolute ${isEnglish ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]`} />
 <input
 type="text"
 placeholder={isEnglish ? 'Search history...' : 'بحث في السجل...'}
 className={`input-field ${isEnglish ? 'pl-10' : 'pr-10'}`}
 value={searchTerm || ''}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* History List */}
 <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
 {filteredHistory.map(item => (
 <button
 key={item.id}
 onClick={() => setSelectedScript(item)}
 className={`w-full ${isEnglish ? 'text-left' : 'text-right'} p-4 card-modern transition-all hover:shadow-md ${selectedScript?.id === item.id ? 'border-[#EFFF04] ring-2 ring-[#EFFF04]/10 ' : ''}`}
 >
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-bold text-[var(--text-primary)]">{item.title}</h3>
 <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-medium bg-[var(--bg-tertiary)] px-2 py-1 rounded-md">
 <Calendar className="w-3 h-3" />
 {new Date(item.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG')}
 </span>
 </div>
 <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
   {Array.isArray(item.content) ? item.content[0]?.script : (item.content as any)?.storytellingRewrite}
 </p>
 </button>
 ))}
 {filteredHistory.length === 0 && (
 <div className="text-center py-12 text-[var(--text-muted)] font-medium bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
 {isEnglish ? 'No matching results found' : 'لا توجد نتائج مطابقة للبحث'}
 </div>
 )}
 </div>

 {/* Script Details */}
 <div className="lg:col-span-2">
 <AnimatePresence mode="wait">
 {selectedScript ? (
 <motion.div
 key={selectedScript.id}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="card-modern overflow-hidden"
 >
 <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-tertiary)]">
 <div>
 <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedScript.title}</h3>
 <p className="text-sm text-[var(--text-secondary)] font-medium">{new Date(selectedScript.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => exportToPDF(selectedScript, { includeScenes: true, includeAnalysis: true })}
 className="p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors shadow-sm"
 title={isEnglish ? 'Download PDF' : 'تحميل PDF'}
 >
 <FileDown className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="p-6 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
 {/* Display Inputs */}
 {selectedScript.inputs && (
    <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-xl border border-[var(--border-color)] space-y-2">
      <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
        {isEnglish ? 'Generation Parameters' : 'معايير التوليد'}
      </h4>
      <div className="grid grid-cols-2 gap-4 text-xs">
        {Object.entries(selectedScript.inputs).map(([key, value]) => {
          if (!value || key === 'fileData') return null;
          const label = INPUT_LABELS[key]?.[isEnglish ? 'en' : 'ar'] || key;
          return (
            <div key={key} className="flex flex-col">
              <span className="text-[var(--text-muted)] font-bold">{label}:</span>
              <span className="text-[var(--text-primary)]">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  )}

 {Array.isArray(selectedScript.content) ? selectedScript.content.map((result, idx) => (
 <div key={idx} className="space-y-4 pb-8 border-b border-[var(--border-color)] last:border-0">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <h4 className="font-bold text-[#EFFF04] flex items-center gap-2">
 <CheckCircle2 className="w-5 h-5" />
 {result.title}
 </h4>
 <div className="flex gap-2 w-full sm:w-auto">
 <button
 onClick={() => copyToClipboard(result.script)}
 className="flex-1 sm:flex-none text-xs px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center gap-1 font-medium transition-colors border border-[var(--border-color)]"
 >
 <Copy className="w-3 h-3" /> {isEnglish ? 'Copy Script' : 'نسخة الاسكربت'}
 </button>
 <button
 onClick={() => copyToClipboard(`${result.script}\n\n${isEnglish ? 'Scene Analysis' : 'تحليل المشاهد'}:\n${result.sceneAnalysis}`)}
 className="flex-1 sm:flex-none text-xs px-3 py-2 bg-[#EFFF04]/10 text-[#EFFF04] rounded-lg hover:bg-[#EFFF04]/20 flex items-center justify-center gap-1 font-medium transition-colors border border-[#EFFF04]/20 "
 >
 <Copy className="w-3 h-3" /> {isEnglish ? 'Copy All' : 'نسخ الكل'}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4">
 <div className="space-y-4">
 <div className="bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-color)] text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">
 {result.script}
 </div>
 </div>
 {result.analysis ? (
    <div className="space-y-4">
      <div className="bg-[#EFFF04]/10/50 p-5 rounded-xl border border-[#EFFF04]/20 text-xs leading-relaxed text-[var(--text-secondary)]">
        <p className="font-bold text-[#EFFF04] mb-3 flex items-center gap-1.5 text-sm">
          <Video className="w-4 h-4" /> {isEnglish ? 'Comprehensive Analysis & Suggested Scenes' : 'التحليل الشامل والمشاهد المقترحة'}
        </p>
        <div className="space-y-3">
          {result.analysis.map((item, i) => (
            <div key={i} className="border-b border-[#EFFF04]/10 pb-2 last:border-0 last:pb-0">
              <span className="font-bold text-[#EFFF04] block mb-1">{item.stage}:</span>
              <span className="text-[var(--text-primary)]">{item.content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
 ) : result.sceneAnalysis ? (
    <div className="space-y-4">
      <div className="bg-[#EFFF04]/10/50 p-5 rounded-xl border border-[#EFFF04]/20 text-xs leading-relaxed text-[var(--text-secondary)]">
        <p className="font-bold text-[#EFFF04] mb-3 flex items-center gap-1.5 text-sm">
          <Video className="w-4 h-4" /> {isEnglish ? 'Scene Analysis' : 'تحليل المشاهد'}
        </p>
        {result.sceneAnalysis}
      </div>
    </div>
 ) : null}
 </div>
 </div>
 )) : (
    <div className="space-y-4 pb-8 border-b border-[var(--border-color)] last:border-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h4 className="font-bold text-[#EFFF04] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {isEnglish ? 'Rewrite' : 'إعادة الكتابة'}
        </h4>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => copyToClipboard((selectedScript.content as any).storytellingRewrite)}
            className="flex-1 sm:flex-none text-xs px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center gap-1 font-medium transition-colors border border-[var(--border-color)]"
          >
            <Copy className="w-3 h-3" /> {isEnglish ? 'Copy Script' : 'نسخة الاسكربت'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <div className="bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-color)] text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">
            {(selectedScript.content as any).storytellingRewrite}
          </div>
        </div>
      </div>
    </div>
 )}
 </div>
 </motion.div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-tertiary)]/50 rounded-2xl border-2 border-dashed border-[var(--border-color)] p-12 text-center">
 <Calendar className="w-16 h-16 mb-4 opacity-20" />
 <p className="font-medium">{isEnglish ? 'Select a script from the list to view details' : 'اختر اسكربت من القائمة لعرض تفاصيله'}</p>
 </div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}
