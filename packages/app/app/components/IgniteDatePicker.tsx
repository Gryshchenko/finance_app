import { useState } from 'react';
import { Pressable, TextStyle, View, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateFormat, Time, DateTime } from '@tenpercent/shared';

import { FieldModal } from '@/components/FieldModal';
import { Text, TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

import { FieldPresets, $fieldPresets } from './FieldPresets';

type IOSMode = 'date' | 'time' | 'datetime' | 'countdown';

export enum DatePickerType {
    Date = 'date',
    Time = 'time',
    Datetime = 'datetime',
}

type IgniteDatePickerProps = {
    preset?: FieldPresets;
    value: string | null; // UTC ISO string
    onChange: (utcISO: string) => void; // always returns UTC ISO string
    placeholder?: string;
    mode?: DatePickerType;
    minimumDate?: Date;
    maximumDate?: Date;
    style?: ViewStyle;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
    HelperTextProps?: TextProps;
    helper?: string;
    helperTxOptions?: TextProps['txOptions'];
};

const iosModeMap: Record<DatePickerType, IOSMode> = {
    [DatePickerType.Date]: 'date',
    [DatePickerType.Time]: 'time',
    [DatePickerType.Datetime]: 'datetime',
};

export const IgniteDatePicker: React.FC<IgniteDatePickerProps> = ({
    preset = 'default',
    value,
    onChange,
    placeholder = 'Select date',
    mode = DatePickerType.Date,
    minimumDate = new Date(2000, 0, 1),
    maximumDate = new Date(2030, 11, 31),
    disabled,
    style,
    helperTx,
    status,
    HelperTextProps,
    helper,
    helperTxOptions,
}) => {
    const { themed, theme } = useAppTheme();

    const nowUTC = Time.getISODateNowUTC();
    const [tempDate, setTempDate] = useState<Date>(value ? Time.utcToLocalDate(value) : Time.utcToLocalDate(nowUTC));

    const currentDate = value ? Time.utcToLocalDate(value) : Time.utcToLocalDate(nowUTC);
    const formattedDate = value ? Time.formatLocalDate(value, DateFormat.DD_MM_YYYY_DOT) : placeholder;

    const presetStyles = $fieldPresets[preset];
    const $inputText = [...presetStyles.input];

    const handleSpinnerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) setTempDate(selectedDate);
    };

    const renderContent = (close: () => void) => {
        const todayDate = DateTime.now().startOf('day').toJSDate();
        const yesterdayDate = DateTime.now().startOf('day').minus({ days: 1 }).toJSDate();

        const selectQuick = (date: Date) => {
            close();
            onChange(Time.localDateToUTC(date));
        };

        const handleConfirm = () => {
            close();
            onChange(Time.localDateToUTC(tempDate));
        };

        return (
            <View>
                <View style={themed($modalHeader)}>
                    <Pressable onPress={close} hitSlop={8}>
                        <Text style={themed($modalCancelText)}>{translate('common:cancel')}</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirm} hitSlop={8}>
                        <Text style={themed($modalDoneText)}>{translate('common:ok')}</Text>
                    </Pressable>
                </View>

                {mode !== DatePickerType.Time && (
                    <View style={themed($quickRow)}>
                        <Pressable style={themed($quickButton)} onPress={() => selectQuick(todayDate)}>
                            <Text style={themed($quickButtonText)} tx="common:today" />
                        </Pressable>
                        <Pressable style={themed($quickButton)} onPress={() => selectQuick(yesterdayDate)}>
                            <Text style={themed($quickButtonText)} tx="common:yesterday" />
                        </Pressable>
                    </View>
                )}

                <DateTimePicker
                    disabled={disabled}
                    value={tempDate}
                    mode={iosModeMap[mode]}
                    display="spinner"
                    onChange={handleSpinnerChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    textColor={theme.colors.text}
                    accentColor={theme.colors.textDim}
                />
            </View>
        );
    };

    return (
        <FieldModal
            preset={preset}
            labelTx={'common:date'}
            style={style}
            disabled={disabled}
            status={status}
            helper={helper}
            helperTx={helperTx}
            helperTxOptions={helperTxOptions}
            HelperTextProps={HelperTextProps}
            onOpen={() => setTempDate(currentDate)}
            renderTrigger={() => <Text style={themed($inputText)}>{formattedDate}</Text>}
            renderContent={renderContent}
        />
    );
};

/* ── styles ── */

const $modalHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $modalCancelText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
});

const $modalDoneText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
});

const $quickRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
});

const $quickButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.palette.grey300,
    backgroundColor: colors.transparent,
});

const $quickButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.primary.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.text,
});
