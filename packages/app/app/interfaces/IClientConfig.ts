import { LanguageType } from "tenpercent/shared"

import { IClientConfigLanguage } from "@/interfaces/IClientConfigLanguages"

export interface IClientConfig {
  version: string
  locales: IClientConfigLanguage[]
  defaults: {
    language: LanguageType
    currencyCode: string
  }
}
