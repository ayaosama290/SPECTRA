import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Info, Brain, Activity, User } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  arabicText?: string;
  category: 'asd' | 'adhd';
}

const ASD_QUESTIONS: Question[] = [
  { 
    id: 1, 
    text: "S/he often notices small sounds when others do not", 
    arabicText: "غالبًا ما يلاحظ الطفل أصواتًا صغيرة لا يلاحظها الآخرون",
    category: 'asd' 
  },
  { 
    id: 2, 
    text: "S/he usually concentrates more on the whole picture, rather than the small details", 
    arabicText: "عادةً ما يركز الطفل على الصورة الكاملة أكثر من التفاصيل الصغيرة",
    category: 'asd' 
  },
  { 
    id: 3, 
    text: "In a social group, s/he can easily keep track of several different people’s conversations", 
    arabicText: "في مجموعة اجتماعية، يستطيع الطفل متابعة عدة محادثات بين أشخاص مختلفين بسهولة",
    category: 'asd' 
  },
  { 
    id: 4, 
    text: "S/he finds it easy to go back and forth between different activities", 
    arabicText: "يجد الطفل سهولة في الانتقال بين أنشطة مختلفة",
    category: 'asd' 
  },
  { 
    id: 5, 
    text: "S/he doesn’t know how to keep a conversation going with his/her peers", 
    arabicText: "لا يعرف الطفل كيف يحافظ على استمرار الحوار مع أقرانه",
    category: 'asd' 
  },
  { 
    id: 6, 
    text: "S/he is good at social chit-chat", 
    arabicText: "الطفل جيد في الأحاديث الاجتماعية البسيطة",
    category: 'asd' 
  },
  { 
    id: 7, 
    text: "When s/he is read a story, s/he finds it difficult to work out the character’s intentions or feelings", 
    arabicText: "عند قراءة قصة له، يجد الطفل صعوبة في فهم نوايا أو مشاعر الشخصيات",
    category: 'asd' 
  },
  { 
    id: 8, 
    text: "When s/he was in preschool, s/he used to enjoy playing games involving pretending with other children", 
    arabicText: "عندما كان في مرحلة ما قبل المدرسة، كان يستمتع بالألعاب التخيّلية مع الأطفال الآخرين",
    category: 'asd' 
  },
  { 
    id: 9, 
    text: "S/he finds it easy to work out what someone is thinking or feeling just by looking at their face", 
    arabicText: "يستطيع الطفل بسهولة معرفة ما يفكر فيه الآخرون أو يشعرون به من خلال النظر إلى وجوههم",
    category: 'asd' 
  },
  { 
    id: 10, 
    text: "S/he finds it hard to make new friends", 
    arabicText: "يجد الطفل صعوبة في تكوين صداقات جديدة",
    category: 'asd' 
  },
];

const ADHD_QUESTIONS: Question[] = [
  { id: 6, text: "I often find it hard to focus on tasks that I find repetitive or boring.", category: 'adhd' },
  { id: 7, text: "I frequently lose things like keys, phones, or important documents.", category: 'adhd' },
  { id: 8, text: "I often feel restless or like I need to be constantly moving.", category: 'adhd' },
  { id: 9, text: "I tend to interrupt others or finish their sentences during conversations.", category: 'adhd' },
  { id: 10, text: "I find it difficult to organize my time and prioritize tasks.", category: 'adhd' },
];

const ALL_QUESTIONS = [...ASD_QUESTIONS, ...ADHD_QUESTIONS];

interface AssessmentProps {
  initialCategory?: 'asd' | 'adhd';
}

export const Assessment: React.FC<AssessmentProps> = ({ initialCategory }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  // If initialCategory is provided, we could filter questions or just jump to that section.
  // For simplicity, we'll keep the combined assessment but maybe highlight the category.

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [ALL_QUESTIONS[step].id]: value });
    if (step < ALL_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateResults = () => {
    const asdScore = ASD_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] || 0), 0) / (ASD_QUESTIONS.length * 4);
    const adhdScore = ADHD_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] || 0), 0) / (ADHD_QUESTIONS.length * 4);
    
    return { asdScore, adhdScore };
  };

  if (isFinished) {
    const { asdScore, adhdScore } = calculateResults();
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-8 glass-card rounded-3xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-anadaa-100 rounded-full mb-4">
            <CheckCircle2 className="text-anadaa-700" size={32} />
          </div>
          <h2 className="text-3xl font-display font-bold text-anadaa-900">Assessment Complete</h2>
          <p className="text-anadaa-500 mt-2">Based on your responses, here is a preliminary overview.</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-anadaa-50 rounded-2xl border border-anadaa-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Brain size={20} className="text-anadaa-600" />
                ASD Indicators
              </h3>
              <span className="text-sm font-medium text-anadaa-500">{Math.round(asdScore * 100)}%</span>
            </div>
            <div className="w-full bg-anadaa-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${asdScore * 100}%` }}
                className="bg-anadaa-600 h-full"
              />
            </div>
          </div>

          <div className="p-6 bg-accent-50 rounded-2xl border border-accent-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Activity size={20} className="text-accent-600" />
                ADHD Indicators
              </h3>
              <span className="text-sm font-medium text-accent-500">{Math.round(adhdScore * 100)}%</span>
            </div>
            <div className="w-full bg-accent-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${adhdScore * 100}%` }}
                className="bg-accent-500 h-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
          <AlertCircle className="text-amber-600 shrink-0" size={20} />
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> This is not a clinical diagnosis. These results are intended for informational purposes only. Please consult a qualified healthcare professional for a formal evaluation.
          </p>
        </div>

        <button 
          onClick={() => {
            setStep(0);
            setAnswers({});
            setIsFinished(false);
          }}
          className="w-full mt-8 btn-primary"
        >
          Retake Assessment
        </button>
      </motion.div>
    );
  }

  const currentQuestion = ALL_QUESTIONS[step];
  const progress = ((step + 1) / ALL_QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-anadaa-400">
            Question {step + 1} of {ALL_QUESTIONS.length}
          </span>
          <span className="text-xs font-bold text-anadaa-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-anadaa-200 h-1 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-anadaa-600 h-full"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8 md:p-12 rounded-[2rem]"
        >
          <div className="mb-8">
            <span className={`inline-block px-3 py-1 ${currentQuestion.category === 'asd' ? 'bg-anadaa-100 text-anadaa-600' : 'bg-accent-100 text-accent-600'} text-[10px] font-bold tracking-widest uppercase rounded-full mb-4`}>
              {currentQuestion.category} Assessment
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-anadaa-900 leading-tight">
              {currentQuestion.text}
            </h2>
            {currentQuestion.arabicText && (
              <p className="text-xl md:text-2xl font-display font-medium text-anadaa-600 mt-4 leading-relaxed text-right" dir="rtl">
                {currentQuestion.arabicText}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Never", value: 0 },
              { label: "Rarely", value: 1 },
              { label: "Sometimes", value: 2 },
              { label: "Often", value: 3 },
              { label: "Very Often", value: 4 },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="flex items-center justify-between p-4 rounded-xl border border-anadaa-200 hover:border-anadaa-700 hover:bg-anadaa-50 transition-all group text-left"
              >
                <span className="font-medium text-anadaa-700 group-hover:text-anadaa-900">{option.label}</span>
                <ChevronRight size={18} className="text-anadaa-300 group-hover:text-anadaa-700" />
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm font-medium text-anadaa-400 hover:text-anadaa-700 disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={16} /> Previous
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
