import { getErrorMessage } from "@/lib/errors";
import { api } from "@memo-hack/convex";
import { useAction, useMutation } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { authTextInputStyle } from "./authInputStyles";
import { useApp } from "../../components/ContextProvider";

const heroAuth = require('../../assets/illustrations/hero-auth.png');

export default function SignInScreen() {
    const router = useRouter();
    const { signin, isLoading, isAuthenticated } = useApp();
    const requestPasswordResetEmailOtp = useAction(
        api.user.requestPasswordResetEmailOtp,
    );
    const resetPasswordWithEmailOtp = useMutation(
        api.user.resetPasswordWithEmailOtp,
    );

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)/home');
        }
    }, [isAuthenticated, router]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');
    const [resetEmailOtp, setResetEmailOtp] = useState('');
    const [resetOtpSent, setResetOtpSent] = useState(false);
    const [resetOtpExpiresAt, setResetOtpExpiresAt] = useState<number | null>(null);
    const [authMode, setAuthMode] = useState<'signin' | 'forgot'>('signin');
    const [requestingResetOtp, setRequestingResetOtp] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [resetPasswordFocused, setResetPasswordFocused] = useState(false);
    const [confirmResetPasswordFocused, setConfirmResetPasswordFocused] = useState(false);
    const [resetOtpFocused, setResetOtpFocused] = useState(false);

    const busy = isLoading || requestingResetOtp || resettingPassword;
    const normalizedEmail = email.trim().toLowerCase();
    const resetOtpExpiryText = resetOtpExpiresAt
        ? new Date(resetOtpExpiresAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
        : null;

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (authMode === 'forgot') {
            setResetOtpSent(false);
            setResetOtpExpiresAt(null);
            setResetEmailOtp('');
        }
    };

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            await signin(email.trim().toLowerCase(), password);
            router.replace('/(tabs)/home');
        } catch (error) {
            Alert.alert('Sign In Failed', getErrorMessage(error));
        }
    }

    const handleRequestPasswordResetOtp = async () => {
        if (busy) return;

        if (!normalizedEmail) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!normalizedEmail.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setRequestingResetOtp(true);
        try {
            const result = await requestPasswordResetEmailOtp({ email: normalizedEmail });
            setResetOtpSent(true);
            setResetOtpExpiresAt(result.expiresAt);
            setResetEmailOtp('');
            Alert.alert(
                'Verification code sent',
                'If an account exists for this email, we sent a 6-digit code.',
            );
        } catch (error) {
            Alert.alert('Could not send code', getErrorMessage(error));
        } finally {
            setRequestingResetOtp(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetOtpSent) {
            await handleRequestPasswordResetOtp();
            return;
        }

        if (!resetEmailOtp.trim()) {
            Alert.alert('Error', 'Please enter the verification code sent to your email');
            return;
        }

        if (!resetPassword.trim() || !confirmResetPassword.trim()) {
            Alert.alert('Error', 'Please fill in both password fields');
            return;
        }

        if (resetPassword !== confirmResetPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setResettingPassword(true);
        try {
            await resetPasswordWithEmailOtp({
                email: normalizedEmail,
                newPassword: resetPassword,
                emailOtp: resetEmailOtp.trim(),
            });
            Alert.alert('Password reset', 'Your password has been updated. Please sign in.');
            setAuthMode('signin');
            setPassword('');
            setResetPassword('');
            setConfirmResetPassword('');
            setResetEmailOtp('');
            setResetOtpSent(false);
            setResetOtpExpiresAt(null);
        } catch (error) {
            Alert.alert('Could not reset password', getErrorMessage(error));
        } finally {
            setResettingPassword(false);
        }
    };

    const switchToForgotPassword = () => {
        setAuthMode('forgot');
        setPassword('');
        setResetPassword('');
        setConfirmResetPassword('');
        setResetEmailOtp('');
        setResetOtpSent(false);
        setResetOtpExpiresAt(null);
    };

    const switchToSignIn = () => {
        setAuthMode('signin');
        setResetPassword('');
        setConfirmResetPassword('');
        setResetEmailOtp('');
        setResetOtpSent(false);
        setResetOtpExpiresAt(null);
    };

  return (
    <KeyboardAvoidingView 
      className='flex-1' 
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <LinearGradient
        colors={['#4F46E5', '#818CF8']}
        className='absolute top-0 left-0 right-0 bottom-0'
      />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View className="justify-center items-center px-8 py-12" style={{ minHeight: '100%' }}>
            {/* Image Container */}
          <View className="w-full items-center mb-8">
            <Image
              source={heroAuth}
              style={{ width: 180, height: 180 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Form Container */}
          <View className='w-full max-w-sm'>
            <View className='bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/20'>
              <Text className='text-4xl font-extrabold text-white text-center mb-2'>
                {authMode === 'signin' ? 'Welcome Back' : 'Reset Password'}
              </Text>
              <Text className='text-base text-white/70 text-center mb-8'>
                {authMode === 'signin'
                  ? 'Sign in to continue your learning journey'
                  : 'Verify your email to set a new password'}
              </Text>

              {/* Email Field */}
              <View className='mb-6'>
                <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>EMAIL ADDRESS</Text>
                <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${emailFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                  <View className="shrink-0">
                    <Mail size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <TextInput
                    className="text-white py-4 px-3 text-base"
                    multiline={false}
                    scrollEnabled={false}
                    placeholder="Your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!busy}
                    selectionColor="white"
                    style={authTextInputStyle}
                  />
                </View>
              </View>

              {authMode === 'signin' ? (
                <>
                  {/* Password Field */}
                  <View className='mb-4'>
                    <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>PASSWORD</Text>
                    <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${passwordFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                      <View className="shrink-0">
                        <Lock size={20} color="rgba(255,255,255,0.7)" />
                      </View>
                      <TextInput
                        className="text-white py-4 px-3 text-base"
                        multiline={false}
                        scrollEnabled={false}
                        placeholder="Your password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!busy}
                        selectionColor="white"
                        style={authTextInputStyle}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={busy} className='shrink-0 p-2'>
                        {showPassword ? 
                          <EyeOff size={20} color="rgba(255,255,255,0.7)" /> : 
                          <Eye size={20} color="rgba(255,255,255,0.7)" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="items-end mb-8">
                    <TouchableOpacity onPress={switchToForgotPassword} disabled={busy} className="px-2 py-1">
                      <Text className="text-white font-bold text-sm">Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {resetOtpSent && (
                    <>
                      <View className='mb-6'>
                        <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>EMAIL OTP</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${resetOtpFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                          <View className="shrink-0">
                            <KeyRound size={20} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-4 px-3 text-base"
                            multiline={false}
                            scrollEnabled={false}
                            placeholder="6-digit code"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={resetEmailOtp}
                            onChangeText={(value) => setResetEmailOtp(value.replace(/\D/g, '').slice(0, 6))}
                            onFocus={() => setResetOtpFocused(true)}
                            onBlur={() => setResetOtpFocused(false)}
                            editable={!busy}
                            selectionColor="white"
                            style={authTextInputStyle}
                          />
                        </View>
                        {resetOtpExpiryText ? (
                          <Text className="text-white/60 text-xs mt-2 ml-1">
                            Code expires at {resetOtpExpiryText}
                          </Text>
                        ) : null}
                      </View>

                      <View className='mb-6'>
                        <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>NEW PASSWORD</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${resetPasswordFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                          <View className="shrink-0">
                            <Lock size={20} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-4 px-3 text-base"
                            multiline={false}
                            scrollEnabled={false}
                            placeholder="New password"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            secureTextEntry={!showResetPassword}
                            value={resetPassword}
                            onChangeText={setResetPassword}
                            onFocus={() => setResetPasswordFocused(true)}
                            onBlur={() => setResetPasswordFocused(false)}
                            editable={!busy}
                            selectionColor="white"
                            style={authTextInputStyle}
                          />
                          <TouchableOpacity onPress={() => setShowResetPassword(!showResetPassword)} disabled={busy} className='shrink-0 p-2'>
                            {showResetPassword ? 
                              <EyeOff size={20} color="rgba(255,255,255,0.7)" /> : 
                              <Eye size={20} color="rgba(255,255,255,0.7)" />
                            }
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className='mb-8'>
                        <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>CONFIRM NEW PASSWORD</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${confirmResetPasswordFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                          <View className="shrink-0">
                            <Lock size={20} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-4 px-3 text-base"
                            multiline={false}
                            scrollEnabled={false}
                            placeholder="Repeat new password"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            secureTextEntry={!showConfirmResetPassword}
                            value={confirmResetPassword}
                            onChangeText={setConfirmResetPassword}
                            onFocus={() => setConfirmResetPasswordFocused(true)}
                            onBlur={() => setConfirmResetPasswordFocused(false)}
                            editable={!busy}
                            selectionColor="white"
                            style={authTextInputStyle}
                          />
                          <TouchableOpacity onPress={() => setShowConfirmResetPassword(!showConfirmResetPassword)} disabled={busy} className='shrink-0 p-2'>
                            {showConfirmResetPassword ? 
                              <EyeOff size={20} color="rgba(255,255,255,0.7)" /> : 
                              <Eye size={20} color="rgba(255,255,255,0.7)" />
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}

              {/* Sign In Button */}
              <TouchableOpacity 
                className='w-full rounded-2xl overflow-hidden mb-6 shadow-lg' 
                onPress={authMode === 'signin' ? handleSignIn : handleResetPassword}
                disabled={busy}
                style={{ 
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <LinearGradient
                  colors={busy ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className='py-4 px-6'
                >
                  {requestingResetOtp || resettingPassword ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className='text-white text-center text-lg font-bold tracking-wide'>
                      {authMode === 'signin'
                        ? isLoading ? 'Signing In...' : 'Sign In'
                        : resetOtpSent ? 'Reset password' : 'Send email code'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {authMode === 'signin' ? (
                <View className='flex-row justify-center items-center'>
                  <Text className='text-white/70 text-sm'>{"Don't have an account? "}</Text>
                  <Link href="/(auth)/signup" asChild>
                    <TouchableOpacity disabled={busy} className='px-2 py-1'>
                      <Text className='text-white font-bold text-sm'>Sign Up</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              ) : (
                <View className='flex-row justify-center items-center'>
                  <Text className='text-white/70 text-sm'>Remember your password? </Text>
                  <TouchableOpacity disabled={busy} onPress={switchToSignIn} className='px-2 py-1'>
                    <Text className='text-white font-bold text-sm'>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
