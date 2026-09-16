import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Tag,
  Table,
  CheckCircle2,
  Scan,
  ShieldCheck,
  ArrowRight,
  X,
  FileCheck,
  Volume2,
} from 'lucide-react';
import { playRetailWelcomeSound } from '../utils/welcomeAudio';
import { DEFAULT_PRINCE_LOGO, PRINCE_LOGO_INLINE_SVG, getEffectiveLogoUrl } from '../utils/theme';
import { SystemSettings } from '../types';
import { DISPLAY_VERSION } from '../config/version';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemoData: () => void;
  onOpenImport: () => void;
  settings?: SystemSettings;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLoadDemoData,
  onOpenImport,
  settings,
}) => {
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const playedOnceForOpenRef = useRef<boolean>(false);

  // Play short retail welcome chime once on modal opening if permitted
  useEffect(() => {
    if (isOpen) {
      if (!playedOnceForOpenRef.current) {
        playedOnceForOpenRef.current = true;
        setIsPlayingSound(true);
        playRetailWelcomeSound()
          .then((played) => {
            if (!played) {
              setIsPlayingSound(false);
            } else {
              setTimeout(() => setIsPlayingSound(false), 2200);
            }
          })
          .catch(() => {
            setIsPlayingSound(false);
          });
      }
    } else {
      playedOnceForOpenRef.current = false;
      setIsPlayingSound(false);
    }
  }, [isOpen]);

  const handleManualPlaySound = () => {
    setIsPlayingSound(true);
    playRetailWelcomeSound()
      .then((played) => {
        if (!played) {
          setIsPlayingSound(false);
        } else {
          setTimeout(() => setIsPlayingSound(false), 2200);
        }
      })
      .catch(() => {
        setIsPlayingSound(false);
      });
  };

  if (!isOpen) return null;

  const handleDontShowAgain = (checked: boolean) => {
    try {
      if (checked) {
        localStorage.setItem('prg_hide_welcome', 'true');
      } else {
        localStorage.removeItem('prg_hide_welcome');
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5 animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* Top Utility Bar: Sound control & Close */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <button
            type="button"
            onClick={handleManualPlaySound}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isPlayingSound
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border-zinc-200 shadow-2xs'
            }`}
            title="Play Retail Welcome Sound Chime"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingSound ? 'text-emerald-700 animate-pulse' : 'text-zinc-500'}`} />
            <span>{isPlayingSound ? 'Playing Chime...' : '🔊 Play Welcome Sound'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
            title="Close Welcome"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Welcome Banner */}
        <div className="text-center space-y-3 pb-5 border-b border-zinc-100">
          {/* 1. WELCOME & Version Pill */}
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-black tracking-widest uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>WELCOME</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono font-bold">
              {DISPLAY_VERSION}
            </span>
          </div>

          {/* 2. DEC (Prominent System Title) */}
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tight text-center">
            {settings?.systemName || 'DEC'}
          </h2>

          {/* 3. Subtitle */}
          <p className="text-base sm:text-lg font-bold text-zinc-800 tracking-tight text-center">
            {settings?.systemTagline || 'Digital Efficiency & Continuity System'}
          </p>

          {/* 4. Second descriptive line */}
          <p className="text-xs sm:text-sm font-medium text-zinc-500 tracking-normal text-center max-w-lg mx-auto">
            {settings?.systemSubtitle || 'Backup • Continuity • Alternative Process • Process Improvement'}
          </p>

          {/* 5. [Prince Retail Logo] — Clearly visible, un-distorted, perfectly centered */}
          <div className="flex items-center justify-center py-1.5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-zinc-200 shadow-xs p-2 flex items-center justify-center transition-transform hover:scale-105">
              <img
                src={getEffectiveLogoUrl(settings?.customLogoUrl)}
                alt="Prince Retail Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== PRINCE_LOGO_INLINE_SVG) {
                    target.src = PRINCE_LOGO_INLINE_SVG;
                  }
                }}
              />
            </div>
          </div>

          {/* 6. DECStudioAiCreation: Bold, 50px Desktop, Center Aligned */}
          <h1 className="font-bold text-3xl sm:text-4xl md:text-[50px] leading-tight md:leading-none text-zinc-900 tracking-tight text-center">
            DECStudioAiCreation
          </h1>

          {/* 7. Creator Disclaimer Statement */}
          <div className="pt-2 max-w-xl mx-auto">
            <p className="text-xs sm:text-sm font-medium text-zinc-600 italic tracking-normal text-center bg-zinc-50 border border-zinc-200/90 rounded-xl px-4 py-2.5 shadow-2xs">
              “I’m not a programmer. I’m a human with a bold imagination—and AI is the tool that brings my ideas to life.”
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Feature 1: Count Sheet */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Table className="w-4 h-4 text-emerald-700" />
              <span>Count Sheet & Tag Module</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Generate standardized physical inventory tally sheets with movable reorderable columns (SKU, Barcode, Description, Count), customizable high-contrast borders, and 15-row layout.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimized 12mm handwriting boxes</span>
            </div>
          </div>

          {/* Feature 2: Scanner Readability */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Scan className="w-4 h-4 text-emerald-700" />
              <span>High-Scan Barcode Engine</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Enhanced Code-128 barcode generator with dedicated optical quiet zones (10px margin padding) and calibrated bar ratios for instant red-laser scanner capture.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% handheld scanner reliability</span>
            </div>
          </div>

          {/* Feature 3: ShelfTag / PP Tag */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>Shelf Tag & PP Tag (Module 2)</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Full retail shelf-edge pricing labels, Price Point promo tags, and customized store branding headers ready for perforated paper or sheet printing.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dual module architecture</span>
            </div>
          </div>

          {/* Feature 4: Raw Excel Safe */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Safe Raw Excel Import</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Client-side read-only parsing ensures your original Excel files are never altered or damaged. Large files with &gt;500 rows are fully supported with non-blocking performance notices.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero data corruption guarantee</span>
            </div>
          </div>
        </div>

        {/* Quick Start Workflow */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <span className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
            Fast 5-Step Workflow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-medium text-emerald-950">
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">1. Select Tag</span>
              Choose Yellow or White Tag
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">2. Import / Add</span>
              Upload Excel or enter items
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">3. Field Editor</span>
              Customize tag positions & mm
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">4. Sheet Setup</span>
              Paper, margins, & colors
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
              <span className="font-bold text-emerald-800 block">5. Print & PDF</span>
              Live preview, browser print, & PDF
            </div>
          </div>
        </div>

        {/* Creator Imagination & AI Disclaimer */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
          <p className="text-xs font-medium italic text-amber-950 tracking-tight leading-relaxed">
            “I’m not a programmer. I’m a human with a bold imagination—and AI is the tool that brings my ideas to life.”
          </p>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10.5px] font-semibold text-amber-800/80 uppercase tracking-wider">
            <span>DECStudioAiCreation</span>
            <span>•</span>
            <span>DEC v2.0.3</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-100">
          <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              onChange={e => handleDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
            <span>Don't show this welcome screen on startup</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadDemoData();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-colors"
            >
              Load Demo Data
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImport();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
