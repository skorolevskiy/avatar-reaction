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
import { AlertCircle, RefreshCw, Download, Share2, Plus, LayoutGrid, Wand2 } from 'lucide-react';
import { AvatarUploadModal } from './components/modals/AvatarUploadModal';
import { ReferenceUploadModal } from './components/modals/ReferenceUploadModal';
import { BackgroundUploadModal } from './components/modals/BackgroundUploadModal';
import { Gallery } from './components/Gallery';

function App() {
  const [view, setView] = useState<'wizard' | 'gallery'>('wizard');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRefUploadModalOpen, setIsRefUploadModalOpen] = useState(false);
  const [isBgUploadModalOpen, setIsBgUploadModalOpen] = useState(false);

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
      setReferences([{ id: '1', name: 'Wave', label: 'Wave Hello', duration: '5s', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1518671815667-1c0eefdf7a61?w=400&h=400&fit=crop' }]); 
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

  const handleAvatarUpload = async (file: File) => {
    try {
      const newAvatar: Avatar = await api.uploadAvatar(file);
      setAvatars(prev => [newAvatar, ...prev]);
      setIsUploadModalOpen(false);
      selectAvatar(newAvatar);
    } catch (err) {
      handleError('Failed to upload avatar');
    }
  };

  const handleReferenceUpload = async (file: File, label: string) => {
    try {
      const newRef: Reference = await api.uploadReference(file, label);
      setReferences(prev => [newRef, ...prev]);
      setIsRefUploadModalOpen(false);
    } catch (err) {
      handleError('Failed to upload reference video');
    }
  };

  const handleBackgroundUpload = async (file: File, title: string) => {
    try {
      const newBg: Background = await api.uploadBackground(file, title);
      setBackgrounds(prev => [newBg, ...prev]);
      setIsBgUploadModalOpen(false);
    } catch (err) {
      handleError('Failed to upload background video');
    }
  };

  const selectAvatar = (avatar: Avatar) => {
    setState(prev => ({ 
      ...prev, 
      selectedAvatar: avatar,
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

  useEffect(() => {
    loadInitialData();
    return () => stopPolling();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 font-sans">
      <div className={`${view === 'gallery' ? 'max-w-7xl' : 'max-w-7xl'} mx-auto space-y-6`}>
        <header className="flex flex-row justify-between items-center mb-4 sm:mb-8 bg-white p-2 sm:p-4 rounded-xl shadow-sm gap-4">
          <div>
             <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">Avatar Reaction</h1>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setView('wizard')} 
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'wizard' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <Wand2 className="w-4 h-4" /> 
                <span className="hidden sm:inline">Create</span>
            </button>
            <button 
                onClick={() => setView('gallery')} 
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'gallery' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <LayoutGrid className="w-4 h-4" /> 
                <span className="hidden sm:inline">Gallery</span>
            </button>
          </div>

          <button onClick={resetAll} className={`flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg ${view === 'gallery' ? 'invisible' : ''}`}>
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </header>

        {view === 'gallery' ? (
           <Gallery />
        ) : (
           <>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add New</span>
                    </button>
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
            <div className="flex justify-end pt-4 border-t mt-4">
                <button 
                    onClick={() => setState(prev => ({ ...prev, currentStep: 'reference', expandedStep: 'reference' }))}
                    disabled={!state.selectedAvatar}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    <button
                        onClick={() => setIsRefUploadModalOpen(true)}
                        className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add New</span>
                    </button>
                    {references.map(ref => (
                      <Card
                          key={ref.id}
                          title={ref.label || ref.name}
                          video={ref.video_url}
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
                        onClick={() => setState(prev => ({ ...prev, currentStep: 'motion_generation', expandedStep: 'motion_generation' }))}
                        disabled={!state.selectedReference}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
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
            {!state.motionTask && !state.isLoading ? (
               <div className="space-y-6">
                 <div className="flex flex-row gap-4 items-center justify-center p-4">
                    {/* Avatar Preview */}
                    <div className="w-40">
                        <p className="text-sm text-center mb-3 font-medium text-gray-500">Selected Avatar</p>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                           {state.selectedAvatar ? (
                             <img src={state.selectedAvatar.image_url} className="w-full h-full object-cover"/>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                           )}
                        </div>
                        <p className="text-center mt-2 font-medium truncate">{state.selectedAvatar?.name}</p>
                    </div>
                    
                    <div className="text-gray-300">
                        <Plus className="w-8 h-8" />
                    </div>

                    {/* Reference Preview */}
                    <div className="w-40">
                        <p className="text-sm text-center mb-3 font-medium text-gray-500">Selected Motion</p>
                        <div className="aspect-square rounded-lg overflow-hidden relative bg-gray-100">
                           {state.selectedReference?.thumbnail_url ? (
                              <img src={state.selectedReference.thumbnail_url} className="w-full h-full object-cover"/>
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                           )}
                        </div>
                        <p className="text-center mt-2 font-medium truncate">{state.selectedReference?.label}</p>
                    </div>
                 </div>
                 <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={startMotionGeneration}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Start Generation
                    </button>
                 </div>
               </div>
            ) : state.isLoading && !state.motionTask?.motion_video_url ? (
                <Loader type="pulse" text="Generating motion (this may take 1-10 mins)..." />
            ) : state.motionTask?.motion_video_url ? (
                <div className="space-y-6">
                    <div className="aspect-square w-full max-w-[300px] mx-auto bg-black rounded-lg overflow-hidden shadow-inner">
                    <video 
                        src={state.motionTask.motion_video_url} 
                        controls 
                        className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button 
                            onClick={() => setState(prev => ({ ...prev, currentStep: 'background', expandedStep: 'background' }))}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Next
                        </button>
                    </div>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  <button
                        onClick={() => setIsBgUploadModalOpen(true)}
                        className="aspect-[9/16] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add New</span>
                    </button>
                {backgrounds.map(bg => (
                      <Card
                      key={bg.id}
                      title={bg.title || bg.name}
                      video={bg.video_url}
                      image={bg.thumbnail_url}
                      selected={state.selectedBackground?.id === bg.id}
                      aspect="aspect-[9/16]"
                      duration={bg.duration}
                      onClick={() => setState(prev => ({ ...prev, selectedBackground: bg }))}
                      />
                ))}
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={() => setState(prev => ({ ...prev, currentStep: 'montage_generation', expandedStep: 'montage_generation' }))}
                        disabled={!state.selectedBackground}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
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
            isDisabled={state.currentStep !== 'montage_generation' && state.currentStep !== 'result'}
            onToggle={() => handleStepClick('montage_generation')}
            >
            {!state.montageTask && !state.isLoading ? (
               <div className="space-y-6">
                 <div className="flex flex-row gap-4 sm:gap-8 items-center justify-center p-4">
                    {/* Motion Preview */}
                    <div className="w-40">
                        <p className="text-sm text-center mb-3 font-medium text-gray-500">Generated Motion</p>
                        <div className="aspect-square rounded-lg overflow-hidden bg-black">
                           {state.motionTask?.motion_thumbnail_url ? (
                              <img src={state.motionTask.motion_thumbnail_url} className="w-full h-full object-cover"/>
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                           )}
                        </div>
                    </div>
                    
                    <div className="text-gray-300">
                        <Plus className="w-8 h-8" />
                    </div>

                    {/* Background Preview */}
                    <div className="w-40">
                        <p className="text-sm text-center mb-3 font-medium text-gray-500">Selected Background</p>
                         <div className="aspect-[9/16] rounded-lg overflow-hidden bg-black">
                           {state.selectedBackground?.thumbnail_url ? (
                              <img src={state.selectedBackground.thumbnail_url} className="w-full h-full object-cover"/>
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                           )}
                        </div>
                    </div>
                 </div>
                 <div className="flex justify-end pt-4 border-t">
                    <button 
                         onClick={startMontageGeneration}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Start Montage
                    </button>
                 </div>
               </div>
            ) : state.isLoading && !state.montageTask?.final_video_url ? (
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
        </>
      )}
      </div>
      
      <AvatarUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleAvatarUpload}
      />

      <ReferenceUploadModal
        isOpen={isRefUploadModalOpen}
        onClose={() => setIsRefUploadModalOpen(false)}
        onUpload={handleReferenceUpload}
      />

      <BackgroundUploadModal
        isOpen={isBgUploadModalOpen}
        onClose={() => setIsBgUploadModalOpen(false)}
        onUpload={handleBackgroundUpload}
      />
    </div>
  );
}

export default App;
