import { createContext, FC, PropsWithChildren, useCallback, useContext, useState } from 'react';
import { IUserClient, ResponseStatusType, UserStatus } from '@tenpercent/shared';

import { buildGeneralApiBaseHandler, GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { LoginService } from '@/services/LoginService';
import { queryClient } from '@/services/queryClient';
import { SignupService } from '@/services/SignUpService';
import { Logger } from '@/utils/logger/Logger';

export interface AuthContextType {
    isAuthenticated: boolean;
    isUserConfirmed: boolean;
    doSetUserConfirmed: () => void;
    doLogout: () => Promise<boolean>;
    doLogin: ({ email, password }: { email: string; password: string }) => Promise<GeneralApiProblem>;
    doSignUp: ({
        password,
        email,
        publicName,
        locale,
        currencyCode,
    }: {
        password: string;
        email: string;
        publicName: string;
        locale: string;
        currencyCode: string;
    }) => Promise<GeneralApiProblem>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {}

const _logger = Logger.Of('AuthContext');

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isUserConfirmed, setIsUserConfirmed] = useState<boolean>(false);

    async function doAuthorize({
        token,
        email,
        status,
        userId,
        tokenLong,
    }: {
        token: string;
        email: string;
        status: UserStatus;
        userId: number;
        tokenLong: string;
    }): Promise<boolean> {
        try {
            const result = await AuthService.instance().authorize({
                token,
                tokenLong,
                status,
                userId,
                email,
            });
            if (result) {
                setIsAuthenticated(true);
                setIsUserConfirmed(status === UserStatus.ACTIVE);
                return true;
            } else {
                setIsAuthenticated(false);
                setIsUserConfirmed(false);
                return false;
            }
        } catch (e) {
            setIsUserConfirmed(false);
            setIsAuthenticated(false);
            _logger.error('Do authentication failed due reason: ', (e as { message: string }).message);
            return false;
        }
    }

    const doSignUp = useCallback(
        async ({
            password,
            email,
            publicName,
            locale,
            currencyCode,
        }: {
            password: string;
            email: string;
            publicName: string;
            locale: string;
            currencyCode: string;
        }): Promise<GeneralApiProblem> => {
            const response = await SignupService.instance().doSignUp({
                password,
                email,
                publicName,
                locale,
                currencyCode,
            });
            switch (response.kind) {
                case GeneralApiProblemKind.Ok: {
                    const { email, userId, status, token, tokenLong } = response.data as IUserClient;
                    const result = await doAuthorize({
                        email,
                        status,
                        userId,
                        token,
                        tokenLong: tokenLong as string,
                    });
                    if (!result) {
                        return {
                            kind: GeneralApiProblemKind.Unknown,
                            temporary: true,
                        };
                    }
                    return { ...response, data: null, status: ResponseStatusType.OK, errors: undefined };
                }
                default: {
                    buildGeneralApiBaseHandler(response);
                    return response;
                }
            }
        },
        [],
    );

    const doLogin = useCallback(async ({ password, email }: { password: string; email: string }): Promise<GeneralApiProblem> => {
        const response = await AuthService.instance().login({
            password,
            email,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                const { userId, token, tokenLong, status, email: userEmail } = response.data as IUserClient;
                const result = await doAuthorize({
                    userId,
                    token,
                    tokenLong: tokenLong as string,
                    email: userEmail,
                    status,
                });
                if (!result) {
                    return { kind: GeneralApiProblemKind.Unknown, temporary: true };
                }
                return { ...response, data: null, status: ResponseStatusType.OK, errors: undefined };
            }
            case GeneralApiProblemKind.BadData: {
                return response;
            }
            default: {
                buildGeneralApiBaseHandler(response);
                return response;
            }
        }
    }, []);

    const doSetUserConfirmed = useCallback(() => {
        setIsUserConfirmed(true);
    }, []);

    const doLogout = useCallback(async (): Promise<boolean> => {
        try {
            const response = await LoginService.instance().doLogout();

            switch (response.kind) {
                case GeneralApiProblemKind.Ok: {
                    await AuthService.instance().unauthorized();
                    queryClient.clear();
                    setIsAuthenticated(false);
                    setIsUserConfirmed(false);
                    return true;
                }
                default: {
                    _logger.error('Do logout failed due reason: ', response.kind);
                    await AuthService.instance().unauthorized();
                    queryClient.clear();
                    setIsAuthenticated(false);
                    setIsUserConfirmed(false);
                    buildGeneralApiBaseHandler(response);
                    return false;
                }
            }
        } catch (e) {
            _logger.error('Do logout failed due reason: ', (e as { message: string }).message);
            return false;
        }
    }, []);

    const value: AuthContextType = {
        isAuthenticated,
        isUserConfirmed,
        doLogin,
        doSignUp,
        doLogout,
        doSetUserConfirmed,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
