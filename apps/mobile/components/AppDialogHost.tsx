import {
  type AppDialogAction,
  type AppDialogRequest,
  type DialogVariant,
  setDialogPresenter,
} from "@/lib/confirm";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from "react-native";

const variantConfig: Record<
  DialogVariant,
  {
    icon: React.ComponentType<{ size?: number; color?: ColorValue }>;
    iconColor: string;
    iconBackground: string;
  }
> = {
  info: {
    icon: Info,
    iconColor: "#4F46E5",
    iconBackground: "#EEF2FF",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "#059669",
    iconBackground: "#ECFDF5",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "#D97706",
    iconBackground: "#FFFBEB",
  },
  error: {
    icon: XCircle,
    iconColor: "#DC2626",
    iconBackground: "#FEF2F2",
  },
  destructive: {
    icon: ShieldAlert,
    iconColor: "#DC2626",
    iconBackground: "#FEF2F2",
  },
};

function DialogButton({
  action,
  onPress,
  actionCount,
  index,
}: {
  action: AppDialogAction;
  onPress: () => void;
  actionCount: number;
  index: number;
}) {
  const isPrimary = action.role === "primary";
  const isDestructive = action.role === "destructive";
  const buttonWidthStyle =
    actionCount === 1
      ? styles.singleButton
      : Platform.OS === "web"
        ? styles.webMultiButton
        : styles.nativeStackButton;
  const nativeSpacing =
    Platform.OS !== "web" && actionCount > 1 && index > 0
      ? styles.nativeStackButtonSpacing
      : null;

  if (isPrimary) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.86}
        onPress={onPress}
        style={[
          styles.button,
          buttonWidthStyle,
          nativeSpacing,
          styles.primaryButton,
        ]}
      >
        <LinearGradient
          colors={["#8B5CF6", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {action.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.86}
      onPress={onPress}
      style={[
        styles.button,
        buttonWidthStyle,
        nativeSpacing,
        isDestructive ? styles.destructiveButton : styles.secondaryButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          isDestructive
            ? styles.destructiveButtonText
            : styles.secondaryButtonText,
        ]}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

export function AppDialogHost() {
  const [queue, setQueue] = useState<AppDialogRequest[]>([]);
  const activeDialog = queue[0] ?? null;

  useEffect(() => {
    return setDialogPresenter((request) => {
      setQueue((current) => [...current, request]);
    });
  }, []);

  const config = useMemo(() => {
    return variantConfig[activeDialog?.variant ?? "info"];
  }, [activeDialog?.variant]);

  const resolveActive = useCallback(
    (value: boolean) => {
      if (!activeDialog) return;
      activeDialog.resolve(value);
      setQueue((current) =>
        current.filter((request) => request.id !== activeDialog.id),
      );
    },
    [activeDialog],
  );

  if (!activeDialog) {
    return null;
  }

  const Icon = config.icon;
  const dismissValue =
    activeDialog.actions.length === 1 ? activeDialog.actions[0].value : false;

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => resolveActive(dismissValue)}
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert">
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: config.iconBackground },
            ]}
          >
            <Icon size={28} color={config.iconColor} />
          </View>

          <Text style={styles.title}>{activeDialog.title}</Text>
          <Text style={styles.message}>{activeDialog.message}</Text>

          <View
            style={[
              styles.actions,
              activeDialog.actions.length === 1 && styles.singleAction,
            ]}
          >
            {activeDialog.actions.map((action, index) => (
              <DialogButton
                key={`${activeDialog.id}-${action.label}-${action.value}`}
                action={action}
                actionCount={activeDialog.actions.length}
                index={index}
                onPress={() => resolveActive(action.value)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: Platform.OS === "web" ? "space-between" : "center",
    marginTop: 22,
  },
  singleAction: {
    justifyContent: "center",
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  singleButton: {
    width: "100%",
  },
  webMultiButton: {
    width: "48%",
  },
  nativeStackButton: {
    width: "100%",
  },
  nativeStackButtonSpacing: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#6366F1",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  destructiveButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#374151",
  },
  destructiveButtonText: {
    color: "#DC2626",
  },
});
