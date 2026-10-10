import React, { useState } from 'react';
import { DistractionNote, Project } from '../types';
import { X, Plus, CheckCircle2, Circle, Trash2, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

interface DistractionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: DistractionNote[];
  projects: Project[];
  onAddNote: (text: string, projectId?: string) => void;
  onToggleResolve: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onConvertToStep: (note: DistractionNote, targetProjectId: string) => void;
}

export const DistractionDrawer: React.FC<DistractionDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  projects,
  onAddNote,
  onToggleResolve,
  onDeleteNote,
  onConvertToStep,
}) => {
  const [newText, setNewText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [convertingNoteId, setConvertingNoteId] = useState<string | null>(null);
  const [targetProjForConvert, setTargetProjForConvert] = useState<string>('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddNote(newText.trim(), selectedProject || undefined);
    setNewText('');
    setSelectedProject('');
  };

  const handleConfirmConvert = (note: DistractionNote) => {
    if (!targetProjForConvert) return;
    onConvertToStep(note, targetProjForConvert);
    setConvertingNoteId(null);
    setTargetProjForConvert('');
  };

  const activeNotes = notes.filter((n) => !n.resolved);
  const resolvedNotes = notes.filter((n) => n.resolved);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0c1220] border-l border-slate-800 shadow-2xl flex flex-col z-10">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Idea Parking Lot</span>
                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {activeNotes.length} pending
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Dump random thoughts here so you don't break current focus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input to quickly capture thoughts */}
        <div className="p-4 border-b border-slate-800/80 bg-[#090e18]">
          <form onSubmit={handleAdd} className="space-y-2">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Jot down a tangent, idea, or bug to investigate later..."
              rows={2}
              className="w-full bg-[#101728] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-[#101728] border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="">General (No project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!newText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Park It</span>
              </button>
            </div>
          </form>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl">
              <Sparkles className="w-6 h-6 text-amber-400/60 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">Your parking lot is clear</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Whenever you get an impulse to stop coding and try something else, jot it down here to stay protected!
              </p>
            </div>
          ) : (
            <>
              {/* Active Notes */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Parked Ideas ({activeNotes.length})
                </span>
                {activeNotes.map((note) => {
                  const linkedProj = projects.find((p) => p.id === note.projectId);
                  return (
                    <div
                      key={note.id}
                      className="bg-[#101726] border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => onToggleResolve(note.id)}
                          className="flex items-start gap-2 text-left flex-1"
                        >
                          <Circle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-slate-200 leading-relaxed">{note.text}</p>
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                        <span>{linkedProj ? linkedProj.name : 'General'}</span>
                        <button
                          onClick={() => {
                            setConvertingNoteId(note.id);
                            setTargetProjForConvert(projects[0]?.id || '');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-sans font-semibold flex items-center gap-1"
                        >
                          <span>Convert to Step</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Convert modal inside card */}
                      {convertingNoteId === note.id && (
                        <div className="bg-[#090d16] border border-cyan-800/80 rounded-lg p-2.5 space-y-2 mt-2">
                          <p className="text-[11px] font-semibold text-cyan-300">
                            Add as step to which project?
                          </p>
                          <select
                            value={targetProjForConvert}
                            onChange={(e) => setTargetProjForConvert(e.target.value)}
                            className="w-full bg-[#101728] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setConvertingNoteId(null)}
                              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleConfirmConvert(note)}
                              className="text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-2.5 py-0.5 rounded"
                            >
                              Add as Step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resolved Notes */}
              {resolvedNotes.length > 0 && (
                <div className="space-y-2 pt-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Resolved / Handled ({resolvedNotes.length})
                  </span>
                  {resolvedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[#0a0f1a] border border-slate-800/60 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2 text-slate-500"
                    >
                      <button
                        onClick={() => onToggleResolve(note.id)}
                        className="flex items-center gap-2 text-left line-through"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" />
                        <span>{note.text}</span>
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
