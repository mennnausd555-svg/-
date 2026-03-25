import React, { useState, useEffect } from 'react';
import { Users, History, TrendingUp, Search, UserPlus, Shield, Ban, CheckCircle, Clock, MoreVertical, ExternalLink, Trash2, Save, X, Settings as SettingsIcon, MessageCircle, Star, Eye, Lock, Unlock, Snowflake, User as UserIcon, BarChart3, Mail, Phone, Calendar, FileText, Activity, Zap, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ScriptHistory, Suggestion, SiteConfig } from '../types';
import { translations } from '../translations';
import SiteEditor from './SiteEditor';
import { db, collection, query, getDocs, orderBy, doc, getDoc, updateDoc, setDoc, handleFirestoreError, OperationType } from '../firebase';

interface AdminDashboardProps {
  onImpersonate: (user: User) => void;
  isEnglish: boolean;
  defaultView?: 'stats' | 'users' | 'history' | 'settings' | 'suggestions';
  onEditLanding?: () => void;
}

interface AppSettings {
  auto_activate: boolean;
  default_clicks: number;
  gemini_api_key?: string;
}

export default function AdminDashboard({ onImpersonate, isEnglish, defaultView = 'stats', onEditLanding }: AdminDashboardProps) {
  const [view, setView] = useState(defaultView);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalScripts: 0, activeToday: 0, totalSuggestions: 0, totalVisitors: 0, ctaClicks: 0 });
  const [allScripts, setAllScripts] = useState<ScriptHistory[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ auto_activate: true, default_clicks: 10, gemini_api_key: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingUserData, setEditingUserData] = useState<Partial<User>>({});
  const [subscriptionData, setSubscriptionData] = useState({
    credits: 250,
    duration: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    initial_limit: 250,
    subscription_status: 'normal' as 'normal' | 'premium'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptHistory | null>(null);

  const t = isEnglish ? translations.en : translations.ar;

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'stats') {
        const usersSnap = await getDocs(collection(db, 'users'));
        const scriptsSnap = await getDocs(collection(db, 'scripts'));
        const suggestionsSnap = await getDocs(collection(db, 'suggestions'));
        
        let activeToday = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.last_login && new Date(data.last_login) >= today) {
            activeToday++;
          }
        });

        setStats({
          totalUsers: usersSnap.size,
          totalScripts: scriptsSnap.size,
          activeToday: activeToday,
          totalSuggestions: suggestionsSnap.size,
          totalVisitors: 0, // Placeholder
          ctaClicks: 0 // Placeholder
        });
      } else if (view === 'users') {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as User[];
        setUsers(usersData);
      } else if (view === 'history') {
        const q = query(collection(db, 'scripts'), orderBy('created_at', 'desc'));
        const scriptsSnap = await getDocs(q);
        const scriptsData = scriptsSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
            inputs: typeof data.inputs === 'string' ? JSON.parse(data.inputs) : data.inputs,
          };
        }) as ScriptHistory[];
        setAllScripts(scriptsData);
      } else if (view === 'settings') {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            auto_activate: data.auto_activate === true,
            default_clicks: data.default_clicks || 0,
            gemini_api_key: data.gemini_api_key || ''
          });
        } else {
          setSettings({ auto_activate: true, default_clicks: 10, gemini_api_key: '' });
        }
      } else if (view === 'suggestions') {
        const q = query(collection(db, 'suggestions'), orderBy('created_at', 'desc'));
        const suggestionsSnap = await getDocs(q);
        const suggestionsData = suggestionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as Suggestion[];
        setSuggestions(suggestionsData);
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, view);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), editingUserData);
      fetchData();
      setSelectedUser(null);
      setIsEditingUser(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.id}`);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;
    try {
      const updates: Partial<User> = {
        usage_limit: subscriptionData.credits,
        subscription_status: (subscriptionData as any).subscription_status || 'normal',
      };
      
      if (subscriptionData.duration === 'weekly') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        updates.expires_at = expires.toISOString();
      } else if (subscriptionData.duration === 'monthly') {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        updates.expires_at = expires.toISOString();
      } else if (subscriptionData.duration === 'yearly') {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        updates.expires_at = expires.toISOString();
      }

      await updateDoc(doc(db, 'users', selectedUser.id), updates);
      fetchData();
      setIsSubscriptionModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.id}`);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'app_settings'), {
        auto_activate: settings.auto_activate,
        default_clicks: settings.default_clicks
      }, { merge: true });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/app_settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadFile = (base64: string, filename: string) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScripts = allScripts.filter(s => 
    s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !users.length && !allScripts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,102,255,0.3)]"></div>
        <p className="text-dim font-black uppercase tracking-widest text-sm animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-white uppercase">{t.adminPanel}</h2>
          <p className="text-dim font-bold tracking-wide">{t.manageSystem}</p>
        </div>
        <div className="flex bg-white/5 p-2 rounded-[2rem] border border-white/5 overflow-x-auto max-w-full no-scrollbar">
          {[
            { id: 'stats', label: t.stats, icon: BarChart3 },
            { id: 'users', label: t.users, icon: Users },
            { id: 'history', label: t.history, icon: History },
            { id: 'suggestions', label: t.suggestions, icon: MessageCircle },
            { id: 'site_editor', label: isEnglish ? 'Web Edit' : 'تعديل الويب', icon: LayoutTemplate },
            { id: 'settings', label: t.settings, icon: SettingsIcon }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === item.id ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]' : 'text-dim hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Site Editor View */}
      {view === 'site_editor' && (
        <SiteEditor isEnglish={isEnglish} onEditLanding={onEditLanding} />
      )}

      {/* Stats View */}
      {view === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <StatCard icon={Users} label={t.totalUsers} value={stats.totalUsers} color="brand-primary" />
          <StatCard icon={History} label={t.totalScripts} value={stats.totalScripts} color="brand-secondary" />
          <StatCard icon={Activity} label={t.activeToday} value={stats.activeToday} color="emerald" />
          <StatCard icon={MessageCircle} label={t.totalSuggestions} value={stats.totalSuggestions} color="amber" />
          <StatCard icon={Eye} label={isEnglish ? 'Total Visitors' : 'إجمالي الزوار'} value={stats.totalVisitors} color="sky" />
          <StatCard icon={Zap} label={isEnglish ? 'CTA Clicks' : 'نقرات CTA'} value={stats.ctaClicks} color="rose" />
        </div>
      )}

      {/* Settings View */}
      {view === 'settings' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[3rem] border border-white/5 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
          <div className="p-10 border-b border-white/5 flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
              <SettingsIcon className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.systemSettings}</h3>
          </div>
          <div className="p-10 space-y-10 relative z-10">
            <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-brand-primary/30 transition-all duration-500">
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">{t.autoActivate}</h4>
                <p className="text-dim font-medium leading-relaxed">{t.autoActivateDesc}</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, auto_activate: !settings.auto_activate })}
                className={`w-16 h-9 rounded-full transition-all relative shrink-0 ${settings.auto_activate ? 'bg-brand-primary shadow-[0_0_20px_rgba(0,102,255,0.3)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isEnglish ? (settings.auto_activate ? 'right-1.5' : 'left-1.5') : (settings.auto_activate ? 'left-1.5' : 'right-1.5')}`}></div>
              </button>
            </div>

            {settings.auto_activate && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5"
              >
                <h4 className="text-xs font-black text-dim uppercase tracking-widest mb-6">{t.usageLimit}</h4>
                <div className="flex items-center gap-6">
                  <input 
                    type="number" 
                    value={settings.default_clicks || 0}
                    onChange={(e) => setSettings({ ...settings, default_clicks: parseInt(e.target.value) || 0 })}
                    className="w-40 input-field text-center font-black text-2xl"
                  />
                  <span className="text-dim font-bold tracking-wide">{t.clicksPerPeriod}</span>
                </div>
              </motion.div>
            )}

            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">{isEnglish ? 'Gemini API Key' : 'مفتاح Gemini API'}</h4>
                <p className="text-dim font-medium leading-relaxed">{isEnglish ? 'Update the API key used for generating scripts. Leave empty to use the default key.' : 'قم بتحديث مفتاح API المستخدم لتوليد الاسكربتات. اتركه فارغاً لاستخدام المفتاح الافتراضي.'}</p>
                <input 
                  type="password" 
                  value={settings.gemini_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  placeholder={isEnglish ? 'Enter new Gemini API Key' : 'أدخل مفتاح Gemini API الجديد'}
                  className="w-full input-field py-4 text-lg font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="btn-nover px-12 py-4 text-lg flex items-center gap-3"
              >
                {isSavingSettings ? <Clock className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                {t.saveSettings}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users View */}
      {view === 'users' && (
        <div className="space-y-8">
          <div className="relative group">
            <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              placeholder={t.searchUsers}
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isEnglish ? 'pl-16 pr-6' : 'pr-16 pl-6'} py-6 input-field text-lg`}
            />
          </div>

          <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right" dir={isEnglish ? 'ltr' : 'rtl'}>
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black text-dim uppercase tracking-[0.2em]">{t.user}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-dim uppercase tracking-[0.2em]">{t.status}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-dim uppercase tracking-[0.2em]">{t.usage}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-dim uppercase tracking-[0.2em]">{t.expiryDate}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-dim uppercase tracking-[0.2em]">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`hover:bg-white/5 transition-all duration-300 group ${u.subscription_status === 'premium' ? 'bg-amber-500/5 border-l-4 border-l-amber-500 shadow-[inset_4px_0_15px_rgba(245,158,11,0.1)]' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform ${u.subscription_status === 'premium' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'}`}>
                            {u.profile_pic ? (
                              <img src={u.profile_pic} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex flex-col items-start">
                            <p className={`font-black text-lg tracking-tight flex items-center gap-2 ${u.subscription_status === 'premium' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-white'}`}>
                              {u.name}
                              {u.subscription_status === 'premium' && (
                                <span className="text-[9px] bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase tracking-widest font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">Premium</span>
                              )}
                            </p>
                            <p className="text-xs text-dim font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          u.status === 'frozen' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {u.status === 'active' ? t.active : u.status === 'frozen' ? t.frozen : t.pending}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-white">{u.usage_limit} <span className="text-[10px] text-dim uppercase tracking-widest">{t.clicks}</span></span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-dim font-black uppercase tracking-widest">
                          {u.expires_at ? new Date(u.expires_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG') : t.never}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setSelectedUser(u); setEditingUserData(u); setIsEditingUser(true); }}
                            className="p-3 bg-white/5 text-dim hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all border border-white/5 hover:border-brand-primary/20"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(u); setSubscriptionData({ credits: u.usage_limit, duration: 'monthly', initial_limit: u.initial_limit || 250 }); setIsSubscriptionModalOpen(true); }}
                            className="p-3 bg-white/5 text-dim hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all border border-white/5 hover:border-amber-500/20"
                            title={t.subscription}
                          >
                            <Zap className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => onImpersonate(u)}
                            className="p-3 bg-white/5 text-dim hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-white/5 hover:border-emerald-500/20"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All History View */}
      {view === 'history' && (
        <div className="space-y-8">
          <div className="relative group">
            <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              placeholder={t.searchScripts}
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isEnglish ? 'pl-16 pr-6' : 'pr-16 pl-6'} py-6 input-field text-lg`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredScripts.map((script) => (
              <motion.div 
                key={script.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedScript(script)}
                className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-brand-primary/30 transition-all duration-500 group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[40px] pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:scale-110 transition-transform">
                      <History className="w-7 h-7" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xl font-black text-white group-hover:text-brand-primary transition-colors tracking-tight uppercase">{script.title}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-black text-brand-primary uppercase tracking-widest">{script.user_name}</span>
                        <span className="text-xs text-dim font-bold">{script.user_email}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span className="text-xs text-dim font-bold">{new Date(script.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadData(script.inputs, `inputs-${script.id}.json`); }}
                      className="p-3 bg-white/5 text-dim hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all border border-white/5 hover:border-brand-primary/20"
                      title={t.download}
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    {script.is_saved && (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions View */}
      {view === 'suggestions' && (
        <div className="grid grid-cols-1 gap-8">
          {suggestions.map((s) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[60px] pointer-events-none" />
              <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">{s.user_name}</h4>
                      <p className="text-xs text-dim font-bold">{s.user_email} • {s.user_phone}</p>
                    </div>
                  </div>
                  <p className="text-dim leading-relaxed text-lg bg-white/5 p-8 rounded-[2rem] border border-white/5">{s.content}</p>
                  
                  {s.files && s.files.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.files}</p>
                      <div className="flex flex-wrap gap-4">
                        {s.files.map((file: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group/file">
                            <FileText className="w-5 h-5 text-dim group-hover/file:text-brand-primary transition-colors" />
                            <button 
                              onClick={() => downloadFile(file, `file-${s.id}-${idx}`)}
                              className="text-xs font-black text-dim hover:text-brand-primary uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                              {t.download}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-dim font-black uppercase tracking-widest opacity-50">{new Date(s.created_at).toLocaleString(isEnglish ? 'en-US' : 'ar-EG')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* User Edit Modal */}
      <AnimatePresence>
        {isEditingUser && selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingUser(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative glass-card w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.editUser}</h3>
                <button onClick={() => setIsEditingUser(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-dim hover:text-white">
                  <X className="w-7 h-7" />
                </button>
              </div>
              
              <div className="p-10 space-y-10 max-h-[75vh] overflow-y-auto no-scrollbar">
                {/* User Info */}
                <div className="flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[40px] pointer-events-none" />
                  <div className="w-20 h-20 rounded-[1.5rem] bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 overflow-hidden relative z-10">
                    {selectedUser.profile_pic ? (
                      <img src={selectedUser.profile_pic} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10" />
                    )}
                  </div>
                  <div className="text-right relative z-10 flex-1">
                    <h4 className="text-2xl font-black text-white tracking-tight">{selectedUser.name}</h4>
                    <p className="text-dim font-bold">{selectedUser.email}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-3 justify-end">
                        <span className="text-sm font-mono text-dim font-bold bg-white/5 px-3 py-1 rounded-lg">{selectedUser.phone}</span>
                        <Phone className="w-4 h-4 text-dim" />
                      </div>
                      <div className="flex items-center gap-3 justify-end">
                        <span className="text-sm font-mono text-dim font-bold bg-white/5 px-3 py-1 rounded-lg">{selectedUser.username}</span>
                        <UserIcon className="w-4 h-4 text-dim" />
                      </div>
                      <div className="flex items-center gap-3 justify-end col-span-full">
                        <span className="text-sm font-mono text-dim font-bold bg-white/5 px-3 py-1 rounded-lg break-all">
                          {selectedUser.plain_password || (isEnglish ? 'Encrypted (Not Available)' : 'مشفر (غير متاح)')}
                        </span>
                        <Lock className="w-4 h-4 text-dim" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {selectedUser.social_links && (
                  <div className="space-y-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                    <h4 className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Social Media Accounts' : 'حسابات التواصل الاجتماعي'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(JSON.parse(selectedUser.social_links || '{}')).map(([platform, link]: [string, any]) => (
                        <div key={platform} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group/social">
                          <span className="text-sm font-black text-white uppercase tracking-tight">{platform}</span>
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-2"
                          >
                            {isEnglish ? 'Visit' : 'زيارة'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Status */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{t.status}</label>
                    <select 
                      value={editingUserData.status || ''}
                      onChange={(e) => setEditingUserData({ ...editingUserData, status: e.target.value as any })}
                      className="w-full input-field font-black uppercase tracking-widest text-sm"
                    >
                      <option value="pending">{t.pending}</option>
                      <option value="active">{t.active}</option>
                      <option value="frozen">{t.frozen}</option>
                      <option value="suspended">{t.suspended}</option>
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{t.expiryDate}</label>
                    <input 
                      type="date" 
                      value={editingUserData.expires_at ? new Date(editingUserData.expires_at).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingUserData({ ...editingUserData, expires_at: e.target.value })}
                      className="w-full input-field font-black uppercase tracking-widest text-sm"
                    />
                  </div>

                  {/* Usage Limit */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{t.usageLimit}</label>
                    <input 
                      type="number" 
                      value={editingUserData.usage_limit || 0}
                      onChange={(e) => setEditingUserData({ ...editingUserData, usage_limit: parseInt(e.target.value) || 0 })}
                      className="w-full input-field font-black uppercase tracking-widest text-sm"
                    />
                  </div>

                  {/* Subscription Status */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Subscription Status' : 'حالة الاشتراك'}</label>
                    <select 
                      value={editingUserData.subscription_status || 'normal'}
                      onChange={(e) => setEditingUserData({ ...editingUserData, subscription_status: e.target.value as any })}
                      className="w-full input-field font-black uppercase tracking-widest text-sm"
                    >
                      <option value="normal">{isEnglish ? 'Normal User' : 'مستخدم عادي'}</option>
                      <option value="premium">{isEnglish ? 'Premium User' : 'مستخدم بريميوم'}</option>
                    </select>
                  </div>

                  {/* Role */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest px-2">{t.user}</label>
                    <select 
                      value={editingUserData.role || ''}
                      onChange={(e) => setEditingUserData({ ...editingUserData, role: e.target.value as any })}
                      className="w-full input-field font-black uppercase tracking-widest text-sm"
                    >
                      <option value="user">{t.user}</option>
                      <option value="manager">{t.manager}</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditingUser(false)}
                  className="px-8 py-3 text-sm font-black uppercase tracking-widest text-dim hover:text-white transition-colors"
                >
                  {t.close}
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="btn-nover px-10 py-3 text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Script Detail Modal */}
      <AnimatePresence>
        {selectedScript && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScript(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative glass-card w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedScript.title}</h3>
                  <p className="text-xs text-dim font-bold">{selectedScript.user_name} • {selectedScript.user_email}</p>
                </div>
                <button onClick={() => setSelectedScript(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-dim hover:text-white">
                  <X className="w-7 h-7" />
                </button>
              </div>
              
              <div className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.inputs}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {Object.entries(selectedScript.inputs || {}).map(([key, val]: [string, any]) => (
                      <div key={key} className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                        <span className="text-[10px] text-dim font-black uppercase tracking-widest block opacity-50 mb-1">{key}</span>
                        <span className="text-sm font-bold text-white block">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.generate}</p>
                  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-dim leading-relaxed">{typeof selectedScript.content === 'string' ? selectedScript.content : JSON.stringify(selectedScript.content, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {isSubscriptionModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative glass-card w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                      <Zap className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t.subscription}</h3>
                      <p className="text-xs text-dim font-bold">{selectedUser.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsSubscriptionModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-dim hover:text-white">
                    <X className="w-7 h-7" />
                  </button>
                </div>
                
                <div className="p-10 space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{t.usageLimit}</label>
                    <input 
                      type="number" 
                      value={subscriptionData.credits || 0}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, credits: parseInt(e.target.value) || 0 })}
                      className="w-full input-field text-2xl font-black"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{isEnglish ? 'Subscription Status' : 'حالة الاشتراك'}</label>
                    <select 
                      value={subscriptionData.subscription_status || 'normal'}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, subscription_status: e.target.value as any })}
                      className="w-full input-field text-xl font-black"
                    >
                      <option value="normal">{isEnglish ? 'Normal User' : 'مستخدم عادي'}</option>
                      <option value="premium">{isEnglish ? 'Premium User' : 'مستخدم بريميوم'}</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-dim uppercase tracking-widest px-2">{t.usagePeriod}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['weekly', 'monthly', 'yearly'].map((p) => (
                        <button 
                          key={p}
                          onClick={() => setSubscriptionData({ ...subscriptionData, duration: p as any })}
                          className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${subscriptionData.duration === p ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-dim border-white/5 hover:border-white/20'}`}
                        >
                          {t[p as keyof typeof t] || p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleUpdateSubscription}
                      className="btn-nover w-full py-5 text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 border-none shadow-lg shadow-amber-500/20"
                    >
                      <Save className="w-6 h-6" />
                      {t.save}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-brand-primary/30 transition-all duration-500 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 blur-[40px] group-hover:bg-${color}/10 transition-colors`} />
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-${color}/10 border border-${color}/20 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-8 h-8 text-${color}`} />
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-black text-white tracking-tight">{(value || 0).toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
