/**
 * SEMPRE BEM — entrega consolidada de Vitor.
 * Mapeamento do projeto original:
 * Telas: src/app/idosos/{index,cadastrar,editar,detalhes}.tsx;
 * src/app/avaliacoes.tsx. Detalhes de idoso foi implementado nesta entrega.
 * Componentes: src/components/idoso-form.tsx e care-header.tsx.
 * Serviços: src/services/idososStorage.ts e avaliacoesStorage.ts.
 * Visual: src/constants/care-design.ts; assets/images/sempre-bem-logo.png
 * (imagem incorporada em base64, sem necessidade de arquivo adicional).
 * Entrada e navegação originais: src/app/index.tsx e src/app/_layout.tsx;
 * substituídas aqui por menu, contexto e histórico internos.
 * Testes relacionados: tests/avaliacoesStorage.test.cjs.
 * Verificação: TypeScript strict isolado sem erros; quatro testes de avaliações
 * reaplicados aos serviços consolidados e CRUD de idosos com storage simulado.
 * Seleção de fotos e layout ainda precisam de teste manual no dispositivo destino.
 * Integração: copie esta pasta para o projeto destino e renderize o default export
 * <SempreBemVitor /> em uma tela. Com Expo Router, reexporte o default em uma rota.
 * Não é necessário copiar serviços, componentes, aliases ou imagens do original.
 * Dependências: react, react-native, expo, @react-native-async-storage/async-storage,
 * expo-image-picker, expo-file-system, react-native-safe-area-context.
 * Instalação no destino: npx expo install @react-native-async-storage/async-storage
 * expo-image-picker expo-file-system react-native-safe-area-context
 * (execute o comando acima em uma linha). Use versões compatíveis com o SDK destino.
 * Props: telaInicial opcional ('/' | '/idosos' | '/idosos/cadastrar' | '/avaliacoes'),
 * onSair opcional para retornar ao aplicativo hospedeiro a partir do menu.
 * Persistência: mesmas chaves @sempre_bem:idosos e @sempre_bem:avaliacoes.
 * Avaliações mantêm vínculo textual, sem exclusão em cascata ao remover um idoso.
 * Idoso exige apenas nome e nascimento preenchidos, conforme regra original.
 * Fotos nativas são copiadas para documentos; na web usa-se data URI.
 * O hospedeiro não deve gravar simultaneamente pelas cópias antigas dos serviços.
 */
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { EffectCallback } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

type RotaVitor = '/' | '/idosos' | '/idosos/cadastrar' | '/idosos/editar' | '/idosos/detalhes' | '/avaliacoes';
type DestinoVitor = RotaVitor | { pathname: RotaVitor; params: { id: string } };
type EntradaVitor = { pathname: RotaVitor; params: { id?: string } };
type NavegacaoVitor = { push: (destino: DestinoVitor) => void; replace: (destino: DestinoVitor) => void; back: () => void; canGoBack: () => boolean; params: { id?: string } };
const ContextoVitor = createContext<NavegacaoVitor | null>(null);
function useRouter(): NavegacaoVitor {
  const valor = useContext(ContextoVitor);
  if (!valor) throw new Error('Renderize as telas dentro de SempreBemVitor.');
  return valor;
}
function useLocalSearchParams() { return useRouter().params; }
// As telas são remontadas ao navegar; o efeito recarrega a persistência ao retornar.
function useFocusEffect(efeito: EffectCallback) { useEffect(efeito, [efeito]); }
function avisar(titulo: string, mensagem?: string) {
  if (Platform.OS === 'web') window.alert([titulo, mensagem].filter(Boolean).join('\n'));
  else Alert.alert(titulo, mensagem);
}


// Origem: src/constants/care-design.ts
const careColors = {
  background: '#F8F5ED',
  primary: '#74366F',
  text: '#302D31',
  muted: '#8D858C',
  border: '#E2DCD9',
  green: '#A6BC80',
};

const careStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: careColors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, paddingTop: 32, paddingBottom: 40 },
  title: { fontSize: 23, fontWeight: '700', color: careColors.text, marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 20, color: careColors.muted, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '500', color: careColors.text, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: careColors.border, borderRadius: 10, padding: 14, fontSize: 14, color: careColors.text, marginBottom: 20, minHeight: 48 },
  button: { backgroundColor: careColors.primary, minHeight: 48, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 10px #74366F25' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});


// Origem: src/services/idososStorage.ts
const CHAVE_IDOSOS = '@sempre_bem:idosos';

type Idoso = {
  id: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  endereco: string;
  informacoes: string;
  restricoes: string;
  contatoEmergencia: string;
  relacao?: string;
  condicoesSaude?: string;
  mobilidade?: string;
  alergias?: string;
  fotoUri?: string;
};

async function listarIdosos(): Promise<Idoso[]> {
  try {
    const dados = await AsyncStorage.getItem(CHAVE_IDOSOS);

    if (!dados) {
      return [];
    }

    return JSON.parse(dados);
  } catch (erro) {
    console.log('Erro ao listar idosos:', erro);
    return [];
  }
}

async function adicionarIdoso(
  idoso: Idoso
): Promise<void> {
  try {
    const idosos = await listarIdosos();

    const novaLista = [
      ...idosos,
      idoso,
    ];

    await AsyncStorage.setItem(
      CHAVE_IDOSOS,
      JSON.stringify(novaLista)
    );
  } catch (erro) {
    console.log(
      'Erro ao adicionar idoso:',
      erro
    );

    throw erro;
  }
}

async function buscarIdosoPorId(
  id: string
): Promise<Idoso | undefined> {
  try {
    const idosos = await listarIdosos();

    const idosoEncontrado = idosos.find(
      (idoso) => idoso.id === id
    );

    return idosoEncontrado;
  } catch (erro) {
    console.log(
      'Erro ao buscar idoso:',
      erro
    );

    return undefined;
  }
}

async function atualizarIdoso(
  idosoAtualizado: Idoso
): Promise<void> {
  try {
    const idosos = await listarIdosos();

    const novaLista = idosos.map(
      (idoso) => {
        if (
          idoso.id ===
          idosoAtualizado.id
        ) {
          return idosoAtualizado;
        }

        return idoso;
      }
    );

    await AsyncStorage.setItem(
      CHAVE_IDOSOS,
      JSON.stringify(novaLista)
    );
  } catch (erro) {
    console.log(
      'Erro ao atualizar idoso:',
      erro
    );

    throw erro;
  }
}

async function excluirIdoso(
  id: string
): Promise<void> {
  try {
    const idosos = await listarIdosos();

    const novaLista = idosos.filter(
      (idoso) => idoso.id !== id
    );

    await AsyncStorage.setItem(
      CHAVE_IDOSOS,
      JSON.stringify(novaLista)
    );
  } catch (erro) {
    console.log(
      'Erro ao excluir idoso:',
      erro
    );

    throw erro;
  }
}


// Origem: src/services/avaliacoesStorage.ts
const CHAVE = '@sempre_bem:avaliacoes';

type DadosAvaliacao = {
  cuidador: string;
  pessoaCuidada: string;
  dataAtendimento: string;
  autor: string;
  nota: number;
  comentario: string;
};

type Avaliacao = DadosAvaliacao & {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
};

function validarAvaliacao(dados: DadosAvaliacao, hoje = new Date()): string | null {
  if (!dados.cuidador.trim() || !dados.pessoaCuidada.trim() || !dados.autor.trim()) {
    return 'Informe o cuidador, a pessoa cuidada e o autor da avaliação.';
  }
  if (!Number.isInteger(dados.nota) || dados.nota < 1 || dados.nota > 5) {
    return 'Selecione uma nota de 1 a 5 estrelas.';
  }
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dados.dataAtendimento);
  if (!partes) return 'Informe a data do atendimento no formato DD/MM/AAAA.';
  const [, dia, mes, ano] = partes.map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return 'Informe uma data de atendimento válida.';
  }
  if (data > new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
    return 'A data do atendimento não pode ser futura.';
  }
  return null;
}

