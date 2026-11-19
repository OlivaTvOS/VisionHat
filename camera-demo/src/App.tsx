import { useEffect, useState } from "react";
import { CapacitorHttp } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

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

const CAMERA_KEY = "visionhat-camera-address";
const DEVICE_KEY = "visionhat-device-id";

function cameraUrl(value: string): string {
  const address = value.trim();
  if (!address) throw new Error("Informe o endereço ou nome local da câmera.");
  const normalized = /^https?:\/\//i.test(address) ? address : "http://" + address;
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:") {
    throw new Error("O endereço local da câmera deve começar com http://.");
  }
  return parsed.origin;
}

function parseResponseData<T>(data: unknown): T {
  if (typeof data === "string") {
    return JSON.parse(data) as T;
  }
  return data as T;
}

function responseMessage(data: unknown, status: number): string {
  if (typeof data === "string") {
    const body = data;
    try {
      const parsed = JSON.parse(body) as unknown;
      return responseMessage(parsed, status);
    } catch {
      return body || "A câmera respondeu com HTTP " + status + ".";
    }
  }

  if (data && typeof data === "object") {
    const error = data as ApiError;
    return error.erro || error.detail || error.message || "A câmera respondeu com HTTP " + status + ".";
  }

  return "A câmera respondeu com HTTP " + status + ".";
}

async function speak(text: string): Promise<void> {
  const texto = text.trim();

  if (!texto) {
    throw new Error("Não há texto disponível para leitura.");
  }

  const idioma = await TextToSpeech.isLanguageSupported({ lang: "pt-BR" });

  if (!idioma.supported) {
    throw new Error(
      "O Android não encontrou uma voz em português do Brasil. " +
      "Instale ou atualize o mecanismo de texto para fala do Google e baixe a voz Português (Brasil) nas configurações de Texto para fala."
    );
  }

  await TextToSpeech.stop();
  await TextToSpeech.speak({
    text: texto,
    lang: "pt-BR",
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
  });
}

export default function App() {
  const [cameraAddress, setCameraAddress] = useState(() => localStorage.getItem(CAMERA_KEY) || "visionhat-camera.local");
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || "");
  const [connection, setConnection] = useState<"unknown" | "checking" | "online" | "offline">("unknown");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Configure a câmera para começar.");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { localStorage.setItem(CAMERA_KEY, cameraAddress); }, [cameraAddress]);
  useEffect(() => { localStorage.setItem(DEVICE_KEY, deviceId); }, [deviceId]);
  useEffect(() => () => {
    void TextToSpeech.stop().catch(() => undefined);
  }, []);

  async function testConnection() {
    let base: string;
    try {
      base = cameraUrl(cameraAddress);
    } catch (err) {
      setConnection("offline");
      setError(err instanceof Error ? err.message : "Endereço da câmera inválido.");
      return;
    }

    setConnection("checking");
    setError("");
    setMessage("Verificando conexão com a câmera...");
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
        throw new Error("A câmera respondeu, mas a câmera ou a conexão Wi-Fi ainda não está pronta.");
      }
      setConnection("online");
      setMessage("Câmera conectada · IP " + (status.ip || "local"));
    } catch (err) {
      setConnection("offline");
      setMessage("Não foi possível conectar à câmera.");
      setError(err instanceof Error ? err.message : "Verifique o IP e a rede Wi-Fi.");
    }
  }

  async function capture() {
    const parsedId = Number(deviceId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setError("Informe o ID de um dispositivo VisionHat já cadastrado.");
      return;
    }

    let base: string;
    try {
      base = cameraUrl(cameraAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Endereço da câmera inválido.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setMessage("Solicitando fotografia à câmera...");
    void TextToSpeech.stop().catch(() => undefined);

    let cameraResponded = false;
    try {
      setMessage("A câmera está capturando e enviando a imagem para análise...");
      const response = await CapacitorHttp.post({
        url: base + "/capture?idDispositivo=" + parsedId,
        connectTimeout: 20000,
        readTimeout: 180000,
      });
      cameraResponded = true;
      setConnection("online");

      if (response.status < 200 || response.status >= 300) {
        throw new Error(responseMessage(response.data, response.status));
      }

      const analysis = parseResponseData<AnalysisResult>(response.data);
      if (!analysis.descricao) throw new Error("A API não retornou uma descrição para a imagem.");

      setResult(analysis);
      setConnection("online");
      setMessage("Análise concluída. Iniciando leitura em voz alta...");

      try {
        await speak(analysis.descricao);
        setMessage("Análise concluída.");
      } catch (audioError) {
        setMessage("Análise concluída, mas não foi possível iniciar o áudio.");
        setError(
          audioError instanceof Error
            ? audioError.message
            : "Verifique o mecanismo de texto para fala do Android."
        );
      }
    } catch (err) {
      setConnection(cameraResponded ? "online" : "offline");
      setMessage("Não foi possível concluir a captura.");
      setError(err instanceof Error ? err.message : "Falha ao comunicar com a câmera.");
    } finally {
      setBusy(false);
    }
  }

  async function speakAgain() {
    if (!result) return;

    setError("");
    try {
      await speak(result.descricao);
      setMessage("Reproduzindo descrição.");
    } catch (audioError) {
      setMessage("Não foi possível iniciar o áudio.");
      setError(
        audioError instanceof Error
          ? audioError.message
          : "Verifique o mecanismo de texto para fala do Android."
      );
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
          {connection === "online" ? "Conectada" : connection === "checking" ? "Verificando" : connection === "offline" ? "Desconectada" : "Não verificada"}
        </div>
      </header>

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
            <p>Configure uma vez. Os dados ficam salvos neste celular.</p>
          </div>
          <button className="text-button" type="button" onClick={testConnection} disabled={connection === "checking" || busy}>
            {connection === "checking" ? "Verificando..." : "Testar conexão"}
          </button>
        </div>

        <label className="field">
          <span>Endereço da câmera (nome ou IP)</span>
          <input
            value={cameraAddress}
            onChange={(event) => { setCameraAddress(event.target.value); setConnection("unknown"); }}
            placeholder="visionhat-camera.local"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span>ID do dispositivo cadastrado</span>
          <input
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ex.: 1"
            inputMode="numeric"
            type="number"
            min="1"
          />
        </label>

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
