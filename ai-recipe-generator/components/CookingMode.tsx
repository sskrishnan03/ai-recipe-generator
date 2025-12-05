
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Recipe } from '../types';
import { VOICE_COMMANDS } from '../constants';
import { Close } from './icons/Close';
import { ChevronLeft } from './icons/ChevronLeft';
import { ChevronRight } from './icons/ChevronRight';
import { VolumeUp } from './icons/VolumeUp';
import { VolumeOff } from './icons/VolumeOff';
import { Repeat } from './icons/Repeat';
import { Mic } from './icons/Mic';
import { Clock } from './icons/Clock';
import { generateSpeech, convertPCMToAudioBuffer } from '../services/geminiService';
import Toast from './common/Toast';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const shouldStopRecognitionRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const currentInstructionTime = (recipe.instructionTimers?.[currentIndex] || 0) * 60;
  const isEnglish = recipe.language === 'English';
  
  // Determine if we should allow voice commands based on language support
  const supportedLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
  const isLanguageSupported = supportedLanguages.includes(recipe.language);

  useEffect(() => {
    // Reset state on mount
    setIsVoiceEnabled(false);
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const languageToLangCode = (lang: string): string => {
    const map: { [key: string]: string } = {
        English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN',
        Telugu: 'te-IN', Kannada: 'kn-IN', Malayalam: 'ml-IN',
    };
    return map[lang] || 'en-US';
  };

  const stopAudio = useCallback(() => {
      if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current = null;
      }
  }, []);

  const playAudio = useCallback(async (text: string) => {
    // Stop listening while playing audio to prevent the mic from hearing the AI
    if (recognitionRef.current) {
        shouldStopRecognitionRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
    }

    try {
        setIsLoadingAudio(true);
        stopAudio();

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const pcmBuffer = await generateSpeech(text);
        const audioBuffer = convertPCMToAudioBuffer(audioContextRef.current, pcmBuffer);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsLoadingAudio(false);
            // Resume listening after audio finishes only if voice mode is still enabled
            if (isVoiceEnabled && isLanguageSupported) {
                 shouldStopRecognitionRef.current = false;
                 try {
                     if (recognitionRef.current) recognitionRef.current.start(); 
                 } catch(e) { /* ignore already started error */ }
            }
        };
        source.start();
        sourceNodeRef.current = source;

    } catch (error) {
        console.error("Failed to play audio", error);
        setToastMessage("Failed to play audio. Check your connection.");
        setTimeout(() => setToastMessage(null), 3000);
        setIsLoadingAudio(false);
        // Resume listening if audio failed but we are still in voice mode
        if (isVoiceEnabled && isLanguageSupported) {
            shouldStopRecognitionRef.current = false;
            try { if (recognitionRef.current) recognitionRef.current.start(); } catch(e) {}
       }
    }
  }, [isVoiceEnabled, isLanguageSupported, stopAudio]);

  // Effect to trigger audio when step changes, ONLY if voice is enabled
  useEffect(() => {
    if (isVoiceEnabled) {
      playAudio(recipe.instructions[currentIndex]);
    } else {
      stopAudio();
    }
  }, [currentIndex, isVoiceEnabled, recipe, playAudio, stopAudio]);

  useEffect(() => {
    const newTime = (recipe.instructionTimers?.[currentIndex] || 0) * 60;
    setSecondsLeft(newTime);
    setIsActive(false);
  }, [currentIndex, recipe.instructionTimers]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  // --- Navigation Handlers ---

  // MANUAL navigation: Stops voice mode
  const handleManualNext = useCallback(() => {
    setIsVoiceEnabled(false); // Stop voice
    stopAudio();
    if (recognitionRef.current) {
        shouldStopRecognitionRef.current = true;
        recognitionRef.current.stop();
    }
    if (currentIndex < recipe.instructions.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, recipe.instructions.length, stopAudio]);

  const handleManualPrevious = useCallback(() => {
    setIsVoiceEnabled(false); // Stop voice
    stopAudio();
    if (recognitionRef.current) {
        shouldStopRecognitionRef.current = true;
        recognitionRef.current.stop();
    }
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex, stopAudio]);
  
  const handleManualSelectInstruction = (index: number) => {
    setIsVoiceEnabled(false); // Stop voice
    stopAudio();
    setCurrentIndex(index);
  };

  // VOICE navigation: Keeps voice mode ON
  const handleVoiceNext = useCallback(() => {
    // Intentionally keep isVoiceEnabled as true
    if (currentIndex < recipe.instructions.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, recipe.instructions.length]);

  const handleVoicePrevious = useCallback(() => {
    // Intentionally keep isVoiceEnabled as true
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);
  
  const handleRepeat = useCallback(() => {
    playAudio(recipe.instructions[currentIndex]);
  }, [currentIndex, recipe, playAudio]);

  // Voice Recognition Lifecycle
  useEffect(() => {
    if (!SpeechRecognition || !isVoiceEnabled || !isLanguageSupported) {
        if (recognitionRef.current) recognitionRef.current.stop();
        return;
    }

    shouldStopRecognitionRef.current = false;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = languageToLangCode(recipe.language);
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event: any) => {
      if (event.error === 'network') {
        shouldStopRecognitionRef.current = true;
        setToastMessage("Voice control stopped due to network error.");
        setTimeout(() => setToastMessage(null), 4000);
        setIsListening(false);
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      // Restart if we shouldn't have stopped and voice is still enabled
      if (!shouldStopRecognitionRef.current && isVoiceEnabled) {
        try { 
            setTimeout(() => { 
                if (!shouldStopRecognitionRef.current && isVoiceEnabled && recognitionRef.current) {
                    recognitionRef.current.start(); 
                }
            }, 250); 
        } catch (e) { console.warn("Could not restart speech recognition:", e); }
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Recognized:", transcript);
      
      const commands = VOICE_COMMANDS[recipe.language] || VOICE_COMMANDS['English'];
      if (commands.next.some(cmd => transcript.includes(cmd))) handleVoiceNext();
      else if (commands.previous.some(cmd => transcript.includes(cmd))) handleVoicePrevious();
      else if (commands.repeat.some(cmd => transcript.includes(cmd))) handleRepeat();
    };
    
    // Start listening initially if audio isn't loading
    if (!isLoadingAudio) {
        try { recognition.start(); } catch (e) { console.error("Failed to start speech recognition:", e); }
    }

    return () => {
      shouldStopRecognitionRef.current = true;
      if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    };
  }, [isVoiceEnabled, recipe.language, handleVoiceNext, handleVoicePrevious, handleRepeat, isLanguageSupported]); 

  const handleTimerToggle = () => setIsActive(prev => !prev);
  const handleTimerReset = () => { setIsActive(false); setSecondsLeft(currentInstructionTime); };
  
  const handleToggleVoice = () => {
      setIsVoiceEnabled(prev => !prev);
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const secs = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-3xl z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-7xl max-h-[90vh] bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden animate-pop-in">
        
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/40 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/40 blur-[100px] rounded-full pointer-events-none"></div>

        <header className="flex justify-between items-center p-6 border-b border-slate-100 relative z-10 bg-white/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={onExit} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                <Close className="w-6 h-6 text-slate-700"/>
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight truncate max-w-xs md:max-w-md">{recipe.title}</h2>
          </div>
          <div className="flex items-center gap-4">
                {isListening && <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-200"><Mic className="w-4 h-4 text-rose-500 animate-pulse"/><span className="text-xs text-rose-600 uppercase font-bold tracking-wider">Listening</span></div>}
                
                <button 
                    onClick={handleToggleVoice} 
                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all border font-bold ${isVoiceEnabled ? 'bg-rose-500 text-white border-rose-500 shadow-lg ring-2 ring-rose-200 ring-offset-2' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`} 
                >
                  {isVoiceEnabled ? <VolumeUp className="w-5 h-5"/> : <VolumeOff className="w-5 h-5"/>}
                  <span className="hidden sm:inline">{isVoiceEnabled ? 'Voice ON' : 'Start Voice'}</span>
                </button>
          </div>
        </header>

        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative z-10">
          {/* Sidebar - Timeline */}
          <div className="lg:w-[400px] border-r border-slate-100 overflow-y-auto p-4 hidden lg:block bg-slate-50/50 no-scrollbar">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Recipe Timeline</h3>
            <ul className="space-y-3 pb-8">
              {recipe.instructions.map((step, index) => {
                const stepTime = recipe.instructionTimers?.[index] || 0;
                return (
                  <li key={index}>
                    <button 
                      onClick={() => handleManualSelectInstruction(index)}
                      className={`w-full text-left flex items-start p-4 rounded-2xl transition-all duration-300 border group ${currentIndex === index ? 'bg-white border-rose-200 shadow-lg translate-x-1 ring-1 ring-rose-100' : 'border-transparent hover:bg-white text-slate-500 hover:shadow-sm'}`}
                    >
                      <div className={`font-bold h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-sm shadow-sm transition-colors ${currentIndex === index ? 'bg-rose-500 text-white' : 'bg-white border border-slate-200 text-slate-400 group-hover:border-rose-200 group-hover:text-rose-500'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                          <p className={`text-sm leading-relaxed mb-1 line-clamp-2 ${currentIndex === index ? 'text-slate-800 font-medium' : ''}`}>{step}</p>
                          {stepTime > 0 && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                  <Clock className="w-3 h-3" /> {stepTime} min
                              </div>
                          )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Main Content - Active Instruction */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 relative bg-white no-scrollbar flex flex-col justify-center">
            <div className="max-w-3xl mx-auto w-full pb-8">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider mb-3 border border-rose-100">
                        Step {currentIndex + 1} of {recipe.instructions.length}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">Current Step</h3>
                 </div>
                 <button 
                    onClick={handleRepeat} 
                    className={`p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200 ${isLoadingAudio ? 'animate-pulse bg-rose-50 text-rose-500 border-rose-200' : ''}`}
                    disabled={!isVoiceEnabled}
                    title="Repeat instruction"
                 >
                      <Repeat className="w-6 h-6"/>
                  </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 mb-8 shadow-2xl shadow-slate-200/50 min-h-[240px] flex items-center relative overflow-hidden">
                   {/* Decorative background element */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>
                   <p className="text-xl md:text-3xl text-slate-700 font-medium leading-relaxed relative z-10">
                    {recipe.instructions[currentIndex]}
                   </p>
              </div>
              
              {currentInstructionTime > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 rounded-[24px] bg-slate-50 border border-slate-200">
                  <div className="font-mono text-5xl md:text-7xl text-slate-900 tracking-tighter tabular-nums">{formatTime(secondsLeft)}</div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={handleTimerToggle} className={`flex-1 sm:flex-none px-6 py-3 text-lg font-bold rounded-2xl text-white transition-all shadow-md active:scale-95 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{isActive ? 'Pause Timer' : 'Start Timer'}</button>
                    <button onClick={handleTimerReset} className="px-6 py-3 text-lg font-bold rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all active:scale-95">Reset</button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-auto">
                <button 
                    onClick={handleManualPrevious} 
                    disabled={currentIndex === 0} 
                    className="flex-1 py-5 rounded-2xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold text-lg border border-slate-200 flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6" /> Previous
                </button>
                <button 
                    onClick={handleManualNext} 
                    disabled={currentIndex === recipe.instructions.length - 1} 
                    className="flex-[1.5] py-5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                    Next Step <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {toastMessage && <Toast message={toastMessage} type="info" />}
      </div>
    </div>
  );
};

export default CookingMode;
