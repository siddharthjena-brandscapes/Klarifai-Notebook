import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo1 from '../assets/Logo1.png';
import img1 from '../assets/1.png';
import img2 from '../assets/2.png';
import img3 from '../assets/3.png';
import img4 from '../assets/4.png';
import img5 from '../assets/5.png';
import img6 from '../assets/6.png';
import img7 from '../assets/7.png';
import img8 from '../assets/8.png';
import img9 from '../assets/9.png';
import img10 from '../assets/10.png';
import img11 from '../assets/11.png';
import img12 from '../assets/12.png';
import img13 from '../assets/13.png';
import img14 from '../assets/14.png';
import img15 from '../assets/15.png';
import img16 from '../assets/16.png';
import img17 from '../assets/17.png';
import img18 from '../assets/18.png';
import img19 from '../assets/19.png';
import img20 from '../assets/20.png';
import img21 from '../assets/21.png';
import img22 from '../assets/22.png';
import img23 from '../assets/23.png';
import img24 from '../assets/24.png';
import brandScarpeLogo from '../assets/brand-scarpes-logo.png';
import { 
  Brain, 
  FileText, 
  Lightbulb, 
  Upload, 
  MessageCircle, 
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Instagram,
  Linkedin,
  ArrowRight,
  TrendingUp,
  Target,
  ShieldCheck ,
  Workflow,
  Mail
} from 'lucide-react';

// FlipCard component
const flipImages = [
  [img1, img2, img3, img4, img5, img6],
  [img7, img8, img9, img10, img11, img12],
  [img13, img14, img15, img16, img17, img18],
  [img19, img20, img21, img22, img23, img24],
];

function FlipCard({ images }: { images: string[] }) {
  const [flipped, setFlipped] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlipped(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length);
        setFlipped(false);
      }, 800); // flip duration
    }, 2500 + Math.random() * 1500); // randomize interval a bit
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="flip-card aspect-square rounded-lg overflow-hidden" style={{ perspective: 1000 }}>
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        <div className="flip-card-front w-full h-full">
          <img src={images[current]} alt="AI Idea" className="object-cover w-full h-full" />
        </div>
        <div className="flip-card-back w-full h-full">
          <img src={images[(current + 1) % images.length]} alt="AI Idea" className="object-cover w-full h-full" />
        </div>
      </div>
    </div>
  );
}

