import { useId } from 'react';
import { AvatarVariant, DEFAULT_AVATAR_COLORS, DEFAULT_AVATAR_VARIANT, IAvatarConfig } from '@tenpercent/shared';
import Svg, { Circle, Defs, G, Line, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';

/**
 * React Native port of the `boring-avatars` library (https://boringavatars.com/).
 * The upstream package renders DOM `<svg>` elements which do not work in React
 * Native, so the deterministic generation algorithms are reproduced here on top
 * of `react-native-svg` primitives. Behaviour matches boring-avatars v2.
 */

interface AvatarProps {
    /** Seed used to deterministically generate the avatar (e.g. public name or email). */
    name: string;
    variant?: AvatarVariant;
    colors?: string[];
    size?: number;
    square?: boolean;
}

// --- generation utilities (ported 1:1 from boring-avatars) ---

const hashCode = (name: string): number => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const character = name.charCodeAt(i);
        hash = (hash << 5) - hash + character;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getDigit = (num: number, ntn: number): number => Math.floor((num / Math.pow(10, ntn)) % 10);

const getBoolean = (num: number, ntn: number): boolean => !(getDigit(num, ntn) % 2);

const getUnit = (num: number, range: number, index?: number): number => {
    const value = num % range;
    if (index && getDigit(num, index) % 2 === 0) return -value;
    return value;
};

const getRandomColor = (num: number, colors: string[], range: number): string => colors[num % range];

const getContrast = (hexColor: string): string => {
    let hex = hexColor;
    if (hex.slice(0, 1) === '#') hex = hex.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#FFFFFF';
};

// --- Beam ---

const BEAM_SIZE = 36;

const generateBeam = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    const wrapperColor = getRandomColor(num, colors, range);
    const preTranslateX = getUnit(num, 10, 1);
    const wrapperTranslateX = preTranslateX < 5 ? preTranslateX + BEAM_SIZE / 9 : preTranslateX;
    const preTranslateY = getUnit(num, 10, 2);
    const wrapperTranslateY = preTranslateY < 5 ? preTranslateY + BEAM_SIZE / 9 : preTranslateY;
    return {
        wrapperColor,
        faceColor: getContrast(wrapperColor),
        backgroundColor: getRandomColor(num + 13, colors, range),
        wrapperTranslateX,
        wrapperTranslateY,
        wrapperRotate: getUnit(num, 360),
        wrapperScale: 1 + getUnit(num, BEAM_SIZE / 12) / 10,
        isMouthOpen: getBoolean(num, 2),
        isCircle: getBoolean(num, 1),
        eyeSpread: getUnit(num, 5),
        mouthSpread: getUnit(num, 3),
        faceRotate: getUnit(num, 10, 3),
        faceTranslateX: wrapperTranslateX > BEAM_SIZE / 6 ? wrapperTranslateX / 2 : getUnit(num, 8, 1),
        faceTranslateY: wrapperTranslateY > BEAM_SIZE / 6 ? wrapperTranslateY / 2 : getUnit(num, 7, 2),
    };
};

