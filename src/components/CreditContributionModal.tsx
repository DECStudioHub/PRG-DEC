import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Award,
  Sparkles,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  FileCheck,
  RotateCcw,
  Tag,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import {
  Contributor,
  Contribution,
  getStoredContributors,
  saveStoredContributors,
  getContributionStats,
  addContribution,
  resetContributorsToDefault,
  CONTRIBUTION_STORAGE_KEY,
} from '../config/contributions';
import { CURRENT_VERSION } from '../config/version';

interface CreditContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVersion?: (versionTag?: string) => void;
}

export const CreditContributionModal: React.FC<CreditContributionModalProps> = ({
  isOpen,
  onClose,
  onOpenVersion,
}) => {
  const [contributors, setContributors] = useState<Contributor[]>(getStoredContributors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New contribution form state
  const [formData, setFormData] = useState({
    name: '',
    feature: '',
    version: `v${CURRENT_VERSION}`,
    type: 'Feature Suggestion / Process Improvement',
    description: '',
    purpose: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Sync with localStorage or external updates
  useEffect(() => {
    if (isOpen) {
      setContributors(getStoredContributors());
    }

    const handleStorageChange = () => {
      setContributors(getStoredContributors());
    };

    window.addEventListener('dec:contributions-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dec:contributions-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddModalOpen, onClose]);

  // Compute stats
  const stats = useMemo(() => getContributionStats(contributors), [contributors]);

  // Unique types for filtering
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    for (const c of contributors) {
      for (const item of c.contributions) {
        if (item.type) types.add(item.type);
      }
    }
    return Array.from(types);
  }, [contributors]);

  // Filter contributors and their contributions based on search and type filter
  const filteredContributors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return contributors
      .map(person => {
        const personMatches = person.name.toLowerCase().includes(query);

        // Filter individual contributions
        const matchingContributions = person.contributions.filter(contrib => {
          // Type filter check
          if (selectedTypeFilter !== 'all') {
            const matchesType = contrib.type.toLowerCase().includes(selectedTypeFilter.toLowerCase());
            if (!matchesType) return false;
          }

          // Search query check
          if (!query) return true;
          if (personMatches) return true;

          return (
            contrib.feature.toLowerCase().includes(query) ||
            contrib.version.toLowerCase().includes(query) ||
            contrib.description.toLowerCase().includes(query) ||
            (contrib.purpose && contrib.purpose.toLowerCase().includes(query)) ||
            (contrib.notes && contrib.notes.toLowerCase().includes(query)) ||
            contrib.type.toLowerCase().includes(query)
          );
        });

        if (matchingContributions.length > 0) {
          return {
            ...person,
            contributions: matchingContributions,
          };
        }
        return null;
      })
      .filter((p): p is Contributor => p !== null);
  }, [contributors, searchQuery, selectedTypeFilter]);

  // Handle saving new contribution
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Contributor name is required.');
      return;
    }
    if (!formData.feature.trim()) {
      setFormError('Feature or Contribution title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required.');
      return;
    }

    try {
      const updated = addContribution(formData);
      setContributors([...updated]);
      setIsAddModalOpen(false);
      setFormError(null);
      // Reset form
      setFormData({
        name: '',
        feature: '',
        version: `v${CURRENT_VERSION}`,
        type: 'Feature Suggestion / Process Improvement',
        description: '',
        purpose: '',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        notes: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contribution.');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset contributors back to official system records? Any custom added records will be removed.')) {
      const defaults = resetContributorsToDefault();
      setContributors([...defaults]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 print:hidden"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="credit-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Credit & Contribution
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950">
                  DEC Team & Contributors
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Recognizing individuals whose ideas, feature suggestions, and process improvements power DEC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Record a new contributor idea or feature"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Contribution</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 px-5 sm:px-6 py-3.5 text-white border-b border-zinc-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                CREDIT & CONTRIBUTION SUMMARY
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">
                Collaborative contributions integrated into official system releases
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  People Contributed
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                  {stats.totalPeople}
                </div>
              </div>

              <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Contributions
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {stats.totalContributions}
                </div>
              </div>

              <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Features / Improvements
                </div>
                <div className="text-lg sm:text-xl font-black text-blue-400 font-mono mt-0.5">
                  {stats.featureSuggestionsCount + stats.processImprovementsCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-5 sm:px-6 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by person, feature, version, or keyword..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-zinc-500 font-semibold flex items-center gap-1 text-[11px] shrink-0">
              <Filter className="w-3 h-3 text-zinc-400" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-300'
              }`}
            >
              All Types
            </button>
            {availableTypes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors shrink-0 cursor-pointer truncate max-w-[200px] ${
                  selectedTypeFilter === t
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-300'
                }`}
                title={t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Contributor Cards Section */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-zinc-100/50">
          {filteredContributors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 p-6">
              <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-zinc-800">No contributors match your filter</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Try clearing the search query or changing the contribution type filter.
              </p>
              {(searchQuery || selectedTypeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTypeFilter('all');
                  }}
                  className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredContributors.map(person => (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden transition-all hover:border-zinc-300"
              >
                {/* Contributor Profile Header */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-zinc-50 via-white to-amber-50/30 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-800 font-black text-sm shrink-0 shadow-2xs">
                      👤
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-zinc-950 tracking-tight">
                        {person.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Contributions: {person.contributions.length}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    Recognized Contributor
                  </span>
                </div>

                {/* List of Contributions under this Person */}
                <div className="p-5 divide-y divide-zinc-100 space-y-4">
                  {person.contributions.map((contrib, idx) => (
                    <div key={contrib.id} className={idx > 0 ? 'pt-4' : ''}>
                      {/* Top line: Feature title, version badge, type pill */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
                              <span className="text-amber-500">•</span>
                              <span>{contrib.feature}</span>
                            </span>

                            {/* Version badge */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenVersion) {
                                  onOpenVersion(contrib.version);
                                }
                              }}
                              className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                              title={`View ${contrib.version} in Version History`}
                            >
                              {contrib.version}
                            </button>

                            {/* Contribution Type Pill */}
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/90">
                              {contrib.type}
                            </span>
                          </div>

                          {contrib.date && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <Calendar className="w-3 h-3" />
                              <span>{contrib.date}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-700 leading-relaxed mt-2.5">
                        {contrib.description}
                      </p>

                      {/* Purpose & Goal Callout */}
                      {contrib.purpose && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs">
                          <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-amber-900 mb-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Purpose & Implementation Goal</span>
                          </div>
                          <p className="text-xs text-zinc-800 leading-snug font-medium">
                            {contrib.purpose}
                          </p>
                        </div>
                      )}

                      {/* Optional Notes */}
                      {contrib.notes && (
                        <div className="mt-2 text-[11px] text-zinc-500 italic">
                          <span className="font-semibold text-zinc-600 not-italic">Notes:</span> {contrib.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>DEC Continuous Improvement Initiative</span>
            <span>•</span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 underline cursor-pointer"
              title="Reset records to default"
            >
              Reset to Factory Records
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add Contribution Sub-Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-zinc-950">
                  Record New Contribution
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveContribution} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  CONTRIBUTOR NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diodito De Los Santos Jr. or John Lord Sarte"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  If this person already exists, this new contribution will be grouped under them.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    VERSION *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.0.5"
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    CONTRIBUTION TYPE *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2.5 py-2 border border-zinc-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Process Improvement / Enhancement">Process Improvement / Enhancement</option>
                    <option value="Feature Suggestion / Process Improvement">Feature Suggestion / Process Improvement</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                    <option value="Process Improvement">Process Improvement</option>
                    <option value="Enhancement">Enhancement</option>
                    <option value="Usability Improvement">Usability Improvement</option>
                    <option value="Business Continuity">Business Continuity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  FEATURE / CONTRIBUTION TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9 Count Tags Per Page Print Optimization"
                  value={formData.feature}
                  onChange={e => setFormData({ ...formData, feature: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  DESCRIPTION *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the contribution, what was suggested, and how it was implemented..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  PURPOSE & IMPLEMENTATION GOAL (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Maximize Bond Paper usage by allowing remaining Count Tag slots to be filled by the next Locator."
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  OPTIONAL NOTES
                </label>
                <input
                  type="text"
                  placeholder="Additional context or references"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
