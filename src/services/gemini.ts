import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ScriptResult, EvaluationResult, FileData } from '../types';
import { db, doc, getDoc } from '../firebase';

// Initialize the Gemini client with default key
let ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'default-key' });

async function getGeminiClient() {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      if (data.gemini_api_key) {
        return new GoogleGenAI({ apiKey: data.gemini_api_key });
      }
    }
  } catch (err) {
    console.error('Error fetching custom Gemini API key:', err);
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `أنت خبير عالمي في كتابة وتقييم اسكربتات الفيديوهات الفايرال (القصيرة والطويلة).
يجب أن تلتزم التزاماً تاماً بالقواعد التالية المستمدة من ملفات التدريب والأمثلة المرفقة:
1. الهوك (Hook): أهم جزء. أول 3-5 ثواني. يجب أن يثير الفضول أو يصدم المشاهد. استخدم الهوكات القوية الموجودة في الملفات المرفقة (مثل "Copy of Videos hooks for students - Sheet1.pdf" و "١٠٠ فكرة فايرال مع 100 هوك.txt").
2. الحلقات المفتوحة (Open Loops):
   - مبتدئ: تفتح وتقفل فوراً.
   - متوسط: تفتح، تقفل، تفتح غيرها.
   - متقدم (فايرال): تفتح حلقة وتأجل إجابتها لآخر الفيديو.
3. السرد القصصي (Storytelling): يجب أن يحتوي على: هدف، دافع، نقطة بداية، مخاطرة (Stakes)، صراع وعقبات (Conflict - إياك أن تكون سوبرمان، أظهر الفشل)، رحلة، ونتيجة (Payoff).
4. النتيجة النهائية (Payoff): إياك أن تتحدث بعد الـ Payoff. أعط النتيجة وأنهِ الفيديو فوراً أو اطلب CTA سريع.
5. الفورمات الـ 27:
   1. المقارنة (Comparison)
   2. قصص العملاء (Client Stories)
   3. أنا كـ [تخصصي] مستحيل.. (I Would Never [Specialty] As a)
   4. أسئلة الشارع (Street Interviews)
   5. سؤال الخبير السريع (Expert Rapid Q&A)
   6. خمن مين في 30 ثانية (Guess Who)
   7. أنا جربت (I Tried / Challenges)
   8. أنا اتعلمت (Transformation)
   9. القائمة / أفضل (عدد) أشياء (Top List)
   10. هيحصل إيه لو (What If)
   11. اعمل بذكاء وليس بجهد (Work Smart, Not Hard)
   12. كسر المعتقدات (Myth Busting)
   13. الاسكتش (Sketch Dialogue)
   14. إياك تعمل كذا (Mistakes to Avoid)
   15. الأسرار والخدع (Hidden Hacks)
   16. البديل الأفضل (The Smart Alternative)
   17. اختبار المنتج / (Product Testing / VSL)
   18. تعالوا أقولكم إزاي (How I Did It)
   19. الفلوج الهادف (Purposeful Vlog)
   20. نصيحة العمر (Authority Advice)
   21. الريأكشن (Reaction)
   22. المسابقات (Competitions & Stakes)
   23. الوثائقي السريع (Mini-Documentary)
   24. تقييم التريندات (Trend Review)
   25. تخيل إن (Imagine If)
   26. تريندات تتناسب مع مجالك: قدم أفكار محتوى واسكربتات "تريند" (رائجة) في الوقت الفعلي تتناسب مع مجال المستخدم.
   27. المناسبات حسب مجالك: حدد المناسبات الحالية (مثل شهر رمضان، الأعياد، الأيام العالمية) واقترح أفكاراً واسكربتات تتماشى مع مجال المستخدم بناءً على هذه المناسبات.

يجب أن تتعلم من الأمثلة المرفقة لك وأن يكون أسلوبك بشرياً وطبيعياً مثل الذي بالأمثلة تماماً.
يجب أن تكتب الاسكربتات بمسافات واضحة، منظمة، وتستخدم الكلمات الانتقالية (لكن، بس، وعشان كدة) لربط الأحداث وخلق التوتر.`;

export async function generateScripts(
  topic: string,
  format: string | null,
  length: string,
  minutes: number | null,
  curiosityLevel: string,
  emotion: string,
  dialect: string,
  fileData?: FileData | null
): Promise<ScriptResult[]> {
  
  const prompt = `
  بناءً على المعطيات التالية، قم بإنشاء 8 اسكربتات مختلفة.
  المجال/الموضوع: ${topic || 'استنتج من الملف المرفق'}
  ${format ? `الفورمات المطلوب: ${format}
  تنبيه هام جداً: يجب عليك مراجعة الملفات المرفقة لمعرفة الشرح الدقيق والأسلوب الخاص بهذا الفورمات (${format})، واستخدام الهوكات المناسبة له من الملفات المرفقة (مثل "Copy of Videos hooks for students - Sheet1.pdf" و "١٠٠ فكرة فايرال مع 100 هوك.txt"). اكتب بنفس أسلوب الأمثلة الموجودة في الملفات تماماً.` : 'إنشاء حر (اختر الفورمات الأنسب)'}
  ${format === 'تريندات تتناسب مع مجالك' ? `
  تنبيه هام بخصوص "تريندات تتناسب مع مجالك":
  قم بتزويد المستخدم بأفكار محتوى وكتابة اسكربتات له "تريند" (رائجة) في الوقت الفعلي داخل مجاله الخاص.
  ` : ''}
  ${format === 'المناسبات حسب مجالك' ? `
  تنبيه هام بخصوص "المناسبات حسب مجالك":
  حدد ما إذا كانت هناك أي مناسبات حالية (مثل الأعياد، شهر رمضان، أحداث موسمية، أيام عالمية).
  بمجرد أن يدخل المستخدم مجاله، قم بتزويده بأفكار واكتب له اسكربتات محتوى تتماشى مع مجاله بناءً على هذه المناسبات.
  ` : ''}
  مدة الفيديو: ${length} ${length === 'طويل' && minutes ? `(${minutes} دقائق)` : ''}
  مستوى الفضول (Open Loops): ${curiosityLevel}
  نوع المشاعر: ${emotion}
  اللهجة/اللغة: ${dialect}

  الاسكربتات الـ 7 الأولى يجب أن تتبع الفورمات المطلوب (إن وجد) أو تكون متنوعة في الإنشاء الحر.
  الاسكربت رقم 8 يجب أن يكون اقتراحاً إبداعياً من الذكاء الاصطناعي بفورمات مختلف تماماً.
  
  هام جداً بخصوص تنسيق الاسكربت (script):
  1. يجب أن يحتوي على النص الصافي الذي سيتم نطقه فقط، بدون أي توجيهات إخراجية أو بصرية أو كلمات مثل "الهوك:" أو "(كات)".
  2. يجب أن تضع سطرين فارغين (Double Line Breaks \n\n) بين كل جملة وأخرى داخل الاسكربت لضمان وجود مسافات واسعة بين الجمل لتسهيل القراءة.
  3. في نهاية كل اسكربت، يجب إضافة عنصر تفاعلي (Call to Action / سؤال تفاعلي) لزيادة التفاعل في التعليقات، مثل: "لو الخاصية دي نزلت موبايلك بكرة تفتكر مين اول حيوان هتروح تتكلم معاه ؟ شاركني برأيك في الكومنتات". اجعل السؤال التفاعلي مناسباً لموضوع الاسكربت.

  هام جداً بخصوص تحليل الاسكربت (analysis):
  يجب أن تقوم بتحليل الاسكربت كاملاً وإضافة مشاهد مقترحة لكل مرحلة، وتقسيمه إلى 7 مراحل أساسية كالتالي:
  1. الهوك (Hook)
  2. السياق (Context)
  3. الصراع (Conflict)
  4. العقبة (Escalation)
  5. الذروة (Climax)
  6. النتيجة (Payoff)
  7. الدعوة للفعل (CTA)
  قم بإرجاع هذا التحليل كمصفوفة (Array) من الكائنات (Objects)، حيث يحتوي كل كائن على "stage" (اسم المرحلة) و "content" (المحتوى المقترح والمشاهد البصرية).
  `;

  const parts: any[] = [{ text: prompt }];
  if (fileData) {
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType,
      },
    });
  }

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'عنوان الاسكربت (مثال: النتيجة 1، النتيجة 2... النتيجة 8: اقتراح الذكاء الاصطناعي)' },
        script: { type: Type.STRING, description: 'النص الصافي للاسكربت (الكلام الذي سيقال فقط) بدون أي إضافات أو توجيهات بصرية، مع وضع سطرين فارغين بين كل جملة وأخرى' },
        analysis: {
          type: Type.ARRAY,
          description: 'تحليل الاسكربت كاملاً مقسماً إلى 7 مراحل',
          items: {
            type: Type.OBJECT,
            properties: {
              stage: { type: Type.STRING, description: 'اسم المرحلة (مثال: الهوك (Hook))' },
              content: { type: Type.STRING, description: 'المحتوى المقترح والمشاهد البصرية لهذه المرحلة' }
            },
            required: ['stage', 'content']
          }
        },
        curiosityLevel: { type: Type.STRING, description: 'مستوى الفضول المستخدم في هذا الاسكربت' },
        emotion: { type: Type.STRING, description: 'نوع المشاعر الغالبة في هذا الاسكربت' },
      },
      required: ['title', 'script', 'analysis', 'curiosityLevel', 'emotion'],
    },
  };

  const currentAi = await getGeminiClient();

  const response = await currentAi.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
  }).catch((error: any) => {
    if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار قليلاً أو المحاولة لاحقاً.');
    }
    throw error;
  });

  let text = response.text;
  if (!text) throw new Error('No response from Gemini');
  
  // Clean up markdown code blocks if present
  text = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  
  try {
    return JSON.parse(text) as ScriptResult[];
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('فشل في معالجة البيانات المستلمة من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
  }
}

