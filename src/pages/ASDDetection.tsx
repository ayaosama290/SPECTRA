import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Info, MessageSquare, Users, Smile, Repeat, RefreshCw, Video, Upload, FileText, X, Camera, Gamepad2, Activity, Loader2, AlertCircle, Circle, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Question {
  id: number;
  category: string;
  icon: React.ReactNode;
  text: string;
  arabicText: string;
  reverseScore?: boolean;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Sensory & Attention",
    icon: <Brain className="text-blue-500" />,
    text: "S/he often notices small sounds when others do not",
    arabicText: "غالبًا ما يلاحظ الطفل أصواتًا صغيرة لا يلاحظها الآخرون"
  },
  {
    id: 2,
    category: "Sensory & Attention",
    icon: <Brain className="text-blue-500" />,
    text: "S/he usually concentrates more on the whole picture, rather than the small details",
    arabicText: "عادةً ما يركز الطفل على الصورة الكاملة أكثر من التفاصيل الصغيرة",
    reverseScore: true
  },
  {
    id: 3,
    category: "Social Interaction",
    icon: <Users className="text-purple-500" />,
    text: "In a social group, s/he can easily keep track of several different people’s conversations",
    arabicText: "في مجموعة اجتماعية، يستطيع الطفل متابعة عدة محادثات بين أشخاص مختلفين بسهولة",
    reverseScore: true
  },
  {
    id: 4,
    category: "Social Interaction",
    icon: <Users className="text-purple-500" />,
    text: "S/he finds it easy to go back and forth between different activities",
    arabicText: "يجد الطفل سهولة في الانتقال بين أنشطة مختلفة",
    reverseScore: true
  },
  {
    id: 5,
    category: "Communication",
    icon: <MessageSquare className="text-orange-500" />,
    text: "S/he doesn’t know how to keep a conversation going with his/her peers",
    arabicText: "لا يعرف الطفل كيف يحافظ على استمرار الحوار مع أقرانه"
  },
  {
    id: 6,
    category: "Communication",
    icon: <MessageSquare className="text-orange-500" />,
    text: "S/he is good at social chit-chat",
    arabicText: "الطفل جيد في الأحاديث الاجتماعية البسيطة",
    reverseScore: true
  },
  {
    id: 7,
    category: "Emotional Understanding",
    icon: <Smile className="text-green-500" />,
    text: "When s/he is read a story, s/he finds it difficult to work out the character’s intentions or feelings",
    arabicText: "عند قراءة قصة له، يجد الطفل صعوبة في فهم نوايا أو مشاعر الشخصيات"
  },
  {
    id: 8,
    category: "Emotional Understanding",
    icon: <Smile className="text-green-500" />,
    text: "When s/he was in preschool, s/he used to enjoy playing games involving pretending with other children",
    arabicText: "عندما كان في مرحلة ما قبل المدرسة، كان يستمتع بالألعاب التخيّلية مع الأطفال الآخرين",
    reverseScore: true
  },
  {
    id: 9,
    category: "Social Interaction",
    icon: <Users className="text-red-500" />,
    text: "S/he finds it easy to work out what someone is thinking or feeling just by looking at their face",
    arabicText: "يستطيع الطفل بسهولة معرفة ما يفكر فيه الآخرون أو يشعرون به من خلال النظر إلى وجوههم",
    reverseScore: true
  },
  {
    id: 10,
    category: "Social Interaction",
    icon: <Users className="text-red-500" />,
    text: "S/he finds it hard to make new friends",
    arabicText: "يجد الطفل صعوبة في تكوين صداقات جديدة"
  }
];

type ASDPhase = 'selection' | 'questionnaire' | 'face-videos' | 'play-video' | 'eeg-upload' | 'results';

