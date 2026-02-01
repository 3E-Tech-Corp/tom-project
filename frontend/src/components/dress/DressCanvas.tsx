import type { DressCustomizations, BaseStyle } from '../../types/dress';

interface DressCanvasProps {
  customizations: DressCustomizations;
  baseStyle: BaseStyle;
  width?: number;
  height?: number;
  showBack?: boolean;
}

export default function DressCanvas({
  customizations,
  baseStyle,
  width = 400,
  height = 600,
  showBack = false,
}: DressCanvasProps) {
  const { length, strapType, backStyle, color, neckline } = customizations;

  // Scale factor based on canvas size
  const sx = width / 400;
  const sy = height / 600;

  // Dress length maps 30-100 to actual pixel positions
  const hemY = 180 + (length / 100) * 380; // ranges from ~294 to 560
  const waistY = 220;
  const bustY = 160;
  const shoulderY = 100;

  // Calculate skirt width based on base style
  const getSkirtWidth = (): { leftHem: number; rightHem: number; midControl?: number } => {
    const baseWidth = 60;
    switch (baseStyle) {
      case 'a-line':
        return { leftHem: 200 - baseWidth - (length * 0.6), rightHem: 200 + baseWidth + (length * 0.6) };
      case 'mermaid': {
        const flare = length > 80 ? 40 : 20;
        return {
          leftHem: 200 - baseWidth - flare,
          rightHem: 200 + baseWidth + flare,
          midControl: 0.85, // tight through hips, flares at bottom
        };
      }
      case 'empire':
        return { leftHem: 200 - baseWidth - (length * 0.7), rightHem: 200 + baseWidth + (length * 0.7) };
      case 'fit-flare':
        return { leftHem: 200 - baseWidth - (length * 0.8), rightHem: 200 + baseWidth + (length * 0.8) };
      case 'sheath':
        return { leftHem: 200 - baseWidth - 10, rightHem: 200 + baseWidth + 10 };
      default:
        return { leftHem: 200 - baseWidth - (length * 0.5), rightHem: 200 + baseWidth + (length * 0.5) };
    }
  };

  const skirt = getSkirtWidth();

  // Build the bodice neckline path
  const getNecklinePath = (): string => {
    if (showBack) {
      switch (backStyle) {
        case 'open':
          return `M 155,${bustY} Q 175,${bustY + 30} 200,${bustY + 40} Q 225,${bustY + 30} 245,${bustY}`;
        case 'low-cut':
          return `M 155,${bustY} Q 175,${waistY + 10} 200,${waistY + 20} Q 225,${waistY + 10} 245,${bustY}`;
        case 'cross':
          return `M 155,${bustY} L 200,${bustY + 20} L 245,${bustY}`;
        case 'closed':
        default:
          return `M 155,${shoulderY + 20} Q 200,${shoulderY + 30} 245,${shoulderY + 20}`;
      }
    }

    switch (neckline) {
      case 'sweetheart':
        return `M 155,${bustY} Q 165,${bustY - 15} 178,${bustY - 10} Q 190,${bustY + 5} 200,${bustY - 5} Q 210,${bustY + 5} 222,${bustY - 10} Q 235,${bustY - 15} 245,${bustY}`;
      case 'v-neck':
        return `M 155,${bustY - 10} L 200,${bustY + 25} L 245,${bustY - 10}`;
      case 'scoop':
        return `M 155,${bustY - 10} Q 200,${bustY + 20} 245,${bustY - 10}`;
      case 'halter':
        return `M 165,${bustY} Q 200,${bustY + 10} 235,${bustY}`;
      case 'off-shoulder':
        return `M 140,${bustY + 10} Q 170,${bustY - 5} 200,${bustY + 5} Q 230,${bustY - 5} 260,${bustY + 10}`;
      case 'square':
        return `M 155,${bustY - 10} L 155,${bustY + 10} L 245,${bustY + 10} L 245,${bustY - 10}`;
      default:
        return `M 155,${bustY} Q 200,${bustY + 15} 245,${bustY}`;
    }
  };

  // Build strap paths
  const getStraps = (): JSX.Element | null => {
    const strapColor = adjustColor(color, -20);

    switch (strapType) {
      case 'strapless':
        return null;
      case 'spaghetti':
        return (
          <g>
            <line x1={170} y1={bustY - 8} x2={175} y2={shoulderY - 20} stroke={strapColor} strokeWidth={2} />
            <line x1={230} y1={bustY - 8} x2={225} y2={shoulderY - 20} stroke={strapColor} strokeWidth={2} />
          </g>
        );
      case 'thick':
        return (
          <g>
            <path d={`M 160,${bustY - 5} Q 160,${shoulderY - 10} 170,${shoulderY - 20} L 185,${shoulderY - 20} Q 175,${shoulderY - 10} 175,${bustY - 5} Z`} fill={color} stroke={strapColor} strokeWidth={1} />
            <path d={`M 240,${bustY - 5} Q 240,${shoulderY - 10} 230,${shoulderY - 20} L 215,${shoulderY - 20} Q 225,${shoulderY - 10} 225,${bustY - 5} Z`} fill={color} stroke={strapColor} strokeWidth={1} />
          </g>
        );
      case 'halter':
        return (
          <g>
            <path d={`M 170,${bustY} Q 185,${bustY - 20} 200,${shoulderY - 30} Q 215,${bustY - 20} 230,${bustY}`} fill="none" stroke={strapColor} strokeWidth={4} />
          </g>
        );
      case 'off-shoulder':
        return (
          <g>
            <path d={`M 140,${bustY + 10} Q 130,${bustY + 5} 125,${bustY + 15} Q 135,${bustY + 20} 155,${bustY + 5}`} fill={color} stroke={strapColor} strokeWidth={1} />
            <path d={`M 260,${bustY + 10} Q 270,${bustY + 5} 275,${bustY + 15} Q 265,${bustY + 20} 245,${bustY + 5}`} fill={color} stroke={strapColor} strokeWidth={1} />
          </g>
        );
      default:
        return null;
    }
  };

  // Build the full dress body path
  const getDressPath = (): string => {
    const neckPath = getNecklinePath();
    const waistLeft = 155;
    const waistRight = 245;

    if (baseStyle === 'mermaid') {
      const tightHipY = waistY + (hemY - waistY) * (skirt.midControl ?? 0.85);
      return `${neckPath} 
        L ${waistRight},${waistY} 
        Q ${waistRight + 5},${tightHipY} ${waistRight - 5},${tightHipY}
        Q ${skirt.rightHem + 10},${hemY - 20} ${skirt.rightHem},${hemY}
        L ${skirt.leftHem},${hemY}
        Q ${skirt.leftHem - 10},${hemY - 20} ${waistLeft + 5},${tightHipY}
        Q ${waistLeft - 5},${tightHipY} ${waistLeft},${waistY}
        Z`;
    }

    if (baseStyle === 'empire') {
      const empireWaistY = bustY + 20;
      return `${neckPath}
        L ${waistRight - 10},${empireWaistY}
        Q ${(waistRight + skirt.rightHem) / 2},${(empireWaistY + hemY) / 2} ${skirt.rightHem},${hemY}
        L ${skirt.leftHem},${hemY}
        Q ${(waistLeft + skirt.leftHem) / 2},${(empireWaistY + hemY) / 2} ${waistLeft + 10},${empireWaistY}
        Z`;
    }

    return `${neckPath}
      L ${waistRight},${waistY}
      Q ${(waistRight + skirt.rightHem) / 2},${(waistY + hemY) / 2} ${skirt.rightHem},${hemY}
      L ${skirt.leftHem},${hemY}
      Q ${(waistLeft + skirt.leftHem) / 2},${(waistY + hemY) / 2} ${waistLeft},${waistY}
      Z`;
  };

  // Back detail overlay (cross straps)
  const getBackDetails = (): JSX.Element | null => {
    if (!showBack) return null;
    if (backStyle === 'cross') {
      const strapColor = adjustColor(color, -20);
      return (
        <g>
          <line x1={165} y1={shoulderY - 15} x2={235} y2={bustY + 20} stroke={strapColor} strokeWidth={3} />
          <line x1={235} y1={shoulderY - 15} x2={165} y2={bustY + 20} stroke={strapColor} strokeWidth={3} />
        </g>
      );
    }
    return null;
  };

  const lighterColor = adjustColor(color, 30);
  const _unused = { sx, sy }; // suppress unused warnings for scale factors
  void _unused;

  return (
    <svg
      viewBox="0 0 400 600"
      width={width}
      height={height}
      className="drop-shadow-2xl"
    >
      <defs>
        <linearGradient id="dressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lighterColor} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={adjustColor(color, -15)} />
        </linearGradient>
        <filter id="dressShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.3" />
        </filter>
        <linearGradient id="fabricSheen" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </linearGradient>
      </defs>

      {/* Mannequin / body hint */}
      <g opacity={0.15}>
        {/* Neck */}
        <ellipse cx={200} cy={shoulderY - 35} rx={12} ry={18} fill="#d4a886" />
        {/* Shoulders */}
        <line x1={160} y1={shoulderY - 15} x2={240} y2={shoulderY - 15} stroke="#d4a886" strokeWidth={8} strokeLinecap="round" />
        {/* Head hint */}
        <circle cx={200} cy={shoulderY - 65} r={22} fill="#d4a886" />
      </g>

      {/* Main dress body */}
      <path
        d={getDressPath()}
        fill="url(#dressGradient)"
        stroke={adjustColor(color, -30)}
        strokeWidth={1.5}
        filter="url(#dressShadow)"
      />

      {/* Fabric sheen overlay */}
      <path
        d={getDressPath()}
        fill="url(#fabricSheen)"
      />

      {/* Waist detail line */}
      {baseStyle !== 'empire' && (
        <path
          d={`M 158,${waistY} Q 200,${waistY + 8} 242,${waistY}`}
          fill="none"
          stroke={adjustColor(color, -25)}
          strokeWidth={1}
          opacity={0.6}
        />
      )}

      {/* Empire waist line */}
      {baseStyle === 'empire' && (
        <path
          d={`M 160,${bustY + 20} Q 200,${bustY + 28} 240,${bustY + 20}`}
          fill="none"
          stroke={adjustColor(color, -25)}
          strokeWidth={1.5}
          opacity={0.6}
        />
      )}

      {/* Hem detail */}
      <path
        d={`M ${skirt.leftHem},${hemY} Q ${200},${hemY + 5} ${skirt.rightHem},${hemY}`}
        fill="none"
        stroke={adjustColor(color, -20)}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Straps */}
      {getStraps()}

      {/* Back details */}
      {getBackDetails()}

      {/* View label */}
      <text x={200} y={hemY + 30} textAnchor="middle" fill="#666" fontSize={12} fontFamily="sans-serif">
        {showBack ? 'Back View' : 'Front View'}
      </text>
    </svg>
  );
}

// Utility: lighten/darken a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
