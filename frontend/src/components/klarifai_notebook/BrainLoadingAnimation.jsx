import React from 'react';

const BrainLoadingAnimation = ({ theme = "dark" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
      <style jsx>{`
        .brain-container {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .brain-svg {
          animation: brainPulse 2s ease-in-out infinite;
        }

        .brain-path {
          fill: none;
          stroke: ${theme === 'dark' ? '#8B5CF6' : '#7C3AED'};
          stroke-width: 2.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 10px ${theme === 'dark' ? '#8B5CF680' : '#7C3AED60'});
        }

        .neural-dot {
          fill: ${theme === 'dark' ? '#06B6D4' : '#0891B2'};
          animation: neuralPulse 1.5s ease-in-out infinite;
        }

        .neural-dot:nth-child(2) { animation-delay: 0.3s; }
        .neural-dot:nth-child(3) { animation-delay: 0.6s; }
        .neural-dot:nth-child(4) { animation-delay: 0.9s; }

        .wave-circle {
          fill: none;
          stroke: ${theme === 'dark' ? '#F59E0B' : '#D97706'};
          stroke-width: 1;
          opacity: 0;
          animation: waveExpand 2.5s ease-out infinite;
        }

        .wave-circle:nth-child(2) { animation-delay: 0.8s; }
        .wave-circle:nth-child(3) { animation-delay: 1.6s; }

        @keyframes brainPulse {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 10px ${theme === 'dark' ? '#8B5CF680' : '#7C3AED60'});
          }
          50% { 
            transform: scale(1.1);
            filter: drop-shadow(0 0 20px ${theme === 'dark' ? '#8B5CF6' : '#7C3AED80'});
          }
        }

        @keyframes neuralPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes waveExpand {
          0% { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(2.2); }
        }

        .dots::after {
          content: '';
          animation: dots 1.5s steps(4, end) infinite;
        }

        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>

      <div className="brain-container mb-4">
        {/* Background waves */}
        <svg className="absolute inset-0 w-full h-full">
          <circle className="wave-circle" cx="50%" cy="50%" r="15" />
          <circle className="wave-circle" cx="50%" cy="50%" r="15" />
          <circle className="wave-circle" cx="50%" cy="50%" r="15" />
        </svg>

        {/* Neural network dots */}
        <svg className="absolute inset-0 w-full h-full">
          <circle className="neural-dot" cx="35%" cy="40%" r="1.5" />
          <circle className="neural-dot" cx="65%" cy="35%" r="1.5" />
          <circle className="neural-dot" cx="30%" cy="65%" r="1.5" />
          <circle className="neural-dot" cx="70%" cy="60%" r="1.5" />
        </svg>

        {/* Main brain */}
        <svg className="brain-svg w-full h-full" viewBox="0 0 100 100">
          <path 
            className="brain-path"
            d="M25,35 Q30,25 40,30 Q45,20 55,25 Q65,20 70,30 Q75,25 80,35 Q85,40 80,50 Q85,60 75,65 Q70,75 60,70 Q55,80 45,75 Q40,80 35,70 Q25,75 20,65 Q15,60 20,50 Q15,40 25,35 Z M35,45 Q45,40 55,45 M30,55 Q40,50 50,55 Q60,50 70,55"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="font-medium text-lg dots">Generating MindMap</p>
      </div>
    </div>
  );
};

export default BrainLoadingAnimation;