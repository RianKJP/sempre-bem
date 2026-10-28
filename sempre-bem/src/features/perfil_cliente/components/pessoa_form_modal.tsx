import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/core/components/form_field';
import { PrimaryButton } from '@/core/components/primary_button';
import { emptyPessoa, formatEmergencyPhone, validatePessoa, type PessoaInput, type PessoaErrors } from '@/features/perfil_cliente/state/pessoas_cuidadas';

const fields: { key: keyof PessoaInput; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Nome completo', placeholder: 'Nome da pessoa cuidada' },
  { key: 'birthDate', label: 'Data de nascimento', placeholder: 'DD/MM/AAAA' },
  { key: 'relationship', label: 'Parentesco ou vínculo', placeholder: 'Pai, mãe, outro vínculo' },
  { key: 'emergencyContact', label: 'Contato de emergência (opcional)', placeholder: '(00) 00000-0000' },
  { key: 'health', label: 'Condições de saúde (opcional)', placeholder: 'Hipertensão, diabetes ou outras condições' },
  { key: 'mobility', label: 'Mobilidade (opcional)', placeholder: 'Independente, com auxílio ou acamado' },
  { key: 'allergies', label: 'Alergias (opcional)', placeholder: 'Informe alergias conhecidas' },
  { key: 'restrictions', label: 'Restrições e necessidades (opcional)', placeholder: 'Cuidados ou necessidades especiais' },
  { key: 'notes', label: 'Observações importantes (opcional)', placeholder: 'Medicamentos, rotina e outras informações' },
];

const multilineFields = new Set<keyof PessoaInput>(['health', 'restrictions', 'notes']);

export function PessoaFormModal({ initialValue, creating, onSave, onClose }: { initialValue: PessoaInput; creating?: boolean; onSave: (input: PessoaInput) => void | Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<PessoaInput>({ ...emptyPessoa, ...initialValue });
  const [errors, setErrors] = useState<PessoaErrors>({});
  const [sexOptionsVisible, setSexOptionsVisible] = useState(false);
  const refs = useRef<Partial<Record<keyof PessoaInput, TextInput | null>>>({});
  function save() {
    const next = validatePessoa(draft);
    setErrors(next);
    const first = fields.find(field => next[field.key]);
    if (first) { refs.current[first.key]?.focus(); return; }
    try { onSave(draft); Keyboard.dismiss(); } catch { Alert.alert('Não foi possível aplicar', 'Confira os dados ou reabra o formulário.'); }
  }
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.screen}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{creating ? 'Cadastrar pessoa cuidada' : 'Editar pessoa cuidada'}</Text>
          <Text style={styles.notice}>Nome, nascimento e parentesco são obrigatórios. As demais informações podem ser preenchidas depois.</Text>
          {fields.slice(0, 3).map(({ key, label, placeholder }, index) => <FormField cadastro key={key} ref={input => { refs.current[key] = input; }} label={label} placeholder={placeholder} value={draft[key]} error={errors[key]}
            onChangeText={text => { const value = key === 'birthDate' ? text.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2') : text; setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); }}
            keyboardType={key === 'birthDate' ? 'number-pad' : 'default'} autoCapitalize={multilineFields.has(key) ? 'sentences' : 'words'} multiline={multilineFields.has(key)} style={multilineFields.has(key) ? styles.multiline : undefined}
            returnKeyType={multilineFields.has(key) ? 'default' : 'next'} submitBehavior={multilineFields.has(key) ? 'newline' : 'submit'} onSubmitEditing={() => { const nextField = fields[index + 1]; if (nextField) refs.current[nextField.key]?.focus(); }} />)}
          <View style={styles.selectGroup}>
            <Text style={styles.selectLabel}>Sexo (opcional)</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: sexOptionsVisible }}
              onPress={() => setSexOptionsVisible(value => !value)}
              style={({ pressed }) => [styles.select, pressed && styles.pressed]}
            >
              <Text style={[styles.selectValue, !draft.sex && styles.selectPlaceholder]}>{draft.sex || 'Selecione'}</Text>
              <Text style={styles.chevron}>{sexOptionsVisible ? '⌃' : '⌄'}</Text>
            </Pressable>
            {sexOptionsVisible ? <View style={styles.options}>
              {['Masculino', 'Feminino'].map(option => <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.sex === option }}
                key={option}
                onPress={() => { setDraft(previous => ({ ...previous, sex: option })); setSexOptionsVisible(false); }}
                style={({ pressed }) => [styles.option, draft.sex === option && styles.optionSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.optionText, draft.sex === option && styles.optionTextSelected]}>{option}</Text>
              </Pressable>)}
            </View> : null}
          </View>
          {fields.slice(3).map(({ key, label, placeholder }, index) => <FormField cadastro key={key} ref={input => { refs.current[key] = input; }} label={label} placeholder={placeholder} value={draft[key]} error={errors[key]}
            onChangeText={text => { const value = key === 'emergencyContact' ? formatEmergencyPhone(text) : text; setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); }}
            keyboardType={key === 'emergencyContact' ? 'phone-pad' : 'default'}
            autoCapitalize={multilineFields.has(key) ? 'sentences' : 'words'} multiline={multilineFields.has(key)} style={multilineFields.has(key) ? styles.multiline : undefined}
            returnKeyType={multilineFields.has(key) ? 'default' : 'next'} submitBehavior={multilineFields.has(key) ? 'newline' : 'submit'} onSubmitEditing={() => { const nextField = fields[index + 4]; if (nextField) refs.current[nextField.key]?.focus(); }} />)}
          <PrimaryButton cadastro title={creating ? 'Cadastrar pessoa cuidada' : 'Aplicar alterações'} onPress={save} />
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { padding: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center', gap: 20 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326' },
  notice: { fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#81767B' },
  selectGroup: { gap: 15 },
  selectLabel: { fontFamily: 'Poppins-Medium', fontSize: 12, lineHeight: 18, color: '#262326', includeFontPadding: false },
  select: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12 },
  selectValue: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 12, color: '#262326' },
  selectPlaceholder: { color: '#AAA2A5' },
  chevron: { color: '#81767B', fontSize: 17 },
  options: { marginTop: -8, overflow: 'hidden', borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 10, backgroundColor: '#FFFFFF' },
  option: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14 },
  optionSelected: { backgroundColor: '#F4EAF2' },
  optionText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#262326' },
  optionTextSelected: { fontFamily: 'Poppins-SemiBold', color: '#713568' },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#713568' },
  pressed: { opacity: 0.65 },
});
