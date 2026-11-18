import { useEffect, useState } from "react";

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
  if (!address) throw new Error("Informe o endereço IP da câmera.");
  const normalized = /^https?:\/\//i.test(address) ? address : "http://" + address;
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:") {
    throw new Error("O endereço local da câmera deve começar com http://.");
  }
  return parsed.origin;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function responseMessage(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return "A câmera respondeu com HTTP " + response.status + ".";
  try {
    const data = JSON.parse(body) as ApiError;
    return data.erro || data.detail || data.message || body;
  } catch {
    return body;
  }
}

function speak(text: string): boolean {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function App() {
  const [cameraAddress, setCameraAddress] = useState(() => localStorage.getItem(CAMERA_KEY) || "");
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || "");
  const [connection, setConnection] = useState<"unknown" | "checking" | "online" | "offline">("unknown");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Configure a câmera para começar.");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { localStorage.setItem(CAMERA_KEY, cameraAddress); }, [cameraAddress]);
  useEffect(() => { localStorage.setItem(DEVICE_KEY, deviceId); }, [deviceId]);
  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
      const response = await fetchWithTimeout(base + "/status", { method: "GET", cache: "no-store" }, 5000);
      if (!response.ok) throw new Error(await responseMessage(response));
      const status = await response.json() as CameraStatus;
      if (status.status !== "online" || status.camera !== "ready") {
        throw new Error("A câmera respondeu, mas ainda não está pronta.");
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
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    let cameraResponded = false;
    try {
      setMessage("A câmera está capturando e enviando a imagem para análise...");
      const response = await fetchWithTimeout(
        base + "/capture?idDispositivo=" + parsedId,
        { method: "POST", cache: "no-store" },
        190000,
      );
      cameraResponded = true;
      setConnection("online");

      const raw = await response.text();
      let data: AnalysisResult | ApiError;
      try {
        data = JSON.parse(raw) as AnalysisResult | ApiError;
      } catch {
        throw new Error(raw || "Resposta inválida da câmera (HTTP " + response.status + ").");
      }

      if (!response.ok) {
        const apiError = data as ApiError;
        throw new Error(apiError.erro || apiError.detail || apiError.message || "Falha HTTP " + response.status + ".");
      }

      const analysis = data as AnalysisResult;
      if (!analysis.descricao) throw new Error("A API não retornou uma descrição para a imagem.");

      setResult(analysis);
      setConnection("online");
      setMessage("Análise concluída.");
      if (!speak(analysis.descricao)) {
        setMessage("Análise concluída. Leitura em voz alta indisponível neste aparelho.");
      }
    } catch (err) {
      setConnection(cameraResponded ? "online" : "offline");
      setMessage("Não foi possível concluir a captura.");
      if (err instanceof Error && err.name === "AbortError") {
        setError("A solicitação excedeu o tempo limite. Aguarde a câmera e a API e tente novamente.");
      } else {
        setError(err instanceof Error ? err.message : "Falha ao comunicar com a câmera.");
      }
    } finally {
      setBusy(false);
    }
  }

  function speakAgain() {
    if (!result) return;
    if (!speak(result.descricao)) setError("A leitura em voz alta não está disponível neste dispositivo.");
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
          <span>Endereço IP da câmera</span>
          <input
            value={cameraAddress}
            onChange={(event) => { setCameraAddress(event.target.value); setConnection("unknown"); }}
            placeholder="Ex.: 192.168.1.50"
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
