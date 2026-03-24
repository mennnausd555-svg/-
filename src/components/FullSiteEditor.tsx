import React, { useState } from 'react';
import { Layout, Smartphone, Monitor, Save, X, Edit3, Eye, Type, Palette, Video, Image as ImageIcon, MousePointer2, Lock, Wand2, Activity, User as UserIcon, CreditCard, Bookmark, LayoutTemplate, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteConfig } from '../types';
import LandingPage from './LandingPage';
import Auth from './Auth';
import FormatSection from './FormatSection';
import FreeCreationSection from './FreeCreationSection';
import EvaluationSection from './EvaluationSection';
import Suggestions from './Suggestions';
import Profile from './Profile';
import Subscription from './Subscription';
import SavedScripts from './SavedScripts';
import FilmedScripts from './FilmedScripts';
import { db, doc, setDoc, handleFirestoreError, OperationType } from '../firebase';

interface FullSiteEditorProps {
  isEnglish: boolean;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

type PageId = 'landing' | 'login' | 'register' | 'formats' | 'free' | 'evaluate' | 'suggestions' | 'profile' | 'subscription' | 'saved' | 'filmed';

export default function FullSiteEditor({ isEnglish, siteConfig, onUpdateConfig }: FullSiteEditorProps) {
  const [activePage, setActivePage] = useState<PageId>('landing');
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedElement, setSelectedElement] = useState<{ path: string; type: 'text' | 'image' | 'video' | 'section'; label: string } | null>(null);

