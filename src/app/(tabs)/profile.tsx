
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
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Etudiant = {
  id: string;
  nom: string | null;
  date_naissance: string | null;
  objectifs: string | null;
  preferences_alimentaires: string | null;
};

export default function ProfileScreen() {
  const [profil, setProfil] = useState<Etudiant | null>(null);
  const [email, setEmail] = useState('');

  const [nom, setNom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [objectifs, setObjectifs] = useState('');
  const [preferences, setPreferences] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const chargerProfil = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Utilisateur non connecté.');
      }

      const { data, error } = await supabase
        .from('etudiants')
        .select(
          'id, nom, date_naissance, objectifs, preferences_alimentaires'
        )
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const etudiant = data as Etudiant;

      setProfil(etudiant);
      setEmail(user.email || '');
      setNom(etudiant.nom || '');
      setDateNaissance(etudiant.date_naissance || '');
      setObjectifs(etudiant.objectifs || '');
      setPreferences(etudiant.preferences_alimentaires || '');
    } catch (error) {
      console.log('Erreur profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerProfil();
    }, [chargerProfil])
  );

  function annulerModification() {
    if (!profil) return;

    setNom(profil.nom || '');
    setDateNaissance(profil.date_naissance || '');
    setObjectifs(profil.objectifs || '');
    setPreferences(profil.preferences_alimentaires || '');
    setEditing(false);
  }

  async function enregistrerProfil() {
    if (!profil) return;

    if (!nom.trim()) {
      Alert.alert('Attention', 'Veuillez saisir votre nom.');
      return;
    }

    const date = dateNaissance.trim();

    if (date) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

      if (!match) {
        Alert.alert(
          'Date invalide',
          'Utilisez le format AAAA-MM-JJ, exemple : 2004-05-20.'
        );
        return;
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const parsedDate = new Date(year, month - 1, day);

      if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getDate() !== day ||
        parsedDate > new Date()
      ) {
        Alert.alert('Date invalide', 'Veuillez vérifier votre date de naissance.');
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Utilisateur non connecté.');
      }

      const { error } = await supabase
        .from('etudiants')
        .update({
          nom: nom.trim(),
          date_naissance: date || null,
          objectifs: objectifs.trim() || null,
          preferences_alimentaires: preferences.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await chargerProfil();
      setEditing(false);

      Alert.alert('Succès', 'Votre profil a été modifié.');
    } catch (error) {
      console.log('Erreur modification profil:', error);
      Alert.alert('Erreur', 'Impossible de modifier le profil.');
    } finally {
      setSaving(false);
    }
  }

  const completionFields = [
    profil?.nom,
    profil?.date_naissance,
    profil?.objectifs,
    profil?.preferences_alimentaires,
  ];

  const completion = Math.round(
    (completionFields.filter(
      (value) => value && value.trim().length > 0
    ).length / 4) * 100
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#397F66" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <Text style={styles.heroSmall}>STUDENTWELL</Text>
          <Text style={styles.heroTitle}>Mon espace</Text>
          <Text style={styles.heroSubtitle}>
            Prenez soin de vous, à votre rythme.
          </Text>

          <View style={styles.heroProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nom.trim()
                  ? nom.trim().charAt(0).toUpperCase()
                  : 'S'}
              </Text>
            </View>

            <View style={styles.heroIdentity}>
              <Text style={styles.heroName}>
                {nom || 'Étudiant StudentWell'}
              </Text>
              <Text style={styles.heroEmail}>{email}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>
                  ✦  Membre StudentWell
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Completion */}
        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <View>
              <Text style={styles.completionLabel}>
                VOTRE PROFIL
              </Text>
              <Text style={styles.completionTitle}>
                {completion === 100
                  ? 'Profil complet !'
                  : 'Continuez à le compléter'}
              </Text>
            </View>

            <View style={styles.percentCircle}>
              <Text style={styles.percentText}>{completion}%</Text>
            </View>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${completion}%` },
              ]}
            />
          </View>

          <Text style={styles.completionHint}>
            {completion === 100
              ? 'Toutes vos informations sont renseignées.'
              : 'Quelques informations supplémentaires amélioreront votre expérience.'}
          </Text>
        </View>

        {/* Personal information */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>VOTRE COMPTE</Text>
          <Text style={styles.sectionTitle}>
            Informations personnelles
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldHeading}>
            <Text style={styles.fieldIcon}>👤</Text>
            <Text style={styles.fieldLabel}>Nom et prénom</Text>
          </View>
          <TextInput
            style={[styles.input, !editing && styles.readOnlyInput]}
            value={nom}
            onChangeText={setNom}
            placeholder="Votre nom et prénom"
            editable={editing}
          />

          <View style={styles.fieldHeading}>
            <Text style={styles.fieldIcon}>✉️</Text>
            <Text style={styles.fieldLabel}>Adresse email</Text>
            <Text style={styles.lockLabel}>Non modifiable</Text>
          </View>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
          />

          <View style={styles.fieldHeading}>
            <Text style={styles.fieldIcon}>🎂</Text>
            <Text style={styles.fieldLabel}>Date de naissance</Text>
          </View>
          <TextInput
            style={[styles.input, !editing && styles.readOnlyInput]}
            value={dateNaissance}
            onChangeText={setDateNaissance}
            placeholder="AAAA-MM-JJ"
            editable={editing}
          />
        </View>

        {/* Objectives */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>VOTRE BIEN-ÊTRE</Text>
          <Text style={styles.sectionTitle}>Mes objectifs</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoEmoji}>🎯</Text>
            <Text style={styles.infoBannerText}>
              Définissez vos objectifs pour personnaliser votre expérience.
            </Text>
          </View>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              !editing && styles.readOnlyInput,
            ]}
            value={objectifs}
            onChangeText={setObjectifs}
            placeholder="Exemple : manger équilibré, économiser..."
            multiline
            editable={editing}
          />
        </View>

        {/* Preferences */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>ALIMENTATION</Text>
          <Text style={styles.sectionTitle}>
            Préférences alimentaires
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoEmoji}>🥗</Text>
            <Text style={styles.infoBannerText}>
              Vos préférences aideront à adapter les recommandations de repas.
            </Text>
          </View>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              !editing && styles.readOnlyInput,
            ]}
            value={preferences}
            onChangeText={setPreferences}
            placeholder="Exemple : végétarien, sans lactose..."
            multiline
            editable={editing}
          />
        </View>

        {/* Actions */}
        {editing ? (
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={annulerModification}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={enregistrerProfil}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>
                  Enregistrer  ✓
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.editButtonText}>
              ✎   Modifier mon profil
            </Text>
          </Pressable>
        )}

        <Text style={styles.footer}>
          StudentWell • Votre bien-être au quotidien
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F1',
  },
  container: {
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#89948C',
  },

  // Header
  hero: {
    backgroundColor: '#244D3D',
    paddingHorizontal: 23,
    paddingTop: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroCircleOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    opacity: 0.045,
    top: -95,
    right: -55,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: '#B8D8C1',
    opacity: 0.08,
    bottom: -65,
    left: 100,
  },
  heroSmall: {
    color: '#B9D8C3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 10,
  },
  heroSubtitle: {
    color: '#D0DED4',
    fontSize: 13,
    marginTop: 5,
  },
  heroProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    gap: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DCECE1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#397F66',
  },
  heroIdentity: {
    flex: 1,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroEmail: {
    color: '#C6D8CC',
    fontSize: 12,
    marginTop: 4,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3C6853',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  memberBadgeText: {
    color: '#E0F0E3',
    fontSize: 10,
    fontWeight: '700',
  },

  // Completion
  completionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -1,
    padding: 19,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDE6',
    marginBottom: 28,
    shadowColor: '#244D3D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  completionLabel: {
    color: '#8A998E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  completionTitle: {
    color: '#293C33',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  percentCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5F0E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    color: '#397F66',
    fontSize: 15,
    fontWeight: '800',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#EDF1EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#5A9A78',
    borderRadius: 10,
  },
  completionHint: {
    color: '#89948C',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 17,
  },

  // Sections
  sectionHeading: {
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  sectionEyebrow: {
    color: '#6B987D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#293C33',
    fontSize: 19,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EEE8',
    shadowColor: '#244D3D',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  fieldHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  fieldIcon: {
    fontSize: 15,
    marginRight: 9,
  },
  fieldLabel: {
    color: '#52645A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  lockLabel: {
    color: '#A0AAA2',
    fontSize: 9,
  },
  input: {
    backgroundColor: '#F7F9F5',
    borderWidth: 1,
    borderColor: '#E8EDE6',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: '#293C33',
    fontSize: 13,
  },
  readOnlyInput: {
    backgroundColor: '#F0F3EF',
    color: '#68776D',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF5EE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoBannerText: {
    flex: 1,
    color: '#587362',
    fontSize: 11,
    lineHeight: 17,
  },

  // Buttons
  actions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E7ECE6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#53645A',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: '#397F66',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  editButton: {
    backgroundColor: '#397F66',
    marginHorizontal: 20,
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#397F66',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    color: '#A0AAA2',
    fontSize: 10,
    marginTop: 25,
  },
});
