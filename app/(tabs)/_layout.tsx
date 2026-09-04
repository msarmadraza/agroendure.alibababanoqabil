import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

function TabIcon({
  icon: Icon,
  label,
  focused,
  isAdd,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  focused: boolean;
  isAdd?: boolean;
  badge?: number;
}) {
  if (isAdd) {
    return (
      <View style={styles.addButton}>
        <Plus size={24} color={Colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.tabItem}>
      <Icon
        size={20}
        color={focused ? Colors.primary : Colors.mutedForeground}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.primary : Colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Home} label="گھر" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Search} label="تلاش" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Plus} label="شامل" focused={focused} isAdd />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={MessageCircle} label="پیغامات" focused={focused} badge={3} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} label="پروفائل" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    position: 'relative',
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
