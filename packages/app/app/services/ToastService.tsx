import type { TOptions } from 'i18next';
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
    /** Interpolation values for `message`, e.g. `{ duration: '2 min' }`. */
    txOptions?: TOptions;
}

interface ToastOptions {
    text1: TxKeyPath;
    text2: TxKeyPath;
    type: ToastType;
    duration?: number;
    txOptions?: TOptions;
}

class ToastService {
    protected static _logger: Logger = Logger.Of('ToastService');
    static show({ text1, text2, type = ToastType.Info, duration = 3000, txOptions }: ToastOptions) {
        Toast.show({
            // @ts-ignore
            type: 'custom',
            text1: translate(text1),
            text2: translate(text2, txOptions),
            visibilityTime: duration,
            position: 'top',
            props: {
                type,
            },
        });
    }

    static success({ title = 'common:success', message, duration, txOptions }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Success,
            duration,
            txOptions,
        });
    }

    static error({ title = 'common:error', message, duration, systemMessage, txOptions }: ToestMessage) {
        ToastService._logger.error(`Error: ${systemMessage}`);
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Error,
            duration,
            txOptions,
        });
    }

    static info({ title = 'common:info', message, duration, txOptions }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Info,
            duration,
            txOptions,
        });
    }

    static warning({ title = 'common:warning', message, duration, txOptions }: ToestMessage) {
        this.show({
            text1: title,
            text2: message,
            type: ToastType.Warning,
            duration,
            txOptions,
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
