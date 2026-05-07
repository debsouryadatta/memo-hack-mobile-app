import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, KeyRound, Mail } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SignupEmailOtpStepProps = {
  email: string;
  emailOtp: string;
  otpExpiryText: string | null;
  statusText: string | null;
  busy: boolean;
  requestingOtp: boolean;
  primaryLabel: string;
  onBack: () => void;
  onChangeEmailOtp: (value: string) => void;
  onResend: () => void;
  onSubmit: () => void;
};

export function SignupEmailOtpStep({
  email,
  emailOtp,
  otpExpiryText,
  statusText,
  busy,
  requestingOtp,
  primaryLabel,
  onBack,
  onChangeEmailOtp,
  onResend,
  onSubmit,
}: SignupEmailOtpStepProps) {
  return (
    <View className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/20">
      <TouchableOpacity
        onPress={onBack}
        disabled={busy}
        className="self-start flex-row items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-2 mb-4"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <ArrowLeft size={16} color="rgba(255,255,255,0.82)" />
        <Text className="text-white/80 text-xs font-bold">Edit details</Text>
      </TouchableOpacity>

      <View className="items-center">
        <View className="rounded-full bg-white/15 border border-white/20 p-4 mb-4">
          <Mail size={28} color="white" />
        </View>
        <Text className="text-2xl font-extrabold text-white text-center mb-2">
          Verify your email
        </Text>
        <Text className="text-sm text-white/70 text-center leading-5 mb-5">
          Enter the 6-digit code sent to{" "}
          <Text className="text-white font-bold">{email}</Text>
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
          EMAIL CODE *
        </Text>
        <View className="flex-row items-center bg-white/15 rounded-xl border border-white/25 px-3">
          <View className="shrink-0">
            <KeyRound size={20} color="rgba(255,255,255,0.7)" />
          </View>
          <TextInput
            autoFocus
            className="flex-1 text-white py-3 px-3 text-center"
            editable={!busy}
            keyboardType="number-pad"
            maxLength={6}
            multiline={false}
            onChangeText={onChangeEmailOtp}
            placeholder="000000"
            placeholderTextColor="rgba(255,255,255,0.36)"
            scrollEnabled={false}
            selectionColor="white"
            style={{
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: 6,
              minWidth: 0,
            }}
            value={emailOtp}
          />
        </View>
        {otpExpiryText ? (
          <Text className="text-white/60 text-xs mt-2 ml-1">
            Code expires at {otpExpiryText}
          </Text>
        ) : null}
        {statusText ? (
          <Text className="text-white/70 text-xs mt-2 ml-1">{statusText}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        className="w-full rounded-xl overflow-hidden mt-2 mb-4"
        disabled={busy}
        onPress={onSubmit}
        style={{
          opacity: busy ? 0.8 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={busy ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-3 px-6"
        >
          <View className="flex-row items-center justify-center gap-2">
            {busy && !requestingOtp ? (
              <ActivityIndicator color="white" size="small" />
            ) : null}
            <Text className="text-white text-center text-base font-bold tracking-wide">
              {primaryLabel}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-white/60 text-xs mb-2">Did not get a code?</Text>
        <TouchableOpacity
          disabled={busy}
          onPress={onResend}
          className="rounded-full bg-white/10 border border-white/15 px-4 py-2"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          <View className="flex-row items-center justify-center gap-2">
            {requestingOtp ? (
              <ActivityIndicator color="white" size="small" />
            ) : null}
            <Text className="text-white text-xs font-bold">
              {requestingOtp ? "Sending code..." : "Resend code"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