// ChatAnimation component for smooth infinite chat animation
function ChatAnimation() {
  const messages = [
    { text: "Hi KlarifAI, can you summarize this document?", from: "user" },
    { text: "Of course! Here's a concise summary:", from: "ai" },
    { text: "Thanks! Can you generate a mind map?", from: "user" },
    { text: "Mind map generated. Would you like to add notes?", from: "ai" },
    { text: "Yes, please add key insights.", from: "user" },
    { text: "Key insights added. Anything else?", from: "ai" },
    { text: "Can you extract key themes from this report?", from: "user" },
    { text: "Key themes identified: Innovation, Market Trends, Consumer Insights.", from: "ai" },
    { text: "Show me related charts and graphs.", from: "user" },
    { text: "Here are the most relevant charts and graphs.", from: "ai" },
    { text: "Can you create a summary for the executive team?", from: "user" },
    { text: "Executive summary created. Would you like to export it?", from: "ai" },
    { text: "Export as PDF please.", from: "user" },
    { text: "PDF exported. Anything else I can help with?", from: "ai" },
  ];
  const [startIdx, setStartIdx] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setStartIdx((prev) => (prev + 1) % messages.length);
        setIsTransitioning(false);
      }, 350); // Half of the transition duration
    }, 1800);
    return () => clearInterval(interval);
  }, [messages.length]);
  
  // Show 4 messages at a time, wrapping around
  const visible = [0,1,2,3].map(i => (startIdx + i) % messages.length);
  
  return (
    <div className="flex flex-col gap-3 h-44 justify-end">
      {visible.map((i, index) => {
        const msg = messages[i];
        const isUser = msg.from === "user";
        const isOldest = index === 0;
        
        return (
          <div
            key={i}
            className={`flex w-full transition-all duration-700 ${isUser ? "justify-start" : "justify-end"} ${
              isTransitioning && isOldest ? "animate-fade-out" : "animate-fade-in"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl text-sm max-w-xs shadow-lg ${
                isUser
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-gradient-to-r from-slate-700 to-slate-900 text-blue-200 border border-blue-500/30"
              }`}
              style={{ opacity: 0.95 }}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
      
    </div>
  );
}

// Animated Background Component
const AnimatedBackground = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
  }>>([]);

  const [connections, setConnections] = useState<Array<{
    id: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    // Initialize particles
    const initialParticles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(initialParticles);

    let animationId: number;

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;

        // Bounce off edges
        if (newX <= 0 || newX >= window.innerWidth) {
          particle.speedX *= -1;
        }
        if (newY <= 0 || newY >= window.innerHeight) {
          particle.speedY *= -1;
        }

        newX = Math.max(0, Math.min(window.innerWidth, newX));
        newY = Math.max(0, Math.min(window.innerHeight, newY));

        return { ...particle, x: newX, y: newY };
      }));

      animationId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Update connections based on current particles
  useEffect(() => {
    const updateConnections = () => {
      const newConnections: typeof connections = [];
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120 && newConnections.length < 30) {
            newConnections.push({
              id: i * 1000 + j,
              x1: particles[i].x,
              y1: particles[i].y,
              x2: particles[j].x,
              y2: particles[j].y,
              opacity: Math.max(0, (120 - distance) / 120) * 0.4,
            });
          }
        }
      }
      setConnections(newConnections);
    };

    if (particles.length > 0) {
      updateConnections();
    }
  }, [particles]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Neural Network Connections */}
      <svg className="absolute inset-0 w-full h-full">
        {connections.map(connection => (
          <line
            key={connection.id}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke="url(#neuralGradient)"
            strokeWidth="1.5"
            opacity={connection.opacity}
            className="neural-connection"
          />
        ))}
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 particle-glow"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 3}px rgba(59, 130, 246, 0.6), 0 0 ${particle.size * 6}px rgba(139, 92, 246, 0.3)`,
          }}
        />
      ))}

      

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-blue-950/50 to-purple-950/70" />
    </div>
  );
};

// Scroll Reveal Hook
const useScrollReveal = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-reveal class
    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

function WelcomeScreen() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logo1} alt="KlarifAI Logo" className="w-30 h-10 object-contain rounded-lg" />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('modules')}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Modules
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Contact
              </button>
              <button
  className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg ..."
  onClick={handleGetStarted}
>
  Get Started
