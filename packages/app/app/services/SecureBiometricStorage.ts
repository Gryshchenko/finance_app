import { AuthenticationType } from 'expo-local-authentication';
import * as LocalAuthentication from 'expo-local-authentication';

import { SecureStorage } from '@/services/SecureStorage';

export interface IBiometricStorage {
    isBiometricAvailable(): Promise<boolean>;
    supportedAuthenticationTypes(): Promise<AuthenticationType[]>;
    authenticate(options?: LocalAuthentication.LocalAuthenticationOptions): Promise<boolean>;
}

export class SecureBiometricStorage extends SecureStorage implements IBiometricStorage {
    async isBiometricAvailable(): Promise<boolean> {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return false;
            return await LocalAuthentication.isEnrolledAsync();
        } catch (e) {
            this._logger.error('Biometric hardware check failed:', e);
            return false;
        }
    }

    async supportedAuthenticationTypes(): Promise<AuthenticationType[]> {
        try {
            return await LocalAuthentication.supportedAuthenticationTypesAsync();
        } catch (e) {
            this._logger.error('Biometric supportedAuthenticationTypesAsync check failed:', e);
            return [];
        }
    }

    async authenticate(options?: LocalAuthentication.LocalAuthenticationOptions): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access secure data',
                cancelLabel: 'Cancel',
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
                ...options,
            });
            return result.success;
        } catch (e) {
            this._logger.error('Biometric authentication failed:', e);
            return false;
        }
    }
}
