import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PeriodOption({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <View style={[styles.checkbox, checked && styles.checked]}>{checked ? <Image source={require('@/assets/figma/cadastro-profissional/check.svg')} style={styles.icon} contentFit="contain" /> : null}</View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  row: { minHeight: 40.2, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1.1, borderColor: '#DDD5D2', borderRadius: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderRadius: 2, borderColor: '#767676', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#713568', borderColor: '#713568' },
  icon: { width: 15, height: 15 },
  label: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 16.5, color: '#81767B', includeFontPadding: false },
  pressed: { opacity: 0.65 },
});
