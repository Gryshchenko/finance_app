import React from "react"
import { View, Pressable, ViewStyle, TextStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { TxKeyPath } from "@/i18n"
import { ToastType } from "@/services/ToastService"

interface InfoToastProps {
  title: TxKeyPath
  message: TxKeyPath
  onClose: () => void
  type: ToastType
}

const ICON_BY_TYPE: Record<ToastType, "info" | "check-circle" | "warning" | "error" > = {
  info: "info",
  custom: "info",
  success: "check-circle",
  warning: "warning",
  error: "error",
}

export const InfoToast: React.FC<InfoToastProps> = ({ title, message, onClose, type }) => {
  const { themed, theme } = useAppTheme()

  return (
    <View style={themed($container(type))}>
      <View style={themed($iconWrapper)}>
        <MaterialIcons name={ICON_BY_TYPE[type]} size={22} color={theme.colors.toast[type].icon} />
      </View>

      <View style={themed($content)}>
        <Text tx={title} style={themed($title(type))} />
        <Text tx={message} style={themed($message(type))} />
      </View>

      <Pressable onPress={onClose} hitSlop={8}>
        <MaterialIcons name="close" size={20} color={theme.colors.toast.close} />
      </Pressable>
    </View>
  )
}

const $container =
  (type: ToastType): ThemedStyle<ViewStyle> =>
  ({ colors }) => ({
    width: "100%",
    maxWidth: 384,
    backgroundColor: colors.toast[type].background,
    borderWidth: 1,
    borderColor: colors.toast[type].border,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  })

const $iconWrapper: ThemedStyle<ViewStyle> = () => ({
  marginRight: 12,
  flexShrink: 0,
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $title =
  (type: ToastType): ThemedStyle<TextStyle> =>
  ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: "700",
    color: colors.toast[type].text,
    marginBottom: 2,
    fontFamily: typography.fonts.funnelSans.bold,
  })

const $message =
  (type: ToastType): ThemedStyle<TextStyle> =>
  ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: "400",
    color: colors.toast[type].textDim,
    fontFamily: typography.fonts.funnelSans.medium,
  })
