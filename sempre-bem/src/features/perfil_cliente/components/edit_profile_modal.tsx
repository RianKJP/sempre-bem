import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '@/core/components/form_field';
import { PrimaryButton } from '@/core/components/primary_button';
import { validateProfile, type ClienteProfileInput, type ProfileErrors } from '@/features/perfil_cliente/state/profile';

type Props = { initialValue: ClienteProfileInput; onSave: (value: ClienteProfileInput) => void; onClose: () => void };

// Montado somente ao abrir: cancelar descarta o rascunho sem alterar o perfil.
export function EditProfileModal({ initialValue, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ClienteProfileInput>({ name: initialValue.name, email: initialValue.email });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  function save() {
    const next = validateProfile(draft);
    setErrors(next);
    if (next.name) { nameRef.current?.focus(); return; }
    if (next.email) { emailRef.current?.focus(); return; }
    Keyboard.dismiss();
    onSave(draft);
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll}>
            <View style={styles.content}>
              <Text accessibilityRole="header" style={styles.title}>Minha conta</Text>
              <Text style={styles.notice}>Edição demonstrativa. As alterações ficam apenas nesta tela e não são salvas ao reabrir o aplicativo.</Text>
              <FormField cadastro ref={nameRef} label="Nome completo" value={draft.name} onChangeText={name => { setDraft(value => ({ ...value, name })); setErrors(value => ({ ...value, name: undefined })); }} error={errors.name} autoCapitalize="words" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailRef.current?.focus()} />
              <FormField cadastro ref={emailRef} label="E-mail" value={draft.email} onChangeText={email => { setDraft(value => ({ ...value, email })); setErrors(value => ({ ...value, email: undefined })); }} error={errors.email} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" returnKeyType="done" onSubmitEditing={save} />
              <PrimaryButton cadastro title="Aplicar alterações" onPress={save} />
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { flexGrow: 1, padding: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center', gap: 20 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326' },
  notice: { fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#81767B' },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#713568' },
});
