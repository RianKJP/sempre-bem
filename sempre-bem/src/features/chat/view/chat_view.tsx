import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNameInitials } from "@/core/utils/name_initials";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";
import {
    deleteChatMessage,
    editChatMessage,
    loadChatConversation,
    sendChatMessage,
    type ChatActorType,
    type ChatConversation,
    type ChatMessage,
} from "@/features/chat/service/chat_service";

function single(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

export default function ChatView() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        atendimentoId?: string | string[];
        usuarioId?: string | string[];
        usuarioTipo?: string | string[];
    }>();
    const attendanceId = single(params.atendimentoId);
    const actorId = single(params.usuarioId);
    const actorType: ChatActorType = single(params.usuarioTipo) === "PRESTADOR" ? "PRESTADOR" : "CLIENTE";
    const fontsLoaded = useClienteFonts();
    const [conversation, setConversation] = useState<ChatConversation>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [draft, setDraft] = useState("");
    const [editing, setEditing] = useState<ChatMessage>();
    const [editDraft, setEditDraft] = useState("");
    const [working, setWorking] = useState(false);
    const scroll = useRef<ScrollView>(null);

    const load = useCallback(async (signal?: AbortSignal, showLoading = true) => {
        if (!attendanceId || !actorId) {
            setError("Não foi possível identificar este atendimento.");
            setLoading(false);
            return;
        }
        if (showLoading) setLoading(true);
        try {
            setError(undefined);
            setConversation(await loadChatConversation(attendanceId, actorType, signal));
        } catch (failure) {
            if (failure instanceof Error && failure.name === "AbortError") return;
            if (showLoading) setError(failure instanceof Error ? failure.message : "Não foi possível carregar as mensagens.");
        } finally {
            if (!signal?.aborted && showLoading) setLoading(false);
        }
    }, [actorId, actorType, attendanceId]);

    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        void load(controller.signal);
        const interval = setInterval(() => void load(controller.signal, false), 3000);
        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [load]));

    useEffect(() => {
        requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: false }));
    }, [conversation?.messages.length]);

    async function send() {
        const text = draft.trim();
        if (!attendanceId || !actorId || working) return;
        if (!text) return;
        setWorking(true);
        try {
            await sendChatMessage(attendanceId, actorId, actorType, text);
            setDraft("");
            await load(undefined, false);
            requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
        } catch (failure) {
            Alert.alert("Mensagem não enviada", failure instanceof Error ? failure.message : "Tente novamente.");
        } finally {
            setWorking(false);
        }
    }

    function openMessageOptions(message: ChatMessage) {
        if (message.authorType !== actorType || String(message.authorId) !== String(actorId)) return;
        Alert.alert("Sua mensagem", "Escolha uma ação.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Editar", onPress: () => { setEditing(message); setEditDraft(message.text); } },
            {
                text: "Excluir",
                style: "destructive",
                onPress: () => Alert.alert("Excluir mensagem?", "Esta mensagem será removida da conversa.", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Excluir", style: "destructive", onPress: () => void removeMessage(message) },
                ]),
            },
        ]);
    }

    async function removeMessage(message: ChatMessage) {
        if (!attendanceId || !actorId || working) return;
        setWorking(true);
        try {
            await deleteChatMessage(attendanceId, message.id, actorId, actorType);
            await load(undefined, false);
        } catch (failure) {
            Alert.alert("Não foi possível excluir", failure instanceof Error ? failure.message : "Tente novamente.");
        } finally {
            setWorking(false);
        }
    }

    async function saveEdit() {
        const text = editDraft.trim();
        if (!attendanceId || !actorId || !editing || !text || working) return;
        setWorking(true);
        try {
            await editChatMessage(attendanceId, editing.id, actorId, actorType, text);
            setEditing(undefined);
            setEditDraft("");
            await load(undefined, false);
        } catch (failure) {
            Alert.alert("Não foi possível editar", failure instanceof Error ? failure.message : "Tente novamente.");
        } finally {
            setWorking(false);
        }
    }

    if (!fontsLoaded) return <View style={styles.screen} />;
    const closed = Boolean(conversation && ["CANCELADO_CLIENTE", "CANCELADO_PRESTADOR", "CONCLUIDO"].includes(conversation.status));

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
                style={styles.keyboard}
            >
                <View style={styles.header}>
                    <Pressable accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace(actorType === "CLIENTE" ? "/cliente" : "/cuidador")} style={styles.backButton}>
                        <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor="#262326" />
                    </Pressable>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{getNameInitials(conversation?.contactName ?? "Contato")}</Text></View>
                    <View style={styles.headerCopy}>
                        <Text numberOfLines={1} style={styles.name}>{conversation?.contactName ?? "Conversa"}</Text>
                        <Text style={styles.subtitle}>{closed ? "Atendimento encerrado" : "Atendimento em andamento"}</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando conversa...</Text></View>
                ) : error ? (
                    <View style={styles.center}><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>
                ) : (
                    <ScrollView ref={scroll} contentContainerStyle={styles.messageList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Text style={styles.today}>Hoje</Text>
                        {!conversation?.messages.length ? <Text style={styles.emptyText}>Envie a primeira mensagem sobre este atendimento.</Text> : null}
                        {conversation?.messages.map((message) => {
                            const own = message.authorType === actorType && String(message.authorId) === String(actorId);
                            return (
                                <Pressable
                                    accessibilityLabel={`${own ? "Sua mensagem" : `Mensagem de ${conversation.contactName}`}: ${message.text}`}
                                    key={message.id}
                                    onLongPress={() => openMessageOptions(message)}
                                    style={[styles.bubble, own ? styles.sentBubble : styles.receivedBubble]}
                                >
                                    <Text style={[styles.messageText, own && styles.sentText]}>{message.text}</Text>
                                    <Text style={[styles.time, own && styles.sentTime]}>
                                        {message.edited ? "Editada · " : ""}{new Date(message.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                )}

                {closed ? <View style={styles.closedNotice}><Text style={styles.closedText}>O chat foi encerrado junto com o atendimento.</Text></View> : (
                    <View style={styles.composer}>
                        <TextInput
                            accessibilityLabel="Digite uma mensagem"
                            editable={!working && !loading && !error}
                            maxLength={2000}
                            multiline
                            onChangeText={setDraft}
                            onFocus={() => requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }))}
                            placeholder="Digite uma mensagem"
                            placeholderTextColor="#969196"
                            style={styles.input}
                            value={draft}
                        />
                        <Pressable accessibilityLabel="Enviar mensagem" disabled={working || !draft.trim()} onPress={() => void send()} style={({ pressed }) => [styles.sendButton, (!draft.trim() || working) && styles.disabled, pressed && styles.pressed]}>
                            {working ? <ActivityIndicator color="#FFFFFF" size="small" /> : <SymbolView name={{ ios: "paperplane.fill", android: "send", web: "send" }} size={21} tintColor="#FFFFFF" />}
                        </Pressable>
                    </View>
                )}
            </KeyboardAvoidingView>

            <Modal animationType="fade" onRequestClose={() => setEditing(undefined)} transparent visible={Boolean(editing)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Editar mensagem</Text>
                        <TextInput autoFocus maxLength={2000} multiline onChangeText={setEditDraft} style={styles.editInput} value={editDraft} />
                        <View style={styles.modalActions}>
                            <Pressable disabled={working} onPress={() => setEditing(undefined)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancelar</Text></Pressable>
                            <Pressable disabled={working || !editDraft.trim()} onPress={() => void saveEdit()} style={styles.modalSave}><Text style={styles.modalSaveText}>Salvar</Text></Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" },
    keyboard: { flex: 1, width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 14 },
    header: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#E5DED5", paddingVertical: 8 },
    backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF" },
    avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#713568" },
    avatarText: { color: "#FFFFFF", fontFamily: "Poppins-SemiBold", fontSize: 13 },
    headerCopy: { flex: 1, minWidth: 0 },
    name: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 16 },
    subtitle: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9, marginTop: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
    stateText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 12, textAlign: "center" },
    retry: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 12 },
    messageList: { flexGrow: 1, gap: 8, paddingVertical: 14 },
    today: { alignSelf: "center", color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9, marginBottom: 5 },
    emptyText: { alignSelf: "center", color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 11, marginTop: 24, textAlign: "center" },
    bubble: { maxWidth: "84%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 },
    sentBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4, backgroundColor: "#713568" },
    receivedBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5DED5", backgroundColor: "#FFFFFF" },
    messageText: { color: "#262326", fontFamily: "Poppins-Regular", fontSize: 12, lineHeight: 18 },
    sentText: { color: "#FFFFFF" },
    time: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 8, marginTop: 3, textAlign: "right" },
    sentTime: { color: "rgba(255,255,255,0.72)" },
    composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, borderTopWidth: 1, borderTopColor: "#DDD5D2", paddingVertical: 10 },
    input: { flex: 1, minHeight: 48, maxHeight: 110, color: "#262326", fontFamily: "Poppins-Regular", fontSize: 13, borderWidth: 1, borderColor: "#DDD5D2", borderRadius: 15, backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 11, textAlignVertical: "top" },
    sendButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: "#713568" },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.68 },
    closedNotice: { alignItems: "center", borderTopWidth: 1, borderTopColor: "#DDD5D2", paddingVertical: 15 },
    closedText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 10 },
    modalBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(38,35,38,0.55)" },
    modalCard: { width: "100%", maxWidth: 430, alignSelf: "center", borderRadius: 18, backgroundColor: "#FFFFFF", padding: 18 },
    modalTitle: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 16 },
    editInput: { minHeight: 100, maxHeight: 180, color: "#262326", fontFamily: "Poppins-Regular", fontSize: 12, borderWidth: 1, borderColor: "#DDD5D2", borderRadius: 12, marginTop: 12, padding: 12, textAlignVertical: "top" },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 14 },
    modalCancel: { minHeight: 44, justifyContent: "center", paddingHorizontal: 15 },
    modalCancelText: { color: "#713568", fontFamily: "Poppins-Medium", fontSize: 12 },
    modalSave: { minHeight: 44, justifyContent: "center", borderRadius: 10, backgroundColor: "#713568", paddingHorizontal: 20 },
    modalSaveText: { color: "#FFFFFF", fontFamily: "Poppins-SemiBold", fontSize: 12 },
});
