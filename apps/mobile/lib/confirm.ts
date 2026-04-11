import { Alert, Platform } from "react-native";

/** Cross-platform confirm; uses `window.confirm` on web where `Alert.alert` is unreliable. */
export function confirmAsync(options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
}): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel,
    cancelLabel = "Cancel",
  } = options;

  if (Platform.OS === "web") {
    const text = `${title}\n\n${message}`;
    return Promise.resolve(
      typeof globalThis.confirm === "function"
        ? globalThis.confirm(text)
        : false,
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Single informational alert; uses `window.alert` on web. */
export function alertInfo(title: string, message: string): void {
  if (Platform.OS === "web") {
    globalThis.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