  const handleElementSelect = (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => {
    if (!isEditMode) return;
    setSelectedElement({ path, type, label });
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const setNestedValue = (obj: any, path: string, value: any) => {
    const newObj = { ...obj };
    const parts = path.split('.');
    let current = newObj;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return newObj;
  };

  const updateConfigValue = (path: string, value: any) => {
    const newConfig = setNestedValue(siteConfig, path, value);
    onUpdateConfig(newConfig);
  };

  const pages: { id: PageId; label: string; icon: any }[] = [
    { id: 'landing', label: isEnglish ? 'Landing Page' : 'صفحة الهبوط', icon: Layout },
    { id: 'login', label: isEnglish ? 'Auth (Login/Register)' : 'الدخول والتسجيل', icon: Lock },
    { id: 'formats', label: isEnglish ? 'Viral Formats' : 'فورمات الفيديوهات', icon: LayoutTemplate },
    { id: 'free', label: isEnglish ? 'Free Generation' : 'توليد حر', icon: Wand2 },
    { id: 'evaluate', label: isEnglish ? 'Text Lab' : 'مختبر النصوص', icon: Activity },
    { id: 'suggestions', label: isEnglish ? 'Suggestions' : 'الاقتراحات', icon: MessageCircle },
    { id: 'profile', label: isEnglish ? 'Profile' : 'الملف الشخصي', icon: UserIcon },
    { id: 'subscription', label: isEnglish ? 'Subscription' : 'الاشتراك', icon: CreditCard },
    { id: 'saved', label: isEnglish ? 'Saved Scripts' : 'الاسكربتات المحفوظة', icon: Bookmark },
    { id: 'filmed', label: isEnglish ? 'Filmed Scripts' : 'الاسكربتات المصورة', icon: Video },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'site_config'), {
        value: JSON.stringify(siteConfig)
      }, { merge: true });
      alert(isEnglish ? 'Site configuration saved successfully!' : 'تم حفظ إعدادات الموقع بنجاح!');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/site_config');
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    const mockUser = {
      id: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      usage_limit: 9999,
      initial_limit: 9999,
      usage_period: 'monthly',
      subscription_status: 'premium'
    };

    switch (activePage) {
      case 'landing':
        return <LandingPage isEnglish={isEnglish} onStart={() => {}} setIsEnglish={() => {}} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'login':
        return <Auth onLogin={() => {}} isEnglish={isEnglish} setIsEnglish={() => {}} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'register':
        return <Auth onLogin={() => {}} isEnglish={isEnglish} setIsEnglish={() => {}} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'formats':
        return <FormatSection isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'free':
        return <FreeCreationSection isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'evaluate':
        return <EvaluationSection isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'suggestions':
        return <Suggestions isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'profile':
        return <Profile isEnglish={isEnglish} user={mockUser as any} onUpdate={() => {}} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'subscription':
        return <Subscription isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'saved':
        return <SavedScripts isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      case 'filmed':
        return <FilmedScripts isEnglish={isEnglish} user={mockUser as any} config={siteConfig} onSelectElement={handleElementSelect} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col" dir={isEnglish ? 'ltr' : 'rtl'}>
      {/* Top Bar */}
      <div className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-brand-primary text-white' : 'text-dim hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-brand-primary text-white' : 'text-dim hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            {isEnglish ? 'Full Site Editor' : 'تعديل الموقع بالكامل'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isEditMode ? 'bg-brand-primary text-white' : 'bg-white/5 text-dim hover:text-white'}`}
          >
            {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? (isEnglish ? 'Preview Mode' : 'وضع المعاينة') : (isEnglish ? 'Edit Mode' : 'وضع التعديل')}
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-nover px-6 py-2 text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : (isEnglish ? 'Save All' : 'حفظ الكل')}
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="p-2 bg-white/5 text-dim hover:text-white rounded-xl border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-white/10 bg-white/5 overflow-y-auto shrink-0 p-4 space-y-2 no-scrollbar">
          <p className="px-4 text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-4">
            {isEnglish ? 'Site Pages' : 'صفحات الموقع'}
          </p>
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activePage === page.id ? 'bg-brand-primary text-white shadow-[0_0_15px_rgba(0,102,255,0.2)]' : 'text-dim hover:bg-white/5 hover:text-white'}`}
            >
              <page.icon className="w-4 h-4" />
              {page.label}
            </button>
          ))}

          {isEditMode && (
            <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
              <p className="px-4 text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-4">
                {isEnglish ? 'Global Styles' : 'التنسيقات العامة'}
              </p>
              
              <div className="space-y-4 px-4">
                <div>
                  <label className="text-[10px] font-black text-dim uppercase tracking-widest block mb-2">{isEnglish ? 'Primary Color' : 'اللون الأساسي'}</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={siteConfig.colors.primary}
                      onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, primary: e.target.value } })}
                      className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={siteConfig.colors.primary}
                      onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, primary: e.target.value } })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-dim uppercase tracking-widest block mb-2">{isEnglish ? 'Secondary Color' : 'اللون الثانوي'}</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={siteConfig.colors.secondary}
                      onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, secondary: e.target.value } })}
                      className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={siteConfig.colors.secondary}
                      onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, secondary: e.target.value } })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-[#0a0a0a] overflow-hidden flex flex-col relative">
          <div className={`flex-1 overflow-y-auto transition-all duration-500 mx-auto ${viewMode === 'mobile' ? 'max-w-[375px] border-x border-white/10 my-8 rounded-[3rem] shadow-2xl' : 'w-full'}`}>
            <div className="relative min-h-full bg-black">
              {renderPage()}
              
              {isEditMode && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* This is where we could add overlay edit buttons if we had a more complex system */}
                  <div className="absolute top-4 right-4 pointer-events-auto">
                    <div className="bg-brand-primary text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <MousePointer2 className="w-3 h-3" />
                      {isEnglish ? 'Editing Mode Active' : 'وضع التعديل نشط'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Edit Panel (Floating) */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div 
                initial={{ x: isEnglish ? 400 : -400 }}
                animate={{ x: 0 }}
                exit={{ x: isEnglish ? 400 : -400 }}
                className={`absolute top-8 ${isEnglish ? 'right-8' : 'left-8'} w-80 glass-card rounded-[2rem] border border-white/10 shadow-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar z-50`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{isEnglish ? 'Page Settings' : 'إعدادات الصفحة'}</h3>
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                    <Palette className="w-4 h-4 text-brand-primary" />
                  </div>
                </div>

                {selectedElement ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{selectedElement.label}</p>
                      <button 
                        onClick={() => setSelectedElement(null)}
                        className="text-dim hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedElement.type === 'text' && (
                      <div className="space-y-4">
                        <textarea 
                          value={getNestedValue(siteConfig, selectedElement.path) || ''}
                          onChange={(e) => updateConfigValue(selectedElement.path, e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all min-h-[150px]"
                          placeholder="Enter text..."
                        />
                      </div>
                    )}

                    {(selectedElement.type === 'image' || selectedElement.type === 'video') && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-4">
                          {getNestedValue(siteConfig, selectedElement.path.replace('.mediaUrl', '.mediaType')) === 'video' || selectedElement.type === 'video' ? (
                            <Video className="w-8 h-8 text-brand-primary" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-brand-primary" />
                          )}
                          
                          {selectedElement.path.includes('.mediaUrl') && (
                            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10 w-full">
                              <button 
                                onClick={() => updateConfigValue(selectedElement.path.replace('.mediaUrl', '.mediaType'), 'image')}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${getNestedValue(siteConfig, selectedElement.path.replace('.mediaUrl', '.mediaType')) !== 'video' ? 'bg-brand-primary text-white' : 'text-dim hover:text-white'}`}
                              >
                                {isEnglish ? 'Image' : 'صورة'}
                              </button>
                              <button 
                                onClick={() => updateConfigValue(selectedElement.path.replace('.mediaUrl', '.mediaType'), 'video')}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${getNestedValue(siteConfig, selectedElement.path.replace('.mediaUrl', '.mediaType')) === 'video' ? 'bg-brand-primary text-white' : 'text-dim hover:text-white'}`}
                              >
                                {isEnglish ? 'Video' : 'فيديو'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-dim uppercase tracking-widest px-1">
                            {getNestedValue(siteConfig, selectedElement.path.replace('.mediaUrl', '.mediaType')) === 'video' ? (isEnglish ? 'Video URL' : 'رابط الفيديو') : (isEnglish ? 'Image URL' : 'رابط الصورة')}
                          </label>
                          <input 
                            type="text" 
                            value={getNestedValue(siteConfig, selectedElement.path) || ''}
                            onChange={(e) => updateConfigValue(selectedElement.path, e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}

                    {selectedElement.type === 'section' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-sm text-white font-bold">{isEnglish ? 'Section Visibility' : 'ظهور القسم'}</span>
                          <button 
                            onClick={() => {
                              const current = getNestedValue(siteConfig, `${selectedElement.path}.visible`);
                              updateConfigValue(`${selectedElement.path}.visible`, !current);
                            }}
                            className={`w-10 h-5 rounded-full transition-all relative ${getNestedValue(siteConfig, `${selectedElement.path}.visible`) !== false ? 'bg-brand-primary' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${getNestedValue(siteConfig, `${selectedElement.path}.visible`) !== false ? (isEnglish ? 'right-1' : 'left-1') : (isEnglish ? 'left-1' : 'right-1')}`} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10">
                      <button 
                        onClick={() => setSelectedElement(null)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        {isEnglish ? 'Done Editing' : 'تم التعديل'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="global-settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">{isEnglish ? 'Site Identity' : 'هوية الموقع'}</p>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={siteConfig.pages.landing.hero.title}
                        onChange={(e) => {
                          const newConfig = { ...siteConfig };
                          newConfig.pages.landing.hero.title = e.target.value;
                          onUpdateConfig(newConfig);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                        placeholder="Site Title"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest flex items-center gap-2">
                      <Type className="w-3 h-3" />
                      {isEnglish ? 'Typography' : 'الخطوط'}
                    </p>
                    <select 
                      value={siteConfig.typography?.fontFamily || 'Inter'}
                      onChange={(e) => onUpdateConfig({
                        ...siteConfig,
                        typography: {
                          ...siteConfig.typography,
                          fontFamily: e.target.value,
                          headingFont: e.target.value
                        }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    >
                      <option value="Inter">Inter (Default)</option>
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Cairo">Cairo</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest flex items-center gap-2">
                      <Palette className="w-3 h-3" />
                      {isEnglish ? 'Theme Colors' : 'ألوان الثيم'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(siteConfig.colors).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[8px] text-dim uppercase">{key}</label>
                          <div className="flex gap-1">
                            <input 
                              type="color" 
                              value={val}
                              onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, [key]: e.target.value } })}
                              className="w-6 h-6 rounded bg-transparent border border-white/10 cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={val}
                              onChange={(e) => onUpdateConfig({ ...siteConfig, colors: { ...siteConfig.colors, [key]: e.target.value } })}
                              className="flex-1 bg-white/5 border border-white/10 rounded px-1 text-[8px] font-mono text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activePage === 'landing' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-dim uppercase tracking-widest">{isEnglish ? 'Hero Section' : 'القسم الرئيسي'}</p>
                        <textarea 
                          value={siteConfig.pages.landing.hero.subtitle}
                          onChange={(e) => {
                            const newConfig = { ...siteConfig };
                            newConfig.pages.landing.hero.subtitle = e.target.value;
                            onUpdateConfig(newConfig);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all min-h-[100px]"
                          placeholder="Subtitle"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-dim">{isEnglish ? 'Visible' : 'مرئي'}</span>
                          <button 
                            onClick={() => {
                              const newConfig = { ...siteConfig };
                              newConfig.pages.landing.hero.visible = !newConfig.pages.landing.hero.visible;
                              onUpdateConfig(newConfig);
                            }}
                            className={`w-10 h-5 rounded-full transition-all relative ${siteConfig.pages.landing.hero.visible ? 'bg-brand-primary' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${siteConfig.pages.landing.hero.visible ? (isEnglish ? 'right-1' : 'left-1') : (isEnglish ? 'left-1' : 'right-1')}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePage !== 'landing' && activePage !== 'login' && activePage !== 'register' && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-dim uppercase tracking-widest">{isEnglish ? 'Page Content' : 'محتوى الصفحة'}</p>
                      <input 
                        type="text" 
                        value={(siteConfig.pages as any)[activePage === 'evaluate' ? 'textLab' : activePage === 'free' ? 'freeGeneration' : activePage]?.title || ''}
                        onChange={(e) => {
                          const newConfig = { ...siteConfig };
                          const key = activePage === 'evaluate' ? 'textLab' : activePage === 'free' ? 'freeGeneration' : activePage;
                          (newConfig.pages as any)[key].title = e.target.value;
                          onUpdateConfig(newConfig);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all"
                        placeholder="Page Title"
                      />
                      <textarea 
                        value={(siteConfig.pages as any)[activePage === 'evaluate' ? 'textLab' : activePage === 'free' ? 'freeGeneration' : activePage]?.subtitle || ''}
                        onChange={(e) => {
                          const newConfig = { ...siteConfig };
                          const key = activePage === 'evaluate' ? 'textLab' : activePage === 'free' ? 'freeGeneration' : activePage;
                          (newConfig.pages as any)[key].subtitle = e.target.value;
                          onUpdateConfig(newConfig);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all min-h-[100px]"
                        placeholder="Page Subtitle"
                      />
                    </div>
                  )}

                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-dim font-medium italic">
                    {isEnglish ? '* Changes are visible in preview immediately. Click Save All to persist.' : '* التغييرات تظهر في المعاينة فوراً. اضغط حفظ الكل للتثبيت.'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
</div>
  );
}
