import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { IUserClient } from "tenpercent/shared"
import { ResponseStatusType } from "tenpercent/shared"
import { Utils } from "tenpercent/shared"
import { UserStatus } from "tenpercent/shared"

import {
  buildGeneralApiBaseHandler,
  GeneralApiProblem,
  GeneralApiProblemKind,
} from "@/services/api/apiProblem"
import { AuthService } from "@/services/AuthService"
import { LoginService } from "@/services/LoginService"
import { SignupService } from "@/services/SignUpService"
import { StorageKey } from "@/types/StorageKey"
import { ValidationError } from "@/utils/errors/ValidationError"
import { Logger } from "@/utils/logger/Logger"
import {  saveString } from "@/utils/storage"

export interface AuthContextType {
  isAuthenticated: boolean
  isUserConfirmed: boolean
  setIsPasswordSaveCheckbox: (save: boolean) => void
  isPasswordSaveCheckbox: boolean
  doSetUserConfirmed: () => void
  doLogout: () => Promise<boolean>
  doLogin: ({ email, password }: { email: string; password: string }) => Promise<boolean>
  doSignUp: ({
    password,
    email,
    publicName,
    locale,
  }: {
    password: string
    email: string
    publicName: string
    locale: string
  }) => Promise<GeneralApiProblem>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

const _logger = Logger.Of("AuthContext")

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isUserConfirmed, setIsUserConfirmed] = useState<boolean>(false)
  const [isPasswordSaveCheckbox, setIsPasswordSave] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      try {
        const authService = new AuthService()
        const saved = "loadString(StorageKey.isSavePassword)"
        const isPassword: boolean = saved ? (Utils.parseBoolean(saved) as boolean) : false

        if (!isPassword) {
          _logger.info("Auto authentication disabled")
          return
        }
        const user = await authService.getCredentialFromSecureStore()
        if (!user) {
          throw new ValidationError({
            message: "miss configuration for auto login",
          })
        }
        const { token, userId, tokenLong, status, email } = user as IUserClient
        const result = await AuthService.instance().authorize({
          token,
          tokenLong,
          status,
          userId,
          email,
        })
        const response = await LoginService.instance().doTokenVerify({ userId })
        switch (response.kind) {
          case GeneralApiProblemKind.Ok: {
            if (result) {
              setIsAuthenticated(true)
              setIsUserConfirmed(status === UserStatus.ACTIVE)
            } else {
              throw new ValidationError({
                message: "authorize failed",
              })
            }
            break
          }
          case GeneralApiProblemKind.BadData:
          case GeneralApiProblemKind.Unauthorized:
          case GeneralApiProblemKind.Forbidden: {
            throw new ValidationError({
              message: JSON.stringify(response.errors),
            })
          }
          default: {
            buildGeneralApiBaseHandler(response)
          }
        }
      } catch (e) {
        await AuthService.instance().unauthorized()
        setIsUserConfirmed(false)
        setIsAuthenticated(false)
        saveString(StorageKey.isSavePassword, String(false))
        _logger.error("Auto authentication failed due reason: ", (e as { message: string }).message)
      }
    })()
  }, [])

  const setIsPasswordSaveCheckbox = useCallback((save: boolean) => {
    setIsPasswordSave(save)
    saveString(StorageKey.isSavePassword, String(save))
  }, [])

  async function doAuthorize({
    token,
    email,
    status,
    userId,
    tokenLong,
  }: {
    token: string
    email: string
    status: UserStatus
    userId: number
    tokenLong: string
  }): Promise<boolean> {
    try {
      const result = await AuthService.instance().authorize({
        token,
        tokenLong,
        status,
        userId,
        email,
      })
      if (result) {
        setIsAuthenticated(true)
        setIsUserConfirmed(status === UserStatus.ACTIVE)
        return true
      } else {
        setIsAuthenticated(false)
        setIsUserConfirmed(false)
        return false
      }
    } catch (e) {
      setIsUserConfirmed(false)
      setIsAuthenticated(false)
      _logger.error("Do authentication failed due reason: ", (e as { message: string }).message)
      return false
    }
  }

  const doSignUp = useCallback(
    async ({
      password,
      email,
      publicName,
      locale,
    }: {
      password: string
      email: string
      publicName: string
      locale: string
    }): Promise<GeneralApiProblem> => {
      const response = await SignupService.instance().doSignUp({
        password,
        email,
        publicName,
        locale,
      })
      switch (response.kind) {
        case GeneralApiProblemKind.Ok: {
          const { email, userId, status, token, tokenLong } = response.data as IUserClient
          const result = await doAuthorize({
            email,
            status,
            userId,
            token,
            tokenLong,
          })
          if (!result) {
            return {
              kind: GeneralApiProblemKind.Unknown,
              temporary: true,
            }
          }
          return { ...response, data: null, status: ResponseStatusType.OK, errors: undefined }
        }
        default: {
          buildGeneralApiBaseHandler(response)
          return response
        }
      }
    },
    [],
  )

  const doLogin = useCallback(async ({ password, email }: { password: string; email: string }) => {
    const response = await AuthService.instance().login({
      password,
      email,
    })
    switch (response.kind) {
      case GeneralApiProblemKind.Ok: {
        const { userId, token, tokenLong, status, email } = response.data as IUserClient
        const result = await doAuthorize({
          userId,
          token,
          tokenLong,
          email,
          status,
        })
        return result
      }
      case GeneralApiProblemKind.BadData: {
        return false
      }
      default: {
        buildGeneralApiBaseHandler(response)
        return false
      }
    }
  }, [])

  const doSetUserConfirmed = useCallback(() => {
    setIsUserConfirmed(true)
  }, [])

  const doLogout = useCallback(async (): Promise<boolean> => {
    try {
      const response = await LoginService.instance().doLogout()
      switch (response.kind) {
        case GeneralApiProblemKind.Ok: {
          await AuthService.instance().unauthorized()
          setIsAuthenticated(false)
          setIsUserConfirmed(false)
          setIsPasswordSave(false)
          saveString(StorageKey.isSavePassword, String(false))
          return true
        }
        default: {
          _logger.error("Do logout failed due reason: ", response.kind)
          buildGeneralApiBaseHandler(response)
          return false
        }
      }
    } catch (e) {
      _logger.error("Do logout failed due reason: ", (e as { message: string }).message)
      return false
    }
  }, [])

  const value: AuthContextType = {
    isAuthenticated,
    isPasswordSaveCheckbox,
    isUserConfirmed,
    setIsPasswordSaveCheckbox,
    doLogin,
    doSignUp,
    doLogout,
    doSetUserConfirmed,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
