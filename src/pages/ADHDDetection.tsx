import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, ArrowLeft, Upload, FileText, CheckCircle2, X, Info, AlertCircle, Loader2, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const ADHDDetection: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'upload' | 'results'>('upload');
  const [apiResponse, setApiResponse] = useState<any>(null);

  const [lastFile, setLastFile] = useState<File | null>(null);

  const startAnalysis = async (file: File) => {
    const childId = localStorage.getItem('child_id');
    if (!childId) {
      setError('Please create a child profile first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setFileName(file.name);
    setLastFile(file);

    const formData = new FormData();
    formData.append('eeg_csv', file);
    formData.append('eeg_file', file);
    formData.append('file', file);
    formData.append('pdf_file', file);
    formData.append('child', childId);
    formData.append('child_id', childId);

    // Automatic Retry Helper
    const submitWithRetry = async (fn: () => Promise<any>, maxRetries = 5) => {
      let lastErr;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fn();
          
          if (response?.data && typeof response.data === 'string' && (response.data.includes('<!doctype html>') || response.data.includes('<html'))) {
            console.warn(`[ADHDDetection] Warmup/HTML response detected on attempt ${i + 1}. Retrying...`);
            throw new Error('SERVER_WARMUP');
          }
          
          return response;
        } catch (err: any) {
          lastErr = err;
          if (err.response?.status && err.response.status >= 400 && err.response.status < 500 && err.response.status !== 429) {
            throw err;
          }
          console.warn(`ADHD Submission attempt ${i + 1} failed, retrying...`, err.message || err);
          if (i < maxRetries - 1) {
            const delay = Math.pow(2, i + 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastErr;
    };

    try {
      const response = await submitWithRetry(() => api.post(`/api/reports/adhd/${childId}/`, formData, {
        timeout: 1800000, 
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      }));

      if (response.data) {
        setIsUploading(false);
        navigate(`/analysis-report/${childId}`);
      }
    } catch (err: any) {
      console.error('ADHD API Error:', err);
      let errorMsg = 'Failed to upload ADHD data. Please try again.';
      
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
      
      setError(errorMsg);
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation for supported clinical formats
      const allowedExtensions = ['.pdf', '.csv', '.txt'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension) && !file.type.includes('pdf') && !file.type.includes('csv')) {
        setError('Please upload clinical data in PDF, CSV, or TXT format. Video files are not supported for ADHD analysis.');
        return;
      }
      
      await startAnalysis(file);
    }
  };

  const handleRetry = () => {
    if (lastFile) {
      startAnalysis(lastFile);
    }
  };

  const renderResults = () => {
    const isHigh = apiResponse?.risk_level === 'HIGH' || apiResponse?.ai_full_response?.risk_level === 'HIGH';
    const riskMessage = apiResponse?.recommendation || apiResponse?.ai_full_response?.risk_message || "Analysis is currently in progress. Please check back shortly for full results.";

    return (
      <div className="w-full max-w-2xl glass-card p-10 rounded-[3rem] shadow-2xl text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isHigh ? 'bg-red-50 text-red-600' : (apiResponse?.risk_level ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600')}`}>
          {isHigh ? <AlertCircle size={40} /> : (apiResponse?.risk_level ? <CheckCircle2 size={40} /> : <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />)}
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-anadaa-400 mb-2">Screening Complete</h2>
        <h1 className={`text-4xl font-display font-bold mb-6 ${isHigh ? 'text-red-600' : (apiResponse?.risk_level ? 'text-green-600' : 'text-blue-600')}`}>
          {apiResponse?.risk_level ? (isHigh ? 'High Risk' : 'Low Risk') : 'Analysis in Progress'}
        </h1>
        <p className="text-anadaa-600 text-lg leading-relaxed mb-10">{riskMessage}</p>
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
          <button onClick={() => navigate('/')} className="px-8 py-4 bg-white text-anadaa-700 border border-anadaa-100 rounded-xl font-bold hover:bg-anadaa-50 transition-all">Back to Home</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-anadaa-50 flex flex-col">
      <nav className="p-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-anadaa-600 hover:text-anadaa-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Exit
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-anadaa-900 rounded-lg flex items-center justify-center text-white">
            <Brain size={18} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-anadaa-900">SPECTRA</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex justify-center"
        >
          {phase === 'upload' ? (
            <div className="w-full max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 text-accent-700 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
                  ADHD Data Analysis
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-anadaa-900 mb-4">
                  ADHD Detection
                </h1>
                <p className="text-anadaa-600 text-lg max-w-2xl mx-auto">
                  To begin the ADHD detection process, please upload your child's clinical data. Our system analyzes EEG signals and medical reports to identify neurodivergent markers.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={18} />
                      <p className="font-medium">{error}</p>
                      <button 
                        onClick={handleRetry} 
                        className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Repeat size={12} /> Retry Now
                      </button>
                    </div>
                    <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-full">
                      <X size={16} />
                    </button>
                  </div>
                )}
                {/* Upload Data Section */}
                <div className="glass-card p-10 rounded-[3rem] shadow-xl border border-anadaa-100 flex flex-col items-center text-center group hover:border-anadaa-300 transition-all">
                  <div className="w-20 h-20 bg-anadaa-100 rounded-2xl flex items-center justify-center text-anadaa-700 mb-8 group-hover:scale-110 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-anadaa-900 mb-4">Upload Clinical Data</h2>
                  <p className="text-anadaa-500 mb-10 text-lg">
                    Please provide EEG signals, medical reports, or clinical observations in PDF or CSV format. This data is essential for our specialized ADHD analysis.
                  </p>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept=".pdf,.csv,.txt"
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || uploadComplete}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                      uploadComplete 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : isUploading
                          ? 'bg-anadaa-100 text-anadaa-400 cursor-not-allowed'
                          : 'bg-anadaa-700 text-white hover:bg-anadaa-800 shadow-lg'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading {uploadProgress}%
                      </>
                    ) : uploadComplete ? (
                      <>
                        <CheckCircle2 size={24} /> Analysis Complete
                      </>
                    ) : (
                      <>
                        <Upload size={24} /> Select Clinical Files
                      </>
                    )}
                  </button>

                  {uploadComplete && fileName && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-3 text-sm font-medium text-anadaa-600 bg-anadaa-50 px-4 py-3 rounded-xl w-full border border-anadaa-100"
                    >
                      <FileText size={18} className="text-anadaa-400" />
                      <span className="truncate flex-1 text-left">{fileName}</span>
                      <button onClick={() => setUploadComplete(false)} className="hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-12 flex items-start gap-4 p-6 bg-white rounded-3xl border border-anadaa-100 shadow-sm max-w-2xl mx-auto">
                <div className="p-2 bg-anadaa-50 rounded-lg text-anadaa-600">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-anadaa-900 mb-1">Privacy & Security</h4>
                  <p className="text-sm text-anadaa-500 leading-relaxed">
                    All uploaded data is encrypted and used solely for the purpose of this preliminary screening. We do not share your child's medical information with third parties. This tool is intended to assist in early detection and is not a replacement for professional medical advice.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            renderResults()
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ADHDDetection;
