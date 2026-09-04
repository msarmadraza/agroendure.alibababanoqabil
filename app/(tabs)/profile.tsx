import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, FontSize, Shadows } from '@/constants/theme';

const userListings: any[] = [];
const bids = [
  {
    id: '1',
    buyerName: 'علی احمد',
    bidAmount: 83000,
    deliveryDate: '25 اپریل 2024',
    dateCreated: '2 منٹ پہلے',
    status: 'pending' as const,
  },
];

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>پروفائل</Text>

        <View style={styles.list}>
          <View style={[styles.card, Shadows.soft]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>ا</Text>
            </View>
            <Text style={styles.name}>احمد علی</Text>
            <Text style={styles.location}>کسان • فیصل آباد</Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>⭐ 4.8</Text>
                <Text style={styles.statLabel}>ریٹنگ</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>فروخت</Text>
              </View>
              
            </View>


          </View>

          {bids.length > 0 && (
            <View style={[styles.card, Shadows.soft]}>
              <Text style={styles.cardTitle}>موصولہ بولیاں</Text>
              <View style={styles.bidList}>
                {bids.map((bid) => (
                  <View key={bid.id} style={styles.bidItem}>
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidName}>{bid.buyerName}</Text>
                      <Text style={styles.bidAmount}>
                        ₨{bid.bidAmount.toLocaleString()} فی من
                      </Text>
                      <Text style={styles.bidMeta}>ڈیلیوری: {bid.deliveryDate}</Text>
                      <Text style={styles.bidMeta}>{bid.dateCreated}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: Colors.warningBg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: Colors.warning }]}>
                        زیر غور
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.cardTitle}>میری لسٹنگز</Text>
            {userListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>ابھی کوئی لسٹنگ نہیں ہے</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/add')}>
                  <Text style={styles.emptyLink}>پہلی لسٹنگ شامل کریں</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bidList}>
                {userListings.map((listing: any) => (
                  <View key={listing.id} style={styles.bidItem}>
                    <View style={styles.bidInfo}>
                      <Text style={styles.bidName}>{listing.cropType}</Text>
                      <Text style={styles.bidMeta}>
                        {listing.quantity} • {listing.quality}
                      </Text>
                      <Text style={styles.bidAmount}>
                        ₨{listing.price.toLocaleString()} فی من
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.foreground,
  },
  location: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },

  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.foreground,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  bidList: {
    width: '100%',
    gap: Spacing.md,
  },
  bidItem: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bidInfo: {
    flex: 1,
  },
  bidName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  bidAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  bidMeta: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.mutedForeground,
    fontSize: FontSize.md,
  },
  emptyLink: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
