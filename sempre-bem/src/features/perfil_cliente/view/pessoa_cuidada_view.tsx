import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClienteHeader } from '@/features/perfil_cliente/components/cliente_header';
import { PessoaFormModal } from '@/features/perfil_cliente/components/pessoa_form_modal';
import { ProfileMenuCard } from '@/features/perfil_cliente/components/profile_menu_card';
import { useClienteFonts } from '@/features/perfil_cliente/components/use_cliente_fonts';
import { pessoaAge, pessoasRepository, usePessoasCuidadas } from '@/features/perfil_cliente/state/pessoas_cuidadas';

export default function PessoaCuidadaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const people = usePessoasCuidadas();
  // Abertura direta sem parâmetro mostra a amostra do frame, se ainda existir.
  const personId = Array.isArray(id) ? id[0] : id ?? 'maria-demo';
  const person = people.find(value => value.id === personId);
  const [editing, setEditing] = useState(false);
  const fontsLoaded = useClienteFonts();
  const back = () => router.canGoBack() ? router.back() : router.replace('/pessoas-cuidadas');
  const unavailable = (title: string) => Alert.alert(title, 'Resumo demonstrativo do design. Este módulo ainda não está integrado.');
  if (!fontsLoaded) return <View style={styles.screen} />;
  if (!person) return <SafeAreaView style={styles.screen}><View style={styles.empty}><ClienteHeader title="Pessoa cuidada" onBack={back} /><Text style={styles.subtitle}>Cadastro não encontrado nesta sessão.</Text></View></SafeAreaView>;

  function remove() {
    Alert.alert('Excluir cadastro', 'Remover esta pessoa da demonstração em memória? Esta ação não afeta um banco de dados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { pessoasRepository.remove(personId); router.replace('/pessoas-cuidadas'); } },
    ]);
  }

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <ClienteHeader title="Perfil da pessoa cuidada" onBack={back} onEdit={() => setEditing(true)} />
        <View style={styles.identity}>
          {person.demo ? <Image accessibilityLabel="Foto demonstrativa de Maria Silva" source={require('@/assets/figma/pessoa-cuidada/avatar.png')} style={styles.avatar} contentFit="cover" /> : <View accessibilityLabel="Sem foto" style={[styles.avatar, styles.placeholder]}><Text style={styles.initial}>{person.name.slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.identityText}><Text style={styles.name}>{person.name}</Text><Text style={styles.subtitle}>{pessoaAge(person)} anos · {person.relationship}</Text></View>
        </View>
        <View style={styles.menu}>
          <ProfileMenuCard title="Dados pessoais" description={`Nascimento: ${person.birthDate} ${person.city}`} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Informações de saúde" description={person.health || 'Nenhuma informação registrada'} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Medicamentos" description={person.demo ? '3 medicamentos cadastrados' : 'Nenhum medicamento cadastrado'} onPress={() => unavailable('Medicamentos')} />
          <ProfileMenuCard title="Atendimentos" description={person.demo ? 'Próximo: hoje, 14:00' : 'Nenhum atendimento registrado'} onPress={() => unavailable('Atendimentos')} />
          <ProfileMenuCard title="Diário de Bordo" description={person.demo ? 'Último registro há 2 horas' : 'Nenhum registro no diário'} onPress={() => unavailable('Diário de Bordo')} />
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={({ pressed }) => [styles.action, styles.edit, pressed && styles.pressed]}><Image source={require('@/assets/figma/pessoa-cuidada/edit-action.svg')} style={styles.actionIcon} contentFit="contain" /><Text style={styles.editText}>Editar</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={remove} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Image source={require('@/assets/figma/pessoa-cuidada/delete.svg')} style={styles.actionIcon} contentFit="contain" /><Text style={styles.deleteText}>Excluir cadastro</Text></Pressable>
        </View>
      </View>
    </ScrollView>
    {editing ? <PessoaFormModal initialValue={person} onClose={() => setEditing(false)} onSave={input => { pessoasRepository.save(input, person.id); setEditing(false); }} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  scroll: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center' },
  empty: { padding: 16, gap: 24 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 1.1, borderColor: '#FFFFFF', backgroundColor: '#F4EDF3' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'Poppins-SemiBold', fontSize: 28, color: '#713568' },
  identityText: { flex: 1 },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 21, lineHeight: 27.3, color: '#262326', includeFontPadding: false },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 19.5, color: '#81767B', includeFontPadding: false },
  menu: { marginTop: 24, gap: 9 },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 9, marginTop: 22 },
  action: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 12 },
  edit: { borderWidth: 1.1, borderColor: '#713568', backgroundColor: '#FFFEFB' },
  actionIcon: { width: 19, height: 19 },
  editText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 24, color: '#713568', flexShrink: 1, textAlign: 'center', includeFontPadding: false },
  deleteText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 24, color: '#9B4E4E', flexShrink: 1, textAlign: 'center', includeFontPadding: false },
  pressed: { opacity: 0.65 },
});