async function listarAvaliacoes(): Promise<Avaliacao[]> {
  const valor = await AsyncStorage.getItem(CHAVE);
  if (!valor) return [];
  const dados: unknown = JSON.parse(valor);
  if (!Array.isArray(dados)) throw new Error('Armazenamento de avaliações inválido.');
  return dados as Avaliacao[];
}

// Serializa as gravações para evitar perda de dados em operações simultâneas.
let fila: Promise<unknown> = Promise.resolve();
function gravar(operacao: (lista: Avaliacao[]) => Avaliacao[]) {
  const tarefa = fila.then(async () => {
    const lista = operacao(await listarAvaliacoes());
    await AsyncStorage.setItem(CHAVE, JSON.stringify(lista));
  });
  fila = tarefa.catch(() => undefined);
  return tarefa;
}

function salvarAvaliacao(dados: DadosAvaliacao, id?: string): Promise<void> {
  const erro = validarAvaliacao(dados);
  if (erro) return Promise.reject(new Error(erro));
  return gravar(lista => {
    const existente = id ? lista.find(item => item.id === id) : undefined;
    if (id && !existente) throw new Error('Avaliação não encontrada.');
    const agora = new Date().toISOString();
    const avaliacao: Avaliacao = {
      cuidador: dados.cuidador.trim(), pessoaCuidada: dados.pessoaCuidada.trim(),
      autor: dados.autor.trim(), dataAtendimento: dados.dataAtendimento,
      nota: dados.nota, comentario: dados.comentario.trim(),
      id: existente?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      criadoEm: existente?.criadoEm ?? agora, atualizadoEm: agora,
    };
    return existente ? lista.map(item => item.id === id ? avaliacao : item) : [...lista, avaliacao];
  });
}

function excluirAvaliacao(id: string): Promise<void> {
  return gravar(lista => lista.filter(item => item.id !== id));
}


// Origem: src/components/idoso-form.tsx
type DadosIdoso = Omit<Idoso, 'id'>;

const dadosIdosoVazios: DadosIdoso = {
  nome: '', dataNascimento: '', sexo: '', endereco: '', informacoes: '',
  restricoes: '', contatoEmergencia: '', relacao: '', condicoesSaude: '',
  mobilidade: '', alergias: '', fotoUri: '',
};

async function guardarFoto(uri?: string): Promise<string> {
  if (!uri) return '';
  if (Platform.OS === 'web' || uri.startsWith(Paths.document.uri)) return uri;
  const origem = new File(uri);
  const destino = new File(Paths.document, `idoso-${Date.now()}-${Math.random().toString(36).slice(2)}${origem.extension || '.jpg'}`);
  origem.copy(destino);
  return destino.uri;
}

const opcoesMobilidade = ['Independente', 'Precisa de auxílio', 'Usa cadeira de rodas', 'Acamado(a)'];

