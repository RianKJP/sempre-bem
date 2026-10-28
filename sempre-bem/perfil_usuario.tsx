import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PerfilScreen() {
  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* TÍTULO PRINCIPAL */}
        <Text style={styles.headerTitulo}>Perfil</Text>

        {/* ÁREA DO USUÁRIO */}
        <View style={styles.perfilHeader}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.infoUsuario}>
            <Text style={styles.nomeUsuario}>Usuario</Text>
            <Text style={styles.emailUsuario}>usuario@email.com</Text>
          </View>
        </View>

        {/* OPÇÕES DO PERFIL */}
        <View style={styles.containerOpcoes}>
          {/* MINHA CONTA */}
          <TouchableOpacity style={styles.cardOpcao}>
            <View style={styles.textoGroup}>
              <Text style={styles.tituloCard}>Minha conta</Text>
              <Text style={styles.subtituloCard}>Dados pessoais e editar perfil</Text>
            </View>
            <Text style={styles.setaIndicativa}>›</Text>
          </TouchableOpacity>

          {/* PESSOAS CUIDADAS (ADICIONADO) */}
          <TouchableOpacity style={styles.cardOpcao}>
            <View style={styles.textoGroup}>
              <Text style={styles.tituloCard}>Pessoas cuidadas</Text>
              <Text style={styles.subtituloCard}>Gerenciar idosos</Text>
            </View>
            <Text style={styles.setaIndicativa}>›</Text>
          </TouchableOpacity>

          {/* ATENDIMENTOS */}
          <TouchableOpacity style={styles.cardOpcao}>
            <View style={styles.textoGroup}>
              <Text style={styles.tituloCard}>Atendimentos</Text>
              <Text style={styles.subtituloCard}>Histórico de cuidados</Text>
            </View>
            <Text style={styles.setaIndicativa}>›</Text>
          </TouchableOpacity>
        </View>

        {/* BOTÃO SAIR */}
        <TouchableOpacity style={styles.botaoSair}>
          <Text style={styles.textoBotaoSair}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcone}>🏠</Text>
          <Text style={styles.navTexto}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcone}>🔍</Text>
          <Text style={styles.navTexto}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcone}>🗺️</Text>
          <Text style={styles.navTexto}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcone}>💬</Text>
          <Text style={styles.navTexto}>Mensagens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcone, styles.navAtivo]}>👤</Text>
          <Text style={[styles.navTexto, styles.navAtivo]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 100,
  },
  headerTitulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 24,
  },
  perfilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: '#E0DDD5',
  },
  infoUsuario: {
    justifyContent: 'center',
  },
  nomeUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  emailUsuario: {
    fontSize: 15,
    color: '#888888',
    marginTop: 2,
  },
  containerOpcoes: {
    gap: 14,
    marginBottom: 36,
  },
  cardOpcao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 2,
  },
  subtituloCard: {
    fontSize: 13,
    color: '#888888',
  },
  setaIndicativa: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '300',
    marginLeft: 10,
  },
  botaoSair: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  textoBotaoSair: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A04040',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0DDD5',
    paddingBottom: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcone: {
    fontSize: 20,
    color: '#888888',
    marginBottom: 2,
  },
  navTexto: {
    fontSize: 11,
    color: '#888888',
  },
  navAtivo: {
    color: '#6B3564',
    fontWeight: 'bold',
  },
});