import React, { useState, useRef, useEffect } from 'react';
import {
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Calendar,
  History,
  Info,
  Layers,
  ArrowRight,
  Award,
  UserCheck,
} from 'lucide-react';
import {
  CURRENT_RELEASE,
  CURRENT_VERSION,
  DISPLAY_VERSION,
  SHORT_VERSION,
  PREVIOUS_RELEASES,
  SYSTEM_FULL_NAME,
  SYSTEM_SUBTITLE,
} from '../config/version';

interface VersionBadgeProps {
  className?: string;
  onOpenCredits?: () => void;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  className = '',
  onOpenCredits,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending close timeout
  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Schedule close with a grace delay for comfortable mouse transit
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  // Toggle on click / tap
  const handleClickToggle = () => {
    cancelClose();
    setIsOpen(prev => !prev);
  };

  // Click outside to dismiss
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDownOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
      cancelClose();
    };
  }, [isOpen]);

  const togglePreviousRelease = (ver: string) => {
    setExpandedPrevious(prev => (prev === ver ? null : ver));
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      {/* Interactive Trigger Pill */}
      <button
        type="button"
        onClick={handleClickToggle}
        onMouseEnter={() => {
          cancelClose();
          setIsOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={`${DISPLAY_VERSION} — Click or hover to view update history`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer select-none border ${
          isOpen
            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:border-zinc-300 shadow-2xs'
        }`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">{DISPLAY_VERSION}</span>
        <span className="sm:hidden">{SHORT_VERSION}</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-200' : ''
          }`}
        />
      </button>

      {/* Version Information & Update History Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="DEC System Version & Update History"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute right-0 top-full mt-2 w-[370px] sm:w-[440px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-zinc-900 text-white flex items-start justify-between gap-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">DEC</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-emerald-500 text-zinc-950">
                  {SHORT_VERSION}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  Latest Stable
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-300 mt-0.5">{SYSTEM_FULL_NAME}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{SYSTEM_SUBTITLE}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close version panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content with Smooth Scroll */}
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-zinc-100 text-zinc-800">
            {/* LATEST UPDATE SECTION */}
            <div className="p-5 bg-gradient-to-b from-emerald-50/50 to-white">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  LATEST UPDATE
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-medium">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  {CURRENT_RELEASE.releaseDate}
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">
                {CURRENT_RELEASE.title}
              </h4>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                {CURRENT_RELEASE.summary}
              </p>

              {/* Highlights List */}
              <div className="mt-3.5 space-y-2">
                <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  Key Highlights
                </p>
                <ul className="space-y-1.5">
                  {CURRENT_RELEASE.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Credit / Suggested By Card */}
              {CURRENT_RELEASE.credit && (
                <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 via-emerald-50/40 to-amber-50 border border-amber-200/90 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-900">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Feature Credit & Contribution</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5 text-xs">
                    <span className="text-zinc-600 font-medium">Suggested By:</span>
                    <span className="font-extrabold text-zinc-950 bg-white/90 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                      {CURRENT_RELEASE.credit.suggestedBy}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-zinc-800 leading-snug">
                    <strong className="text-zinc-950 font-bold">{CURRENT_RELEASE.credit.feature}:</strong>{' '}
                    {CURRENT_RELEASE.credit.description}
                  </div>
                  {CURRENT_RELEASE.credit.purpose && (
                    <div className="mt-1 text-[11px] text-emerald-900 font-medium">
                      <span className="font-bold">Purpose:</span> {CURRENT_RELEASE.credit.purpose}
                    </div>
                  )}
                  {onOpenCredits && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCredits();
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                    >
                      <span>View in Credit & Contribution</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Granular Changes (if present) */}
              {CURRENT_RELEASE.changes && CURRENT_RELEASE.changes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-100">
                  <div className="flex flex-wrap gap-1.5">
                    {CURRENT_RELEASE.changes.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          item.type === 'feature'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.type === 'fix'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <span className="font-mono uppercase text-[9px]">{item.type}</span>
                        <span>•</span>
                        <span>{item.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PREVIOUS UPDATES SECTION */}
            <div className="p-5 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  PREVIOUS UPDATES
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {PREVIOUS_RELEASES.length} previous releases
                </span>
              </div>

              <div className="space-y-2">
                {PREVIOUS_RELEASES.map(release => {
                  const isExpanded = expandedPrevious === release.version;

                  return (
                    <div
                      key={release.version}
                      className="border border-zinc-200 rounded-xl overflow-hidden transition-colors bg-zinc-50/50 hover:bg-zinc-50"
                    >
                      <button
                        type="button"
                        onClick={() => togglePreviousRelease(release.version)}
                        className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-800 shadow-2xs">
                            v{release.version}
                          </span>
                          <span className="text-xs font-bold text-zinc-800 truncate max-w-[170px] sm:max-w-[210px]">
                            {release.title}
                          </span>
                          {release.credit && (
                            <span className="hidden xs:inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200/80 shrink-0">
                              <Award className="w-2.5 h-2.5 text-amber-600" />
                              <span>{release.credit.suggestedBy.split(' ')[0]}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                            {release.releaseDate}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3 pt-1 border-t border-zinc-200/80 bg-white">
                          <p className="text-xs text-zinc-600 leading-relaxed mb-2">
                            {release.summary}
                          </p>
                          <ul className="space-y-1">
                            {release.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-600">
                                <span className="text-zinc-400 mt-0.5">•</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                          {release.credit && (
                            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs">
                              <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-amber-900">
                                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>
                                  Feature Credit: <span className="font-extrabold text-zinc-950">{release.credit.suggestedBy}</span>
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-700 mt-1 leading-snug">
                                <strong className="text-zinc-950 font-bold">{release.credit.feature}:</strong>{' '}
                                {release.credit.description}
                              </p>
                              {release.credit.purpose && (
                                <div className="mt-0.5 text-[10.5px] text-emerald-900 font-medium">
                                  <span className="font-bold">Purpose:</span> {release.credit.purpose}
                                </div>
                              )}
                              {onOpenCredits && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false);
                                    onOpenCredits();
                                  }}
                                  className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                                >
                                  <span>View in Credit & Contribution</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Continuity Edition • Bundled Offline</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
