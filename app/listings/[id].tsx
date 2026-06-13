import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetSkillPostByIdQuery } from '../../redux/api/feedApi';
import {
  useGetSkillAIReviewQuery,
  useGenerateSkillAIReviewMutation,
  useSummarizeReviewsMutation,
  type ISkillAIReview,
  type ISummarizeReviewsResponse,
} from '../../redux/api/aiApi';

// ── Sentiment helpers (1:1 from AIReviewCard.tsx) ────────────────────────────

function sentimentCopy(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 90) return { label: 'Exceptional', color: '#4ade80', bg: '#052e16', border: '#166534' };
  if (score >= 70) return { label: 'Solid',       color: '#60a5fa', bg: '#1e3a5f', border: '#1d4ed8' };
  if (score <  50) return { label: 'Caution',     color: '#f87171', bg: '#3b0f0f', border: '#991b1b' };
  return               { label: 'Mixed',      color: '#fbbf24', bg: '#2d1f00', border: '#92400e' };
}

function meterColor(score: number): string {
  if (score >= 90) return '#4ade80';
  if (score >= 70) return '#60a5fa';
  if (score <  50) return '#f87171';
  return '#fbbf24';
}

// ── Animated spinner ─────────────────────────────────────────────────────────

function SpinIcon() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[styles.spinWrap, { transform: [{ rotate }] }]}>
      <Text style={styles.spinIcon}>✦</Text>
    </Animated.View>
  );
}

// ── Pulse text helper ─────────────────────────────────────────────────────────

function usePulseText(active: boolean, texts: string[], interval = 1500) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % texts.length), interval);
    return () => clearInterval(t);
  }, [active]);
  return texts[idx];
}

// ── AI Auditor Panel (AIReviewCard logic) ────────────────────────────────────

interface AIAuditorPanelProps {
  postId: string;
}

