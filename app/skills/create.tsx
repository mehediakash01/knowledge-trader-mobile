import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateSkillPostMutation, type ICreateSkillPostPayload } from '../../redux/api/feedApi';
import { useGenerateSyllabusMutation, type ISyllabusModule } from '../../redux/api/aiApi';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

type RoadmapType = 'HOURLY' | 'DAILY' | 'SEVEN_DAY' | 'THIRTY_DAY';
type VaultType = 'TEXT' | 'VIDEO' | 'PDF' | 'CODE';

interface FormData {
  title: string;
  category: string;
  tokenPrice: string;
  tags: string; 
  shortDescription: string;
  valueProp: string;
  roadmapType: RoadmapType;
  targetAudience: string;
  prerequisites: string;
  outcomes: string; 
  syllabus: ISyllabusModule[];
  vaultContentType: VaultType;
  longDescription: string;
  vaultVideo: string;
  vaultPdf: string;
  vaultCodeLink: string;
  vaultCodeDescription: string;
  resourceLinks: string; 
  teaserImage: any;
  vaultFile: any;
}

const DEFAULT: FormData = {
  title: '',
  category: '',
  tokenPrice: '0',
  tags: '',
  shortDescription: '',
  valueProp: '',
  roadmapType: 'SEVEN_DAY',
  targetAudience: '',
  prerequisites: '',
  outcomes: '',
  syllabus: [],
  vaultContentType: 'TEXT',
  longDescription: '',
  vaultVideo: '',
  vaultPdf: '',
  vaultCodeLink: '',
  vaultCodeDescription: '',
  resourceLinks: '',
  teaserImage: null,
  vaultFile: null,
};

const STEPS = [
  { label: 'Identity', sub: 'Title, category & price' },
  { label: 'Hook', sub: 'Teaser & value prop' },
  { label: 'Roadmap', sub: 'Audience & structure' },
  { label: 'Vault', sub: 'Core content' },
];

const ROADMAP_OPTIONS: { value: RoadmapType; label: string }[] = [
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'SEVEN_DAY', label: '7-Day' },
  { value: 'THIRTY_DAY', label: '30-Day' },
];

const VAULT_OPTIONS: { value: VaultType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PDF', label: 'PDF' },
  { value: 'CODE', label: 'Code' },
];