function IdosoForm({ dados, onChange }: {
  dados: DadosIdoso;
  onChange: (dados: DadosIdoso) => void;
}) {
  const [selecionando, setSelecionando] = useState(false);
  const [mobilidadeAberta, setMobilidadeAberta] = useState(false);
  function atualizar(campo: keyof DadosIdoso, valor: string) {
    onChange({ ...dados, [campo]: valor });
  }

  async function escolherFoto() {
    setSelecionando(true);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
        base64: Platform.OS === 'web',
      });
      if (!resultado.canceled && resultado.assets[0]) {
        const foto = resultado.assets[0];
        // URLs blob do navegador expiram; o data URI permanece no armazenamento local.
        const uri = Platform.OS === 'web'
          ? foto.base64 ? `data:image/jpeg;base64,${foto.base64}` : undefined
          : foto.uri;
        if (!uri) throw new Error('Imagem indisponível');
        atualizar('fotoUri', uri);
      }
    } catch {
      avisar('Foto', 'Não foi possível selecionar a foto. Tente novamente.');
    } finally {
      setSelecionando(false);
    }
  }

  function campo(chave: keyof DadosIdoso, titulo: string, placeholder: string, multiline = false) {
    return <View>
      <Text style={careStyles.label}>{titulo}</Text>
      <TextInput accessibilityLabel={titulo} placeholderTextColor={careColors.muted}
        style={[careStyles.input, multiline && formStyles.textArea]} value={dados[chave] ?? ''}
        onChangeText={valor => atualizar(chave, valor)} placeholder={placeholder}
        multiline={multiline} keyboardType={chave === 'dataNascimento' ? 'numeric' : 'default'} />
    </View>;
  }

  return <View>
    <View style={formStyles.fotoContainer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Selecionar foto pela galeria"
        disabled={selecionando} onPress={escolherFoto} style={formStyles.fotoBotao}>
        {dados.fotoUri ? <Image source={{ uri: dados.fotoUri }} style={formStyles.foto} />
          : <Text style={formStyles.fotoPlaceholder}>+</Text>}
      </Pressable>
      <Text style={formStyles.legenda}>{selecionando ? 'Abrindo galeria...' : dados.fotoUri ? 'Toque para alterar foto' : 'Adicionar foto'}</Text>
      {!!dados.fotoUri && <Pressable accessibilityRole="button" onPress={() => atualizar('fotoUri', '')}>
        <Text style={formStyles.remover}>Remover foto</Text>
      </Pressable>}
    </View>
    {campo('nome', 'Nome completo *', 'Nome da pessoa')}
    {campo('dataNascimento', 'Data de nascimento *', 'DD/MM/AAAA')}
    {campo('sexo', 'Sexo', 'Digite o sexo')}
    {campo('relacao', 'Relação com você', 'Ex.: mãe, pai, avó, avô')}
    {campo('endereco', 'Endereço', 'Rua, número, bairro')}
    {campo('contatoEmergencia', 'Contato de emergência', 'Nome e telefone')}
    <Text style={formStyles.secao}>Informações de saúde</Text>
    {campo('condicoesSaude', 'Condições de saúde', 'Ex.: hipertensão, diabetes')}
    <Text style={careStyles.label}>Mobilidade</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Mobilidade" accessibilityState={{ expanded: mobilidadeAberta }}
      style={careStyles.input} onPress={() => setMobilidadeAberta(!mobilidadeAberta)}>
      <Text style={{ color: dados.mobilidade ? careColors.text : careColors.muted }}>{dados.mobilidade || 'Selecione'} ▾</Text>
    </Pressable>
    {mobilidadeAberta && <View style={formStyles.opcoes}>
      {['', ...opcoesMobilidade].map(opcao => <Pressable key={opcao} accessibilityRole="radio"
        accessibilityState={{ checked: (dados.mobilidade ?? '') === opcao }} style={formStyles.opcao}
        onPress={() => { atualizar('mobilidade', opcao); setMobilidadeAberta(false); }}>
        <Text style={{ color: careColors.text }}>{opcao || 'Não informado'}</Text>
      </Pressable>)}
    </View>}
    {campo('alergias', 'Alergias', 'Informe, se houver')}
    {campo('restricoes', 'Restrições ou necessidades especiais', 'Informe restrições ou necessidades especiais', true)}
    {campo('informacoes', 'Observações importantes', 'Medicamentos, rotina e outras informações úteis', true)}
  </View>;
}

const formStyles = StyleSheet.create({
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  secao: { fontSize: 17, fontWeight: '700', color: careColors.text, marginTop: 4, marginBottom: 20 },
  fotoContainer: { alignItems: 'center', marginBottom: 28 },
  fotoBotao: { width: 88, height: 88, borderRadius: 44, backgroundColor: careColors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  foto: { width: 88, height: 88 },
  fotoPlaceholder: { fontSize: 32, color: careColors.muted },
  legenda: { color: careColors.muted, marginTop: 8, fontSize: 12 },
  remover: { color: careColors.primary, padding: 10 },
  opcoes: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: careColors.border, marginBottom: 20 },
  opcao: { padding: 14, minHeight: 48, justifyContent: 'center' },
});


