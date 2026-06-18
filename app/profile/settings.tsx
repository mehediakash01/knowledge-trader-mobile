import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserProfileQuery, useUpdateMyProfileMutation } from '../../redux/api/userApi';
import { showToast } from '../../redux/features/ui/uiSlice';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  
  const { data: profile, isLoading: isLoadingProfile } = useGetUserProfileQuery(user?.id, { skip: !user?.id });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();

  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [displayImageUri, setDisplayImageUri] = useState<string | null>(null);
  
  const [expertiseTags, setExpertiseTags] = useState<{name: string; level: string}[]>([]);
  const [learningTags, setLearningTags] = useState<{name: string; priority: number}[]>([]);
  
  const [newExpTag, setNewExpTag] = useState('');
  const [newLearnTag, setNewLearnTag] = useState('');

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setTagline(profile.tagline || '');
      setExpertiseTags(profile.expertise || []);
      setLearningTags(profile.learningPath || []);
      if (profile.image) setDisplayImageUri(profile.image);
    }
  }, [profile]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setDisplayImageUri(result.assets[0].uri);
      setProfileImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleAddExpertise = () => {
    if (newExpTag.trim() && !expertiseTags.find(t => t.name.toLowerCase() === newExpTag.trim().toLowerCase())) {
      setExpertiseTags([...expertiseTags, { name: newExpTag.trim(), level: 'Intermediate' as any }]);
      setNewExpTag('');
    }
  };

  const handleRemoveExpertise = (tagName: string) => {
    setExpertiseTags(expertiseTags.filter(t => t.name !== tagName));
  };

  const handleAddLearning = () => {
    if (newLearnTag.trim() && !learningTags.find(t => t.name.toLowerCase() === newLearnTag.trim().toLowerCase())) {
      setLearningTags([...learningTags, { name: newLearnTag.trim(), priority: 1 }]);
      setNewLearnTag('');
    }
  };

  const handleRemoveLearning = (tagName: string) => {
    setLearningTags(learningTags.filter(t => t.name !== tagName));
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        bio,
        tagline,
        expertise: expertiseTags as any,
        learningPath: learningTags
      };
      if (profileImageBase64) {
        payload.image = profileImageBase64;
      }
      await updateProfile(payload).unwrap();
      dispatch(showToast({ message: 'Profile updated successfully!', type: 'success' }));
      router.back();
    } catch (e) {
      dispatch(showToast({ message: 'Failed to update profile.', type: 'error' }));
    }
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageUploadSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarUpload}>
            {displayImageUri ? (
              <Image source={{ uri: displayImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>+</Text>
              </View>
            )}
            <Text style={styles.uploadText}>Change Avatar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tagline</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Fullstack Developer & Designer"
            placeholderTextColor="#9CA3AF"
            value={tagline}
            onChangeText={setTagline}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#9CA3AF"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise Matrix</Text>
          <Text style={styles.subText}>Skills you can offer</Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add skill..."
              placeholderTextColor="#9CA3AF"
              value={newExpTag}
              onChangeText={setNewExpTag}
              onSubmitEditing={handleAddExpertise}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={handleAddExpertise}>
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {expertiseTags.map((tag, i) => (
              <View key={i} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveExpertise(tag.name)}>
                  <Text style={styles.tagRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subText}>Learning Path (Skills wanted)</Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add skill..."
              placeholderTextColor="#9CA3AF"
              value={newLearnTag}
              onChangeText={setNewLearnTag}
              onSubmitEditing={handleAddLearning}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={handleAddLearning}>
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {learningTags.map((tag, i) => (
              <View key={i} style={[styles.tagBadge, styles.learningTagBadge]}>
                <Text style={[styles.tagBadgeText, styles.learningTagText]}>{tag.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveLearning(tag.name)}>
                  <Text style={[styles.tagRemoveText, styles.learningTagText]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, isUpdating && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  cancelText: { color: '#4B5563', fontSize: 16 },
  imageUploadSection: { alignItems: 'center', marginBottom: 24 },
  avatarUpload: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#E5E7EB' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#6B7280', fontSize: 28, fontWeight: 'bold' },
  uploadText: { color: '#2563EB', marginTop: 8, fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subText: { color: '#4B5563', fontSize: 14, marginBottom: 12 },
  label: { color: '#111827', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    color: '#111827',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    color: '#111827',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  tagInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addTagBtn: {
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addTagBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagBadgeText: { color: '#2563EB', fontSize: 13, fontWeight: 'bold' },
  tagRemoveText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  learningTagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  learningTagText: { color: '#10B981' },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
