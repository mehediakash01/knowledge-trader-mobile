import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useGoogleLoginMutation } from '../redux/api/authApi';
import { setAuthTokens, setAuthUser } from '../services/auth.service';
import { showToast } from '../redux/features/ui/uiSlice';

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleLogin] = useGoogleLoginMutation();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token returned.');
      }

      const backendResponse = await googleLogin({ token: idToken }).unwrap();
      await setAuthTokens({
        accessToken: backendResponse.accessToken,
        refreshToken: backendResponse.refreshToken,
      });
      await setAuthUser(backendResponse.user);
      router.replace('/(tabs)');
      dispatch(showToast({ message: 'Google Sign-In successful!', type: 'success' }));
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== '12501') {
        dispatch(
          showToast({
            message: error?.data?.message || error.message || 'Google Sign-In failed',
            type: 'error',
          })
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Upper Gradient Canvas — 40% */}
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        style={{ flex: 0.4 }}
        className="px-8 justify-end pb-10"
      >
        <SafeAreaView>
          <Text className="text-white text-5xl font-black tracking-tight leading-[58px] ml-4 mt-24">
            Trade Knowledge,{'\n'}Build Value.
          </Text>
          <Text className="text-white ml-4 mt-4 text-l font-medium tracking-wide">
            Join a network of global minds bartering expertise and leveling up their skills in real-time.
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Sliding White Card — 60% */}
      <View
        style={{ flex: 0.6 }}
        className="bg-white rounded-t-[45px] px-8 pt-12 pb-10 shadow-2xl"
      >
        {/* Primary Buttons */}
        <View className="gap-4">
          <TouchableOpacity
            className="bg-[#0D3A60] rounded-full py-4 items-center justify-center shadow-md"
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base tracking-widest uppercase">
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-transparent border border-[#0D3A60] rounded-full py-4 items-center justify-center"
            onPress={() => router.push('/signup')}
            activeOpacity={0.85}
          >
            <Text className="text-[#0D3A60] font-bold text-base tracking-widest uppercase">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* OR Divider */}
        {/*<View className="flex-row items-center mt-8 mb-6 gap-3">
          <View className="flex-1 h-px bg-slate-100" />
          <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">or</Text>
          <View className="flex-1 h-px bg-slate-100" />
        </View>*/}

        {/* Google Button */}
        {/*  <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-slate-200 rounded-full py-4 px-6 shadow-sm gap-3"
          onPress={handleGoogleSignIn}
          activeOpacity={0.85}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <View className="w-7 h-7 rounded-full bg-white items-center justify-center border border-slate-100">
                <Text className="text-base font-black" style={{ color: '#4285F4' }}>G</Text>
              </View>
              <Text className="text-slate-700 font-semibold text-base tracking-wide">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>*/}
      </View>
    </View>
  );
}
