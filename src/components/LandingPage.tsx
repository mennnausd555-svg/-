import React, { useState } from 'react';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wand2, ChevronDown, CheckCircle2, Star, BrainCircuit, Zap, 
  MessageSquare, Play, FileText, Video, Layers, Quote,
  Globe, Shield, BarChart3, MessageCircle, HelpCircle, ArrowLeft, Save
} from 'lucide-react';
import { DEFAULT_LANDING_CONTENT } from '../defaultLandingContent';
import { db, doc, setDoc } from '../firebase';

interface LandingPageProps {
  onStart: () => void;
  isEnglish: boolean;
  setIsEnglish: (val: boolean) => void;
  config: any;
  editMode?: boolean;
}

function EditableText({ 
  value, 
  onChange, 
  isEditing, 
  className, 
  as: Component = 'span' 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  isEditing?: boolean, 
  className?: string, 
  as?: any 
}) {
  if (!isEditing) {
    return <Component className={className} dangerouslySetInnerHTML={{ __html: value }} />;
  }
  
  return (
    <Component 
      className={`${className} outline-none ring-2 ring-brand-primary/50 hover:ring-brand-primary rounded px-1 min-w-[20px] inline-block transition-all`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

function FAQItem({ question, answer, isEditing, onChangeQ, onChangeA }: { question: string, answer: string, isEditing?: boolean, onChangeQ?: (v: string) => void, onChangeA?: (v: string) => void, key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={(e) => {
          if (isEditing) e.preventDefault();
          else setIsOpen(!isOpen);
        }}
        className="w-full py-6 flex items-center justify-between text-right group"
      >
        <EditableText 
          value={question} 
          onChange={onChangeQ || (() => {})} 
          isEditing={isEditing} 
          className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors" 
        />
        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen || isEditing ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-dim" />
        </div>
      </button>
      <AnimatePresence>
        {(isOpen || isEditing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-dim leading-relaxed">
              <EditableText 
                value={answer} 
                onChange={onChangeA || (() => {})} 
                isEditing={isEditing} 
                as="p"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage({ onStart, isEnglish, setIsEnglish, config, editMode }: LandingPageProps) {
  const t = isEnglish ? translations.en : translations.ar;
  const [localContent, setLocalContent] = useState(() => {
    // Deep merge to ensure all sections exist
    const merged = { ...DEFAULT_LANDING_CONTENT };
    if (config?.landingContent) {
      Object.keys(config.landingContent).forEach(key => {
        if (typeof config.landingContent[key] === 'object' && !Array.isArray(config.landingContent[key])) {
          merged[key as keyof typeof merged] = { ...merged[key as keyof typeof merged], ...config.landingContent[key] };
        } else {
          merged[key as keyof typeof merged] = config.landingContent[key];
        }
      });
    }
    return merged;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site_config'), {
        ...config,
        landingContent: localContent
      }, { merge: true });
      alert(isEnglish ? 'Changes saved successfully!' : 'تم حفظ التغييرات بنجاح!');
    } catch (err) {
      console.error(err);
      alert(isEnglish ? 'Failed to save changes.' : 'فشل حفظ التغييرات.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (section: string, field: string, value: any) => {
    setLocalContent((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const c = localContent;
  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-primary selection:text-white overflow-x-hidden font-sans" dir={isEnglish ? 'ltr' : 'rtl'}>
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.3)]">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight uppercase">
                <EditableText 
                  value={c.header?.logo || 'Abqareno AI'} 
                  onChange={(v) => updateContent('header', 'logo', v)} 
                  isEditing={editMode} 
                />
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-dim">
            <a href="#how-it-works" className="hover:text-white transition-colors">{t.howItWorksTitle}</a>
            <a href="#features" className="hover:text-white transition-colors">{t.features.title}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t.faq.title}</a>
          </div>

          <button 
            onClick={onStart}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-full font-bold text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,102,255,0.4)]"
          >
            <EditableText 
              value={isEnglish ? (c.header?.btnEn || 'Get started for free') : (c.header?.btnAr || 'ابدأ مجاناً')} 
              onChange={(v) => updateContent('header', isEnglish ? 'btnEn' : 'btnAr', v)} 
              isEditing={editMode} 
            />
          </button>
        </div>
        <div className="w-full bg-brand-primary/10 border-b border-brand-primary/20 py-2 text-center">
          <p className="text-xs md:text-sm font-bold text-brand-primary">
            <EditableText 
              value={isEnglish ? (c.header?.bannerEn || 'Write video scripts that hook viewers... before they hit skip.') : (c.header?.bannerAr || 'اكتب سكربتات فيديو تجذب المشاهد… قبل أن يضغط زر التخطي.')} 
              onChange={(v) => updateContent('header', isEnglish ? 'bannerEn' : 'bannerAr', v)} 
              isEditing={editMode} 
            />
          </p>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.2] tracking-tight"
            >
              <EditableText 
                value={isEnglish ? c.hero.titleEn : c.hero.titleAr} 
                onChange={(v) => updateContent('hero', isEnglish ? 'titleEn' : 'titleAr', v)} 
                isEditing={editMode} 
              /> <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400 drop-shadow-[0_0_30px_rgba(0,102,255,0.5)]">
                <EditableText 
                  value={isEnglish ? c.hero.highlightEn : c.hero.highlightAr} 
                  onChange={(v) => updateContent('hero', isEnglish ? 'highlightEn' : 'highlightAr', v)} 
                  isEditing={editMode} 
                />
              </span> <br/>
              <EditableText 
                value={isEnglish ? c.hero.subtitleEn : c.hero.subtitleAr} 
                onChange={(v) => updateContent('hero', isEnglish ? 'subtitleEn' : 'subtitleAr', v)} 
                isEditing={editMode} 
              />
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-dim max-w-3xl mx-auto mb-6 leading-relaxed"
            >
              <EditableText 
                value={isEnglish ? c.hero.desc1En : c.hero.desc1Ar} 
                onChange={(v) => updateContent('hero', isEnglish ? 'desc1En' : 'desc1Ar', v)} 
                isEditing={editMode} 
              />
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 max-w-2xl mx-auto mb-12"
            >
              <EditableText 
                value={isEnglish ? c.hero.desc2En : c.hero.desc2Ar} 
                onChange={(v) => updateContent('hero', isEnglish ? 'desc2En' : 'desc2Ar', v)} 
                isEditing={editMode} 
              />
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mb-20"
            >
              <button onClick={onStart} className="relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 bg-brand-primary rounded-full hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.5)] text-xl group">
                <EditableText 
                  value={isEnglish ? c.hero.btnEn : c.hero.btnAr} 
                  onChange={(v) => updateContent('hero', isEnglish ? 'btnEn' : 'btnAr', v)} 
                  isEditing={editMode} 
                />
                <ArrowLeft className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,102,255,0.2)] group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-blue-900/20 mix-blend-overlay z-10 pointer-events-none" />
              {c.hero.mediaUrl ? (
                c.hero.mediaType === 'video' ? (
                  <video src={c.hero.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={c.hero.mediaUrl} alt="Hero Media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )
              ) : (
                <div className="w-full h-full bg-[#0A0A0A] flex items-center justify-center">
                  <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,102,255,0.5)]">
                    <Play className="w-8 h-8 text-white ml-2" />
                  </div>
                </div>
              )}
              
              {editMode && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm z-20">
                  <button 
                    onClick={() => {
                      const url = prompt(isEnglish ? 'Enter Image URL:' : 'أدخل رابط الصورة:', c.hero.mediaUrl || '');
                      if (url !== null) {
                        updateContent('hero', 'mediaUrl', url);
                        updateContent('hero', 'mediaType', 'image');
                      }
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-md transition-colors"
                  >
                    {isEnglish ? 'Set Image URL' : 'تعيين رابط صورة'}
                  </button>
                  <button 
                    onClick={() => {
                      const url = prompt(isEnglish ? 'Enter Video URL (MP4):' : 'أدخل رابط الفيديو (MP4):', c.hero.mediaUrl || '');
                      if (url !== null) {
                        updateContent('hero', 'mediaUrl', url);
                        updateContent('hero', 'mediaType', 'video');
                      }
                    }}
                    className="px-6 py-3 bg-brand-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                  >
                    {isEnglish ? 'Set Video URL' : 'تعيين رابط فيديو'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Callout Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-blue-400" />
              <p className="text-2xl md:text-3xl font-bold leading-relaxed mb-8">
                <EditableText 
                  value={isEnglish ? c.callout.textEn : c.callout.textAr} 
                  onChange={(v) => updateContent('callout', isEnglish ? 'textEn' : 'textAr', v)} 
                  isEditing={editMode} 
                />
                <span className="text-brand-primary">
                  <EditableText 
                    value={isEnglish ? c.callout.highlightEn : c.callout.highlightAr} 
                    onChange={(v) => updateContent('callout', isEnglish ? 'highlightEn' : 'highlightAr', v)} 
                    isEditing={editMode} 
                  />
                </span>
              </p>
              <div className="inline-block px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary font-black text-xl">
                <EditableText 
                  value={isEnglish ? c.callout.badgeEn : c.callout.badgeAr} 
                  onChange={(v) => updateContent('callout', isEnglish ? 'badgeEn' : 'badgeAr', v)} 
                  isEditing={editMode} 
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-12">
              <EditableText 
                value={isEnglish ? c.demo.titleEn : c.demo.titleAr} 
                onChange={(v) => updateContent('demo', isEnglish ? 'titleEn' : 'titleAr', v)} 
                isEditing={editMode} 
              />
            </h2>
            
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative max-w-3xl mx-auto mb-12">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-right space-y-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 inline-block text-dim">
                  <EditableText 
                    value={isEnglish ? c.demo.ideaEn : c.demo.ideaAr} 
                    onChange={(v) => updateContent('demo', isEnglish ? 'ideaEn' : 'ideaAr', v)} 
                    isEditing={editMode} 
                  />
                </div>
                <div className="flex justify-center my-4">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Wand2 className="w-5 h-5 text-brand-primary" />
                  </div>
                </div>
                <div className="bg-brand-primary/10 p-6 rounded-2xl border border-brand-primary/20 text-white text-lg leading-relaxed text-right">
                  <span className="text-brand-primary font-bold block mb-2">[Hook - خطاف]</span>
                  <EditableText 
                    value={isEnglish ? c.demo.hookEn : c.demo.hookAr} 
                    onChange={(v) => updateContent('demo', isEnglish ? 'hookEn' : 'hookAr', v)} 
                    isEditing={editMode} 
                  />
                  <br/><br/>
                  <span className="text-brand-primary font-bold block mb-2">[Body - المحتوى]</span>
                  <EditableText 
                    value={isEnglish ? c.demo.bodyEn : c.demo.bodyAr} 
                    onChange={(v) => updateContent('demo', isEnglish ? 'bodyEn' : 'bodyAr', v)} 
                    isEditing={editMode} 
                  />
                </div>
              </div>
            </div>

            <button onClick={onStart} className="px-10 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
              <EditableText 
                value={isEnglish ? c.demo.btnEn : c.demo.btnAr} 
                onChange={(v) => updateContent('demo', isEnglish ? 'btnEn' : 'btnAr', v)} 
                isEditing={editMode} 
              />
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                <EditableText 
                  value={isEnglish ? c.howItWorks.titleEn : c.howItWorks.titleAr} 
                  onChange={(v) => updateContent('howItWorks', isEnglish ? 'titleEn' : 'titleAr', v)} 
                  isEditing={editMode} 
                />
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: MessageSquare, num: '1' },
                { icon: Layers, num: '2' },
                { icon: Zap, num: '3' },
                { icon: Video, num: '4' }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl text-center relative"
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(0,102,255,0.5)]">
                    {step.num}
                  </div>
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-bold">
                    <EditableText 
                      value={isEnglish ? c.howItWorks.stepsEn[i] : c.howItWorks.stepsAr[i]} 
                      onChange={(v) => {
                        const newSteps = [...(isEnglish ? c.howItWorks.stepsEn : c.howItWorks.stepsAr)];
                        newSteps[i] = v;
                        updateContent('howItWorks', isEnglish ? 'stepsEn' : 'stepsAr', newSteps);
                      }} 
                      isEditing={editMode} 
                    />
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                <EditableText 
                  value={isEnglish ? c.features.titleEn : c.features.titleAr} 
                  onChange={(v) => updateContent('features', isEnglish ? 'titleEn' : 'titleAr', v)} 
                  isEditing={editMode} 
                />
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Layers },
                { icon: Star },
                { icon: Video },
                { icon: Play },
                { icon: BarChart3 },
                { icon: FileText },
                { icon: FileText },
                { icon: Globe },
                { icon: Zap }
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:border-brand-primary/30 transition-colors">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-bold mt-2">
                    <EditableText 
                      value={isEnglish ? c.features.itemsEn[i] : c.features.itemsAr[i]} 
                      onChange={(v) => {
                        const newItems = [...(isEnglish ? c.features.itemsEn : c.features.itemsAr)];
                        newItems[i] = v;
                        updateContent('features', isEnglish ? 'itemsEn' : 'itemsAr', newItems);
                      }} 
                      isEditing={editMode} 
                    />
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Bonuses */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-brand-primary/20 to-blue-900/20 border border-brand-primary/30 rounded-[3rem] p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-black mb-12">
                <EditableText 
                  value={isEnglish ? c.bonuses.titleEn : c.bonuses.titleAr} 
                  onChange={(v) => updateContent('bonuses', isEnglish ? 'titleEn' : 'titleAr', v)} 
                  isEditing={editMode} 
                />
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-right">
                {(isEnglish ? c.bonuses.itemsEn : c.bonuses.itemsAr).map((bonus: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <span className="text-xl font-bold">
                      <EditableText 
                        value={bonus} 
                        onChange={(v) => {
                          const newItems = [...(isEnglish ? c.bonuses.itemsEn : c.bonuses.itemsAr)];
                          newItems[i] = v;
                          updateContent('bonuses', isEnglish ? 'itemsEn' : 'itemsAr', newItems);
                        }} 
                        isEditing={editMode} 
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Offer */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <EditableText 
                value={isEnglish ? c.offer.titleEn : c.offer.titleAr} 
                onChange={(v) => updateContent('offer', isEnglish ? 'titleEn' : 'titleAr', v)} 
                isEditing={editMode} 
              />
            </h2>
            <p className="text-xl text-dim mb-10">
              <EditableText 
                value={isEnglish ? c.offer.subtitleEn : c.offer.subtitleAr} 
                onChange={(v) => updateContent('offer', isEnglish ? 'subtitleEn' : 'subtitleAr', v)} 
                isEditing={editMode} 
              />
            </p>
            <button onClick={onStart} className="px-12 py-5 bg-brand-primary text-white rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,102,255,0.4)]">
              <EditableText 
                value={isEnglish ? c.offer.btnEn : c.offer.btnAr} 
                onChange={(v) => updateContent('offer', isEnglish ? 'btnEn' : 'btnAr', v)} 
                isEditing={editMode} 
              />
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-black mb-12 text-center">
              <EditableText 
                value={isEnglish ? c.faq.titleEn : c.faq.titleAr} 
                onChange={(v) => updateContent('faq', isEnglish ? 'titleEn' : 'titleAr', v)} 
                isEditing={editMode} 
              />
            </h2>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8">
              {(isEnglish ? c.faq.itemsEn : c.faq.itemsAr).map((faq: {q: string, a: string}, i: number) => (
                <FAQItem 
                  key={i} 
                  question={faq.q} 
                  answer={faq.a} 
                  isEditing={editMode}
                  onChangeQ={(v) => {
                    const newItems = [...(isEnglish ? c.faq.itemsEn : c.faq.itemsAr)];
                    newItems[i] = { ...newItems[i], q: v };
                    updateContent('faq', isEnglish ? 'itemsEn' : 'itemsAr', newItems);
                  }}
                  onChangeA={(v) => {
                    const newItems = [...(isEnglish ? c.faq.itemsEn : c.faq.itemsAr)];
                    newItems[i] = { ...newItems[i], a: v };
                    updateContent('faq', isEnglish ? 'itemsEn' : 'itemsAr', newItems);
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-primary/10 blur-[100px] rounded-full" />
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              <EditableText 
                value={isEnglish ? c.finalCta.titleEn : c.finalCta.titleAr} 
                onChange={(v) => updateContent('finalCta', isEnglish ? 'titleEn' : 'titleAr', v)} 
                isEditing={editMode} 
              />
              <span className="text-brand-primary">
                <EditableText 
                  value={isEnglish ? c.finalCta.highlightEn : c.finalCta.highlightAr} 
                  onChange={(v) => updateContent('finalCta', isEnglish ? 'highlightEn' : 'highlightAr', v)} 
                  isEditing={editMode} 
                />
              </span>
            </h2>
            <button onClick={onStart} className="mt-8 px-14 py-6 bg-white text-black rounded-full font-black text-2xl hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              <EditableText 
                value={isEnglish ? c.finalCta.btnEn : c.finalCta.btnAr} 
                onChange={(v) => updateContent('finalCta', isEnglish ? 'btnEn' : 'btnAr', v)} 
                isEditing={editMode} 
              />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-dim text-sm">
        <p>
          <EditableText 
            value={(isEnglish ? (c.footer?.textEn || '© {year} Viral Script AI. All rights reserved.') : (c.footer?.textAr || '© {year} Viral Script AI. جميع الحقوق محفوظة.')).replace('{year}', new Date().getFullYear().toString())} 
            onChange={(v) => updateContent('footer', isEnglish ? 'textEn' : 'textAr', v.replace(new Date().getFullYear().toString(), '{year}'))} 
            isEditing={editMode} 
          />
        </p>
      </footer>

      {editMode && (
        <div className="fixed bottom-6 left-6 z-[100] flex gap-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-brand-primary text-white rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : (isEnglish ? 'Save Changes' : 'حفظ التغييرات')}
          </button>
        </div>
      )}
    </div>
  );
}
