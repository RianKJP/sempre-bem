## 2. Linguagens utilizadas

- **TypeScript:** linguagem principal utilizada no desenvolvimento das telas, dos componentes, das regras da aplicação e dos serviços.
- **TSX:** extensão do TypeScript utilizada para criar os componentes visuais com React e React Native.
- **JavaScript:** linguagem executada pelo ambiente React Native e utilizada pelas ferramentas do ecossistema Node.js.
- **JSON:** formato utilizado nos arquivos de configuração e no armazenamento de dados simulados.
- **SQL:** linguagem utilizada para definir e consultar a estrutura do banco de dados.

## 3. Frameworks e plataformas

- **React Native 0.86.3:** framework utilizado para desenvolver o aplicativo para Android e iOS a partir de uma única base de código.
- **React 19.2.3:** biblioteca utilizada para criar componentes e controlar os estados da interface.
- **Expo SDK 57:** plataforma utilizada para facilitar o desenvolvimento, os testes, a compilação e o acesso aos recursos nativos dos dispositivos.
- **React Native Web:** permite executar o aplicativo também no navegador.

## 4. Bibliotecas e pacotes

- **Expo Router:** responsável pela navegação entre as telas por meio da estrutura de arquivos da pasta `src/app`.
- **Expo Location:** utilizado para solicitar permissão de localização, obter as coordenadas do dispositivo e converter a localização em endereço.
- **React Native Maps:** será utilizado para exibir mapas, marcadores e a localização de clientes e cuidadores. Essa integração ainda será implementada.
- **Expo SQLite:** será utilizado para armazenar dados de maneira local e persistente no dispositivo. Essa integração ainda será implementada.
- **Expo Symbols:** fornece ícones compatíveis com Android, iOS e web.
- **React Native Safe Area Context:** ajusta a interface às áreas seguras da tela, evitando sobreposição com câmeras, barras e recortes do dispositivo.
- **React Native Screens:** melhora o desempenho e a integração nativa das telas de navegação.
- **React Native Reanimated:** oferece suporte para animações com melhor desempenho.
- **React Native Worklets:** fornece suporte à execução de tarefas e animações fora da thread principal da interface.
- **Expo Splash Screen:** controla a tela de abertura do aplicativo.
- **Expo Status Bar:** permite configurar a barra de status do dispositivo.
- **Expo Linking:** permite abrir configurações e links externos.
- **Expo Web Browser:** permite abrir páginas externas dentro do aplicativo.
- **Expo Constants:** disponibiliza informações e configurações do ambiente Expo.
- **Expo Font:** permite carregar fontes personalizadas.

## 5. Banco de dados

O projeto utilizará o **SQLite**, por meio do pacote **Expo SQLite**, para manter dados armazenados no próprio dispositivo. O banco poderá guardar informações de familiares, cuidadores, solicitações, atendimentos, avaliações, pagamentos e registros de cuidados.

## 6. Serviços web

- **JSON Server:** será utilizado para criar uma API REST simulada durante o desenvolvimento. Essa API permitirá realizar operações de consulta, cadastro, alteração e exclusão de dados. A integração ainda será implementada.
- **React Maps:** será utilizado pelo React Native Maps para apresentar os mapas no Android e, se configurado, também no iOS.
- **Serviços de localização do dispositivo:** serão acessados pelo Expo Location para obter coordenadas geográficas e o endereço atual.

## 7. IDEs de desenvolvimento

- **Visual Studio Code:** ambiente principal para edição e organização do código-fonte.
- **Android Studio:** utilizado para instalar o SDK Android, executar o emulador e gerar compilações nativas do aplicativo.

## 8. Ferramentas de desenvolvimento

- **Node.js:** ambiente utilizado para executar o Expo, o JSON Server e as demais ferramentas JavaScript. O Expo SDK 57 exige Node.js 22.13 ou superior.
- **npm:** gerenciador utilizado para instalar e atualizar as dependências do projeto.
- **Expo CLI:** ferramenta de linha de comando utilizada para iniciar, testar e compilar a aplicação.
- **Expo Go:** aplicativo utilizado para realizar testes rápidos em dispositivos físicos.