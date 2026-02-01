import { PRESET_COLORS } from '../../types/dress';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
      
      {/* Preset colors grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
              value === color ? 'border-white scale-110 ring-2 ring-blue-400' : 'border-gray-600'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom color picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400">Custom:</label>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border border-gray-600 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="bg-gray-700 text-white text-xs px-2 py-1 rounded w-20 border border-gray-600"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
