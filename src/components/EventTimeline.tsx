import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Sparkles, 
  Clock, 
  User, 
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { GameEvent, MoveRecord, ReplayedGameState } from '../types';
import { getPositionLabel } from '../utils/eventSourcing';

interface EventTimelineProps {
  events: GameEvent[];
  replayedState: ReplayedGameState;
  previewTurnNumber: number | null;
  onPreviewTurn: (turnNumber: number | null) => void;
  onRollbackToTurn: (targetTurnNumber: number) => void;
  isRollingBack: boolean;
  disabled?: boolean;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  replayedState,
  previewTurnNumber,
  onPreviewTurn,
  onRollbackToTurn,
  isRollingBack,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'TURNS' | 'RAW_EVENTS'>('TURNS');
  const [confirmRollbackTurn, setConfirmRollbackTurn] = useState<number | null>(null);

  const totalTurns = replayedState.turns.length;
  const currentViewedTurn = previewTurnNumber !== null ? previewTurnNumber : totalTurns;
  const isPreviewingPast = previewTurnNumber !== null && previewTurnNumber < totalTurns;

  const handleStepBack = () => {
    const nextTurn = Math.max(0, currentViewedTurn - 1);
    onPreviewTurn(nextTurn === totalTurns ? null : nextTurn);
  };

  const handleStepForward = () => {
    const nextTurn = Math.min(totalTurns, currentViewedTurn + 1);
    onPreviewTurn(nextTurn === totalTurns ? null : nextTurn);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 flex flex-col shadow-xl">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Event Sourcing History
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            {events.length} IMMUTABLE EVENTS STORED
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/20 tracking-wider">
            LOG ACTIVE
          </span>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              id="tab-turn-history-btn"
              onClick={() => setActiveTab('TURNS')}
              className={`px-2.5 py-1 rounded-lg transition text-xs font-bold cursor-pointer ${
                activeTab === 'TURNS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Replay
            </button>
            <button
              id="tab-raw-events-btn"
              onClick={() => setActiveTab('RAW_EVENTS')}
              className={`px-2.5 py-1 rounded-lg transition text-xs font-bold cursor-pointer flex items-center gap-1 ${
                activeTab === 'RAW_EVENTS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Raw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="space-y-4">
        {activeTab === 'TURNS' ? (
          <>
            {/* Timeline Stepper Controls */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  id="timeline-prev-btn"
                  onClick={handleStepBack}
                  disabled={currentViewedTurn === 0}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition cursor-pointer border border-slate-700 disabled:cursor-not-allowed"
                  title="Previous Turn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-slate-300 px-1">
                  {currentViewedTurn === 0 ? (
                    'Start (0)'
                  ) : (
                    <span>
                      Turn <strong className="text-indigo-400">{currentViewedTurn}</strong>/{totalTurns}
                    </span>
                  )}
                </span>

                <button
                  id="timeline-next-btn"
                  onClick={handleStepForward}
                  disabled={currentViewedTurn === totalTurns}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition cursor-pointer border border-slate-700 disabled:cursor-not-allowed"
                  title="Next Turn"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Live vs Replay Status */}
              <div>
                {isPreviewingPast ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider">
                      <Eye className="w-3 h-3" />
                      Turn {previewTurnNumber}
                    </span>
                    <button
                      id="timeline-live-view-btn"
                      onClick={() => onPreviewTurn(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700"
                    >
                      Live
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live State
                  </span>
                )}
              </div>
            </div>

            {/* Rollback Prompt Callout */}
            {isPreviewingPast && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                <div>
                  <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rollback to Turn {previewTurnNumber}?
                  </p>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">
                    Appends a GAME_ROLLBACK event to Firestore log.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {confirmRollbackTurn === previewTurnNumber ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        id="confirm-rollback-btn"
                        onClick={() => {
                          if (previewTurnNumber !== null) {
                            onRollbackToTurn(previewTurnNumber);
                            setConfirmRollbackTurn(null);
                          }
                        }}
                        disabled={isRollingBack || disabled}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md"
                      >
                        {isRollingBack ? 'Restoring...' : 'Confirm'}
                      </button>
                      <button
                        id="cancel-rollback-btn"
                        onClick={() => setConfirmRollbackTurn(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      id="initiate-rollback-btn"
                      onClick={() => setConfirmRollbackTurn(previewTurnNumber)}
                      disabled={isRollingBack || disabled}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Turn</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bento Event List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {/* Turn 0 Item */}
              <div
                onClick={() => onPreviewTurn(currentViewedTurn === 0 ? null : 0)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                  currentViewedTurn === 0
                    ? 'bg-slate-800/80 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/40 border-white/5 hover:border-slate-800 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-mono font-bold">
                    00
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Match Initialized</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Game Start</p>
                  </div>
                </div>

                {currentViewedTurn === 0 && (
                  <span className="text-[10px] font-bold text-indigo-400 uppercase px-2.5 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    Inspecting
                  </span>
                )}
              </div>

              {/* Turn Moves */}
              {replayedState.turns.map((move, index) => {
                const turnNum = index + 1;
                const isSelected = currentViewedTurn === turnNum;
                const isLatest = turnNum === totalTurns;
                const formattedNum = turnNum < 10 ? `0${turnNum}` : `${turnNum}`;
                const coordLabel = getPositionLabel(move.position);

                return (
                  <div
                    key={move.eventId || `turn-${turnNum}`}
                    id={`turn-item-${turnNum}`}
                    onClick={() => onPreviewTurn(isSelected && !isPreviewingPast ? null : turnNum)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-800/80 border-indigo-500/70 shadow-md ring-1 ring-indigo-500/30'
                        : isLatest
                        ? 'bg-slate-800/40 border-white/5'
                        : 'bg-slate-950/40 border-white/5 hover:border-slate-800 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                          move.mark === 'X'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {formattedNum}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          {move.mark} moved to {coordLabel}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {move.playedBy.displayName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLatest && !isSelected && (
                        <span className="text-[10px] font-bold text-indigo-500 uppercase px-2 py-0.5 bg-indigo-500/10 rounded-lg">
                          Latest
                        </span>
                      )}

                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-400 uppercase px-2 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                          Inspecting
                        </span>
                      )}

                      {!isLatest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewTurn(turnNum);
                            setConfirmRollbackTurn(turnNum);
                          }}
                          className="opacity-80 group-hover:opacity-100 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                          title={`Rollback to Turn ${turnNum}`}
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {replayedState.turns.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No moves made yet. Make a move on the board to generate turn events!
                </div>
              )}
            </div>
          </>
        ) : (
          /* Raw Firestore Event Subcollection Stream */
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Event Sourcing Architecture:</strong> Subcollection <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">games/{'{id}'}/events</code> holds immutable append-only records replayed into current state.
              </p>
            </div>

            {events.map((ev) => (
              <div
                key={ev.id}
                id={`raw-event-${ev.id}`}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      #{ev.sequenceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        ev.type === 'MOVE_MADE'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : ev.type === 'GAME_ROLLBACK'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : ev.type === 'PLAYER_JOINED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ev.type}
                    </span>
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 text-[10px] text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bento Footer */}
      <div className="mt-auto pt-6 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            AI Engine: Minimax (Depth 9)
          </p>
        </div>
        <p className="text-[10px] font-mono text-slate-600">v1.2.0-stable</p>
      </div>
    </div>
  );
};
