import { ViewStyle } from 'react-native';

import { spacing } from './spacing';

/* Use this file to define styles that are used in multiple places in your app. */

/** Standard icon size for all header action buttons (back, add, edit, trash, ...) */
export const headerIconSize = 22;

export const $styles = {
    row: { flexDirection: 'row' } as ViewStyle,

    /** Standard container for header action buttons: full height + horizontal padding for a comfortable touch target */
    headerAction: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    } as ViewStyle,
    flex1: { flex: 1 } as ViewStyle,
    flexWrap: { flexWrap: 'wrap' } as ViewStyle,

    container: {
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        height: '100%',
        width: '100%',
    } as ViewStyle,

    screen: {
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        height: '100%',
        width: '100%',
    } as ViewStyle,
    toggleInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    } as ViewStyle,
};