export async function evaluateScript(
  scriptText: string,
  dialect: string
): Promise<EvaluationResult> {
  const prompt = `
  قم بتقييم الاسكربت التالي بناءً على عوامل نجاح الفيديوهات الفايرال:
  الاسكربت:
  """
  ${scriptText}
  """

  المطلوب:
  1. هل يحتوي على هوك قوي في البداية؟ (نعم/لا) مع التحليل.
  2. اقترح 3 هوكات بديلة ومناسبة وتكون أقوى.
  3. هل يحتوي على نتيجة نهائية (Payoff) واضحة؟ وهل تم التحدث بعدها (وهو خطأ)؟
  4. تحليل حلقات الفضول (Open Loops) الموجودة.
  5. تحليل المشاعر الموجودة.
  6. أعد كتابة نفس الاسكربت بنفس اللهجة (${dialect}) ولكن باستخدام أسلوب السرد القصصي (Storytelling) مع إضافة صراع، مخاطرة، وربط الأحداث بكلمات انتقالية.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      hasHook: { type: Type.BOOLEAN, description: 'هل يوجد هوك؟' },
      hookAnalysis: { type: Type.STRING, description: 'تحليل الهوك الحالي' },
      suggestedHooks: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: '3 اقتراحات لهوكات أقوى'
      },
      hasPayoff: { type: Type.BOOLEAN, description: 'هل يوجد Payoff؟' },
      payoffAnalysis: { type: Type.STRING, description: 'تحليل النتيجة النهائية' },
      openLoopsAnalysis: { type: Type.STRING, description: 'تحليل حلقات الفضول' },
      emotionsAnalysis: { type: Type.STRING, description: 'تحليل المشاعر' },
      storytellingRewrite: { type: Type.STRING, description: 'الاسكربت المعاد كتابته بأسلوب السرد القصصي' },
    },
    required: ['hasHook', 'hookAnalysis', 'suggestedHooks', 'hasPayoff', 'payoffAnalysis', 'openLoopsAnalysis', 'emotionsAnalysis', 'storytellingRewrite'],
  };

  const currentAi = await getGeminiClient();

  const response = await currentAi.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
  }).catch((error: any) => {
    if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار قليلاً أو المحاولة لاحقاً.');
    }
    throw error;
  });

  let text = response.text;
  if (!text) throw new Error('No response from Gemini');
  
  // Clean up markdown code blocks if present
  text = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  
  try {
    return JSON.parse(text) as EvaluationResult;
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('فشل في معالجة البيانات المستلمة من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
  }
}
