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
    value: string | null;
    onChange: (date: Date) => void;
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
    const [tempDate, setTempDate] = useState<Date>(Time.toJSDate(value || Time.getISODateNow()));

    const currentDate = Time.toJSDate(value || Time.getISODateNow());
    const formattedDate = value ? Time.formatDate(value, DateFormat.DATE_WITH_TIME_SECONDS) : placeholder;

    const presetStyles = $fieldPresets[preset];
    const $inputText = [...presetStyles.input];

    // Android: native dialog, auto-closes on select
    const handleAndroidChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (_event.type === 'set' && selectedDate) {
            onChange(selectedDate);
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
                    onChange(tempDate);
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
