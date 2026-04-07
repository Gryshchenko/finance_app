/**
 * Generic 2-column stats grid.
 *
 * Usage:
 *   1. Describe each tile with StatTileConfig (plain data, no JSX required).
 *   2. Pass an array of tiles to <StatsBar />.
 *   3. Tiles are laid out left-to-right, top-to-bottom in a 2-column grid.
 *      Borders between cells are applied automatically.
 *
 * Example:
 *   <StatsBar tiles={[
 *     { label: 'Revenue',  value: '$1 200' },
 *     { label: 'Expenses', value: '$800', valueColor: colors.red },
 *     { label: 'Balance',  value: '$400', progress: { filledPercent: 33, color: colors.green } },
 *     { label: 'Goal',     value: '33%',  rightElement: <MaterialIcons name="flag" /> },
 *   ]} />
 */

import { FC, ReactNode } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface StatTileProgress {
    /** 0–100. Clamped visually at 100 even if value exceeds budget. */
    filledPercent: number;
    /** Hex / rgba color for the filled portion. */
    color: string;
}

export interface StatTileConfig {
    /** Already-translated label rendered above the value. */
    label: string;
    /** Formatted value string (currency, %, etc.). */
    value: string;
    /** Optional override for the value text color. */
    valueColor?: string;
    /**
     * Optional element placed to the right of the value text.
     * Ideal for small icons (e.g. MaterialIcons trending_up).
     */
    rightElement?: ReactNode;
    /**
     * When present, renders a thin horizontal progress bar to the right
     * of the value (replaces rightElement if both are set, progress wins).
     */
    progress?: StatTileProgress;
}

// ---------------------------------------------------------------------------
// StatTile — single cell
// ---------------------------------------------------------------------------

interface StatTileInternalProps extends StatTileConfig {
    rightBorder: boolean;
    topBorder: boolean;
}

const StatTile: FC<StatTileInternalProps> = ({ label, value, valueColor, rightElement, progress, rightBorder, topBorder }) => {
    const { themed } = useAppTheme();

    const cardStyle = themed([$tile, rightBorder ? $tileBorderRight : null, topBorder ? $tileBorderTop : null]);

    const rightContent = progress ? (
        <View style={themed($progressTrack)}>
            <View
                style={[
                    $progressFill,
                    {
                        width: `${Math.min(progress.filledPercent, 100)}%`,
                        backgroundColor: progress.color,
                    },
                ]}
            />
        </View>
    ) : (
        (rightElement ?? null)
    );

    return (
        <View style={cardStyle}>
            <Text style={themed($tileLabel)} text={label} />

            <View style={$tileValueRow}>
                <Text
                    style={[themed($tileValue), valueColor ? { color: valueColor } : undefined]}
                    text={value}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
                {rightContent}
            </View>
        </View>
    );
};

// ---------------------------------------------------------------------------
// StatsBar — grid container
// ---------------------------------------------------------------------------

export interface StatsBarProps {
    /** Flat list of tile configs. Rendered left-to-right, top-to-bottom in 2 columns. */
    tiles: StatTileConfig[];
}

export const StatsBar: FC<StatsBarProps> = ({ tiles }) => {
    const { themed } = useAppTheme();

    // Group tiles into rows of 2
    const rows: StatTileConfig[][] = [];
    for (let i = 0; i < tiles.length; i += 2) {
        rows.push(tiles.slice(i, i + 2));
    }

    return (
        <View style={themed($grid)}>
            {rows.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                    <StatTile
                        key={`${rowIndex}-${colIndex}`}
                        {...tile}
                        rightBorder={colIndex === 0 && row.length === 2}
                        topBorder={rowIndex > 0}
                    />
                )),
            )}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const $grid: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderWidth: 1,
    borderColor: colors.palette.grey300,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
});

const $tile: ThemedStyle<ViewStyle> = () => ({
    width: '50%',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 4,
});

const $tileBorderRight: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderRightWidth: 1,
    borderRightColor: colors.palette.grey300,
});

const $tileBorderTop: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderTopWidth: 1,
    borderTopColor: colors.palette.grey300,
});

const $tileLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: typography.fonts.funnelSans.medium,
});

const $tileValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: typography.fonts.funnelSans.semiBold,
    lineHeight: 26,
    flexShrink: 1,
});

const $tileValueRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
};

const $progressTrack: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 48,
    height: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
    flexShrink: 0,
});

const $progressFill: ViewStyle = {
    height: '100%',
};
