import type { DressCustomizations, BaseStyle } from '../../types/dress';
import { STRAP_OPTIONS, BACK_STYLE_OPTIONS, BASE_STYLE_OPTIONS, NECKLINE_OPTIONS } from '../../types/dress';
import ColorPicker from './ColorPicker';

interface CustomizationPanelProps {
  customizations: DressCustomizations;
  baseStyle: BaseStyle;
  onChange: (updates: Partial<DressCustomizations>) => void;
  onBaseStyleChange: (style: BaseStyle) => void;
}

export default function CustomizationPanel({
  customizations,
  baseStyle,
  onChange,
  onBaseStyleChange,
}: CustomizationPanelProps) {
  return (
    <div className="space-y-6">
      {/* Base Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Dress Style</label>
        <div className="grid grid-cols-2 gap-2">
          {BASE_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onBaseStyleChange(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                baseStyle === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Length: {getLengthLabel(customizations.length)}
        </label>
        <input
          type="range"
          min={30}
          max={100}
          value={customizations.length}
          onChange={(e) => onChange({ length: Number(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Mini</span>
          <span>Midi</span>
          <span>Maxi</span>
          <span>Floor</span>
        </div>
      </div>

      {/* Strap Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Straps</label>
        <div className="grid grid-cols-2 gap-2">
          {STRAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ strapType: opt.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                customizations.strapType === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Neckline */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Neckline</label>
        <div className="grid grid-cols-2 gap-2">
          {NECKLINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ neckline: opt.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                customizations.neckline === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Back Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Back Style</label>
        <div className="grid grid-cols-2 gap-2">
          {BACK_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ backStyle: opt.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                customizations.backStyle === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <ColorPicker
        value={customizations.color}
        onChange={(color) => onChange({ color })}
      />
    </div>
  );
}

function getLengthLabel(length: number): string {
  if (length <= 40) return 'Mini';
  if (length <= 55) return 'Above Knee';
  if (length <= 70) return 'Midi';
  if (length <= 85) return 'Below Knee';
  if (length <= 95) return 'Maxi';
  return 'Floor Length';
}
