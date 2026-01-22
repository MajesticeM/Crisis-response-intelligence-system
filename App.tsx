
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
        const locString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        handleSituationChange('location', locString);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Error detecting location", error);
        setIsDetectingLocation(false);
        alert("Unable to retrieve location. Please type it manually.");
      }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newInput: MultimodalInput = {
        type,
        data: reader.result as string,
        mimeType: file.type,
        fileName: file.name
      };
      setInputs(prev => [...prev, newInput]);
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
        data: `CRISIS REPORT:
        Event: ${situation.event}
        Location: ${situation.location}
        Personnel/Population Involved: ${situation.people}
        Current Status/Threat: ${situation.status}`
      };

      const finalInputs = [textInput, ...inputs];
      const result = await generateCrisisPlan(finalInputs);
      setPlan(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Crisis Reasoning Error:", error);
      alert(`Reasoning Error: ${error.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPlan(null);
    setInputs([]);
    setSituation({ event: '', location: '', people: '', status: '' });
  };

  if (plan) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={resetForm}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium"
          >
            ← Generate New Plan
          </button>
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            CRIS LIVE INTELLIGENCE
          </div>
        </div>
        <ActionPlanDisplay plan={plan} />
        {plan.groundingLinks && plan.groundingLinks.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Verification Sources & Context</h3>
            <div className="flex flex-wrap gap-3">
              {plan.groundingLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  {link.title}
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
      <header className="text-center mb-12">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-slate-900">CRIS</h1>
        <p className="text-xl text-slate-500 font-light">Crisis Response Intelligence System</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Crisis Event</label>
            <input
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g., Flash Flood, Structural Fire"
              value={situation.event}
              onChange={(e) => handleSituationChange('event', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex justify-between">
              Location
              <button 
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="text-indigo-600 hover:text-indigo-800 text-xs normal-case font-medium"
              >
                {isDetectingLocation ? 'Detecting...' : 'Detect Current Location'}
              </button>
            </label>
            <input
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Address or Coordinates"
              value={situation.location}
              onChange={(e) => handleSituationChange('location', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Involved Parties</label>
            <input
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g., 50 residents, 12 staff"
              value={situation.people}
              onChange={(e) => handleSituationChange('people', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Status / Immediate Threat</label>
            <input
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Current risk level"
              value={situation.status}
              onChange={(e) => handleSituationChange('status', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Field Evidence (Multimodal)</h3>
          <div className="flex flex-wrap gap-4">
            <VoiceRecorder onRecordingComplete={addVoiceNote} />
            
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
            </label>

            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Attach Document
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
            </label>
          </div>

          {inputs.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {inputs.map((input, idx) => (
                <div key={idx} className="relative group p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <button 
                    type="button"
                    onClick={() => removeInput(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="uppercase font-bold text-[10px] text-slate-400 mb-1">{input.type}</div>
                  <div className="truncate text-slate-700">{input.fileName || "Input Data"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Synthesizing Protocol...
            </>
          ) : (
            'Generate Crisis Action Plan'
          )}
        </button>
      </form>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>© 2025 CRIS Framework. For professional emergency management use only.</p>
      </footer>
    </main>
  );
};

export default App;
