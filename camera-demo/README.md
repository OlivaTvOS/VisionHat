# VisionHat — app de captura

Aplicativo demonstrativo separado da interface principal. O celular aciona a ESP32-CAM pela rede local; a própria câmera captura o JPEG e envia o arquivo diretamente à API Java no Render.

## Fluxo

1. A ESP32-CAM conecta-se ao roteador Wi-Fi e inicia um servidor HTTP na porta 80.
2. O app chama POST /capture?idDispositivo=... no IP local da câmera.
3. A ESP32-CAM captura a OV3660 e envia o JPEG como multipart, no campo imagem, para:
   https://visionhat-api.onrender.com/api/analises/imagem?idDispositivo=...
4. A API retorna a descrição da IA. A câmera repassa a resposta ao app.
5. O app exibe a descrição e oferece leitura em voz alta.

O celular e a câmera precisam estar na mesma rede Wi-Fi. A conexão da câmera com o Render usa HTTPS.

## 1. Preparar o firmware

Abra firmware/visionhat_wifi/visionhat_wifi.ino na Arduino IDE.

Na mesma pasta do sketch, copie wifi_config.example.h para wifi_config.h e preencha SSID e senha da sua rede. O arquivo wifi_config.h está no .gitignore, portanto não será versionado.

Use as mesmas configurações de placa e PSRAM da ESP32-CAM AI Thinker já validadas anteriormente. Grave o firmware e abra o Monitor Serial em 115200 baud.

Quando conectar, o Monitor Serial mostrará IP_CAMERA: .... Anote o endereço IP.

A câmera permanece disponível enquanto receber energia. Para não precisar alterar o IP no app quando o DHCP mudar o endereço, é recomendável reservar um IP fixo para a ESP32-CAM nas configurações do roteador.

### O que foi preservado/alterado

- Pinagem da AI Thinker e ajustes do sensor OV3660 preservados.
- Resolução SVGA, qualidade JPEG 10, framebuffer em PSRAM e ajustes de imagem preservados.
- Botão físico e acionamento serial removidos.
- Servidor local com GET /status e POST /capture?idDispositivo=ID.
- Reconexão Wi-Fi automática em caso de queda.
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
3. Abra o app e informe o IP exibido no Monitor Serial.
4. Informe o ID de um dispositivo já cadastrado na API VisionHat. Não use o ID do usuário: a rota Java exige um idDispositivo válido que exista no banco.
5. Toque em Testar conexão. O indicador deve mostrar câmera conectada.
6. Toque no botão central Tirar foto.

O IP da câmera e o ID do dispositivo ficam salvos localmente no celular.

## 4. Limites

- O plano gratuito do Render pode entrar em cold start; a primeira análise poderá demorar.
- O app não fotografa usando a câmera do celular: apenas aciona a OV3660 conectada à ESP32-CAM.
- A leitura em voz alta usa a síntese de voz do sistema Android. O áudio deve sair no destino de áudio selecionado no celular, incluindo fones Bluetooth conectados.
- A descrição é baseada em uma imagem estática e não substitui bengala, cão-guia ou outros recursos habituais de mobilidade.