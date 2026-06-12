import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetAllSkillPostsQuery, useGetCategoriesQuery } from '../../redux/api/feedApi';
import type { ISkillPost } from '../../types';

const BAZAAR_MAX_PRICE = 5000;
const BAZAAR_DEFAULT_LIMIT = 10;
const DEFAULT_CATEGORIES = ["Development", "Design", "Business", "Marketing", "Data", "AI"];

export default function FeedScreen() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(BAZAAR_MAX_PRICE);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = useMemo(() => ({
    searchTerm: debouncedSearch || undefined,
    category: categories.length ? categories.join(",") : undefined,
    minPrice,
    maxPrice,
    page,
    limit: BAZAAR_DEFAULT_LIMIT,
  }), [debouncedSearch, categories, minPrice, maxPrice, page]);

  const { data, isLoading, isFetching, refetch } = useGetAllSkillPostsQuery(queryParams);
  const { data: categoryData } = useGetCategoriesQuery();

  const activeCategories = categoryData?.length ? categoryData : DEFAULT_CATEGORIES;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const toggleCategory = (category: string) => {
    setCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
    setPage(1);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setCategories([]);
    setMinPrice(0);
    setMaxPrice(BAZAAR_MAX_PRICE);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / BAZAAR_DEFAULT_LIMIT));

  const renderItem = ({ item }: { item: ISkillPost }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/listings/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.userInfo}>{item.creator?.name || 'Anonymous'}</Text>
        <Text style={styles.price}>{item.tokenPrice} KT</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Skill Bazaar</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity 
          style={styles.filterToggleBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>Filters {categories.length > 0 ? `(${categories.length})` : ''}</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Filters */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {activeCategories.map((cat) => {
              const isSelected = categories.includes(cat);
              return (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.priceRow}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.filterTitle}>Min Price</Text>
              <TextInput 
                style={styles.priceInput}
                keyboardType="numeric"
                value={minPrice.toString()}
                onChangeText={(val) => setMinPrice(Number(val) || 0)}
              />
            </View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.filterTitle}>Max Price</Text>
              <TextInput 
                style={styles.priceInput}
                keyboardType="numeric"
                value={maxPrice.toString()}
                onChangeText={(val) => setMaxPrice(Number(val) || BAZAAR_MAX_PRICE)}
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearAll}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Listing Content */}
      <View style={styles.listWrapper}>
        {isLoading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4ade80" size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.data || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor="#4ade80"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found.</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters.</Text>
              </View>
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity 
                    disabled={page === 1}
                    style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                    onPress={() => handlePageChange(page - 1)}
                  >
                    <Text style={styles.pageBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageText}>Page {page} of {totalPages}</Text>
                  <TouchableOpacity 
                    disabled={page === totalPages}
                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                    onPress={() => handlePageChange(page + 1)}
                  >
                    <Text style={styles.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterToggleBtn: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterToggleText: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 8,
  },
  filterTitle: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: '#4ade80',
  },
  categoryPillText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  categoryPillTextActive: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    height: 40,
  },
  clearFiltersBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  listWrapper: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  price: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#a0a0a0',
    marginTop: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageText: {
    color: '#a0a0a0',
  },
});
