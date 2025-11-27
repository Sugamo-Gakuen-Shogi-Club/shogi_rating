
import React from 'react';

interface ShogiPieceProps {
    char: string;
    isPromoted?: boolean;
    scale?: number;
    className?: string;
    shadow?: boolean;
}

export const ShogiPiece: React.FC<ShogiPieceProps> = ({ 
    char, 
    isPromoted = false, 
    scale = 1, 
    className = '',
    shadow = true
}) => {
    // 駒の色（黄楊・ツゲ）
    const woodColorLight = "#eecfa1";
    const woodColorDark = "#dcb879";
    const borderColor = "#8b5a2b";
    
    // 文字色
    const textColor = isPromoted ? "#dc2626" : "#0f172a";

    return (
        <div 
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ 
                width: `${scale * 80}px`, 
                height: `${scale * 88}px`,
                filter: shadow ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' : 'none'
            }}
        >
            <svg 
                viewBox="0 0 100 110" 
                className="w-full h-full overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f3e2c2" />
                        <stop offset="50%" stopColor="#eecfa1" />
                        <stop offset="100%" stopColor="#dcb879" />
                    </linearGradient>
                    <filter id="woodGrain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="0.3" intercept="0.7" />
                            <feFuncG type="linear" slope="0.3" intercept="0.7" />
                            <feFuncB type="linear" slope="0.3" intercept="0.7" />
                        </feComponentTransfer>
                        <feComposite operator="in" in2="SourceGraphic" />
                    </filter>
                </defs>

                {/* 駒の形状 (五角形) */}
                <path 
                    d="M 50 2 L 95 25 L 85 108 L 15 108 L 5 25 Z" 
                    fill="url(#woodGradient)" 
                    stroke={borderColor} 
                    strokeWidth="1.5"
                />
                
                {/* 内部の飾り枠 (彫り込み風) */}
                <path 
                    d="M 50 8 L 88 28 L 80 103 L 20 103 L 12 28 Z" 
                    fill="none" 
                    stroke={borderColor} 
                    strokeWidth="0.5" 
                    opacity="0.4"
                />

                {/* 木目テクスチャのオーバーレイ */}
                <path 
                    d="M 50 2 L 95 25 L 85 108 L 15 108 L 5 25 Z" 
                    fill="black"
                    fillOpacity="0.05"
                    filter="url(#woodGrain)"
                    style={{ mixBlendMode: 'multiply' }}
                />

                {/* 文字 (縦書き・明朝体) */}
                <text 
                    x="50" 
                    y="55" 
                    fontFamily="'Noto Serif JP', serif" 
                    fontWeight="900"
                    fontSize={char.length > 1 ? "32" : "48"}
                    fill={textColor}
                    textAnchor="middle" 
                    dominantBaseline="central"
                    style={{ 
                        writingMode: 'vertical-rl', 
                        textOrientation: 'upright',
                        pointerEvents: 'none'
                    }}
                >
                    {char}
                </text>
            </svg>
        </div>
    );
};
