import type { DressDesign, DressCustomizations, BaseStyle } from '../../types/dress';
import { DEFAULT_CUSTOMIZATIONS } from '../../types/dress';
import DressCanvas from './DressCanvas';

interface DressPreviewProps {
  design: DressDesign;
  onClick?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function DressPreview({ design, onClick, onDelete, showActions = false }: DressPreviewProps) {
  let customizations: DressCustomizations;
  try {
    customizations = JSON.parse(design.customizations);
  } catch {
    customizations = DEFAULT_CUSTOMIZATIONS;
  }

  return (
    <div
      className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all hover:border-gray-500 hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Dress preview */}
      <div className="bg-gray-900/50 p-4 flex items-center justify-center" style={{ height: 240 }}>
        {design.imageUrl ? (
          <img
            src={design.imageUrl}
            alt={design.name}
            className="max-h-full max-w-full object-contain rounded"
          />
        ) : (
          <DressCanvas
            customizations={customizations}
            baseStyle={design.baseStyle as BaseStyle}
            width={160}
            height={220}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-medium text-sm truncate">{design.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400 capitalize">{design.baseStyle}</span>
          {design.isPreset && (
            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">Preset</span>
          )}
          <div
            className="w-4 h-4 rounded-full border border-gray-600 ml-auto"
            style={{ backgroundColor: customizations.color }}
          />
        </div>
        {showActions && onDelete && !design.isPreset && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="mt-3 w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
