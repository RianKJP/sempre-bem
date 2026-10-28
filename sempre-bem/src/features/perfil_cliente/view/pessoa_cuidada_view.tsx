import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNameInitials } from '@/core/utils/name_initials';
import { ClienteHeader } from '@/features/perfil_cliente/components/cliente_header';
import { PessoaFormModal } from '@/features/perfil_cliente/components/pessoa_form_modal';
import { ProfileMenuCard } from '@/features/perfil_cliente/components/profile_menu_card';
import { useClienteFonts } from '@/features/perfil_cliente/components/use_cliente_fonts';
import { pessoaAge, pessoasRepository, usePessoasCuidadas } from '@/features/perfil_cliente/state/pessoas_cuidadas';

export default function PessoaCuidadaScreen() {
  const router = useRouter();
  const { familiaId: familyIdParam, id } = useLocalSearchParams<{ familiaId?: string | string[]; id?: string | string[] }>();
  const familyId = Array.isArray(familyIdParam) ? familyIdParam[0] : familyIdParam ?? '1';
  const { error, loading, people, reload } = usePessoasCuidadas(familyId);
  const personId = Array.isArray(id) ? id[0] : id ?? '';
  const person = people.find(value => value.id === personId);
  const [editing, setEditing] = useState(false);
  const fontsLoaded = useClienteFonts();
  const back = () => router.canGoBack() ? router.back() : router.replace({ pathname: '/pessoas-cuidadas', params: { familiaId: familyId } });
  const unavailable = (title: string) => Alert.alert(title, 'Esta funcionalidade ainda não está integrada.');
  if (!fontsLoaded) return <View style={styles.screen} />;
  if (loading) return <View style={styles.state}><ActivityIndicator color="#713568" /></View>;
  if (error) return <SafeAreaView style={styles.screen}><View style={styles.empty}><ClienteHeader title="Pessoa cuidada" onBack={back} /><Text style={styles.subtitle}>{error}</Text><Pressable onPress={reload}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View></SafeAreaView>;
  if (!person) return <SafeAreaView style={styles.screen}><View style={styles.empty}><ClienteHeader title="Pessoa cuidada" onBack={back} /><Text style={styles.subtitle}>Cadastro não encontrado.</Text></View></SafeAreaView>;
  const healthSummary = [person.health, person.mobility, person.allergies].filter(Boolean).join(' · ');
  const careSummary = [person.restrictions, person.notes].filter(Boolean).join(' · ');
  const personalSummary = [person.birthDate, person.sex].filter(Boolean).join(' · ');

  function remove() {
    Alert.alert('Excluir cadastro', 'Remover esta pessoa cuidada? Esta ação será aplicada na API e não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { try { await pessoasRepository.remove(personId); router.replace({ pathname: '/pessoas-cuidadas', params: { familiaId: familyId } }); } catch (failure) { Alert.alert('Não foi possível excluir', failure instanceof Error ? failure.message : 'Tente novamente.'); } } },
    ]);
  }

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <ClienteHeader title="Perfil da pessoa cuidada" onBack={back} onEdit={() => setEditing(true)} />
        <View style={styles.identity}>
          <View accessibilityLabel={`Iniciais de ${person.name}`} style={[styles.avatar, styles.placeholder]}><Text style={styles.initial}>{getNameInitials(person.name)}</Text></View>
          <View style={styles.identityText}><Text style={styles.name}>{person.name}</Text><Text style={styles.subtitle}>{pessoaAge(person)} anos · {person.relationship}</Text></View>
        </View>
        <View style={styles.menu}>
          <ProfileMenuCard title="Dados pessoais" description={personalSummary} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Contato de emergência" description={person.emergencyContact || 'Nenhum contato registrado'} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Informações de saúde" description={healthSummary || 'Nenhuma informação registrada'} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Cuidados e restrições" description={careSummary || 'Nenhuma informação registrada'} onPress={() => setEditing(true)} />
          <ProfileMenuCard title="Medicamentos" description="Nenhum medicamento cadastrado" onPress={() => unavailable('Medicamentos')} />
          <ProfileMenuCard title="Alimentação" description="Controle de refeições e histórico" onPress={() => unavailable('Alimentação')} />
          <ProfileMenuCard title="Atendimentos" description="Consultar histórico de cuidados" onPress={() => router.push({ pathname: '/atendimentos', params: { familiaId: familyId } })} />
          <ProfileMenuCard title="Diário de Bordo" description="Consultar registros dos atendimentos" onPress={() => router.push({ pathname: '/diario-bordo', params: { familiaId: familyId } })} />
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={({ pressed }) => [styles.action, styles.edit, pressed && styles.pressed]}><Image source={require('@/assets/figma/pessoa-cuidada/edit-action.svg')} style={styles.actionIcon} contentFit="contain" /><Text style={styles.editText}>Editar</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={remove} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Image source={require('@/assets/figma/pessoa-cuidada/delete.svg')} style={styles.actionIcon} contentFit="contain" /><Text style={styles.deleteText}>Excluir cadastro</Text></Pressable>
        </View>
      </View>
    </ScrollView>
    {editing ? <PessoaFormModal initialValue={person} onClose={() => setEditing(false)} onSave={async input => { try { await pessoasRepository.save(input, familyId, person.id); setEditing(false); reload(); } catch (failure) { Alert.alert('Não foi possível atualizar', failure instanceof Error ? failure.message : 'Tente novamente.'); } }} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F5ED' },
  scroll: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 398, alignSelf: 'center' },
  empty: { padding: 16, gap: 24 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#A6B778' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'Poppins-SemiBold', fontSize: 27, color: '#FFFFFF' },
  identityText: { flex: 1 },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 21, lineHeight: 27.3, color: '#262326', includeFontPadding: false },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 19.5, color: '#81767B', includeFontPadding: false },
  retry: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#713568' },
  menu: { marginTop: 24, gap: 9 },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 9, marginTop: 22 },
  action: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 12 },
  edit: { borderWidth: 1.1, borderColor: '#713568', backgroundColor: '#FFFEFB' },
  actionIcon: { width: 19, height: 19 },
  editText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 24, color: '#713568', flexShrink: 1, textAlign: 'center', includeFontPadding: false },
  deleteText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 24, color: '#9B4E4E', flexShrink: 1, textAlign: 'center', includeFontPadding: false },
  pressed: { opacity: 0.65 },
});
