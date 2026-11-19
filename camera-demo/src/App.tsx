import { useEffect, useState } from "react";
import { CapacitorHttp } from "@capacitor/core";
import { QueueStrategy, TextToSpeech } from "@capacitor-community/text-to-speech";

type CameraStatus = {
  status?: string;
  camera?: string;
  wifi?: string;
  ip?: string;
};

type AnalysisResult = {
  idDispositivo: number;
  descricao: string;
  modeloIa: string;
  status: string;
  usouFallback: boolean;
};

type ApiError = { erro?: string; detail?: string; message?: string };
type UserResponse = { idUsuario: number; nome?: string; email?: string };
type Device = {
  idDispositivo: number;
  idUsuario: number;
  identificador: string;
  modelo: string;
  status: string;
};

const API_BASE = "https://visionhat-api.onrender.com";
const CAMERA_KEY = "visionhat-camera-address";
const DEVICE_KEY = "visionhat-device-id";
const USER_EMAIL_KEY = "visionhat-user-email";
const CAMERA_MDNS = "visionhat-camera.local";

let offlineVoiceIndex: number | null = null;

function cameraUrl(value: string): string {
  const address = value.trim();
  if (!address) throw new Error("O endereço da câmera não foi informado.");
  const normalized = /^https?:\/\//i.test(address) ? address : "http://" + address;
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:") {
    throw new Error("O endereço local da câmera deve começar com http://.");
  }
  return parsed.origin;
}

function parseResponseData<T>(data: unknown): T {
  if (typeof data === "string") return JSON.parse(data) as T;
  return data as T;
}

function responseMessage(data: unknown, status: number, source = "A câmera"): string {
  if (typeof data === "string") {
    try {
      return responseMessage(JSON.parse(data) as unknown, status, source);
    } catch {
      return data || source + " respondeu com HTTP " + status + ".";
    }
  }
  if (data && typeof data === "object") {
    const error = data as ApiError;
    return error.erro || error.detail || error.message || source + " respondeu com HTTP " + status + ".";
  }
  return source + " respondeu com HTTP " + status + ".";
}

