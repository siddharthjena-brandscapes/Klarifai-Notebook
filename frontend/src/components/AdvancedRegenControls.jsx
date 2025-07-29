// AdvancedRegenControls.jsx
import React, { useState, useEffect } from 'react';
import { Settings, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import axios from 'axios';
import { ideaService } from '../utils/axiosConfig';

const AdvancedRegenControls = ({ idea, onRegenerate, isLoading }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [settings, setSettings] = useState({
    prompt: '',
    negativePrompt: '',
    size: 768,
    steps: 30,
    guidance_scale: 7.5
  });
  const [isLoading2, setIsLoading2] = useState(true);

  useEffect(() => {
    const loadVisualizationPrompt = async () => {
      if (!idea?.idea_id) return;

      setIsLoading2(true);
      try {
        // First try to use the prompt from the idea prop
        if (idea.visualization_prompt) {
          setSettings(prev => ({
            ...prev,
            prompt: idea.visualization_prompt
          }));
          return;
        }

        // If not available, fetch from API
        const response = await ideaService.getIdeaDetails(idea.idea_id);
        if (response.data.success && response.data.idea.visualization_prompt) {
          setSettings(prev => ({
            ...prev,
            prompt: response.data.idea.visualization_prompt
          }));
        } else {
          // If still not available, use fallback
          setSettings(prev => ({
            ...prev,
            prompt: `${idea.product_name}: ${idea.description}`
          }));
        }
      } catch (error) {
        console.error('Error loading visualization prompt:', error);
        // Fallback if API fails
        setSettings(prev => ({
          ...prev,
          prompt: `${idea.product_name}: ${idea.description}`
        }));
      } finally {
        setIsLoading2(false);
      }
    };

    loadVisualizationPrompt();
  }, [idea?.idea_id, idea?.visualization_prompt]);

  const handleQuickRegenerate = () => {
    const randomParams = {
      size: 768, 
      steps: Math.floor(Math.random() * (40 - 20) + 20), 
      guidance_scale: Number((Math.random() * (9 - 6) + 6).toFixed(1)) 
    };
    
    const currentPrompt = settings.prompt || 
                         idea?.visualization_prompt ||
                         `${idea?.product_name || ''}: ${idea?.description || ''}`;
    
    console.log("Quick regenerate using prompt:", currentPrompt.substring(0, 100));
                         
    onRegenerate({
      description: currentPrompt,
      idea_id: idea.idea_id,
      ...randomParams
    });
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleAdvancedRegenerate = () => {
    const currentPrompt = settings.prompt || 
                         idea?.visualization_prompt ||
                         `${idea?.product_name || ''}: ${idea?.description || ''}`;
    
    console.log("Advanced regenerate using prompt:", currentPrompt.substring(0, 100));
    onRegenerate({
      description: currentPrompt,
      negative_prompt: settings.negativePrompt,
      idea_id: idea.idea_id,
      size: settings.size,
      steps: settings.steps,
      guidance_scale: settings.guidance_scale
    });
    setShowAdvanced(false);
  };

  
  return (
    <div className="flex gap-2">
      <button
        onClick={handleQuickRegenerate}
        className="px-4 py-2 rounded-lg bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-violet-600 dark:to-indigo-600 dark:hover:from-violet-700 dark:hover:to-indigo-700 text-white font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#a55233]/20 dark:shadow-violet-500/20"
        title="Regenerate Image"
        disabled={isLoading || isLoading2}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Regenerating...
          </div>
        ) : (
          <RotateCw className="w-4 h-4" />
        )}
      </button>
      
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogTrigger asChild>
          <button 
            className="px-4 py-2 rounded-lg bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-violet-600 dark:to-indigo-600 dark:hover:from-violet-700 dark:hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-[#a55233]/20 dark:shadow-violet-500/20"
            disabled={isLoading || isLoading2}
            title="Advanced Regenerate"
          >
            <Settings className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl bg-white/80 dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 border border-[#e3d5c8] dark:border-gray-800 shadow-2xl">
          <DialogHeader className="border-b border-[#381c0f] dark:border-gray-800 pb-4 relative">
            {/* <button
              onClick={() => setShowAdvanced(false)}
              className="absolute right-0 top-0 p-2 text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button> */}
            <DialogTitle className="text-2xl font-serif text-[#0a3b25] dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400 dark:bg-clip-text dark:text-transparent pr-8">
              Advanced Regeneration Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6 overflow-y-auto max-h-[70vh] px-6 custom-scrollbar">
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(214, 203, 191, 0.3);
                border-radius: 4px;
                margin: 4px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #a55233;
                border-radius: 4px;
                border: 2px solid transparent;
                background-clip: content-box;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #8b4513;
                border: 2px solid transparent;
                background-clip: content-box;
              }
  
              .custom-scrollbar::-webkit-scrollbar-corner {
                background: transparent;
              }
  
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #a55233 rgba(214, 203, 191, 0.3);
              }
  
              @media (prefers-color-scheme: dark) {
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(75, 85, 99, 0.1);
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, rgb(139, 92, 246), rgb(79, 70, 229));
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, rgb(124, 58, 237), rgb(67, 56, 202));
                }
  
                .custom-scrollbar {
                  scrollbar-color: rgb(139, 92, 246) rgba(75, 85, 99, 0.1);
                }
              }
            `}</style>
            <div className="space-y-3">
              <label className="text-base font-serif text-emerald-900 dark:text-white flex items-center gap-2">
                Visualization Prompt
                <span className="text-xs font-normal text-[#5a544a] dark:text-gray-400">(AI-enhanced prompt for image generation)</span>
              </label>
              <textarea
                value={settings.prompt}
                onChange={(e) => handleSettingChange('prompt', e.target.value)}
                rows={6}
                className="w-full p-4 bg-white/80 dark:bg-gray-800/50 border border-[#d6cbbf] dark:border-gray-700 rounded-xl text-[#1c1008] dark:text-white placeholder-[#5a544a]/60 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#a55233] dark:focus:ring-violet-500 focus:border-transparent transition-all duration-200 custom-scrollbar"
                placeholder={`${idea?.product_name || ''}: ${idea?.description || ''}`}
              />
            </div>
  
            <div className="space-y-3">
              <label className="text-base font-serif text-emerald-900 dark:text-white flex items-center gap-2">
                Negative Prompt
                <span className="text-xs font-normal text-[#5a544a] dark:text-gray-400">(Elements to exclude)</span>
              </label>
              <textarea
                value={settings.negativePrompt}
                onChange={(e) => handleSettingChange('negativePrompt', e.target.value)}
                rows={4}
                placeholder="Enter elements you want to exclude from the image (e.g., blurry, low quality, watermarks)"
                className="w-full p-4 bg-white/80 dark:bg-gray-800/50 border border-[#d6cbbf] dark:border-gray-700 rounded-xl text-[#1c1008] dark:text-white placeholder-[#5a544a]/60 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#a55233] dark:focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              />
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-base font-semibold text-[#5e4636] dark:text-white flex items-center gap-2">
                  Image Size
                  <span className="text-sm font-medium text-[#a55233] dark:text-violet-400">{settings.size}px</span>
                </label>
                <select
                  value={settings.size}
                  onChange={(e) => handleSettingChange('size', Number(e.target.value))}
                  className="w-full p-3 bg-white/80 dark:bg-gray-800/50 border border-[#d6cbbf] dark:border-gray-700 rounded-xl text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                </select>
              </div>
  
              <div className="space-y-3">
                <label className="text-base font-semibold text-[#5e4636] dark:text-white flex items-center gap-2">
                  Quality Steps
                  <span className="text-sm font-medium text-[#a55233] dark:text-violet-400">{settings.steps}</span>
                </label>
                <div className="px-2 py-4">
                  <div className="relative">
                    <div className="absolute -top-2 left-0 w-full h-1 bg-[#e3d5c8] dark:bg-gray-700 rounded">
                      <div 
                        className="absolute h-1 bg-[#a55233] dark:bg-gradient-to-r dark:from-violet-500 dark:to-indigo-500 rounded" 
                        style={{ width: `${((settings.steps - 20) / (50 - 20)) * 100}%` }}
                      />
                    </div>
                    <Slider
                      value={[settings.steps]}
                      onValueChange={([value]) => handleSettingChange('steps', value)}
                      min={20}
                      max={50}
                      step={1}
                      className="relative z-10"
                      thumbClassName="w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer hover:bg-[#f5e6d8] dark:hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-200"
                      trackClassName="bg-transparent"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-[#5a544a] dark:text-gray-500">20</span>
                    <span className="text-xs text-[#5a544a] dark:text-gray-500">50</span>
                  </div>
                </div>
                <p className="text-xs text-[#5a544a] dark:text-gray-400">Higher values = better quality, slower generation</p>
              </div>
  
              <div className="space-y-3 md:col-span-2">
                <label className="text-base font-semibold text-[#5e4636] dark:text-white flex items-center gap-2">
                  Guidance Scale
                  <span className="text-sm font-medium text-[#a55233] dark:text-violet-400">{settings.guidance_scale}</span>
                </label>
                <div className="px-2 py-4">
                  <div className="relative">
                    <div className="absolute -top-2 left-0 w-full h-1 bg-[#e3d5c8] dark:bg-gray-700 rounded">
                      <div 
                        className="absolute h-1 bg-[#a55233] dark:bg-gradient-to-r dark:from-violet-500 dark:to-indigo-500 rounded" 
                        style={{ width: `${((settings.guidance_scale - 1) / (20 - 1)) * 100}%` }}
                      />
                    </div>
                    <Slider
                      value={[settings.guidance_scale]}
                      onValueChange={([value]) => handleSettingChange('guidance_scale', value)}
                      min={1}
                      max={20}
                      step={0.1}
                      className="relative z-10"
                      thumbClassName="w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer hover:bg-[#f5e6d8] dark:hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-all duration-200"
                      trackClassName="bg-transparent"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-[#5a544a] dark:text-gray-500">1.0</span>
                    <span className="text-xs text-[#5a544a] dark:text-gray-500">20.0</span>
                  </div>
                </div>
                <p className="text-xs text-[#5a544a] dark:text-gray-400">Controls how closely the image follows the prompt</p>
              </div>
            </div>
          </div>
  
          <div className="flex justify-end gap-3 pt-6 border-t border-[#e3d5c8] dark:border-gray-800">
            <button
              onClick={() => setShowAdvanced(false)}
              className="px-4 py-2 rounded-lg bg-white border border-[#d6cbbf] text-[#5e4636] font-medium hover:bg-[#f5e6d8] dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-none transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAdvancedRegenerate}
              className="px-6 py-2 rounded-lg bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-violet-600 dark:to-indigo-600 dark:hover:from-violet-700 dark:hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-[#a55233]/20 dark:shadow-violet-500/20"
              disabled={isLoading || isLoading2}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Regenerating...
                </div>
              ) : (
                'Regenerate'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedRegenControls;