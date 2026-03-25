import React, { useState, useEffect } from 'react';
import { Save, Layout, Video, Type, Palette, Eye, EyeOff } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { SiteConfig } from '../types';
import { db, doc, getDoc, setDoc, handleFirestoreError, OperationType } from '../firebase';

const DEFAULT_CONFIG: SiteConfig = {
  logo: { type: 'icon', value: 'Wand2' },
  colors: {
    primary: '#0066FF',
    secondary: '#8B5CF6',
    background: '#000000',
    surface: '#050505',
    text: '#FFFFFF',
    dim: '#A1A1AA'
  },
  pages: {
    landing: {
      hero: { title: 'A Script App, Not A Prompt Box.', subtitle: 'Every feature is meticulously crafted to maximize viewer retention and narrative impact.', visible: true },
      features: { title: 'Designed for Virality', subtitle: 'Every feature is meticulously crafted to maximize viewer retention.', visible: true },
      cta: { title: 'Ready to Viralize?', subtitle: 'Join the elite circle of creators.', visible: true }
    },
    formats: { title: 'Viral Formats', subtitle: 'Choose a format to start generating your script.', visible: true },
    freeGeneration: { title: 'Free Generation', subtitle: 'Generate any script you want without a specific format.', visible: true },
    textLab: { title: 'Text Lab', subtitle: 'Analyze and improve your scripts.', visible: true },
    archive: { title: 'Archive', subtitle: 'View your saved scripts.', visible: true },
    auth: { title: 'Auth', subtitle: 'Authentication', visible: true },
    filmedScripts: { title: 'Filmed Scripts', subtitle: 'View your filmed scripts.', visible: true },
    profile: { title: 'Profile', subtitle: 'Manage your profile.', visible: true },
    subscription: { title: 'Subscription', subtitle: 'Manage your subscription.', visible: true },
    suggestions: { title: 'Suggestions', subtitle: 'Send us your suggestions.', visible: true }
  }
};

