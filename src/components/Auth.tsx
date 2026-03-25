import React, { useState } from 'react';
import { User, Lock, Mail, Phone, UserPlus, LogIn, AlertCircle, Wand2, ArrowRight, ArrowLeft, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { SiteConfig } from '../types';
import { auth, googleProvider, signInWithPopup, db, doc, getDoc, setDoc, query, where, getDocs, collection, addDoc } from '../firebase';

interface AuthProps {
  onLogin: (user: any) => void;
  isEnglish: boolean;
  setIsEnglish: (val: boolean) => void;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function Auth({ onLogin, isEnglish, setIsEnglish, config, onSelectElement }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tempGoogleUser, setTempGoogleUser] = useState<any>(null);
  const [isCompletingGoogle, setIsCompletingGoogle] = useState(false);

  const t = isEnglish ? translations.en : translations.ar;

  const getEditableProps = (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => {
    if (!onSelectElement) return {};
    return {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectElement(path, type, label);
      },
      className: "cursor-pointer hover:outline hover:outline-2 hover:outline-brand-primary hover:outline-offset-4 transition-all"
    };
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!isLogin) {
      if (name.trim().length < 2) {
        setError(isEnglish ? 'Name is too short' : 'الاسم قصير جداً');
        setLoading(false);
        return;
      }
      if (phone.trim().length < 8) {
        setError(isEnglish ? 'Invalid phone number' : 'رقم الهاتف غير صحيح');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Query by email OR phone
        const qEmail = query(collection(db, 'users'), where('email', '==', email));
        const qPhone = query(collection(db, 'users'), where('phone', '==', email));
        const [querySnapshotEmail, querySnapshotPhone] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);
        
        const userDoc = !querySnapshotEmail.empty ? querySnapshotEmail.docs[0] : (!querySnapshotPhone.empty ? querySnapshotPhone.docs[0] : null);
        
        if (userDoc) {
          const data = userDoc.data();
          
          // Check against plain_password or password field
          if (data.plain_password === password || data.password === password || (email === 'abqareno@gmail.com' && password === 'Mena.H@56')) {
            const userData = { id: userDoc.id, ...data };
            localStorage.setItem('viral_ai_user_id', userDoc.id);
            onLogin(userData);
          } else {
            setError(isEnglish ? 'Invalid email/phone or password' : 'البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة');
          }
        } else if (email === 'abqareno@gmail.com' && password === 'Mena.H@56') {
          // Fallback for admin if not in DB yet
          const adminData = {
            name: 'Admin',
            email: 'abqareno@gmail.com',
            phone: '',
            plain_password: password,
            role: 'admin',
            status: 'active',
            usage_limit: 999999,
            initial_limit: 999999,
            usage_period: 'monthly',
            subscription_status: 'premium',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          };
          const docRef = await addDoc(collection(db, 'users'), adminData);
          localStorage.setItem('viral_ai_user_id', docRef.id);
          onLogin({ id: docRef.id, ...adminData });
        } else {
          setError(isEnglish ? 'Invalid email/phone or password' : 'البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة');
        }
      } else {
        // Check if email OR phone already exists
        const qEmail = query(collection(db, 'users'), where('email', '==', email));
        const qPhone = query(collection(db, 'users'), where('phone', '==', email));
        const [querySnapshotEmail, querySnapshotPhone] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);
        
        if (!querySnapshotEmail.empty || !querySnapshotPhone.empty) {
          setError(isEnglish ? 'This email or phone is already registered' : 'هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل');
          setLoading(false);
          return;
        }

        // Fetch app settings for auto-activation
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        const appSettings = settingsDoc.exists() ? settingsDoc.data() : { auto_activate: true, default_clicks: 10 };
        const autoActivate = appSettings.auto_activate !== false; // Default to true if not explicitly false
        const defaultLimit = appSettings.default_clicks || 10;

        const userData = {
          name,
          email: email.includes('@') ? email : '', // If it's a phone number, email is empty
          phone: email.includes('@') ? '' : email, // If it's a phone number, phone is the email input
          plain_password: password,
          role: 'user',
          status: autoActivate ? 'active' : 'pending',
          usage_limit: defaultLimit,
          initial_limit: defaultLimit,
          usage_period: 'daily',
          subscription_status: 'normal',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'users'), userData);
        localStorage.setItem('viral_ai_user_id', docRef.id);
        onLogin({ id: docRef.id, ...userData });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(isEnglish ? 'Authentication failed' : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;

      if (!userDoc.exists()) {
        // Fetch app settings for auto-activation
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        const appSettings = settingsDoc.exists() ? settingsDoc.data() : { auto_activate: true, default_clicks: 10 };
        const autoActivate = appSettings.auto_activate !== false;
        const defaultLimit = appSettings.default_clicks || 10;

        userData = {
          name: user.displayName || 'User',
          email: user.email,
          profile_pic: user.photoURL || '',
          phone: '',
          plain_password: '',
          role: user.email === 'abqareno@gmail.com' ? 'admin' : 'user',
          status: user.email === 'abqareno@gmail.com' ? 'active' : (autoActivate ? 'active' : 'pending'),
          usage_limit: user.email === 'abqareno@gmail.com' ? 999999 : defaultLimit,
          initial_limit: user.email === 'abqareno@gmail.com' ? 999999 : defaultLimit,
          usage_period: 'daily',
          subscription_status: user.email === 'abqareno@gmail.com' ? 'premium' : 'normal',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        await setDoc(userDocRef, userData);
      } else {
        userData = userDoc.data();
      }

      localStorage.removeItem('viral_ai_user_id'); // Clear local ID if using Google
      onLogin({ id: user.uid, ...userData });
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err.message;
      
      if (err.code === 'auth/popup-closed-by-user') {
        message = isEnglish ? 'Login window was closed' : 'تم إغلاق نافذة تسجيل الدخول';
      } else if (err.code === 'auth/cancelled-by-user') {
        message = isEnglish ? 'Login was cancelled' : 'تم إلغاء تسجيل الدخول';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempGoogleUser) return;
    setLoading(true);
    setError('');

    try {
      // Fetch app settings for auto-activation
      const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
      const appSettings = settingsDoc.exists() ? settingsDoc.data() : { auto_activate: true, default_clicks: 10 };
      const autoActivate = appSettings.auto_activate !== false;
      const defaultLimit = appSettings.default_clicks || 10;

      const userData = {
        name: tempGoogleUser.name,
        email: tempGoogleUser.email,
        profile_pic: tempGoogleUser.profile_pic,
        phone: phone,
        plain_password: password,
        role: tempGoogleUser.email === 'abqareno@gmail.com' ? 'admin' : 'user',
        status: tempGoogleUser.email === 'abqareno@gmail.com' ? 'active' : (autoActivate ? 'active' : 'pending'),
        usage_limit: tempGoogleUser.email === 'abqareno@gmail.com' ? 999999 : defaultLimit,
        initial_limit: tempGoogleUser.email === 'abqareno@gmail.com' ? 999999 : defaultLimit,
        usage_period: 'daily',
        subscription_status: tempGoogleUser.email === 'abqareno@gmail.com' ? 'premium' : 'normal',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await setDoc(doc(db, 'users', tempGoogleUser.id), userData);
      onLogin({ id: tempGoogleUser.id, ...userData });
    } catch (err: any) {
      console.error('Complete Google auth error:', err);
      setError(isEnglish ? 'Failed to complete profile' : 'فشل إكمال الملف الشخصي');
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
            {config?.logo?.type === 'image' && config.logo.value ? (
              <img src={config.logo.value} alt="Logo" className="h-16 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,102,255,0.4)] border border-white/10">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <h2 
            {...getEditableProps(isCompletingGoogle ? 'pages.auth.completeProfile.title' : isLogin ? 'pages.auth.login.title' : 'pages.auth.register.title', 'text', isCompletingGoogle ? 'Complete Profile Title' : isLogin ? 'Login Title' : 'Signup Title')}
            className="text-4xl font-black text-white tracking-tight mb-4"
          >
            {isCompletingGoogle 
              ? (config?.pages?.auth?.completeProfile?.title || (isEnglish ? 'Complete Your Profile' : 'أكمل ملفك الشخصي'))
              : isLogin 
                ? (config?.pages?.auth?.login?.title || (isEnglish ? 'Welcome Back' : 'مرحباً بعودتك')) 
                : (config?.pages?.auth?.register?.title || (isEnglish ? 'Create Account' : 'إنشاء حساب جديد'))}
          </h2>
          <p 
            {...getEditableProps(isCompletingGoogle ? 'pages.auth.completeProfile.subtitle' : isLogin ? 'pages.auth.login.subtitle' : 'pages.auth.register.subtitle', 'text', isCompletingGoogle ? 'Complete Profile Subtitle' : isLogin ? 'Login Subtitle' : 'Signup Subtitle')}
            className="text-dim font-medium"
          >
            {isCompletingGoogle
              ? (config?.pages?.auth?.completeProfile?.subtitle || (isEnglish ? 'Set a password and phone number to access your account anytime.' : 'قم بتعيين كلمة مرور ورقم هاتف للوصول إلى حسابك في أي وقت.'))
              : isLogin 
                ? (config?.pages?.auth?.login?.subtitle || (isEnglish ? 'Sign in to access your studio.' : 'سجل دخولك للوصول إلى الاستوديو الخاص بك.')) 
                : (config?.pages?.auth?.register?.subtitle || (isEnglish ? 'Join us to start creating viral content.' : 'انضم إلينا للبدء في صناعة محتوى فايرال.'))}
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

        {isCompletingGoogle ? (
          <form onSubmit={handleCompleteGoogleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Phone Number' : 'رقم الهاتف'}</label>
              <div className="relative group">
                <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`input-field ${isEnglish ? 'pl-16' : 'pr-16'}`}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Password' : 'كلمة المرور'}</label>
              <div className="relative group">
                <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-field ${isEnglish ? 'pl-16' : 'pr-16'}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isEnglish ? 'right-4' : 'left-4'} top-0 bottom-0 flex items-center text-dim hover:text-white`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg group"
            >
              {loading ? (isEnglish ? 'Processing...' : 'جاري التحميل...') : (
                <span className="flex items-center justify-center gap-2">
                  {isEnglish ? 'Complete Registration' : 'إكمال التسجيل'}
                  {isEnglish ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setIsCompletingGoogle(false)}
              className="w-full text-dim hover:text-white text-sm font-bold transition-colors uppercase tracking-widest"
            >
              {isEnglish ? 'Cancel' : 'إلغاء'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Full Name' : 'الاسم الكامل'}</label>
                      <div className="relative group">
                        <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-brand-primary/10 transition-colors">
                            <User className="w-5 h-5" />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`input-field ${isEnglish ? 'pl-20' : 'pr-20'}`}
                          placeholder={isEnglish ? 'John Doe' : 'أحمد محمد'}
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Phone Number' : 'رقم الهاتف'}</label>
                      <div className="relative group">
                        <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-brand-primary/10 transition-colors">
                            <Phone className="w-5 h-5" />
                          </div>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`input-field ${isEnglish ? 'pl-20' : 'pr-20'}`}
                          placeholder="01xxxxxxxxx"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Email or Phone' : 'البريد الإلكتروني أو رقم الهاتف'}</label>
                <div className="relative group">
                  <div className={`absolute ${isEnglish ? 'left-2' : 'right-2'} top-2 bottom-2 w-10 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-brand-primary/10 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`input-field ${isEnglish ? 'pl-16' : 'pr-16'}`}
                    placeholder={isEnglish ? 'name@example.com or 01xxxxxxxxx' : 'البريد الإلكتروني أو 01xxxxxxxxx'}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dim uppercase tracking-widest px-1">{isEnglish ? 'Password' : 'كلمة المرور'}</label>
                <div className="relative group">
                  <div className={`absolute ${isEnglish ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 flex items-center justify-center text-dim group-focus-within:text-brand-primary transition-colors z-10`}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-brand-primary/10 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input-field ${isEnglish ? 'pl-20' : 'pr-20'}`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isEnglish ? 'right-4' : 'left-4'} top-0 bottom-0 flex items-center text-dim hover:text-white`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg group"
              >
                {loading ? (isEnglish ? 'Processing...' : 'جاري التحميل...') : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? (isEnglish ? 'Sign In' : 'تسجيل الدخول') : (isEnglish ? 'Create Account' : 'إنشاء حساب')}
                    {isEnglish ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                  </span>
                )}
              </button>
            </form>

            <div className="mt-10 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative px-6 bg-[#050505] text-[10px] text-dim font-black uppercase tracking-[0.2em]">
                {isEnglish ? 'Or continue with' : 'أو المتابعة باستخدام'}
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
            >
              {loading ? (isEnglish ? 'Processing...' : 'جاري التحميل...') : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isEnglish ? 'Google' : 'جوجل'}
                </>
              )}
            </button>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-dim hover:text-white transition-colors font-medium"
              >
                {isLogin 
                  ? (isEnglish ? "Don't have an account? Sign up" : 'ليس لديك حساب؟ سجل الآن')
                  : (isEnglish ? 'Already have an account? Sign in' : 'لديك حساب بالفعل؟ سجل دخولك')}
              </button>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}
