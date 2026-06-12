import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet, type ColorValue } from 'react-native';

// ── Tab bar icon using unicode/emoji ─────────────────────────────────────────
// (avoids SymbolView iOS/Android differences; works cross-platform)

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={{ opacity: focused ? 1 : 0.45 }}>
      {/* We use a Text component inside a View for universal compat */}
    </View>
  );
}

const ACTIVE = '#0ea5e9';
const INACTIVE = '#555';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d0d',
          borderTopColor: '#1e1e1e',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* Feed */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <TabIconEmoji emoji="⚡" color={color} />
          ),
        }}
      />

      {/* Trades */}
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trades',
          tabBarIcon: ({ color }) => (
            <TabIconEmoji emoji="⇄" color={color} />
          ),
        }}
      />

      {/* Assets (My Skills + Create) */}
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
          tabBarIcon: ({ color }) => (
            <TabIconEmoji emoji="✦" color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIconEmoji emoji="◉" color={color} />
          ),
        }}
      />

      {/* Hidden legacy tab */}
      <Tabs.Screen
        name="two"
        options={{ href: null }}
      />
    </Tabs>
  );
}

// ── Simple cross-platform tab icon ───────────────────────────────────────────

function TabIconEmoji({ emoji, color }: { emoji: string; color: ColorValue }) {
  return (
    <Text style={[styles.icon, { color }]}>{emoji}</Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
  },
});
