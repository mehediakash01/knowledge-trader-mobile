import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserProfileQuery, useUpdateMyProfileMutation } from '../../redux/api/userApi';
import { showToast } from '../../redux/features/ui/uiSlice';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  
  const { data: profile, isLoading: isLoadingProfile } = useGetUserProfileQuery(user?.id, { skip: !user?.id });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();

  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  
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
    }
  }, [profile]);

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
      await updateProfile({
        bio,
        tagline,
        expertise: expertiseTags as any,
        learningPath: learningTags
      }).unwrap();
      dispatch(showToast({ message: 'Profile updated successfully!', type: 'success' }));
      router.back();
    } catch (e) {
      dispatch(showToast({ message: 'Failed to update profile.', type: 'error' }));
    }
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ade80" size="large" />
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

        <View style={styles.section}>
          <Text style={styles.label}>Tagline</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Fullstack Developer & Designer"
            placeholderTextColor="#888"
            value={tagline}
            onChangeText={setTagline}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#888"
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
              placeholderTextColor="#888"
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
              placeholderTextColor="#888"
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
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  content: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cancelText: { color: '#a0a0a0', fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subText: { color: '#888', fontSize: 14, marginBottom: 12 },
  label: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 100,
  },
  tagInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tagInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  addTagBtn: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addTagBtnText: { color: '#fff', fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagBadgeText: { color: '#4ade80', fontSize: 13, fontWeight: 'bold' },
  tagRemoveText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold' },
  learningTagBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  learningTagText: { color: '#0ea5e9' },
  button: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
