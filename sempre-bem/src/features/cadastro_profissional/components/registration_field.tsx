import { useState, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & { label: string; error?: string; ref?: Ref<TextInput> };
export function RegistrationField({ label, error, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#AAA2A5" onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }} style={[styles.input, focused && styles.focused, error && styles.invalid, style]} />
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  field: { gap: 14 },
  label: { fontFamily: 'Poppins-Medium', fontSize: 12, lineHeight: 18, color: '#262326', includeFontPadding: false },
  input: { minHeight: 46, backgroundColor: '#FFFFFF', borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Poppins-Regular', fontSize: 12, color: '#262326', includeFontPadding: false },
  focused: { borderColor: '#713568' },
  invalid: { borderColor: '#A12636' },
  error: { marginTop: -8, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 16.5, color: '#A12636' },
});
