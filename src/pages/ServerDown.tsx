import React from 'react';
import { motion } from 'motion/react';
import { ServerOff, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServerDown: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-anadaa-50 flex items-center justify-center p-6 selection:bg-anadaa-900 selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-anadaa-100 text-center"
      >
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ServerOff size={40} />
        </div>
        
        <h1 className="font-display text-3xl font-bold text-anadaa-900 mb-4">
          Server Unavailable
        </h1>
        
        <p className="text-anadaa-600 leading-relaxed mb-10">
          The server is currently unavailable. We are working to fix the issue. Please try again later.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-anadaa-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 group"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-anadaa-50 text-anadaa-700 rounded-2xl font-bold hover:bg-anadaa-100 transition-all active:scale-95"
          >
            <Home size={18} />
            Go to Home
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-anadaa-50">
          <p className="text-[10px] text-anadaa-400 font-bold uppercase tracking-widest leading-loose">
            Error Code: SERVER_CONNECTION_TIMEOUT<br/>
            Secure TLS Handshake Failed
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ServerDown;
