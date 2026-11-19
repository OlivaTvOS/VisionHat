#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "wifi_config.h"

// ==========================================
// PINAGEM ESP32-CAM AI THINKER / OV3660
// ==========================================

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================

const char* API_URL = "https://visionhat-api.onrender.com/analises/imagem";

WebServer servidor(80);
bool cameraPronta = false;
unsigned long ultimaTentativaWiFi = 0;
const unsigned long intervaloReconexao = 10000;

// ==========================================
// CONFIGURAÇÃO DA IMAGEM
// Mantida a configuração já validada na OV3660.
// ==========================================

void configurarImagem() {
  sensor_t *sensor = esp_camera_sensor_get();

  if (sensor == nullptr) {
    Serial.println("ERRO_SENSOR");
    return;
  }

  sensor->set_whitebal(sensor, 1);
  sensor->set_awb_gain(sensor, 1);
  sensor->set_wb_mode(sensor, 2);

  sensor->set_exposure_ctrl(sensor, 1);
  sensor->set_aec2(sensor, 1);
  sensor->set_ae_level(sensor, 2);

  sensor->set_gain_ctrl(sensor, 1);

  sensor->set_brightness(sensor, 1);
  sensor->set_contrast(sensor, 2);
  sensor->set_saturation(sensor, 1);
  sensor->set_lenc(sensor, 1);

  Serial.println("CONFIGURACAO_IMAGEM_OK");
}

// ==========================================
// WI-FI
// ==========================================

