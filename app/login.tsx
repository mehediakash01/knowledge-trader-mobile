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
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        className="flex-[0.5] pt-16 px-8"
      >
        <SafeAreaView className="flex-1 relative">
          <TouchableOpacity 
            className="absolute top-2 right-0 z-10"
            onPress={() => router.push('/welcome')}
          >
            <Text className="text-[#00C2E0] text-sm font-semibold tracking-wide">✕ Back</Text>
          </TouchableOpacity>
          
          <Text className="text-white text-5xl font-black tracking-tight leading-[56px] mt-12">
            Hello{'\n'}Log In!
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        className="flex-[0.6] bg-transparent absolute bottom-0 w-full"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} 
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View className="bg-white rounded-t-[40px] px-8 pt-12 pb-14 shadow-2xl min-h-[400px]">
            <View className="gap-8 mb-4">
              <TextInput
                className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View>
                <TextInput
                  className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                />
                <TouchableOpacity className="mt-4 self-end">
                  <Text className="text-slate-500 text-sm font-medium">Forgot password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              className={`bg-[#0D3A60] rounded-full py-4 items-center mt-10 shadow-lg shadow-slate-400 ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-lg tracking-wide">LOGIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