function esperar(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function encontrarVozOfflinePtBr(): Promise<number> {
  if (offlineVoiceIndex !== null) return offlineVoiceIndex;

  const limite = Date.now() + 12000;
  let idiomaEncontrado = false;

  while (Date.now() < limite) {
    try {
      const resposta = await TextToSpeech.getSupportedVoices();
      const vozes = resposta.voices || [];
      const indice = vozes.findIndex(voz => {
        const idioma = voz.lang.toLowerCase().replace("_", "-");
        return idioma.startsWith("pt-br") && voz.localService;
      });

      if (indice >= 0) {
        offlineVoiceIndex = indice;
        return indice;
      }

      const idioma = await TextToSpeech.isLanguageSupported({ lang: "pt-BR" });
      idiomaEncontrado = idioma.supported;
    } catch {
      // O mecanismo Android pode ainda estar inicializando.
    }

    await esperar(350);
  }

  if (idiomaEncontrado) {
    throw new Error(
      "O Android reconheceu português, mas não encontrou uma voz pt-BR disponível offline. " +
      "Nas configurações de Texto para fala, baixe os dados de voz Português (Brasil)."
    );
  }

  throw new Error(
    "O mecanismo de voz do Android não ficou pronto. Abra as configurações de Texto para fala, " +
    "selecione o mecanismo Google e confirme que a voz Português (Brasil) está instalada."
  );
}

async function speak(
  text: string,
  onPlaybackError: (error: unknown) => void
): Promise<void> {
  const texto = text.trim();
  if (!texto) throw new Error("Não há texto disponível para leitura.");

  const voz = await encontrarVozOfflinePtBr();

  // QueueStrategy.Flush (0) faz o próprio plugin interromper a fala anterior.
  // Não chamamos stop() antes: essa chamada também falha quando o TTS ainda inicializa.
  void TextToSpeech.speak({
    text: texto,
    lang: "pt-BR",
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
    voice: voz,
    queueStrategy: QueueStrategy.Flush,
  }).catch(onPlaybackError);
}

async function descobrirCamera(enderecoAtual: string): Promise<{ base: string; status: CameraStatus }> {
  const candidatos: string[] = [];

  for (const endereco of [enderecoAtual, CAMERA_MDNS]) {
    try {
      const base = cameraUrl(endereco || CAMERA_MDNS);
      if (!candidatos.includes(base)) candidatos.push(base);
    } catch {
      // Um endereço salvo incorretamente não impede a tentativa pelo nome mDNS.
    }
  }

  let ultimoErro: unknown = null;

  for (const base of candidatos) {
    try {
      const response = await CapacitorHttp.get({
        url: base + "/status",
        connectTimeout: 5000,
        readTimeout: 5000,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(responseMessage(response.data, response.status));
      }

      const status = parseResponseData<CameraStatus>(response.data);
      if (status.status !== "online" || status.camera !== "ready" || status.wifi !== "connected") {
        throw new Error("A câmera respondeu, mas ainda não está pronta ou conectada ao Wi-Fi.");
      }

      return { base, status };
    } catch (error) {
      ultimoErro = error;
    }
  }

  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error("Não foi possível localizar a ESP32-CAM. Verifique se o celular está na mesma rede.");
}

export default function App() {
  const [cameraAddress, setCameraAddress] = useState(() => localStorage.getItem(CAMERA_KEY) || CAMERA_MDNS);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || "");
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem(USER_EMAIL_KEY) || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loginBusy, setLoginBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [connection, setConnection] = useState<"unknown" | "checking" | "online" | "offline">("unknown");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Entre na sua conta e conecte a câmera para começar.");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { localStorage.setItem(CAMERA_KEY, cameraAddress); }, [cameraAddress]);
  useEffect(() => {
    if (deviceId) localStorage.setItem(DEVICE_KEY, deviceId);
    else localStorage.removeItem(DEVICE_KEY);
  }, [deviceId]);
  useEffect(() => {
    if (loginEmail) localStorage.setItem(USER_EMAIL_KEY, loginEmail);
  }, [loginEmail]);

  useEffect(() => () => {
    void TextToSpeech.stop().catch(() => undefined);
  }, []);

  async function login() {
    if (!loginEmail.trim() || !loginPassword) {
      setAccountError("Informe o e-mail e a senha da sua conta VisionHat.");
      return;
    }

    setLoginBusy(true);
    setAccountError("");
    setError("");

    try {
      const loginResponse = await CapacitorHttp.post({
        url: API_BASE + "/api/usuarios/login",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        data: { email: loginEmail.trim(), senhaHash: loginPassword },
        connectTimeout: 15000,
        readTimeout: 30000,
      });

      if (loginResponse.status < 200 || loginResponse.status >= 300) {
        throw new Error(responseMessage(loginResponse.data, loginResponse.status, "A API"));
      }

      const usuario = parseResponseData<UserResponse>(loginResponse.data);
      if (!Number.isInteger(usuario.idUsuario) || usuario.idUsuario <= 0) {
        throw new Error("A API autenticou a conta, mas não retornou um ID de usuário válido.");
      }

      const dispositivosResponse = await CapacitorHttp.get({
        url: API_BASE + "/api/dispositivos/usuario/" + usuario.idUsuario,
        headers: { Accept: "application/json" },
        connectTimeout: 15000,
        readTimeout: 30000,
      });

      if (dispositivosResponse.status < 200 || dispositivosResponse.status >= 300) {
        throw new Error(responseMessage(dispositivosResponse.data, dispositivosResponse.status, "A API"));
      }

      const lista = parseResponseData<Device[]>(dispositivosResponse.data);
      const ativos = (Array.isArray(lista) ? lista : []).filter(dispositivo =>
        String(dispositivo.status).toUpperCase() !== "I"
      );

      if (ativos.length === 0) {
        throw new Error("Login realizado, mas esta conta não possui um dispositivo ativo cadastrado na API.");
      }

      setDevices(ativos);
      setDeviceId(String(ativos[0].idDispositivo));
      setAccountName(usuario.nome || usuario.email || loginEmail.trim());
      setLoginPassword("");
      setMessage(
        ativos.length === 1
          ? "Conta conectada. Dispositivo VisionHat localizado automaticamente."
          : ativos.length + " dispositivos encontrados. Selecione o que será usado na demonstração."
      );
    } catch (loginError) {
      setAccountError(loginError instanceof Error ? loginError.message : "Não foi possível entrar na conta.");
    } finally {
      setLoginBusy(false);
    }
  }

  function logout() {
    setAccountName("");
    setDevices([]);
    setDeviceId("");
    setLoginPassword("");
    setAccountError("");
  }

  async function testConnection() {
    setConnection("checking");
    setError("");
    setMessage("Localizando a câmera na rede...");

    try {
      const { base, status } = await descobrirCamera(cameraAddress);
      const ip = status.ip || new URL(base).hostname;
      setCameraAddress(ip);
      setConnection("online");
      setMessage("Câmera conectada · IP " + ip);
    } catch (connectionError) {
      setConnection("offline");
      setMessage("Não foi possível localizar a câmera.");
      setError(connectionError instanceof Error ? connectionError.message : "Verifique a rede Wi-Fi da ESP32-CAM.");
    }
  }

  async function capture() {
    const parsedId = Number(deviceId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setError("Entre na conta VisionHat para localizar o dispositivo, ou informe um ID cadastrado.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setMessage("Localizando a câmera...");
    void TextToSpeech.stop().catch(() => undefined);

    let cameraFound = false;
    try {
      const { base, status } = await descobrirCamera(cameraAddress);
      cameraFound = true;
      setConnection("online");
      if (status.ip) setCameraAddress(status.ip);

      setMessage("A câmera está capturando e enviando a imagem para análise...");
      const response = await CapacitorHttp.post({
        url: base + "/capture?idDispositivo=" + parsedId,
        connectTimeout: 20000,
        readTimeout: 180000,
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(responseMessage(response.data, response.status));
      }

      const analysis = parseResponseData<AnalysisResult>(response.data);
      if (!analysis.descricao) throw new Error("A API não retornou uma descrição para a imagem.");

      setResult(analysis);
      setConnection("online");
      setMessage("Análise concluída. Preparando voz local em português...");

      const informarFalhaDeAudio = (audioError: unknown) => {
        setMessage("Análise concluída, mas não foi possível reproduzir o áudio.");
        setError(
          audioError instanceof Error
            ? audioError.message
            : "Verifique se existe uma voz pt-BR instalada para uso offline."
        );
      };

      try {
        await speak(analysis.descricao, informarFalhaDeAudio);
        setMessage("Análise concluída. Reproduzindo descrição.");
      } catch (audioError) {
        informarFalhaDeAudio(audioError);
      }
    } catch (captureError) {
      setConnection(cameraFound ? "online" : "offline");
      setMessage("Não foi possível concluir a captura.");
      setError(captureError instanceof Error ? captureError.message : "Falha ao comunicar com a câmera ou com a API.");
    } finally {
      setBusy(false);
    }
  }

  async function speakAgain() {
    if (!result) return;
    setError("");
    setMessage("Preparando leitura da descrição...");

    const informarFalhaDeAudio = (audioError: unknown) => {
      setMessage("Não foi possível reproduzir o áudio.");
      setError(audioError instanceof Error ? audioError.message : "Verifique a voz pt-BR instalada.");
    };

    try {
      await speak(result.descricao, informarFalhaDeAudio);
      setMessage("Reproduzindo descrição.");
    } catch (audioError) {
      informarFalhaDeAudio(audioError);
    }
  }

  async function stopSpeech() {
    try {
      await TextToSpeech.stop();
      setMessage("Leitura interrompida.");
    } catch {
      setError("Não foi possível interromper a leitura de voz.");
    }
  }

  async function testVoice() {
    setError("");
    setMessage("Testando a voz local em português brasileiro...");
    const informarFalhaDeAudio = (audioError: unknown) => {
      setMessage("O teste de voz não conseguiu iniciar.");
      setError(audioError instanceof Error ? audioError.message : "Verifique a voz pt-BR offline instalada.");
    };

    try {
      await speak(
        "VisionHat ativo. Este é um teste de áudio em português brasileiro. A síntese de voz está sendo executada localmente no aparelho.",
        informarFalhaDeAudio
      );
      setMessage("Teste de voz iniciado. Nenhuma chamada de análise foi realizada.");
    } catch (audioError) {
      informarFalhaDeAudio(audioError);
    }
  }

  const canCapture = !busy && cameraAddress.trim().length > 0 && deviceId.trim().length > 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">V</div>
        <div>
          <p className="brand-name">VisionHat</p>
          <p className="brand-caption">Assistente visual</p>
        </div>
        <div className={"connection-pill " + connection} role="status" aria-live="polite">
          <span className="connection-dot" />
          {connection === "online" ? "Conectada" : connection === "checking" ? "Localizando" : connection === "offline" ? "Desconectada" : "Não verificada"}
        </div>
      </header>

      <section className="settings-card" aria-label="Conta VisionHat">
        <div className="settings-heading">
          <div>
            <h2>Conta VisionHat</h2>
            <p>Entre para localizar automaticamente seu dispositivo cadastrado.</p>
          </div>
          {accountName && <button className="text-button" type="button" onClick={logout}>Sair</button>}
        </div>

        {accountName ? (
          <p className="account-caption">Conectado como <strong>{accountName}</strong></p>
        ) : (
          <>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={loginEmail}
                onChange={event => setLoginEmail(event.target.value)}
                placeholder="seu@email.com"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={loginPassword}
                onChange={event => setLoginPassword(event.target.value)}
                placeholder="Senha da conta"
                autoCapitalize="none"
              />
            </label>
            <button className="text-button login-button" type="button" onClick={login} disabled={loginBusy}>
              {loginBusy ? "Entrando e buscando dispositivo..." : "Entrar e localizar dispositivo"}
            </button>
          </>
        )}

        {devices.length > 1 && (
          <label className="field">
            <span>Dispositivo da demonstração</span>
            <select
              className="field-select"
              value={deviceId}
              onChange={event => setDeviceId(event.target.value)}
            >
              {devices.map(dispositivo => (
                <option key={dispositivo.idDispositivo} value={String(dispositivo.idDispositivo)}>
                  {dispositivo.identificador || dispositivo.modelo || "VisionHat"} · #{dispositivo.idDispositivo}
                </option>
              ))}
            </select>
          </label>
        )}

        {accountError && <p className="error-message" role="alert">{accountError}</p>}
      </section>

      <section className="capture-panel" aria-labelledby="capture-title">
        <p className="eyebrow">CAPTURA ASSISTIDA</p>
        <h1 id="capture-title">O que está à sua frente?</h1>
        <p className="intro">Toque no botão para registrar uma imagem com a câmera dos óculos e receber uma descrição em áudio.</p>

        <button
          className={"capture-button " + (busy ? "capturing" : "")}
          type="button"
          onClick={capture}
          disabled={!canCapture}
          aria-label={busy ? "Captura em andamento" : "Tirar foto com os óculos VisionHat"}
        >
          {busy ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M22 14h20l5 8h6a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V27a5 5 0 0 1 5-5h6l5-8Z" />
              <circle cx="32" cy="36" r="11" />
              <circle className="camera-flash" cx="49" cy="28" r="2.5" />
            </svg>
          )}
          <span>{busy ? "AGUARDE" : "TIRAR FOTO"}</span>
        </button>

        <p className="status-message" role="status" aria-live="polite">{message}</p>
        <p className="hint">Mantenha o celular conectado à mesma rede Wi-Fi da câmera.</p>
      </section>

      <section className="settings-card" aria-label="Configuração da câmera">
        <div className="settings-heading">
          <div>
            <h2>Conexão</h2>
            <p>O app procura o nome local e preenche o IP encontrado.</p>
          </div>
          <button className="text-button" type="button" onClick={testConnection} disabled={connection === "checking" || busy}>
            {connection === "checking" ? "Localizando..." : "Localizar câmera"}
          </button>
        </div>

        <label className="field">
          <span>IP/endereço da câmera</span>
          <input
            value={cameraAddress}
            onChange={event => { setCameraAddress(event.target.value); setConnection("unknown"); }}
            placeholder={CAMERA_MDNS}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span>ID do dispositivo</span>
          <input
            value={deviceId}
            onChange={event => setDeviceId(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Preenchido após o login"
            inputMode="numeric"
            type="number"
            min="1"
            readOnly={devices.length === 1}
          />
        </label>

        <button className="text-button login-button" type="button" onClick={testVoice}>
          Testar voz local · sem consumir IA
        </button>

        {error && <p className="error-message" role="alert">{error}</p>}
      </section>

      {result && (
        <section className="result-card" aria-labelledby="result-title">
          <div className="result-header">
            <div>
              <p className="eyebrow">RESULTADO</p>
              <h2 id="result-title">Descrição do ambiente</h2>
            </div>
            <span className="success-tag">Concluída</span>
          </div>
          <p className="description">{result.descricao}</p>
          <p className="model-note">Modelo: {result.modeloIa}{result.usouFallback ? " · modelo alternativo utilizado" : ""}</p>
          <div className="audio-actions">
            <button className="audio-button" type="button" onClick={speakAgain}>Ouvir novamente</button>
            <button className="audio-button secondary" type="button" onClick={stopSpeech}>Parar áudio</button>
          </div>
        </section>
      )}

      <footer className="footer-note">
        Protótipo de demonstração · A descrição é baseada em uma imagem estática e não substitui recursos habituais de mobilidade.
      </footer>
    </main>
  );
}