</button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-white"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
            <div className="px-4 py-4 space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="block text-slate-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('modules')}
                className="block text-slate-300 hover:text-white transition-colors"
              >
                Modules
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block text-slate-300 hover:text-white transition-colors"
              >
                Contact
              </button>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* AI Animated Background */}
        <div className="absolute inset-0 z-0">
          <AnimatedBackground />
        </div>
        <div
          className="relative z-10 w-full"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  From Knowledge to Impact
                </span> 
                <br />
                {/* <span className="text-white">AI insight command center</span> */}
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-white">AI insight command center</h2>
              
              <p className="text-lg sm:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                One modular platform, infinite AI possibilities.
                <br/>
                Tailored for unique intelligence needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <button className="group bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                onClick={handleGetStarted}>
                  Start Creating
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 rounded-xl text-lg font-semibold border border-slate-600 hover:border-slate-400 transition-all duration-300 backdrop-blur-sm hover:bg-slate-800/50">
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="animate-bounce">
              <ChevronDown 
                className="w-10 h-10 text-slate-400 mx-auto cursor-pointer hover:text-white transition-colors"
                onClick={() => scrollToSection('features')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose KlarifAI?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the future of AI-powered productivity combined with our legacy domain Knowledge designed for consumer insights, innovation and marketing analytics teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck , title: "Secure & Private", desc: "Your data is protected with enterprise-grade security" },
              { icon: Target, title: "Need-based use cases", desc: "Customized workstreams tailored to your project & analysis needs" },
              { icon: TrendingUp, title: "Insights deep dives", desc: "Drive strategic & tactical depth through comprehensive analyses" },
              // { icon: Workflow, title: "Smart Integration", desc: "Connect with your favorite tools and workflows" }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 scroll-reveal opacity-0 translate-y-8"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-300 group-hover:text-slate-200 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Powerful AI Modules
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Two revolutionary modules designed to transform how you work with documents and ideas.
            </p>
          </div>

          <div className="space-y-20">
            {/* KlarifAI Notebook */}
            <div className="flex flex-col lg:flex-row items-center gap-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">KlarifAI Notebook</h3>
                </div>
                
                <p className="text-xl text-slate-300 leading-relaxed">
                  Transform your documents into intelligent conversations. Upload any document and engage with your content through our agentic RAG-powered chatbot, just like Google's NotebookLM but more powerful.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Upload, text: "Document Upload & Processing" },
                    { icon: MessageCircle, text: "Intelligent Q&A Chatbot" },
                    { icon: Brain, text: "Mind Map Generation" },
                    { icon: FileText, text: "Smart Note-Taking" }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <feature.icon className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-200">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleGetStarted} className="group bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                  Try Notebook
                  <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex-1 ">
                <div className="relative">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
                    <div className="space-y-4">
                      <ChatAnimation />
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Idea Generator */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Idea Generator</h3>
                </div>
                
                <p className="text-xl text-slate-300 leading-relaxed">
                  Transform your product concepts into visual reality. Input your ideas, generate unlimited variations, and create stunning AI-generated images to bring your concepts to life.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Lightbulb, text: "Idea Input & Analysis" },
                    { icon: Sparkles, text: "Variation Generation" },
                    { icon: Brain, text: "AI Image Creation" },
                    { icon: Workflow, text: "Export & Share" }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-slate-200">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleGetStarted} className="group bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                  Generate Ideas
                  <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex-1">
                <div className="relative">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                    <div className="space-y-4">
                      <div className="h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded w-2/3"></div>
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        {flipImages.map((images, i) => (
                          <FlipCard key={i} images={images} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Transform Your Workstreams?
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join thousands of consumer & marketing insights professionals who are already using KlarifAI to reduce time to insights and drive action to impact.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={handleGetStarted} className="group bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              Get Started Free
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 rounded-xl text-lg font-semibold border border-slate-600 hover:border-slate-400 transition-all duration-300 backdrop-blur-sm hover:bg-slate-800/50">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="space-y-4 flex-1">
              <div className="flex items-center space-x-3">
                <img src={logo1} alt="KlarifAI Logo" className="w-30 h-10 object-contain rounded-lg" />
              </div>
              <p className="text-slate-400 max-w-sm">
                Empowering creativity and productivity through intelligent AI solutions.
              </p>
              <div className="flex space-x-4">
                <a href="mailto:contact@brand-scapes.com" className="text-slate-400 hover:text-white transition-colors" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/brandscapesworldwide/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/company/brandscapes-worldwide" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-end justify-center space-y-2 md:items-end md:justify-center md:pl-12">
              <span className="text-slate-400 font-semibold mb-2">Powered by:</span>
              <img src={brandScarpeLogo} alt="Powered by Brandscapes" className="w-33 h-6 object-contain rounded-lg mb-1 md:mb-0" />
            </div>
          </div>
          <div className="mt-10 flex justify-center items-center w-full">
            <p className="text-slate-400 text-center w-full">
              © 2025 KlarifAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default WelcomeScreen;