// Origem: src/components/care-header.tsx
function CareHeader() {
 const router = useRouter();
  return (
    <View style={headerStyles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={headerStyles.back}>
        <Text style={headerStyles.arrow}>‹</Text>
      </Pressable>
      <Image source={{ uri: 'data:image/png;base64,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' }} accessibilityLabel="Sempre Bem" resizeMode="contain" style={headerStyles.brand} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: careColors.border, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  arrow: { color: careColors.text, fontSize: 30, lineHeight: 34 },
  brand: { width: 90, height: 68 },
});


// Origem: src/app/idosos/cadastrar.tsx
function CadastrarIdoso() {
 const router = useRouter();
  const [dados, setDados] = useState(dadosIdosoVazios);
  const [salvando, setSalvando] = useState(false);

  async function cadastrarIdoso() {
    if (salvando) return;
    if (!dados.nome.trim() || !dados.dataNascimento.trim()) {
      avisar('Atenção', 'Preencha pelo menos o nome e a data de nascimento.');
      return;
    }
    setSalvando(true);
    try {
      const fotoUri = await guardarFoto(dados.fotoUri);
      await adicionarIdoso({ ...dados, nome: dados.nome.trim(), fotoUri, id: Date.now().toString() });
      avisar('Sucesso', 'Idoso cadastrado com sucesso!');
      router.replace('/idosos');
    } catch (erro) {
      console.error('Erro ao cadastrar idoso:', erro);
      avisar('Erro', 'Não foi possível cadastrar o idoso.');
    } finally {
      setSalvando(false);
    }
  }

  return <ScrollView style={careStyles.page} contentContainerStyle={careStyles.content} keyboardShouldPersistTaps="handled">
    <CareHeader />
    <Text style={careStyles.title}>Cadastro de Idoso</Text>
    <Text style={careStyles.subtitle}>Informe os dados da pessoa que receberá os cuidados.</Text>
    <IdosoForm dados={dados} onChange={setDados} />
    <Pressable accessibilityRole="button" style={careStyles.button} disabled={salvando} onPress={cadastrarIdoso}>
      <Text style={careStyles.buttonText}>{salvando ? 'Salvando...' : 'Salvar cadastro'}</Text>
    </Pressable>
  </ScrollView>;
}


// Origem: src/app/idosos/editar.tsx
function EditarIdoso() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [dados, setDados] = useState(dadosIdosoVazios);
  const [carregando, setCarregando] = useState(true);
  const [encontrado, setEncontrado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setEncontrado(false);
    async function carregar() {
      try {
        const idoso = id ? await buscarIdosoPorId(id) : undefined;
        if (!ativo) return;
        if (!idoso) {
          avisar('Atenção', 'Idoso não encontrado.');
          return;
        }
        setDados({ ...dadosIdosoVazios, ...idoso });
        setEncontrado(true);
      } catch {
        if (ativo) avisar('Erro', 'Não foi possível carregar os dados.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [id]);

  async function salvarAlteracoes() {
    if (!id || !encontrado || salvando) return;
    if (!dados.nome.trim() || !dados.dataNascimento.trim()) {
      avisar('Atenção', 'Preencha pelo menos o nome e a data de nascimento.');
      return;
    }
    setSalvando(true);
    try {
      const fotoUri = await guardarFoto(dados.fotoUri);
      await atualizarIdoso({ ...dados, nome: dados.nome.trim(), fotoUri, id });
      avisar('Sucesso', 'Dados atualizados com sucesso!');
      router.replace('/idosos');
    } catch (erro) {
      console.error('Erro ao atualizar idoso:', erro);
      avisar('Erro', 'Não foi possível atualizar os dados.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <View style={[careStyles.page, { alignItems: 'center', justifyContent: 'center' }]}>
    <ActivityIndicator size="large" color={careColors.primary} /><Text>Carregando dados...</Text>
  </View>;

  return <ScrollView style={careStyles.page} contentContainerStyle={careStyles.content} keyboardShouldPersistTaps="handled">
    <CareHeader />
    <Text style={careStyles.title}>Editar Idoso</Text>
    <Text style={careStyles.subtitle}>{encontrado ? 'Atualize as informações do idoso cadastrado.' : 'Idoso não encontrado.'}</Text>
    {encontrado && <>
      <IdosoForm dados={dados} onChange={setDados} />
      <Pressable accessibilityRole="button" style={careStyles.button} disabled={salvando} onPress={salvarAlteracoes}>
        <Text style={careStyles.buttonText}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text>
      </Pressable>
    </>}
    <Pressable accessibilityRole="button" disabled={salvando} style={[careStyles.button, { marginTop: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: careColors.primary }]} onPress={() => router.back()}>
      <Text style={[careStyles.buttonText, { color: careColors.primary }]}>Cancelar</Text>
    </Pressable>
  </ScrollView>;
}


// Origem: src/app/idosos/index.tsx
function ListaIdosos() {
  const router = useRouter();

  const [
    idosos,
    setIdosos,
  ] = useState<Idoso[]>([]);

  async function carregarIdosos() {
    try {
      const lista =
        await listarIdosos();

      setIdosos(lista);
    } catch (erro) {
      console.log(
        'Erro ao carregar idosos:',
        erro
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarIdosos();
    }, [])
  );

  function cadastrarIdoso() {
    router.push(
      '/idosos/cadastrar'
    );
  }

  function editarIdoso(
    id: string
  ) {
    router.push({
      pathname:
        '/idosos/editar',

      params: {
        id,
      },
    });
  }

  async function executarExclusao(
    id: string
  ) {
    try {
      await excluirIdoso(id);

      await carregarIdosos();

      if (
        Platform.OS === 'web'
      ) {
        window.alert(
          'Idoso excluído com sucesso!'
        );
      } else {
        avisar(
          'Sucesso',
          'Idoso excluído com sucesso!'
        );
      }
    } catch (erro) {
      console.log(
        'Erro ao excluir idoso:',
        erro
      );

      if (
        Platform.OS === 'web'
      ) {
        window.alert(
          'Não foi possível excluir o idoso.'
        );
      } else {
        avisar(
          'Erro',
          'Não foi possível excluir o idoso.'
        );
      }
    }
  }

  function confirmarExclusao(
    idoso: Idoso
  ) {
    if (
      Platform.OS === 'web'
    ) {
      const confirmou =
        window.confirm(
          `Deseja realmente excluir o cadastro de ${idoso.nome}?`
        );

      if (confirmou) {
        executarExclusao(
          idoso.id
        );
      }

      return;
    }

    Alert.alert(
      'Excluir idoso',
      `Deseja realmente excluir o cadastro de ${idoso.nome}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',

          onPress: () =>
            executarExclusao(
              idoso.id
            ),
        },
      ]
    );
  }

  return (
    <View
      style={[listaStyles.container, careStyles.content]}
    >
      <CareHeader />
      <Text
        style={listaStyles.titulo}
      >
        Idosos cadastrados
      </Text>

      <Text
        style={listaStyles.subtitulo}
      >
        Consulte os idosos
        cadastrados no sistema.
      </Text>

      <Pressable
        style={listaStyles.botaoNovo}
        onPress={
          cadastrarIdoso
        }
      >
        <Text
          style={
            listaStyles.textoBotaoNovo
          }
        >
          + Cadastrar novo idoso
        </Text>
      </Pressable>

      {idosos.length === 0 ? (
        <View
          style={
            listaStyles.semRegistros
          }
        >
          <Text
            style={
              listaStyles.semRegistrosTitulo
            }
          >
            Nenhum idoso
            cadastrado
          </Text>

          <Text
            style={
              listaStyles.semRegistrosTexto
            }
          >
            Cadastre um idoso
            para começar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={idosos}
          keyExtractor={(
            item
          ) => item.id}
          contentContainerStyle={
            listaStyles.lista
          }
          renderItem={({
            item,
          }) => (
            <View style={listaStyles.card}>
              <Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => router.push({ pathname: '/idosos/detalhes', params: { id: item.id } })}>
                <Text style={{ color: careColors.primary, fontWeight: '600' }}>Consultar cadastro completo ›</Text>
              </Pressable>
              <Text
                style={listaStyles.nome}
              >
                {item.nome}
              </Text>

              <Text
                style={
                  listaStyles.informacao
                }
              >
                <Text
                  style={
                    listaStyles.label
                  }
                >
                  Data de nascimento:{' '}
                </Text>

                {
                  item.dataNascimento
                }
              </Text>

              <Text
                style={
                  listaStyles.informacao
                }
              >
                <Text
                  style={
                    listaStyles.label
                  }
                >
                  Sexo:{' '}
                </Text>

                {item.sexo}
              </Text>

              <Text
                style={
                  listaStyles.informacao
                }
              >
                <Text
                  style={
                    listaStyles.label
                  }
                >
                  Endereço:{' '}
                </Text>

                {item.endereco}
              </Text>

              <Text
                style={
                  listaStyles.informacao
                }
              >
                <Text
                  style={
                    listaStyles.label
                  }
                >
                  Contato de emergência:{' '}
                </Text>

                {
                  item.contatoEmergencia
                }
              </Text>

              {item.informacoes ? (
                <Text
                  style={
                    listaStyles.informacao
                  }
                >
                  <Text
                    style={
                      listaStyles.label
                    }
                  >
                    Informações importantes:{' '}
                  </Text>

                  {
                    item.informacoes
                  }
                </Text>
              ) : null}

              {item.restricoes ? (
                <Text
                  style={
                    listaStyles.informacao
                  }
                >
                  <Text
                    style={
                      listaStyles.label
                    }
                  >
                    Restrições:{' '}
                  </Text>

                  {
                    item.restricoes
                  }
                </Text>
              ) : null}

              <View
                style={
                  listaStyles.areaBotoes
                }
              >
                <Pressable
                  style={
                    listaStyles.botaoEditar
                  }
                  onPress={() =>
                    editarIdoso(
                      item.id
                    )
                  }
                >
                  <Text
                    style={
                      listaStyles.textoBotaoAcao
                    }
                  >
                    Editar
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    listaStyles.botaoExcluir
                  }
                  onPress={() =>
                    confirmarExclusao(
                      item
                    )
                  }
                >
                  <Text
                    style={
                      listaStyles.textoBotaoAcao
                    }
                  >
                    Excluir
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const listaStyles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        careColors.background,
      padding: 20,
    },

    titulo: {
      fontSize: 23,
      fontWeight: 'bold',
      marginBottom: 6,
    },

    subtitulo: {
      fontSize: 14,
      color: '#555555',
      marginBottom: 20,
    },

    botaoNovo: {
      backgroundColor:
        careColors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 20,
    },

    textoBotaoNovo: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },

    lista: {
      paddingBottom: 30,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      padding: 18,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: careColors.border,
    },

    nome: {
      fontSize: 19,
      fontWeight: 'bold',
      marginBottom: 12,
    },

    informacao: {
      fontSize: 15,
      color: '#333333',
      marginBottom: 7,
    },

    label: {
      fontWeight: 'bold',
    },

    areaBotoes: {
      marginTop: 15,
      flexDirection: 'row',
      gap: 10,
    },

    botaoEditar: {
      flex: 1,
      backgroundColor:
        careColors.primary,
      paddingVertical: 12,
      borderRadius: 7,
      alignItems: 'center',
    },

    botaoExcluir: {
      flex: 1,
      backgroundColor:
        '#D93025',
      paddingVertical: 12,
      borderRadius: 7,
      alignItems: 'center',
    },

    textoBotaoAcao: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: 'bold',
    },

    semRegistros: {
      backgroundColor:
        '#FFFFFF',
      padding: 25,
      borderRadius: 10,
      alignItems: 'center',
    },

    semRegistrosTitulo: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    semRegistrosTexto: {
      fontSize: 15,
      color: careColors.muted,
    },
  });

// Origem: src/app/avaliacoes.tsx
const vazio: DadosAvaliacao = { cuidador: '', pessoaCuidada: '', dataAtendimento: '', autor: '', nota: 0, comentario: '' };
const dourado = '#DEA700';

function dataCurta(valor: string) {
  return new Date(valor).toLocaleDateString('pt-BR');
}

function AvaliacoesScreen() {
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState(0);
  const [recentes, setRecentes] = useState(true);
  const [detalhe, setDetalhe] = useState<Avaliacao | null>(null);
  const [formulario, setFormulario] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string>();
  const [dados, setDados] = useState<DadosAvaliacao>(vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLista('');
    try { setLista(await listarAvaliacoes()); }
    catch { setErroLista('Não foi possível carregar as avaliações. Tente novamente.'); }
    finally { setCarregando(false); }
  }, []);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const base = lista.filter(item => item.cuidador.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));
  const visiveis = base.filter(item => !filtro || item.nota === filtro)
    .sort((a, b) => recentes ? b.criadoEm.localeCompare(a.criadoEm) : a.criadoEm.localeCompare(b.criadoEm));
  const media = base.length ? base.reduce((soma, item) => soma + item.nota, 0) / base.length : 0;

  function abrirFormulario(item?: Avaliacao) {
    setIdEdicao(item?.id);
    setDados(item ? { ...item } : { ...vazio });
    setDetalhe(null);
    setConfirmando(false);
    setErro('');
    setFormulario(true);
  }

  function fechar() {
    if (salvando) return;
    setFormulario(false);
    setDetalhe(null);
    setConfirmando(false);
    setErro('');
  }

  async function salvar() {
    if (salvando) return;
    const mensagem = validarAvaliacao(dados);
    if (mensagem) { setErro(mensagem); return; }
    setSalvando(true);
    setErro('');
    try {
      await salvarAvaliacao(dados, idEdicao);
      setFormulario(false);
      await carregar();
    } catch { setErro('Não foi possível salvar a avaliação. Seus dados foram mantidos. Tente novamente.'); }
    finally { setSalvando(false); }
  }

  async function excluir() {
    if (!detalhe || salvando) return;
    setSalvando(true);
    setErro('');
    try {
      await excluirAvaliacao(detalhe.id);
      setDetalhe(null);
      setConfirmando(false);
      await carregar();
    } catch { setErro('Não foi possível excluir a avaliação. Tente novamente.'); }
    finally { setSalvando(false); }
  }

  function campo(chave: 'cuidador' | 'pessoaCuidada' | 'autor' | 'dataAtendimento' | 'comentario', titulo: string, placeholder: string) {
    return <View>
      <Text style={careStyles.label}>{titulo}</Text>
      <TextInput accessibilityLabel={titulo} style={[careStyles.input, chave === 'comentario' && avaliacaoStyles.area]}
        placeholder={placeholder} placeholderTextColor={careColors.muted} value={dados[chave]} editable={!salvando}
        keyboardType={chave === 'dataAtendimento' ? 'numeric' : 'default'}
        maxLength={chave === 'dataAtendimento' ? 10 : chave === 'comentario' ? 2000 : 120}
        multiline={chave === 'comentario'} onChangeText={valor => {
          const texto = chave === 'dataAtendimento'
            ? valor.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2') : valor;
          setDados(atual => ({ ...atual, [chave]: texto }));
        }} />
    </View>;
  }

  return <ScrollView style={careStyles.page} contentContainerStyle={careStyles.content} keyboardShouldPersistTaps="handled">
    <CareHeader />
    <Text style={careStyles.title}>Avaliação dos cuidadores</Text>
    <Text style={careStyles.subtitle}>Compartilhe sua experiência com os cuidados.</Text>
    <Pressable accessibilityRole="button" style={careStyles.button} onPress={() => abrirFormulario()} disabled={carregando || !!erroLista}>
      <Text style={careStyles.buttonText}>+ Nova avaliação</Text>
    </Pressable>

    {carregando ? <ActivityIndicator accessibilityLabel="Carregando avaliações" color={careColors.primary} style={avaliacaoStyles.espaco} />
      : erroLista ? <View style={avaliacaoStyles.card}>
        <Text accessibilityRole="alert" style={avaliacaoStyles.erro}>{erroLista}</Text>
        <Pressable accessibilityRole="button" onPress={carregar} style={careStyles.button}><Text style={careStyles.buttonText}>Tentar novamente</Text></Pressable>
      </View> : <>
        <Text style={[careStyles.label, avaliacaoStyles.espaco]}>Buscar cuidador</Text>
        <TextInput accessibilityLabel="Buscar cuidador" style={careStyles.input} value={busca} onChangeText={setBusca} placeholder="Nome do cuidador" placeholderTextColor={careColors.muted} />
        <View style={[avaliacaoStyles.card, avaliacaoStyles.resumo]}>
          <View style={avaliacaoStyles.mediaContainer}>
            <Text style={avaliacaoStyles.media}>{base.length ? media.toFixed(1).replace('.', ',') : '—'}</Text>
            <Text style={avaliacaoStyles.estrelas}>{base.length ? '★'.repeat(Math.round(media)) + '☆'.repeat(5 - Math.round(media)) : '☆☆☆☆☆'}</Text>
            <Text style={avaliacaoStyles.pequeno}>{base.length} {base.length === 1 ? 'avaliação' : 'avaliações'}</Text>
          </View>
          <View style={avaliacaoStyles.distribuicao}>
            {[5, 4, 3, 2, 1].map(nota => {
              const percentual = base.length ? Math.round(base.filter(item => item.nota === nota).length / base.length * 100) : 0;
              return <View key={nota} style={avaliacaoStyles.linhaBarra} accessibilityLabel={`${nota} estrelas: ${percentual}%`}>
                <Text style={avaliacaoStyles.pequeno}>{nota} ★</Text>
                <View style={avaliacaoStyles.barra}><View style={[avaliacaoStyles.preenchimento, { width: `${percentual}%` }]} /></View>
                <Text style={[avaliacaoStyles.pequeno, avaliacaoStyles.percentual]}>{percentual}%</Text>
              </View>;
            })}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={avaliacaoStyles.filtros}>
          {[0, 5, 4, 3, 2, 1].map(nota => <Pressable key={nota} accessibilityRole="radio" accessibilityState={{ checked: filtro === nota }}
            onPress={() => setFiltro(nota)} style={[avaliacaoStyles.chip, filtro === nota && avaliacaoStyles.chipAtivo]}>
            <Text style={[avaliacaoStyles.chipTexto, filtro === nota && avaliacaoStyles.branco]}>{nota ? `${nota} ${nota === 1 ? 'estrela' : 'estrelas'}` : 'Todas'}</Text>
          </Pressable>)}
        </ScrollView>
        <Pressable accessibilityRole="button" style={avaliacaoStyles.ordenacao} onPress={() => setRecentes(!recentes)}>
          <Text style={avaliacaoStyles.link}>{recentes ? 'Mais recentes primeiro ↓' : 'Mais antigas primeiro ↑'}</Text>
        </Pressable>
        {!visiveis.length && <View style={avaliacaoStyles.card}>
          <Text style={avaliacaoStyles.nome}>{lista.length ? 'Nenhuma avaliação encontrada' : 'Sua primeira avaliação começa aqui'}</Text>
          <Text style={avaliacaoStyles.descricao}>{lista.length ? 'Experimente outro cuidador ou filtro de estrelas.' : 'Toque em “Nova avaliação” para registrar sua experiência.'}</Text>
        </View>}
        {visiveis.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Consultar avaliação de ${item.autor} sobre ${item.cuidador}, ${item.nota} estrelas`}
          style={avaliacaoStyles.card} onPress={() => { setDetalhe(item); setErro(''); setConfirmando(false); }}>
          <View style={avaliacaoStyles.cabecalhoCard}>
            <View style={avaliacaoStyles.avatar}><Text style={avaliacaoStyles.inicial}>{item.autor.charAt(0).toLocaleUpperCase('pt-BR')}</Text></View>
            <Text style={[avaliacaoStyles.nome, avaliacaoStyles.flex]}>{item.autor}</Text>
            <Text style={avaliacaoStyles.pequeno}>{dataCurta(item.criadoEm)}</Text>
          </View>
          <Text style={avaliacaoStyles.nota}>★ {item.nota.toFixed(1).replace('.', ',')}</Text>
          <Text style={avaliacaoStyles.cuidador}>Cuidador: {item.cuidador}</Text>
          <Text numberOfLines={3} style={avaliacaoStyles.descricao}>{item.comentario || 'Sem comentário.'}</Text>
          <Text style={avaliacaoStyles.rodapeCard}>Atendimento para {item.pessoaCuidada} · {item.dataAtendimento}</Text>
        </Pressable>)}
      </>}

    <Modal visible={formulario || !!detalhe} animationType="slide" onRequestClose={fechar}>
      <SafeAreaView style={careStyles.page}>
        <KeyboardAvoidingView style={avaliacaoStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={careStyles.content} keyboardShouldPersistTaps="handled">
            <Pressable accessibilityRole="button" accessibilityLabel="Voltar para avaliações" disabled={salvando} onPress={fechar} style={avaliacaoStyles.voltar}><Text style={avaliacaoStyles.link}>‹ Voltar</Text></Pressable>
            <Text style={careStyles.title}>{formulario ? idEdicao ? 'Editar avaliação' : 'Nova avaliação' : 'Detalhes da avaliação'}</Text>
            <Text style={careStyles.subtitle}>{formulario ? 'Conte como foi o atendimento. Campos com * são obrigatórios.' : 'Experiência registrada sobre o atendimento.'}</Text>
            {formulario ? <>
              {campo('cuidador', 'Nome do cuidador *', 'Nome completo do cuidador')}
              {campo('pessoaCuidada', 'Pessoa cuidada *', 'Nome de quem recebeu os cuidados')}
              {campo('dataAtendimento', 'Data do atendimento *', 'DD/MM/AAAA')}
              {campo('autor', 'Seu nome *', 'Nome de quem está avaliando')}
              <Text style={careStyles.label}>Nota geral *</Text>
              <View style={avaliacaoStyles.seletorEstrelas}>
                {[1, 2, 3, 4, 5].map(nota => <Pressable key={nota} accessibilityRole="radio" accessibilityLabel={`${nota} ${nota === 1 ? 'estrela' : 'estrelas'}`} accessibilityState={{ checked: dados.nota === nota }} disabled={salvando}
                  onPress={() => setDados(atual => ({ ...atual, nota }))} style={avaliacaoStyles.estrelaBotao}>
                  <Text style={avaliacaoStyles.estrelaGrande}>{nota <= dados.nota ? '★' : '☆'}</Text>
                </Pressable>)}
              </View>
              <Text style={avaliacaoStyles.ajuda}>{dados.nota ? `${dados.nota} de 5 estrelas` : 'Toque nas estrelas para avaliar'}</Text>
              {campo('comentario', 'Comentário (opcional)', 'Descreva sua experiência com o cuidador')}
              {!!erro && <Text accessibilityRole="alert" style={avaliacaoStyles.erro}>{erro}</Text>}
              <Pressable accessibilityRole="button" disabled={salvando} style={careStyles.button} onPress={salvar}>
                <Text style={careStyles.buttonText}>{salvando ? 'Salvando...' : 'Salvar avaliação'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={salvando} style={avaliacaoStyles.secundario} onPress={fechar}><Text style={avaliacaoStyles.link}>Cancelar</Text></Pressable>
            </> : detalhe && <>
              <View style={avaliacaoStyles.card}>
                <Text style={avaliacaoStyles.nome}>{detalhe.cuidador}</Text>
                <Text style={[avaliacaoStyles.estrelas, avaliacaoStyles.espaco]}>{'★'.repeat(detalhe.nota)}{'☆'.repeat(5 - detalhe.nota)}</Text>
                <Text style={avaliacaoStyles.descricao}>Avaliado por {detalhe.autor}</Text>
                <Text style={avaliacaoStyles.descricao}>Pessoa cuidada: {detalhe.pessoaCuidada}</Text>
                <Text style={avaliacaoStyles.descricao}>Atendimento: {detalhe.dataAtendimento}</Text>
                <Text style={avaliacaoStyles.comentario}>{detalhe.comentario || 'Sem comentário.'}</Text>
                <Text style={avaliacaoStyles.rodapeCard}>Criada em {dataCurta(detalhe.criadoEm)} · Atualizada em {dataCurta(detalhe.atualizadoEm)}</Text>
              </View>
              {!!erro && <Text accessibilityRole="alert" style={avaliacaoStyles.erro}>{erro}</Text>}
              {confirmando ? <View style={avaliacaoStyles.card}>
                <Text style={avaliacaoStyles.nome}>Excluir esta avaliação?</Text>
                <Text style={avaliacaoStyles.descricao}>Essa ação não pode ser desfeita.</Text>
                <Pressable accessibilityRole="button" disabled={salvando} style={[careStyles.button, avaliacaoStyles.excluir]} onPress={excluir}><Text style={careStyles.buttonText}>{salvando ? 'Excluindo...' : 'Confirmar exclusão'}</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={salvando} style={avaliacaoStyles.secundario} onPress={() => setConfirmando(false)}><Text style={avaliacaoStyles.link}>Cancelar</Text></Pressable>
              </View> : <>
                <Pressable accessibilityRole="button" style={careStyles.button} onPress={() => abrirFormulario(detalhe)}><Text style={careStyles.buttonText}>Editar avaliação</Text></Pressable>
                <Pressable accessibilityRole="button" style={avaliacaoStyles.secundario} onPress={() => setConfirmando(true)}><Text style={avaliacaoStyles.erro}>Excluir avaliação</Text></Pressable>
              </>}
            </>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </ScrollView>;
}

const avaliacaoStyles = StyleSheet.create({
  flex: { flex: 1 },
  espaco: { marginTop: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: careColors.border, padding: 16, marginBottom: 14, boxShadow: '0px 2px 4px #302D3110' },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  mediaContainer: { alignItems: 'center', minWidth: 80 },
  media: { fontSize: 38, fontWeight: '800', color: careColors.primary },
  estrelas: { color: dourado, fontSize: 20, marginBottom: 6 },
  pequeno: { fontSize: 10, color: careColors.muted },
  distribuicao: { flex: 1, gap: 5 },
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barra: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#EDE7E4', overflow: 'hidden' },
  preenchimento: { backgroundColor: dourado, height: '100%', borderRadius: 4 },
  percentual: { width: 30, textAlign: 'right' },
  filtros: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 24, borderWidth: 1, borderColor: careColors.border, backgroundColor: '#FFFFFF', paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  chipAtivo: { backgroundColor: careColors.primary, borderColor: careColors.primary },
  chipTexto: { color: careColors.muted, fontSize: 12 },
  branco: { color: '#FFFFFF' },
  ordenacao: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 8 },
  link: { color: careColors.primary, fontSize: 14, fontWeight: '600' },
  cabecalhoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EBDDE9', alignItems: 'center', justifyContent: 'center' },
  inicial: { color: careColors.primary, fontWeight: '700', fontSize: 17 },
  nome: { fontSize: 16, fontWeight: '700', color: careColors.text },
  nota: { color: '#946C00', fontSize: 13, marginBottom: 10 },
  cuidador: { color: careColors.text, fontWeight: '500', fontSize: 13 },
  descricao: { color: careColors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  rodapeCard: { borderTopWidth: 1, borderTopColor: careColors.border, paddingTop: 10, marginTop: 12, color: careColors.muted, fontSize: 11, lineHeight: 17 },
  voltar: { minHeight: 44, justifyContent: 'center', marginBottom: 14, alignSelf: 'flex-start' },
  area: { minHeight: 120, textAlignVertical: 'top' },
  seletorEstrelas: { flexDirection: 'row' },
  estrelaBotao: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  estrelaGrande: { color: dourado, fontSize: 34 },
  ajuda: { color: careColors.muted, marginTop: 4, marginBottom: 24, fontSize: 12 },
  erro: { color: '#A32939', marginBottom: 12, lineHeight: 20 },
  secundario: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  comentario: { color: careColors.text, fontSize: 14, lineHeight: 22, marginTop: 24 },
  excluir: { backgroundColor: '#A32939', marginTop: 16 },
});


// Consulta completa: a tela original de detalhes continha apenas um placeholder.
function DetalhesIdoso() {
  const router = useRouter();
  const [idoso, setIdoso] = useState<Idoso>();
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let ativo = true;
    void buscarIdosoPorId(router.params.id ?? '').then(item => {
      if (ativo) { setIdoso(item); setCarregando(false); }
    });
    return () => { ativo = false; };
  }, [router.params.id]);
  const campos: [keyof DadosIdoso, string][] = [
    ['nome', 'Nome completo'], ['dataNascimento', 'Data de nascimento'], ['sexo', 'Sexo'],
    ['relacao', 'Relação com você'], ['endereco', 'Endereço'], ['contatoEmergencia', 'Contato de emergência'],
    ['condicoesSaude', 'Condições de saúde'], ['mobilidade', 'Mobilidade'], ['alergias', 'Alergias'],
    ['restricoes', 'Restrições ou necessidades especiais'], ['informacoes', 'Observações importantes'],
  ];
  return <ScrollView style={careStyles.page} contentContainerStyle={careStyles.content}>
    <CareHeader /><Text style={careStyles.title}>Detalhes do Idoso</Text>
    {carregando ? <ActivityIndicator color={careColors.primary} /> : !idoso ? <Text>Idoso não encontrado.</Text> : <>
      {!!idoso.fotoUri && <Image source={{ uri: idoso.fotoUri }} style={formStyles.foto} />}
      {campos.map(([chave, titulo]) => <View key={chave} style={{ marginTop: 16 }}>
        <Text style={careStyles.label}>{titulo}</Text><Text selectable style={{ color: careColors.text }}>{idoso[chave] || 'Não informado'}</Text>
      </View>)}
      <Pressable accessibilityRole="button" style={[careStyles.button, { marginTop: 24 }]} onPress={() => router.push({ pathname: '/idosos/editar', params: { id: idoso.id } })}>
        <Text style={careStyles.buttonText}>Editar cadastro</Text>
      </Pressable>
    </>}
  </ScrollView>;
}

type SempreBemVitorProps = {
  telaInicial?: '/' | '/idosos' | '/idosos/cadastrar' | '/avaliacoes';
  onSair?: () => void;
};
function normalizarDestino(destino: DestinoVitor): EntradaVitor {
  return typeof destino === 'string' ? { pathname: destino, params: {} } : destino;
}
export default function SempreBemVitor({ telaInicial = '/', onSair }: SempreBemVitorProps) {
  const [pilha, setPilha] = useState<EntradaVitor[]>(() => telaInicial === '/'
    ? [normalizarDestino('/')] : [normalizarDestino('/'), normalizarDestino(telaInicial)]);
  const atual = pilha[pilha.length - 1];
  const navegacao = useMemo<NavegacaoVitor>(() => ({
    params: atual.params,
    push: destino => setPilha(anterior => [...anterior, normalizarDestino(destino)]),
    replace: destino => setPilha(anterior => {
      const entrada = normalizarDestino(destino);
      // Após salvar, volte à lista sem deixar o formulário no histórico.
      if (entrada.pathname === '/idosos') return [normalizarDestino('/'), entrada];
      return [...anterior.slice(0, -1), entrada];
    }),
    back: () => { if (pilha.length > 1) setPilha(anterior => anterior.slice(0, -1)); else onSair?.(); },
    canGoBack: () => pilha.length > 1 || !!onSair,
  }), [atual, pilha.length, onSair]);
  useEffect(() => {
    const evento = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navegacao.canGoBack()) return false;
      navegacao.back(); return true;
    });
    return () => evento.remove();
  }, [navegacao]);
  let tela;
  switch (atual.pathname) {
    case '/idosos': tela = <ListaIdosos />; break;
    case '/idosos/cadastrar': tela = <CadastrarIdoso />; break;
    case '/idosos/editar': tela = <EditarIdoso />; break;
    case '/idosos/detalhes': tela = <DetalhesIdoso />; break;
    case '/avaliacoes': tela = <AvaliacoesScreen />; break;
    default: tela = <ScrollView style={careStyles.page} contentContainerStyle={careStyles.content}>
      <CareHeader /><Text style={careStyles.title}>Sempre Bem</Text>
      <Text style={careStyles.subtitle}>Cadastros e avaliações para cuidar de quem você ama.</Text>
      <Pressable accessibilityRole="button" style={careStyles.button} onPress={() => navegacao.push('/idosos')}><Text style={careStyles.buttonText}>Consultar idosos</Text></Pressable>
      <Pressable accessibilityRole="button" style={[careStyles.button, { marginTop: 16 }]} onPress={() => navegacao.push('/idosos/cadastrar')}><Text style={careStyles.buttonText}>Cadastrar idoso</Text></Pressable>
      <Pressable accessibilityRole="button" style={[careStyles.button, { marginTop: 16 }]} onPress={() => navegacao.push('/avaliacoes')}><Text style={careStyles.buttonText}>Avaliação dos cuidadores</Text></Pressable>
    </ScrollView>;
  }
  return <SafeAreaProvider><ContextoVitor.Provider value={navegacao}>
    <SafeAreaView style={careStyles.page}><View key={`${pilha.length}:${atual.pathname}:${atual.params.id ?? ''}`} style={careStyles.page}>{tela}</View></SafeAreaView>
  </ContextoVitor.Provider></SafeAreaProvider>;
}
