import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateSkillPostMutation, type ICreateSkillPostPayload } from '../../redux/api/feedApi';
import { useGenerateSyllabusMutation, type ISyllabusModule } from '../../redux/api/aiApi';

// ── Types ────────────────────────────────────────────────────────────────────

type RoadmapType = 'HOURLY' | 'DAILY' | 'SEVEN_DAY' | 'THIRTY_DAY';
type VaultType = 'TEXT' | 'VIDEO' | 'PDF' | 'CODE';

interface FormData {
  // Step 1 – Identity
  title: string;
  category: string;
  tokenPrice: string;
  tags: string; // comma-separated
  // Step 2 – Hook
  shortDescription: string;
  valueProp: string;
  teaserAsset: string;
  // Step 3 – Roadmap
  roadmapType: RoadmapType;
  targetAudience: string;
  prerequisites: string;
  outcomes: string; // newline-separated
  syllabus: ISyllabusModule[];
  // Step 4 – Vault
  vaultContentType: VaultType;
  longDescription: string;
  vaultVideo: string;
  vaultPdf: string;
  vaultCodeLink: string;
  vaultCodeDescription: string;
  resourceLinks: string; // newline-separated
}

const DEFAULT: FormData = {
  title: '',
  category: '',
  tokenPrice: '5',
  tags: '',
  shortDescription: '',
  valueProp: '',
  teaserAsset: '',
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

// ── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, form: FormData): string | null {
  if (step === 0) {
    if (!form.title.trim() || form.title.trim().length < 3)
      return 'Title must be at least 3 characters.';
    if (!form.category.trim()) return 'Category is required.';
    const price = parseFloat(form.tokenPrice);
    if (isNaN(price) || price < 1) return 'Token price must be at least 1.';
  }
  if (step === 1) {
    if (!form.shortDescription.trim() || form.shortDescription.trim().length < 20)
      return 'Short description must be at least 20 characters.';
    if (!form.teaserAsset.trim()) return 'Teaser asset URL is required.';
  }
  if (step === 2) {
    if (!form.targetAudience.trim()) return 'Target audience is required.';
    if (!form.syllabus || form.syllabus.length === 0)
      return 'Generate or add at least one syllabus module.';
  }
  if (step === 3) {
    if (form.vaultContentType === 'TEXT' && form.longDescription.trim().length < 200)
      return 'Text content must be at least 200 characters.';
    if (form.vaultContentType === 'VIDEO' && !form.vaultVideo.trim())
      return 'Video URL is required.';
    if (form.vaultContentType === 'PDF' && !form.vaultPdf.trim())
      return 'PDF URL is required.';
    if (form.vaultContentType === 'CODE') {
      if (!form.vaultCodeLink.startsWith('http'))
        return 'Provide a valid repo link starting with http.';
      if (form.vaultCodeDescription.trim().length < 100)
        return 'Code documentation must be at least 100 characters.';
    }
  }
  return null;
}

// ── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateSkillScreen() {
  const router = useRouter();
  const [createSkillPost, { isLoading: isSubmitting }] = useCreateSkillPostMutation();
  const [generateSyllabus, { isLoading: isGenerating }] = useGenerateSyllabusMutation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  // Pulse texts for generation loading state
  const [pulseIndex, setPulseIndex] = useState(0);
  const PULSE_TEXTS = [
    'Mapping structure...',
    'Formulating learning outcomes...',
    'Synthesizing modules...',
    'Finalizing syllabus...',
  ];

  React.useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % PULSE_TEXTS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const set = (key: keyof FormData) => (val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError(null);
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
      syllabus: [
        ...prev.syllabus,
        {
          moduleNumber: prev.syllabus.length + 1,
          title: '',
          description: '',
          topics: [],
          estimatedTime: '',
        },
      ],
    }));
  };

  const handleGenerateSyllabus = async () => {
    if (!form.title.trim()) {
      setError('Title is required first (Step 1).');
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
      setError(err?.data?.message || 'AI generation failed. Please try again.');
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
      teaserAsset: form.teaserAsset.trim(),
      roadmapType: form.roadmapType,
      outcomes: form.outcomes ? form.outcomes.split('\n').map((o) => o.trim()).filter(Boolean) : [],
      targetAudience: form.targetAudience.trim(),
      prerequisites: form.prerequisites.trim(),
      tokenPrice: parseFloat(form.tokenPrice),
      longDescription: form.longDescription.trim(),
      syllabus: form.syllabus,
      resourceLinks: form.resourceLinks
        ? form.resourceLinks.split('\n').map((r) => r.trim()).filter(Boolean)
        : [],
      lockedContent: {
        vaultContentType: form.vaultContentType,
        longDescription: form.longDescription.trim(),
        vaultVideo: form.vaultVideo.trim(),
        vaultPdf: form.vaultPdf.trim(),
        vaultCodeLink: form.vaultCodeLink.trim(),
        vaultCodeDescription: form.vaultCodeDescription.trim(),
        resourceLinks: form.resourceLinks
          ? form.resourceLinks.split('\n').map((r) => r.trim()).filter(Boolean)
          : [],
      },
    };

    try {
      await createSkillPost(payload).unwrap();
      Alert.alert('Published!', 'Your skill post is now live.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/assets' as any) },
      ]);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ??
        'Failed to publish. Please try again.';
      setError(msg);
    }
  };

  // ── Step panels ────────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <>
      <Field label="Title *">
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={set('title')}
          placeholder="e.g. Mastering System Design"
          placeholderTextColor="#555"
        />
      </Field>
      <Field label="Category *">
        <TextInput
          style={styles.input}
          value={form.category}
          onChangeText={set('category')}
          placeholder="e.g. Engineering, Design, Business"
          placeholderTextColor="#555"
        />
      </Field>
      <Field label="Token Price (KT) *">
        <TextInput
          style={styles.input}
          value={form.tokenPrice}
          onChangeText={set('tokenPrice')}
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor="#555"
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <TextInput
          style={styles.input}
          value={form.tags}
          onChangeText={set('tags')}
          placeholder="react, typescript, frontend"
          placeholderTextColor="#555"
        />
      </Field>
    </>
  );

  const renderStep1 = () => (
    <>
      <Field label="Short Description * (20–200 chars)">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.shortDescription}
          onChangeText={set('shortDescription')}
          placeholder="A concise pitch for your skill post…"
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.charCount}>{form.shortDescription.length}/200</Text>
      </Field>
      <Field label="Value Proposition">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.valueProp}
          onChangeText={set('valueProp')}
          placeholder="Why is this skill uniquely valuable?"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />
      </Field>
      <Field label="Teaser Asset URL *">
        <TextInput
          style={styles.input}
          value={form.teaserAsset}
          onChangeText={set('teaserAsset')}
          placeholder="https://…/teaser.mp4 or image URL"
          placeholderTextColor="#555"
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* AI Architect Box */}
      <View style={styles.aiBox}>
        <View style={styles.aiBoxHeader}>
          <Text style={styles.aiBoxSparkle}>✦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBoxTitle}>AI Architect</Text>
            <Text style={styles.aiBoxDesc}>
              Generate a full module-by-module syllabus, learning outcomes, and target audience instantly.
            </Text>
          </View>
        </View>

        {isGenerating ? (
          <View style={styles.aiGeneratingBox}>
            <ActivityIndicator size="small" color="#0ea5e9" />
            <Text style={styles.aiGeneratingText}>{PULSE_TEXTS[pulseIndex]}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={handleGenerateSyllabus}
            activeOpacity={0.8}
          >
            <Text style={styles.aiBtnText}>✦ Generate Syllabus</Text>
          </TouchableOpacity>
        )}
      </View>

      <Field label="Roadmap Duration">
        <View style={styles.chipRow}>
          {ROADMAP_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                form.roadmapType === opt.value && styles.chipActive,
              ]}
              onPress={() => set('roadmapType')(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.roadmapType === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      {/* Dynamic Syllabus Modules Editor */}
      <View style={styles.syllabusHeaderRow}>
        <Text style={styles.sectionLabel}>Syllabus Modules ({form.syllabus.length})</Text>
        <TouchableOpacity style={styles.addModuleBtn} onPress={addModule} activeOpacity={0.8}>
          <Text style={styles.addModuleBtnText}>+ Add Module</Text>
        </TouchableOpacity>
      </View>

      {form.syllabus.map((mod, idx) => (
        <View key={idx} style={styles.moduleCard}>
          <View style={styles.moduleCardHeader}>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>{mod.moduleNumber}</Text>
            </View>
            <TextInput
              style={styles.moduleTitleInput}
              value={mod.title}
              onChangeText={(val) => updateModule(idx, 'title', val)}
              placeholder={`Module ${idx + 1} Title`}
              placeholderTextColor="#555"
            />
            <TouchableOpacity style={styles.removeModuleBtn} onPress={() => removeModule(idx)}>
              <Text style={styles.removeModuleBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.multiline, styles.moduleInputSpacing]}
            value={mod.description}
            onChangeText={(val) => updateModule(idx, 'description', val)}
            placeholder="Describe what learners will master in this module..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={2}
          />

          <View style={styles.moduleParamsRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={mod.estimatedTime}
                onChangeText={(val) => updateModule(idx, 'estimatedTime', val)}
                placeholder="Time (e.g. 2 hours)"
                placeholderTextColor="#555"
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <TextInput
                style={styles.input}
                value={mod.topics ? mod.topics.join(', ') : ''}
                onChangeText={(val) =>
                  updateModule(idx, 'topics', val.split(',').map((t) => t.trim()).filter(Boolean))
                }
                placeholder="Topics (comma separated)"
                placeholderTextColor="#555"
              />
            </View>
          </View>
        </View>
      ))}

      <Field label="Target Audience *">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.targetAudience}
          onChangeText={set('targetAudience')}
          placeholder="Who should take this skill post?"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />
      </Field>
      <Field label="Prerequisites">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.prerequisites}
          onChangeText={set('prerequisites')}
          placeholder="What should learners already know?"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />
      </Field>
      <Field label="Learning Outcomes (one per line)">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.outcomes}
          onChangeText={set('outcomes')}
          placeholder={"Build a REST API\nWrite clean TypeScript\nDeploy to cloud"}
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
        />
      </Field>
    </>
  );

  const renderStep3 = () => (
    <>
      <Field label="Vault Content Type">
        <View style={styles.chipRow}>
          {VAULT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                form.vaultContentType === opt.value && styles.chipActive,
              ]}
              onPress={() => set('vaultContentType')(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.vaultContentType === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      {form.vaultContentType === 'TEXT' && (
        <Field label="Content (min 200 chars)">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.longDescription}
            onChangeText={set('longDescription')}
            placeholder="Your full knowledge strategy, guide, or deep-dive…"
            placeholderTextColor="#555"
            multiline
            numberOfLines={8}
          />
          <Text style={styles.charCount}>{form.longDescription.length} chars</Text>
        </Field>
      )}

      {form.vaultContentType === 'VIDEO' && (
        <Field label="Video URL *">
          <TextInput
            style={styles.input}
            value={form.vaultVideo}
            onChangeText={set('vaultVideo')}
            placeholder="https://…/video.mp4"
            placeholderTextColor="#555"
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>
      )}

      {form.vaultContentType === 'PDF' && (
        <Field label="PDF URL *">
          <TextInput
            style={styles.input}
            value={form.vaultPdf}
            onChangeText={set('vaultPdf')}
            placeholder="https://…/document.pdf"
            placeholderTextColor="#555"
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>
      )}

      {form.vaultContentType === 'CODE' && (
        <>
          <Field label="Repository Link *">
            <TextInput
              style={styles.input}
              value={form.vaultCodeLink}
              onChangeText={set('vaultCodeLink')}
              placeholder="https://github.com/user/repo"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="url"
            />
          </Field>
          <Field label="Code Documentation (min 100 chars) *">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.vaultCodeDescription}
              onChangeText={set('vaultCodeDescription')}
              placeholder="Describe what the code does, architecture, how to run…"
              placeholderTextColor="#555"
              multiline
              numberOfLines={6}
            />
            <Text style={styles.charCount}>{form.vaultCodeDescription.length} chars</Text>
          </Field>
        </>
      )}

      <Field label="Resource Links (one per line)">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.resourceLinks}
          onChangeText={set('resourceLinks')}
          placeholder={"https://docs.example.com\nhttps://github.com/…"}
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>
    </>
  );

  const PANELS = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Skill Post</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={s.label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                i < step && styles.stepDotDone,
                i === step && styles.stepDotActive,
              ]}
            >
              {i < step ? (
                <Text style={styles.stepDotText}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    i === step && styles.stepDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[styles.stepLabel, i === step && styles.stepLabelActive]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Step sub-title */}
      <View style={styles.stepSubRow}>
        <Text style={styles.stepCounter}>Step {step + 1} of {STEPS.length}</Text>
        <Text style={styles.stepSub}>{STEPS[step].sub}</Text>
      </View>

      {/* Form content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {PANELS[step]()}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnSecondary, step === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={step === 0}
        >
          <Text style={styles.navBtnSecondaryText}>← Back</Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.navBtn} onPress={goNext}>
            <Text style={styles.navBtnText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.publishBtn, isSubmitting && styles.navBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.navBtnText}>✦ Publish Skill</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Step indicator
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  stepDotActive: {
    backgroundColor: '#0d0d0d',
    borderColor: '#0ea5e9',
  },
  stepDotText: {
    color: '#555',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepDotTextActive: {
    color: '#0ea5e9',
  },
  stepLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#0ea5e9',
  },
  stepSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111',
  },
  stepCounter: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepSub: {
    color: '#555',
    fontSize: 12,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  // Fields
  field: {
    marginBottom: 20,
  },
  label: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    color: '#444',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  chipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  chipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  // Error
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    lineHeight: 20,
  },
  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#0d0d0d',
  },
  navBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  navBtnSecondary: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  navBtnSecondaryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 28,
  },
  // AI Architect Box
  aiBox: {
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    borderColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  aiBoxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  aiBoxSparkle: {
    fontSize: 20,
    color: '#0ea5e9',
    marginTop: 2,
  },
  aiBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  aiBoxDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  aiBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiGeneratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  aiGeneratingText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
  },
  // Syllabus Editor
  syllabusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addModuleBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addModuleBtnText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moduleCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  moduleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  moduleTitleInput: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    padding: 0,
  },
  removeModuleBtn: {
    padding: 4,
  },
  removeModuleBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moduleInputSpacing: {
    marginBottom: 10,
    minHeight: 60,
  },
  moduleParamsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
