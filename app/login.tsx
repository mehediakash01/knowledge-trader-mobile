import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoginMutation } from '../redux/api/authApi';
import { setAuthTokens, setAuthUser } from '../services/auth.service';
import { showToast } from '../redux/features/ui/uiSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      const response = await login({ email, password }).unwrap();
      await setAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      await setAuthUser(response.user);
      router.replace('/(tabs)');
      dispatch(showToast({ message: 'Welcome back!', type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Login failed', type: 'error' }));
    }
  };

  return (
    <View className="flex-1 bg-[#0D3A60]">
      {/* Upper Gradient Canvas */}
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        style={{ flex: 0.4 }}
        className="pt-24 px-8 justify-end pb-10"
      >
        <SafeAreaView className="relative">
          {/* Back button */}
          <TouchableOpacity
            className="absolute top-12 left-4 z-10"
            onPress={() => router.push('/welcome')}
            activeOpacity={0.7}
          >
            <Text className="text-[#00C2E0] text-xl font-bold tracking-wider">✕ Back</Text>
          </TouchableOpacity>

          <Text className="mt-24 ml-4  text-white text-4xl font-black tracking-tight leading-[58px] mt-8">
           Great to see you again!
          </Text>
          <Text className="text-white text-2xl ml-4 mt-2">Sign in to continue trading value, insights, and expertise.</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* White Card — keyboard-aware */}
      <KeyboardAvoidingView
        style={{ flex: 0.6 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View className="flex-1 bg-white rounded-t-[45px] px-8 pt-12 pb-10 shadow-2xl">

            {/* Email field */}
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

            {/* Password field */}
            <View className="mb-2">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Password
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="••••••••"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Forgot password */}
            <TouchableOpacity className="self-end mt-3 mb-8" activeOpacity={0.7}>
              <Text className="text-[#00C2E0] text-sm font-semibold">Forgot password?</Text>
            </TouchableOpacity>

            {/* Login button */}
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

            {/* Divider */}
            <View className="flex-row items-center mt-8 mb-6 gap-3">
              <View className="flex-1 h-px bg-slate-100" />
              <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                or
              </Text>
              <View className="flex-1 h-px bg-slate-100" />
            </View>

            {/* Google button */}
            <TouchableOpacity
              className="flex-row items-center justify-center bg-white border border-slate-200 rounded-full py-4 px-6 shadow-sm gap-3"
              activeOpacity={0.85}
            >
              <View className="w-7 h-7 rounded-full bg-white items-center justify-center border border-slate-100">
                <Text className="text-base font-black" style={{ color: '#4285F4' }}>G</Text>
              </View>
              <Text className="text-slate-700 font-semibold text-base tracking-wide">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
