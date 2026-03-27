export interface ScriptAnalysisStage {
  stage: string;
  content: string;
}

export interface ScriptResult {
  title: string;
  script: string;
  sceneAnalysis?: string;
  hookAnalysis?: string;
  suggestedScenes?: string;
  analysis?: ScriptAnalysisStage[];
  curiosityLevel: string;
  emotion: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password?: string; // Admin might see this
  plain_password?: string;
  role: 'user' | 'manager' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'frozen';
  expires_at: string;
  usage_limit: number;
  initial_limit: number;
  usage_period: 'daily' | 'weekly' | 'monthly';
  daily_coin_allocation?: number;
  last_reset_date?: string;
  subscription_status?: 'normal' | 'premium';
  profile_pic?: string;
  social_links?: string; // JSON string
  created_at: string;
}

export interface ScriptHistory {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  title: string;
  inputs: any; // Parsed JSON
  content: ScriptResult[]; // Parsed JSON
  is_saved: number;
  video_link?: string;
  created_at: string;
}

export interface SiteConfig {
  logo: {
    type: 'icon' | 'image';
    value: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    dim: string;
  };
  pages: {
    landing: {
      hero: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
      features: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
      cta: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    };
    formats: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    freeGeneration: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    textLab: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    archive: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    auth: { 
      title: string; 
      subtitle: string; 
      videoUrl?: string; 
      visible: boolean;
      login?: { title: string; subtitle: string; };
      register?: { title: string; subtitle: string; };
      completeProfile?: { title: string; subtitle: string; };
    };
    filmedScripts: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    profile: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    subscription: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
    suggestions: { title: string; subtitle: string; videoUrl?: string; visible: boolean; };
  };
  typography?: {
    fontFamily: string;
    headingFont?: string;
  };
  landingContent?: any;
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  content: string;
  files: any[]; // Parsed JSON
  links: string[]; // Parsed JSON
  created_at: string;
}

export interface EvaluationResult {
  hasHook: boolean;
  hookAnalysis: string;
  suggestedHooks: string[];
  hasPayoff: boolean;
  payoffAnalysis: string;
  openLoopsAnalysis: string;
  emotionsAnalysis: string;
  storytellingRewrite: string;
}

export interface FileData {
  mimeType: string;
  data: string;
}

export type Dialect = 
  | 'اللهجة المصرية'
  | 'اللهجة السعودية'
  | 'اللهجة الخليجية'
  | 'اللهجة الكويتية'
  | 'اللغة العربية الفصحى'
  | 'اللغة الإنجليزية'
  | 'اللهجة العامية الإنجليزية';

export type VideoLength = 'قصير' | 'طويل';

export const FORMATS = [
  'المقارنة (Comparison)',
  'قصص العملاء (Client Stories)',
  'أنا كـ [تخصصي] مستحيل.. (I Would Never [Specialty] As a)',
  'أسئلة الشارع (Street Interviews)',
  'سؤال الخبير السريع (Expert Rapid Q&A)',
  'خمن مين في 30 ثانية (Guess Who)',
  'أنا جربت (I Tried / Challenges)',
  'أنا اتعلمت (Transformation)',
  'القائمة / أفضل (عدد) أشياء (Top List)',
  'هيحصل إيه لو (What If)',
  'اعمل بذكاء وليس بجهد (Work Smart, Not Hard)',
  'كسر المعتقدات (Myth Busting)',
  'الاسكتش (Sketch Dialogue)',
  'إياك تعمل كذا (Mistakes to Avoid)',
  'الأسرار والخدع (Hidden Hacks)',
  'البديل الأفضل (The Smart Alternative)',
  'اختبار المنتج / (Product Testing / VSL)',
  'تعالوا أقولكم إزاي (How I Did It)',
  'الفلوج الهادف (Purposeful Vlog)',
  'نصيحة العمر (Authority Advice)',
  'الريأكشن (Reaction)',
  'المسابقات (Competitions & Stakes)',
  'الوثائقي السريع (Mini-Documentary)',
  'تقييم التريندات (Trend Review)',
  'تخيل إن (Imagine If)',
  'تريندات تتناسب مع مجالك',
  'المناسبات حسب مجالك'
];