const ASDDetection: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ASDPhase>('selection');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Video Upload States
  const [faceVideo, setFaceVideo] = useState<File | null>(null);
  const [playVideo, setPlayVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  
  // EEG State
  const [eegFiles, setEegFiles] = useState<{vhdr?: File, vmrk?: File, data?: File}>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'face' | 'play' | 'eeg_vhdr' | 'eeg_vmrk' | 'eeg_data' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Recording State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorVisible("Could not access camera. Please ensure you have granted camera permissions.");
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    // Find supported mime type with enhanced compatibility checks
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1',
      'video/mp4'
    ];
    
    let selectedMimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    const isFace = uploadTarget === 'face';
    const recordingLimit = isFace ? 20 : 45; // reduced from 30/60 to keep files small per "chunks" request
    
    console.log(`[ASDDetection] Starting recording. Target: ${uploadTarget}. Browser's chosen MIME type: ${selectedMimeType || 'default'}`);
    
    // Fallback to default if somehow none are "supported" but we have a stream
    const options: MediaRecorderOptions = { 
      mimeType: selectedMimeType,
      videoBitsPerSecond: isFace ? 200000 : 400000, // Reduced from 400k/700k to 200k/400k
      audioBitsPerSecond: 32000 
    };
    
    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          // Log periodically for monitoring
          if (chunksRef.current.length % 5 === 0) {
            console.log(`[ASDDetection] Recording chunk captured. Count: ${chunksRef.current.length}, Size: ${event.data.size} bytes`);
          }
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[ASDDetection] MediaRecorder stopped. Total chunks captured:', chunksRef.current.length);
      };

      // Request data every 1000ms to keep chunks manageable
      mediaRecorder.start(1000); 
      setIsRecording(true);
      
      setRecordingTime(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= recordingLimit - 1) {
            stopRecording();
            return recordingLimit;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("[ASDDetection] Failed to initialize MediaRecorder:", e);
      setErrorVisible("Failed to start recording. Your browser might not support the selected video format.");
      handleCloseCameraModal();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleSaveRecording = () => {
    if (chunksRef.current.length === 0) {
      setErrorVisible("No video data was captured. Please try recording again.");
      return;
    }
    
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    // Robust extension mapping
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('ogg')) extension = 'ogv';
    else if (mimeType.includes('quicktime')) extension = 'mov';
    
    const blob = new Blob(chunksRef.current, { type: mimeType });
    
    if (blob.size < 1000) { // Less than 1KB is likely an empty/invalid file
      console.warn(`[ASDDetection] Captured video blob is suspiciously small: ${blob.size} bytes`);
      setErrorVisible("The recorded video is too short or empty. Please record for at least a few seconds.");
      chunksRef.current = [];
      return;
    }

    const fileName = `recording_${uploadTarget}_${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: mimeType });
    
    console.log(`[ASDDetection] Recording finalized and saved to state: ${fileName} (${((file?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)`);
    
    if (uploadTarget === 'face') setFaceVideo(file);
    else if (uploadTarget === 'play') setPlayVideo(file);
    
    handleCloseCameraModal();
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setIsRecording(false);
    chunksRef.current = [];
    setUploadTarget(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (currentQuestionIdx < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIdx(prev => prev + 1), 300);
    }
  };

  const handleCompleteBehavioralScreening = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrorVisible(null);

    const childId = localStorage.getItem('child_id');
    if (!childId) {
      setErrorVisible('Please create a child profile first.');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    // Use 'emotion_video' for the face analysis
    if (faceVideo) {
      formData.append('emotion_video', faceVideo);
    }
    
    if (playVideo) {
      formData.append('behavioral_video', playVideo);
    }
    
    const questionnaireData: Record<string, string> = {};
    for (let i = 1; i <= 10; i++) {
      const val = answers[i] === 1 ? 'yes' : 'no';
      questionnaireData[`q${i}`] = val;
    }
    // Sending as a JSON string field named 'questionnaire_data' for consolidated processing
    formData.append('questionnaire_data', JSON.stringify(questionnaireData));

    // Automatic Retry Helper
    const submitWithRetry = async (fn: () => Promise<any>, maxRetries = 5) => {
      let lastErr;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fn();
          
          // Safety check for non-JSON responses (like AI Studio warmup page)
          // If we get HTML instead of JSON during a sequence that expects data, we treat it as a retryable failure
          if (response?.data && typeof response.data === 'string' && (response.data.includes('<!doctype html>') || response.data.includes('<html'))) {
            console.warn(`[ASDDetection] Warmup/HTML response detected on attempt ${i + 1}. Retrying...`);
            throw new Error('SERVER_WARMUP');
          }
          
          return response;
        } catch (err: any) {
          lastErr = err;
          // Don't retry if it's a 4xx client error (except maybe 429)
          if (err.response?.status && err.response.status >= 400 && err.response.status < 500 && err.response.status !== 429) {
            throw err;
          }
          
          console.warn(`Submission attempt ${i + 1} failed, retrying...`, err.message || err);
          if (i < maxRetries - 1) {
            // Exponential backoff: 2s, 4s, 8s, 16s
            const delay = Math.pow(2, i + 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastErr;
    };

    try {
      const url = `/api/reports/asd/${childId}/videos/`;
      const totalSize = (faceVideo?.size || 0) + (playVideo?.size || 0);
      console.log(`[ASDDetection] Submitting behavioral screening. URL: ${url}`);
      
      const response = await submitWithRetry(() => api.post(url, formData, {
        timeout: 1800000, 
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      }));

      console.log('[ASDDetection] Behavioral screening submission success:', response.data);
      setIsUploading(false);
      navigate(`/analysis-report/${childId}`);
    } catch (err: any) {
      console.error('API Error:', err);
      let errorMsg = 'Analysis submission failed. Please try again.';
      
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        } else if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      
      setErrorVisible(errorMsg);
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    setErrorVisible(null);
    if (phase === 'play-video') {
      handleCompleteBehavioralScreening();
    } else if (phase === 'eeg-upload') {
      handleEEGAnalysis();
    }
  };

  const handleEEGAnalysis = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrorVisible(null);
  
    const childId = localStorage.getItem('child_id');
    if (!childId) {
      setErrorVisible('Please create a child profile first.');
      setIsUploading(false);
      return;
    }
  
    if (!eegFiles.vhdr || !eegFiles.vmrk || !eegFiles.data) {
      setErrorVisible('Please upload all three BrainVision EEG files (.vhdr, .vmrk, .eeg/.dat) to proceed.');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('eeg_vhdr', eegFiles.vhdr);
    formData.append('eeg_vmrk', eegFiles.vmrk);
    formData.append('eeg_data', eegFiles.data);
    formData.append('child', childId);
    formData.append('child_id', childId);
  
    // Automatic Retry Helper
    const submitWithRetry = async (fn: () => Promise<any>, maxRetries = 5) => {
      let lastErr;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fn();
          
          if (response?.data && typeof response.data === 'string' && (response.data.includes('<!doctype html>') || response.data.includes('<html'))) {
            console.warn(`[ASDDetection-EEG] Warmup/HTML response detected on attempt ${i + 1}. Retrying...`);
            throw new Error('SERVER_WARMUP');
          }
          
          return response;
        } catch (err: any) {
          lastErr = err;
          // If it's a 400 error, don't retry as it's a client/request error
          if (err.response?.status && err.response.status === 400) {
            console.error('EEG API 400 Error Details:', err.response.data);
            throw err;
          }
          if (err.response?.status && err.response.status > 400 && err.response.status < 500 && err.response.status !== 429) {
            throw err;
          }
          
          console.warn(`EEG Submission attempt ${i + 1} failed, retrying...`, err.message || err);
          if (i < maxRetries - 1) {
            const delay = Math.pow(2, i + 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastErr;
    };

    try {
      const url = `/api/reports/asd/${childId}/physiology/`;
      const totalSize = (eegFiles.vhdr?.size || 0) + (eegFiles.vmrk?.size || 0) + (eegFiles.data?.size || 0);
      console.log(`[ASDDetection] Submitting EEG analysis. URL: ${url}`);
      
      const response = await submitWithRetry(() => api.post(url, formData, {
        timeout: 1800000, 
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      }));
      
      console.log('[ASDDetection] EEG screening submission success:', response.data);
      setIsUploading(false);
      navigate(`/analysis-report/${childId}`);
    } catch (err: any) {
      console.error('EEG API Error:', err);
      let errorMsg = 'EEG analysis failed. Please ensure all 3 files are valid.';
      
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        } else if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      
      setErrorVisible(errorMsg);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      // Forbid non-video files for video targets
      if (uploadTarget === 'face' && !file.type.startsWith('video/')) {
        setErrorVisible("The uploaded file for the child's emotion video is not a supported video format. Please upload a valid video file such as MP4, AVI, MOV, WEBM, or MKV.");
        return;
      }
      if (uploadTarget === 'play' && !file.type.startsWith('video/')) {
        setErrorVisible("The uploaded file for the child's motion video is not a supported video format. Please upload a valid video file such as MP4, AVI, MOV, WEBM, or MKV.");
        return;
      }

      if (uploadTarget === 'play') setPlayVideo(file);
      else if (uploadTarget === 'face') setFaceVideo(file);
      else if (uploadTarget === 'eeg_vhdr') setEegFiles(prev => ({ ...prev, vhdr: file }));
      else if (uploadTarget === 'eeg_vmrk') setEegFiles(prev => ({ ...prev, vmrk: file }));
      else if (uploadTarget === 'eeg_data') setEegFiles(prev => ({ ...prev, data: file }));
      setUploadTarget(null);
    }
  };

  const calculateResult = () => {
    if (apiResponse) {
      // Use AI Server specific response fields
      const isHigh = apiResponse.risk_level === 'HIGH' || apiResponse.risk_color === 'red';
      return { 
        level: apiResponse.risk_level || "Analysis Complete", 
        color: isHigh ? "text-red-600" : "text-green-600", 
        bg: isHigh ? "bg-red-50" : "bg-green-50", 
        desc: apiResponse.risk_message || apiResponse.description || "The analysis has been processed by our neural engine. Please review the detailed findings above."
      };
    }

    if (phase === 'eeg-upload' || eegFiles.vhdr) {
      return { level: "Analysis in Progress", color: "text-blue-600", bg: "bg-blue-50", desc: "Your EEG data has been received and is being processed by our neural analysis engine. You will receive a detailed report once the multi-stage detection is complete." };
    }
    
    const totalScore = Object.entries(answers).reduce((acc, [id, val]) => {
      const q = questions.find(q => q.id === parseInt(id));
      if (!q) return acc;
      // val is 1 for Yes, 0 for No
      const score = q.reverseScore ? (val === 0 ? 1 : 0) : val;
      return acc + score;
    }, 0);
    const maxScore = questions.length;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage < 30) return { level: "Low Likelihood", color: "text-green-600", bg: "bg-green-50", desc: "Based on the behavioral questionnaire and visual data, your child shows few typical indicators of ASD. We recommend keeping these results for your records." };
    if (percentage < 70) return { level: "Moderate Likelihood", color: "text-orange-600", bg: "bg-orange-50", desc: "The combined behavioral and visual analysis shows some indicators common in ASD. We recommend discussing these findings with a developmental specialist." };
    return { level: "High Likelihood", color: "text-red-600", bg: "bg-red-50", desc: "The multi-modal analysis indicates strong markers associated with ASD. We strongly recommend scheduling a formal clinical evaluation for a comprehensive diagnosis." };
  };

  const renderSelection = () => (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-anadaa-100 text-anadaa-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          ASD Screening Method
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-anadaa-900 mb-4">Select Analysis Method</h1>
        <p className="text-anadaa-600 text-lg max-w-2xl mx-auto">Choose the assessment path that best fits your current situation and available data.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <button 
          onClick={() => setPhase('questionnaire')}
          className="glass-card p-10 rounded-[3rem] shadow-xl border border-anadaa-100 flex flex-col items-center text-center group hover:border-anadaa-300 transition-all"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 transition-transform">
            <Video size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-4">Emotion & Motion Analysis</h2>
          <p className="text-anadaa-500 mb-8 leading-relaxed">A comprehensive path involving a questionnaire, facial emotion analysis, and a motion/behavioral session recording.</p>
          <div className="mt-auto flex items-center gap-2 text-anadaa-700 font-bold">
            Start Path <ChevronRight size={20} />
          </div>
        </button>

        <button 
          onClick={() => setPhase('eeg-upload')}
          className="glass-card p-10 rounded-[3rem] shadow-xl border border-anadaa-100 flex flex-col items-center text-center group hover:border-anadaa-300 transition-all"
        >
          <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-8 group-hover:scale-110 transition-transform">
            <Activity size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-4">EEG Data Analysis</h2>
          <p className="text-anadaa-500 mb-8 leading-relaxed">Upload raw EEG signal data for automated neural marker detection, similar to our ADHD screening process.</p>
          <div className="mt-auto flex items-center gap-2 text-anadaa-700 font-bold">
            Start Path <ChevronRight size={20} />
          </div>
        </button>
      </div>
    </div>
  );

  const renderQuestionnaire = () => {
    const currentQuestion = questions[currentQuestionIdx];
    if (!currentQuestion) return null;
    const progress = ((currentQuestionIdx + 1) / questions.length) * 100;
    return (
      <div className="w-full max-w-3xl">
        <div className="mb-12">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-anadaa-400">Question {currentQuestionIdx + 1} of {questions.length}</span>
            <span className="text-xs font-bold text-anadaa-700">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-anadaa-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-anadaa-700" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-10 rounded-[3rem] shadow-xl border border-anadaa-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white rounded-2xl shadow-sm">{currentQuestion.icon}</div>
              <span className="text-xs font-bold uppercase tracking-widest text-anadaa-400">{currentQuestion.category}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-anadaa-900 mb-4 leading-tight">{currentQuestion.text}</h2>
            <p className="text-xl md:text-2xl font-display font-medium text-anadaa-600 mb-10 leading-relaxed text-right dir-rtl">{currentQuestion.arabicText}</p>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Yes', value: 1, arabic: 'نعم' },
                  { label: 'No', value: 0, arabic: 'لا' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                    className={`h-20 rounded-2xl font-bold transition-all flex flex-col items-center justify-center border gap-1 ${
                      answers[currentQuestion.id] === opt.value
                        ? 'bg-anadaa-700 text-white border-anadaa-700 shadow-lg scale-105 z-10'
                        : 'bg-white text-anadaa-600 border-anadaa-100 hover:border-anadaa-300 hover:bg-anadaa-50'
                    }`}
                  >
                    <span className="text-lg">{opt.label}</span>
                    <span className="text-sm opacity-80">{opt.arabic}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-12 flex justify-between items-center">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className={`flex items-center gap-2 font-bold text-sm transition-colors ${currentQuestionIdx === 0 ? 'text-anadaa-200 cursor-not-allowed' : 'text-anadaa-600 hover:text-anadaa-900'}`}
              >
                <ChevronLeft size={20} /> Previous
              </button>
              {currentQuestionIdx === questions.length - 1 && answers[currentQuestion.id] !== undefined ? (
                <button onClick={() => setPhase('face-videos')} className="px-8 py-3 bg-anadaa-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">Next: Video Upload</button>
              ) : (
                <button
                  disabled={answers[currentQuestion.id] === undefined}
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className={`flex items-center gap-2 font-bold text-sm transition-colors ${answers[currentQuestion.id] === undefined ? 'text-anadaa-200 cursor-not-allowed' : 'text-anadaa-600 hover:text-anadaa-900'}`}
                >
                  Next <ChevronRight size={20} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderFaceVideos = () => (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6">Step 2: Facial Analysis</div>
        <h1 className="text-4xl font-display font-bold text-anadaa-900 mb-4">Upload Face Video</h1>
        <p className="text-anadaa-600 text-lg max-w-2xl mx-auto">Please upload <strong>one video</strong> showing the 3 sides of your child's face (front, left, and right) for emotional and feature analysis.</p>
      </div>

      <div className="max-w-xl mx-auto mb-12">
        <div className="glass-card p-10 rounded-3xl border border-anadaa-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
            <Camera size={32} />
          </div>
          <h3 className="text-xl font-bold text-anadaa-900 mb-4">Complete Face Recording</h3>
          <p className="text-anadaa-500 mb-2 leading-relaxed">Ensure the video clearly captures the front, then the left, and finally the right side of the child's face in one continuous clip.</p>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-8">Video files only (MP4, MOV, etc.)</p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => { setUploadTarget('face'); startCamera(); setShowCameraModal(true); }}
              className="flex-1 py-4 bg-anadaa-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 hover:bg-anadaa-800 shadow-lg"
            >
              <Camera size={20} /> Record Now
            </button>
            <button 
              onClick={() => { setUploadTarget('face'); fileInputRef.current?.click(); }}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 border ${
                faceVideo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-anadaa-200 text-anadaa-700 hover:bg-anadaa-50'
              }`}
            >
              {faceVideo ? <><CheckCircle2 size={20} /> Video Ready</> : <><Upload size={20} /> Upload File</>}
            </button>
          </div>
          {faceVideo && <p className="mt-4 text-xs text-anadaa-400 truncate w-full">{faceVideo.name} ({((faceVideo?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)</p>}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setPhase('questionnaire')} className="flex items-center gap-2 font-bold text-anadaa-600 hover:text-anadaa-900"><ChevronLeft size={20} /> Back to Questionnaire</button>
        <button 
          disabled={!faceVideo}
          onClick={() => setPhase('play-video')}
          className={`px-10 py-4 rounded-2xl font-bold shadow-lg transition-all ${
            !faceVideo ? 'bg-anadaa-200 text-anadaa-400 cursor-not-allowed' : 'bg-anadaa-900 text-white hover:bg-black'
          }`}
        >
          Next: Play Session
        </button>
      </div>
    </div>
  );

  const renderPlayVideo = () => (
    <div className="w-full max-w-3xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6">Step 3: Motion & Behavioral Analysis</div>
        <h1 className="text-4xl font-display font-bold text-anadaa-900 mb-4">Upload Motion Video</h1>
        <p className="text-anadaa-600 text-lg max-w-2xl mx-auto">Upload a video of your child's movements and play patterns. This helps our system analyze behavioral and motion markers.</p>
      </div>

      <div className="glass-card p-12 rounded-[3rem] shadow-xl border border-anadaa-100 flex flex-col items-center text-center mb-12">
        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-8">
          <Gamepad2 size={40} />
        </div>
        <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-4">Natural Play Session</h2>
        <p className="text-anadaa-500 mb-2 max-w-md leading-relaxed">A 2-3 minute recording of your child playing with toys or interacting in their usual environment.</p>
        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-10">Video files only (MP4, MOV, etc.)</p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-sm">
          <button 
            onClick={() => { setUploadTarget('play'); startCamera(); setShowCameraModal(true); }}
            className="flex-1 py-5 bg-white border border-anadaa-200 text-anadaa-700 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 hover:bg-anadaa-50"
          >
            <Camera size={24} /> Record
          </button>
          <button 
            onClick={() => { setUploadTarget('play'); fileInputRef.current?.click(); }}
            className={`flex-1 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              playVideo ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm' : 'bg-anadaa-700 text-white hover:bg-anadaa-800 shadow-lg'
            }`}
          >
            {playVideo ? <><CheckCircle2 size={24} /> Selected</> : <><Upload size={24} /> Upload</>}
          </button>
        </div>
        {playVideo && <p className="mt-4 text-xs text-anadaa-400 truncate w-full max-w-md">{playVideo.name} ({((playVideo?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)</p>}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setPhase('face-videos')} className="flex items-center gap-2 font-bold text-anadaa-600 hover:text-anadaa-900"><ChevronLeft size={20} /> Back to Face Videos</button>
        <button 
          disabled={!playVideo}
          onClick={handleCompleteBehavioralScreening}
          className={`px-10 py-4 rounded-2xl font-bold shadow-lg transition-all ${
            !playVideo ? 'bg-anadaa-200 text-anadaa-400 cursor-not-allowed' : 'bg-anadaa-900 text-white hover:bg-black'
          }`}
        >
          Complete Screening
        </button>
      </div>
    </div>
  );

  const renderEEGUpload = () => (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6">Physiology Analysis Path</div>
        <h1 className="text-4xl font-display font-bold text-anadaa-900 mb-4">Upload EEG Data</h1>
        <p className="text-anadaa-600 text-lg max-w-2xl mx-auto">Upload the three essential EEG profile files (.vhdr, .vmrk, and .dat/.eeg) for comprehensive physiological analysis.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { id: 'vhdr', label: 'Header File', ext: '.vhdr', key: 'eeg_vhdr' as const },
          { id: 'vmrk', label: 'Marker File', ext: '.vmrk', key: 'eeg_vmrk' as const },
          { id: 'data', label: 'Data File', ext: '.eeg, .dat, .csv', key: 'eeg_data' as const },
        ].map((fileSlot) => (
          <div key={fileSlot.id} className="glass-card p-6 rounded-3xl border border-anadaa-100 flex flex-col items-center text-center">
            <div className={`w-12 h-12 bg-anadaa-50 rounded-xl flex items-center justify-center text-anadaa-700 mb-4 ${eegFiles[fileSlot.id as keyof typeof eegFiles] ? 'bg-green-50 text-green-600' : ''}`}>
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-anadaa-900 mb-2">{fileSlot.label}</h3>
            <p className="text-[10px] text-anadaa-500 mb-6 uppercase font-bold tracking-widest">{fileSlot.ext}</p>
            
            <button 
              onClick={() => { setUploadTarget(fileSlot.key); fileInputRef.current?.click(); }}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                eegFiles[fileSlot.id as keyof typeof eegFiles] ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white border border-anadaa-200 text-anadaa-700 hover:bg-anadaa-50'
              }`}
            >
              {eegFiles[fileSlot.id as keyof typeof eegFiles] ? <><CheckCircle2 size={16} /> Selected</> : <><Upload size={16} /> Choose File</>}
            </button>
            
            {eegFiles[fileSlot.id as keyof typeof eegFiles] && (
              <p className="mt-3 text-[10px] text-anadaa-400 truncate w-full px-2">
                {eegFiles[fileSlot.id as keyof typeof eegFiles]?.name}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setPhase('selection')} className="flex items-center gap-2 font-bold text-anadaa-600 hover:text-anadaa-900"><ChevronLeft size={20} /> Change Method</button>
        <button 
          disabled={!eegFiles.vhdr || !eegFiles.vmrk || !eegFiles.data}
          onClick={handleEEGAnalysis}
          className={`px-10 py-4 rounded-2xl font-bold shadow-lg transition-all ${
            !eegFiles.vhdr || !eegFiles.vmrk || !eegFiles.data ? 'bg-anadaa-200 text-anadaa-400 cursor-not-allowed' : 'bg-anadaa-900 text-white hover:bg-black'
          }`}
        >
          {isUploading ? 'Preparing Analysis...' : 'Start EEG Analysis'}
        </button>
      </div>
    </div>
  );

  const renderCameraModal = () => (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      <div className="flex justify-between items-center p-6 text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <Camera className={isRecording ? "text-red-500 animate-pulse" : "text-white"} size={24} />
          <h2 className="text-xl font-bold font-display">
            {uploadTarget === 'face' ? "Face Recording" : "Motion Recording"}
          </h2>
        </div>
        {isRecording && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full font-mono text-lg font-bold shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              {formatTime(recordingTime)} / {formatTime(uploadTarget === 'face' ? 20 : 45)}
            </div>
            <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Auto-stop at limit</p>
          </div>
        )}
        <button onClick={handleCloseCameraModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 relative bg-anadaa-950 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoPreviewRef} 
          autoPlay 
          muted 
          playsInline 
          className="h-full w-full object-contain"
        />
        
        {!isRecording && chunksRef.current.length === 0 && (
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-20">
            <button 
              onClick={startRecording}
              className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center border-8 border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all group"
            >
              <div className="w-10 h-10 bg-white rounded-full group-hover:rounded-lg transition-all" />
            </button>
          </div>
        )}

        {isRecording && (
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-20">
            <button 
              onClick={stopRecording}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-8 border-white/40 shadow-2xl hover:scale-110 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg" />
            </button>
          </div>
        )}

        {!isRecording && chunksRef.current.length > 0 && (
          <div className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl mb-8 group">
              <video 
                src={URL.createObjectURL(new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'video/webm' }))}
                controls
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                Preview Recording
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Review Your Clip</h2>
              <p className="text-white/40 text-sm">Tap Use Recording if you're happy with the capture, or Re-record to try again.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={handleSaveRecording}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={24} /> Use Recording
              </button>
              <button 
                onClick={() => { chunksRef.current = []; startCamera(); }}
                className="flex-1 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw size={24} /> Re-record
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-black text-white/40 text-center text-sm font-medium z-10">
        {isRecording 
          ? "Recording in progress... Stop when you're finished." 
          : "Position your camera clearly and press the red button to start recording."}
      </div>
    </div>
  );

  const renderResults = () => {
    const result = calculateResult();
    return (
      <div className="w-full max-w-2xl glass-card p-10 rounded-[3rem] shadow-2xl text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${result.bg}`}>
          <CheckCircle2 className={result.color} size={40} />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-anadaa-400 mb-2">Screening Complete</h2>
        <h1 className={`text-4xl font-display font-bold mb-6 ${result.color}`}>{result.level}</h1>
        <p className="text-anadaa-600 text-lg leading-relaxed mb-10">{result.desc}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => {
              const childId = localStorage.getItem('child_id');
              navigate(`/analysis-report/${childId}`);
            }} 
            className="px-8 py-4 bg-anadaa-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <FileText size={20} />
            View Detailed Report
          </button>
          <button onClick={() => navigate('/')} className="px-8 py-4 bg-anadaa-700 text-white rounded-xl font-bold hover:bg-anadaa-800 transition-all shadow-lg">Back to Home</button>
          <button 
            onClick={() => {
              setAnswers({});
              setCurrentQuestionIdx(0);
              setFaceVideo(null);
              setPlayVideo(null);
              setEegFiles({});
              setApiResponse(null);
              setErrorVisible(null);
              setPhase('selection');
            }}
            className="px-8 py-4 bg-white text-anadaa-700 border border-anadaa-100 rounded-xl font-bold hover:bg-anadaa-50 transition-all"
          >
            Retake Screening
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-anadaa-50 flex flex-col">
      <nav className="p-6 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-anadaa-600 hover:text-anadaa-900 transition-colors font-medium"><ArrowLeft size={20} /> Exit</button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-anadaa-900 rounded-lg flex items-center justify-center text-white"><Brain size={18} /></div>
          <span className="font-display font-bold text-lg tracking-tight text-anadaa-900">SPECTRA</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept={uploadTarget === 'face' || uploadTarget === 'play' ? "video/*" : ".vhdr,.vmrk,.dat,.eeg,.csv,.txt,.pdf"} 
        />
        
        {errorVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <p className="font-medium">{errorVisible}</p>
              <button 
                onClick={handleRetry} 
                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Repeat size={12} /> Retry Now
              </button>
            </div>
            <button onClick={() => setErrorVisible(null)} className="p-1 hover:bg-red-100 rounded-full">
              <X size={16} />
            </button>
          </motion.div>
        )}
        
        { (isUploading || status === 'pending' || status === 'processing') && (
          <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 border-4 border-anadaa-100 border-t-anadaa-700 rounded-full animate-spin mx-auto mb-6" />
              <p className="font-bold text-xl text-anadaa-900 mb-2">
                {isUploading ? 'Uploading & Preparing Files...' : 'Analysis in Progress'}
              </p>
              
              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-anadaa-400">UPLOAD PROGRESS</span>
                    <span className="text-xs font-bold text-anadaa-900">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-anadaa-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-anadaa-700"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-anadaa-400 font-medium">
                    Please do not close this window while files are transmitting.
                  </p>
                </div>
              )}

              <p className="text-anadaa-600 leading-relaxed text-sm">
                {isUploading 
                  ? 'Your data is being securely transmitted to our neural engine. The speed depends on your file size and internet connection.' 
                  : (status === 'pending' || status === 'processing') 
                    ? 'The multi-modal analysis process has started. This usually takes between 3 to 5 minutes to complete the deep neural mapping.' 
                    : 'Processing analysis...'}
              </p>
              {(status === 'pending' || status === 'processing') && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex gap-3 text-left">
                    <Info className="text-blue-500 shrink-0" size={18} />
                    <p className="text-xs text-blue-700">
                      You can navigate away or check the <strong>Analysis Report</strong> section later. The report will update automatically once finished.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showCameraModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
            >
              {renderCameraModal()}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center"
          >
            {phase === 'selection' && renderSelection()}
            {phase === 'questionnaire' && renderQuestionnaire()}
            {phase === 'face-videos' && renderFaceVideos()}
            {phase === 'play-video' && renderPlayVideo()}
            {phase === 'eeg-upload' && renderEEGUpload()}
            {phase === 'results' && renderResults()}
          </motion.div>
        </AnimatePresence>

        {phase !== 'selection' && phase !== 'results' && (
          <div className="mt-8 flex items-start gap-3 p-4 bg-anadaa-100/50 rounded-2xl border border-anadaa-100 max-w-3xl w-full">
            <Info className="text-anadaa-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-anadaa-500 leading-relaxed">
              <strong>Multi-Modal Analysis:</strong> SPECTRA uses a combination of behavioral data, facial feature analysis, and neural markers to provide a comprehensive screening. This tool is for preliminary screening and does not replace clinical diagnosis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ASDDetection;
