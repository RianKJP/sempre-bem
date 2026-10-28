import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PerfilPessoaCuidadaScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* CABEÇALHO COM BOTÃO VOLTAR E EDIÇÃO */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.botaoCircular}>
          <Text style={styles.textoBotaoCircular}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Perfil da pessoa cuidada</Text>
        <TouchableOpacity style={styles.botaoCircular}>
          <Text style={styles.iconeLapis}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* DADOS PRINCIPAIS COM AVATAR DE ÍCONE */}
      <View style={styles.perfilHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.iconeAvatar}>👤</Text>
        </View>
        <View style={styles.infoUsuario}>
          <Text style={styles.nomeUsuario}>Maria Silva</Text>
          <Text style={styles.subtituloUsuario}>78 anos · Mãe</Text>
        </View>
      </View>

      {/* LISTA DE CARDS DE OPÇÕES */}
      <View style={styles.containerOpcoes}>
        {/* DADOS PESSOAIS */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Dados pessoais</Text>
            <Text style={styles.subtituloCard}>Nascimento: 12/04/1947 São Paulo, SP</Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>

        {/* INFORMAÇÕES DE SAÚDE */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Informações de saúde</Text>
            <Text style={styles.subtituloCard}>
              Hipertensão · Mobilidade moderada · Sem alergias conhecidas
            </Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>

        {/* MEDICAMENTOS */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Medicamentos</Text>
            <Text style={styles.subtituloCard}>3 medicamentos cadastrados</Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>

        {/* ALIMENTAÇÃO */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Alimentação</Text>
            <Text style={styles.subtituloCard}>Controle de refeições e histórico</Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>

        {/* ATENDIMENTOS */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Atendimentos</Text>
            <Text style={styles.subtituloCard}>Próximo: hoje, 14:00</Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>

        {/* DIÁRIO DE BORDO */}
        <TouchableOpacity style={styles.cardOpcao}>
          <View style={styles.textoGroup}>
            <Text style={styles.tituloCard}>Diário de Bordo</Text>
            <Text style={styles.subtituloCard}>Último registro há 2 horas</Text>
          </View>
          <Text style={styles.setaIndicativa}>›</Text>
        </TouchableOpacity>
      </View>

      {/* BOTÕES INFERIORES */}
      <View style={styles.containerBotoesInferiores}>
        <TouchableOpacity style={styles.botaoEditar}>
          <Text style={styles.textoBotaoEditar}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoExcluir}>
          <Text style={styles.textoBotaoExcluir}>🗑️ Excluir cadastro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: '#F7F4EC',
    flexGrow: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  botaoCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0DDD5',
    elevation: 1,
  },
  textoBotaoCircular: {
    fontSize: 26,
    color: '#222222',
    marginTop: -2,
  },
  iconeLapis: {
    fontSize: 16,
  },
  tituloHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  perfilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 16,
    backgroundColor: '#E0DDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeAvatar: {
    fontSize: 36,
  },
  infoUsuario: {
    justifyContent: 'center',
    flex: 1,
  },
  nomeUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  subtituloUsuario: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  containerOpcoes: {
    gap: 12,
    marginBottom: 30,
  },
  cardOpcao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    elevation: 1,
  },
  textoGroup: {
    flex: 1,
  },
  tituloCard: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 2,
  },
  subtituloCard: {
    fontSize: 13,
    color: '#888888',
  },
  setaIndicativa: {
    fontSize: 22,
    color: '#888888',
    fontWeight: '300',
    marginLeft: 10,
  },
  containerBotoesInferiores: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  botaoEditar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B3564',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoBotaoEditar: {
    color: '#6B3564',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoExcluir: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoExcluir: {
    color: '#A04040',
    fontSize: 16,
    fontWeight: 'bold',
  },
});