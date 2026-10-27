import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const items = [
  { label: 'Início', icon: require('@/assets/figma/perfil/home.svg') },
  { label: 'Buscar', icon: require('@/assets/figma/perfil/search.svg') },
  { label: 'Mapa', icon: require('@/assets/figma/perfil/map.svg') },
  { label: 'Mensagens', icon: require('@/assets/figma/perfil/messages.svg') },
  { label: 'Perfil', icon: require('@/assets/figma/perfil/profile.svg') },
];

// O módulo integrador pode fornecer a navegação sem acoplar o Perfil a outras rotas.
export function ProfileBottomNav({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <View style={styles.nav}>
      {items.map(item => (
        <Pressable key={item.label} accessibilityRole="tab" accessibilityState={{ selected: item.label === 'Perfil' }} onPress={() => onSelect(item.label)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <Image source={item.icon} style={styles.icon} contentFit="contain" />
          <Text style={[styles.label, item.label === 'Perfil' && styles.selected]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', height: 70, paddingTop: 8, paddingBottom: 6, paddingHorizontal: 6, borderTopWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFFFF', width: '100%', maxWidth: 430, alignSelf: 'center' },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  icon: { width: 20.994, height: 20.994 },
  label: { fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 13.5, color: '#766E72', includeFontPadding: false },
  selected: { fontFamily: 'Poppins-SemiBold', color: '#713568' },
  pressed: { opacity: 0.65 },
});
