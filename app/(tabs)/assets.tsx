import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { useGetMySkillsQuery } from '../../redux/api/feedApi';
import EmptyState from '../../components/ui/EmptyState';
import type { ISkillPost } from '../../types';

// ── Tab IDs ──────────────────────────────────────────────────────────────────

type Tab = 'listings' | 'create';

// ── Skill Card ───────────────────────────────────────────────────────────────

function SkillCard({ item, onPress }: { item: ISkillPost; onPress: () => void }) {
  const statusColor =
    item.status === 'ACTIVE' || item.status === 'PUBLISHED'
      ? '#4ade80'
      : item.status === 'PENDING'
      ? '#fbbf24'
      : '#94a3b8';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status ?? 'ACTIVE'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

      {/* Description */}
      {item.shortDescription ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.shortDescription}</Text>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{item.tokenPrice} KT</Text>
        </View>
        {(item.tags ?? []).slice(0, 2).map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        <Text style={styles.openArrow}>Open →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Create CTA Prompt ────────────────────────────────────────────────────────

function CreateCTA({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.ctaContainer}>
      {/* Hero card */}
      <View style={styles.ctaCard}>
        <View style={styles.ctaIconWrap}>
          <Text style={styles.ctaIcon}>✦</Text>
        </View>
        <Text style={styles.ctaHeading}>Share Your Expertise</Text>
        <Text style={styles.ctaBody}>
          Build a high-fidelity skill post in 4 guided steps — Identity, Hook, Roadmap, and Vault.
        </Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>+ Create Elite Skill</Text>
        </TouchableOpacity>
      </View>

      {/* Feature pills */}
      <View style={styles.featureRow}>
        {['AI-assisted', 'Step-by-step', 'Instant publish'].map((f) => (
          <View key={f} style={styles.featurePill}>
            <Text style={styles.featurePillText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function AssetsScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<Tab>('listings');

  const {
    data: mySkills,
    isLoading,
    isFetching,
    refetch,
  } = useGetMySkillsQuery(user?.id ?? '', { skip: !user?.id });

  const skills = mySkills?.data ?? [];

  const navigateCreate = () => router.push('/skills/create' as any);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Knowledge Assets</Text>
          <Text style={styles.headerSub}>
            {skills.length} active skill{skills.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={navigateCreate} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'listings' && styles.segmentActive]}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.segmentText, activeTab === 'listings' && styles.segmentTextActive]}>
            📋  My Listings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'create' && styles.segmentActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.segmentText, activeTab === 'create' && styles.segmentTextActive]}>
            ✦  Create New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'listings' ? (
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0ea5e9" size="large" />
          </View>
        ) : (
          <FlatList
            data={skills}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <SkillCard
                item={item}
                onPress={() => router.push(`/listings/${item.id}` as any)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor="#0ea5e9"
                colors={['#0ea5e9']}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="📭"
                title="No skills posted yet"
                subtitle="Switch to 'Create New' to publish your first skill."
              >
                <TouchableOpacity style={styles.emptyBtn} onPress={navigateCreate}>
                  <Text style={styles.emptyBtnText}>+ Publish your first skill</Text>
                </TouchableOpacity>
              </EmptyState>
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <CreateCTA onPress={navigateCreate} />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Segmented control
  segmentBar: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#0ea5e9',
  },
  segmentText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // Card
  card: {
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCategory: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 6,
  },
  cardDesc: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pricePill: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priceText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  tagPill: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
  },
  openArrow: {
    marginLeft: 'auto',
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // CTA Panel
  ctaContainer: {
    flex: 1,
    padding: 20,
  },
  ctaCard: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0ea5e920',
    borderWidth: 1,
    borderColor: '#0ea5e940',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ctaIcon: {
    fontSize: 28,
    color: '#0ea5e9',
  },
  ctaHeading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaBody: {
    color: '#777',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  featurePill: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featurePillText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
