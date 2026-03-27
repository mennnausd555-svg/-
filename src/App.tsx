/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Wand2, CheckCircle, History, Shield, LogOut, Moon, Sun, Languages, MessageCircle, Send, Menu, X, Star, User as UserIcon, Settings, Globe, CreditCard, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormatSection from './components/FormatSection';
import FreeCreationSection from './components/FreeCreationSection';
import EvaluationSection from './components/EvaluationSection';
import ScriptHistoryView from './components/ScriptHistory';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import Suggestions from './components/Suggestions';
import Subscription from './components/Subscription';
import SavedScripts from './components/SavedScripts';
import FilmedScripts from './components/FilmedScripts';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import WhatsAppWidget from './components/WhatsAppWidget';
import { User, SiteConfig } from './types';
import { translations } from './translations';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, onSnapshot, updateDoc } from './firebase';

const DEFAULT_CONFIG: SiteConfig = {
  logo: { type: 'image', value: '/logo.png' },
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'formats' | 'free' | 'evaluate' | 'history' | 'admin' | 'saved' | 'suggestions' | 'profile' | 'subscription' | 'filmed' | 'all_filmed' | 'all_history' | 'all_saved' | 'all_suggestions'>('free');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [isVisualEditing, setIsVisualEditing] = useState(false);

  const t = isEnglish ? translations.en : translations.ar;

  useEffect(() => {
    fetchSiteConfig();
    
    const checkDailyCoins = async (userData: User) => {
      if (!userData.daily_coin_allocation) return userData;
      
      const today = new Date().toISOString().split('T')[0];
      if (userData.last_reset_date !== today) {
        const updatedUser = {
          ...userData,
          usage_limit: userData.usage_limit + userData.daily_coin_allocation,
          last_reset_date: today
        };
        try {
          await updateDoc(doc(db, 'users', userData.id), {
            usage_limit: updatedUser.usage_limit,
            last_reset_date: today
          });
          return updatedUser;
        } catch (e) {
          console.error("Failed to update daily coins", e);
        }
      }
      return userData;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          let userData = userDoc.data() as User;
          userData.id = firebaseUser.uid;
          userData = await checkDailyCoins(userData);
          setUser(userData);
          if (userData.role === 'manager' || userData.role === 'admin' || userData.email === 'abqareno@gmail.com') setActiveTab('admin');
        } else {
          setUser(null);
        }
      } else {
        // Check localStorage for local session
        const localUserId = localStorage.getItem('viral_ai_user_id');
        if (localUserId) {
          const userDoc = await getDoc(doc(db, 'users', localUserId));
          if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            userData.id = localUserId;
            userData = await checkDailyCoins(userData);
            setUser(userData);
            if (userData.role === 'manager' || userData.role === 'admin' || userData.email === 'abqareno@gmail.com') setActiveTab('admin');
          } else {
            localStorage.removeItem('viral_ai_user_id');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.id), (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as User;
          userData.id = doc.id;
          setUser(userData);
        }
      });
      return () => unsubscribe();
    }
  }, [user?.id]);

  const fetchSiteConfig = async () => {
    try {
      const docRef = doc(db, 'settings', 'site_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newConfig = { ...DEFAULT_CONFIG, ...JSON.parse(data.value || '{}') };
        setSiteConfig(newConfig);
        applyColors(newConfig.colors);
      }
    } catch (err) {
      console.error('Failed to load site config', err);
    }
  };

  const applyColors = (colors: any) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, val]) => {
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
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('viral_ai_user_id');
    setUser(null);
    setImpersonatedUser(null);
    setActiveTab('formats');
  };

  const handleImpersonate = (targetUser: User) => {
    setImpersonatedUser(targetUser);
    setActiveTab('formats');
    setIsMobileMenuOpen(false);
  };

  const stopImpersonating = () => {
    setImpersonatedUser(null);
    setActiveTab('admin');
    setIsMobileMenuOpen(false);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-72 h-72 md:w-96 md:h-96 flex flex-col items-center justify-center"
      >
        <img
          src="/logo-video.mp4 (1).gif"
          alt="Loading..."
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );

  if (!user) {
    if (showAuth) {
      return <Auth onLogin={(u) => { setUser(u); if (u.role === 'manager' || u.role === 'admin' || u.email === 'abqareno@gmail.com') setActiveTab('admin'); }} isEnglish={isEnglish} setIsEnglish={setIsEnglish} config={siteConfig} />;
    }
    return <LandingPage onStart={() => setShowAuth(true)} isEnglish={isEnglish} setIsEnglish={setIsEnglish} config={siteConfig} />;
  }

  if (isVisualEditing && (user.role === 'admin' || user.role === 'manager' || user.email === 'abqareno@gmail.com')) {
    return (
      <div className="relative min-h-screen">
        <LandingPage onStart={() => {}} isEnglish={isEnglish} setIsEnglish={setIsEnglish} config={siteConfig} editMode={true} />
        <div className="fixed bottom-6 right-6 z-[100] flex gap-4">
          <button 
            onClick={() => setIsVisualEditing(false)}
            className="px-6 py-3 bg-rose-500 text-white rounded-full font-bold shadow-lg hover:bg-rose-600 transition-colors"
          >
            {isEnglish ? 'Close Editor' : 'إغلاق المحرر'}
          </button>
        </div>
      </div>
    );
  }

  const currentUser = impersonatedUser || user;

  if ((currentUser.status === 'pending' || currentUser.status === 'suspended') && currentUser.email !== 'abqareno@gmail.com') {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center p-4" dir={isEnglish ? 'ltr' : 'rtl'}>
        <div className="glass-surface p-10 rounded-[2.5rem] border border-white/10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
          <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-8 shadow-[0_0_30px_rgba(0,102,255,0.2)]">
            <Shield className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">{currentUser.status === 'pending' ? t.pending : t.suspended}</h2>
          <p className="text-dim mb-10 leading-relaxed font-medium">
            {currentUser.status === 'pending' ? t.accountPendingMsg : (isEnglish ? 'Sorry, your account is currently suspended. Please contact support.' : 'عذراً، حسابك حالياً معلق. يرجى التواصل مع الإدارة لتفعيل الحساب.')}
          </p>
          <div className="space-y-4">
            <a 
              href="https://wa.me/201022049346" 
              target="_blank" 
              className="w-full py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp Support
            </a>
            <a 
              href="https://t.me/ABQARENOPRO" 
              target="_blank" 
              className="w-full py-4 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl font-bold hover:bg-sky-500/20 transition-all flex items-center justify-center gap-3"
            >
              <Send className="w-6 h-6" />
              Telegram Support
            </a>
          </div>
          <button onClick={handleLogout} className="mt-10 text-dim hover:text-white text-sm font-bold transition-colors uppercase tracking-widest">{t.logout}</button>
        </div>
      </div>
    );
  }

  const navItems = [
    ...((user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && !impersonatedUser ? [
      { id: 'admin', icon: Shield, label: t.adminPanel },
      { id: 'all_history', icon: History, label: t.allScriptsHistory },
      { id: 'all_saved', icon: Star, label: t.savedScripts },
      { id: 'all_filmed', icon: Video, label: isEnglish ? 'All Filmed Scripts' : 'جميع الاسكربتات المصورة' },
      { id: 'all_suggestions', icon: MessageCircle, label: t.userSuggestions },
    ] : []),
    ...(((user.role !== 'manager' && user.role !== 'admin' && user.email !== 'abqareno@gmail.com') || impersonatedUser) ? [
      { id: 'formats', icon: LayoutTemplate, label: t.formats },
      { id: 'free', icon: Wand2, label: t.freeCreation },
      { id: 'evaluate', icon: CheckCircle, label: t.evaluate },
      { id: 'history', icon: History, label: t.history },
      { id: 'subscription', icon: CreditCard, label: t.subscription },
      { id: 'saved', icon: Star, label: t.savedScripts },
      { id: 'filmed', icon: Video, label: isEnglish ? 'Free Balance' : 'رصيد مجاني' },
      { id: 'suggestions', icon: MessageCircle, label: t.suggestions },
      { id: 'profile', icon: UserIcon, label: t.profile },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-deep text-white font-sans flex flex-col md:flex-row" dir={isEnglish ? 'ltr' : 'rtl'}>
      
      {/* Mobile Header */}
      <header className="md:hidden glass-surface sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          {siteConfig.logo.type === 'image' && siteConfig.logo.value ? (
            <img src={siteConfig.logo.value} alt="Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
          )}
          <h1 className="text-lg font-black tracking-tight">{t.appName}</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-dim hover:bg-white/5 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: isEnglish ? -300 : 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isEnglish ? -300 : 300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={`fixed md:sticky top-0 ${isEnglish ? 'left-0' : 'right-0'} z-40 w-72 h-screen bg-surface border-${isEnglish ? 'r' : 'l'} border-white/5 flex flex-col shadow-2xl md:shadow-none`}
          >
            <div className="p-8 hidden md:flex items-center gap-4">
              {siteConfig.logo.type === 'image' && siteConfig.logo.value ? (
                <img src={siteConfig.logo.value} alt="Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
              )}
              <h1 className="text-xl font-black tracking-tight text-white">{t.appName}</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-1 mt-16 md:mt-0">
              {impersonatedUser && (
                <div className="mb-8 p-5 bg-brand-secondary/10 border border-brand-secondary/30 rounded-2xl">
                  <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">{isEnglish ? 'Browsing as' : 'تتصفح كـ'}</p>
                  <p className="font-bold text-white mb-4 truncate">{impersonatedUser.name}</p>
                  <button onClick={stopImpersonating} className="w-full py-2.5 bg-brand-secondary/20 text-brand-secondary rounded-xl text-xs font-black hover:bg-brand-secondary/30 transition-colors uppercase">
                    {t.stopImpersonating}
                  </button>
                </div>
              )}

              {currentUser.status === 'frozen' && (
                <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <p className="text-xs font-bold text-rose-400 leading-relaxed">{t.accountFrozenMsg}</p>
                </div>
              )}

              {user.role !== 'manager' && user.role !== 'admin' && (
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleTabChange('subscription')}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                      <CreditCard className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-dim uppercase tracking-widest">{isEnglish ? 'Your Balance' : 'رصيدك'}</p>
                      <p className={`text-lg font-black ${currentUser.usage_limit >= 10 ? 'text-white' : 'text-rose-400'}`}>
                        {currentUser.usage_limit}
                      </p>
                    </div>
                  </div>
                  {currentUser.usage_limit < 10 && (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                      {isEnglish ? 'Add Credits' : 'إضافة رصيد'}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="px-4 text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-4 mt-6">{isEnglish ? 'Main Menu' : 'القائمة الرئيسية'}</p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        isActive 
                        ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]' 
                        : 'text-dim hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-dim'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm uppercase tracking-widest">
                <LogOut className="w-5 h-5" />
                {t.logout}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 relative z-10">
          <div className="max-w-6xl mx-auto pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'formats' && <FormatSection isEnglish={isEnglish} user={currentUser} />}
                {activeTab === 'free' && <FreeCreationSection isEnglish={isEnglish} user={currentUser} />}
                {activeTab === 'evaluate' && <EvaluationSection isEnglish={isEnglish} user={currentUser} />}
                {activeTab === 'history' && <ScriptHistoryView isEnglish={isEnglish} user={currentUser} />}
                {activeTab === 'saved' && <SavedScripts user={currentUser} isEnglish={isEnglish} />}
                {activeTab === 'filmed' && <FilmedScripts user={currentUser} isEnglish={isEnglish} />}
                {activeTab === 'suggestions' && <Suggestions user={currentUser} isEnglish={isEnglish} />}
                {activeTab === 'subscription' && <Subscription user={currentUser} isEnglish={isEnglish} />}
                {activeTab === 'profile' && <Profile user={currentUser} onUpdate={() => {}} isEnglish={isEnglish} />}
                
                {/* Admin Tabs */}
                {activeTab === 'admin' && (user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && <AdminDashboard onImpersonate={handleImpersonate} isEnglish={isEnglish} onEditLanding={() => setIsVisualEditing(true)} />}
                {activeTab === 'all_history' && (user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && <AdminDashboard onImpersonate={handleImpersonate} isEnglish={isEnglish} defaultView="history" onEditLanding={() => setIsVisualEditing(true)} />}
                {activeTab === 'all_saved' && (user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && <SavedScripts user={user} isEnglish={isEnglish} isAdmin={true} />}
                {activeTab === 'all_filmed' && (user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && <FilmedScripts user={user} isEnglish={isEnglish} isAdmin={true} />}
                {activeTab === 'all_suggestions' && (user.role === 'manager' || user.role === 'admin' || user.email === 'abqareno@gmail.com') && <Suggestions user={user} isEnglish={isEnglish} isAdmin={true} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* WhatsApp Floating Button */}
      {user && <WhatsAppWidget />}
    </div>
  );
}

