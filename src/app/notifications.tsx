
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Notification = {
  id: number;
  message: string;
  date: string;
  lue: boolean;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Utilisateur non connecté.');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('id, message, date, lue')
        .eq('etudiant_id', userData.user.id)
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;

      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.log('Erreur notifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  async function markAsRead(notification: Notification) {
    if (notification.lue) return;

    try {
      setUpdatingId(notification.id);

      const { error } = await supabase
        .from('notifications')
        .update({ lue: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, lue: true }
            : item
        )
      );
    } catch (error) {
      console.log('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de modifier la notification.');
    } finally {
      setUpdatingId(null);
    }
  }

  const unreadCount = notifications.filter((item) => !item.lue).length;

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>StudentWell.</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Restez informé de votre activité.
            </Text>
          </View>

          <View style={styles.bell}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{unreadCount}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>
              Notifications non lues
            </Text>
            <Text style={styles.summaryText}>
              Vous avez {unreadCount} notification(s) à consulter.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes notifications</Text>
          <Text style={styles.count}>{notifications.length} au total</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#397F66" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vos nouvelles notifications apparaîtront ici.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.lue && styles.unreadCard,
              ]}
              onPress={() => markAsRead(notification)}
              disabled={notification.lue || updatingId === notification.id}
            >
              <View style={styles.notificationIcon}>
                <Text style={{ fontSize: 23 }}>📩</Text>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationTop}>
                  <Text style={styles.notificationTitle}>
                    Notification
                  </Text>

                  <View
                    style={[
                      styles.status,
                      notification.lue
                        ? styles.readStatus
                        : styles.unreadStatus,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        !notification.lue && styles.unreadStatusText,
                      ]}
                    >
                      {notification.lue ? 'Lue' : 'Non lue'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.message}>
                  {notification.message}
                </Text>

                <Text style={styles.date}>
                  {formatDate(notification.date)}
                </Text>

                {!notification.lue && (
                  <Text style={styles.actionText}>
                    Appuyez pour marquer comme lue
                  </Text>
                )}

                {updatingId === notification.id && (
                  <ActivityIndicator
                    size="small"
                    color="#397F66"
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  />
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  container: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: '#36866B',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#263A32',
  },
  subtitle: {
    fontSize: 13,
    color: '#89948C',
    marginTop: 6,
  },
  bell: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#DCECE1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellEmoji: {
    fontSize: 24,
  },
  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#397F66',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryNumber: {
    fontSize: 35,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryText: {
    fontSize: 11,
    color: '#E3F0E7',
    marginTop: 5,
  },
  sectionHeader: {
    marginHorizontal: 22,
    marginTop: 30,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#293C33',
  },
  count: {
    fontSize: 11,
    color: '#929B94',
  },
  notificationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEE8',
    flexDirection: 'row',
    gap: 13,
  },
  unreadCard: {
    borderColor: '#B8D8C4',
    backgroundColor: '#FBFEFA',
  },
  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#F0F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#304137',
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  readStatus: {
    backgroundColor: '#EEF1ED',
  },
  unreadStatus: {
    backgroundColor: '#E1F1E5',
  },
  statusText: {
    fontSize: 10,
    color: '#879188',
    fontWeight: '700',
  },
  unreadStatusText: {
    color: '#397F66',
  },
  message: {
    fontSize: 13,
    color: '#59675D',
    lineHeight: 20,
    marginTop: 9,
  },
  date: {
    fontSize: 10,
    color: '#A0AAA2',
    marginTop: 9,
  },
  actionText: {
    fontSize: 10,
    color: '#397F66',
    fontWeight: '700',
    marginTop: 8,
  },
  center: {
    alignItems: 'center',
    padding: 35,
  },
  loadingText: {
    color: '#89948C',
    marginTop: 10,
    fontSize: 12,
  },
  emptyCard: {
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#304137',
  },
  emptyText: {
    fontSize: 12,
    color: '#929B94',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
