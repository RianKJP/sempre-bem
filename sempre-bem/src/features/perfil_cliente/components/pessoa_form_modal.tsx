import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/core/components/form_field';
import { PrimaryButton } from '@/core/components/primary_button';
import { validatePessoa, type PessoaInput, type PessoaErrors } from '@/features/perfil_cliente/state/pessoas_cuidadas';

const fields: { key: keyof PessoaInput; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Nome completo', placeholder: 'Nome da pessoa cuidada' },
  { key: 'birthDate', label: 'Data de nascimento', placeholder: 'DD/MM/AAAA' },
  { key: 'relationship', label: 'Parentesco ou vínculo', placeholder: 'Pai, mãe, outro vínculo' },
  { key: 'city', label: 'Cidade e estado', placeholder: 'São Paulo, SP' },
  { key: 'health', label: 'Informações de saúde (opcional)', placeholder: 'Condições, mobilidade e alergias' },
];

export function PessoaFormModal({ initialValue, creating, onSave, onClose }: { initialValue: PessoaInput; creating?: boolean; onSave: (input: PessoaInput) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<PessoaInput>({ ...initialValue });
  const [errors, setErrors] = useState<PessoaErrors>({});
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
          <Text style={styles.notice}>Demonstração local. Os dados ficam apenas em memória e são descartados ao reiniciar o aplicativo.</Text>
          {fields.map(({ key, label, placeholder }, index) => <FormField cadastro key={key} ref={input => { refs.current[key] = input; }} label={label} placeholder={placeholder} value={draft[key]} error={errors[key]}
            onChangeText={text => { const value = key === 'birthDate' ? text.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2') : text; setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); }}
            keyboardType={key === 'birthDate' ? 'number-pad' : 'default'} autoCapitalize={key === 'health' ? 'sentences' : 'words'} multiline={key === 'health'} style={key === 'health' ? styles.multiline : undefined}
            returnKeyType={key === 'health' ? 'default' : 'next'} submitBehavior={key === 'health' ? 'newline' : 'submit'} onSubmitEditing={() => { const nextField = fields[index + 1]; if (nextField) refs.current[nextField.key]?.focus(); }} />)}
          <PrimaryButton cadastro title={creating ? 'Cadastrar em memória' : 'Aplicar alterações'} onPress={save} />
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
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#713568' },
});
