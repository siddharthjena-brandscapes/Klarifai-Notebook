import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo1 from "../assets/Logo1.png";
import img1 from "../assets/1.png";
import img2 from "../assets/2.png";
import img3 from "../assets/3.png";
import img4 from "../assets/4.png";
import img5 from "../assets/5.png";
import img6 from "../assets/6.png";
import img7 from "../assets/7.png";
import img8 from "../assets/8.png";
import img9 from "../assets/9.png";
import img10 from "../assets/10.png";
import img11 from "../assets/11.png";
import img12 from "../assets/12.png";
import img13 from "../assets/13.png";
import img14 from "../assets/14.png";
import img15 from "../assets/15.png";
import img16 from "../assets/16.png";
import img17 from "../assets/17.png";
import img18 from "../assets/18.png";
import img19 from "../assets/19.png";
import img20 from "../assets/20.png";
import img21 from "../assets/21.png";
import img22 from "../assets/22.png";
import img23 from "../assets/23.png";
import img24 from "../assets/24.png";
import brandScarpeLogo from "../assets/brand-scarpes-logo.png";
import LoginForm from "./auth/LoginForm";
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
  ShieldCheck,
  Workflow,
  Mail,
  Play,
} from "lucide-react";
import FaqButton from "./faq/FaqButton";
// Video Modal Component

const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setIsLoading(true);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close video"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video Container */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-lg">Loading demo...</p>
              </div>
            </div>
          )}

          {/* Video Element */}
          <video
            className="w-full h-auto max-h-[80vh]"
            controls
            autoPlay
            onLoadedData={handleVideoLoad}
            onError={() => setIsLoading(false)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Info */}
        <div className="mt-4 text-center">
          <h3 className="text-white text-xl font-semibold">KLARIFai Demo</h3>
          <p className="text-gray-300 mt-2">
            See how KLARIFai transforms your workflow
          </p>
        </div>
      </div>
    </div>
  );
};

// Login Modal Component
// Login Modal Component
const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLoginSuccess = (token) => {
    console.log("Login successful:", token);
    onClose();
    navigate("/landing", { replace: true });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close login modal"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Modal Container */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-slate-700/50 relative">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Welcome to KLARIFai
            </h2>
          </div>

          {/* Themed Login Form Wrapper */}
          <div className="themed-login-form">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </div>

      {/* CSS Overrides for LoginForm */}
      <style jsx>{`
        .themed-login-form input[type="text"],
        .themed-login-form input[type="password"] {
          background-color: rgba(30, 41, 59, 0.7) !important;
          border: 1px solid rgb(71, 85, 105) !important;
          color: white !important;
          border-radius: 0.75rem !important;
          padding: 12px 16px !important;
        }

        .themed-login-form input[type="text"]:focus,
        .themed-login-form input[type="password"]:focus {
          background-color: rgba(30, 41, 59, 0.9) !important;
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
        }

        .themed-login-form input::placeholder {
          color: rgb(148, 163, 184) !important;
        }

        .themed-login-form label {
          color: rgb(203, 213, 225) !important;
          font-weight: 500 !important;
        }

        .themed-login-form button[type="submit"] {
          background: linear-gradient(
            to right,
            rgb(59, 130, 246),
            rgb(147, 51, 234)
          ) !important;
          border: none !important;
          border-radius: 0.75rem !important;
          padding: 12px 16px !important;
          font-weight: 600 !important;
          transform: scale(1) !important;
          transition: all 0.3s ease !important;
        }

        .themed-login-form button[type="submit"]:hover {
          background: linear-gradient(
            to right,
            rgb(37, 99, 235),
            rgb(126, 34, 206)
          ) !important;
          transform: scale(1.02) !important;
        }

        .themed-login-form .bg-white {
          background-color: transparent !important;
        }

        .themed-login-form .dark\\:text-gray-600 {
          color: rgb(203, 213, 225) !important;
        }

        .themed-login-form .dark\\:text-black {
          color: white !important;
        }

        /* SSO Button Styling */
        .themed-login-form button:not([type="submit"]) {
          background-color: rgba(30, 41, 59, 0.5) !important;
          border: 1px solid rgb(71, 85, 105) !important;
          color: rgb(203, 213, 225) !important;
          border-radius: 0.75rem !important;
        }

        .themed-login-form button:not([type="submit"]):hover {
          background-color: rgba(51, 65, 85, 0.7) !important;
          border-color: rgb(100, 116, 139) !important;
        }
      `}</style>
    </div>
  );
};

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
    <div
      className="flip-card aspect-square rounded-lg overflow-hidden"
      style={{ perspective: 1000 }}
    >
      <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
        <div className="flip-card-front w-full h-full">
          <img
            src={images[current]}
            alt="AI Idea"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flip-card-back w-full h-full">
          <img
            src={images[(current + 1) % images.length]}
            alt="AI Idea"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

