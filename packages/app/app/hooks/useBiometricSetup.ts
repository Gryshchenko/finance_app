import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthenticationType } from 'expo-local-authentication';

import { SecureBiometricStorage } from '@/services/SecureBiometricStorage';
import { SecureStorageKey } from '@/types/SecureStorageKey';
import { Logger } from '@/utils/logger/Logger';

export type BiometricType = 'face' | 'fingerprint' | null;

export interface UseBiometricSetupResult {
    isAvailable: boolean;
    biometricType: BiometricType;
    enroll: () => Promise<boolean>;
}

const _logger = Logger.Of('useBiometricSetup');

/**
 * Hook for checking biometric hardware availability and enrolling a user.
 *
 * - iOS: detects Face ID vs Touch ID, requests NSFaceIDUsageDescription permission
 *   on first `enroll()` call (prompted automatically by the OS).
 * - Android: detects fingerprint / face, uses the BiometricPrompt API via
 *   expo-local-authentication.
 *
 * `enroll()` triggers the native biometric dialog. On success it saves
 * `SecureStorageKey.BiometricEnabled = 'true'` so the login screen can
 * show the QuickAccessButton.
 */
export function useBiometricSetup(): UseBiometricSetupResult {
    const [isAvailable, setIsAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<BiometricType>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                if (!hasHardware || !isEnrolled) return;

                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

                // iOS prioritises Face ID; Android typically exposes FINGERPRINT.
                // Fallback: if the device reports only FACIAL_RECOGNITION on Android
                // (e.g. face-unlock), use 'face' as well.
                if (Platform.OS === 'ios') {
                    if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
                        setBiometricType('face');
                    } else if (types.includes(AuthenticationType.FINGERPRINT)) {
                        setBiometricType('fingerprint');
                    }
                } else {
                    if (types.includes(AuthenticationType.FINGERPRINT)) {
                        setBiometricType('fingerprint');
                    } else if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
                        setBiometricType('face');
                    }
                }

                setIsAvailable(true);
            } catch (e) {
                _logger.error('Biometric availability check failed:', e);
            }
        };
        void check();
    }, []);

    const enroll = useCallback(async (): Promise<boolean> => {
        try {
            const storage = new SecureBiometricStorage();
            const promptMessage =
                Platform.OS === 'ios'
                    ? 'Enable Face ID / Touch ID for quick sign-in'
                    : 'Register your biometric for quick sign-in';
            const cancelLabel = Platform.OS === 'ios' ? 'Not Now' : 'Skip';

            const success = await storage.authenticate({
                promptMessage,
                cancelLabel,
                // Allow passcode fallback so users who recently restarted their
                // device (iOS requires code after restart) are not blocked.
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
            });

            if (success) {
                await storage.save(SecureStorageKey.BiometricEnabled, 'true');
            }
            return success;
        } catch (e) {
            _logger.error('Biometric enrollment failed:', e);
            return false;
        }
    }, []);

    return { isAvailable, biometricType, enroll };
}
