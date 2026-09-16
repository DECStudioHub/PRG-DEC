import React, { useState } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { ShelfTagItem, ShelfTagStyle } from '../../types';

interface AddEditTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: ShelfTagItem) => void;
  initialTag?: ShelfTagItem | null;
}

export const AddEditTagModal: React.FC<AddEditTagModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTag,
}) => {
  const [tagStyle, setTagStyle] = useState<ShelfTagStyle>(initialTag?.tagStyle || 'yellow');
  const [description, setDescription] = useState(initialTag?.description || '');
  const [promoHeader, setPromoHeader] = useState(initialTag?.promoHeader || 'SAVE ₱15.00');
  const [promoSubtext, setPromoSubtext] = useState(initialTag?.promoSubtext || 'SAVE ₱15.00 • LIMITED TIME OFFER');
  const [promoValidity, setPromoValidity] = useState(initialTag?.promoValidity || 'Valid until Sept 30');
  const [sku, setSku] = useState(initialTag?.sku || '');
  const [barcode, setBarcode] = useState(initialTag?.barcode || '');
  const [regularPrice, setRegularPrice] = useState(initialTag?.regularPrice ? String(initialTag.regularPrice) : '99.00');
  const [promoPrice, setPromoPrice] = useState(initialTag?.promoPrice ? String(initialTag.promoPrice) : '84.00');
  const [unit, setUnit] = useState(initialTag?.unit || 'per PC');
  const [locator, setLocator] = useState(initialTag?.locator || 'A01-01');
  const [category, setCategory] = useState(initialTag?.category || 'Grocery');
  const [copies, setCopies] = useState<number>(initialTag?.copies && initialTag.copies > 0 ? initialTag.copies : 1);
  const [buyPerAndUp, setBuyPerAndUp] = useState(initialTag?.buyPerAndUp || '');
  const [buyPer, setBuyPer] = useState(initialTag?.buyPer !== undefined ? String(initialTag.buyPer) : '');
  const [up, setUp] = useState(initialTag?.up !== undefined ? String(initialTag.up) : '');
  const [tagDate, setTagDate] = useState(initialTag?.tagDate || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !sku.trim()) {
      alert('Please provide at least a Description and SKU/Code.');
      return;
    }

    const regPriceNum = Math.max(0, parseFloat(regularPrice) || 0);
    const promoPriceNum = tagStyle === 'yellow' ? (parseFloat(promoPrice) || null) : null;
    const copiesNum = Math.max(1, Math.floor(Number(copies) || 1));

    const newTag: ShelfTagItem = {
      id: initialTag?.id || `tag-${Date.now()}`,
      tagStyle,
      description: description.trim().toUpperCase(),
      promoHeader: tagStyle === 'yellow' ? promoHeader.trim() : undefined,
      promoSubtext: tagStyle === 'yellow' ? promoSubtext.trim() : undefined,
      promoValidity: tagStyle === 'yellow' ? promoValidity.trim() : undefined,
      sku: sku.trim().toUpperCase(),
      barcode: (barcode.trim() || sku.trim()).toUpperCase(),
      regularPrice: regPriceNum,
      promoPrice: promoPriceNum,
      unit: unit.trim() || 'per PC',
      locator: locator.trim().toUpperCase(),
      category: category.trim() || 'Grocery',
      isSelected: initialTag?.isSelected ?? true,
      copies: copiesNum,
      buyPerAndUp: buyPerAndUp.trim() || undefined,
      buyPer: buyPer.trim() || undefined,
      up: up.trim() || undefined,
      tagDate: tagDate.trim() || undefined,
    };

    onSave(newTag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {initialTag ? 'Edit Shelf / PP Tag' : 'Add Single Shelf / PP Tag'}
              </h3>
              <p className="text-xs text-zinc-500">
                Configure tag style, pricing, barcode, and display values
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Tag Style Selector */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">Tag Style</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTagStyle('white')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                  tagStyle === 'white'
                    ? 'border-zinc-900 bg-white shadow-xs text-zinc-900 ring-2 ring-zinc-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-zinc-400" />
                <span>White Tag (Regular)</span>
              </button>

              <button
                type="button"
                onClick={() => setTagStyle('yellow')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                  tagStyle === 'yellow'
                    ? 'border-amber-500 bg-amber-100 text-amber-950 ring-2 ring-amber-500'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Yellow Tag (Promo / PP)</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Item Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. COCA-COLA ZERO SUGAR 1.5L PET BOTTLE"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-medium focus:bg-white focus:ring-2 focus:ring-zinc-800 focus:outline-hidden uppercase"
            />
          </div>

          {/* Promo Fields (if Yellow Tag) */}
          {tagStyle === 'yellow' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wider block">
                Promo Tag Custom Headers
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Top Promo Banner Text</label>
                  <input
                    type="text"
                    value={promoHeader}
                    onChange={e => setPromoHeader(e.target.value)}
                    placeholder="e.g. SAVE ₱13.00 or HOT BUY"
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-zinc-900 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Validity / Note Text</label>
                  <input
                    type="text"
                    value={promoValidity}
                    onChange={e => setPromoValidity(e.target.value)}
                    placeholder="e.g. Valid until Sept 30"
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. BEV-1002"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Barcode / UPC</label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="e.g. 4800016644052"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Pricing: Regular Price & Promo Price & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Regular Price (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={regularPrice}
                onChange={e => setRegularPrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                {tagStyle === 'yellow' ? 'Promo Price (₱) *' : 'Promo Price'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={tagStyle === 'white'}
                value={tagStyle === 'yellow' ? promoPrice : ''}
                onChange={e => setPromoPrice(e.target.value)}
                placeholder={tagStyle === 'white' ? 'N/A' : '65.00'}
                className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${
                  tagStyle === 'white'
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    : 'bg-zinc-50 border-amber-300 text-red-600 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. per BTL"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-medium uppercase"
              />
            </div>
          </div>

          {/* Locator & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Locator</label>
              <input
                type="text"
                value={locator}
                onChange={e => setLocator(e.target.value)}
                placeholder="e.g. A01-02"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Beverages"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900"
              />
            </div>
          </div>

          {/* Module 2 Reference & Copy Quantity Section */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-zinc-800 tracking-wider">
                Print & Reference Settings
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Layout Option 1 & 2 Support</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Copy Quantity */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Tag Copies (QTY)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 rounded-l-lg font-bold text-zinc-800 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={copies}
                    onChange={e => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2 py-1.5 bg-white border-y border-zinc-300 text-center font-bold text-zinc-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies(prev => prev + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 rounded-r-lg font-bold text-zinc-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Physical tags to print</span>
              </div>

              {/* Buy Per and Up (Yellow Tag Promo Tier) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    BUY_PER
                  </label>
                  <input
                    type="text"
                    value={buyPer}
                    onChange={e => setBuyPer(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-bold"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Quantity tier</span>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    UP
                  </label>
                  <input
                    type="text"
                    value={up}
                    onChange={e => setUp(e.target.value)}
                    placeholder="e.g. 1 or AND UP"
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-bold uppercase"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Tier modifier</span>
                </div>
              </div>

              {/* Tag Date (White Tag Date) */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Tag Date
                </label>
                <input
                  type="text"
                  value={tagDate}
                  onChange={e => setTagDate(e.target.value)}
                  placeholder="DD.MM.YYYY or blank for today"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">White tag stamp date</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 hover:text-zinc-800 font-bold rounded-xl cursor-pointer hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialTag ? 'Save Changes' : 'Add Tag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