export default function SiteEditor({ isEnglish, onEditLanding }: { isEnglish: boolean, onEditLanding?: () => void }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'landing' | 'pages'>('landing');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'site_config'))
    .then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Object.keys(data).length > 0) {
          setConfig({ ...DEFAULT_CONFIG, ...data } as SiteConfig);
        }
      }
    })
    .catch(err => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'settings/site_config');
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'site_config'), config);
      alert(isEnglish ? 'Settings saved successfully!' : 'تم حفظ الإعدادات بنجاح!');
      // Update CSS variables
      const root = document.documentElement;
      Object.entries(config.colors).forEach(([key, val]) => {
        if (key === 'primary' || key === 'secondary') {
          root.style.setProperty(`--brand-${key}`, val as string);
        } else if (key === 'background') {
          root.style.setProperty(`--bg-deep`, val as string);
        } else if (key === 'surface') {
          root.style.setProperty(`--bg-surface`, val as string);
          root.style.setProperty(`--bg-card`, val as string);
        } else if (key === 'text') {
          root.style.setProperty(`--text-main`, val as string);
        } else if (key === 'dim') {
          root.style.setProperty(`--text-dim`, val as string);
        }
      });
    } catch (err) {
      console.error(err);
      alert(isEnglish ? 'Failed to save settings.' : 'فشل حفظ الإعدادات.');
      handleFirestoreError(err, OperationType.WRITE, 'settings/site_config');
    } finally {
      setLoading(false);
    }
  };

  const updatePageConfig = (page: string, section: string | null, field: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      if (section) {
        (newConfig.pages as any)[page][section][field] = value;
      } else {
        (newConfig.pages as any)[page][field] = value;
      }
      return newConfig;
    });
  };

  const renderSectionEditor = (page: string, section: string | null, data: any, title: string) => (
    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white uppercase tracking-widest">{title}</h4>
        <button 
          onClick={() => updatePageConfig(page, section, 'visible', !data.visible)}
          className={`p-2 rounded-xl transition-colors ${data.visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
        >
          {data.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Title' : 'العنوان'}</label>
          <input 
            type="text" 
            value={data.title || ''}
            onChange={(e) => updatePageConfig(page, section, 'title', e.target.value)}
            className="w-full input-field"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Subtitle' : 'العنوان الفرعي'}</label>
          <textarea 
            value={data.subtitle || ''}
            onChange={(e) => updatePageConfig(page, section, 'subtitle', e.target.value)}
            className="w-full input-field min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2 flex items-center gap-2">
            <Video className="w-4 h-4" /> {isEnglish ? 'Video URL (Optional)' : 'رابط الفيديو (اختياري)'}
          </label>
          <input 
            type="text" 
            value={data.videoUrl || ''}
            onChange={(e) => updatePageConfig(page, section, 'videoUrl', e.target.value)}
            className="w-full input-field"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">{isEnglish ? 'Web Edit' : 'تعديل الويب'}</h2>
          <p className="text-dim font-medium mt-2">{isEnglish ? 'Customize your website content and colors.' : 'تخصيص محتوى وألوان موقعك.'}</p>
        </div>
        <div className="flex gap-4">
          {onEditLanding && (
            <button 
              onClick={onEditLanding}
              className="px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {isEnglish ? 'Visual Editor' : 'المحرر المرئي'}
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-nover px-8 py-3 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : (isEnglish ? 'Save Changes' : 'حفظ التغييرات')}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4">
        {[
          { id: 'landing', label: isEnglish ? 'Landing Page' : 'صفحة الهبوط', icon: Layout },
          { id: 'pages', label: isEnglish ? 'Other Pages' : 'الصفحات الأخرى', icon: Type },
          { id: 'colors', label: isEnglish ? 'Colors' : 'الألوان', icon: Palette }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-brand-primary text-white' : 'bg-white/5 text-dim hover:bg-white/10 hover:text-white'}`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'landing' && (
            <div className="space-y-6">
              {renderSectionEditor('landing', 'hero', config.pages.landing.hero, isEnglish ? 'Hero Section' : 'القسم الرئيسي')}
              {renderSectionEditor('landing', 'features', config.pages.landing.features, isEnglish ? 'Features Section' : 'قسم المميزات')}
              {renderSectionEditor('landing', 'cta', config.pages.landing.cta, isEnglish ? 'Call to Action' : 'قسم الدعوة لاتخاذ إجراء')}
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6">
              {renderSectionEditor('freeGeneration', null, config.pages.freeGeneration, isEnglish ? 'Free Generation' : 'توليد حر')}
              {renderSectionEditor('formats', null, config.pages.formats, isEnglish ? 'Formats' : 'فورمات')}
              {renderSectionEditor('textLab', null, config.pages.textLab, isEnglish ? 'Text Lab' : 'مختبر النصوص')}
              {renderSectionEditor('archive', null, config.pages.archive, isEnglish ? 'Archive' : 'الأرشيف')}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.entries(config.colors) as [keyof SiteConfig['colors'], string][]).map(([key, val]) => (
                <div key={key} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <label className="text-[10px] font-black text-dim uppercase tracking-widest block mb-4">{key}</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: val }} />
                    <input 
                      type="text" 
                      value={val}
                      onChange={(e) => setConfig({ ...config, colors: { ...config.colors, [key]: e.target.value } })}
                      className="flex-1 input-field font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 p-6 glass-card rounded-[2rem]">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-primary" />
              {isEnglish ? 'Preview Info' : 'معلومات المعاينة'}
            </h3>
            <p className="text-sm text-dim leading-relaxed">
              {isEnglish 
                ? 'Changes made here will be reflected across the website immediately after saving. You can toggle visibility of sections using the eye icon. Video URLs should be direct links or embed links (e.g., YouTube).'
                : 'التغييرات التي تجريها هنا ستنعكس على الموقع فور حفظها. يمكنك إخفاء أو إظهار الأقسام باستخدام أيقونة العين. روابط الفيديو يجب أن تكون روابط مباشرة أو روابط تضمين (مثل يوتيوب).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
