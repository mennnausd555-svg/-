import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wand2, ChevronDown, CheckCircle2, Star, BrainCircuit, Zap, 
  MessageSquare, Play, FileText, Video, Layers, Quote,
  Globe, Shield, BarChart3, MessageCircle, HelpCircle, ArrowLeft
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  isEnglish: boolean;
  setIsEnglish: (val: boolean) => void;
}

function FAQItem({ question, answer }: { question: string, answer: string, key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-right group"
      >
        <span className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{question}</span>
        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-dim" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-dim leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage({ onStart, isEnglish, setIsEnglish }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-primary selection:text-white overflow-x-hidden font-sans" dir="rtl">
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
              <span className="text-xl font-black tracking-tight uppercase">VIRAL AI</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-dim">
            <a href="#how-it-works" className="hover:text-white transition-colors">كيف يعمل</a>
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a>
            <button onClick={() => setIsEnglish(!isEnglish)} className="hover:text-white transition-colors flex items-center gap-2">
              <Globe className="w-4 h-4" /> English
            </button>
          </div>

          <button 
            onClick={onStart}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-full font-bold text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,102,255,0.4)]"
          >
            Get started for free
          </button>
        </div>
        <div className="w-full bg-brand-primary/10 border-b border-brand-primary/20 py-2 text-center">
          <p className="text-xs md:text-sm font-bold text-brand-primary">
            اكتب سكربتات فيديو تجذب المشاهد… قبل أن يضغط زر التخطي.
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
              حوّل أي فكرة إلى <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400 drop-shadow-[0_0_30px_rgba(0,102,255,0.5)]">
                سكربت فايرال
              </span> <br/>
              خلال ثوانٍ.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-dim max-w-3xl mx-auto mb-6 leading-relaxed"
            >
              ذكاء اصطناعي مدرّب على أساليب السرد القصصي المستخدمة في الفيديوهات التي تحقق ملايين المشاهدات.
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 max-w-2xl mx-auto mb-12"
            >
              ليكتب لك سكربتات تبدو وكأنها كتبها كاتب محترف.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <button onClick={onStart} className="relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 bg-brand-primary rounded-full hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.5)] text-xl group">
                ابدأ التجربة المجانية
                <ArrowLeft className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" />
              </button>
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
                "إذا كنت صانع محتوى…<br/>
                فأنت تعلم أن الفكرة الجيدة وحدها لا تكفي.<br/><br/>
                الفرق الحقيقي بين فيديو عادي وفيديو يحقق ملايين المشاهدات<br/>
                <span className="text-brand-primary">هو طريقة السرد.</span>"
              </p>
              <div className="inline-block px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary font-black text-xl">
                Viral Script AI صُمم ليعطيك تلك الميزة.
              </div>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-12">اكتب فكرة بسيطة… وسيحولها النظام إلى سكربت كامل.</h2>
            
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative max-w-3xl mx-auto mb-12">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-right space-y-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 inline-block text-dim">
                  فكرة الفيديو: كيف تبدأ في الذكاء الاصطناعي من الصفر؟
                </div>
                <div className="flex justify-center my-4">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Wand2 className="w-5 h-5 text-brand-primary" />
                  </div>
                </div>
                <div className="bg-brand-primary/10 p-6 rounded-2xl border border-brand-primary/20 text-white text-lg leading-relaxed text-right">
                  <span className="text-brand-primary font-bold block mb-2">[Hook - خطاف]</span>
                  هل تعلم أن 90% من الوظائف ستتغير بسبب الذكاء الاصطناعي خلال الـ 5 سنوات القادمة؟ إذا لم تبدأ الآن، فستتأخر كثيراً...
                  <br/><br/>
                  <span className="text-brand-primary font-bold block mb-2">[Body - المحتوى]</span>
                  في هذا الفيديو سأعطيك خريطة طريق واضحة ومجانية لتبدأ في هذا المجال حتى لو لم تكن مبرمجاً...
                </div>
              </div>
            </div>

            <button onClick={onStart} className="px-10 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
              جرب الآن
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">كيف يعمل؟</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { title: 'اكتب فكرة الفيديو', icon: MessageSquare, num: '1' },
                { title: 'اختر نوع المحتوى أو الفورمات', icon: Layers, num: '2' },
                { title: 'اضغط توليد', icon: Zap, num: '3' },
                { title: 'احصل على عدة سكربتات جاهزة للتصوير', icon: Video, num: '4' }
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
                  <h3 className="text-xl font-bold">{step.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">المميزات</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'يولد عدة سكربتات مختلفة لكل فكرة', icon: Layers },
                { title: 'يعتمد على قوالب فيديو فايرال', icon: Star },
                { title: 'يكتب سكربتات طويلة للفيديوهات الكاملة', icon: Video },
                { title: 'يكتب سكربتات قصيرة لـ Shorts وReels', icon: Play },
                { title: 'يمكنه تحليل السكربتات وإعطائك تقييمًا لتحسينها', icon: BarChart3 },
                { title: 'حفظ جميع السكربتات في سجل خاص بك', icon: FileText },
                { title: 'إمكانية تحميل السكربت PDF', icon: FileText },
                { title: 'دعم العربية والإنجليزية', icon: Globe },
                { title: 'واجهة بسيطة وسريعة لصناع المحتوى', icon: Zap }
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:border-brand-primary/30 transition-colors">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-bold mt-2">{feature.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-24 px-6 bg-brand-primary/5 border-y border-brand-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-6">تمت تجربة المنصة من قبل صناع محتوى محترفين.</h2>
            
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 mt-12 relative">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-white/5" />
              <div className="flex justify-center gap-1 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                "الفكرة قوية جدًا… والأداة مفيدة لصناع المحتوى."
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-xl font-black">
                  ب
                </div>
                <div className="text-right">
                  <h4 className="font-black text-lg">بهاء حنيش</h4>
                  <p className="text-dim text-sm">صانع محتوى</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bonuses */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-brand-primary/20 to-blue-900/20 border border-brand-primary/30 rounded-[3rem] p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-black mb-12">ماذا ستحصل عليه أيضاً؟</h2>
              <div className="grid md:grid-cols-2 gap-8 text-right">
                {[
                  'اكتر من 15 فورمات حققت ملايين المشاهدات',
                  'تحليل السكربتات وتحسينها',
                  'سجل كامل لكل السكربتات',
                  'اكتر من لهجة للكتابة من دول الخليج ولهجة مصرية ولغة انجليزية'
                ].map((bonus, i) => (
                  <div key={i} className="flex items-center gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <span className="text-xl font-bold">{bonus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Offer */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6">يمكنك البدء باستخدام Viral Script AI اليوم.</h2>
            <p className="text-xl text-dim mb-10">المستخدمون الجدد يحصلون على تجربة مجانية لتجربة قوة المنصة.</p>
            <button onClick={onStart} className="px-12 py-5 bg-brand-primary text-white rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,102,255,0.4)]">
              ابدأ التجربة المجانية الآن
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-black mb-12 text-center">الأسئلة الشائعة</h2>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8">
              {[
                { q: 'هل يمكن استخدام الموقع لأي مجال محتوى؟', a: 'نعم، النظام مصمم ليتكيف مع مختلف المجالات سواء كانت تقنية، ترفيهية، تعليمية أو غيرها.' },
                { q: 'هل يمكن كتابة سكربتات Shorts؟', a: 'بالتأكيد، لدينا أدوات مخصصة لكتابة الفيديوهات القصيرة (Shorts, Reels, TikTok) بأسلوب يخطف الانتباه في الثواني الأولى.' },
                { q: 'هل يدعم اللغة العربية؟', a: 'نعم، المنصة تدعم اللغة العربية بشكل كامل وبجودة صياغة عالية، بالإضافة لدعم اللغة الإنجليزية.' },
                { q: 'هل يمكن حفظ السكربتات؟', a: 'نعم، يتم حفظ جميع السكربتات التي تقوم بإنشائها في سجلك الخاص للعودة إليها في أي وقت.' }
              ].map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-primary/10 blur-[100px] rounded-full" />
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              فكرة جيدة قد تصنع فيديو ناجح…<br/>
              <span className="text-brand-primary">لكن سكريبت قوي هو ما يصنع فيديو فايرال.</span>
            </h2>
            <button onClick={onStart} className="mt-8 px-14 py-6 bg-white text-black rounded-full font-black text-2xl hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              ابدأ كتابة سكريبتك الآن
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-dim text-sm">
        <p>© {new Date().getFullYear()} Viral Script AI. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
