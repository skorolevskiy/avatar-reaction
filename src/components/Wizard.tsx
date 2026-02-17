import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { 
  AppState, 
  Avatar, 
  Reference, 
  Background, 
  Step as StepType,
  Motion,
  Montage,
  MontageSettings
} from '../types';
import { Step } from './Step';
import { Card } from './Card';
import { Loader } from './Loader';
import { AlertCircle, Plus, Download, Share2 } from 'lucide-react';
import { AvatarUploadModal } from './modals/AvatarUploadModal';
import { ReferenceUploadModal } from './modals/ReferenceUploadModal';
import { BackgroundUploadModal } from './modals/BackgroundUploadModal';

interface WizardProps {
  onReset?: () => void;
}

export function Wizard({ onReset }: WizardProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [motions, setMotions] = useState<Motion[]>([]); // For Step 3 selection
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRefUploadModalOpen, setIsRefUploadModalOpen] = useState(false);
  const [isBgUploadModalOpen, setIsBgUploadModalOpen] = useState(false);
  
  // Step 3 specific state
  const [motionGenerationMode, setMotionGenerationMode] = useState<'create' | 'select' | null>(null);
  const [montageSettings, setMontageSettings] = useState<MontageSettings>({ format: 'circle', position: 'top_right' });

  const [state, setState] = useState<AppState>({
    currentStep: 'mode_selection',
    expandedStep: 'mode_selection',
    selectedAvatar: null,
    selectedReference: null,
    motionTask: null,
    selectedBackground: null,
    montageTask: null,
    error: null,
    isLoading: false,
  });

  const pollingRef = useRef<number | null>(null);




  const handleError = (msg: string) => {
    setState(prev => ({ ...prev, error: msg, isLoading: false }));
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    const mockData = () => {
        setAvatars([{ id: '1', name: 'Anna', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop' }]);
        setReferences([{ id: '1', name: 'Wave', label: 'Wave Hello', duration: '5s', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail_url: 'https://images.unsplash.com/photo-1518671815667-1c0eefdf7a61?w=400&h=400&fit=crop' }]); 
        setBackgrounds([{ id: '1', name: 'Office', title: 'Modern Office', duration: '15s', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4' }]);
        setMotions([
          { id: '1', status: 'success', avatar_id: '1', reference_id: '1', motion_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', motion_thumbnail_url: 'https://images.unsplash.com/photo-1518671815667-1c0eefdf7a61?w=400&h=400&fit=crop' }
        ]);
    };

    const loadInitialData = async () => {
      try {
        const [avatarsData, refsData, bgsData, motionsData] = await Promise.all([
          api.getAvatars(),
          api.getReferences(),
          api.getBackgrounds(),
          api.getMotions()
        ]);
        setAvatars(avatarsData);
        setReferences(refsData);
        setBackgrounds(bgsData);
        setMotions(motionsData);
      } catch (err) {
        handleError('Failed to load initial data');
        console.warn('API Failed, using mock data for UI testing');
        mockData(); 
      }
    };
    
    loadInitialData();
    return () => stopPolling();
  }, []);


  const handleStepClick = (step: StepType) => {
    const steps: StepType[] = ['mode_selection', 'avatar', 'reference', 'motion_generation', 'background', 'montage_generation', 'result'];
    const clickedIndex = steps.indexOf(step);
    const reachedIndex = steps.indexOf(state.currentStep); 
    
    if (clickedIndex <= reachedIndex) {
      if (motionGenerationMode === 'select' && (step === 'avatar' || step === 'reference' || step === 'motion_generation')) {
          // Prevent expanding skipped steps in select mode
          return;
      }
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
      let task; 
      try {
          task = await api.createMotion(state.selectedAvatar.id, state.selectedReference.id);
      } catch (e) {
          console.warn("API Create Motion Failed, mocking");
          task = { id: 'mock-motion-task', status: 'processing', avatar_id: '1', reference_id: '1' } as Motion;
      }

      setState(prev => ({ ...prev, motionTask: task }));
      
      pollingRef.current = window.setInterval(async () => {
        try {
          let status;
          try {
             status = await api.getMotionStatus(task.id);
          } catch(e) {
             status = { ...task, status: 'success', motion_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', motion_thumbnail_url: 'https://images.unsplash.com/photo-1518671815667-1c0eefdf7a61?w=400&h=400&fit=crop' } as Motion;
          }
          
          if (status.status === 'success') {
            stopPolling();
            setState(prev => ({ 
              ...prev, 
              motionTask: status, 
              isLoading: false,
            }));
            // Refresh motions list
             api.getMotions().then(setMotions).catch(() => {});
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

    const handleSelectExistingMotion = (motion: Motion) => {
        // When selecting an existing motion, we try to sync up Step 1 & 2 if we can find the objects
        const foundAvatar = avatars.find(a => a.id === motion.avatar_id);
        const foundRef = references.find(r => r.id === motion.reference_id);
        
        setState(prev => ({
            ...prev,
            selectedAvatar: foundAvatar || prev.selectedAvatar, // Try to update, fall back if not found (though obscure)
            selectedReference: foundRef || prev.selectedReference,
            motionTask: motion,
            currentStep: 'background', // Advance!
            expandedStep: 'background'
        }));
    };


  const startMontageGeneration = async () => {
    if (!state.motionTask || !state.selectedBackground) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, currentStep: 'montage_generation', expandedStep: 'montage_generation'}));

    try {
      let task;
      try {
        task = await api.createMontage(state.motionTask.id, state.selectedBackground.id, montageSettings);
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



  const getStepNumber = (step: StepType) => {
      const mode = motionGenerationMode;
      if (step === 'mode_selection') return 1;
      if (mode === 'create') {
          if (step === 'avatar') return 2;
          if (step === 'reference') return 3;
          if (step === 'motion_generation') return 4;
          if (step === 'background') return 5;
          if (step === 'montage_generation') return 6; // result
      } else if (mode === 'select') {
           if (step === 'background') return 2;
           if (step === 'montage_generation') return 3; // result
      }
      return 0; // Hidden
  };

  return (
    <div className="space-y-4">
        {state.error && (
           <div className="animate-in fade-in bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3 shadow-sm" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="block sm:inline font-medium">{state.error}</span>
           </div>
        )}

            {/* Step 1: Mode Selection & Motion Pick */}
            <Step
                stepNumber={1}
                title="Select Motion Source"
                isActive={state.expandedStep === 'mode_selection'}
                isCompleted={!!motionGenerationMode && (motionGenerationMode === 'create' || !!state.motionTask)}
                isDisabled={false}
                onToggle={() => handleStepClick('mode_selection')}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                setMotionGenerationMode('create');
                                setState(prev => ({ ...prev, currentStep: 'avatar', expandedStep: 'avatar' }));
                            }}
                            className={`p-6 border-2 rounded-xl flex flex-col items-center gap-4 transition-all ${
                                motionGenerationMode === 'create' 
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-gray-900">Generate New Motion</h3>
                                <p className="text-sm text-gray-500 mt-1">Create a unique motion from avatar + reference</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setMotionGenerationMode('select');
                                // Don't advance yet, wait for selection
                            }}
                            className={`p-6 border-2 rounded-xl flex flex-col items-center gap-4 transition-all ${
                                motionGenerationMode === 'select' 
                                ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' 
                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <Share2 className="w-8 h-8" /> 
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-gray-900">Use Existing Motion</h3>
                                <p className="text-sm text-gray-500 mt-1">Select from your library of generated motions</p>
                            </div>
                        </button>
                    </div>

                    {motionGenerationMode === 'select' && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300 pt-4 border-t">
                             <h4 className="text-sm font-medium text-gray-700 mb-3">Select a motion to continue:</h4>
                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[44vh] overflow-y-auto pr-1">
                                {motions.filter(m => m.status === 'success').length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                        No generated motions found. Try generating a new one!
                                    </div>
                                ) : (
                                    motions.filter(m => m.status === 'success').map(motion => (
                                        <Card
                                            key={motion.id}
                                            title={`Motion ${motion.id.substring(0,4)}`}
                                            video={motion.motion_video_url}
                                            image={motion.motion_thumbnail_url || avatars.find(a => a.id === motion.avatar_id)?.image_url} 
                                            selected={state.motionTask?.id === motion.id}
                                            aspect="aspect-square"
                                            onClick={() => handleSelectExistingMotion(motion)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Step>

            {/* Step 2: Avatar Selection (Create Mode Only) */}
            {motionGenerationMode === 'create' && (
            <Step
            stepNumber={getStepNumber('avatar')}
            title="Select Avatar"
            isActive={state.expandedStep === 'avatar'}

            isCompleted={!!state.selectedAvatar}
            isDisabled={state.currentStep === 'mode_selection'}
            onToggle={() => handleStepClick('avatar')}
            >
            {avatars.length === 0 ? <Loader type="spinner" /> : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto pr-1">
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
            )}

            {/* Step 3: Reference Selection */}
            {motionGenerationMode === 'create' && (
            <Step
            stepNumber={getStepNumber('reference')}
            title="Select Motion"
            isActive={state.expandedStep === 'reference'}
            isCompleted={!!state.selectedReference}
            isDisabled={state.currentStep === 'mode_selection' || state.currentStep === 'avatar'}
            onToggle={() => handleStepClick('reference')}
            >
            <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[44vh] overflow-y-auto pr-1">
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
            )}

            {/* Step 4: Motion Generation */}
            {motionGenerationMode === 'create' && (
            <Step
            stepNumber={getStepNumber('motion_generation')}
            title="Motion Generation"
            isActive={state.expandedStep === 'motion_generation'}
            isCompleted={state.motionTask?.status === 'success'}
            isDisabled={!state.motionTask && state.currentStep !== 'motion_generation'}
            onToggle={() => handleStepClick('motion_generation')}
            >
            {!state.motionTask && !state.isLoading ? (
               <div className="space-y-6">
                 {/* Generation Preview and Start Button */}
                 <div className="flex flex-row gap-4 items-center justify-center">
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
            )}

            {/* Step 5/2: Background Selection */}
            <Step
            stepNumber={getStepNumber('background')}
            title="Select Background"
            isActive={state.expandedStep === 'background'}
            isCompleted={!!state.selectedBackground}
            isDisabled={(!state.motionTask || state.motionTask.status !== 'success') && state.currentStep !== 'background' && state.currentStep !== 'montage_generation' && state.currentStep !== 'result'}
            onToggle={() => handleStepClick('background')}
            >
            <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto pr-1">
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

            {/* Step 6/3: Final Result */}
            <Step
            stepNumber={getStepNumber('montage_generation')}
            title="Final Result"
            isActive={state.expandedStep === 'result' || state.expandedStep === 'montage_generation'}
            isCompleted={state.montageTask?.status === 'ready'}
            isDisabled={state.currentStep !== 'montage_generation' && state.currentStep !== 'result'}
            onToggle={() => handleStepClick('montage_generation')}
            >
            {!state.montageTask && !state.isLoading ? (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Format</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setMontageSettings({ format: 'circle', position: 'top_right' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${montageSettings.format === 'circle' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Circle
                                </button>
                                <button 
                                    onClick={() => setMontageSettings({ format: 'square', position: 'bottom' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${montageSettings.format === 'square' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Square
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                            {montageSettings.format === 'circle' ? (
                                <div className="grid grid-cols-2 gap-2 w-32 mx-auto md:mx-0">
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'top_left' })}
                                        className={`h-12 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 ${montageSettings.position === 'top_left' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'top_right' })}
                                        className={`h-12 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 ${montageSettings.position === 'top_right' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'bottom_left' })}
                                        className={`h-12 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 ${montageSettings.position === 'bottom_left' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'bottom_right' })}
                                        className={`h-12 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 ${montageSettings.position === 'bottom_right' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current opacity-40" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 w-full">
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'top' })}
                                        className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${montageSettings.position === 'top' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        Top
                                    </button>
                                    <button 
                                        onClick={() => setMontageSettings({ ...montageSettings, position: 'bottom' })}
                                        className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${montageSettings.position === 'bottom' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        Bottom
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                        <div className="relative w-[200px] aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200">
                             {/* Background Layer */}
                             {state.selectedBackground?.thumbnail_url && (
                                <img src={state.selectedBackground.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                             )}
                             
                             {/* Overlay Layer */}
                             {state.motionTask?.motion_thumbnail_url && (
                                <div 
                                    className={`absolute overflow-hidden transition-all duration-300 border-2 border-white shadow-lg bg-black z-10
                                    ${montageSettings.format === 'circle' ? 'rounded-full w-[60%] aspect-square' : ''}
                                    ${montageSettings.format === 'square' ? 'w-full aspect-square left-0' : ''}
                                    ${montageSettings.position === 'top_left' ? 'top-4 left-4' : ''}
                                    ${montageSettings.position === 'top_right' ? 'top-4 right-4' : ''}
                                    ${montageSettings.position === 'bottom_left' ? 'bottom-4 left-4' : ''}
                                    ${montageSettings.position === 'bottom_right' ? 'bottom-4 right-4' : ''}
                                    ${montageSettings.format === 'square' && montageSettings.position === 'top' ? 'top-0 border-x-0 border-t-0' : ''}
                                    ${montageSettings.format === 'square' && montageSettings.position === 'bottom' ? 'bottom-0 border-x-0 border-b-0' : ''}
                                    `}
                                >
                                    <img src={state.motionTask.motion_thumbnail_url} className="w-full h-full object-cover" />
                                </div>
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
