import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Camera, Share2, Save, CheckCircle, XCircle, Shield, Globe, MessageCircle } from 'lucide-react';
import { User } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  user: User;
  onUpdate: () => void;
  isEnglish: boolean;
}

export default function Profile({ user, onUpdate, isEnglish }: ProfileProps) {
  const t = isEnglish ? translations.en : translations.ar;
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [profilePic, setProfilePic] = useState(user.profile_pic || '');
  const [socialLinks, setSocialLinks] = useState<any>(user.social_links ? (typeof user.social_links === 'string' ? JSON.parse(user.social_links) : user.social_links) : { facebook: '', instagram: '', twitter: '', tiktok: '' });
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.status === 'frozen') {
      setMessage({ type: 'error', text: t.accountFrozenMsg });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_pic: profilePic, social_links: socialLinks }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t.saveSuccess });
        onUpdate();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t.error });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.status === 'frozen') {
      setMessage({ type: 'error', text: t.accountFrozenMsg });
      return;
    }
    if (!newPassword) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t.saveSuccess });
        setNewPassword('');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t.error });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-8 glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
        <div className="relative group">
          <label 
            htmlFor="profile-upload"
            className={`w-32 h-32 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 overflow-hidden shadow-[0_0_30px_rgba(0,102,255,0.1)] group-hover:scale-105 transition-transform duration-500 cursor-pointer ${user.status === 'frozen' ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12" />
            )}
            <input 
              type="file" 
              id="profile-upload" 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*"
              disabled={user.status === 'frozen'}
            />
          </label>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center border-4 border-deep shadow-lg pointer-events-none">
            <Camera className="w-5 h-5" />
          </div>
        </div>
        <div className="text-center md:text-right space-y-2 relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight uppercase">{user.name}</h2>
          <div className="flex items-center justify-center md:justify-end gap-3">
            <span className="text-dim font-bold tracking-wide">@{user.username}</span>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              user.status === 'frozen' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {user.status === 'active' ? t.active : user.status === 'frozen' ? t.frozen : t.pending}
            </span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-6 rounded-[2rem] flex items-center gap-4 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]'}`}
          >
            {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <p className="font-black uppercase tracking-widest text-sm">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Profile Info */}
        <motion.div 
          initial={{ opacity: 0, x: isEnglish ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-10 space-y-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 blur-[60px] pointer-events-none" />
          <h3 className="text-xl font-black flex items-center gap-4 text-white uppercase tracking-tight relative z-10">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
              <UserIcon className="w-5 h-5 text-brand-primary" />
            </div>
            {t.profile}
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.socialLinks}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.keys(socialLinks).map((platform) => (
                  <div key={platform} className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-dim/50 tracking-widest px-2">{platform}</label>
                    <input
                      type="text"
                      className="input-field py-3 text-sm"
                      value={socialLinks[platform] || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                      placeholder={`${platform}.com/...`}
                      disabled={user.status === 'frozen'}
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || user.status === 'frozen'}
              className="btn-nover w-full py-5 text-lg flex items-center justify-center gap-3"
            >
              <Save className="w-5 h-5" />
              {t.save}
            </button>
          </form>
        </motion.div>

        {/* Security */}
        <motion.div 
          initial={{ opacity: 0, x: isEnglish ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-10 space-y-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-[60px] pointer-events-none" />
          <h3 className="text-xl font-black flex items-center gap-4 text-white uppercase tracking-tight relative z-10">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
              <Lock className="w-5 h-5 text-rose-500" />
            </div>
            {t.changePassword}
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] px-2">{t.password}</label>
              <input
                type="password"
                className="input-field"
                value={newPassword || ''}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={user.status === 'frozen'}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || user.status === 'frozen'}
              className="btn-nover w-full py-5 text-lg flex items-center justify-center gap-3 bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
            >
              <Lock className="w-5 h-5" />
              {t.changePassword}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
