import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/core/components/primary_button';
import { useClienteFonts } from '@/features/perfil_cliente/components/use_cliente_fonts';

export type RegistrationStep = 1 | 2;
type Props = { step: RegistrationStep; children: ReactNode; buttonTitle: string; submitting?: boolean; onSubmit: () => void; onBack: () => void; onStep: (step: RegistrationStep) => void };
const labels = ['Dados pessoais', 'Profissional'];

export function RegistrationLayout({ step, children, buttonTitle, submitting = false, onSubmit, onBack, onStep }: Props) {
  const loaded = useClienteFonts();
  if (!loaded) return <View style={styles.screen} />;
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Image source={require('@/assets/figma/cadastro-back.svg')} style={styles.icon} contentFit="contain" /></Pressable>
            <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Quero cuidar</Text><Text style={styles.subtitle}>Crie seu perfil profissional</Text></View>
          </View>
          <View accessibilityRole="tablist" style={styles.steps}>{labels.map((label, index) => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: step === index + 1 }} onPress={() => onStep((index + 1) as RegistrationStep)} hitSlop={{ top: 5, bottom: 5 }} style={({ pressed }) => [styles.step, index < step && styles.stepActive, pressed && styles.pressed]}><Text style={[styles.stepText, index < step && styles.stepTextActive]}>{label}</Text></Pressable>)}</View>
          <Text style={styles.progress}>{step} de 2</Text>
          {children}
        </View>
      </ScrollView>
      <View style={styles.footer}><View style={styles.footerContent}><PrimaryButton cadastro disabled={submitting} title={submitting ? 'Salvando...' : buttonTitle} onPress={onSubmit} /></View></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { flexGrow: 1, paddingTop: 22, paddingHorizontal: 16, paddingBottom: 24 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center' },
  header: { minHeight: 54, flexDirection: 'row', gap: 10, alignItems: 'center' },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 21.991, height: 21.991 },
  heading: { flex: 1 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326', includeFontPadding: false },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#81767B', includeFontPadding: false },
  steps: { flexDirection: 'row', marginTop: 18 },
  step: { flex: 1, paddingVertical: 8, borderBottomWidth: 2.2, borderColor: '#DDD7D4', alignItems: 'center' },
  stepActive: { borderColor: '#713568' },
  stepText: { fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 13.5, color: '#81767B', includeFontPadding: false },
  stepTextActive: { color: '#713568' },
  progress: { fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 13.5, paddingTop: 3, color: '#81767B', textAlign: 'right', includeFontPadding: false },
  footer: { backgroundColor: 'rgba(248,245,237,0.95)', borderTopWidth: 1.1, borderColor: '#DDD5D2', paddingTop: 10, paddingBottom: 16, paddingHorizontal: 14 },
  footerContent: { width: '100%', maxWidth: 402, alignSelf: 'center' },
  pressed: { opacity: 0.65 },
});