function AIAuditorPanel({ postId }: AIAuditorPanelProps) {
  const { data, isLoading } = useGetSkillAIReviewQuery(postId);
  const [generateReview, { isLoading: isGenerating }] = useGenerateSkillAIReviewMutation();
  const pulseText = usePulseText(isLoading || isGenerating, [
    'Scanning Syllabus...',
    'Reading Expertise Matrix...',
    'Ranking Quality Signals...',
    'Finalizing Audit...',
  ]);

  const busy = isLoading || isGenerating;

  // Skeleton / loading state
  if (busy) {
    return (
      <View style={[styles.aiCard, styles.aiCardBlue]}>
        <View style={styles.aiBadgeRow}>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>✦ AI-Powered</Text></View>
        </View>
        <View style={styles.aiSkeletonBody}>
          <SpinIcon />
          <Text style={styles.aiPulseText}>{pulseText}</Text>
          <View style={styles.skeletonBar} />
          <View style={[styles.skeletonBar, { width: '60%' }]} />
        </View>
      </View>
    );
  }

  const review: ISkillAIReview | null = data?.review ?? null;
  const warning = data?.warning;

  // No review yet — CTA
  if (!review) {
    return (
      <View style={[styles.aiCard, styles.aiCardDark]}>
        <View style={styles.aiBadgeRow}>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>✦ AI-Powered</Text></View>
        </View>
        <Text style={styles.aiOverline}>AI Auditor</Text>
        <Text style={styles.aiHeading}>Skill Analysis Pending</Text>
        <Text style={styles.aiBody}>
          Run a cached audit to estimate purchase quality, surface strengths, and call out risks before spending tokens.
        </Text>

        {warning ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠ {warning}</Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>No cached audit yet. Generate once, reuse on every visit.</Text>
          </View>
        )}

        {!warning && (
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => generateReview(postId)}
            activeOpacity={0.8}
          >
            <Text style={styles.generateBtnText}>✦  Generate Analysis</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Has review — full display
  const tone = sentimentCopy(review.sentimentScore);
  const barColor = meterColor(review.sentimentScore);
  const clampedScore = Math.max(0, Math.min(100, review.sentimentScore));

  return (
    <View style={[styles.aiCard, styles.aiCardDark]}>
      <View style={styles.aiBadgeRow}>
        <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>✦ AI-Powered</Text></View>
      </View>

      {/* Score header */}
      <View style={styles.aiScoreHeader}>
        <View>
          <Text style={styles.aiOverline}>AI Auditor</Text>
          <Text style={styles.aiHeading}>Overall Sentiment</Text>
        </View>
        <View style={[styles.toneBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <Text style={[styles.toneBadgeText, { color: tone.color }]}>{tone.label}</Text>
        </View>
      </View>

      {/* Score meter */}
      <View style={styles.meterBox}>
        <View style={styles.meterLabelRow}>
          <Text style={styles.meterLabel}>Overall Sentiment: {review.sentimentScore}%</Text>
          <Text style={[styles.meterLabel, { color: tone.color }]}>{tone.label}</Text>
        </View>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${clampedScore}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.aiSummary}>{review.summary}</Text>

      {/* Pros / Cons */}
      <View style={styles.prosConsRow}>
        <View style={[styles.prosConsCard, styles.prosCard]}>
          <Text style={styles.prosTitle}>✓  Pros</Text>
          {review.pros.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dotGreen} />
              <Text style={styles.prosText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.prosConsCard, styles.consCard]}>
          <Text style={styles.consTitle}>⚠  Cons</Text>
          {review.cons.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dotRed} />
              <Text style={styles.consText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Refresh */}
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => generateReview(postId)}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshBtnText}>↻  Refresh Analysis</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── AI Insights Panel (AIInsights.tsx — summarizeReviews) ─────────────────────

interface AIInsightsPanelProps {
  postId: string;
}

function AIInsightsPanel({ postId }: AIInsightsPanelProps) {
  const [summarizeReviews, { data, isLoading, isError, isSuccess }] = useSummarizeReviewsMutation();
  const [modelBusy, setModelBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseText = usePulseText(isLoading, [
    'Scanning Reviews...',
    'Extracting Key Insights...',
    'Synthesizing Data...',
    'Finalizing Summary...',
  ]);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setModelBusy(true), 30000);
    } else {
      setModelBusy(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.aiCard, styles.aiCardBlue]}>
        <View style={styles.aiSkeletonBody}>
          <SpinIcon />
          <Text style={styles.aiPulseText}>{pulseText}</Text>
        </View>
      </View>
    );
  }

  // Empty / CTA state
  if (!data && !isSuccess) {
    return (
      <View style={[styles.aiCard, styles.aiCardBlue]}>
        <View style={styles.insightIconWrap}>
          <Text style={styles.insightIcon}>🧠</Text>
        </View>
        <Text style={styles.aiHeading}>AI Smart Reviewer</Text>
        <Text style={styles.aiBody}>
          Our AI reads all reviews and generates a concise pros/cons summary to help you decide.
        </Text>

        {isError && (
          <Text style={styles.errorSmall}>Failed to generate insights. Please try again.</Text>
        )}
        {modelBusy && (
          <Text style={styles.warnSmall}>⚠ Model busy — timed out after 30s. Try again.</Text>
        )}

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => summarizeReviews(postId)}
          activeOpacity={0.8}
        >
          <Text style={styles.generateBtnText}>✦  Generate Insights</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  const insight: ISummarizeReviewsResponse = data;

  return (
    <View style={[styles.aiCard, styles.aiCardDark]}>
      <View style={styles.aiInsightHeader}>
        <Text style={styles.aiInsightSpark}>✦</Text>
        <Text style={styles.aiHeading}>AI Insights</Text>
      </View>

      <Text style={styles.aiSummary}>{insight.summary}</Text>

      <View style={styles.prosConsRow}>
        <View style={[styles.prosConsCard, styles.prosCard]}>
          <Text style={styles.prosTitle}>👍  Pros</Text>
          {insight.pros.map((pro, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dotGreen} />
              <Text style={styles.prosText}>{pro}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.prosConsCard, styles.consCard]}>
          <Text style={styles.consTitle}>👎  Cons</Text>
          {insight.cons.map((con, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dotRed} />
              <Text style={styles.consText}>{con}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: post, isLoading, error } = useGetSkillPostByIdQuery(id as string, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" size="large" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Listing not found or failed to load.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back nav */}
        <TouchableOpacity style={styles.backNav} onPress={() => router.back()}>
          <Text style={styles.backNavText}>← Back</Text>
        </TouchableOpacity>

        {/* Category + Status row */}
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{post.category}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{post.status || 'ACTIVE'}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Creator + Price */}
        <View style={styles.creatorCard}>
          {post.creator?.image ? (
            <Image source={{ uri: post.creator.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {post.creator?.name ? post.creator.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{post.creator?.name || 'Anonymous'}</Text>
            <Text style={styles.creatorSub}>Creator</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{post.tokenPrice} KT</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Listing</Text>
          <Text style={styles.description}>
            {post.longDescription || post.shortDescription || 'No description provided.'}
          </Text>
        </View>

        {/* ── AI Auditor Panel ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Skill Audit</Text>
          <AIAuditorPanel postId={id as string} />
        </View>

        {/* ── AI Insights Panel ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Review Insights</Text>
          <AIInsightsPanel postId={id as string} />
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tradeBtn}
          activeOpacity={0.8}
          onPress={() => router.push(`/listings/request?listingId=${id}` as any)}
        >
          <Text style={styles.tradeBtnText}>Request Trade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    padding: 24,
  },
  scrollContent: { padding: 20, paddingBottom: 110 },

  // Back nav
  backNav: { marginBottom: 16, marginTop: 48 },
  backNavText: { color: '#0ea5e9', fontSize: 14, fontWeight: '600' },

  // Category / status
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  categoryBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  categoryBadgeText: { color: '#0ea5e9', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { backgroundColor: '#1e1e1e', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusText: { color: '#888', fontSize: 11, fontWeight: '700' },

  // Title
  title: { fontSize: 30, fontWeight: '900', color: '#fff', lineHeight: 38, marginBottom: 16 },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tagText: { color: '#888', fontSize: 11 },

  // Creator card
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  creatorInfo: { flex: 1, marginLeft: 14 },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  creatorSub: { color: '#666', fontSize: 11, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { color: '#666', fontSize: 11 },
  priceValue: { color: '#4ade80', fontSize: 18, fontWeight: '900', marginTop: 2 },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  description: { color: '#888', fontSize: 15, lineHeight: 24 },

  // ── AI shared card ──────────────────────────────────────────────────────
  aiCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  aiCardDark: {
    backgroundColor: '#111',
    borderColor: '#222',
  },
  aiCardBlue: {
    backgroundColor: '#091827',
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },

  // AI Badge
  aiBadgeRow: { alignItems: 'flex-end', marginBottom: 12 },
  aiBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiBadgeText: { color: '#0ea5e9', fontSize: 10, fontWeight: '700' },

  // Text styles
  aiOverline: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  aiHeading: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  aiBody: { color: '#666', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  aiSummary: { color: '#aaa', fontSize: 13, lineHeight: 21, marginBottom: 16 },

  // Spinner
  spinWrap: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  spinIcon: { color: '#0ea5e9', fontSize: 20 },
  aiSkeletonBody: { alignItems: 'center', paddingVertical: 16, gap: 10 },
  aiPulseText: { color: '#0ea5e9', fontSize: 13, fontWeight: '600' },
  skeletonBar: {
    width: '80%', height: 8,
    backgroundColor: '#1e2a38',
    borderRadius: 8,
  },

  // Score / tone badge
  aiScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  toneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  toneBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Meter
  meterBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  meterLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meterLabel: { color: '#888', fontSize: 12, fontWeight: '500' },
  meterTrack: {
    height: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 10 },

  // Pros / Cons
  prosConsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  prosConsCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  prosCard: { backgroundColor: '#051a0f', borderColor: '#166534' },
  consCard: { backgroundColor: '#1c0a0a', borderColor: '#991b1b' },
  prosTitle: { color: '#4ade80', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  consTitle: { color: '#f87171', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  dotGreen: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4ade80',
    marginTop: 5, flexShrink: 0,
  },
  dotRed: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#f87171',
    marginTop: 5, flexShrink: 0,
  },
  prosText: { color: '#86efac', fontSize: 12, lineHeight: 18, flex: 1 },
  consText: { color: '#fca5a5', fontSize: 12, lineHeight: 18, flex: 1 },

  // Buttons
  generateBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  generateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  refreshBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
  },
  refreshBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },

  // Info / warning boxes
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoText: { color: '#666', fontSize: 12, lineHeight: 18 },
  warningBox: {
    backgroundColor: '#2d1f00',
    borderWidth: 1,
    borderColor: '#92400e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  warningText: { color: '#fbbf24', fontSize: 12, lineHeight: 18 },
  errorSmall: { color: '#f87171', fontSize: 11, marginBottom: 8, textAlign: 'center' },
  warnSmall: { color: '#fbbf24', fontSize: 11, marginBottom: 8, textAlign: 'center' },

  // AI Insights header
  aiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiInsightSpark: { color: '#0ea5e9', fontSize: 18 },

  // AI Insights icon
  insightIconWrap: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  insightIcon: { fontSize: 24 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.96)',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  tradeBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tradeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Error / back
  errorText: { color: '#f87171', fontSize: 16, marginBottom: 16 },
  backButton: { padding: 12, backgroundColor: '#1e1e1e', borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
});
