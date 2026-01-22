
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
        // Use a standard format that geminiService regex can pick up
        const locString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        handleSituationChange('location', locString);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error", error);
        setIsDetectingLocation(false);
        alert("Location detection failed. Please enter the address manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInputs(prev => [...prev, {
        type,
        data: reader.result as string,
        mimeType: file.type,
        fileName: file.name
      }]);
    };
    reader.readAsDataURL(file);
  };

  const addVoiceNote = (data: string, mimeType: string) => {
    setInputs(prev => [...prev, { type: 'audio', data, mimeType, fileName: 'Voice Note' }]);
  };

  const removeInput = (index: number) => {
    setInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const textInput: MultimodalInput = {
        type: 'text',
        data: `REPORT DETAILS:
        Incident: ${situation.event}
        Location Context: ${situation.location}
        Involved: ${situation.people}
        Threat Description: ${situation.status}`
      };

      const result = await generateCrisisPlan([textInput, ...inputs]);
      setPlan(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Reasoning Failure:", error);
      alert(`Reasoning Error: ${error.message || "Connection timed out"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (plan) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button 
            onClick={() => { setPlan(null); setInputs([]); }}
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Start New Assessment
          </button>
          <div className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs font-bold text-slate-600 tracking-wider">LIVE PROTOCOL GENERATED</span>
          </div>
        </div>
        
        <ActionPlanDisplay plan={plan} />
        
        {plan.groundingLinks && plan.groundingLinks.length > 0 && (
          <div className="mt-12 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Grounding Citations & Sources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {plan.groundingLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs font-medium text-slate-600 truncate">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-[0.3em] rounded-full mb-4">EMERGENCY OPERATIONS</div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">CRIS</h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">Multimodal Intelligence for Immediate Crisis Response Coordination.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type of Event</label>
              <input
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="e.g. Chemical Leak, Mass Casualty"
                value={situation.event}
                onChange={(e) => handleSituationChange('event', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident Location</label>
                <button 
                  type="button" 
                  onClick={detectLocation}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  {isDetectingLocation ? 'Locating...' : 'GPS Detect'}
                </button>
              </div>
              <input
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="Coordinates or Address"
                value={situation.location}
                onChange={(e) => handleSituationChange('location', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personnel Impacted</label>
              <input
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="Count and status of people"
                value={situation.people}
                onChange={(e) => handleSituationChange('people', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Threat</label>
              <input
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="Immediate danger description"
                value={situation.status}
                onChange={(e) => handleSituationChange('status', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Evidence Synthesis</h3>
            <div className="flex flex-wrap gap-3">
              <VoiceRecorder onRecordingComplete={addVoiceNote} />
              
              <label className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all shadow-sm font-bold text-xs uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
              </label>

              <label className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all shadow-sm font-bold text-xs uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Docs
                <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
              </label>
            </div>

            {inputs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inputs.map((input, idx) => (
                  <div key={idx} className="relative p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px]">
                    <button 
                      type="button"
                      onClick={() => removeInput(idx)}
                      className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                    >
                      ×
                    </button>
                    <div className="font-black text-indigo-400 mb-1 uppercase tracking-widest">{input.type}</div>
                    <div className="truncate font-bold text-slate-600">{input.fileName || "Input stream"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-4"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing Incident...
              </>
            ) : (
              'Deploy Framework'
            )}
          </button>
        </div>
      </form>
    </main>
  );
};

export default App;
