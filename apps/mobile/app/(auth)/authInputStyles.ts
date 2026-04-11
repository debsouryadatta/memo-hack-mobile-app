import { Platform, type TextStyle } from "react-native";

/**
 * Single-line auth fields in a flex row: Android needs minWidth:0 on the TextInput
 * itself (not only Tailwind) or hints wrap; secureTextEntry makes this more common.
 */
export const authTextInputStyle: TextStyle = {
  flex: 1,
  minWidth: 0,
  ...(Platform.OS === "android"
    ? {
        includeFontPadding: false,
        textAlignVertical: "center",
      }
    : {}),
  ...(Platform.OS === "web"
    ? ({ whiteSpace: "nowrap" } as TextStyle)
    : {}),
};