const AvatarBeam = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generateBeam(name, colors);
    return (
        <Svg viewBox={`0 0 ${BEAM_SIZE} ${BEAM_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={BEAM_SIZE} height={BEAM_SIZE}>
                <Rect width={BEAM_SIZE} height={BEAM_SIZE} rx={square ? undefined : BEAM_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                <Rect width={BEAM_SIZE} height={BEAM_SIZE} fill={data.backgroundColor} />
                <Rect
                    x={0}
                    y={0}
                    width={BEAM_SIZE}
                    height={BEAM_SIZE}
                    transform={`translate(${data.wrapperTranslateX} ${data.wrapperTranslateY}) rotate(${data.wrapperRotate} ${BEAM_SIZE / 2} ${BEAM_SIZE / 2}) scale(${data.wrapperScale})`}
                    fill={data.wrapperColor}
                    rx={data.isCircle ? BEAM_SIZE : BEAM_SIZE / 6}
                />
                <G
                    transform={`translate(${data.faceTranslateX} ${data.faceTranslateY}) rotate(${data.faceRotate} ${BEAM_SIZE / 2} ${BEAM_SIZE / 2})`}
                >
                    {data.isMouthOpen ? (
                        <Path
                            d={`M15 ${19 + data.mouthSpread}c2 1 4 1 6 0`}
                            stroke={data.faceColor}
                            fill="none"
                            strokeLinecap="round"
                        />
                    ) : (
                        <Path d={`M13,${19 + data.mouthSpread} a1,0.75 0 0,0 10,0`} fill={data.faceColor} />
                    )}
                    <Rect x={14 - data.eyeSpread} y={14} width={1.5} height={2} rx={1} fill={data.faceColor} />
                    <Rect x={20 + data.eyeSpread} y={14} width={1.5} height={2} rx={1} fill={data.faceColor} />
                </G>
            </G>
        </Svg>
    );
};

// --- Marble ---

const MARBLE_SIZE = 80;

const generateMarble = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    return Array.from({ length: 3 }, (_, i) => ({
        color: getRandomColor(num + i, colors, range),
        translateX: getUnit(num * (i + 1), MARBLE_SIZE / 10, 1),
        translateY: getUnit(num * (i + 1), MARBLE_SIZE / 10, 2),
        scale: 1.2 + getUnit(num * (i + 1), MARBLE_SIZE / 20) / 10,
        rotate: getUnit(num * (i + 1), 360, 1),
    }));
};

const AvatarMarble = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generateMarble(name, colors);
    const c = MARBLE_SIZE / 2;
    return (
        <Svg viewBox={`0 0 ${MARBLE_SIZE} ${MARBLE_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={MARBLE_SIZE} height={MARBLE_SIZE}>
                <Rect width={MARBLE_SIZE} height={MARBLE_SIZE} rx={square ? undefined : MARBLE_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                <Rect width={MARBLE_SIZE} height={MARBLE_SIZE} fill={data[0].color} />
                <Path
                    d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
                    fill={data[1].color}
                    transform={`translate(${data[1].translateX} ${data[1].translateY}) rotate(${data[1].rotate} ${c} ${c}) scale(${data[2].scale})`}
                />
                <Path
                    d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
                    fill={data[2].color}
                    transform={`translate(${data[2].translateX} ${data[2].translateY}) rotate(${data[2].rotate} ${c} ${c}) scale(${data[2].scale})`}
                />
            </G>
        </Svg>
    );
};

// --- Pixel ---

const PIXEL_SIZE = 80;

const generatePixel = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    return Array.from({ length: 64 }, (_, i) => getRandomColor(num % (i + 1), colors, range));
};

// Column-major grid coordinates matching boring-avatars' pixel layout.
const PIXEL_COORDS: [number, number][] = (() => {
    const coords: [number, number][] = [];
    for (let x = 0; x <= 70; x += 20) coords.push([x, 0]);
    for (let x = 10; x <= 70; x += 20) coords.push([x, 0]);
    // The remaining 56 cells fill each column top-to-bottom in a fixed order.
    const columns = [0, 20, 40, 60, 10, 30, 50, 70];
    for (const x of columns) {
        for (let y = 10; y <= 70; y += 10) coords.push([x, y]);
    }
    return coords;
})();

const AvatarPixel = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generatePixel(name, colors);
    return (
        <Svg viewBox={`0 0 ${PIXEL_SIZE} ${PIXEL_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={PIXEL_SIZE} height={PIXEL_SIZE}>
                <Rect width={PIXEL_SIZE} height={PIXEL_SIZE} rx={square ? undefined : PIXEL_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                {PIXEL_COORDS.map(([x, y], i) => (
                    <Rect key={i} x={x} y={y} width={10} height={10} fill={data[i]} />
                ))}
            </G>
        </Svg>
    );
};

// --- Sunset ---

const SUNSET_SIZE = 80;

const generateSunset = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    return Array.from({ length: 4 }, (_, i) => getRandomColor(num + i, colors, range));
};

const AvatarSunset = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generateSunset(name, colors);
    const c = SUNSET_SIZE / 2;
    const g0 = `${maskId}_g0`;
    const g1 = `${maskId}_g1`;
    return (
        <Svg viewBox={`0 0 ${SUNSET_SIZE} ${SUNSET_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={SUNSET_SIZE} height={SUNSET_SIZE}>
                <Rect width={SUNSET_SIZE} height={SUNSET_SIZE} rx={square ? undefined : SUNSET_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                <Path fill={`url(#${g0})`} d="M0 0h80v40H0z" />
                <Path fill={`url(#${g1})`} d="M0 40h80v40H0z" />
            </G>
            <Defs>
                <LinearGradient id={g0} x1={c} y1={0} x2={c} y2={c} gradientUnits="userSpaceOnUse">
                    <Stop stopColor={data[0]} />
                    <Stop offset={1} stopColor={data[1]} />
                </LinearGradient>
                <LinearGradient id={g1} x1={c} y1={c} x2={c} y2={SUNSET_SIZE} gradientUnits="userSpaceOnUse">
                    <Stop stopColor={data[2]} />
                    <Stop offset={1} stopColor={data[3]} />
                </LinearGradient>
            </Defs>
        </Svg>
    );
};

// --- Ring ---

const RING_SIZE = 90;

const generateRing = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    const c = Array.from({ length: 5 }, (_, i) => getRandomColor(num + i, colors, range));
    return [c[0], c[1], c[1], c[2], c[2], c[3], c[3], c[0], c[4]];
};

const AvatarRing = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generateRing(name, colors);
    return (
        <Svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={RING_SIZE} height={RING_SIZE}>
                <Rect width={RING_SIZE} height={RING_SIZE} rx={square ? undefined : RING_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                <Path d="M0 0h90v45H0z" fill={data[0]} />
                <Path d="M0 45h90v45H0z" fill={data[1]} />
                <Path d="M83 45a38 38 0 00-76 0h76z" fill={data[2]} />
                <Path d="M83 45a38 38 0 01-76 0h76z" fill={data[3]} />
                <Path d="M77 45a32 32 0 10-64 0h64z" fill={data[4]} />
                <Path d="M77 45a32 32 0 11-64 0h64z" fill={data[5]} />
                <Path d="M71 45a26 26 0 00-52 0h52z" fill={data[6]} />
                <Path d="M71 45a26 26 0 01-52 0h52z" fill={data[7]} />
                <Circle cx={45} cy={45} r={23} fill={data[8]} />
            </G>
        </Svg>
    );
};

// --- Bauhaus ---

const BAUHAUS_SIZE = 80;

const generateBauhaus = (name: string, colors: string[]) => {
    const num = hashCode(name);
    const range = colors.length;
    return Array.from({ length: 4 }, (_, i) => ({
        color: getRandomColor(num + i, colors, range),
        translateX: getUnit(num * (i + 1), BAUHAUS_SIZE / 2 - (i + 17), 1),
        translateY: getUnit(num * (i + 1), BAUHAUS_SIZE / 2 - (i + 17), 2),
        rotate: getUnit(num * (i + 1), 360),
        isSquare: getBoolean(num, 2),
    }));
};

const AvatarBauhaus = ({ name, colors, size, square, maskId }: RenderProps) => {
    const data = generateBauhaus(name, colors);
    const c = BAUHAUS_SIZE / 2;
    return (
        <Svg viewBox={`0 0 ${BAUHAUS_SIZE} ${BAUHAUS_SIZE}`} width={size} height={size}>
            <Mask id={maskId} x={0} y={0} width={BAUHAUS_SIZE} height={BAUHAUS_SIZE}>
                <Rect width={BAUHAUS_SIZE} height={BAUHAUS_SIZE} rx={square ? undefined : BAUHAUS_SIZE * 2} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
                <Rect width={BAUHAUS_SIZE} height={BAUHAUS_SIZE} fill={data[0].color} />
                <Rect
                    x={(BAUHAUS_SIZE - 60) / 2}
                    y={(BAUHAUS_SIZE - 20) / 2}
                    width={BAUHAUS_SIZE}
                    height={data[1].isSquare ? BAUHAUS_SIZE : BAUHAUS_SIZE / 8}
                    fill={data[1].color}
                    transform={`translate(${data[1].translateX} ${data[1].translateY}) rotate(${data[1].rotate} ${c} ${c})`}
                />
                <Circle
                    cx={c}
                    cy={c}
                    fill={data[2].color}
                    r={BAUHAUS_SIZE / 5}
                    transform={`translate(${data[2].translateX} ${data[2].translateY})`}
                />
                <Line
                    x1={0}
                    y1={c}
                    x2={BAUHAUS_SIZE}
                    y2={c}
                    strokeWidth={2}
                    stroke={data[3].color}
                    transform={`translate(${data[3].translateX} ${data[3].translateY}) rotate(${data[3].rotate} ${c} ${c})`}
                />
            </G>
        </Svg>
    );
};

interface RenderProps {
    name: string;
    colors: string[];
    size: number;
    square: boolean;
    maskId: string;
}

const VARIANTS: Record<AvatarVariant, (props: RenderProps) => React.ReactElement> = {
    beam: AvatarBeam,
    marble: AvatarMarble,
    pixel: AvatarPixel,
    sunset: AvatarSunset,
    ring: AvatarRing,
    bauhaus: AvatarBauhaus,
};

export function Avatar({
    name,
    variant = DEFAULT_AVATAR_VARIANT,
    colors = DEFAULT_AVATAR_COLORS,
    size = 40,
    square = false,
}: AvatarProps) {
    // react-native-svg resolves url(#id) references internally; strip characters
    // that are invalid inside an id (useId returns values such as ":r0:").
    const maskId = `avatar_${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const Component = VARIANTS[variant] ?? AvatarMarble;
    return <Component name={name} colors={colors} size={size} square={square} maskId={maskId} />;
}

/** Convenience wrapper that renders an avatar from a stored profile config. */
export function ProfileAvatar({
    avatar,
    name,
    size = 40,
    square = false,
}: {
    avatar: IAvatarConfig | undefined;
    name: string;
    size?: number;
    square?: boolean;
}) {
    return (
        <Avatar
            name={name}
            variant={avatar?.variant ?? DEFAULT_AVATAR_VARIANT}
            colors={avatar?.colors ?? DEFAULT_AVATAR_COLORS}
            size={size}
            square={square}
        />
    );
}
