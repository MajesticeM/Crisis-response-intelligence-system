
import React, { useState } from 'react';
import { MultimodalInput, CrisisActionPlan } from './types';
import { generateCrisisPlan } from './services/geminiService';
import VoiceRecorder from './components/VoiceRecorder';
import ActionPlanDisplay from './components/ActionPlanDisplay';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<MultimodalInput[]>([]);
  const [situation, setSituation] = useState({
    event: '',
    location: '',
    people: '',
    status: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [plan, setPlan] = useState<CrisisActionPlan | null>(null);

  const handleSituationChange = (field: keyof typeof situation, value: string) => {
    setSituation(prev => ({ ...prev, [field]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locString = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        handleSituationChange('location', locString);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        let msg = "Could not detect location.";
        if (error.code === error.PERMISSION_DENIED) msg = "Location permission denied.";
        alert(msg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith('image/') ? 'image' : 'document';
        setInputs(prev => [...prev, {
          type,
          data: reader.result as string,
          mimeType: file.type,
          fileName: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addVoiceNote = (base64: string, mimeType: string) => {
    setInputs(prev => [...prev, {
      type: 'audio',
      data: base64,
      mimeType,
      fileName: `voice-note-${Date.now()}.webm`
    }]);
  };

  const removeInput = (index: number) => {
    setInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const hasText = Object.values(situation).some(val => val.trim().length > 0);
    if (!hasText && inputs.length === 0) {
      alert("Please provide some crisis details or upload evidence.");
      return;
    }

    setIsProcessing(true);
    setPlan(null);
    try {
      const allInputs: MultimodalInput[] = [...inputs];
      
      const situationSummary = [
        situation.event && `WHAT HAPPENED: ${situation.event}`,
        situation.location && `LOCATION: ${situation.location}`,
        situation.people && `WHO IS INVOLVED: ${situation.people}`,
        situation.status && `CURRENT STATUS: ${situation.status}`
      ].filter(Boolean).join('\n');

      if (situationSummary) {
        allInputs.push({ type: 'text', data: situationSummary });
      }
      
      const result = await generateCrisisPlan(allInputs);
      setPlan(result);
    } catch (err) {
      console.error("Failed to generate plan:", err);
      alert("Error generating plan. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setInputs([]);
    setSituation({
      event: '',
      location: '',
      people: '',
      status: ''
    });
    setPlan(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 uppercase italic">CRIS</h1>
        <p className="text-lg text-slate-500 font-medium">Crisis Response Intelligence System</p>
      </header>

      {!plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Input Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm">1</span>
                Situation Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">What happened?</label>
                  <textarea
                    value={situation.event}
                    onChange={(e) => handleSituationChange('event', e.target.value)}
                    placeholder="Brief description of the incident..."
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Where?</label>
                    <button 
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isDetectingLocation ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
                    </button>
                  </div>
                  <textarea
                    value={situation.location}
                    onChange={(e) => handleSituationChange('location', e.target.value)}
                    placeholder="Specific location or coordinates..."
                    className="w-full h-24 p-4 bg-slate-