import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { title: string; description: string; onPress: () => void };

export function ProfileMenuCard({ title, description, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Image source={require('@/assets/figma/perfil/chevron.svg')} style={styles.icon} contentFit="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 72.2, padding: 14, borderRadius: 14, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', boxShadow: '0px 2px 5px rgba(55,35,45,0.08)' },
  content: { flex: 1 },
  title: { fontFamily: 'Poppins-Bold', fontSize: 13, lineHeight: 19.5, paddingTop: 3.3, paddingBottom: 1.2, color: '#262326', includeFontPadding: false },
  description: { fontFamily: 'Poppins-Regular', fontSize: 10, lineHeight: 15, paddingTop: 3, color: '#81767B', includeFontPadding: false },
  icon: { width: 21.991, height: 21.991 },
  pressed: { opacity: 0.65 },
});
