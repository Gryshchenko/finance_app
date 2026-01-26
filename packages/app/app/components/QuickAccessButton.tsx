import { useEffect, useState } from "react"
import { Pressable, TextStyle, ViewStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as Keychain from "react-native-keychain"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

type QuickAccessType = "fingerprint" | "face" | null

type Props = {
  onPress?: (type: QuickAccessType) => void
}

const mapBiometryType = (type: Keychain.BIOMETRY_TYPE | null): QuickAccessType => {
  switch (type) {
    case Keychain.BIOMETRY_TYPE.FACE_ID:
      return "face"
    case Keychain.BIOMETRY_TYPE.TOUCH_ID:
    case Keychain.BIOMETRY_TYPE.FINGERPRINT:
      return "fingerprint"
    default:
      return null
  }
}

export const QuickAccessButton = ({}: Props) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [type, setType] = useState<QuickAccessType>(null)

  useEffect(() => {
    try {
      Keychain?.getSupportedBiometryType().then((biometryType) => {
        setType(mapBiometryType(biometryType))
      })
    } catch {}
  }, [])

  if (!type) return null

  const iconName = type === "face" ? "photo-camera-front" : "fingerprint"

  return (
    <Pressable style={themed($quickAccessContainer)} onPress={() => {}}>
      {({ pressed }) => (
        <>
          <MaterialIcons name={iconName} size={40} color={pressed ? colors.text : colors.textDim} />
          <Text tx={"loginScreen:quickAccess"} style={themed($quickAccessLabel)} />{" "}
        </>
      )}
    </Pressable>
  )
}

const $quickAccessLabel: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 2,
  fontWeight: "700",
  textTransform: "uppercase",
  textAlign: "center",
  color: colors.textDim,
  fontFamily: typography.fonts.funnelSans.semiBold,
})

const $quickAccessContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  marginTop: spacing.xxl,
})
