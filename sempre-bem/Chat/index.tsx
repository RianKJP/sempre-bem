import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClienteFonts } from '@/components/cliente/useClienteFonts';
import { chatStorage, type LocalConversation, type LocalMessage } from '@/services/chatStorage';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;
  const fontsLoaded = useClienteFonts();
  const [conversation, setConversation] = useState<LocalConversation | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<LocalMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const reload = useCallback(async () => {
    if (!conversationId) { setError('Identificador de conversa inválido.'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const found = await chatStorage.getConversation(conversationId);
      if (!found) { setConversation(null); setMessages([]); setError('Esta conversa não está salva neste aparelho.'); return; }
      setConversation(found);
      setMessages(await chatStorage.listMessages(conversationId));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível carregar as mensagens.');
    } finally { setLoading(false); }
  }, [conversationId]);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  async function send() {
    if (!conversationId || working) return;
    if (!draft.trim()) { Alert.alert('Mensagem vazia', 'Digite uma mensagem antes de enviar.'); return; }
    if (draft.trim().length > 2000) { Alert.alert('Mensagem muito longa', 'Use até 2.000 caracteres.'); return; }
    setWorking(true);
    try {
      await chatStorage.createMessage(conversationId, draft);
      setDraft('');
      await reload();
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
    } catch (failure) { Alert.alert('Não foi possível salvar', failure instanceof Error ? failure.message : 'Tente novamente.'); }
    finally { setWorking(false); }
  }

  function messageOptions(message: LocalMessage) {
    Alert.alert('Sua mensagem', 'Escolha uma ação para esta mensagem salva localmente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => { setEditing(message); setEditDraft(message.text); } },
      { text: 'Excluir', style: 'destructive', onPress: () => Alert.alert('Excluir mensagem?', 'A mensagem será removida deste aparelho.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          if (!conversationId || working) return;
          setWorking(true);
          try { await chatStorage.removeMessage(conversationId, message.id); await reload(); }
          catch (failure) { Alert.alert('Não foi possível excluir', failure instanceof Error ? failure.message : 'Tente novamente.'); }
          finally { setWorking(false); }
        } },
      ]) },
    ]);
  }

  async function saveEdit() {
    if (!conversationId || !editing || working) return;
    if (!editDraft.trim()) { Alert.alert('Mensagem vazia', 'Digite um texto antes de salvar.'); return; }
    setWorking(true);
    try { await chatStorage.updateMessage(conversationId, editing.id, editDraft); setEditing(null); setEditDraft(''); await reload(); }
    catch (failure) { Alert.alert('Não foi possível editar', failure instanceof Error ? failure.message : 'Tente novamente.'); }
    finally { setWorking(false); }
  }

  if (!fontsLoaded) return <SafeAreaView style={styles.screen} />;
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/mensagens')} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ExpoImage source={require('../../../assets/figma/cadastro-back.svg')} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.name}>{conversation?.participantName ?? 'Conversa'}</Text>
            <Text style={styles.subtitle}>Conversa demonstrativa · somente neste aparelho</Text>
          </View>
          <Image source={require('../../../assets/figma/pessoa-cuidada/avatar.png')} style={styles.avatar} resizeMode="cover" accessibilityLabel="Imagem demonstrativa do contato" />
        </View>

        <View style={styles.notice}><Text style={styles.noticeText}>Mensagens locais. Não são enviadas para outra pessoa.</Text></View>
        {loading ? <View style={styles.center}><Text style={styles.state}>Carregando mensagens…</Text></View> : error ? <View style={styles.center}><Text style={styles.state}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void reload()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : (
          <ScrollView ref={scroll} style={styles.messages} contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyMessages]} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
            <Text style={styles.today}>Hoje</Text>
            {messages.length === 0 ? <Text style={styles.emptyText}>Ainda não há mensagens nesta conversa.</Text> : null}
            {messages.map(message => (
              <Pressable key={message.id} accessibilityRole="button" accessibilityLabel={`${message.text}${message.edited ? ', editada' : ''}. Toque e segure para editar ou excluir.`} onLongPress={() => messageOptions(message)} style={({ pressed }) => [styles.sentBubble, pressed && styles.pressed]}>
                <Text style={styles.sentText}>{message.text}</Text>
                <Text style={styles.time}>{message.edited ? 'Editada · ' : ''}{new Date(message.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Digite uma mensagem"
            value={draft}
            onChangeText={setDraft}
            placeholder="Digite uma mensagem"
            placeholderTextColor="#969196"
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => void send()}
            style={styles.input}
            editable={!working && !loading && !error}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Salvar mensagem neste aparelho" accessibilityState={{ disabled: working }} disabled={working || loading || !!error} onPress={() => void send()} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
            <Text style={styles.sendIcon}>›</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar mensagem</Text>
            <TextInput value={editDraft} onChangeText={setEditDraft} maxLength={2000} multiline autoFocus style={styles.editInput} accessibilityLabel="Editar texto da mensagem" />
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" onPress={() => setEditing(null)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancelar</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void saveEdit()} style={styles.modalSave}><Text style={styles.modalSaveText}>Salvar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5ED' },
  keyboard: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 14 },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 11 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.1, borderColor: '#DDD5D2', backgroundColor: '#FFFEFB', alignItems: 'center', justifyContent: 'center' },
  backIcon: { width: 22, height: 22 },
  headerText: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 17, lineHeight: 25, color: '#262326', includeFontPadding: false },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 14, color: '#81767B', includeFontPadding: false },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#F4EDF3' },
  notice: { marginBottom: 7, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, backgroundColor: '#F0E9F1' },
  noticeText: { fontFamily: 'Poppins-Regular', fontSize: 8, lineHeight: 12, color: '#713568', textAlign: 'center', includeFontPadding: false },
  messages: { flex: 1 },
  messageList: { flexGrow: 1, gap: 10, paddingVertical: 16, alignItems: 'flex-end' },
  emptyMessages: { justifyContent: 'flex-start' },
  today: { alignSelf: 'center', marginBottom: 2, fontFamily: 'Poppins-Regular', fontSize: 9, lineHeight: 14, color: '#81767B', includeFontPadding: false },
  emptyText: { alignSelf: 'center', marginTop: 12, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 17, color: '#81767B', textAlign: 'center', includeFontPadding: false },
  sentBubble: { maxWidth: '88%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderBottomRightRadius: 4, backgroundColor: '#713568' },
  sentText: { fontFamily: 'Poppins-Regular', fontSize: 10, lineHeight: 16, color: '#FFFFFF', includeFontPadding: false },
  time: { marginTop: 3, fontFamily: 'Poppins-Regular', fontSize: 8, lineHeight: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right', includeFontPadding: false },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  state: { fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 17, color: '#81767B', textAlign: 'center', includeFontPadding: false },
  retry: { marginTop: 8, fontFamily: 'Poppins-SemiBold', fontSize: 11, lineHeight: 17, color: '#713568', includeFontPadding: false },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderColor: '#DDD5D2' },
  input: { flex: 1, minHeight: 50, maxHeight: 100, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#DDD5D2', borderRadius: 10, backgroundColor: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 20, color: '#262326', includeFontPadding: false },
  sendButton: { width: 46, height: 50, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#713568' },
  sendIcon: { marginTop: -5, fontFamily: 'Poppins-Regular', fontSize: 34, lineHeight: 42, color: '#FFFFFF' },
  pressed: { opacity: 0.65 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.36)' },
  modalCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFFEFB' },
  modalTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, lineHeight: 23, color: '#262326', includeFontPadding: false },
  editInput: { minHeight: 92, maxHeight: 180, marginTop: 12, padding: 12, borderWidth: 1, borderColor: '#DDD5D2', borderRadius: 10, fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, color: '#262326', textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalCancel: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14 },
  modalCancelText: { fontFamily: 'Poppins-Medium', fontSize: 11, lineHeight: 17, color: '#713568', includeFontPadding: false },
  modalSave: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#713568' },
  modalSaveText: { fontFamily: 'Poppins-SemiBold', fontSize: 11, lineHeight: 17, color: '#FFFFFF', includeFontPadding: false },
});
