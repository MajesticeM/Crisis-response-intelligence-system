
import React from 'react';
import { CrisisActionPlan, SeverityLevel } from '../types';

interface ActionPlanDisplayProps {
  plan: CrisisActionPlan;
}

const ActionPlanDisplay: React.FC<ActionPlanDisplayProps> = ({ plan }) => {
  const getSeverityColor = (level: SeverityLevel) => {
    switch (level) {
      case SeverityLevel.CRITICAL: return 'bg-red-600 text-white';
      case SeverityLevel.HIGH: return 'bg-orange-500 text-white';
      case SeverityLevel.MEDIUM: return 'bg-yellow-500 text-slate-900';
      case SeverityLevel.LOW: return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-2 ${getSeverityColor(plan.severity)}`}>
              {plan.severity} PRIORITY
            </span>
            <h1 className="text-3xl font-bold text-slate-900">{plan.title}</h1>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export/Print
          </button>
        </div>
        <p className="mt-4 text-slate-600 italic leading-relaxed">
          {plan.situationSummary}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Immediate Actions
          </h2>
          <div className="space-y-4">
            {plan.immediateActions.map((action, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className={`w-2 shrink-0 rounded-full ${action.urgency === 'IMMEDIATE' ? 'bg-red-500' : 'bg-blue-400'}`}></span>
                <div>
                  <p className="font-semibold text-slate-800">{action.task}</p>
                  <p className="text-sm text-slate-500 uppercase tracking-tighter mt-1">Lead: {action.assignedRole}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Safety Alerts & Hazards
          </h2>
          <ul className="space-y-3">
            {plan.safetyAlerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700">
                <span className="text-amber-600 font-bold">•</span>
                {alert}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Communication Strategy
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Internal Teams</h3>
                <p className="text-slate-200 leading-relaxed bg-slate-800 p-4 rounded-lg">{plan.communicationStrategy.internal}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Public/External</h3>
                <p className="text-slate-200 leading-relaxed bg-slate-800 p-4 rounded-lg">{plan.communicationStrategy.external}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
             <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Resource Checklist
          </h2>
          <div className="space-y-2">
            {plan.resourceChecklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-indigo-900 mb-4">Long-Term Recovery Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plan.longTermRecovery.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-indigo-800">
              <span className="font-bold text-indigo-400">{idx + 1}.</span>
              {step}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ActionPlanDisplay;
