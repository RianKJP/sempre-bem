import { useState, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { PasswordVisibilityButton } from '@/core/components/password_visibility_button';

type Props = TextInputProps & { label: string; error?: string; ref?: Ref<TextInput>; showPasswordToggle?: boolean };
export function RegistrationField({ label, error, style, onFocus, onBlur, secureTextEntry, showPasswordToggle = false, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#AAA2A5" onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }} secureTextEntry={showPasswordToggle ? !passwordVisible : secureTextEntry} style={[styles.input, showPasswordToggle && styles.inputWithAction, focused && styles.focused, error && styles.invalid, style]} />
      {showPasswordToggle ? <PasswordVisibilityButton visible={passwordVisible} onPress={() => setPasswordVisible(value => !value)} /> : null}
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  field: { gap: 14 },
  label: { fontFamily: 'Poppins-Medium', fontSize: 12, lineHeight: 18, color: '#262326', includeFontPadding: false },
  inputWrapper: { position: 'relative' },
  input: { minHeight: 46, backgroundColor: '#FFFFFF', borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Poppins-Regular', fontSize: 12, color: '#262326', includeFontPadding: false },
  inputWithAction: { paddingRight: 52 },
  focused: { borderColor: '#713568' },
  invalid: { borderColor: '#A12636' },
  error: { marginTop: -8, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 16.5, color: '#A12636' },
});
