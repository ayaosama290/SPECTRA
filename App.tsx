import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import ASDDetection from './src/pages/ASDDetection';
import ADHDDetection from './src/pages/ADHDDetection';
import ChildProfile from './src/pages/ChildProfile';
import AnalysisReport from './src/pages/AnalysisReport';
import UserProfile from './src/pages/UserProfile';
import ServerDown from './src/pages/ServerDown';
import { Brain, Activity, Shield, Info, ArrowRight, Menu, X, Heart, Sparkles, CheckCircle2, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from './src/lib/api';
import heroImage from './src/assets/images/neurodiversity_hero_1782582600575.jpg';

const Home: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    
    if (token) {
      fetchChildren();
    }
  }, []);

  const fetchChildren = async () => {
    setLoadingChildren(true);
    try {
      let data: any[] = [];
      let apiSuccess = false;
      try {
        const response = await api.get('/api/children/');
        data = Array.isArray(response.data) ? response.data : [];
        apiSuccess = true;
      } catch (err) {
        console.warn('[App] Backend children API returned error, relying on local backup:', err);
      }
      
      let finalChildrenList: any[] = [];
      if (apiSuccess) {
        finalChildrenList = data.filter((c: any) => {
          const cId = String(c.child_id || c.id || c.pk || '').toUpperCase();
          return cId !== 'CHLD-0CGRKV';
        });
      } else {
        const localChildrenStr = localStorage.getItem('local_children');
        const localChildren = localChildrenStr ? JSON.parse(localChildrenStr) : [];
        finalChildrenList = localChildren.filter((lc: any) => {
          const lcId = String(lc.child_id || lc.id || lc.pk || '').toUpperCase();
          return lcId !== 'CHLD-0CGRKV';
        });
      }

      setChildren(finalChildrenList);
      if (finalChildrenList.length > 0) {
        // If there's already a child_id in localStorage, prefer it, otherwise select the first one
        const savedChildId = localStorage.getItem('child_id');
        const found = savedChildId ? finalChildrenList.find((c: any) => 
          String(c.id) === String(savedChildId) || 
          String(c.child_id) === String(savedChildId)
        ) : null;

        if (found) {
          const finalId = found.child_id || found.id;
          setSelectedChildId(finalId.toString());
        } else {
          const bestId = finalChildrenList[0].child_id || finalChildrenList[0].id;
          setSelectedChildId(bestId.toString());
          localStorage.setItem('child_id', bestId.toString());
        }
      }
    } catch (err) {
      console.error('Error in fetchChildren logic:', err);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleChildSelect = (id: string) => {
    setSelectedChildId(id);
    localStorage.setItem('child_id', id);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('child_id');
    setIsLoggedIn(false);
    navigate('/');
  };

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-anadaa-50 font-sans selection:bg-anadaa-900 selection:text-white">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-anadaa-200 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-anadaa-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Brain size={24} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-anadaa-900">SPECTRA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-tight text-anadaa-600">
            <a href="#about" onClick={scrollToSection('about')} className="hover:text-anadaa-900 transition-colors uppercase text-xs">About</a>
            <a href="#features" onClick={scrollToSection('features')} className="hover:text-anadaa-900 transition-colors uppercase text-xs">Features</a>
            <a href="#resources" onClick={scrollToSection('resources')} className="hover:text-anadaa-900 transition-colors uppercase text-xs">Start Detection</a>
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => navigate('/profile')}
                  className="hover:text-anadaa-900 transition-colors uppercase text-xs font-bold flex items-center gap-1"
                >
                  <UserIcon size={14} /> Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="hover:text-red-600 transition-colors uppercase text-xs font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-anadaa-900 transition-colors uppercase text-xs">Login</Link>
            )}
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-anadaa-700 text-white rounded-full hover:bg-anadaa-800 transition-all shadow-md hover:shadow-lg active:scale-95 text-xs font-bold"
            >
              Dashboard
            </button>
          </div>

          <button className="md:hidden text-anadaa-900" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-8 text-2xl font-display animate-fade-in">
            <a href="#about" onClick={scrollToSection('about')} className="hover:text-anadaa-900 transition-colors uppercase">About</a>
            <a href="#features" onClick={scrollToSection('features')} className="hover:text-anadaa-900 transition-colors uppercase">Features</a>
            <a href="#resources" onClick={scrollToSection('resources')} className="hover:text-anadaa-900 transition-colors uppercase">Start Detection</a>
            {isLoggedIn ? (
              <>
                <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className="hover:text-anadaa-900 transition-colors uppercase">Profile</button>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="hover:text-red-600 transition-colors uppercase">Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-anadaa-900 transition-colors uppercase">Login</Link>
            )}
            <button 
              onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}
              className="px-8 py-4 bg-anadaa-700 text-white rounded-full shadow-xl"
            >
              Dashboard
            </button>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-anadaa-100/50 -skew-x-12 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-anadaa-200/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-anadaa-100 text-anadaa-600 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
                <Sparkles size={14} /> Neurodiversity Support
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-anadaa-900 leading-[1.1] mb-6">
                Understand Your <span className="text-anadaa-500 italic">Unique</span> Mind.
              </h1>
              <p className="text-lg md:text-xl text-anadaa-600 font-light leading-relaxed mb-10 max-w-lg">
                SPECTRA (Screening Platform for Early Childhood Tracking and Risk Assessment) provides professional-grade screening for ASD and ADHD, helping professionals and parents to navigate their children's neurodivergent journey with clarity and empathy.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary flex items-center gap-2"
                >
                  Go to Dashboard <ArrowRight size={18} />
                </button>
                <a href="#about" onClick={scrollToSection('about')} className="btn-secondary">
                  Learn More
                </a>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
                <img 
                  src={heroImage} 
                  alt="Neurodiversity Illustration" 
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Decorative floating cards */}
              <div className="absolute -top-6 -right-6 glass-card p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '4s' }}>
                <Brain className="text-anadaa-900" size={32} />
              </div>
              <div className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <Heart className="text-red-400" size={32} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-anadaa-900 mb-6">Why SPECTRA?</h2>
              <p className="text-lg text-anadaa-600 leading-relaxed">
                This website was created by a group of college students to help parents and doctors detect whether their child has ADHD or ASD, as the detection process often takes a significant amount of time. Our goal is to provide accessible, early-screening tools to accelerate the path to support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="text-anadaa-900" />,
                  title: "Privacy First",
                  desc: "Your data is yours. We use industry-standard encryption to ensure your assessment remains private and secure."
                },
                {
                  icon: <Activity className="text-anadaa-900" />,
                  title: "Evidence Based",
                  desc: "Our screening tools are developed based on established clinical criteria for ASD and ADHD indicators."
                },
                {
                  icon: <Heart className="text-anadaa-900" />,
                  title: "Empathetic Design",
                  desc: "Designed with neurodivergent users in mind—minimal distractions, clear instructions, and a calm interface."
                }
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-3xl border border-anadaa-100 hover:border-anadaa-300 transition-all hover:shadow-lg bg-anadaa-50/50">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                    {item?.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl text-anadaa-900 mb-4">{item.title}</h3>
                  <p className="text-anadaa-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-anadaa-900 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="w-96 h-96 rounded-full bg-anadaa-400 blur-[100px] absolute -top-48 -left-48" />
            <div className="w-96 h-96 rounded-full bg-anadaa-600 blur-[100px] absolute -bottom-48 -right-48" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
                  Advanced <br/>Detection Features
                </h2>
                <p className="text-anadaa-300 mb-8 text-lg">Our website has different features and options which include:</p>
                <div className="space-y-6">
                  {[
                    "ADHD detection using EEG signal analysis",
                    "ASD assessment through EEG-based patterns",
                    "Emotion recognition for ASD detection",
                    "Motion analysis to identify ASD-related patterns"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-anadaa-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="text-anadaa-300" />
                      </div>
                      <span className="text-lg text-anadaa-200">{feature}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/child-profile')}
                  className="mt-12 px-8 py-4 bg-white text-anadaa-900 rounded-full font-bold hover:bg-anadaa-100 transition-all shadow-xl"
                >
                  Start My Journey
                </button>
              </div>
              <div className="relative">
                <div className="aspect-video bg-anadaa-800 rounded-3xl border border-anadaa-700 shadow-2xl overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/calm/1200/800" 
                    alt="Calm Environment" 
                    className="w-full h-full object-cover opacity-60"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 glass-card rounded-2xl text-anadaa-900 max-w-xs text-center">
                      <Info className="mx-auto mb-4" />
                      <p className="font-medium">"Empowering families with advanced multi-modal screening for early neurodiversity detection."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start Detection Section */}
        <section id="resources" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-xl">
                <h2 className="font-display text-4xl font-bold text-anadaa-900 mb-4">Start Your Detection</h2>
                <p className="text-anadaa-600">Select a category below to begin the preliminary screening process for your child.</p>
              </div>
            </div>

            {isLoggedIn && (
              <div className="max-w-4xl mx-auto mb-16">
                <div className="flex items-center gap-3 mb-8 px-4">
                  <div className="p-2 bg-anadaa-900 text-white rounded-xl">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-anadaa-900">Select Child Profile</h3>
                    <p className="text-sm text-anadaa-500">Pick the child to run analysis for</p>
                  </div>
                </div>

                {loadingChildren ? (
                  <div className="flex items-center gap-3 p-8 glass-card rounded-[2.5rem] justify-center">
                    <Loader2 size={24} className="animate-spin text-anadaa-400" />
                    <span className="font-bold text-anadaa-400">Loading profiles...</span>
                  </div>
                ) : children.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                    {children.map((child) => (
                      <button
                        key={child.id || child.child_id}
                        onClick={() => handleChildSelect((child.child_id || child.id).toString())}
                        className={`p-6 rounded-[2rem] transition-all flex flex-col items-center gap-3 border-2 text-center group ${
                          selectedChildId === (child.child_id || child.id).toString()
                            ? 'bg-anadaa-900 border-anadaa-900 shadow-xl scale-105'
                            : 'bg-white border-anadaa-100 hover:border-anadaa-300'
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold transition-colors ${
                          selectedChildId === (child.child_id || child.id).toString() 
                            ? 'bg-white/20 text-white' 
                            : 'bg-anadaa-50 text-anadaa-900 group-hover:bg-anadaa-100'
                        }`}>
                          {(child.first_name?.[0] || child.basic_info?.full_name?.[0] || child.full_name?.[0] || 'C')}
                          {(child.last_name?.[0] || child.basic_info?.full_name?.split(' ').pop()?.[0] || '')}
                        </div>
                        <span className={`font-bold text-sm truncate w-full ${
                          selectedChildId === (child.child_id || child.id).toString() ? 'text-white' : 'text-anadaa-900'
                        }`}>
                          {child.first_name || child.basic_info?.full_name || child.full_name} {child.last_name || ''}
                        </span>
                        {selectedChildId === (child.child_id || child.id).toString() && (
                          <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-tighter">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => navigate('/child-profile')}
                      className="p-6 rounded-[2rem] border-2 border-dashed border-anadaa-200 hover:border-anadaa-400 hover:bg-anadaa-50 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-anadaa-50 flex items-center justify-center text-anadaa-400 group-hover:scale-110 transition-transform">
                        <UserIcon size={24} />
                      </div>
                      <span className="font-bold text-xs text-anadaa-400 uppercase tracking-widest">Add New</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-10 glass-card rounded-[2.5rem] text-center border-2 border-dashed border-anadaa-200">
                    <div className="w-16 h-16 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle size={32} />
                    </div>
                    <h4 className="text-xl font-display font-bold text-anadaa-900 mb-2">No Profiles Found</h4>
                    <p className="text-anadaa-500 mb-8 max-w-xs mx-auto text-sm">Please create at least one child profile to start using the detection features.</p>
                    <button 
                      onClick={() => navigate('/child-profile')}
                      className="px-8 py-4 bg-anadaa-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
                    >
                      Create Child Profile
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isLoggedIn && (
              <div className="max-w-4xl mx-auto mb-12 p-8 glass-card rounded-[2.5rem] border border-anadaa-100 bg-anadaa-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-display font-bold mb-2">Ready to start?</h3>
                  <p className="text-anadaa-300">You need to be logged in to create child profiles and save analysis results.</p>
                </div>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white text-anadaa-900 rounded-2xl font-bold hover:bg-anadaa-100 transition-all shadow-xl whitespace-nowrap"
                >
                  Login to SPECTRA
                </button>
              </div>
            )}

            <div className={`grid md:grid-cols-2 gap-8 max-w-4xl mx-auto ${(!isLoggedIn || (children.length === 0 && !loadingChildren)) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              {[
                {
                  title: "Start ASD Detection",
                  category: "Autism Spectrum Disorder",
                  type: 'asd',
                  image: "https://picsum.photos/seed/asd/600/400",
                  color: "bg-anadaa-600"
                },
                {
                  title: "Start ADHD Detection",
                  category: "Attention-Deficit/Hyperactivity Disorder",
                  type: 'adhd',
                  image: "https://picsum.photos/seed/work/600/400",
                  color: "bg-accent-600"
                }
              ].map((post, i) => (
                <div 
                  key={i} 
                  className="group cursor-pointer"
                  onClick={() => {
                    if (post.type === 'asd') {
                      navigate('/asd-detection');
                    } else if (post.type === 'adhd') {
                      navigate('/adhd-detection');
                    }
                  }}
                >
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6 relative shadow-lg group-hover:shadow-xl transition-all">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity`} />
                    <div className={`absolute top-4 left-4 px-3 py-1 ${post.color} text-white rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                      {post.category}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <div className="flex items-center gap-2 text-white font-bold text-lg">
                         {post.title} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {(() => {
              const selectedChild = children.find(c => (c.child_id || c.id).toString() === selectedChildId);
              const name = selectedChild?.first_name || selectedChild?.basic_info?.full_name || selectedChild?.full_name || 'Selected Child';
              return (
                <p className="mt-8 text-center text-xs text-anadaa-400 font-bold uppercase tracking-widest">
                  Running detection for: <span className="text-anadaa-900">{name}</span>
                </p>
              );
            })()}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-anadaa-50 border-t border-anadaa-200 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-anadaa-900 rounded-lg flex items-center justify-center text-white">
                  <Brain size={18} />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-anadaa-900">SPECTRA</span>
              </div>
              <p className="text-anadaa-500 max-w-sm leading-relaxed">
                Empowering individuals through accessible neurodiversity screening and education. Join us in celebrating the unique way every brain works.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-anadaa-900 mb-6 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-4 text-anadaa-500 text-sm">
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Child Profile</a></li>
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-anadaa-900 mb-6 uppercase text-xs tracking-widest">Connect</h4>
              <ul className="space-y-4 text-anadaa-500 text-sm">
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-anadaa-900 transition-colors">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-anadaa-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-anadaa-400 uppercase tracking-widest">
            <span>© 2026 SPECTRA. All rights reserved.</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-anadaa-900">Twitter</a>
              <a href="#" className="hover:text-anadaa-900">LinkedIn</a>
              <a href="#" className="hover:text-anadaa-900">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/asd-detection" element={<ASDDetection />} />
        <Route path="/adhd-detection" element={<ADHDDetection />} />
        <Route path="/child-profile" element={<ChildProfile />} />
        <Route path="/analysis-report/:childId" element={<AnalysisReport />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/server-down" element={<ServerDown />} />
      </Routes>
    </Router>
  );
};

const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <Login onBack={() => navigate('/')} />;
};

export default App;
