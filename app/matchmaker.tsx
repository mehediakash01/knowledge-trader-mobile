import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGetMeQuery } from '../redux/api/authApi';
import { useGetAIMatchesQuery } from '../redux/api/aiApi';
import EmptyState from '../components/ui/EmptyState';

// â”€â”€ Profile completeness calculator (1:1 with Web Matchmaker) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getProfileStrength(user: any) {
  if (!user) return 0;
  let score = 0;
  if (user.image) score += 15;
  if (user.bio?.trim()) score += 15;
  if (user.tagline?.trim()) score += 10;
  if (user.socialLinks?.length) score += 10;
  if (user.experience?.length) score += 15;
  if (user.expertise?.length) score += 20;
  if (user.learningPath?.length) score += 15;
  return Math.min(100, score);
}

export default function MatchmakerScreen() {
  const router = useRouter();
  
  // Fetch logged in user & matches
  const { data: user, isLoading: isLoadingUser, refetch: refetchMe } = useGetMeQuery();
  const profileStrength = useMemo(() => getProfileStrength(user), [user]);
  const hasExpertise = (user?.expertise?.length ?? 0) > 0;
  const hasLearningPath = (user?.learningPath?.length ?? 0) > 0;
  const personaReady = hasExpertise && hasLearningPath;

  const { data, isLoading: isLoadingMatches, isFetching, refetch: refetchMatches } = useGetAIMatchesQuery(undefined, {
    skip: !user || !personaReady,
  });

  const [pulseText, setPulseText] = useState('Scanning your Persona...');
  const PULSE_TEXTS = [
    'Scanning your Persona for perfect trades...',
    'Reading your expertise matrix...',
    'Cross-checking seller learning paths...',
    'Ranking reciprocal match scores...',
  ];

  // Cycling scanning text
  useEffect(() => {
    if (!isLoadingMatches && !isFetching) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PULSE_TEXTS.length;
      setPulseText(PULSE_TEXTS[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoadingMatches, isFetching]);

  const handleRefresh = () => {
    refetchMe();
    if (personaReady) {
      refetchMatches();
    }
  };

  const matches = data?.matches || [];
  const isTrending = data?.isTrendingFallback || false;

  // Render match card
  const renderMatchItem = ({ item, index }: { item: any; index: number }) => {
    const post = item.post;
    const creator = post?.creator;
    const scoreColor = item.score >= 80 ? '#10b981' : item.score >= 50 ? '#0ea5e9' : '#f59e0b';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/listings/${post.id}` as any)}
        activeOpacity={0.8}
      >
        {/* Creator Info Header */}
        <View style={styles.cardHeader}>
          {creator?.image ? (
            <Image source={{ uri: creator.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {creator?.name ? creator.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.creatorMeta}>
            <Text style={styles.creatorName} numberOfLines={1}>{creator?.name || 'Anonymous'}</Text>
            <Text style={styles.cardCategory}>{post.category}</Text>
          </View>
          <View style={[styles.scoreBadge, { borderColor: scoreColor + '30', backgroundColor: scoreColor + '10' }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{item.score}% Match</Text>
          </View>
        </View>

        {/* Post Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>{post.title}</Text>

        {/* Match Reason Logic Badge */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonSparkle}>âœ¦</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>{post.tokenPrice} KT</Text>
          <TouchableOpacity
            style={styles.tradeBtn}
            onPress={() => router.push(`/listings/request?id=${post.id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.tradeBtnText}>ðŸ¤ Propose Swap</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Smart Matchmaker</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Profile Completeness Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreCardTitle}>Profile Completeness</Text>
          <Text style={styles.scoreCardPct}>{profileStrength}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${profileStrength}%` as any }]} />
        </View>
        {!personaReady ? (
          <Text style={styles.scoreAlert}>
            âš  Add at least one expertise skill and one learning path item in Profile to search direct trade swaps.
          </Text>
        ) : (
          <Text style={styles.scoreStatus}>
            âœ“ Profile ready for reciprocal trade matchmaking.
          </Text>
        )}
      </View>

      {/* Grid Content */}
      <View style={{ flex: 1 }}>
        {(!personaReady) ? (
          <EmptyState
            icon="ðŸ§ "
            title="Persona Incomplete"
            subtitle="Complete your profile info first so our AI engine can match overlap demands."
          >
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/profile' as any)}>
              <Text style={styles.actionBtnText}>Go to Profile</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : (isLoadingMatches || isFetching) && !matches.length ? (
          <View style={styles.centerScanning}>
            <ActivityIndicator color="#0ea5e9" size="large" />
            <Text style={styles.scanningText}>{pulseText}</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item, idx) => item.post?.id || String(idx)}
            renderItem={renderMatchItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={handleRefresh}
                tintColor="#0ea5e9"
              />
            }
            ListHeaderComponent={
              isTrending ? (
                <View style={styles.fallbackBanner}>
                  <Text style={styles.fallbackBannerTitle}>Trending Fallback Mode</Text>
                  <Text style={styles.fallbackBannerDesc}>
                    No exact reciprocal matches found for your current learning/expertise matrix. Showing trending offers.
                  </Text>
                </View>
              ) : matches.length > 0 ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>âœ“ AI found reciprocal trade partners matching your profile!</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="ðŸ”"
                title="No Matches"
                subtitle="Try adjusting your learning path tags to find trade partners."
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  centerScanning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  scanningText: {
    color: '#0ea5e9',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 50,
  },
  backBtnText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Score Completeness
  scoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreCardTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scoreCardPct: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '900',
  },
  track: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 3,
  },
  scoreAlert: {
    color: '#f59e0b',
    fontSize: 11,
    lineHeight: 16,
  },
  scoreStatus: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  // Banner
  fallbackBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  fallbackBannerTitle: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fallbackBannerDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: 'bold',
  },
  creatorMeta: {
    flex: 1,
    marginLeft: 10,
  },
  creatorName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardCategory: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  scoreBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reasonBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonSparkle: {
    color: '#0ea5e9',
    fontSize: 14,
    marginTop: -1,
  },
  reasonText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tradeBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tradeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Empty CTA
  actionBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
