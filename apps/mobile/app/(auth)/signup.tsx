import { SignupEmailOtpStep } from "@/components/auth/SignupEmailOtpStep";
import { getErrorMessage } from "@/lib/errors";
import {
  prepareProfileImage,
  uploadToConvexStorage,
  type PreparedImage,
} from "@/lib/imageUpload";
import { alertInfo } from "@/lib/confirm";
import { api, type Id } from "@memo-hack/convex";
import { useAction, useMutation } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  ImageIcon,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { authTextInputStyle } from "./authInputStyles";
import { useApp } from "../../components/ContextProvider";

export default function SignUpScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const { signup, isLoading, isAuthenticated } = useApp();
  const generateSignupProfileUploadUrl = useMutation(
    api.user.generateSignupProfileImageUploadUrl,
  );
  const requestSignupEmailOtp = useAction(api.user.requestSignupEmailOtp);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, router]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    className: "",
    memohackStudent: null as boolean | null,
  });
  const [profileImage, setProfileImage] = useState<PreparedImage | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpStatusText, setOtpStatusText] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<"details" | "verify">("details");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signUpPhase, setSignUpPhase] = useState<"upload" | "signup" | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const classOptions = ["9", "10", "11", "12", "Repeater"];

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") {
      setOtpSentTo(null);
      setOtpExpiresAt(null);
      setOtpStatusText(null);
      setEmailOtp("");
      setSignupStep("details");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const busy = isLoading || submitting || pickingPhoto || requestingOtp;
  const normalizedEmail = formData.email.trim().toLowerCase();
  const hasEmailOtpForCurrentEmail = otpSentTo === normalizedEmail;
  const otpExpiryText = otpExpiresAt
    ? new Date(otpExpiresAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const validateSignUpForm = () => {
    const {
      email,
      password,
      confirmPassword,
      name,
      phone,
      className,
      memohackStudent,
    } = formData;

    if (
      !email.trim() ||
      !password.trim() ||
      !name.trim() ||
      !phone.trim() ||
      !className.trim()
    ) {
      alertInfo("Error", "Please fill in all required fields");
      return false;
    }

    if (memohackStudent === null) {
      alertInfo("Error", "Please select whether you study in MemoHack");
      return false;
    }

    if (!email.includes("@")) {
      alertInfo("Error", "Please enter a valid email address");
      return false;
    }

    if (password.length < 8) {
      alertInfo("Error", "Password must be at least 8 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      alertInfo("Error", "Passwords do not match");
      return false;
    }

    if (phone.length < 10 || phone.length > 10) {
      alertInfo("Error", "Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleRequestEmailOtp = async () => {
    if (busy) return false;
    if (!validateSignUpForm()) return false;

    setRequestingOtp(true);
    setOtpStatusText(null);
    try {
      const result = await requestSignupEmailOtp({ email: normalizedEmail });
      setOtpSentTo(normalizedEmail);
      setOtpExpiresAt(result.expiresAt);
      setEmailOtp("");
      setSignupStep("verify");
      setOtpStatusText(`We sent a 6-digit code to ${normalizedEmail}.`);
      return true;
    } catch (error) {
      alertInfo("Could not send code", getErrorMessage(error));
      return false;
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleContinueToVerification = async () => {
    if (busy) return;
    if (!validateSignUpForm()) return;

    if (hasEmailOtpForCurrentEmail) {
      setSignupStep("verify");
      setOtpStatusText(`We sent a 6-digit code to ${normalizedEmail}.`);
      return;
    }

    await handleRequestEmailOtp();
  };

  const handleBackToDetails = () => {
    if (busy) return;
    setFocusedField(null);
    setShowClassDropdown(false);
    setSignupStep("details");
  };

  const handlePickProfilePhoto = async () => {
    if (pickingPhoto || submitting || isLoading) return;
    setPickingPhoto(true);
    try {
      const prepared = await prepareProfileImage();
      if (!prepared) {
        alertInfo(
          "No photo",
          "No image was selected or permission was denied.",
        );
        return;
      }
      setProfileImage(prepared);
    } catch (e) {
      alertInfo(
        "Could not use photo",
        e instanceof Error ? e.message : "Please try another image.",
      );
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleSignUp = async () => {
    const { email, password, name, phone, className, memohackStudent } =
      formData;

    if (!validateSignUpForm()) {
      return;
    }

    if (memohackStudent === null) {
      return;
    }

    if (!hasEmailOtpForCurrentEmail) {
      await handleRequestEmailOtp();
      return;
    }

    if (emailOtp.trim().length !== 6) {
      alertInfo(
        "Error",
        "Please enter the 6-digit verification code sent to your email",
      );
      return;
    }

    setSubmitting(true);
    setSignUpPhase(profileImage ? "upload" : "signup");
    try {
      let profileImageStorageId: Id<"_storage"> | undefined;
      if (profileImage) {
        const { uploadUrl } = await generateSignupProfileUploadUrl({});
        profileImageStorageId = (await uploadToConvexStorage(
          uploadUrl,
          profileImage.uri,
          profileImage.mime,
        )) as Id<"_storage">;
        setSignUpPhase("signup");
      }
      await signup(
        email.trim().toLowerCase(),
        password,
        name.trim(),
        phone.trim(),
        className.trim(),
        memohackStudent,
        emailOtp.trim(),
        profileImageStorageId,
      );
      router.replace("/(tabs)/home");
    } catch (error) {
      alertInfo("Sign Up Failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
      setSignUpPhase(null);
    }
  };

  const handleEmailOtpChange = (value: string) => {
    setEmailOtp(value.replace(/\D/g, "").slice(0, 6));
  };

  const signUpButtonLabel =
    signUpPhase === "upload"
      ? "Uploading photo..."
      : submitting || signUpPhase === "signup"
        ? "Creating Account..."
        : "Create Account";

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "web" ? undefined : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <LinearGradient
        colors={["#4F46E5", "#818CF8"]}
        className="absolute top-0 left-0 right-0 bottom-0"
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View
          className="justify-center items-center px-5 py-7"
          style={{ minHeight: "100%" }}
        >
          <View className="w-full items-center" style={{ marginBottom: compact ? 12 : 18 }}>
            <Image
              source={require("../../assets/illustrations/hero-auth.png")}
              style={{ width: compact ? 88 : 104, height: compact ? 88 : 104 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          <View className="w-full max-w-sm">
            {signupStep === "verify" && hasEmailOtpForCurrentEmail ? (
              <SignupEmailOtpStep
                busy={busy}
                email={normalizedEmail}
                emailOtp={emailOtp}
                onBack={handleBackToDetails}
                onChangeEmailOtp={handleEmailOtpChange}
                onResend={handleRequestEmailOtp}
                onSubmit={handleSignUp}
                otpExpiryText={otpExpiryText}
                primaryLabel={signUpButtonLabel}
                requestingOtp={requestingOtp}
                statusText={otpStatusText}
              />
            ) : (
              <View className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/20">
                <Text className="text-2xl font-extrabold text-white text-center mb-1">
                  Join MemoHack
                </Text>
                <Text className="text-sm text-white/70 text-center mb-5">
                  Create your account to start learning
                </Text>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    FULL NAME *
                  </Text>
                  <View
                    className={`flex-row items-center bg-white/15 rounded-xl border ${focusedField === "name" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="shrink-0">
                      <User size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      className="text-white py-3 px-3 text-sm"
                      multiline={false}
                      scrollEnabled={false}
                      placeholder="Your full name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.name}
                      onChangeText={(value) => handleInputChange("name", value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      editable={!busy}
                      selectionColor="white"
                      style={authTextInputStyle}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    EMAIL ADDRESS *
                  </Text>
                  <View
                    className={`flex-row items-center bg-white/15 rounded-xl border ${focusedField === "email" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="shrink-0">
                      <Mail size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      className="text-white py-3 px-3 text-sm"
                      multiline={false}
                      scrollEnabled={false}
                      placeholder="Your email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(value) =>
                        handleInputChange("email", value)
                      }
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      editable={!busy}
                      selectionColor="white"
                      style={authTextInputStyle}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    PHONE NUMBER *
                  </Text>
                  <View
                    className={`flex-row items-center bg-white/15 rounded-xl border ${focusedField === "phone" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="shrink-0">
                      <Phone size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      className="text-white py-3 px-3 text-sm"
                      multiline={false}
                      scrollEnabled={false}
                      placeholder="Mobile number"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(value) =>
                        handleInputChange("phone", value)
                      }
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      editable={!busy}
                      selectionColor="white"
                      style={authTextInputStyle}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    CLASS *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFocusedField("className");
                      setShowClassDropdown(!showClassDropdown);
                    }}
                    disabled={busy}
                    className={`flex-row items-center justify-between bg-white/15 rounded-xl border ${focusedField === "className" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="flex-row items-center flex-1">
                      <GraduationCap size={18} color="rgba(255,255,255,0.7)" />
                      <Text
                        className={`flex-1 py-3 px-3 text-sm ${formData.className ? "text-white" : "text-white/50"}`}
                      >
                        {formData.className
                          ? formData.className === "Repeater"
                            ? "Repeater"
                            : `Class ${formData.className}`
                          : "Select your class"}
                      </Text>
                    </View>
                    <ChevronDown
                      size={18}
                      color="rgba(255,255,255,0.7)"
                      style={{
                        transform: [
                          { rotate: showClassDropdown ? "180deg" : "0deg" },
                        ],
                      }}
                    />
                  </TouchableOpacity>

                  {showClassDropdown && (
                    <View
                      className="mt-2 bg-white/10 rounded-xl border border-white/20 overflow-hidden"
                    >
                      {classOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            handleInputChange("className", option);
                            setShowClassDropdown(false);
                            setFocusedField(null);
                          }}
                          className={`px-4 py-2.5 border-b border-white/10 last:border-b-0 ${
                            formData.className === option ? "bg-white/20" : "bg-transparent"
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-sm ${formData.className === option ? "text-white font-semibold" : "text-white/80"}`}
                          >
                            {option === "Repeater" ? "Repeater" : `Class ${option}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    PASSWORD *
                  </Text>
                  <View
                    className={`flex-row items-center bg-white/15 rounded-xl border ${focusedField === "password" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="shrink-0">
                      <Lock size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      className="text-white py-3 px-3 text-sm"
                      multiline={false}
                      scrollEnabled={false}
                      placeholder="8+ characters"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(value) =>
                        handleInputChange("password", value)
                      }
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      editable={!busy}
                      selectionColor="white"
                      style={authTextInputStyle}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="shrink-0 p-1"
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <Eye size={18} color="rgba(255,255,255,0.7)" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    CONFIRM PASSWORD *
                  </Text>
                  <View
                    className={`flex-row items-center bg-white/15 rounded-xl border ${focusedField === "confirmPassword" ? "border-white/60" : "border-white/25"} px-3`}
                  >
                    <View className="shrink-0">
                      <Lock size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      className="text-white py-3 px-3 text-sm"
                      multiline={false}
                      scrollEnabled={false}
                      placeholder="Repeat password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onChangeText={(value) =>
                        handleInputChange("confirmPassword", value)
                      }
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      editable={!busy}
                      selectionColor="white"
                      style={authTextInputStyle}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="shrink-0 p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <Eye size={18} color="rgba(255,255,255,0.7)" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-white/90 text-xs font-semibold mb-2 ml-1">
                    PROFILE IMAGE (OPTIONAL)
                  </Text>
                  <View className="flex-row items-center gap-3 bg-white/15 rounded-xl border border-white/25 px-3 py-3">
                    <View
                      className="shrink-0 rounded-full overflow-hidden bg-white/20"
                      style={{ width: 48, height: 48 }}
                    >
                      {profileImage ? (
                        <Image
                          source={{ uri: profileImage.uri }}
                          style={{ width: 48, height: 48 }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <ImageIcon size={22} color="rgba(255,255,255,0.6)" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1 min-w-0">
                      <TouchableOpacity
                        onPress={handlePickProfilePhoto}
                        disabled={busy}
                        className="rounded-lg bg-white/20 py-2 px-3 mb-2"
                        style={{ opacity: busy ? 0.6 : 1 }}
                      >
                        <View className="flex-row items-center justify-center gap-2">
                          {pickingPhoto ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : null}
                          <Text className="text-white text-sm font-semibold text-center">
                            {profileImage ? "Change photo" : "Choose photo"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {profileImage ? (
                        <TouchableOpacity
                          onPress={() => setProfileImage(null)}
                          disabled={busy}
                        >
                          <Text className="text-white/80 text-xs font-medium text-center">
                            Remove
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text className="text-white/50 text-xs">
                          JPEG/PNG from your library (max 10 MB)
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-white/90 text-xs font-semibold mb-3 ml-1">
                    STUDYING IN MEMOHACK? *
                  </Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          memohackStudent: true,
                        }))
                      }
                      disabled={busy}
                      className={`flex-1 rounded-xl py-3 px-4 border ${
                        formData.memohackStudent === true
                          ? "bg-white/30 border-white/80"
                          : "bg-white/10 border-white/25"
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold text-sm ${
                          formData.memohackStudent === true
                            ? "text-white"
                            : "text-white/70"
                        }`}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          memohackStudent: false,
                        }))
                      }
                      disabled={busy}
                      className={`flex-1 rounded-xl py-3 px-4 border ${
                        formData.memohackStudent === false
                          ? "bg-white/30 border-white/80"
                          : "bg-white/10 border-white/25"
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold text-sm ${
                          formData.memohackStudent === false
                            ? "text-white"
                            : "text-white/70"
                        }`}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="w-full rounded-xl overflow-hidden mb-4"
                  onPress={handleContinueToVerification}
                  disabled={busy}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.16,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={
                      busy ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#6366F1"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-3 px-6"
                  >
                    <Text className="text-white text-center text-base font-bold tracking-wide">
                      {!busy
                        ? hasEmailOtpForCurrentEmail
                          ? "Continue to verification"
                          : "Send email code"
                        : requestingOtp
                          ? "Sending email code..."
                          : pickingPhoto
                            ? "Opening library…"
                            : "Please wait..."}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View className="flex-row justify-center items-center">
                  <Text className="text-white/70 text-xs">
                    Already have an account?{" "}
                  </Text>
                  <Link href="/(auth)/signin" asChild>
                    <TouchableOpacity disabled={busy} className="px-2 py-1">
                      <Text className="text-white font-bold text-xs">
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
