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
    const woodColorLight = "#fde0b2";
    const woodColorDark = "#d4a76a";
    const borderColor = "#5d3a1a";
    
    // 文字色
    const textColor = isPromoted ? "#b91c1c" : "#1a1a1a";

    // 縦書き用のフォントサイズと位置調整
    const isDoubleChar = char.length > 1;

    return (
        <div 
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ 
                width: `${scale * 80}px`, 
                height: `${scale * 88}px`,
                filter: shadow ? 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' : 'none'
            }}
        >
            <svg 
                viewBox="0 0 100 110" 
                className="w-full h-full overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="woodGradient" x1="20%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="50%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <filter id="woodGrain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0.2" />
                        <feComponentTransfer>
                             <feFuncR type="linear" slope="0.5" intercept="0.2"/>
                             <feFuncG type="linear" slope="0.5" intercept="0.2"/>
                             <feFuncB type="linear" slope="0.5" intercept="0.2"/>
                        </feComponentTransfer>
                        <feComposite operator="in" in2="SourceGraphic" />
                    </filter>
                    <filter id="bevel" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
                        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.5" specularExponent="20" result="specOut" lightingColor="white">
                            <fePointLight x="-5000" y="-10000" z="20000"/>
                        </feSpecularLighting>
                        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
                    </filter>
                </defs>

                {/* 
                  駒の形状 (末広がり五角形) 
                  Top: 50, 0
                  Shoulder Left: 20, 25
                  Shoulder Right: 80, 25
                  Bottom Left: 8, 105
                  Bottom Right: 92, 105
                */}
                <path 
                    d="M 50 15 L 80 28 L 92 105 L 8 105 L 20 28 Z" 
                    fill="url(#woodGradient)" 
                    stroke={borderColor} 
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
                
                {/* 3D Bevel/Highlight */}
                <path 
                    d="M 50 15 L 80 28 L 92 105 L 8 105 L 20 28 Z" 
                    fill="url(#woodGradient)"
                    filter="url(#bevel)"
                    opacity="0.6"
                    style={{ mixBlendMode: 'overlay' }}
                />

                {/* 木目テクスチャのオーバーレイ */}
                <path 
                    d="M 50 15 L 80 28 L 92 105 L 8 105 L 20 28 Z" 
                    fill="black"
                    fillOpacity="0.08"
                    filter="url(#woodGrain)"
                    style={{ mixBlendMode: 'multiply' }}
                />

                {/* 内側の彫りライン */}
                <path 
                    d="M 50 15 L 75 30 L 85 100 L 15 100 L 25 30 Z" 
                    fill="none" 
                    stroke={borderColor} 
                    strokeWidth="0.5" 
                    opacity="0.3"
                />

                {/* 文字 (縦書き・明朝体) */}
                {isDoubleChar ? (
                   <g transform="translate(50, 58)">
                       <text 
                        y="-16"
                        fontFamily="'Noto Serif JP', serif" 
                        fontWeight="900"
                        fontSize="30"
                        fill={textColor}
                        textAnchor="middle" 
                        dominantBaseline="central"
                       >
                           {char[0]}
                       </text>
                       <text 
                        y="16"
                        fontFamily="'Noto Serif JP', serif" 
                        fontWeight="900"
                        fontSize="30"
                        fill={textColor}
                        textAnchor="middle" 
                        dominantBaseline="central"
                       >
                           {char[1]}
                       </text>
                   </g>
                ) : (
                    <text 
                        x="50" 
                        y="60" 
                        fontFamily="'Noto Serif JP', serif" 
                        fontWeight="900"
                        fontSize="46"
                        fill={textColor}
                        textAnchor="middle" 
                        dominantBaseline="central"
                    >
                        {char}
                    </text>
                )}
            </svg>
        </div>
    );
};