function validateStep(step: number, form: FormData): string | null {
  if (step === 0) {
    if (!form.title.trim() || form.title.trim().length < 10 || form.title.trim().length > 100)
      return 'Title must be between 10 and 100 characters.';
    if (!form.category.trim()) return 'Category is required.';
    const price = parseInt(form.tokenPrice, 10);
    if (isNaN(price) || price < 0) return 'Tokens must be a valid positive integer (>= 0).';
    if (!form.tags.trim()) return 'At least 1 category tag must be explicitly chosen.';
  }
  if (step === 1) {
    if (!form.shortDescription.trim() || form.shortDescription.trim().length < 30 || form.shortDescription.trim().length > 2000)
      return 'Description must be between 30 and 2000 characters.';
  }
  if (step === 2) {
    if (!form.targetAudience.trim()) return 'Target audience is required.';
    if (!form.syllabus || form.syllabus.length === 0)
      return 'Generate or add at least one syllabus module.';
  }
  if (step === 3) {
    if (form.vaultContentType === 'TEXT' && form.longDescription.trim().length < 200)
      return 'Text content must be at least 200 characters.';
    if (form.vaultContentType === 'VIDEO' && !form.vaultVideo.trim() && !form.vaultFile)
      return 'Video URL or file attachment is required.';
    if (form.vaultContentType === 'PDF' && !form.vaultPdf.trim() && !form.vaultFile)
      return 'PDF URL or file attachment is required.';
    if (form.vaultContentType === 'CODE') {
      if (!form.vaultCodeLink.startsWith('http'))
        return 'Provide a valid repo link starting with http.';
      if (form.vaultCodeDescription.trim().length < 100)
        return 'Code documentation must be at least 100 characters.';
    }
  }
  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function CreateSkillScreen() {
  const router = useRouter();
  const [createSkillPost, { isLoading: isSubmitting }] = useCreateSkillPostMutation();
  const [generateSyllabus, { isLoading: isGenerating }] = useGenerateSyllabusMutation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  const [pulseIndex, setPulseIndex] = useState(0);
  const PULSE_TEXTS = ['Mapping structure...', 'Formulating learning outcomes...', 'Synthesizing modules...', 'Finalizing syllabus...'];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setPulseIndex((prev) => (prev + 1) % PULSE_TEXTS.length), 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const set = (key: keyof FormData) => (val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (result.assets[0].fileSize && result.assets[0].fileSize > 10 * 1024 * 1024) {
        setError('Maximum file size is 10MB.');
        return;
      }
      setForm(p => ({...p, teaserImage: result.assets[0]}));
      setError(null);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'audio/mpeg', 'audio/wav', 'audio/m4a'],
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      if (result.assets[0].size && result.assets[0].size > 10 * 1024 * 1024) {
        setError('Maximum file size is 10MB.');
        return;
      }
      setForm(p => ({...p, vaultFile: result.assets[0]}));
      setError(null);
    }
  };

  const updateModule = (index: number, key: keyof ISyllabusModule, value: any) => {
    setForm((prev) => {
      const nextSyllabus = [...prev.syllabus];
      nextSyllabus[index] = { ...nextSyllabus[index], [key]: value };
      return { ...prev, syllabus: nextSyllabus };
    });
  };

  const removeModule = (index: number) => {
    setForm((prev) => {
      const nextSyllabus = prev.syllabus.filter((_, i) => i !== index);
      const updated = nextSyllabus.map((mod, i) => ({ ...mod, moduleNumber: i + 1 }));
      return { ...prev, syllabus: updated };
    });
  };

  const addModule = () => {
    setForm((prev) => ({
      ...prev,
      syllabus: [...prev.syllabus, { moduleNumber: prev.syllabus.length + 1, title: '', description: '', topics: [], estimatedTime: '' }],
    }));
  };

  const handleGenerateSyllabus = async () => {
    if (!form.title.trim() || form.title.length < 10) {
      setError('A title with at least 10 chars is required first.');
      return;
    }
    setError(null);
    try {
      const result = await generateSyllabus({
        title: form.title,
        roadmapType: form.roadmapType,
        category: form.category || undefined,
        shortDescription: form.shortDescription || undefined,
      }).unwrap();

      setForm((prev) => ({
        ...prev,
        syllabus: result.syllabus || [],
        outcomes: result.outcomes ? result.outcomes.join('\n') : prev.outcomes,
        targetAudience: result.targetAudience || prev.targetAudience,
        valueProp: result.valueProp || prev.valueProp,
      }));
    } catch (err: any) {
      setError(err?.data?.message || 'AI generation failed.');
    }
  };

  const goNext = () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }

    const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const payload: ICreateSkillPostPayload = {
      title: form.title.trim(),
      slug,
      category: form.category.trim(),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      shortDescription: form.shortDescription.trim(),
      valueProp: form.valueProp.trim(),
      teaserAsset: form.teaserImage?.uri || '',
      roadmapType: form.roadmapType,
      outcomes: form.outcomes ? form.outcomes.split('\n').map((o) => o.trim()).filter(Boolean) : [],
      targetAudience: form.targetAudience.trim(),
      prerequisites: form.prerequisites.trim(),
      tokenPrice: parseInt(form.tokenPrice, 10),
      longDescription: form.longDescription.trim(),
      syllabus: form.syllabus,
      resourceLinks: form.resourceLinks ? form.resourceLinks.split('\n').map((r) => r.trim()).filter(Boolean) : [],
      lockedContent: {
        vaultContentType: form.vaultContentType,
        longDescription: form.longDescription.trim(),
        vaultVideo: form.vaultVideo.trim() || (form.vaultContentType === 'VIDEO' ? form.vaultFile?.uri : ''),
        vaultPdf: form.vaultPdf.trim() || (form.vaultContentType === 'PDF' ? form.vaultFile?.uri : ''),
        vaultCodeLink: form.vaultCodeLink.trim(),
        vaultCodeDescription: form.vaultCodeDescription.trim(),
        resourceLinks: form.resourceLinks ? form.resourceLinks.split('\n').map((r) => r.trim()).filter(Boolean) : [],
      },
    };

    try {
      await createSkillPost(payload).unwrap();
      Alert.alert('Published!', 'Your skill post is now live.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/' as any) },
      ]);
    } catch (e: unknown) {
      setError('Failed to publish. Please try again.');
    }
  };

  const renderStep0 = () => (
    <>
      <Field label="Title * (10 - 100 chars)">
        <TextInput style={styles.input} value={form.title} onChangeText={set('title')} placeholder="e.g. Mastering System Design" placeholderTextColor="#9CA3AF" />
      </Field>
      <Field label="Category *">
        <TextInput style={styles.input} value={form.category} onChangeText={set('category')} placeholder="e.g. Engineering" placeholderTextColor="#9CA3AF" />
      </Field>
      <Field label="Token Price (KT) * (>= 0)">
        <TextInput style={styles.input} value={form.tokenPrice} onChangeText={set('tokenPrice')} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" />
      </Field>
      <Field label="Tags (comma-separated) *">
        <TextInput style={styles.input} value={form.tags} onChangeText={set('tags')} placeholder="react, typescript, frontend" placeholderTextColor="#9CA3AF" />
      </Field>
    </>
  );

  const renderStep1 = () => (
    <>
      <Field label="Short Description * (30–2000 chars)">
        <TextInput style={[styles.input, styles.multiline]} value={form.shortDescription} onChangeText={set('shortDescription')} placeholder="A concise pitch..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} maxLength={2000} />
      </Field>
      <Field label="Value Proposition">
        <TextInput style={[styles.input, styles.multiline]} value={form.valueProp} onChangeText={set('valueProp')} placeholder="Why is this valuable?" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
      </Field>
      <Field label="Teaser Image (Optional)">
        {form.teaserImage ? (
          <View style={styles.attachmentRow}>
            <Text style={styles.attachmentText} numberOfLines={1}>{form.teaserImage.name || 'Image attached'}</Text>
            <TouchableOpacity onPress={() => setForm(p => ({...p, teaserImage: null}))}><Text style={styles.removeText}>Remove File</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={styles.uploadBtnText}>Upload Image</Text>
          </TouchableOpacity>
        )}
      </Field>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.aiBox}>
        <View style={styles.aiBoxHeader}>
          <Text style={styles.aiBoxTitle}>AI Architect</Text>
          <Text style={styles.aiBoxDesc}>Generate syllabus and target audience.</Text>
        </View>
        {isGenerating ? (
          <View style={styles.aiGeneratingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.aiGeneratingText}>{PULSE_TEXTS[pulseIndex]}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.aiBtn} onPress={handleGenerateSyllabus} activeOpacity={0.8}>
            <Text style={styles.aiBtnText}>✦ Generate Syllabus</Text>
          </TouchableOpacity>
        )}
      </View>

      <Field label="Roadmap Duration">
        <View style={styles.chipRow}>
          {ROADMAP_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.roadmapType === opt.value && styles.chipActive]} onPress={() => set('roadmapType')(opt.value)}>
              <Text style={[styles.chipText, form.roadmapType === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <View style={styles.syllabusHeaderRow}>
        <Text style={styles.label}>Syllabus Modules ({form.syllabus.length})</Text>
        <TouchableOpacity style={styles.addModuleBtn} onPress={addModule}><Text style={styles.addModuleBtnText}>+ Add</Text></TouchableOpacity>
      </View>

      {form.syllabus.map((mod, idx) => (
        <View key={idx} style={styles.moduleCard}>
          <View style={styles.moduleCardHeader}>
            <Text style={styles.moduleBadge}>{mod.moduleNumber}</Text>
            <TextInput style={styles.moduleTitleInput} value={mod.title} onChangeText={(val) => updateModule(idx, 'title', val)} placeholder={`Module ${idx + 1} Title`} placeholderTextColor="#9CA3AF" />
            <TouchableOpacity onPress={() => removeModule(idx)}><Text style={styles.removeModuleBtnText}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={[styles.input, styles.multiline]} value={mod.description} onChangeText={(val) => updateModule(idx, 'description', val)} placeholder="Description..." placeholderTextColor="#9CA3AF" multiline numberOfLines={2} />
        </View>
      ))}

      <Field label="Target Audience *">
        <TextInput style={[styles.input, styles.multiline]} value={form.targetAudience} onChangeText={set('targetAudience')} placeholder="Who is this for?" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
      </Field>
      <Field label="Prerequisites">
        <TextInput style={[styles.input, styles.multiline]} value={form.prerequisites} onChangeText={set('prerequisites')} placeholder="Required knowledge?" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
      </Field>
      <Field label="Learning Outcomes (one per line)">
        <TextInput style={[styles.input, styles.multiline]} value={form.outcomes} onChangeText={set('outcomes')} placeholder="Outcome 1\nOutcome 2" placeholderTextColor="#9CA3AF" multiline numberOfLines={4} />
      </Field>
    </>
  );

  const renderStep3 = () => (
    <>
      <Field label="Vault Content Type">
        <View style={styles.chipRow}>
          {VAULT_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[styles.chip, form.vaultContentType === opt.value && styles.chipActive]} onPress={() => set('vaultContentType')(opt.value)}>
              <Text style={[styles.chipText, form.vaultContentType === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      {form.vaultContentType === 'TEXT' && (
        <Field label="Content (min 200 chars)">
          <TextInput style={[styles.input, styles.multiline]} value={form.longDescription} onChangeText={set('longDescription')} placeholder="Your full guide..." placeholderTextColor="#9CA3AF" multiline numberOfLines={8} />
        </Field>
      )}

      {(form.vaultContentType === 'VIDEO' || form.vaultContentType === 'PDF') && (
        <Field label={`${form.vaultContentType} Upload / Link *`}>
          {form.vaultFile ? (
            <View style={styles.attachmentRow}>
              <Text style={styles.attachmentText} numberOfLines={1}>{form.vaultFile.name || 'File attached'}</Text>
              <TouchableOpacity onPress={() => setForm(p => ({...p, vaultFile: null}))}><Text style={styles.removeText}>Remove File</Text></TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                <Text style={styles.uploadBtnText}>Upload File</Text>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', color: '#6B7280' }}>OR</Text>
              <TextInput style={styles.input} value={form.vaultContentType === 'VIDEO' ? form.vaultVideo : form.vaultPdf} onChangeText={set(form.vaultContentType === 'VIDEO' ? 'vaultVideo' : 'vaultPdf')} placeholder="https://.../link" placeholderTextColor="#9CA3AF" keyboardType="url" />
            </View>
          )}
        </Field>
      )}

      {form.vaultContentType === 'CODE' && (
        <>
          <Field label="Repository Link *">
            <TextInput style={styles.input} value={form.vaultCodeLink} onChangeText={set('vaultCodeLink')} placeholder="https://github.com/..." placeholderTextColor="#9CA3AF" keyboardType="url" />
          </Field>
          <Field label="Code Documentation (min 100 chars) *">
            <TextInput style={[styles.input, styles.multiline]} value={form.vaultCodeDescription} onChangeText={set('vaultCodeDescription')} placeholder="Architecture, how to run..." placeholderTextColor="#9CA3AF" multiline numberOfLines={6} />
          </Field>
        </>
      )}
    </>
  );

  const PANELS = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Skill</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={s.label} style={styles.stepItem}>
            <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === step && styles.stepDotTextActive]}>{i < step ? '✓' : i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]} numberOfLines={1}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {PANELS[step]()}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnSecondary, step === 0 && styles.navBtnDisabled]} onPress={goPrev} disabled={step === 0}>
          <Text style={styles.navBtnSecondaryText}>← Back</Text>
        </TouchableOpacity>
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.navBtn} onPress={goNext}><Text style={styles.navBtnText}>Continue →</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, isSubmitting && styles.navBtnDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.navBtnText}>✦ Publish</Text>}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 60 },
  backText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
  stepBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  stepDotDone: { backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: '#2563EB' },
  stepDotActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  stepDotText: { color: '#4B5563', fontSize: 12, fontWeight: 'bold' },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, color: '#6B7280' },
  stepLabelActive: { color: '#2563EB', fontWeight: 'bold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, color: '#111827', fontSize: 15 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  errorBox: { backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' },
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  navRow: { flexDirection: 'row', padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  navBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  navBtnSecondary: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  navBtnSecondaryText: { color: '#111827', fontSize: 16, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20 },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  aiBox: { backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.2)', marginBottom: 20 },
  aiBoxHeader: { marginBottom: 12 },
  aiBoxTitle: { color: '#2563EB', fontSize: 16, fontWeight: 'bold' },
  aiBoxDesc: { color: '#4B5563', fontSize: 14, marginTop: 4 },
  aiBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  aiBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  aiGeneratingBox: { alignItems: 'center', padding: 12 },
  aiGeneratingText: { color: '#2563EB', marginTop: 8, fontWeight: '600' },
  syllabusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addModuleBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },
  addModuleBtnText: { color: '#2563EB', fontWeight: 'bold' },
  moduleCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  moduleCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  moduleBadge: { color: '#4B5563', fontWeight: 'bold', fontSize: 16, width: 24 },
  moduleTitleInput: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111827', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 4 },
  removeModuleBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', padding: 8 },
  uploadBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center' },
  uploadBtnText: { color: '#2563EB', fontWeight: 'bold' },
  attachmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', padding: 16, borderRadius: 12 },
  attachmentText: { flex: 1, color: '#111827', fontWeight: '500' },
  removeText: { color: '#DC2626', fontWeight: 'bold', marginLeft: 12 },
});
