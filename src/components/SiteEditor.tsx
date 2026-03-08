import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, Trash2, Plus, Save, X, Image as ImageIcon, 
  Type, Palette, Layout, Eye, EyeOff, ChevronRight, 
  ChevronDown, Upload, Trash, Move, Clock, Sparkles, Zap
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { SiteConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SiteEditorProps {
  isEnglish: boolean;
}

const DEFAULT_CONFIG: SiteConfig = {
  logo: { type: 'icon', value: 'Wand2' },
  colors: {
    primary: '#0066FF',
    secondary: '#FF00FF',
    background: '#050505',
    surface: '#121212',
    text: '#FFFFFF',
    dim: '#8E9299'
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      title: 'A Script App, Not A Prompt Box.',
      subtitle: 'Every feature is meticulously crafted to maximize viewer retention and narrative impact.',
      visible: true,
      styles: { titleSize: 'text-6xl md:text-8xl lg:text-9xl', titleAlign: 'center' }
    },
    {
      id: 'features',
      type: 'features',
      title: 'Designed for Virality',
      subtitle: 'Every feature is meticulously crafted to maximize viewer retention.',
      visible: true,
      content: [
        { title: 'Hook Design', desc: 'Craft hooks that stop the scroll.' },
        { title: 'Retention Analysis', desc: 'Deep narrative audit for impact.' },
        { title: 'Strategy', desc: 'Proven viral blueprints.' }
      ]
    },
    {
      id: 'cta',
      type: 'cta',
      title: 'Ready to Viralize?',
      subtitle: 'Join the elite circle of creators.',
      visible: true
    }
  ]
};

