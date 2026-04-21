import { useApp } from "@/components/ContextProvider";
import { alertInfo } from "@/lib/confirm";
import { getErrorMessage } from "@/lib/errors";
import { api } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAction, useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FocusedField = "newPassword" | "confirmPassword" | "emailOtp" | null;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useApp();

  const requestPasswordChangeEmailOtp = useAction(
    api.user.requestPasswordChangeEmailOtp,
  );
  const changePassword = useMutation(api.user.changePassword);

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [emailOtp, setEmailOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = React.useState<number | null>(null);
  const [requestingOtp, setRequestingOtp] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<FocusedField>(null);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      router.back();
    }
  }, [router, user]);

  const busy = requestingOtp || saving;
  const otpExpiryText = otpExpiresAt
    ? new Date(otpExpiresAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const validatePasswordFields = () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      alertInfo("Validation", "Please fill in all password fields.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      alertInfo("Validation", "New passwords do not match.");
      return false;
    }
    return true;
  };

  const handleRequestOtp = async () => {
    if (busy) return;
    if (!validatePasswordFields()) return;

    setRequestingOtp(true);
    try {
      const result = await requestPasswordChangeEmailOtp({});
      setOtpSent(true);
      setOtpExpiresAt(result.expiresAt);
      setEmailOtp("");
      alertInfo(
        "Verification code sent",
        `We sent a 6-digit code to ${user?.email ?? "your email"}.`,
      );
    } catch (error) {
      alertInfo("Could not send code", getErrorMessage(error));
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordFields()) return;

    if (!otpSent) {
      await handleRequestOtp();
      return;
    }

    if (!emailOtp.trim()) {
      alertInfo("Validation", "Please enter the verification code sent to your email.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        newPassword,
        emailOtp: emailOtp.trim(),
      });
      alertInfo("Password changed", "Your password has been updated.");
      router.back();
    } catch (error) {
      alertInfo("Could not change password", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const passwordFieldClass = (field: FocusedField) =>
    `flex-row items-center rounded-xl border bg-slate-50 px-3 ${
      focusedField === field ? "border-indigo-400" : "border-slate-200"
    }`;

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 760,
            alignSelf: "center",
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => {
                if (!busy) router.back();
              }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <Text
              className="flex-1 text-white text-lg font-bold"
              numberOfLines={1}
            >
              Change password
            </Text>
            <View style={{ width: 44, height: 44 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "web" ? undefined : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: tabBarHeight + insets.bottom + 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              NEW PASSWORD
            </Text>
            <View className={passwordFieldClass("newPassword")}>
              <Lock size={18} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-2 text-slate-900 text-base"
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setFocusedField("newPassword")}
                onBlur={() => setFocusedField(null)}
                placeholder="New password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showNewPassword}
                editable={!busy}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword((value) => !value)}
                disabled={busy}
                className="p-2"
              >
                {showNewPassword ? (
                  <EyeOff size={18} color="#64748B" />
                ) : (
                  <Eye size={18} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
            <Text className="text-slate-500 text-xs font-semibold mb-2">
              CONFIRM NEW PASSWORD
            </Text>
            <View className={passwordFieldClass("confirmPassword")}>
              <Lock size={18} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-2 text-slate-900 text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                placeholder="Repeat new password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                editable={!busy}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((value) => !value)}
                disabled={busy}
                className="p-2"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color="#64748B" />
                ) : (
                  <Eye size={18} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {otpSent ? (
            <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
              <Text className="text-slate-500 text-xs font-semibold mb-2">
                EMAIL OTP
              </Text>
              <View className={passwordFieldClass("emailOtp")}>
                <KeyRound size={18} color="#64748B" />
                <TextInput
                  className="flex-1 py-3 px-2 text-slate-900 text-base"
                  value={emailOtp}
                  onChangeText={(value) =>
                    setEmailOtp(value.replace(/\D/g, "").slice(0, 6))
                  }
                  onFocus={() => setFocusedField("emailOtp")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="6-digit code"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!busy}
                />
              </View>
              {otpExpiryText ? (
                <Text className="text-slate-500 text-xs mt-2">
                  Code expires at {otpExpiryText}
                </Text>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={busy}
            className="rounded-2xl bg-indigo-600 py-4 items-center"
            style={{ opacity: busy ? 0.7 : 1 }}
          >
            {requestingOtp || saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {otpSent ? "Change password" : "Send email code"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
