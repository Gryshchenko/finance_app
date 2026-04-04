import { useState } from 'react';
import { Platform, Pressable, TextStyle, View, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateFormat, Time } from 'tenpercent/shared';

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
    const { themed } = useAppTheme();

    // Seed the picker with local-time Date so the spinner shows the right clock value
    const nowUTC = Time.getISODateNowUTC();
    const [tempDate, setTempDate] = useState<Date>(value ? Time.utcToLocalDate(value) : Time.utcToLocalDate(nowUTC));

    // currentDate: local-time Date used by the native picker
    const currentDate = value ? Time.utcToLocalDate(value) : Time.utcToLocalDate(nowUTC);
    // formattedDate: shown on the trigger button — always in device local timezone
    const formattedDate = value ? Time.formatLocalDate(value, DateFormat.DATE_WITH_TIME_SECONDS) : placeholder;

    const presetStyles = $fieldPresets[preset];
    const $inputText = [...presetStyles.input];

    // Android: native dialog, auto-closes on select
    const handleAndroidChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (_event.type === 'set' && selectedDate) {
            // Convert local Date back to UTC ISO before notifying the caller
            onChange(Time.localDateToUTC(selectedDate));
        }
    };

    // iOS: spinner in modal, user picks then taps Done
    const handleIOSChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) setTempDate(selectedDate);
    };

    if (Platform.OS === 'android') {
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
                renderTrigger={() => <Text style={themed($inputText)}>{formattedDate}</Text>}
                renderContent={(close) => (
                    <DateTimePicker
                        disabled={disabled}
                        value={currentDate}
                        mode={iosModeMap[mode]}
                        display="default"
                        onChange={(event, date) => {
                            close();
                            handleAndroidChange(event, date);
                        }}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                    />
                )}
            />
        );
    }

    // iOS — spinner inside FieldModal with Done/Cancel header
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
            renderContent={(close) => {
                const handleConfirm = () => {
                    close();
                    // Convert local Date chosen in the spinner back to UTC ISO
                    onChange(Time.localDateToUTC(tempDate));
                };

                return (
                    <View>
                        <View style={themed($modalHeader)}>
                            <Pressable onPress={close}>
                                <Text style={themed($modalCancelText)}>{translate('common:cancel')}</Text>
                            </Pressable>
                            <Pressable onPress={handleConfirm}>
                                <Text style={themed($modalDoneText)}>{translate('common:ok')}</Text>
                            </Pressable>
                        </View>
                        <DateTimePicker
                            disabled={disabled}
                            value={tempDate}
                            mode={iosModeMap[mode]}
                            display="spinner"
                            onChange={handleIOSChange}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                        />
                    </View>
                );
            }}
        />
    );
};

/* ── DatePicker-specific styles ── */

const $modalHeader: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
});

const $modalCancelText: ThemedStyle<TextStyle> = () => ({
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
});

const $modalDoneText: ThemedStyle<TextStyle> = () => ({
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
});
