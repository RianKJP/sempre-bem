import { useState, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { PasswordVisibilityButton } from '@/core/components/password_visibility_button';
import { theme } from '@/core/theme/sempre_bem_theme';

type FormFieldProps = TextInputProps & { label: string; ref?: Ref<TextInput>; error?: string; cadastro?: boolean; showPasswordToggle?: boolean };

export function FormField({ label, style, onFocus, onBlur, error, cadastro, secureTextEntry, showPasswordToggle = false, ...props }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text nativeID={props.nativeID ? props.nativeID + '-label' : undefined} style={[styles.label, cadastro && styles.cadastroLabel]}>
        {label}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor={cadastro ? '#AAA2A5' : theme.colors.placeholder}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          secureTextEntry={showPasswordToggle ? !passwordVisible : secureTextEntry}
          style={[styles.input, cadastro && styles.cadastroInput, showPasswordToggle && styles.inputWithAction, focused && styles.focused, error && styles.invalid, style]}
        />
        {showPasswordToggle ? <PasswordVisibilityButton visible={passwordVisible} onPress={() => setPasswordVisible(value => !value)} /> : null}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  inputWrapper: { position: 'relative' },
  input: {
    minHeight: 46, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 10, backgroundColor: theme.colors.surface,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 12, color: theme.colors.text,
  },
  inputWithAction: { paddingRight: 52 },
  focused: { borderColor: theme.colors.primary },
  cadastroLabel: { fontFamily: 'Poppins-Medium', fontWeight: 'normal', color: '#262326', includeFontPadding: false },
  cadastroInput: { fontFamily: 'Poppins-Regular', color: '#262326', borderColor: '#DDD5D2', borderWidth: 1.1, includeFontPadding: false },
  invalid: { borderColor: '#A12636' },
  error: { color: '#A12636', fontSize: 11, lineHeight: 17, marginTop: -10 },
});

