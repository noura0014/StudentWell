
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Budget = {
  id: number;
  montant_total: number;
  date: string;
  moment: string;
};

export default function HomeScreen() {
  const router = useRouter();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [totalDepenses, setTotalDepenses] = useState(0);
  const [loadingBudget, setLoadingBudget] = useState(true);

  // Charger le dernier budget et ses dépenses
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadBudget() {
        try {
          setLoadingBudget(true);

          const { data: userData, error: userError } =
            await supabase.auth.getUser();

          if (userError || !userData.user) {
            throw new Error('Utilisateur non connecté.');
          }

          // Récupérer le dernier budget
          const { data: budgetData, error: budgetError } = await supabase
            .from('budgets')
            .select('*')
            .eq('etudiant_id', userData.user.id)
            .order('date', { ascending: false })
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (budgetError) throw budgetError;

          if (!budgetData) {
            if (active) {
              setBudget(null);
              setTotalDepenses(0);
            }
            return;
          }

          // Récupérer les dépenses de ce budget
          const { data: depensesData, error: depensesError } =
            await supabase
              .from('depenses')
              .select('montant')
              .eq('budget_id', budgetData.id);

          if (depensesError) throw depensesError;

          const total = (depensesData || []).reduce(
            (sum, depense) => sum + Number(depense.montant),
            0
          );

          if (active) {
            setBudget(budgetData as Budget);
            setTotalDepenses(total);
          }
        } catch (error) {
          console.log('Erreur Dashboard:', error);

          if (active) {
            setBudget(null);
            setTotalDepenses(0);
          }
        } finally {
          if (active) {
            setLoadingBudget(false);
          }
        }
      }

      loadBudget();

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error.message);
    }
  }

  const montantTotal = budget ? Number(budget.montant_total) : 0;
  const montantRestant = montantTotal - totalDepenses;

  const pourcentage =
    montantTotal > 0
      ? Math.min(
          Math.max((totalDepenses / montantTotal) * 100, 0),
          100
        )
      : 0;

  const formatMoney = (amount: number) => `${amount.toFixed(2)} DT`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>StudentWell.</Text>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.subtitle}>
              Prenez soin de vous, chaque jour.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={{
                width: 45,
                height: 45,
                borderRadius: 15,
                backgroundColor: '#F0F5E9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>🔔</Text>
            </Pressable>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>
          </View>
        </View>

        {/* Main banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerLabel}>VOTRE BIEN-ÊTRE</Text>
            <Text style={styles.bannerTitle}>
              Bien manger,{'\n'}mieux vivre.
            </Text>
            <Text style={styles.bannerDescription}>
              Un équilibre entre votre budget et votre santé.
            </Text>
          </View>
          <Text style={styles.bannerEmoji}>🥑</Text>
        </View>

        {/* Budget */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mon budget</Text>
          <Text style={styles.sectionSubtitle}>Gérez intelligemment</Text>
        </View>

        <Pressable
          style={styles.budgetCard}
          onPress={() => router.push('/(tabs)/budget')}
        >
          <View style={styles.budgetTop}>
            <View style={styles.budgetIcon}>
              <Text style={{ fontSize: 23 }}>💰</Text>
            </View>
            <Text style={styles.budgetTag}>BUDGET ALIMENTAIRE</Text>
          </View>

          {loadingBudget ? (
            <View style={styles.loadingBudget}>
              <ActivityIndicator color="#397F66" />
              <Text style={styles.loadingText}>
                Chargement du budget...
              </Text>
            </View>
          ) : budget ? (
            <>
              <Text style={styles.budgetTitle}>
                {formatMoney(montantRestant)}
              </Text>
              <Text style={styles.budgetDescription}>
                Montant restant sur votre budget alimentaire.
              </Text>

              <View style={styles.budgetStats}>
                <View>
                  <Text style={styles.statLabel}>Budget total</Text>
                  <Text style={styles.statValue}>
                    {formatMoney(montantTotal)}
                  </Text>
                </View>

                <View>
                  <Text style={styles.statLabel}>Dépenses</Text>
                  <Text style={styles.statValue}>
                    {formatMoney(totalDepenses)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Budget consommé
                </Text>
                <Text style={styles.progressPercent}>
                  {pourcentage.toFixed(0)}%
                </Text>
              </View>

              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pourcentage}%` },
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.budgetTitle}>
                Aucun budget enregistré
              </Text>
              <Text style={styles.budgetDescription}>
                Ajoutez votre premier budget pour suivre vos dépenses.
              </Text>
            </>
          )}

          <View style={styles.budgetFooter}>
            <Text style={styles.budgetFooterText}>
              Voir mes budgets et dépenses
            </Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Pressable>

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Découvrir</Text>
          <Text style={styles.sectionSubtitle}>Votre espace personnel</Text>
        </View>

        <View style={styles.grid}>
          <View style={[styles.serviceCard, { backgroundColor: '#F0F5E9' }]}>
            <View style={styles.serviceIcon}>
              <Text style={{ fontSize: 27 }}>🥗</Text>
            </View>
            <Text style={styles.serviceTitle}>Recettes</Text>
            <Text style={styles.serviceDescription}>
              Des repas adaptés à votre budget.
            </Text>
          </View>

          <View style={[styles.serviceCard, { backgroundColor: '#EEF2FA' }]}>
            <View style={styles.serviceIcon}>
              <Text style={{ fontSize: 27 }}>💧</Text>
            </View>
            <Text style={styles.serviceTitle}>Habitudes</Text>
            <Text style={styles.serviceDescription}>
              Suivez vos objectifs quotidiens.
            </Text>
          </View>

          <View style={[styles.serviceCard, { backgroundColor: '#FAF1E7' }]}>
            <View style={styles.serviceIcon}>
              <Text style={{ fontSize: 27 }}>📊</Text>
            </View>
            <Text style={styles.serviceTitle}>Statistiques</Text>
            <Text style={styles.serviceDescription}>
              Découvrez votre progression.
            </Text>
          </View>

          <View style={[styles.serviceCard, { backgroundColor: '#F5EDF5' }]}>
            <View style={styles.serviceIcon}>
              <Text style={{ fontSize: 27 }}>✨</Text>
            </View>
            <Text style={styles.serviceTitle}>Conseils IA</Text>
            <Text style={styles.serviceDescription}>
              Des recommandations personnalisées.
            </Text>
          </View>
        </View>

        {/* Advice */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceLabel}>UN PETIT CONSEIL</Text>
          <View style={styles.adviceRow}>
            <Text style={styles.adviceEmoji}>🌱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adviceTitle}>
                Chaque petit geste compte !
              </Text>
              <Text style={styles.adviceText}>
                Commencez par une bonne habitude aujourd'hui.
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>

        <Text style={styles.footer}>
          StudentWell · Votre bien-être au quotidien
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 17,
    fontWeight: '800',
    color: '#36866B',
    marginBottom: 17,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 27,
    fontWeight: '800',
    color: '#263A32',
  },
  subtitle: {
    fontSize: 13,
    color: '#89948C',
    marginTop: 5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#DCECE1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#36866B',
  },
  banner: {
    marginHorizontal: 20,
    backgroundColor: '#397F66',
    borderRadius: 25,
    padding: 22,
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 10,
    color: '#D8EBDD',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    marginTop: 12,
  },
  bannerDescription: {
    color: '#E3F0E7',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 220,
  },
  bannerEmoji: {
    fontSize: 65,
    marginLeft: -5,
  },
  sectionHeader: {
    marginHorizontal: 22,
    marginTop: 29,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#293C33',
  },
  sectionSubtitle: {
    color: '#929B94',
    fontSize: 12,
    marginTop: 4,
  },
  budgetCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEE8',
  },
  budgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#F0F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetTag: {
    marginLeft: 12,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#849187',
  },
  budgetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#293C33',
    marginTop: 17,
  },
  budgetDescription: {
    color: '#929B94',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  loadingBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  loadingText: {
    color: '#929B94',
    fontSize: 12,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 16,
  },
  statLabel: {
    color: '#929B94',
    fontSize: 11,
  },
  statValue: {
    color: '#293C33',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#849187',
    fontSize: 11,
  },
  progressPercent: {
    color: '#397F66',
    fontSize: 11,
    fontWeight: '800',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E8EFE8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#397F66',
    borderRadius: 10,
  },
  budgetFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EDF0EB',
    marginTop: 17,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetFooterText: {
    color: '#397F66',
    fontSize: 13,
    fontWeight: '700',
  },
  arrow: {
    color: '#397F66',
    fontSize: 20,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 12,
  },
  serviceCard: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 19,
    padding: 16,
    minHeight: 155,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#304137',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#7E8980',
    lineHeight: 17,
    marginTop: 6,
  },
  adviceCard: {
    marginHorizontal: 20,
    marginTop: 27,
    padding: 19,
    borderRadius: 20,
    backgroundColor: '#E8F1E8',
  },
  adviceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#66866F',
    marginBottom: 13,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  adviceEmoji: {
    fontSize: 32,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#345541',
  },
  adviceText: {
    fontSize: 12,
    color: '#718276',
    marginTop: 5,
    lineHeight: 18,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE4',
    alignItems: 'center',
  },
  logoutText: {
    color: '#A45E5E',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#A1AAA2',
    fontSize: 10,
    marginTop: 18,
    marginBottom: 25,
  },
});
