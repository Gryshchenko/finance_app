import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Logger } from '@/utils/logger/Logger';
import { AuthenticationType } from 'expo-local-authentication';

export type SecureKey = string

export interface ISecureBiometricStorage {
    save(key: SecureKey, value: string): Promise<void>
    get(key: SecureKey, requireBiometric?: boolean): Promise<string | null>
    remove(key: SecureKey): Promise<void>
    isBiometricAvailable(): Promise<boolean>
    supportedAuthenticationTypes(): Promise<AuthenticationType[]>
}

export class SecureBiometricStorage implements ISecureBiometricStorage {
    protected _logger: Logger = Logger.Of("SecureBiometricStorage")
    async save(key: SecureKey, value: string) {
        try {
            await SecureStore.setItemAsync(key, value)
        } catch (e) {
            this._logger.error(`Failed to save key ${key}:`, e)
            throw e
        }
    }

    async get(key: SecureKey, requireBiometric = false): Promise<string | null> {
        if (requireBiometric) {
            const success = await this.authenticateBiometric()
            if (!success) {
                this._logger.warn('Biometric authentication failed')
                return null
            }
        }

        try {
            return await SecureStore.getItemAsync(key)
        } catch (e) {
            this._logger.error(`Failed to get key ${key}:`, e)
            return null
        }
    }

    async remove(key: SecureKey) {
        try {
            await SecureStore.deleteItemAsync(key)
        } catch (e) {
            this._logger.error(`Failed to delete key ${key}:`, e)
        }
    }

    async isBiometricAvailable(): Promise<boolean> {
        try {
            return await LocalAuthentication.hasHardwareAsync()
        } catch (e) {
            this._logger.error('Biometric hardware check failed:', e)
            return false
        }
    }

    async supportedAuthenticationTypes(): Promise<AuthenticationType[]> {
        try {
            return await LocalAuthentication.supportedAuthenticationTypesAsync()
        } catch (e) {
            this._logger.error('Biometric supportedAuthenticationTypesAsync check failed:', e)
            return []
        }
    }

    private async authenticateBiometric(): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access secure data',
                cancelLabel: 'Cancel',
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
            })
            return result.success
        } catch (e) {
            this._logger.error('Biometric authentication failed:', e)
            return false
        }
    }
}