void conectarWiFi() {
  Serial.println();
  Serial.println("Conectando ao Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.setHostname("visionhat-camera");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;

  while (WiFi.status() != WL_CONNECTED && tentativas < 40) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WIFI_CONECTADO");
    Serial.print("IP_CAMERA: ");
    Serial.println(WiFi.localIP());

    Serial.print("Sinal Wi-Fi: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("ERRO_WIFI");
    Serial.println("O firmware continuará tentando reconectar.");
  }
}

// ==========================================
// RESPOSTAS HTTP E CORS
// ==========================================

void adicionarCabecalhosCors() {
  servidor.sendHeader("Access-Control-Allow-Origin", "*");
  servidor.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  servidor.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  servidor.sendHeader("Access-Control-Allow-Private-Network", "true");
  servidor.sendHeader("Cache-Control", "no-store");
}

String escaparJson(const String& texto) {
  String resultado;
  resultado.reserve(texto.length() + 16);

  for (size_t i = 0; i < texto.length(); i++) {
    char caractere = texto[i];

    if (caractere == '"' || caractere == '\\') {
      resultado += '\\';
      resultado += caractere;
    } else if (caractere == '\n') {
      resultado += "\\n";
    } else if (caractere == '\r') {
      resultado += "\\r";
    } else if (caractere == '\t') {
      resultado += "\\t";
    } else if ((uint8_t)caractere >= 0x20) {
      resultado += caractere;
    }
  }

  return resultado;
}

void responderErro(int codigo, const String& mensagem) {
  adicionarCabecalhosCors();
  String resposta = "{\"erro\":\"" + escaparJson(mensagem) + "\"}";
  servidor.send(codigo, "application/json; charset=utf-8", resposta);
}

void responderStatus() {
  adicionarCabecalhosCors();

  String resposta = "{";
  resposta += "\"status\":\"online\",";
  resposta += "\"camera\":\"";
  resposta += cameraPronta ? "ready" : "unavailable";
  resposta += "\",";
  resposta += "\"wifi\":\"";
  resposta += WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  resposta += "\",";
  resposta += "\"ip\":\"";
  resposta += WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "";
  resposta += "\"}";

  servidor.send(200, "application/json; charset=utf-8", resposta);
}

// ==========================================
// CAPTURA E ENVIO DIRETO PARA A API JAVA
// ==========================================

void capturarEAnalisar() {
  if (!cameraPronta) {
    responderErro(503, "A câmera ainda não está pronta.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    responderErro(503, "A câmera está sem conexão Wi-Fi.");
    return;
  }

  if (!servidor.hasArg("idDispositivo")) {
    responderErro(400, "Informe o parâmetro idDispositivo.");
    return;
  }

  int idDispositivo = servidor.arg("idDispositivo").toInt();

  if (idDispositivo <= 0) {
    responderErro(400, "O ID do dispositivo deve ser maior que zero.");
    return;
  }

  Serial.println();
  Serial.println("SOLICITACAO_RECEBIDA");
  Serial.printf("ID_DISPOSITIVO: %d\n", idDispositivo);
  Serial.println("CAPTURANDO_IMAGEM");

  camera_fb_t *imagem = esp_camera_fb_get();

  if (imagem == nullptr) {
    responderErro(500, "Não foi possível capturar a imagem.");
    Serial.println("ERRO_CAPTURA");
    return;
  }

  if (imagem->format != PIXFORMAT_JPEG) {
    esp_camera_fb_return(imagem);
    responderErro(500, "A câmera não retornou uma imagem JPEG.");
    return;
  }

  if (imagem->len == 0 || imagem->len > 5 * 1024 * 1024) {
    esp_camera_fb_return(imagem);
    responderErro(413, "A imagem está vazia ou ultrapassa 5 MB.");
    return;
  }

  Serial.printf("IMAGEM_CAPTURADA: %u bytes\n", imagem->len);
  Serial.println("ENVIANDO_PARA_API");

  const String limite = "----VisionHatBoundaryESP32CAM";
  const String inicio =
      "--" + limite + "\r\n"
      "Content-Disposition: form-data; name=\"imagem\"; filename=\"visionhat.jpg\"\r\n"
      "Content-Type: image/jpeg\r\n\r\n";
  const String fim = "\r\n--" + limite + "--\r\n";

  size_t tamanhoInicio = inicio.length();
  size_t tamanhoFim = fim.length();
  size_t tamanhoTotal = tamanhoInicio + imagem->len + tamanhoFim;

  uint8_t *corpo = (uint8_t*)ps_malloc(tamanhoTotal);

  if (corpo == nullptr) {
    esp_camera_fb_return(imagem);
    responderErro(500, "Memória insuficiente para preparar o envio.");
    Serial.println("ERRO_MEMORIA");
    return;
  }

  memcpy(corpo, inicio.c_str(), tamanhoInicio);
  memcpy(corpo + tamanhoInicio, imagem->buf, imagem->len);
  memcpy(corpo + tamanhoInicio + imagem->len, fim.c_str(), tamanhoFim);

  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure();

  HTTPClient http;
  http.setConnectTimeout(20000);
  http.setTimeout(65000);
  http.setReuse(false);

  String endereco = String(API_URL) + "?idDispositivo=" + String(idDispositivo);

  if (!http.begin(clienteSeguro, endereco)) {
    free(corpo);
    esp_camera_fb_return(imagem);
    responderErro(502, "Não foi possível iniciar a conexão segura com a API.");
    Serial.println("ERRO_CONEXAO_API");
    return;
  }

  http.addHeader("Content-Type", "multipart/form-data; boundary=" + limite);
  http.addHeader("Accept", "application/json");

  int codigoResposta = http.POST(corpo, tamanhoTotal);
  String respostaApi = "";

  if (codigoResposta > 0) {
    respostaApi = http.getString();
  }

  String erroHttp = codigoResposta <= 0 ? http.errorToString(codigoResposta) : "";
  http.end();
  free(corpo);
  esp_camera_fb_return(imagem);

  if (codigoResposta <= 0) {
    Serial.printf("ERRO_HTTP: %s\n", erroHttp.c_str());
    responderErro(502, "Falha ao enviar a imagem para a API VisionHat. Verifique a rede e o serviço.");
    return;
  }

  Serial.printf("RESPOSTA_API_HTTP: %d\n", codigoResposta);

  if (respostaApi.length() == 0) {
    responderErro(502, "A API respondeu sem conteúdo.");
    return;
  }

  adicionarCabecalhosCors();
  servidor.send(codigoResposta, "application/json; charset=utf-8", respostaApi);

  if (codigoResposta >= 200 && codigoResposta < 300) {
    Serial.println("ANALISE_CONCLUIDA");
  } else {
    Serial.println("ERRO_RETORNADO_PELA_API");
  }
}

// ==========================================
// SERVIDOR LOCAL DA CÂMERA
// ==========================================

void iniciarServidor() {
  servidor.on("/", HTTP_GET, []() {
    adicionarCabecalhosCors();
    servidor.send(
      200,
      "text/plain; charset=utf-8",
      "VisionHat Camera online. Use GET /status e POST /capture?idDispositivo=ID."
    );
  });

  servidor.on("/status", HTTP_GET, responderStatus);

  servidor.on("/capture", HTTP_OPTIONS, []() {
    adicionarCabecalhosCors();
    servidor.send(204);
  });

  servidor.on("/status", HTTP_OPTIONS, []() {
    adicionarCabecalhosCors();
    servidor.send(204);
  });

  servidor.on("/capture", HTTP_POST, capturarEAnalisar);

  servidor.onNotFound([]() {
    responderErro(404, "Rota não encontrada.");
  });

  servidor.begin();
  Serial.println("SERVIDOR_HTTP_INICIADO");
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n=== VISIONHAT - OV3660 / WI-FI ===");

  camera_config_t config = {};

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = 10;
  config.fb_count = 1;

  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.grab_mode = CAMERA_GRAB_LATEST;

  esp_err_t resultado = esp_camera_init(&config);

  if (resultado != ESP_OK) {
    Serial.printf("ERRO_CAMERA: 0x%x\n", resultado);
    return;
  }

  configurarImagem();
  cameraPronta = true;

  conectarWiFi();
  iniciarServidor();

  Serial.println("CAMERA_OK");
  Serial.println("AGUARDANDO_APP");
}

// ==========================================
// LOOP PRINCIPAL
// ==========================================

void loop() {
  servidor.handleClient();

  if (WiFi.status() != WL_CONNECTED
      && millis() - ultimaTentativaWiFi >= intervaloReconexao) {
    ultimaTentativaWiFi = millis();
    Serial.println("WI-FI_DESCONECTADO_RECONEXAO");
    WiFi.reconnect();
  }

  delay(2);
}
