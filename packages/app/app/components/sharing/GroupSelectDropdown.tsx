import { StyleProp, TextStyle } from 'react-native';
import { IShareGroup } from '@tenpercent/shared';

import { Dropdown } from '@/components/Dropdown';
import { TextFieldPresets } from '@/components/TextField';
import { TxKeyPath } from '@/i18n';
import { fetchSharingGroups } from '@/screens/SharingScreens/sharingQueries';

interface GroupSelectDropdownProps {
    value?: number | null;
    onChange?: (group: IShareGroup) => void;
    labelTx?: TxKeyPath;
    modalTitleTx?: TxKeyPath;
    helperTx?: TxKeyPath;
    status?: 'error' | 'disabled';
    editable?: boolean;
    preset?: TextFieldPresets;
    style?: StyleProp<TextStyle>;
}

export const GroupSelectDropdown: React.FC<GroupSelectDropdownProps> = ({
    value,
    onChange,
    labelTx = 'sharing:selectGroupLabel',
    modalTitleTx = 'sharing:selectGroupLabel',
    helperTx,
    status,
    editable,
    preset,
    style,
}) => {
    return (
        <Dropdown<IShareGroup>
            preset={preset}
            style={style}
            labelTx={labelTx}
            modalTitleTx={modalTitleTx}
            helperTx={helperTx}
            status={status}
            editable={editable}
            value={value ?? undefined}
            onChange={onChange}
            queryKey={'sharingGroups'}
            fetcher={fetchSharingGroups}
            keyExtractor={(item) => String(item.userGroupId)}
            labelExtractor={(item) => item.groupName}
        />
    );
};
