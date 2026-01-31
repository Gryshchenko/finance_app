import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateFormat, Time } from 'tenpercent/shared/dist/utils/time/Time';
import { Text } from '@/components/Text';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
export var DatePickerType;
(function (DatePickerType) {
    DatePickerType['Date'] = 'date';
    DatePickerType['Time'] = 'time';
    DatePickerType['Datetime'] = 'datetime';
})(DatePickerType || (DatePickerType = {}));
export const IgniteDatePicker = ({
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
    const [show, setShow] = useState(false);
    const handleChange = (_event, selectedDate) => {
        setShow(Platform.OS === 'ios');
        if (selectedDate) onChange(selectedDate);
    };
    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];
    const formattedDate = value ? value : placeholder;
    const iosModeMap = {
        [DatePickerType.Date]: 'date',
        [DatePickerType.Time]: 'time',
        [DatePickerType.Datetime]: 'datetime',
    };
    return (
        <View style={style}>
            <Text preset="formLabel" tx={'common:date'} />
            <Pressable disabled={disabled} style={themed($input)} onPress={() => setShow(true)}>
                <Text style={themed($text)}>{Time.formatDate(formattedDate, DateFormat.DATE_WITH_TIME_SECONDS)}</Text>
            </Pressable>
            {!!(helper || helperTx) && (
                <Text
                    preset="formHelper"
                    text={helper}
                    tx={helperTx}
                    txOptions={helperTxOptions}
                    {...HelperTextProps}
                    style={themed($helperStyles)}
                />
            )}

            {show && (
                <DateTimePicker
                    disabled={disabled}
                    value={Time.toJSDate(value || Time.getISODateNow())}
                    mode={iosModeMap[mode]}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
    );
};
const $input = ({ colors, spacing }) => ({
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.xxs,
    backgroundColor: colors.background,
});
const $text = ({ colors }) => ({
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    marginHorizontal: 12,
});
const $helperStyle = ({ spacing }) => ({
    marginTop: spacing.xs,
});
