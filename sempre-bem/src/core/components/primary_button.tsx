import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { theme } from '@/core/theme/sempre_bem_theme';

type PrimaryButtonProps = Omit<PressableProps, 'children'> & { title: string; cadastro?: boolean };

export function PrimaryButton({ title, disabled, style, cadastro, ...props }: PrimaryButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        cadastro && styles.cadastroButton,
        (state.pressed || disabled) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[styles.text, cadastro && styles.cadastroText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: theme.colors.primary, borderRadius: 12,
    boxShadow: '0px 6px 12px rgba(116, 54, 108, 0.14)',
  },
  text: { fontSize: 16, fontWeight: '700', lineHeight: 24, color: theme.colors.surface },
  dimmed: { opacity: 0.75 },
  cadastroButton: { backgroundColor: '#713568', boxShadow: '0px 5px 12px rgba(113,53,104,0.2)' },
  cadastroText: { fontFamily: 'Poppins-SemiBold', fontWeight: 'normal', includeFontPadding: false },
});
