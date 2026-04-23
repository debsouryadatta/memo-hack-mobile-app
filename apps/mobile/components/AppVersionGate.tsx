import { api } from "@memo-hack/convex";
import { useQuery } from "convex/react";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { AlertCircle, ExternalLink } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function parseVersion(version: string | null | undefined): number[] {
  return String(version ?? "")
    .trim()
    .split(".")
    .map((part) => {
      const value = Number.parseInt(part.replace(/\D.*/, ""), 10);
      return Number.isFinite(value) ? value : 0;
    });
}

function isVersionOlder(current: string | null, latest: string | null): boolean {
  if (!current || !latest) return false;

  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  const length = Math.max(currentParts.length, latestParts.length, 3);

  for (let i = 0; i < length; i += 1) {
    const currentValue = currentParts[i] ?? 0;
    const latestValue = latestParts[i] ?? 0;
    if (currentValue < latestValue) return true;
    if (currentValue > latestValue) return false;
  }

  return false;
}

function getCurrentAppVersion(): string | null {
  return (
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??
    Constants.nativeAppVersion ??
    null
  );
}

export function AppVersionGate() {
  const config = useQuery(api.settings.getMobileUpdateConfig, {});
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const isMobile = Platform.OS === "android" || Platform.OS === "ios";
  const currentVersion = getCurrentAppVersion();
  const updateUrl =
    Platform.OS === "android"
      ? config?.androidUpdateUrl
      : Platform.OS === "ios"
        ? config?.iosUpdateUrl
        : null;

  const shouldShow = useMemo(() => {
    if (!isMobile || !config?.latestVersion) return false;
    if (dismissedVersion === config.latestVersion) return false;
    return isVersionOlder(currentVersion, config.latestVersion);
  }, [config?.latestVersion, currentVersion, dismissedVersion, isMobile]);

  const handleUpdate = async () => {
    if (!updateUrl) {
      setDismissedVersion(config?.latestVersion ?? null);
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(updateUrl);
      if (canOpen) {
        await Linking.openURL(updateUrl);
      }
    } catch {
      setDismissedVersion(config?.latestVersion ?? null);
    }
  };

  return (
    <Modal visible={shouldShow} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.58)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "white",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: "#EEF2FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <AlertCircle size={28} color="#4F46E5" />
          </View>

          <Text
            style={{
              color: "#0F172A",
              fontSize: 22,
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Update available
          </Text>
          <Text
            style={{
              color: "#64748B",
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 22,
            }}
          >
            A newer version of MemoHack is available. Please update to version{" "}
            {config?.latestVersion} for the best experience.
          </Text>

          <TouchableOpacity
            onPress={handleUpdate}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              style={{
                paddingVertical: 15,
                paddingHorizontal: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ExternalLink size={18} color="white" />
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 16,
                }}
              >
                Update App
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDismissedVersion(config?.latestVersion ?? null)}
            style={{
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#64748B", fontWeight: "800" }}>
              Maybe later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
