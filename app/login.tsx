import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useLoginMutation } from '../redux/api/authApi';
import { setAuthTokens, setAuthUser } from '../services/auth.service';
import { showToast } from '../redux/features/ui/uiSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  // const [googleLogin] = useGoogleLoginMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      const response = await login({ email: email.trim(), password }).unwrap();
      await setAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      await setAuthUser(response.user);
      router.replace('/(tabs)');
      dispatch(showToast({ message: 'Welcome back!', type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Login failed', type: 'error' }));
    }
  };

  /*
  const handleForgotPassword = () => { ... }
  const handleSendPasswordRecovery = async (emailAddress: string) => { ... }
  const handleGoogleSignIn = async () => { ... }
  */

  return (
    <View className="flex-1 bg-[#0D3A60]">
      {/* Upper Gradient Canvas — 40% */}
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        style={{ flex: 0.4 }}
        className="px-8 justify-end pb-10"
      >
        <SafeAreaView className="relative">
          {/* Back button */}
          <TouchableOpacity
            className="absolute top-16 left-4 z-10"
            onPress={() => router.push('/welcome')}
            activeOpacity={0.7}
          >
            <Text className="text-[#00C2E0] text-xl font-bold tracking-wider">✕ Back</Text>
          </TouchableOpacity>

          <Text className="mt-32 ml-4  text-white text-4xl font-black tracking-tight leading-[58px] mt-8">
           Great to see you again!
          </Text>
          <Text className="text-white text-2xl ml-4 mt-2">Sign in to continue trading value, insights, and expertise.</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* White Card — 60%, keyboard-aware */}
      <KeyboardAvoidingView
        style={{ flex: 0.6 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 bg-white rounded-t-[45px] px-8 justify-center pb-12 shadow-2xl">

            {/* Email Field */}
            <View className="mb-7">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Email Address
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="you@email.com"
                placeholderTextColor="#CBD5E1"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Field with Eye Toggle */}
            <View className="mb-10">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium pr-12"
                  placeholder="••••••••"
                  placeholderTextColor="#CBD5E1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  className="absolute right-0 bottom-2"
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-slate-400 text-sm font-semibold">
                    {isPasswordVisible ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className={`bg-[#0D3A60] rounded-full py-4 items-center justify-center shadow-md ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base tracking-widest uppercase">
                  Login
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
