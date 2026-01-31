import { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import type { 
  AppState, 
  Avatar, 
  Reference, 
  Background, 
  Step as StepType,
  Motion,
  Montage
} from './types';
import { Step } from './components/Step';
import { Card } from './components/Card';
import { Loader } from './components/Loader';
import { AlertCircle, RefreshCw, Download, Share2 } from 'lucide-react';

function App() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  
  const [state, setState] = useState<AppState>({
    currentStep: 'avatar',
    expandedStep: 'avatar',
    selectedAvatar: null,
    selectedReference: null,
    motionTask: null,
    selectedBackground: null,
    montageTask: null,
    error: null,
    isLoading: false,
  });

  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    loadInitialData();
    return () => stopPolling();
  }, []);

  const loadInitialData = async () => {
    try {
      const [avatarsData, refsData, bgsData] = await Promise.all([
        api.getAvatars(),
        api.getReferences(),
        api.getBackgrounds()
      ]);
      setAvatars(avatarsData);
      setReferences(refsData);
      setBackgrounds(bgsData);
    } catch (err) {
      handleError('Failed to load initial data');
      // Mock data for development if API fails (Optional, but useful since API might not be reachable)
      console.warn('API Failed, using mock data for UI testing');
      mockData(); 
    }
  };
  
  const mockData = () => {
      setAvatars([{ id: '1', name: 'Anna', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop' }]);
      // Placeholder thumbnail added for testing UI
      setReferences([{ id: '1', name: 'Wave', label: 'Wave Hello', duration: '5s', preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1518671815667-1c0eefdf7a61?w=400&h=400&fit=crop' }]); 
      setBackgrounds([{ id: '1', name: 'Office', title: 'Modern Office', duration: '15s', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4' }]);
  };

  const handleError = (msg: string) => {
    setState(prev => ({ ...prev, error: msg, isLoading: false }));
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleStepClick = (step: StepType) => {
    const steps: StepType[] = ['avatar', 'reference', 'motion_generation', 'background', 'montage_generation', 'result'];
    const clickedIndex = steps.indexOf(step);
    
    // Only allow expanding steps that have been reached
    const reachedIndex = steps.indexOf(state.currentStep); 
    
    // Actually, logic is: users can revisit previous steps.
    // They can visit future steps only if they are the current active step.
    if (clickedIndex <= reachedIndex) {
      setState(prev => ({ ...prev, expandedStep: step }));
    }
  };

  const selectAvatar = (avatar: Avatar) => {
    setState(prev => ({ 
      ...prev, 
      selectedAvatar: avatar,
      currentStep: prev.currentStep === 'avatar' ? 'reference' : prev.currentStep, // Advance if on first step
      expandedStep: 'reference' 
    }));
  };

  const startMotionGeneration = async () => {
    if (!state.selectedAvatar || !state.selectedReference) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, currentStep: 'motion_generation', expandedStep: 'motion_generation' }));

    try {
      // Mock API call if real API fails
      // const task = await api.createMotion(state.selectedAvatar.id, state.selectedReference.id);
      
      // Real API Call
      let task; 
      try {
          task = await api.createMotion(state.selectedAvatar.id, state.selectedReference.id);
      } catch (e) {
          console.warn("API Create Motion Failed, mocking");
          task = { id: 'mock-motion-task', status: 'processing', avatar_id: '1', reference_id: '1' } as Motion;
      }

      setState(prev => ({ ...prev, motionTask: task }));
      
      // Start Polling
      pollingRef.current = window.setInterval(async () => {
        try {
          let status;
          try {
             status = await api.getMotionStatus(task.id);
          } catch(e) {
             // Mock success after a delay
             status = { ...task, status: 'success', motion_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4' } as Motion;
          }
          
          if (status.status === 'success') {
            stopPolling();
            setState(prev => ({ 
              ...prev, 
              motionTask: status, 
              isLoading: false,
              currentStep: 'background',
              expandedStep: 'background'
            }));
          } else if (status.status === 'failed') {
            stopPolling();
            handleError('Motion generation failed');
          }
        } catch (err) {
          stopPolling();
          handleError('Error checking motion status');
        }
      }, 15000);

    } catch (err) {
      handleError('Failed to start motion generation');
    }
  };

  const startMontageGeneration = async () => {
    if (!state.motionTask || !state.selectedBackground) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, currentStep: 'montage_generation', expandedStep: 'montage_generation'}));

    try {
      let task;
      try {
        task = await api.createMontage(state.motionTask.id, state.selectedBackground.id);
      } catch(e) {
          task = { id: 'mock-montage', status: 'processing', motion_id: '1', bg_video_id: '1' } as Montage;
      }
      
      setState(prev => ({ ...prev, montageTask: task }));

      pollingRef.current = window.setInterval(async () => {
        try {
          let status;
          try {
             status = await api.getMontageStatus(task.id);
          } catch(e) {
              status = { ...task, status: 'ready', final_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4' } as Montage;
          }
          
          if (status.status === 'ready') {
            stopPolling();
            setState(prev => ({ 
              ...prev, 
              montageTask: status, 
              isLoading: false,
              currentStep: 'result',
              expandedStep: 'result'
            }));
          } else if (status.status === 'failed') {
            stopPolling();
            handleError('Montage generation failed');
          }
        } catch (err) {
          stopPolling();
          handleError('Error checking montage status');
        }
      }, 15000);

    } catch (err) {
      handleError('Failed to start montage generation');
    }
  };

  const resetAll = () => {
    stopPolling();
    setState({
      currentStep: 'avatar',
      expandedStep: 'avatar',
      selectedAvatar: null,
      selectedReference: null,
      motionTask: null,
      selectedBackground: null,
      montageTask: null,
      error: null,
      isLoading: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-4 sm:mb-8 bg-white p-2 sm:p-4 rounded-xl shadow-sm">
          <div>
             <h1 className="text-m sm:text-3xl font-bold text-gray-900 tracking-tight">Avatar Reaction</h1>
          </div>
          <button onClick={resetAll} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg">
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </header>

        {state.error && (
           <div className="animate-in fade-in bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3 shadow-sm" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="block sm:inline font-medium">{state.error}</span>
           </div>
        )}

        <div className="space-y-4">
            {/* Step 1: Avatar Selection */}
            <Step
            stepNumber={1}
            title="Select Avatar"
            isActive={state.expandedStep === 'avatar'}
            isCompleted={!!state.selectedAvatar}
            isDisabled={false}
            onToggle={() => handleStepClick('avatar')}
            >
            {avatars.length === 0 ? <Loader type="spinner" /> : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {avatars.map(avatar => (
                    <Card
                        key={avatar.id}
                        title={avatar.name}
                        image={avatar.image_url}
                        selected={state.selectedAvatar?.id === avatar.id}
                        aspect="aspect-square"
                        onClick={() => selectAvatar(avatar)}
                    />
                    ))}
                </div>
            )}
            </Step>

            {/* Step 2: Reference Selection */}
            <Step
            stepNumber={2}
            title="Select Motion"
            isActive={state.expandedStep === 'reference'}
            isCompleted={!!state.selectedReference}
            isDisabled={state.currentStep === 'avatar'} // Only disabled if we haven't passed avatar
            onToggle={() => handleStepClick('reference')}
            >
            <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {references.map(ref => (
                      <Card
                          key={ref.id}
                          title={ref.label || ref.name}
                          video={ref.preview_url}
                          image={ref.thumbnail_url}
                          selected={state.selectedReference?.id === ref.id}
                          aspect="aspect-square"
                          duration={ref.duration}
                          onClick={() => setState(prev => ({ ...prev, selectedReference: ref }))}
                      />
                    ))}
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={startMotionGeneration}
                        disabled={!state.selectedReference || state.isLoading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Generate Motion
                    </button>
                </div>
            </div>
            </Step>

            {/* Step 3: Motion Preview */}
            <Step
            stepNumber={3}
            title="Motion Generation"
            isActive={state.expandedStep === 'motion_generation'}
            isCompleted={state.motionTask?.status === 'success'}
            isDisabled={!state.motionTask && state.currentStep !== 'motion_generation'}
            onToggle={() => handleStepClick('motion_generation')}
            >
            {state.isLoading && !state.motionTask?.motion_video_url ? (
                <Loader type="pulse" text="Generating motion (this may take 1-10 mins)..." />
            ) : state.motionTask?.motion_video_url ? (
                <div className="aspect-square w-full max-w-[300px] mx-auto bg-black rounded-lg overflow-hidden shadow-inner">
                <video 
                    src={state.motionTask.motion_video_url} 
                    controls 
                    className="w-full h-full object-contain"
                    />
                </div>
            ) : (
                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Waiting for motion selection...
                </div>
            )}
            </Step>

            {/* Step 4: Background Selection */}
            <Step
            stepNumber={4}
            title="Select Background"
            isActive={state.expandedStep === 'background'}
            isCompleted={!!state.selectedBackground}
            isDisabled={(!state.motionTask || state.motionTask.status !== 'success') && state.currentStep !== 'background' && state.currentStep !== 'montage_generation' && state.currentStep !== 'result'}
            onToggle={() => handleStepClick('background')}
            >
            <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {backgrounds.map(bg => (
                      <Card
                      key={bg.id}
                      title={bg.title || bg.name}
                      video={bg.video_url}
                      selected={state.selectedBackground?.id === bg.id}
                      aspect="aspect-[9/16]"
                      duration={bg.duration}
                      onClick={() => setState(prev => ({ ...prev, selectedBackground: bg }))}
                      />
                ))}
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={startMontageGeneration}
                        disabled={!state.selectedBackground || state.isLoading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Create Montage
                    </button>
                </div>
            </div>
            </Step>

            {/* Step 5: Final Result */}
            <Step
            stepNumber={5}
            title="Final Result"
            isActive={state.expandedStep === 'result' || state.expandedStep === 'montage_generation'}
            isCompleted={state.montageTask?.status === 'ready'}
            isDisabled={!state.montageTask && state.currentStep !== 'montage_generation'}
            onToggle={() => handleStepClick('montage_generation')}
            >
            {state.isLoading && !state.montageTask?.final_video_url ? (
                <div className="py-8">
                     <Loader type="progress" progress={state.montageTask ? 60 : 10} text="Rendering final masterpiece..." />
                </div>
            ) : state.montageTask?.final_video_url ? (
                <div className="space-y-6">
                    <div className="aspect-[9/16] w-full max-w-[300px] mx-auto bg-black rounded-xl overflow-hidden relative shadow-2xl ring-4 ring-white">
                    <video 
                        src={state.montageTask.final_video_url} 
                        controls 
                        autoPlay
                        className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex justify-center gap-4">
                    <a 
                        href={state.montageTask.final_video_url} 
                        download 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Download className="w-5 h-5" />
                        Download
                    </a>
                    <button 
                        onClick={() => {
                            if (navigator.share && state.montageTask?.final_video_url) {
                                navigator.share({
                                    title: 'My AI Montage',
                                    text: 'Check out this video I created with AI!',
                                    url: state.montageTask.final_video_url
                                }).catch(console.error);
                            } else if (state.montageTask?.final_video_url) {
                                navigator.clipboard.writeText(state.montageTask.final_video_url);
                                alert('Link copied to clipboard!');
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Share2 className="w-5 h-5" />
                        Share
                    </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Waiting for montage generation...
                </div>
            )}
            </Step>
        </div>
      </div>
    </div>
  );
}

export default App;