function SortableSectionItem({ section, onEdit, onDelete, onToggleVisibility, active }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${active ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-dim hover:text-white">
        <GripVertical className="w-5 h-5" />
      </button>
      
      <button 
        onClick={() => onEdit(section)}
        className="flex-1 text-left flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {section.type === 'hero' && <Layout className="w-5 h-5 text-brand-primary" />}
          {section.type === 'features' && <Zap className="w-5 h-5 text-amber-400" />}
          {section.type === 'cta' && <Sparkles className="w-5 h-5 text-brand-secondary" />}
        </div>
        <div>
          <p className="font-bold text-white text-sm truncate max-w-[150px]">{section.title}</p>
          <p className="text-[10px] text-dim uppercase tracking-widest">{section.type}</p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onToggleVisibility(section.id)}
          className={`p-2 rounded-lg transition-colors ${section.visible ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-dim hover:bg-white/10'}`}
        >
          {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button 
          onClick={() => onDelete(section.id)}
          className="p-2 text-dim hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SiteEditor({ isEnglish }: SiteEditorProps) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setConfig(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        // Show success toast or something
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setConfig((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
        const newIndex = prev.sections.findIndex((s) => s.id === over.id);
        return {
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex),
        };
      });
    }
  };

  const deleteSection = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
    if (activeSectionId === id) setActiveSectionId(null);
  };

  const toggleVisibility = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    }));
  };

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    const newSection = {
      id: newId,
      type: 'hero' as const,
      title: 'New Section',
      subtitle: 'Description goes here',
      visible: true,
      styles: { titleSize: 'text-4xl', titleAlign: 'center' }
    };
    setConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setActiveSectionId(newId);
  };

  const activeSection = config.sections.find(s => s.id === activeSectionId);

  const updateSection = (updates: any) => {
    if (!activeSectionId) return;
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === activeSectionId ? { ...s, ...updates } : s)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        if (res.ok) {
          const { url } = await res.json();
          if (field === 'logo') {
            setConfig(prev => ({ ...prev, logo: { type: 'image', value: url } }));
          } else {
            updateSection({ [field]: url });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-20 text-center text-dim font-black uppercase tracking-widest">Loading Editor...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Sidebar - Section List */}
      <div className="lg:col-span-4 space-y-8">
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              {isEnglish ? 'Site Structure' : 'هيكل الموقع'}
            </h3>
            <button 
              onClick={addSection}
              className="p-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={config.sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {config.sections.map((section) => (
                  <SortableSectionItem 
                    key={section.id} 
                    section={section} 
                    active={activeSectionId === section.id}
                    onEdit={(s: any) => setActiveSectionId(s.id)}
                    onDelete={deleteSection}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Global Styles */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-8">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {isEnglish ? 'Global Styles' : 'التنسيق العام'}
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                  {config.logo.type === 'icon' ? <Layout className="w-6 h-6 text-brand-primary" /> : <img src={config.logo.value} className="w-full h-full object-cover" />}
                </div>
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-center hover:bg-white/10 transition-all">
                    {isEnglish ? 'Change Logo' : 'تغيير اللوجو'}
                  </div>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} accept="image/*" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(config.colors) as [keyof SiteConfig['colors'], string][]).map(([key, val]) => (
                <div key={key} className="space-y-2 relative">
                  <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{key}</label>
                  <button 
                    onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                    className="w-full h-10 rounded-xl border border-white/10 flex items-center gap-3 px-3 hover:bg-white/5 transition-all"
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: val }} />
                    <span className="text-xs font-mono text-dim">{val}</span>
                  </button>
                  {showColorPicker === key && (
                    <div className="absolute z-50 top-full left-0 mt-2 p-4 glass-card border border-white/10 rounded-2xl shadow-2xl">
                      <HexColorPicker 
                        color={val} 
                        onChange={(c) => setConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: c } }))} 
                      />
                      <button 
                        onClick={() => setShowColorPicker(null)}
                        className="w-full mt-4 py-2 bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-nover py-5 text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,102,255,0.2)]"
        >
          {saving ? <Clock className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          {isEnglish ? 'Save Site Changes' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {activeSection ? (
            <motion.div 
              key={activeSection.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-10"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                    <Layout className="w-7 h-7 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{isEnglish ? 'Edit Section' : 'تعديل القسم'}</h3>
                    <p className="text-dim font-bold uppercase tracking-widest text-[10px]">{activeSection.type} • {activeSection.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSectionId(null)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all text-dim hover:text-white"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Section Type */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Section Type' : 'نوع القسم'}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['hero', 'features', 'cta', 'footer'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => updateSection({ type })}
                        className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${activeSection.type === type ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-dim border-white/5 hover:border-white/20'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Editing */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Title' : 'العنوان'}</label>
                    <textarea 
                      value={activeSection.title || ''}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full input-field min-h-[100px] text-2xl font-black leading-tight"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Subtitle' : 'العنوان الفرعي'}</label>
                    <textarea 
                      value={activeSection.subtitle || ''}
                      onChange={(e) => updateSection({ subtitle: e.target.value })}
                      className="w-full input-field min-h-[100px] text-lg font-medium text-dim leading-relaxed"
                    />
                  </div>
                </div>

                {/* Style Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Text Alignment' : 'محاذاة النص'}</label>
                    <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5">
                      {['left', 'center', 'right'].map((align) => (
                        <button 
                          key={align}
                          onClick={() => updateSection({ styles: { ...activeSection.styles, titleAlign: align } })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection.styles?.titleAlign === align ? 'bg-brand-primary text-white' : 'text-dim hover:text-white'}`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Title Size' : 'حجم العنوان'}</label>
                    <select 
                      value={activeSection.styles?.titleSize || 'text-4xl'}
                      onChange={(e) => updateSection({ styles: { ...activeSection.styles, titleSize: e.target.value } })}
                      className="w-full input-field font-black uppercase tracking-widest text-xs"
                    >
                      <option value="text-2xl">Small</option>
                      <option value="text-4xl">Medium</option>
                      <option value="text-6xl">Large</option>
                      <option value="text-8xl">Extra Large</option>
                      <option value="text-9xl">Massive</option>
                    </select>
                  </div>
                </div>

                {/* Background Image/Color */}
                <div className="space-y-4 pt-8 border-t border-white/5">
                  <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Background' : 'الخلفية'}</label>
                  <div className="flex items-center gap-6">
                    <label className="flex-1 cursor-pointer">
                      <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-white/10 transition-all">
                        <Upload className="w-8 h-8 text-dim" />
                        <span className="text-xs font-black uppercase tracking-widest text-dim">
                          {isEnglish ? 'Upload Background Image' : 'رفع صورة خلفية'}
                        </span>
                      </div>
                      <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'bgImage')} accept="image/*" />
                    </label>
                    <div className="w-px h-20 bg-white/5" />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-dim uppercase tracking-widest">Color</label>
                      <button 
                        onClick={() => setShowColorPicker('sectionBg')}
                        className="w-20 h-20 rounded-[2rem] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
                        style={{ backgroundColor: activeSection.styles?.bgColor || 'transparent' }}
                      >
                        <Palette className="w-6 h-6 text-dim" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border border-white/5 border-dashed">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                <Layout className="w-12 h-12 text-dim" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                {isEnglish ? 'Select a section to edit' : 'اختر قسماً لتعديله'}
              </h3>
              <p className="text-dim text-lg max-w-md leading-relaxed">
                {isEnglish ? 'Click on any section in the sidebar to modify its content, style, and visibility.' : 'اضغط على أي قسم في القائمة الجانبية لتعديل محتواه وتنسيقه وظهوره.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


