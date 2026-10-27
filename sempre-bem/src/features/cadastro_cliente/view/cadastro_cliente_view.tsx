import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/core/components/form_field';
import { PrimaryButton } from '@/core/components/primary_button';
import { AuthServiceError, registerClient } from '@/features/autenticacao/service/auth_service';

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirmation';
type Errors = Partial<Record<Field | 'terms' | 'form', string>>;

export default function CadastroScreen() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
  });
  const refs = useRef<Partial<Record<Field, TextInput | null>>>({});
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', phone: '', password: '', confirmation: '' });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: Field, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined, form: undefined, ...(field === 'password' ? { confirmation: undefined } : {}) }));
  }

  async function submit() {
    if (submitting) return;
    const next: Errors = {};
    if (values.name.trim().split(/\s+/).length < 2) next.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Informe um e-mail válido.';
    if (!/^\d{10,11}$/.test(values.phone.replace(/\D/g, ''))) next.phone = 'Informe o telefone com DDD (10 ou 11 dígitos).';
    if (values.password.length < 8) next.password = 'Use pelo menos 8 caracteres.';
    if (!values.confirmation || values.confirmation !== values.password) next.confirmation = 'As senhas devem ser iguais.';
    if (!accepted) next.terms = 'Aceite os termos para continuar.';
    setErrors(next);
    const first = (['name', 'email', 'phone', 'password', 'confirmation'] as Field[]).find(field => next[field]);
    if (first) { refs.current[first]?.focus(); return; }
    if (Object.keys(next).length) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const account = await registerClient({ name: values.name, email: values.email, phone: values.phone, password: values.password });
      router.replace({ pathname: '/login', params: { perfil: 'cliente', email: account.email } });
    } catch (error) {
      if (error instanceof AuthServiceError && error.code === 'DUPLICATE_EMAIL') {
        setErrors({ email: error.message });
        refs.current.email?.focus();
      } else {
        setErrors({ form: error instanceof Error ? error.message : 'Não foi possível criar a conta.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (fontError) throw fontError;
  if (!fontsLoaded) return <View style={styles.screen} />;

  const fields: { key: Field; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Nome completo', placeholder: 'Seu nome completo' },
    { key: 'email', label: 'E-mail', placeholder: 'seu@email.com' },
    { key: 'phone', label: 'Telefone', placeholder: '(11) 99999-9999' },
    { key: 'password', label: 'Senha', placeholder: 'Crie uma senha' },
    { key: 'confirmation', label: 'Confirmar senha', placeholder: 'Repita sua senha' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={4} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <Image source={require('@/assets/figma/cadastro-back.svg')} style={styles.icon} contentFit="contain" />
              </Pressable>
              <View style={styles.heading}>
                <Text style={styles.title}>Crie sua conta</Text>
                <Text style={styles.subtitle}>Comece a usar o Cuidar</Text>
              </View>
            </View>
            <View style={styles.form}>
              {fields.map(({ key, label, placeholder }, index) => (
                <FormField key={key} cadastro ref={input => { refs.current[key] = input; }} nativeID={`cadastro-${key}`} label={label} placeholder={placeholder} value={values[key]} onChangeText={value => update(key, value)} error={errors[key]}
                  keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize={key === 'name' ? 'words' : 'none'} autoCorrect={false}
                  autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'new-password'}
                  secureTextEntry={key === 'password' || key === 'confirmation'}
                  returnKeyType={index === fields.length - 1 ? 'done' : 'next'} submitBehavior="submit"
                  onSubmitEditing={() => index === fields.length - 1 ? submit() : refs.current[fields[index + 1].key]?.focus()}
                />
              ))}
              <View>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} accessibilityLabel="Li e aceito os Termos de Uso e a Política de Privacidade" hitSlop={8} onPress={() => { setAccepted(value => !value); setErrors(previous => ({ ...previous, terms: undefined })); }} style={({ pressed }) => [styles.terms, pressed && styles.pressed]}>
                  <View style={[styles.checkbox, accepted && styles.checked]}>{accepted ? <Text style={styles.checkmark}>✓</Text> : null}</View>
                  <Text style={styles.termsText}>Li e aceito os <Text style={styles.bold}>Termos de Uso</Text> e a <Text style={styles.bold}>Política de Privacidade</Text></Text>
                </Pressable>
                {errors.terms ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.terms}</Text> : null}
              </View>
              {errors.form ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.form}</Text> : null}
            </View>
            <PrimaryButton cadastro disabled={submitting} title={submitting ? 'Criando conta...' : 'Criar conta'} onPress={submit} style={styles.submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { flexGrow: 1, paddingTop: 22, paddingHorizontal: 16, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center' },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', justifyContent: 'center', alignItems: 'center' },
  icon: { width: 21.991, height: 21.991 },
  heading: { flex: 1 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326', includeFontPadding: false },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#81767B', includeFontPadding: false },
  form: { paddingTop: 26, gap: 14 },
  terms: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderRadius: 2, borderColor: '#767676', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#713568', borderColor: '#713568' },
  checkmark: { fontSize: 13, lineHeight: 17, color: '#FFFFFF', includeFontPadding: false },
  termsText: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 16.5, color: '#81767B', includeFontPadding: false },
  bold: { fontFamily: 'Poppins-Bold' },
  error: { color: '#A12636', fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 17, marginTop: 6 },
  submit: { marginTop: 38 },
  pressed: { opacity: 0.65 },
});
