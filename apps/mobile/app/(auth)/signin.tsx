import { getErrorMessage } from "@/lib/errors";
import { alertInfo } from "@/lib/confirm";
import { api } from "@memo-hack/convex";
import { useAction, useMutation } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { authTextInputStyle } from "./authInputStyles";
import { useApp } from "../../components/ContextProvider";

const heroAuth = require('../../assets/illustrations/hero-auth.png');

export default function SignInScreen() {
    const router = useRouter();
    const { height } = useWindowDimensions();
    const compact = height < 760;
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
            alertInfo('Error', 'Please fill in all fields');
            return;
        }

        if (!email.includes('@')) {
            alertInfo('Error', 'Please enter a valid email address');
            return;
        }

        try {
            await signin(email.trim().toLowerCase(), password);
            router.replace('/(tabs)/home');
        } catch (error) {
            alertInfo('Sign In Failed', getErrorMessage(error));
        }
    }

    const handleRequestPasswordResetOtp = async () => {
        if (busy) return;

        if (!normalizedEmail) {
            alertInfo('Error', 'Please enter your email address');
            return;
        }

        if (!normalizedEmail.includes('@')) {
            alertInfo('Error', 'Please enter a valid email address');
            return;
        }

        setRequestingResetOtp(true);
        try {
            const result = await requestPasswordResetEmailOtp({ email: normalizedEmail });
            setResetOtpSent(true);
            setResetOtpExpiresAt(result.expiresAt);
            setResetEmailOtp('');
            alertInfo(
                'Verification code sent',
                'If an account exists for this email, we sent a 6-digit code.',
            );
        } catch (error) {
            alertInfo('Could not send code', getErrorMessage(error));
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
            alertInfo('Error', 'Please enter the verification code sent to your email');
            return;
        }

        if (!resetPassword.trim() || !confirmResetPassword.trim()) {
            alertInfo('Error', 'Please fill in both password fields');
            return;
        }

        if (resetPassword !== confirmResetPassword) {
            alertInfo('Error', 'Passwords do not match');
            return;
        }

        setResettingPassword(true);
        try {
            await resetPasswordWithEmailOtp({
                email: normalizedEmail,
                newPassword: resetPassword,
                emailOtp: resetEmailOtp.trim(),
            });
            alertInfo('Password reset', 'Your password has been updated. Please sign in.');
            setAuthMode('signin');
            setPassword('');
            setResetPassword('');
            setConfirmResetPassword('');
            setResetEmailOtp('');
            setResetOtpSent(false);
            setResetOtpExpiresAt(null);
        } catch (error) {
            alertInfo('Could not reset password', getErrorMessage(error));
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
        <View className="justify-center items-center px-6 py-8" style={{ minHeight: '100%' }}>
          <View className="w-full items-center" style={{ marginBottom: compact ? 16 : 22 }}>
            <Image
              source={heroAuth}
              style={{ width: compact ? 108 : 124, height: compact ? 108 : 124 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          <View className='w-full max-w-sm'>
            <View className='bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/20'>
              <Text className='text-3xl font-extrabold text-white text-center mb-2'>
                {authMode === 'signin' ? 'Welcome Back' : 'Reset Password'}
              </Text>
              <Text className='text-sm text-white/70 text-center mb-6 leading-5'>
                {authMode === 'signin'
                  ? 'Sign in to continue your learning journey'
                  : 'Verify your email to set a new password'}
              </Text>

              <View className='mb-4'>
                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>EMAIL ADDRESS</Text>
                <View className={`flex-row items-center bg-white/15 rounded-xl border ${emailFocused ? 'border-white/60' : 'border-white/25'} px-3`}>
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
                  <View className='mb-4'>
                    <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>PASSWORD</Text>
                    <View className={`flex-row items-center bg-white/15 rounded-xl border ${passwordFocused ? 'border-white/60' : 'border-white/25'} px-3`}>
                      <View className="shrink-0">
                        <Lock size={18} color="rgba(255,255,255,0.7)" />
                      </View>
                      <TextInput
                        className="text-white py-3 px-3 text-sm"
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
                          <EyeOff size={18} color="rgba(255,255,255,0.7)" /> :
                          <Eye size={18} color="rgba(255,255,255,0.7)" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="items-end mb-5">
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
                        <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>EMAIL OTP</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-xl border ${resetOtpFocused ? 'border-white/60' : 'border-white/25'} px-3`}>
                          <View className="shrink-0">
                            <KeyRound size={18} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-3 px-3 text-sm"
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
                        <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>NEW PASSWORD</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-xl border ${resetPasswordFocused ? 'border-white/60' : 'border-white/25'} px-3`}>
                          <View className="shrink-0">
                            <Lock size={18} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-3 px-3 text-sm"
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
                              <EyeOff size={18} color="rgba(255,255,255,0.7)" /> :
                              <Eye size={18} color="rgba(255,255,255,0.7)" />
                            }
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className='mb-5'>
                        <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>CONFIRM NEW PASSWORD</Text>
                        <View className={`flex-row items-center bg-white/15 rounded-xl border ${confirmResetPasswordFocused ? 'border-white/60' : 'border-white/25'} px-3`}>
                          <View className="shrink-0">
                            <Lock size={18} color="rgba(255,255,255,0.7)" />
                          </View>
                          <TextInput
                            className="text-white py-3 px-3 text-sm"
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
                              <EyeOff size={18} color="rgba(255,255,255,0.7)" /> :
                              <Eye size={18} color="rgba(255,255,255,0.7)" />
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}

              <TouchableOpacity 
                className='w-full rounded-xl overflow-hidden mb-5'
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
                  className='py-3 px-6'
                >
                  {requestingResetOtp || resettingPassword ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className='text-white text-center text-base font-bold tracking-wide'>
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
