import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ScriptResult, EvaluationResult, FileData } from '../types';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `أنت خبير عالمي في كتابة وتقييم اسكربتات الفيديوهات الفايرال (القصيرة والطويلة).
يجب أن تلتزم التزاماً تاماً بالقواعد التالية المستمدة من ملفات التدريب:
1. الهوك (Hook): أهم جزء. أول 3-5 ثواني. يجب أن يثير الفضول أو يصدم المشاهد. أنواع الهوك: كلامي، مرئي، نصي، صوتي.
2. الحلقات المفتوحة (Open Loops):
   - مبتدئ: تفتح وتقفل فوراً.
   - متوسط: تفتح، تقفل، تفتح غيرها.
   - متقدم (فايرال): تفتح حلقة وتأجل إجابتها لآخر الفيديو.
3. السرد القصصي (Storytelling): يجب أن يحتوي على: هدف، دافع، نقطة بداية، مخاطرة (Stakes)، صراع وعقبات (Conflict - إياك أن تكون سوبرمان، أظهر الفشل)، رحلة، ونتيجة (Payoff).
4. النتيجة النهائية (Payoff): إياك أن تتحدث بعد الـ Payoff. أعط النتيجة وأنهِ الفيديو فوراً أو اطلب CTA سريع.
5. الفورمات الـ 16:
   1. أنا جربت / التحديات
   2. القائمة / أفضل 5 أشياء
   3. المقارنة / الأغلى والأرخص
   4. كسر المعتقدات / الصدمة
   5. أسئلة للغرباء في الشارع
   6. الريأكشن
   7. الاسكتش / الحوار
   8. المسابقات
   9. الفلوج / يوم في حياتي
   10. أنا اتعلمت / التحويل
   11. التريندات
   12. الأسرار / الخدع
   13. ماذا لو؟ / الغموض
   14. نصيحة العمر / سلطة الخبير
   15. فيديو البيع (VSL)
   16. أسلوب شهاب (Shehab Style): إذا تم اختيار هذا الفورمات، يجب أن تتقمص شخصية "شهاب" تماماً. استخدم نفس أسلوبه، طريقة كلامه، وكلماته المتكررة مثل "يا أبو الأصدقاء"، "وكالعادة ما تنساش تعمل شير"، "شهاب إيه اللي أنت بتقوله ده؟"، "ركز لي بقى في الفيديو ده". يجب ربط قصص غريبة أو مواضيع مثيرة بالمعلومات التي تقولها بنفس طريقته في سرد القصص.
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
  ${format ? `الفورمات المطلوب: ${format}` : 'إنشاء حر (اختر الفورمات الأنسب، ولكن يُمنع منعاً باتاً استخدام "أسلوب شهاب" في الإنشاء الحر)'}
  ${format === 'أسلوب شهاب (Shehab Style)' ? `
  تنبيه هام جداً بخصوص "أسلوب شهاب":
  يجب أن تتقمص شخصية "شهاب" بنسبة 100%. استخدم أسلوبه في سرد القصص الغريبة والمثيرة للاهتمام لربطها بالمعلومة الأساسية.
  استخدم لزماته الكلامية مثل:
  - "يا أبو الأصدقاء"
  - "وكالعادة ما تنساش تعمل شير"
  - "شهاب إيه اللي أنت بتقوله ده؟"
  - "ركز لي بقى في الفيديو ده"
  - "سيب اللي في إيدك أبو الأصدقاء وركز لي"
  - "انت محظوظ جدا لو بتشوف الفيديو ده قبل ما يتمسح"
  - "لو ما فهمتش قصته فخليني اجيب لك من الاخر"
  يجب أن يكون الاسكربت مكتوباً وكأن شهاب هو من يتحدث بالضبط.
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
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
