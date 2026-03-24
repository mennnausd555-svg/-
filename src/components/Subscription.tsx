import React, { useState } from 'react';
import { User, SiteConfig } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, Zap, Shield, HelpCircle, CreditCard, MessageCircle, AlertTriangle } from 'lucide-react';

interface SubscriptionProps {
  user: User;
  isEnglish: boolean;
  config?: SiteConfig;
  onSelectElement?: (path: string, type: 'text' | 'image' | 'video' | 'section', label: string) => void;
}

export default function Subscription({ user, isEnglish, config, onSelectElement }: SubscriptionProps) {
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

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const initialLimit = user.initial_limit || 250;
  const remaining = user.usage_limit;
  const used = Math.max(0, initialLimit - remaining);
  const creditsPercent = Math.min(100, Math.max(0, (used / initialLimit) * 100));
  
  const features = [
    t.featuresList.blueprints,
    t.featuresList.hooks,
    t.featuresList.audit,
    t.featuresList.retention,
    t.featuresList.dialects,
    t.featuresList.vault,
    t.featuresList.support
  ];

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { 
      q: isEnglish ? 'Does each generation produce 8 results from the chosen format?' : 'هل كل توليد ينتج 8 نتائج من الفورمات المختار؟', 
      a: isEnglish ? 'Yes, each generation request provides 8 different script variations based on the selected blueprint.' : 'نعم، كل طلب توليد يوفر لك 8 نسخ مختلفة من الاسكربت بناءً على الفورمات المختار.' 
    }
  ];

  return (
    <div className="space-y-16 pb-20" dir={isEnglish ? 'ltr' : 'rtl'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]">
            <CreditCard className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 
              {...getEditableProps('pages.subscription.title', 'text', 'Subscription Page Title')}
              className="text-4xl font-black text-white tracking-tight mb-3"
            >
              {config?.pages?.subscription?.title || t.subscription}
            </h2>
            <p 
              {...getEditableProps('pages.subscription.subtitle', 'text', 'Subscription Page Subtitle')}
              className="text-dim text-xl max-w-2xl leading-relaxed font-medium"
            >
              {config?.pages?.subscription?.subtitle || (isEnglish 
                ? 'Manage your credits and subscription plan to keep your viral engine running.' 
                : 'إدارة رصيدك وخطة اشتراكك للحفاظ على استمرارية محرك الفايرال الخاص بك.')}
            </p>
          </div>
        </div>
      </div>

      {remaining <= 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center gap-4 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
        >
          <AlertTriangle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="font-black text-xl mb-1">{isEnglish ? 'Out of Credits!' : 'نفد رصيدك!'}</h3>
            <p className="font-medium text-rose-400/80">
              {isEnglish 
                ? 'You have used all your available credits. Please upgrade your plan or purchase more credits to continue generating scripts.' 
                : 'لقد استهلكت جميع الرصيد المتاح لك. يرجى ترقية خطتك أو شراء رصيد إضافي لمواصلة توليد الاسكربتات.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Current Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="space-y-4 flex-1 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {user.usage_limit >= 10 ? (isEnglish ? 'Active Plan' : 'خطة نشطة') : (isEnglish ? 'Plan Expired' : 'انتهت الخطة')}
                </h3>
                <p className="text-dim font-bold mt-1">
                  {t.creditsResetOn} {new Date(user.expires_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">
                  {isEnglish ? 'Used / Total Credits' : 'الرصيد المستخدم / الإجمالي'}
                </p>
                <p className="text-3xl font-black text-white tracking-tight">
                  <span className={remaining <= 0 ? 'text-rose-500' : ''}>{used}</span> / {initialLimit}
                </p>
                <p className="text-[10px] text-dim font-bold uppercase tracking-widest">
                  {isEnglish ? `${remaining} Credits Remaining` : `متبقي ${remaining} رصيد`}
                </p>
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${creditsPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full shadow-[0_0_15px_rgba(0,102,255,0.5)] ${remaining <= 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Card */}
      <div className="max-w-2xl mx-auto">
        <motion.div 
          whileHover={{ y: -10 }}
          className="glass-card p-12 rounded-[3.5rem] border border-brand-primary/30 relative overflow-hidden group shadow-[0_0_50px_rgba(0,102,255,0.1)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[40px]" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/20 blur-[60px] animate-pulse" />
          
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-brand-secondary animate-bounce" />
                <h3 className="text-4xl font-black text-white uppercase tracking-tight">{t.proPlan}</h3>
                <Sparkles className="w-6 h-6 text-brand-secondary animate-bounce" />
              </div>
              <p className="text-dim text-lg font-medium">{isEnglish ? 'For the elite 1% of creators.' : 'للنخبة من صناع المحتوى.'}</p>
            </div>

            <div className="text-center py-6">
              <p className="text-3xl font-black text-white mb-2">{t.contactForPrice}</p>
              <p className="text-dim font-bold">{isEnglish ? 'Contact us to get the best offer' : 'تواصل معنا للحصول على أفضل عرض'}</p>
            </div>

            <a 
              href="https://wa.me/201022049346" 
              target="_blank"
              className="flex items-center justify-center gap-3 w-full py-6 text-xl font-black bg-emerald-500 text-white rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-all border-none"
            >
              <MessageCircle className="w-6 h-6" />
              {isEnglish ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'}
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-white/5">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-white font-bold text-sm">{feature}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-brand-secondary shrink-0" />
                <span className="text-brand-secondary font-black text-sm uppercase tracking-widest">
                  {isEnglish ? 'Unlimited Potential' : 'إمكانيات غير محدودة'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-dim">
            <HelpCircle className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.faq.title}</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">{t.faq.title}</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i}
              className="glass-card rounded-[2rem] border border-white/5 overflow-hidden transition-all duration-300"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-8 flex items-center justify-between text-left gap-6 hover:bg-white/5 transition-colors"
                dir={isEnglish ? 'ltr' : 'rtl'}
              >
                <span className={`text-lg font-bold ${openFaq === i ? 'text-brand-primary' : 'text-white'}`}>
                  {faq.q}
                </span>
                {openFaq === i ? <ChevronUp className="w-6 h-6 text-brand-primary" /> : <ChevronDown className="w-6 h-6 text-dim" />}
              </button>
              
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 pt-0 text-dim leading-relaxed font-medium text-lg border-t border-white/5 mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
