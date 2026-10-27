import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/core/components/primary_button';
import { ClienteHeader } from '@/features/perfil_cliente/components/cliente_header';
import { PessoaFormModal } from '@/features/perfil_cliente/components/pessoa_form_modal';
import { ProfileMenuCard } from '@/features/perfil_cliente/components/profile_menu_card';
import { useClienteFonts } from '@/features/perfil_cliente/components/use_cliente_fonts';
import { emptyPessoa, pessoaAge, pessoasRepository, usePessoasCuidadas } from '@/features/perfil_cliente/state/pessoas_cuidadas';

export default function PessoasCuidadasScreen() {
  const router = useRouter();
  const people = usePessoasCuidadas();
  const [creating, setCreating] = useState(false);
  const fontsLoaded = useClienteFonts();
  if (!fontsLoaded) return <View style={styles.screen} />;
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.content}>
        <ClienteHeader title="Pessoas cuidadas" onBack={() => router.canGoBack() ? router.back() : router.replace('/perfil')} />
        <Text style={styles.notice}>Versão demonstrativa: os cadastros ficam apenas em memória.</Text>
        <View style={styles.list}>{people.map(person => <ProfileMenuCard key={person.id} title={person.name} description={`${pessoaAge(person)} anos · ${person.relationship}`} onPress={() => router.push({ pathname: '/pessoa-cuidada', params: { id: person.id } })} />)}</View>
        {!people.length ? <Text style={styles.notice}>Nenhuma pessoa cuidada cadastrada.</Text> : null}
        <PrimaryButton cadastro title="Cadastrar pessoa cuidada" onPress={() => setCreating(true)} />
      </View>
    </ScrollView>
    {creating ? <PessoaFormModal creating initialValue={emptyPessoa} onClose={() => setCreating(false)} onSave={input => { const id = pessoasRepository.save(input); setCreating(false); router.push({ pathname: '/pessoa-cuidada', params: { id } }); }} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center', gap: 24 },
  list: { gap: 9 },
  notice: { fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#81767B' },
});
