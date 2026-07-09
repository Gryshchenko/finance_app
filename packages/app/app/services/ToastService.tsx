import ToastManager, { Toast } from 'toastify-react-native';

import { DefaultToast } from '@/components/DefaultToast';
import { TxKeyPath } from '@/i18n/index';
import { translate } from '@/i18n/translate';
import { Logger } from '@/utils/logger/Logger';

export enum ToastType {
    Success = 'success',
    Error = 'error',
    Info = 'info',
    Warning = 'warning',
    Custom = 'custom',
}

export interface ToestMessage {
    title?: TxKeyPath;
    message: TxKeyPath;
    duration?: number;
    systemMessage?: string;
}

interface ToastOptions {
    text1: TxKeyPath;
    text2: TxKeyPath;
    type: ToastType;
    duration?: number;
}

class ToastService {
    protected static _logger: Logger = Logger.Of('ToastService');
    static show({ text1, text2, type = ToastType.Info, duration = 3000 }: ToastOptions) {
        Toast.show({
            // @ts-ignore
            type: 'custom',
            text1: translate(text1),
            text2: translate(text2),
            visibilityTime: duration,
            position: 'top',
            props: {
                type,
            },
        });
    }

    static success({ title = 'common:success', message, duration }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Success,
            duration,
        });
    }

    static error({ title = 'common:error', message, duration, systemMessage }: ToestMessage) {
        ToastService._logger.error(`Error: ${systemMessage}`);
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Error,
            duration,
        });
    }

    static info({ title = 'common:info', message, duration }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Info,
            duration,
        });
    }

    static warning({ title = 'common:warning', message, duration }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Warning,
            duration,
        });
    }

    static setup() {
        const toastConfig = {
            custom: ({
                hide,
                text1,
                text2,
                props,
            }: {
                text1: string;
                text2: string;
                hide: () => void;
                props: { type: ToastType };
            }) => {
                return <DefaultToast type={props.type} title={text1} message={text2} onClose={hide} />;
            },
        };
        return (
            <ToastManager
                config={toastConfig}
                theme={'light'}
                position={'bottom'}
                isRTL={false}
                showProgressBar={true}
                showCloseIcon={true}
                animationStyle="fade"
                useModal={false}
            />
        );
    }
}

export default ToastService;
