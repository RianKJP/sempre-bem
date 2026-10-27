import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditProfileModal } from '@/features/perfil_cliente/components/edit_profile_modal';
import { ProfileBottomNav } from '@/features/perfil_cliente/components/profile_bottom_nav';
import { ProfileMenuCard } from '@/features/perfil_cliente/components/profile_menu_card';
import { useClienteProfile } from '@/features/perfil_cliente/state/profile';

export default function PerfilClienteScreen() {
  const router = useRouter();
  const { familiaId: familiaIdParam } = useLocalSearchParams<{ familiaId?: string | string[] }>();
  const familiaId = Array.isArray(familiaIdParam) ? familiaIdParam[0] : familiaIdParam ?? '1';
  const { error, loading, profile, reload, updateProfile } = useClienteProfile(familiaId);
  const [editing, setEditing] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
  });
  const unavailable = (title: string) => Alert.alert(title, 'Esta funcionalidade ainda não está integrada ao Perfil do Cliente.');
  const signOut = () => router.replace('/');

  if (fontError) throw fontError;
  if (!fontsLoaded) return <View style={styles.screen} />;
  if (loading) return <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando perfil...</Text></View>;
  if (error || !profile) return <View style={styles.state}><Text style={styles.stateText}>{error ?? 'Perfil não encontrado.'}</Text><Pressable onPress={reload}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Perfil</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => unavailable('Notificações')} style={({ pressed }) => [styles.notification, pressed && styles.pressed]}>
              <Image source={require('@/assets/figma/perfil/bell.svg')} style={styles.icon} contentFit="contain" />
            </Pressable>
          </View>
          <View style={styles.identity}>
            <Image accessibilityLabel={`Foto demonstrativa de ${profile.name}`} source={require('@/assets/figma/perfil/avatar.png')} style={styles.avatar} contentFit="cover" />
            <View style={styles.identityText}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>
          </View>
          <View style={styles.menu}>
            <ProfileMenuCard title="Minha conta" description="Dados pessoais e editar perfil" onPress={() => setEditing(true)} />
            <ProfileMenuCard title="Pessoas cuidadas" description="Gerenciar idosos" onPress={() => router.push('/pessoas-cuidadas')} />
            <ProfileMenuCard title="Atendimentos" description="Histórico de cuidados" onPress={() => router.push({ pathname: '/atendimentos', params: { familiaId } })} />
            <ProfileMenuCard title="Configurações" description="Conta, segurança e privacidade" onPress={() => router.push({ pathname: '/conta', params: { familiaId } })} />
            <ProfileMenuCard title="Conta" description="Sair ou excluir conta" onPress={() => router.push({ pathname: '/conta', params: { familiaId } })} />
          </View>
          <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><Text style={styles.signOutText}>Sair</Text></Pressable>
        </View>
      </ScrollView>
      <ProfileBottomNav familiaId={familiaId} selected="Perfil" />
      {editing ? <EditProfileModal initialValue={profile} onClose={() => setEditing(false)} onSave={async value => { try { await updateProfile(value); setEditing(false); } catch (failure) { Alert.alert('Não foi possível atualizar', failure instanceof Error ? failure.message : 'Tente novamente.'); } }} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F8F5ED' },
  stateText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#81767B', textAlign: 'center' },
  retry: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#713568' },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center' },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 18, lineHeight: 27, color: '#262326', includeFontPadding: false },
  notification: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 21.991, height: 21.991 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 1.1, borderColor: '#FFFFFF', backgroundColor: '#F4EDF3' },
  identityText: { flex: 1 },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 21, lineHeight: 27.3, color: '#262326', includeFontPadding: false },
  email: { fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 19.5, color: '#81767B', includeFontPadding: false },
  menu: { marginTop: 24, gap: 9 },
  signOut: { minHeight: 48, marginTop: 9, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  signOutText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 24, color: '#9B4E4E', includeFontPadding: false },
  pressed: { opacity: 0.65 },
});
