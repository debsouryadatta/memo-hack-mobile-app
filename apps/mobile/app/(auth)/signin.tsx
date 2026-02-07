import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../../components/ContextProvider";

export default function SignInScreen() {
    const router = useRouter();
    const { signin, isLoading, isAuthenticated } = useApp();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)/home');
        }
    }, [isAuthenticated, router]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

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
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message || 'An error occurred during sign in');
        }
    }

  return (
    <KeyboardAvoidingView 
      className='flex-1' 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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
              source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750880675/projects/8848692-removebg-preview_c63mem.png' }}
              className='w-[250px] h-[250px]'
              resizeMode='contain'
            />
          </View>

          {/* Form Container */}
          <View className='w-full max-w-sm'>
            <View className='bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/20'>
              <Text className='text-4xl font-extrabold text-white text-center mb-2'>Welcome Back</Text>
              <Text className='text-base text-white/70 text-center mb-8'>Sign in to continue your learning journey</Text>

              {/* Email Field */}
              <View className='mb-6'>
                <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>EMAIL ADDRESS</Text>
                <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${emailFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                  <Mail size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    className='flex-1 text-white py-4 px-3 text-base'
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!isLoading}
                    selectionColor="white"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View className='mb-8'>
                <Text className='text-white/90 text-sm font-semibold mb-3 ml-1'>PASSWORD</Text>
                <View className={`flex-row items-center bg-white/15 rounded-2xl border-2 ${passwordFocused ? 'border-white/60' : 'border-white/25'} px-4`}>
                  <Lock size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    className='flex-1 text-white py-4 px-3 text-base'
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!isLoading}
                    selectionColor="white"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className='p-2'>
                    {showPassword ? 
                      <EyeOff size={20} color="rgba(255,255,255,0.7)" /> : 
                      <Eye size={20} color="rgba(255,255,255,0.7)" />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity 
                className='w-full rounded-2xl overflow-hidden mb-6 shadow-lg' 
                onPress={handleSignIn}
                disabled={isLoading}
                style={{ 
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className='py-4 px-6'
                >
                  <Text className='text-white text-center text-lg font-bold tracking-wide'>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View className='flex-row justify-center items-center'>
                <Text className='text-white/70 text-sm'>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity disabled={isLoading} className='px-2 py-1'>
                    <Text className='text-white font-bold text-sm'>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
