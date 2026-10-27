import { useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { registerProfessional } from '@/features/autenticacao/service/auth_service';
import { PeriodOption } from '@/features/cadastro_profissional/components/period_option';
import { RegistrationField } from '@/features/cadastro_profissional/components/registration_field';
import { RegistrationLayout, type RegistrationStep } from '@/features/cadastro_profissional/components/registration_layout';
import { periods, resetAvailabilityDraft, weekDays, updateAvailability, useAvailabilityDraft, validateAvailability, type AvailabilityErrors } from '@/features/cadastro_profissional/state/availability';
import { resetPersonalDraft, usePersonalDraft, validatePersonal } from '@/features/cadastro_profissional/state/draft';

export default function CadastroDisponibilidadeScreen() {
  const router = useRouter();
  const draft = useAvailabilityDraft();
  const personal = usePersonalDraft();
  const [errors, setErrors] = useState<AvailabilityErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const radiusRef = useRef<TextInput>(null);
  function selectStep(step: RegistrationStep) {
    if (step === 1) router.navigate('./cadastro-dados');
    if (step === 2) Alert.alert('Etapa Profissional pendente', 'A etapa 2 de 3 ainda não foi implementada.');
  }
  async function submit() {
    if (submitting) return;
    if (Object.keys(validatePersonal(personal)).length) {
      Alert.alert('Dados incompletos', 'Revise seus dados pessoais e de acesso antes de concluir o cadastro.', [
        { text: 'Revisar', onPress: () => router.replace('/cadastro-dados') },
      ]);
      return;
    }
    const next = validateAvailability(draft);
    setErrors(next);
    if (Object.keys(next).length) { if (!next.days && !next.periods && next.radius) radiusRef.current?.focus(); return; }
    Keyboard.dismiss();
    setFormError(undefined);
    setSubmitting(true);
    try {
      const account = await registerProfessional({ personal, availability: draft });
      resetPersonalDraft();
      resetAvailabilityDraft();
      router.replace({ pathname: '/login', params: { perfil: 'profissional', email: account.email } });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível criar o perfil profissional.');
    } finally {
      setSubmitting(false);
    }
  }
  return <RegistrationLayout step={3} buttonTitle="Criar perfil profissional" submitting={submitting} onSubmit={submit} onBack={() => router.canGoBack() ? router.back() : router.replace('./cadastro-dados')} onStep={selectStep}>
    <Text style={[styles.label, styles.daysLabel]}>Dias disponíveis</Text>
    <View style={styles.days}>{weekDays.map(day => {
      const selected = draft.days.includes(day);
      return <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={day} accessibilityState={{ checked: selected }} hitSlop={{ top: 4, bottom: 4 }} onPress={() => { updateAvailability({ ...draft, days: selected ? draft.days.filter(value => value !== day) : [...draft.days, day] }); setErrors(previous => ({ ...previous, days: undefined })); }} style={({ pressed }) => [styles.day, selected && styles.selectedDay, pressed && styles.pressed]}><Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text></Pressable>;
    })}</View>
    {errors.days ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.days}</Text> : null}
    <Text style={[styles.label, styles.periodsLabel]}>Horários</Text>
    <View style={styles.periods}>{periods.map(period => <PeriodOption key={period} label={period} checked={draft.periods.includes(period)} onPress={() => { updateAvailability({ ...draft, periods: draft.periods.includes(period) ? draft.periods.filter(value => value !== period) : [...draft.periods, period] }); setErrors(previous => ({ ...previous, periods: undefined })); }} />)}</View>
    {errors.periods ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.periods}</Text> : null}
    <View style={styles.availableCard}>
      <View style={styles.availableText}><Text style={styles.availableTitle}>Disponível agora</Text><Text style={styles.availableDescription}>Receber solicitações imediatas</Text></View>
      <Pressable accessibilityRole="switch" accessibilityLabel="Disponível agora" accessibilityState={{ checked: draft.availableNow }} hitSlop={8} onPress={() => updateAvailability({ ...draft, availableNow: !draft.availableNow })} style={({ pressed }) => [styles.toggle, draft.availableNow && styles.toggleOn, pressed && styles.pressed]}><View style={[styles.thumb, draft.availableNow && styles.thumbOn]} /></Pressable>
    </View>
    <View style={styles.radius}><RegistrationField ref={radiusRef} label="Raio de atendimento" placeholder="Até 10 km" value={draft.radius} onChangeText={radius => { updateAvailability({ ...draft, radius }); setErrors(previous => ({ ...previous, radius: undefined })); }} error={errors.radius} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={submit} /></View>
    {formError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{formError}</Text> : null}
  </RegistrationLayout>;
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Poppins-Medium', fontSize: 12, lineHeight: 18, color: '#262326', includeFontPadding: false },
  daysLabel: { marginTop: 12 },
  days: { marginTop: 7, flexDirection: 'row', gap: 4 },
  day: { flex: 1, minHeight: 35, padding: 7, borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 999, backgroundColor: '#FFFEFB', justifyContent: 'center', alignItems: 'center' },
  selectedDay: { backgroundColor: '#713568', borderColor: '#713568' },
  dayText: { fontFamily: 'Poppins-Regular', fontSize: 10, lineHeight: 15, color: '#81767B', includeFontPadding: false },
  selectedDayText: { color: '#FFFFFF' },
  periodsLabel: { marginTop: 18 },
  periods: { marginTop: 7, gap: 7 },
  availableCard: { marginTop: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1.1, borderRadius: 14, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', boxShadow: '0px 2px 5px rgba(55,35,45,0.08)' },
  availableText: { flex: 1 },
  availableTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, lineHeight: 24, color: '#262326', includeFontPadding: false },
  availableDescription: { fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 13.5, color: '#81767B', includeFontPadding: false },
  toggle: { width: 48, height: 27, padding: 3, borderRadius: 99, backgroundColor: '#AAA2A5', justifyContent: 'center' },
  toggleOn: { backgroundColor: '#94AA32' },
  thumb: { width: 21, height: 21, borderRadius: 10.5, backgroundColor: '#FFFFFF' },
  thumbOn: { alignSelf: 'flex-end' },
  radius: { marginTop: 14, paddingBottom: 13 },
  error: { marginTop: 6, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 16.5, color: '#A12636' },
  pressed: { opacity: 0.65 },
});
