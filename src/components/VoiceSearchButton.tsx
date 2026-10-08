import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Check, Languages, Globe } from 'lucide-react';
import { api } from '../services/api.js';

interface VoiceSearchButtonProps {
  id: string;
  fieldLabel: string; // 'source' | 'destination' | 'general'
  onLocationFound: (locationName: string) => void;
  onDualLocationsFound?: (source: string, destination: string) => void;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  id,
  fieldLabel,
  onLocationFound,
  onDualLocationsFound
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'kn-IN' | 'en-IN' | 'auto'>('kn-IN');
  const [transcript, setTranscript] = useState('');
  const [recognizedResult, setRecognizedResult] = useState<string | null>(null);
  const [dualFound, setDualFound] = useState<{ source: string; destination: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  const isSpeechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setRecognizedResult(null);
    setDualFound(null);

    if (!isSpeechSupported) {
      setErrorMessage('Web Speech API is not supported in this browser. You can click on any quick voice sample below!');
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'auto' ? 'kn-IN' : language;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleSpeechRecognized(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was blocked. You can try the Quick Demo Voice Phrases below!');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No voice detected. Please tap the mic and speak clearly.');
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). Try the voice chips below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Could not start recognition:', err);
      setErrorMessage('Could not initialize microphone. Please test with a sample voice chip.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSpeechRecognized = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.locations.parseVoice(spokenText, fieldLabel);

      if (res.detectedIntent === 'two_locations' && res.sourceLocation && res.destinationLocation && onDualLocationsFound) {
        setDualFound({
          source: res.sourceLocation.name,
          destination: res.destinationLocation.name
        });
        setRecognizedResult(`${res.sourceLocation.name} → ${res.destinationLocation.name}`);

        setTimeout(() => {
          onDualLocationsFound(res.sourceLocation!.name, res.destinationLocation!.name);
          setIsOpen(false);
        }, 1200);
      } else if (res.singleLocation) {
        setRecognizedResult(res.singleLocation.name);
        setTimeout(() => {
          onLocationFound(res.singleLocation!.name);
          setIsOpen(false);
        }, 1000);
      } else if (res.suggestedQuery) {
        setRecognizedResult(res.suggestedQuery);
        setTimeout(() => {
          onLocationFound(res.suggestedQuery);
          setIsOpen(false);
        }, 1000);
      } else {
        setRecognizedResult(spokenText);
        setTimeout(() => {
          onLocationFound(spokenText);
          setIsOpen(false);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Voice parsing failed:', err);
      setRecognizedResult(spokenText);
      onLocationFound(spokenText);
      setTimeout(() => setIsOpen(false), 1200);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateVoice = (sampleText: string) => {
    setTranscript(sampleText);
    handleSpeechRecognized(sampleText);
  };

  const openVoiceModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
    setTranscript('');
    setRecognizedResult(null);
    setErrorMessage(null);
    setTimeout(() => {
      startListening();
    }, 150);
  };

  return (
    <>
      {/* Microphone Icon Button inside input */}
      <button
        id={id}
        type="button"
        onClick={openVoiceModal}
        title="Search by Voice in Kannada or English (ಧ್ವನಿ ಹುಡುಕಾಟ)"
        aria-label="Search location by voice in Kannada or English"
        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
      >
        <Mic className="w-4 h-4 text-red-500 hover:text-red-600 transition-colors" />
      </button>

      {/* Voice Recognition Modal / Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Multilingual Voice Search</h3>
                  <p className="text-[11px] text-slate-500">ಕನ್ನಡ & English Voice Recognition</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="mt-4 flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLanguage('kn-IN');
                  if (isListening) {
                    stopListening();
                    setTimeout(startListening, 200);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  language === 'kn-IN'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('en-IN');
                  if (isListening) {
                    stopListening();
                    setTimeout(startListening, 200);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  language === 'en-IN'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English (India)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('auto');
                  if (isListening) {
                    stopListening();
                    setTimeout(startListening, 200);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  language === 'auto'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auto / Mixed
              </button>
            </div>

            {/* Visualizer & Mic Pulse */}
            <div className="my-6 flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center mb-4">
                {isListening && (
                  <>
                    <span className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
                    <span className="absolute w-20 h-20 rounded-full bg-red-500/30 animate-pulse" />
                  </>
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 scale-105 ring-4 ring-red-200'
                      : 'bg-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-8 h-8 animate-bounce" />
                  ) : (
                    <MicOff className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Status Indicator */}
              <div className="min-h-12 flex flex-col items-center justify-center">
                {isListening ? (
                  <>
                    <p className="text-sm font-extrabold text-red-600 animate-pulse flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" />
                      {language === 'kn-IN' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಗ್ರಾಮ ಅಥವಾ ನಗರದ ಹೆಸರು ಹೇಳಿ' : 'Listening... Speak village or town name'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Say e.g., "ಮೈಸೂರು", "ಹುನ್ಸೂರು", "ಬೆಂಗಳೂರು", or "Hunsur to Mysuru"
                    </p>
                  </>
                ) : isProcessing ? (
                  <p className="text-sm font-bold text-amber-600 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Analyzing Karnataka location...
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Tap the microphone button above to speak
                  </p>
                )}
              </div>

              {/* Real-time transcript display */}
              {transcript && (
                <div className="mt-3 w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">You Said:</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">"{transcript}"</p>
                </div>
              )}

              {/* Recognized result alert */}
              {recognizedResult && (
                <div className="mt-3 w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-emerald-600 uppercase">Matched Location:</p>
                      <p className="text-sm font-extrabold text-emerald-950">{recognizedResult}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Selecting...
                  </span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-3 w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Quick Demo Voice Chips (Instant testing in any browser/iframe) */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Voice Test Samples:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ಮೈಸೂರು')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  🎤 ಮೈಸೂರು (Mysuru)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ಬೆಂಗಳೂರು')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  🎤 ಬೆಂಗಳೂರು (Bengaluru)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ಹುನ್ಸೂರು')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  🎤 ಹುನ್ಸೂರು (Hunsur)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ಬಿಳಿಕೆರೆ')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  🎤 ಬಿಳಿಕೆರೆ (Bilikere Village)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ಹುನ್ಸೂರಿನಿಂದ ಮೈಸೂರಿಗೆ')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                >
                  🎤 ಹುನ್ಸೂರಿನಿಂದ ಮೈಸೂರಿಗೆ (Dual)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateVoice('ನನಗೆ Mysuru ಇಂದ Bengaluru ಗೆ ಹೋಗಬೇಕು')}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                >
                  🎤 Mysuru ಇಂದ Bengaluru ಗೆ (Dual)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