// ChatAnimation component for smooth infinite chat animation
function ChatAnimation() {
  const messages = [
    { text: "Hi KLARIFai, can you summarize this document?", from: "user" },
    { text: "Of course! Here's a concise summary:", from: "ai" },
    { text: "Thanks! Can you generate a mind map?", from: "user" },
    { text: "Mind map generated. Would you like to ask a query?", from: "ai" },
    {
      text: "Yes, please provide brand shares for past 3 years.",
      from: "user",
    },
    { text: "Brand shares provided. Anything else?", from: "ai" },
    { text: "Can you extract key themes from this report?", from: "user" },
    {
      text: "Key themes identified: Innovation, Market Trends, Consumer Insights.",
      from: "ai",
    },
    { text: "Show me tabular summary of all key data points.", from: "user" },
    { text: "Here are the data points provided.", from: "ai" },
    { text: "Can you create an executive summary?", from: "user" },
    {
      text: "Executive summary created. Anything else I can help with?",
      from: "ai",
    },
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
  const visible = [0, 1, 2, 3].map((i) => (startIdx + i) % messages.length);

  return (
    <div className="flex flex-col gap-3 h-44 justify-end">
      {visible.map((i, index) => {
        const msg = messages[i];
        const isUser = msg.from === "user";
        const isOldest = index === 0;

        return (
          <div
            key={i}
            className={`flex w-full transition-all duration-700 ${
              isUser ? "justify-start" : "justify-end"
            } ${
              isTransitioning && isOldest
                ? "animate-fade-out"
                : "animate-fade-in"
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
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }>
  >([]);

  const [connections, setConnections] = useState<
    Array<{
      id: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }>
  >([]);

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
      setParticles((prev) =>
        prev.map((particle) => {
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
        })
      );

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
        {connections.map((connection) => (
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
          <linearGradient
            id="neuralGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 particle-glow"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${
              particle.size * 3
            }px rgba(59, 130, 246, 0.6), 0 0 ${
              particle.size * 6
            }px rgba(139, 92, 246, 0.3)`,
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
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-reveal");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-reveal class
    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

function WelcomeScreen() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const [heroAnimated, setHeroAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroAnimated(true), 100); // slight delay for effect
  }, []);

  // Replace this with your Azure Blob Storage video URL
  const videoUrl =
    "https://dockerblobklarifaibbsr.blob.core.windows.net/uploadfiles/1409899-uhd_3840_2160_25fps.mp4";

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const handleWatchDemo = () => {
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
  };

  useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isVideoModalOpen) {
          closeVideoModal();
        }
        if (isLoginModalOpen) {
          setIsLoginModalOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isVideoModalOpen, isLoginModalOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* KLARIFai Logo - Left */}
            <div className="flex items-center space-x-3">
              <img
                src={logo1}
                alt="KLARIFai Logo"
                className="w-30 h-10 object-contain rounded-lg"
              />
            </div>

            {/* Brandscapes Logo - Right */}
            <div className="flex flex-col items-center space-y-2">
              <img
                src={brandScarpeLogo}
                alt="Brandscapes Logo"
                className="w-33 h-6 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open('https://brandscapesworldwide.com', '_blank')}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={closeVideoModal}
        videoUrl={videoUrl}
      />
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

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
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
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
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-white">
                AI insights command center
              </h2>

              <p className="text-lg sm:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                One modular platform, infinite AI possibilities
                <br />
                Tailored for unique intelligence needs
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleWatchDemo}
                  className="group px-8 py-4 rounded-xl text-lg font-semibold border border-slate-600 hover:border-slate-400 transition-all duration-300 backdrop-blur-sm hover:bg-slate-800/50 flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="animate-bounce">
              <ChevronDown
                className="w-12 h-12 mt-10 text-red-500 mx-auto cursor-pointer hover:text-white transition-colors"
                onClick={() => scrollToSection("modules")}
              />
            </div>
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
              Modular design to transform how you work with documents and ideas
            </p>
          </div>

          <div className="space-y-20">
            {/* KLARIFai Notebook */}
            <div className="flex flex-col lg:flex-row items-center gap-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    KLARIFai Notebook
                  </h3>
                </div>

                <p className="text-xl text-slate-300 leading-relaxed">
                  Transform your documents into intelligent conversations<br/>
                  Upload files - Analyze content - Reveal insights
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Upload, text: "Document Upload & Processing" },
                    { icon: MessageCircle, text: "Intelligent Q&A Chatbot" },
                    { icon: Brain, text: "Mind Map Generation" },
                    { icon: FileText, text: "Smart Note-Taking" },
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <feature.icon className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-200">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* <button
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={true}
                >
                  Preview
                </button> */}
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

            {/* ChevronDown for KLARIFai Notebook */}
            <div className="text-center">
              <div className="animate-bounce">
                <ChevronDown
                  className="w-12 h-12 text-blue-500 mx-auto cursor-pointer hover:text-white transition-colors"
                  onClick={() => scrollToSection("idea-generator")}
                />
              </div>
            </div>

            {/* Idea Generator */}
            <div
              id="idea-generator"
              className="flex flex-col lg:flex-row-reverse items-center gap-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out pt-20 pb-20"
            >
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    Idea Generator
                  </h3>
                </div>

                <p className="text-xl text-slate-300 leading-relaxed">
                  Bring your early stage ideas to life: From Concept to Canvas{" "}
                  <br />
                  Input Guidelines - Generate Copy - Visualize Ideas
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Lightbulb, text: "Input Idea Specs" },
                    { icon: Sparkles, text: "Generate Idea Copy" },
                    { icon: Brain, text: "Context Relevant Visuals" },
                    { icon: Workflow, text: "Export & Share" },
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <feature.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-slate-200">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* <button
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={true}
                >
                  Preview
                </button> */}
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

            {/* ChevronDown for Idea Generator */}
            <div className="text-center">
              <div className="animate-bounce">
                <ChevronDown
                  className="w-12 h-12 text-purple-500 mx-auto cursor-pointer hover:text-white transition-colors"
                  onClick={() => scrollToSection("cta-section")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta-section"
        className="py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 ease-out"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Transform Your Workstreams
            </span>
          </h2>

          <p className="text-xl text-white mb-12 max-w-2xl mx-auto leading-relaxed">
            Reduce <span className="cta-emphasis-gradient">TIME</span> to{" "}
            <span className="cta-emphasis-gradient">INSIGHTS</span> & Drive{" "}
            <span className="cta-emphasis-gradient">ACTION</span> to{" "}
            <span className="cta-emphasis-gradient">IMPACT</span>
          </p>

          {/* <p className="text-xl text-white mb-12 max-w-2xl mx-auto text-center leading-relaxed">
  Reduce <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 hover:animate-pulse transition">TIME</span> to <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:animate-pulse transition">INSIGHTS</span> &amp; Drive <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-500 to-pink-500 hover:animate-pulse transition">ACTION</span> to <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-500 to-indigo-500 hover:animate-pulse transition">IMPACT</span>
</p> */}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Log in
              {/* <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /> */}
            </button>
          </div>
        </div>
      </section>
      {/* Floating FAQ Button - always visible, not inside header/footer/cta */}
      <div className="fixed bottom-6 right-6 z-50">
        <FaqButton />
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-slate-400 text-center">
              © 2025 KLARIFai. All rights reserved
            </p>
            {/* Option 1 */}
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Mail className="w-5 h-5" />
              <a 
                href="mailto:contact@klarifai.ai" 
                className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              >
                contact@klarifai.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
      <style jsx>{`
        .cta-emphasis-gradient {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          font-size: 1.1em;
        }

        .cta-badge {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9em;
          display: inline-block;
        }

        .cta-glow {
          color: #60a5fa;
          font-weight: 800;
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.5),
            0 0 20px rgba(96, 165, 250, 0.3);
        }
        .cta-gradient-blue {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        .cta-gradient-purple {
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        .cta-gradient-green {
          background: linear-gradient(90deg, #22c55e, #14b8a6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }
        .cta-gradient-yellow {
          background: linear-gradient(90deg, #fde047, #fb923c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(253, 224, 71, 0.3);
        }
      `}</style>
    </div>
  );
}

export default WelcomeScreen;
