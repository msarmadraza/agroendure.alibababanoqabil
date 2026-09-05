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
import { useLanguage } from '@/services/i18n/languageContext';

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
        <Plus size={26} color={Colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.tabItem}>
      {focused && <View style={styles.activeIndicator} />}
      <Icon
        size={22}
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
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLanguage();

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
            <TabIcon icon={Home} label={t('tabs.home')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Search} label={t('tabs.browse')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Plus} label={t('tabs.add')} focused={focused} isAdd />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={MessageCircle} label={t('tabs.messages')} focused={focused} badge={3} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} label={t('tabs.profile')} focused={focused} />
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
    height: 72,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    minHeight: 52,
    position: 'relative',
    gap: 2,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
