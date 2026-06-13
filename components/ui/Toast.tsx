import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { hideToast } from '../../redux/features/ui/uiSlice';

export default function Toast() {
  const dispatch = useDispatch();
  const { message, type, visible } = useSelector((state: RootState) => state.ui.toast);
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, dispatch, slideAnim, opacityAnim]);

  let borderColor = '#3b82f6'; // info default
  if (type === 'success') borderColor = '#4ade80';
  if (type === 'warning') borderColor = '#fbbf24';
  if (type === 'error') borderColor = '#ef4444';

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="none">
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
            borderLeftColor: borderColor,
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    minWidth: 200,
    maxWidth: '90%',
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
