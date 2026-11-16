import { sendNotification } from '@/services/notificationService';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type Budget = {
  id: number;
  montant_total: number;
  date: string;
  moment: string;
};

type Depense = {
  id: number;
  budget_id: number;
  montant: number;
  date: string;
  description: string;
};

const moments = [
  { value: 'petit_dejeuner', label: 'Petit déjeuner' },
  { value: 'dejeuner', label: 'Déjeuner' },
  { value: 'diner', label: 'Dîner' },
  { value: 'collation', label: 'Collation' },
];

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);

  const [montantBudget, setMontantBudget] = useState('');
  const [moment, setMoment] = useState('dejeuner');

  const [montantDepense, setMontantDepense] = useState('');
  const [description, setDescription] = useState('');

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [editingDepenseId, setEditingDepenseId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les budgets et les dépenses
  const loadData = async () => {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Utilisateur non connecté.');
      }

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('etudiant_id', userData.user.id)
        .order('date', { ascending: false });

      if (budgetError) throw budgetError;

      const budgetList = (budgetData || []) as Budget[];
      setBudgets(budgetList);

      if (budgetList.length === 0) {
        setDepenses([]);
        setSelectedBudgetId(null);
        return;
      }

      const ids = budgetList.map((budget) => budget.id);

      const { data: depenseData, error: depenseError } = await supabase
        .from('depenses')
        .select('*')
        .in('budget_id', ids)
        .order('date', { ascending: false });

      if (depenseError) throw depenseError;

      setDepenses((depenseData || []) as Depense[]);

      setSelectedBudgetId((previousId) => {
        if (previousId && ids.includes(previousId)) {
          return previousId;
        }
        return budgetList[0].id;
      });
    } catch (error) {
      console.log('Erreur chargement Budget:', error);
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Budget sélectionné
  const selectedBudget = budgets.find(
    (budget) => budget.id === selectedBudgetId
  );

  // Dépenses du budget sélectionné
  const selectedDepenses = depenses.filter(
    (depense) => depense.budget_id === selectedBudgetId
  );

  // Calcul des dépenses
  const totalDepenses = selectedDepenses.reduce(
    (total, depense) => total + Number(depense.montant),
    0
  );

  // Calcul du montant restant
  const montantRestant = selectedBudget
    ? Number(selectedBudget.montant_total) - totalDepenses
    : 0;

  // Pourcentage de consommation
  const pourcentage =
    selectedBudget && Number(selectedBudget.montant_total) > 0
      ? Math.min(
          Math.max(
            (totalDepenses / Number(selectedBudget.montant_total)) * 100,
            0
          ),
          100
        )
      : 0;

  const formatMoney = (amount: number) => `${amount.toFixed(2)} DT`;

  // Ajouter un budget
  const ajouterBudget = async () => {
    const montant = Number(montantBudget);

    if (!montantBudget.trim() || !Number.isFinite(montant) || montant <= 0) {
      Alert.alert('Attention', 'Saisissez un montant valide.');
      return;
    }

    try {
      setSaving(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Utilisateur non connecté.');
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          etudiant_id: userData.user.id,
          montant_total: montant,
          date: new Date().toISOString().slice(0, 10),
          moment: moment,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedBudgetId(data.id);
      setMontantBudget('');
      setShowBudgetForm(false);

      await loadData();

      Alert.alert('Succès', 'Budget ajouté avec succès.');
    } catch (error) {
      console.log('Erreur ajout budget:', error);
      Alert.alert('Erreur', 'Impossible d’ajouter le budget.');
    } finally {
      setSaving(false);
    }
  };

  // Ajouter ou modifier une dépense
  const ajouterDepense = async () => {
    const montant = Number(montantDepense);

    if (!selectedBudgetId) {
      Alert.alert('Attention', 'Sélectionnez un budget.');
      return;
    }

    if (!montantDepense.trim() || !Number.isFinite(montant) || montant <= 0) {
      Alert.alert('Attention', 'Saisissez un montant valide.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Attention', 'Saisissez une description.');
      return;
    }

    const isEditing = editingDepenseId !== null;

    try {
      setSaving(true);

      if (isEditing) {
        const { error } = await supabase
          .from('depenses')
          .update({
            montant: montant,
            description: description.trim(),
          })
          .eq('id', editingDepenseId);

        if (error) throw error;
      } else {
  const { error } = await supabase.from('depenses').insert({
    budget_id: selectedBudgetId,
    montant: montant,
    date: new Date().toISOString().slice(0, 10),
    description: description.trim(),
  });

  if (error) throw error;

  // Envoyer une notification
  try {
    await sendNotification(
      `Nouvelle dépense ajoutée : ${description.trim()} - ${montant.toFixed(2)} DT`,
      'depense'
    );
  } catch (notificationError) {
    console.log('Erreur notification:', notificationError);
  }
}
// Vérifier si le budget est presque épuisé
const budgetTotal = Number(selectedBudget?.montant_total || 0);

const montantRestantAvant = budgetTotal - totalDepenses;
const montantRestantApres = montantRestantAvant - montant;

const seuil = budgetTotal * 0.10;

if (
  budgetTotal > 0 &&
  montantRestantAvant > seuil &&
  montantRestantApres <= seuil
) {
  try {
    await sendNotification(
      `Attention ! Il ne vous reste que ${montantRestantApres.toFixed(2)} DT de votre budget.`,
      'budget'
    );
  } catch (notificationError) {
    console.log('Erreur notification budget:', notificationError);
  }
}

      setMontantDepense('');
      setDescription('');
      setEditingDepenseId(null);
      setShowDepenseForm(false);

      await loadData();

      Alert.alert(
        'Succès',
        isEditing
          ? 'Dépense modifiée avec succès.'
          : 'Dépense ajoutée avec succès.'
      );
    } catch (error) {
      console.log('Erreur dépense:', error);
      Alert.alert('Erreur', 'Impossible d’enregistrer la dépense.');
    } finally {
      setSaving(false);
    }
  };

  // Préparer la modification d'une dépense
  const modifierDepense = (depense: Depense) => {
    setEditingDepenseId(depense.id);
    setMontantDepense(String(depense.montant));
    setDescription(depense.description);
    setShowDepenseForm(true);
  };

  // Supprimer une dépense
  const supprimerDepense = (id: number) => {
    Alert.alert(
      'Supprimer la dépense',
      'Voulez-vous vraiment supprimer cette dépense ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('depenses')
                .delete()
                .eq('id', id);

              if (error) throw error;

              await loadData();

              Alert.alert('Succès', 'Dépense supprimée.');
            } catch (error) {
              console.log('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la dépense.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39866B" />
        <Text style={styles.loadingText}>Chargement du budget...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>STUDENTWELL</Text>
            <Text style={styles.title}>Mon Budget</Text>
            <Text style={styles.description}>
              Gérez votre budget alimentaire facilement.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>💰</Text>
          </View>
        </View>

        {/* Résumé du budget */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Montant restant</Text>

          <Text style={styles.remainingAmount}>
            {formatMoney(montantRestant)}
          </Text>

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.smallLabel}>Budget total</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(
                  selectedBudget ? Number(selectedBudget.montant_total) : 0
                )}
              </Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>Dépenses</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(totalDepenses)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Budget consommé</Text>
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
          </View>
        </View>

        {/* Mes budgets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes budgets</Text>

          <Pressable
            style={styles.addButton}
            onPress={() => setShowBudgetForm(!showBudgetForm)}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </Pressable>
        </View>

        {/* Formulaire budget */}
        {showBudgetForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nouveau budget</Text>

            <Text style={styles.inputLabel}>Montant total (DT)</Text>

            <TextInput
              style={styles.input}
              placeholder="Exemple : 150"
              keyboardType="decimal-pad"
              value={montantBudget}
              onChangeText={setMontantBudget}
            />

            <Text style={styles.inputLabel}>Moment du repas</Text>

            <View style={styles.momentsContainer}>
              {moments.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.momentButton,
                    moment === item.value && styles.momentButtonSelected,
                  ]}
                  onPress={() => setMoment(item.value)}
                >
                  <Text
                    style={[
                      styles.momentText,
                      moment === item.value && styles.momentTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={ajouterBudget}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Enregistrement...' : 'Enregistrer le budget'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Liste des budgets */}
        {budgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>Aucun budget</Text>
            <Text style={styles.emptyText}>
              Ajoutez votre premier budget pour commencer le suivi.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetList}
          >
            {budgets.map((budget) => (
              <Pressable
                key={budget.id}
                style={[
                  styles.budgetItem,
                  selectedBudgetId === budget.id && styles.budgetItemSelected,
                ]}
                onPress={() => setSelectedBudgetId(budget.id)}
              >
                <Text style={styles.budgetMoment}>
                  {moments.find((item) => item.value === budget.moment)?.label ||
                    budget.moment}
                </Text>

                <Text style={styles.budgetAmount}>
                  {formatMoney(Number(budget.montant_total))}
                </Text>

                <Text style={styles.budgetDate}>{budget.date}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Mes dépenses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes dépenses</Text>

          <Pressable
            style={styles.addButton}
            onPress={() => {
              if (budgets.length === 0) {
                Alert.alert('Attention', 'Ajoutez d’abord un budget.');
                return;
              }

              setEditingDepenseId(null);
              setMontantDepense('');
              setDescription('');
              setShowDepenseForm(!showDepenseForm);
            }}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </Pressable>
        </View>

        {/* Formulaire dépense */}
        {showDepenseForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingDepenseId !== null
                ? 'Modifier la dépense'
                : 'Nouvelle dépense'}
            </Text>

            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              style={styles.input}
              placeholder="Exemple : Achat de légumes"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Montant (DT)</Text>

            <TextInput
              style={styles.input}
              placeholder="Exemple : 12.500"
              keyboardType="decimal-pad"
              value={montantDepense}
              onChangeText={setMontantDepense}
            />

            <Pressable
              style={styles.saveButton}
              onPress={ajouterDepense}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? 'Enregistrement...'
                  : editingDepenseId !== null
                    ? 'Modifier la dépense'
                    : 'Enregistrer la dépense'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Liste des dépenses */}
        {selectedDepenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>Aucune dépense</Text>
            <Text style={styles.emptyText}>
              Vos dépenses apparaîtront ici.
            </Text>
          </View>
        ) : (
          selectedDepenses.map((depense) => (
            <View key={depense.id} style={styles.expenseCard}>
              <View style={styles.expenseIcon}>
                <Text>🛒</Text>
              </View>

              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>
                  {depense.description}
                </Text>
                <Text style={styles.expenseDate}>{depense.date}</Text>
              </View>

              <View style={styles.expenseActions}>
                <Text style={styles.expenseAmount}>
                  - {formatMoney(Number(depense.montant))}
                </Text>

                <View style={styles.actionButtons}>
                  <Pressable onPress={() => modifierDepense(depense)}>
                    <Text style={styles.editText}>Modifier</Text>
                  </Pressable>

                  <Pressable onPress={() => supprimerDepense(depense.id)}>
                    <Text style={styles.deleteText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F2',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64756B',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    color: '#39866B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#203D32',
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    color: '#849087',
    fontSize: 13,
    marginTop: 5,
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E3EFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 25,
  },
  summaryCard: {
    backgroundColor: '#39866B',
    marginHorizontal: 20,
    borderRadius: 23,
    padding: 22,
  },
  summaryLabel: {
    color: '#DCEDE3',
    fontSize: 14,
  },
  remainingAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallLabel: {
    color: '#DCEDE3',
    fontSize: 12,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 5,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  progressLabel: {
    color: '#DCEDE3',
    fontSize: 12,
  },
  progressPercent: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  progressBackground: {
    height: 9,
    backgroundColor: '#75A994',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 27,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#203D32',
    fontSize: 19,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: '#E3EFE6',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#39866B',
    fontWeight: '700',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },
  formTitle: {
    color: '#203D32',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 15,
  },
  inputLabel: {
    color: '#52645A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F7F8F2',
    borderWidth: 1,
    borderColor: '#E5EAE3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#203D32',
    fontSize: 14,
  },
  momentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  momentButton: {
    borderWidth: 1,
    borderColor: '#DDE6DD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  momentButtonSelected: {
    backgroundColor: '#E3EFE6',
    borderColor: '#39866B',
  },
  momentText: {
    color: '#64756B',
    fontSize: 12,
  },
  momentTextSelected: {
    color: '#287454',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#39866B',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  budgetList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  budgetItem: {
    width: 165,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE3',
    padding: 15,
    borderRadius: 16,
  },
  budgetItemSelected: {
    borderColor: '#39866B',
    backgroundColor: '#EDF5EE',
  },
  budgetMoment: {
    color: '#64756B',
    fontSize: 12,
  },
  budgetAmount: {
    color: '#203D32',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 9,
  },
  budgetDate: {
    color: '#98A39B',
    fontSize: 11,
    marginTop: 7,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 17,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#203D32',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyText: {
    color: '#89958D',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 6,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F0F3E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseName: {
    color: '#203D32',
    fontSize: 13,
    fontWeight: '700',
  },
  expenseDate: {
    color: '#98A39B',
    fontSize: 11,
    marginTop: 5,
  },
  expenseActions: {
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  expenseAmount: {
    color: '#D16C5C',
    fontSize: 13,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editText: {
    color: '#39866B',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteText: {
    color: '#D16C5C',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 30,
  },
});