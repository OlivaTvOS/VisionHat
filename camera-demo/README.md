# VisionHat — app de captura

Aplicativo demonstrativo separado da interface principal. O celular aciona a ESP32-CAM pela rede local; a própria câmera captura o JPEG e envia o arquivo diretamente à API Java no Render.

## Fluxo

1. A ESP32-CAM conecta-se ao roteador Wi-Fi e inicia um servidor HTTP na porta 80.
2. O app chama POST /capture?idDispositivo=... no nome local visionhat-camera.local (mDNS), sem depender do IP distribuído pelo DHCP.
3. A ESP32-CAM captura a OV3660 e envia o JPEG como multipart, no campo imagem, para:
   https://visionhat-api.onrender.com/api/analises/imagem?idDispositivo=...
4. A API retorna a descrição da IA. A câmera repassa a resposta ao app.
5. O app exibe a descrição e oferece leitura em voz alta.

O celular e a câmera precisam estar na mesma rede Wi-Fi. A conexão da câmera com o Render usa HTTPS.

## 1. Preparar o firmware

Abra firmware/visionhat_wifi/visionhat_wifi.ino na Arduino IDE.

Na mesma pasta do sketch, copie wifi_config.example.h para wifi_config.h e preencha o SSID e a senha do Wi-Fi ao qual a ESP32-CAM deverá se conectar. Para usar o hotspot do celular, coloque aqui o nome e a senha desse hotspot. O arquivo wifi_config.h está no .gitignore, portanto não será versionado. Essas credenciais ficam no firmware da ESP32-CAM; não é necessário recompilar o APK quando você trocar a rede.

Use as mesmas configurações de placa e PSRAM da ESP32-CAM AI Thinker já validadas anteriormente. Grave o firmware e abra o Monitor Serial em 115200 baud.

Quando conectar, o Monitor Serial mostrará IP_CAMERA e MDNS_INICIADO. O endereço usado pelo app é http://visionhat-camera.local, independentemente do IP recebido pelo DHCP. O IP permanece disponível no Monitor Serial apenas para diagnóstico.

A câmera permanece disponível enquanto receber energia. O mDNS depende de a rede permitir tráfego multicast; alguns hotspots podem bloquear esse tráfego.

### O que foi preservado/alterado

- Pinagem da AI Thinker e ajustes do sensor OV3660 preservados.
- Resolução SVGA, qualidade JPEG 10, framebuffer em PSRAM e ajustes de imagem preservados.
- Botão físico e acionamento serial removidos.
- Servidor local com GET /status e POST /capture?idDispositivo=ID.
- Reconexão Wi-Fi automática em caso de queda.
- Nome local fixo visionhat-camera.local anunciado por mDNS.
- Envio JPEG multipart direto ao endpoint Java existente.

### Segurança do protótipo

O firmware de demonstração usa WiFiClientSecure.setInsecure() para simplificar a conexão HTTPS com o Render. Isso não valida o certificado TLS do servidor. É uma concessão apenas para a demonstração acadêmica; antes de uso real, é necessário instalar e validar o certificado CA apropriado. A interface local também não possui autenticação: use-a apenas em uma rede Wi-Fi confiável.

## 2. Preparar o app Android

Requisitos atuais do Capacitor 8: Node.js 22 ou superior, Android Studio e Android SDK. A documentação oficial indica Android API 24+ e Android Studio 2025.2.1 ou superior para Capacitor 8.

Na pasta camera-demo:

```bash
npm install
npm run build
npx cap add android
npm run android:network-config
npx cap sync android
npx cap open android
```

O primeiro npm install gera package-lock.json; mantenha esse arquivo no projeto depois de instalado.

O app chama a câmera por meio do CapacitorHttp, que executa as requisições na camada HTTP nativa do Android, em vez do fetch do WebView. Isso evita o bloqueio de conteúdo misto e as restrições CORS do navegador. A permissão de HTTP local continua necessária por causa do servidor da câmera.

A leitura em voz alta usa o plugin nativo @capacitor-community/text-to-speech e o mecanismo Android selecionado no sistema. O app aguarda a inicialização do mecanismo e procura uma voz pt-BR local (sem exigir conexão de rede), preferindo esse caminho para a demonstração. No Moto G56, abra Configurações > Acessibilidade > Saída de texto para fala, selecione o mecanismo Google e baixe os dados de voz Português (Brasil). Teste a amostra e, em seguida, abra novamente o VisionHat. O áudio usa a saída selecionada pelo Android, inclusive fones Bluetooth.

No Android Studio, aguarde o Gradle terminar e selecione Build > Build Bundle(s) / APK(s) > Build APK(s). O APK de debug ficará em:

android/app/build/outputs/apk/debug/app-debug.apk

Quando alterar o código React, execute novamente:

```bash
npm run build
npx cap sync android
```

Depois gere o APK novamente pelo Android Studio.

O script npm run android:network-config habilita HTTP local para este aplicativo demonstrativo. O Android 9+ bloqueia tráfego HTTP sem configuração explícita. Não reutilize uma liberação ampla de cleartext em um aplicativo de produção.

Em Android 17 (API 37) ou superior, aplicações que tenham como alvo SDK 37+ também precisam declarar e solicitar a permissão de acesso à rede local. Este scaffold não altera o target SDK gerado pelo Capacitor; confirme essa permissão caso o projeto Android seja atualizado para target 37.

## 3. Usar

1. Ligue a ESP32-CAM.
2. Conecte o celular à mesma rede Wi-Fi.
3. Abra o app. O endereço padrão já é visionhat-camera.local; mantenha o celular conectado ao hotspot/rede usado pela câmera. Não é necessário consultar o IP.
4. Entre com e-mail e senha na seção Conta VisionHat. O app chama POST /api/usuarios/login e, com o idUsuario retornado, consulta GET /api/dispositivos/usuario/{idUsuario}. O primeiro dispositivo ativo é selecionado automaticamente; se houver mais de um, escolha na lista. A senha é usada somente na requisição de login e não fica salva no celular.
5. Toque em Localizar câmera. O app tenta o nome mDNS visionhat-camera.local e preenche o IP real retornado por /status. Se o hotspot não resolver mDNS, informe manualmente o IP exibido no Monitor Serial.
6. Conecte os fones Bluetooth antes da leitura, caso queira ouvir por eles, e confirme que a opção Áudio de mídia está habilitada nas configurações Bluetooth do Android.
7. Toque no botão central Tirar foto.

O e-mail, o IP/endereço da câmera e o ID do dispositivo ficam salvos localmente no celular. A senha não é armazenada.

## 4. Limites

- O plano gratuito do Render pode entrar em cold start; a primeira análise poderá demorar.
- O app não fotografa usando a câmera do celular: apenas aciona a OV3660 conectada à ESP32-CAM.
- A leitura em voz alta usa o mecanismo nativo de texto para fala do Android, por meio de @capacitor-community/text-to-speech. A saída segue o dispositivo de áudio selecionado pelo próprio Android; para usar fones Bluetooth, eles precisam estar conectados e habilitados para áudio de mídia.
- A voz offline depende de uma voz pt-BR local instalada no mecanismo do Android. O aplicativo não baixa modelos neurais próprios nem consome chamadas Gemini para sintetizar fala. Para um TTS embarcado no APK, seria necessário integrar um runtime como Piper/ONNX e distribuir o modelo pt-BR, o que aumenta o tamanho do pacote e o trabalho de integração; não foi adotado nesta entrega.
- A descrição é baseada em uma imagem estática e não substitui bengala, cão-guia ou outros recursos habituais de mobilidade.