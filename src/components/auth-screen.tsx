
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Information', 'Veuillez remplir tous les champs.');
      return;
    }

    if (isSignUp && !nom.trim()) {
      Alert.alert('Information', 'Veuillez saisir votre nom.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Mot de passe invalide',
        'Le mot de passe doit contenir au moins 6 caractères.'
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              nom: nom.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          Alert.alert('Bienvenue !', 'Votre compte a été créé avec succès.');
        } else {
          Alert.alert(
            'Inscription réussie',
            'Consultez votre boîte mail pour confirmer votre adresse email.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.';

      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsSignUp(!isSignUp);
    setNom('');
    setPassword('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content"  />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative background */}
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>

          <Text style={styles.logoText}>StudentWell</Text>
          <Text style={styles.logoSubtitle}>
            Eat well. Live better.
          </Text>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isSignUp ? 'Rejoignez-nous !' : 'Bon retour !'}
          </Text>

          <Text style={styles.welcomeDescription}>
            {isSignUp
              ? 'Créez votre compte et commencez votre parcours vers un meilleur équilibre.'
              : 'Connectez-vous et continuez à prendre soin de vous.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.modeContainer}>
            <Pressable
              style={[
                styles.modeButton,
                !isSignUp && styles.activeMode,
              ]}
              onPress={() => setIsSignUp(false)}
            >
              <Text
                style={[
                  styles.modeText,
                  !isSignUp && styles.activeModeText,
                ]}
              >
                Connexion
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeButton,
                isSignUp && styles.activeMode,
              ]}
              onPress={() => setIsSignUp(true)}
            >
              <Text
                style={[
                  styles.modeText,
                  isSignUp && styles.activeModeText,
                ]}
              >
                Inscription
              </Text>
            </Pressable>
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor="#A4AEA6"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor="#A4AEA6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 caractères"
              placeholderTextColor="#A4AEA6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {isSignUp ? "Créer mon compte  →" : 'Se connecter  →'}
              </Text>
            )}
          </Pressable>

          <View style={styles.switchContainer}>
            <Text style={styles.switchDescription}>
              {isSignUp
                ? 'Vous avez déjà un compte ? '
                : "Vous n'avez pas de compte ? "}
            </Text>

            <Pressable onPress={switchMode}>
              <Text style={styles.switchLink}>
                {isSignUp ? 'Connexion' : "S'inscrire"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom text */}
        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>💚</Text>
          <Text style={styles.footerText}>
            Votre bien-être commence aujourd'hui.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 35,
    overflow: 'hidden',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E7F0E4',
    top: -115,
    right: -90,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#EDF2E8',
    bottom: -75,
    left: -90,
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoContainer: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#E2EFE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 32,
  },
  logoText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#34765B',
    letterSpacing: -0.7,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#87968A',
    marginTop: 5,
    letterSpacing: 1,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 29,
    fontWeight: '800',
    color: '#263C30',
    marginBottom: 10,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#839087',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EDF0E9',
    shadowColor: '#526B56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F5EF',
    borderRadius: 13,
    padding: 4,
    marginBottom: 25,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeMode: {
    backgroundColor: '#397F66',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#849087',
  },
  activeModeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 19,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#35483C',
    marginBottom: 9,
  },
  input: {
    height: 53,
    backgroundColor: '#F7F9F5',
    borderWidth: 1,
    borderColor: '#E9EEE7',
    borderRadius: 13,
    paddingHorizontal: 15,
    color: '#293C33',
    fontSize: 14,
  },
  submitButton: {
    height: 55,
    backgroundColor: '#397F66',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#397F66',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 23,
  },
  switchDescription: {
    fontSize: 12,
    color: '#89948B',
  },
  switchLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#397F66',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerEmoji: {
    fontSize: 19,
    marginBottom: 7,
  },
  footerText: {
    fontSize: 12,
    color: '#89968C',
  },
});
