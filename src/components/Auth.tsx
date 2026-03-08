import React, { useState } from 'react';
import { User, Lock, Mail, Phone, UserPlus, LogIn, AlertCircle, Wand2, ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';

interface AuthProps {
  onLogin: (user: any) => void;
  isEnglish: boolean;
  setIsEnglish: (val: boolean) => void;
}

export default function Auth({ onLogin, isEnglish, setIsEnglish }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  });

  const t = isEnglish ? translations.en : translations.ar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { identifier: formData.email || formData.username || formData.phone, password: formData.password }
      : formData;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEnglish ? 'Something went wrong' : 'حدث خطأ ما'));

      if (isLogin) {
        onLogin(data.user);
      } else {
        setIsLogin(true);
        alert(isEnglish ? 'Account created successfully. Please login.' : 'تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-6 relative overflow-hidden" dir={isEnglish ? 'ltr' : 'rtl'}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="glow-orb top-[-10%] left-[-10%] opacity-20" />
      <div className="glow-orb bottom-[-10%] right-[-10%] bg-brand-secondary/10 opacity-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-10 md:p-12 w-full max-w-lg rounded-[3rem] relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,102,255,0.4)] border border-white/10">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-white">VIRAL AI</h1>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">
            {isLogin ? (isEnglish ? 'Welcome Back' : 'تسجيل الدخول') : (isEnglish ? 'Join the Elite' : 'إنشاء حساب جديد')}
          </h2>
          <p className="text-dim font-medium">
            {isLogin 
              ? (isEnglish ? 'Enter your credentials to access your studio.' : 'مرحباً بك مجدداً في Viral Script AI') 
              : (isEnglish ? 'Start creating viral content with narrative intelligence.' : 'انضم إلينا وابدأ في إنشاء اسكربتات احترافية')}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Full Name' : 'الاسم أو اللقب'}</label>
                  <div className="relative">
                    <User className={`absolute ${isEnglish ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-dim`} />
                    <input
                      type="text"
                      required
                      className={`input-field ${isEnglish ? 'pl-12' : 'pr-12'}`}
                      placeholder={isEnglish ? "John Doe" : "أدخل اسمك"}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Username' : 'اسم المستخدم'}</label>
                  <div className="relative">
                    <UserPlus className={`absolute ${isEnglish ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-dim`} />
                    <input
                      type="text"
                      required
                      className={`input-field ${isEnglish ? 'pl-12' : 'pr-12'}`}
                      placeholder={isEnglish ? "johndoe123" : "أدخل اسم المستخدم"}
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-black text-dim uppercase tracking-widest px-1">
              {isLogin 
                ? (isEnglish ? 'Identifier' : 'البريد الإلكتروني أو اسم المستخدم أو الهاتف') 
                : (isEnglish ? 'Email Address' : 'البريد الإلكتروني')}
            </label>
            <div className="relative">
              <Mail className={`absolute ${isEnglish ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-dim`} />
              <input
                type="text"
                required
                className={`input-field ${isEnglish ? 'pl-12' : 'pr-12'}`}
                placeholder={isLogin ? (isEnglish ? "Email, username or phone" : "أدخل بياناتك") : "example@mail.com"}
                value={isLogin ? (formData.email || formData.username || formData.phone || '') : (formData.email || '')}
                onChange={(e) => {
                  if (isLogin) {
                    setFormData({ ...formData, email: e.target.value, username: e.target.value, phone: e.target.value });
                  } else {
                    setFormData({ ...formData, email: e.target.value });
                  }
                }}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Phone Number' : 'رقم الهاتف'}</label>
              <div className="relative">
                <Phone className={`absolute ${isEnglish ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-dim`} />
                <input
                  type="tel"
                  required
                  className={`input-field ${isEnglish ? 'pl-12' : 'pr-12'}`}
                  placeholder="+201234567890"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Password' : 'كلمة المرور'}</label>
            <div className="relative">
              <Lock className={`absolute ${isEnglish ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-dim`} />
              <input
                type="password"
                required
                className={`input-field ${isEnglish ? 'pl-12' : 'pr-12'}`}
                placeholder="••••••••"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-nover w-full py-4 mt-4 group"
          >
            {loading ? (isEnglish ? 'Processing...' : 'جاري التحميل...') : (
              <div className="flex items-center justify-center gap-3">
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLogin ? (isEnglish ? 'Sign In' : 'تسجيل الدخول') : (isEnglish ? 'Create Account' : 'إنشاء حساب')}
                {isEnglish ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
              </div>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-primary font-black text-sm uppercase tracking-widest hover:text-white transition-colors"
          >
            {isLogin 
              ? (isEnglish ? "Don't have an account? Join now" : 'ليس لديك حساب؟ سجل الآن') 
              : (isEnglish ? 'Already have an account? Sign in' : 'لديك حساب بالفعل؟ سجل دخولك')}
          </button>
        </div>

        {!isLogin && (
          <div className="mt-10 p-5 bg-white/5 rounded-[2rem] border border-white/5">
            <p className="text-[10px] text-dim text-center leading-relaxed font-bold uppercase tracking-widest">
              {isEnglish 
                ? 'Please remember your credentials carefully. Account recovery is a manual process for security.' 
                : 'يرجى تذكر هذه المعلومات جيداً لأنه إذا نسيت اسم المستخدم أو كلمة المرور لن تستعيدها بسهولة'}
            </p>
          </div>
        )}
      </motion.div>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/201022049346" 
        target="_blank" 
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-transform group"
      >
        <MessageCircle className="w-8 h-8 text-white" />
        <span className="absolute right-20 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isEnglish ? 'WhatsApp Support' : 'الدعم الفني واتساب'}
        </span>
      </a>
    </div>
  );
}
