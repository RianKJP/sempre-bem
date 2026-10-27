import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ClienteHeader({ title, onBack, onEdit }: { title: string; onBack: () => void; onEdit?: () => void }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Image source={require('@/assets/figma/cadastro-back.svg')} style={styles.icon} contentFit="contain" /></Pressable>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    {onEdit ? <Pressable accessibilityRole="button" accessibilityLabel="Editar pessoa cuidada" onPress={onEdit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Image source={require('@/assets/figma/pessoa-cuidada/edit.svg')} style={styles.icon} contentFit="contain" /></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  button: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 21.991, height: 21.991 },
  title: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326', includeFontPadding: false },
  pressed: { opacity: 0.65 },
});
