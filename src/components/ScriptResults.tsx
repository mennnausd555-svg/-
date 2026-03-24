import React, { useState } from 'react';
import { ScriptResult } from '../types';
import { Sparkles, Video, Brain, Heart, CheckCircle2, Copy, FileDown, CheckSquare, Square, FileText, Share2, Star } from 'lucide-react';
import jsPDF from 'jspdf';
import InteractiveCat from './InteractiveCat';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

interface ScriptResultsProps {
  results: ScriptResult[];
  isEnglish: boolean;
  scriptId?: number | string;
  idea?: string;
}

export default function ScriptResults({ results, isEnglish, scriptId, idea }: ScriptResultsProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(results.map((_, i) => i));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!results || results.length === 0) return null;

  const handleSave = async () => {
    if (!scriptId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'scripts', String(scriptId)), {
        is_saved: !isSaved
      });
      setIsSaved(!isSaved);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `scripts/${scriptId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(isEnglish ? 'Copied to clipboard successfully' : 'تم النسخ بنجاح');
  };

  const copySelected = (type: 'script' | 'analysis' | 'all') => {
    const selectedResults = results.filter((_, i) => selectedIndices.includes(i));
    if (selectedResults.length === 0) return alert(isEnglish ? 'Please select at least one script' : 'يجب عليك أن تختار اسكربتات أولاً لتتمكن من نسخها');

    const text = selectedResults.map(r => {
      if (type === 'script') return r.script;
      if (type === 'analysis') return r.sceneAnalysis;
      return `${isEnglish ? 'Title' : 'العنوان'}: ${r.title}\n\n${isEnglish ? 'Script' : 'الاسكربت'}:\n${r.script}\n\n${isEnglish ? 'Scene Analysis' : 'تحليل المشاهد'}:\n${r.sceneAnalysis}\n\n${isEnglish ? 'Hook Analysis' : 'تحليل الهوك'}:\n${r.hookAnalysis}`;
    }).join('\n\n' + '='.repeat(20) + '\n\n');

    copyToClipboard(text);
  };

  const exportToPDF = async (type: 'script' | 'with-scenes' | 'all') => {
    const selectedResults = results.filter((_, i) => selectedIndices.includes(i));
    
    if (selectedResults.length === 0) {
      alert(isEnglish ? 'Please select at least one script to download' : 'يجب عليك أن تختار اسكربتات أولاً لتتمكن من تحميلها');
      return;
    }

    const pdfTitle = idea ? idea.substring(0, 50) + (idea.length > 50 ? '...' : '') : (isEnglish ? 'Viral Script AI - Results' : 'نتائج الاسكربتات');
    
    // Create a temporary container for PDF generation
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
    
    selectedResults.forEach((r, i) => {
      const scriptContainer = document.createElement('div');
      scriptContainer.style.marginBottom = '40px';
      scriptContainer.style.pageBreakInside = 'avoid';
      
      const scriptTitle = document.createElement('h2');
      scriptTitle.textContent = `${i + 1}. ${r.title}`;
      scriptTitle.style.fontSize = '18px';
      scriptTitle.style.marginBottom = '15px';
      scriptTitle.style.color = '#0a0a0a';
      scriptContainer.appendChild(scriptTitle);
      
      const scriptContent = document.createElement('div');
      scriptContent.textContent = r.script;
      scriptContent.style.whiteSpace = 'pre-wrap';
      scriptContent.style.fontSize = '14px';
      scriptContent.style.lineHeight = '1.6';
      scriptContent.style.marginBottom = '20px';
      scriptContainer.appendChild(scriptContent);
      
      if (type !== 'script' && r.sceneAnalysis) {
        const sceneTitle = document.createElement('h3');
        sceneTitle.textContent = isEnglish ? 'Visual Direction:' : 'تحليل المشاهد:';
        sceneTitle.style.fontSize = '14px';
        sceneTitle.style.marginTop = '15px';
        sceneTitle.style.color = '#4a4a4a';
        scriptContainer.appendChild(sceneTitle);
        
        const sceneContent = document.createElement('div');
        sceneContent.textContent = r.sceneAnalysis;
        sceneContent.style.whiteSpace = 'pre-wrap';
        sceneContent.style.fontSize = '12px';
        sceneContent.style.color = '#4a4a4a';
        scriptContainer.appendChild(sceneContent);
      }
      
      if (type === 'all') {
        const hookTitle = document.createElement('h3');
        hookTitle.textContent = isEnglish ? 'Hook Analysis:' : 'تحليل الهوك:';
        hookTitle.style.fontSize = '14px';
        hookTitle.style.marginTop = '15px';
        hookTitle.style.color = '#4a4a4a';
        scriptContainer.appendChild(hookTitle);
        
        const hookContent = document.createElement('div');
        hookContent.textContent = r.hookAnalysis;
        hookContent.style.whiteSpace = 'pre-wrap';
        hookContent.style.fontSize = '12px';
        hookContent.style.color = '#4a4a4a';
        scriptContainer.appendChild(hookContent);
      }
      
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
      alert(isEnglish ? 'Failed to generate PDF' : 'فشل في إنشاء ملف PDF');
    } finally {
      document.body.removeChild(container);
    }
  };

  const toggleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  return (
    <div className="mt-20 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]">
            <Sparkles className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {isEnglish ? 'Generated Masterpieces' : 'النتائج المقترحة'}
            </h2>
            <p className="text-dim font-bold mt-1">
              {isEnglish ? `Successfully synthesized ${results.length} scripts` : `تم توليد ${results.length} اسكربتات بنجاح`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
            <button 
              onClick={() => setSelectedIndices(results.map((_, i) => i))} 
              className="text-xs px-5 py-2.5 bg-white/10 text-white rounded-xl font-black uppercase tracking-widest transition-all hover:bg-white/20"
            >
              {isEnglish ? 'Select All' : 'تحديد الكل'}
            </button>
            <button 
              onClick={() => setSelectedIndices([])} 
              className="text-xs px-5 py-2.5 text-dim hover:text-white rounded-xl font-black uppercase tracking-widest transition-colors"
            >
              {isEnglish ? 'Deselect' : 'إلغاء'}
            </button>
          </div>
          
          <div className="h-10 w-px bg-white/5 hidden sm:block mx-2" />
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => copySelected('script')} 
              className="text-xs px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl hover:bg-brand-primary/20 font-black uppercase tracking-widest flex items-center gap-3 transition-all border border-brand-primary/20"
            >
              <Copy className="w-4 h-4" /> {isEnglish ? 'Copy Scripts' : 'نسخ الاسكربتات'}
            </button>
            <button 
              onClick={() => copySelected('all')} 
              className="text-xs px-6 py-3 bg-brand-primary text-white rounded-2xl hover:bg-brand-primary/90 font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(0,102,255,0.3)]"
            >
              <Share2 className="w-4 h-4" /> {isEnglish ? 'Copy All' : 'نسخ الكل'}
            </button>
          </div>
          
          <button 
            onClick={() => exportToPDF('script')} 
            className="text-xs px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500/20 font-black uppercase tracking-widest flex items-center gap-3 transition-all border border-emerald-500/20"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>

          {scriptId && (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`text-xs px-6 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all border ${isSaved ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-white/5 text-dim hover:text-white border-white/5'}`}
            >
              <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
              {isSaved ? (isEnglish ? 'Starred' : 'مميزة بنجمة') : (isEnglish ? 'Star Script' : 'تمييز بنجمة')}
            </button>
          )}
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 gap-12">
        {results.map((result, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card transition-all duration-500 rounded-[3rem] border overflow-hidden group ${selectedIndices.includes(index) ? 'border-brand-primary ring-1 ring-brand-primary/50 shadow-[0_0_50px_rgba(0,102,255,0.1)]' : 'border-white/5'}`}
          >
            <div className={`px-10 py-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${index === 0 ? 'bg-brand-primary/5' : 'bg-white/5'}`}>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => toggleSelect(index)} 
                  className={`p-2 rounded-xl transition-all duration-300 ${selectedIndices.includes(index) ? 'text-brand-primary bg-brand-primary/10 border border-brand-primary/20' : 'text-dim bg-white/5 border border-white/5 hover:border-white/20'}`}
                >
                  {selectedIndices.includes(index) ? <CheckSquare className="w-7 h-7" /> : <Square className="w-7 h-7" />}
                </button>
                {scriptId && (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`p-2 rounded-xl transition-all duration-300 ${isSaved ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' : 'text-dim bg-white/5 border border-white/5 hover:border-white/20 hover:text-amber-500'}`}
                    title={isEnglish ? 'Star this script' : 'تمييز بنجمة'}
                  >
                    <Star className={`w-7 h-7 ${isSaved ? 'fill-amber-500' : ''}`} />
                  </button>
                )}
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${index === 0 ? 'bg-brand-primary/20 border-brand-primary/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                    {index === 0 ? (
                      <Sparkles className="w-6 h-6 text-brand-primary" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {result.title}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm ml-16 sm:ml-0">
                <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary font-black uppercase tracking-widest border border-brand-primary/20 text-[10px]">
                  <Brain className="w-4 h-4" />
                  {result.curiosityLevel}
                </span>
                <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-400 font-black uppercase tracking-widest border border-rose-500/20 text-[10px]">
                  <Heart className="w-4 h-4" />
                  {result.emotion}
                </span>
              </div>
            </div>
            
            <div className="p-10 md:p-12 space-y-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-dim uppercase tracking-[0.2em] flex items-center gap-3">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    {isEnglish ? 'The Narrative' : 'الاسكربت'}
                  </h4>
                  <button 
                    onClick={() => copyToClipboard(result.script)} 
                    className="text-[10px] font-black text-brand-primary hover:text-white uppercase tracking-widest bg-brand-primary/10 px-4 py-2 rounded-xl transition-all border border-brand-primary/20"
                  >
                    {isEnglish ? 'Copy' : 'نسخ'}
                  </button>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 whitespace-pre-wrap text-white leading-relaxed font-bold text-xl shadow-inner">
                  {result.script}
                </div>
              </div>
              
              {result.analysis ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <Video className="w-4 h-4 text-emerald-400" />
                      {isEnglish ? 'Script Analysis & Visuals' : 'التحليل الشامل والمشاهد المقترحة'}
                    </h4>
                    <button 
                      onClick={() => copyToClipboard(result.analysis!.map(a => `${a.stage}:\n${a.content}`).join('\n\n'))} 
                      className="text-[10px] font-black text-emerald-400 hover:text-white uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl transition-all border border-emerald-500/20"
                    >
                      {isEnglish ? 'Copy Analysis' : 'نسخ التحليل'}
                    </button>
                  </div>
                  <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 p-4 text-center">
                      <div className="col-span-4 md:col-span-3 font-black text-dim text-sm uppercase tracking-widest">{isEnglish ? 'Stage' : 'المرحلة'}</div>
                      <div className="col-span-8 md:col-span-9 font-black text-dim text-sm uppercase tracking-widest">{isEnglish ? 'Suggested Content' : 'المحتوى المقترح'}</div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {result.analysis.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 p-4 hover:bg-white/5 transition-colors items-center">
                          <div className="col-span-4 md:col-span-3 text-center font-bold text-emerald-400 text-sm md:text-base px-2">
                            {item.stage}
                          </div>
                          <div className={`col-span-8 md:col-span-9 text-dim font-medium text-sm md:text-base leading-relaxed px-4 ${isEnglish ? 'border-l' : 'border-r'} border-white/10`}>
                            {item.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                    {result.sceneAnalysis && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                          <h4 className="text-[10px] font-black text-dim uppercase tracking-[0.2em] flex items-center gap-3">
                            <Video className="w-4 h-4 text-brand-secondary" />
                            {isEnglish ? 'Visual Direction' : 'تحليل المشاهد والإضافات'}
                          </h4>
                          <button 
                            onClick={() => copyToClipboard(result.sceneAnalysis!)} 
                            className="text-[10px] font-black text-brand-secondary hover:text-white uppercase tracking-widest bg-brand-secondary/10 px-4 py-2 rounded-xl transition-all border border-brand-secondary/20"
                          >
                            {isEnglish ? 'Copy' : 'نسخ'}
                          </button>
                        </div>
                        <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5 whitespace-pre-wrap text-dim leading-relaxed font-medium text-lg">
                          {result.sceneAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-8">
                    {result.hookAnalysis && (
                      <div className="glass-card p-8 rounded-[2.5rem] border border-emerald-500/20 space-y-6 relative group/card">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] group-hover/card:bg-emerald-500/10 transition-colors" />
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5" />
                          {isEnglish ? 'Hook Analysis' : 'تحليل الهوك'}
                        </h4>
                        <div className="text-emerald-400/90 text-lg leading-relaxed font-bold">
                          {result.hookAnalysis}
                        </div>
                      </div>
                    )}
                    
                    {result.suggestedScenes && (
                      <div className="glass-card p-8 rounded-[2.5rem] border border-brand-primary/20 space-y-6 relative group/card">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-[40px] group-hover/card:bg-brand-primary/10 transition-colors" />
                        <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-3">
                          <Video className="w-5 h-5" />
                          {isEnglish ? 'Suggested Scenes' : 'المشاهد المقترحة'}
                        </h4>
                        <div className="text-brand-primary/90 text-lg leading-relaxed font-bold">
                          {result.suggestedScenes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <InteractiveCat isEnglish={isEnglish} />
    </div>
  );
}
