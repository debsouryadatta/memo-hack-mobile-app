import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, GraduationCap, ImageIcon, Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../components/ContextProvider';

export default function SignUpScreen() {
    const router = useRouter();
    const { signup, isLoading, isAuthenticated } = useApp();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)/home');
        }
    }, [isAuthenticated, router]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        className: '',
        image: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSignUp = async () => {
        const { email, password, confirmPassword, name, phone, className } = formData;

        if (!email.trim() || !password.trim() || !name.trim() || !phone.trim() || !className.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        try {
            await signup(
                email.trim().toLowerCase(), 
                password, 
                name.trim(), 
                phone.trim(), 
                className.trim(),
                formData.image.trim() || undefined
            );
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
        }
    };

    return (
        <KeyboardAvoidingView 
            className='flex-1' 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                    <View className="w-full items-center mb-6">
                        <Image
                            source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750880675/projects/8848692-removebg-preview_c63mem.png' }}
                            className='w-[200px] h-[200px]'
                            resizeMode='contain'
                        />
                    </View>

                    {/* Form Container */}
                    <View className='w-full max-w-sm'>
                        <View className='bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/20'>
                            <Text className='text-3xl font-extrabold text-white text-center mb-2'>Join MemoHack</Text>
                            <Text className='text-sm text-white/70 text-center mb-6'>Create your account to start learning</Text>

                            {/* Full Name Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>FULL NAME *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'name' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <User size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Enter your full name"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={formData.name}
                                        onChangeText={(value) => handleInputChange('name', value)}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                </View>
                            </View>

                            {/* Email Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>EMAIL ADDRESS *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'email' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <Mail size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Enter your email"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={formData.email}
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                </View>
                            </View>

                            {/* Phone Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>PHONE NUMBER *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'phone' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <Phone size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Enter your phone number"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(value) => handleInputChange('phone', value)}
                                        onFocus={() => setFocusedField('phone')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                </View>
                            </View>

                            {/* Class Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>CLASS *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'className' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <GraduationCap size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="e.g., 12th, Class XI, etc."
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={formData.className}
                                        onChangeText={(value) => handleInputChange('className', value)}
                                        onFocus={() => setFocusedField('className')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                </View>
                            </View>

                            {/* Password Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>PASSWORD *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'password' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <Lock size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Create password (min. 6 chars)"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        secureTextEntry={!showPassword}
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className='p-1'>
                                        {showPassword ? 
                                            <EyeOff size={18} color="rgba(255,255,255,0.7)" /> : 
                                            <Eye size={18} color="rgba(255,255,255,0.7)" />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password Field */}
                            <View className='mb-4'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>CONFIRM PASSWORD *</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'confirmPassword' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <Lock size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Confirm your password"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        secureTextEntry={!showConfirmPassword}
                                        value={formData.confirmPassword}
                                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className='p-1'>
                                        {showConfirmPassword ? 
                                            <EyeOff size={18} color="rgba(255,255,255,0.7)" /> : 
                                            <Eye size={18} color="rgba(255,255,255,0.7)" />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Profile Image Field */}
                            <View className='mb-6'>
                                <Text className='text-white/90 text-xs font-semibold mb-2 ml-1'>PROFILE IMAGE (OPTIONAL)</Text>
                                <View className={`flex-row items-center bg-white/15 rounded-xl border-2 ${focusedField === 'image' ? 'border-white/60' : 'border-white/25'} px-3`}>
                                    <ImageIcon size={18} color="rgba(255,255,255,0.7)" />
                                    <TextInput
                                        className='flex-1 text-white py-3 px-3 text-sm'
                                        placeholder="Image URL (optional)"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={formData.image}
                                        onChangeText={(value) => handleInputChange('image', value)}
                                        onFocus={() => setFocusedField('image')}
                                        onBlur={() => setFocusedField(null)}
                                        editable={!isLoading}
                                        selectionColor="white"
                                    />
                                </View>
                            </View>

                            {/* Sign Up Button */}
                            <TouchableOpacity 
                                className='w-full rounded-xl overflow-hidden mb-4 shadow-lg' 
                                onPress={handleSignUp}
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
                                    className='py-3 px-6'
                                >
                                    <Text className='text-white text-center text-base font-bold tracking-wide'>
                                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Sign In Link */}
                            <View className='flex-row justify-center items-center'>
                                <Text className='text-white/70 text-xs'>Already have an account? </Text>
                                <Link href="/(auth)/signin" asChild>
                                    <TouchableOpacity disabled={isLoading} className='px-2 py-1'>
                                        <Text className='text-white font-bold text-xs'>Sign In</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}