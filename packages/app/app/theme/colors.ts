const palette = {
    grey200: '#F2F2F2',
    grey300: '#e5e5e5',
    grey400: '#888888',

    neutral100: '#FFFFFF',
    neutral200: '#F4F2F1',
    neutral300: '#D7CEC9',
    neutral400: '#B6ACA6',
    neutral500: '#978F8A',
    neutral600: '#564E4A',
    neutral700: '#404040',
    neutral800: '#191015',
    neutral900: '#000000',

    primary100: '#F4E0D9',
    primary200: '#E8C1B4',
    primary300: '#DDA28E',
    primary400: '#D28468',
    primary500: '#C76542',
    primary600: '#A54F31',

    secondary100: '#DCDDE9',
    secondary200: '#BCC0D6',
    secondary300: '#9196B9',
    secondary400: '#626894',
    secondary500: '#41476E',

    accent100: '#FFEED4',
    accent200: '#FFE1B2',
    accent300: '#FDD495',
    accent400: '#FBC878',
    accent500: '#FFBB50',

    angry100: '#F2D6CD',
    angry500: '#C03403',
    angry600: '#d63031',

    overlay20: 'rgba(25, 16, 21, 0.2)',
    overlay50: 'rgba(25, 16, 21, 0.5)',
} as const;

export const colors = {
    /**
     * The palette is available to use, but prefer using the name.
     * This is only included for rare, one-off cases. Try to use
     * semantic names as much as possible.
     */
    palette,
    /**
     * A helper for making something see-thru.
     */
    transparent: 'rgba(0, 0, 0, 0)',
    /**
     * The default text color in many components.
     */
    text: palette.neutral700,
    /**
     * Secondary text information.
     */
    textDim: 'rgba(136, 136, 136, 1)',
    /**
     * The default color of the screen background.
     */
    background: palette.grey200,
    /**
     * The default border color.
     */
    border: 'rgba(182, 172, 166, 0.4)',
    /**
     * The main tinting color.
     */
    tint: palette.primary500,
    /**
     * The inactive tinting color.
     */
    tintInactive: palette.neutral300,
    /**
     * A subtle color used for lines.
     */
    separator: palette.neutral300,
    /**
     * Error messages.
     */
    error: palette.angry600,
    /**
     * Error Background.
     */
    errorBackground: palette.angry100,
    toast: {
        info: {
            background: '#E5E7EB',
            border: '#D1D5DB',
            text: '#111827',
            textDim: '#4B5563',
            icon: '#1F2937',
        },
        success: {
            background: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            textDim: '#047857',
            icon: '#059669',
        },
        warning: {
            background: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            textDim: '#B45309',
            icon: '#D97706',
        },
        error: {
            background: '#FEF2F2',
            border: '#FECACA',
            text: '#7F1D1D',
            textDim: '#991B1B',
            icon: '#DC2626',
        },
        close: '#9CA3AF',
    },
} as const;
