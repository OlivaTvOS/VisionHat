package global.vision.hat.service;

import global.vision.hat.dto.AnaliseIaResultado;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AiService {
    private final ObjectMapper objectMapper;
    private final String provedorPrincipal;
    private final String provedoresAlternativos;
    private final String geminiApiKey;
    private final String geminiModelo;
    private final String geminiApiUrl;
    private final String claudeApiKey;
    private final String claudeModelo;
    private final String claudeApiUrl;
    private final String openaiApiKey;
    private final String openaiModelo;
    private final String openaiApiUrl;

    public AiService(
            ObjectMapper objectMapper,
            @Value("${ai.provider:gemini}") String provedorPrincipal,
            @Value("${ai.fallback-providers:}") String provedoresAlternativos,
            @Value("${gemini.api-key:}") String geminiApiKey,
            @Value("${gemini.model:gemini-3.5-flash-lite}") String geminiModelo,
            @Value("${gemini.api-url:https://generativelanguage.googleapis.com}") String geminiApiUrl,
            @Value("${claude.api-key:}") String claudeApiKey,
            @Value("${claude.model:}") String claudeModelo,
            @Value("${claude.api-url:https://api.anthropic.com}") String claudeApiUrl,
            @Value("${openai.api-key:}") String openaiApiKey,
            @Value("${openai.model:}") String openaiModelo,
            @Value("${openai.api-url:https://api.openai.com}") String openaiApiUrl) {
        this.objectMapper = objectMapper;
        this.provedorPrincipal = normalizar(provedorPrincipal);
        this.provedoresAlternativos = provedoresAlternativos;
        this.geminiApiKey = geminiApiKey;
        this.geminiModelo = geminiModelo;
        this.geminiApiUrl = geminiApiUrl;
        this.claudeApiKey = claudeApiKey;
        this.claudeModelo = claudeModelo;
        this.claudeApiUrl = claudeApiUrl;
        this.openaiApiKey = openaiApiKey;
        this.openaiModelo = openaiModelo;
        this.openaiApiUrl = openaiApiUrl;
    }

    public AnaliseIaResultado descreverImagem(byte[] imagem, String tipoMime) {
        List<String> provedores = listarProvedores();
        AiException ultimoErro = null;

        for (int indice = 0; indice < provedores.size(); indice++) {
            String provedor = provedores.get(indice);
            try {
                String descricao = switch (provedor) {
                    case "gemini" -> descreverComGemini(imagem, tipoMime);
                    case "claude" -> descreverComClaude(imagem, tipoMime);
                    case "openai" -> descreverComOpenai(imagem, tipoMime);
                    default -> throw new AiException("O provedor de IA configurado é inválido. Use gemini, claude ou openai.");
                };
                return new AnaliseIaResultado(descricao, modeloDo(provedor), indice > 0);
            } catch (AiException erro) {
                if (!erro.deveTentarFallback()) {
                    throw erro;
                }
                ultimoErro = erro;
            }
        }

        throw new AiException(
                "Todos os provedores de IA configurados estão sem disponibilidade de cota ou limite de requisições.",
                ultimoErro,
                true);
    }

    private List<String> listarProvedores() {
        if (!ehProvedorValido(provedorPrincipal)) {
            throw new AiException("O provedor principal é inválido. Use gemini, claude ou openai.");
        }

        List<String> provedores = new ArrayList<>();
        provedores.add(provedorPrincipal);
        if (provedoresAlternativos == null || provedoresAlternativos.isBlank()) {
            return provedores;
        }

        for (String provedor : provedoresAlternativos.split(",")) {
            String provedorNormalizado = normalizar(provedor);
            if (ehProvedorValido(provedorNormalizado)
                    && !provedores.contains(provedorNormalizado)) {
                provedores.add(provedorNormalizado);
            }
        }
        return provedores;
    }

    private String descreverComGemini(byte[] imagem, String tipoMime) {
        verificarConfiguracao(geminiApiKey, "gemini.api-key");
        String imagemBase64 = Base64.getEncoder().encodeToString(imagem);
        Map<String, Object> corpo = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", textoDaAnalise()),
                                Map.of("inline_data", Map.of(
                                        "mime_type", tipoMime,
                                        "data", imagemBase64))
                        )
                ))
        );

        String resposta = enviar(
                geminiApiUrl,
                "/v1beta/models/" + geminiModelo + ":generateContent",
                Map.of("x-goog-api-key", geminiApiKey),
                corpo,
                "Gemini");
        try {
            JsonNode raiz = objectMapper.readTree(resposta);
            String descricao = raiz.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText();
            return validarDescricao(descricao, "Gemini");
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException("A resposta da API Gemini possui formato inválido.", e);
        }
    }

    private String descreverComClaude(byte[] imagem, String tipoMime) {
        verificarConfiguracao(claudeApiKey, "claude.api-key");
        verificarConfiguracao(claudeModelo, "claude.model");
        String imagemBase64 = Base64.getEncoder().encodeToString(imagem);
        Map<String, Object> imagemBloco = Map.of(
                "type", "image",
                "source", Map.of(
                        "type", "base64",
                        "media_type", tipoMime,
                        "data", imagemBase64));
        Map<String, Object> corpo = Map.of(
                "model", claudeModelo,
                "max_tokens", 500,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                imagemBloco,
                                Map.of("type", "text", "text", textoDaAnalise())))));

        String resposta = enviar(
                claudeApiUrl,
                "/v1/messages",
                Map.of("x-api-key", claudeApiKey, "anthropic-version", "2023-06-01"),
                corpo,
                "Claude");
        try {
            JsonNode raiz = objectMapper.readTree(resposta);
            String descricao = raiz.path("content").path(0).path("text").asText();
            return validarDescricao(descricao, "Claude");
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException("A resposta da API Claude possui formato inválido.", e);
        }
    }

    private String descreverComOpenai(byte[] imagem, String tipoMime) {
        verificarConfiguracao(openaiApiKey, "openai.api-key");
        verificarConfiguracao(openaiModelo, "openai.model");
        String imagemBase64 = Base64.getEncoder().encodeToString(imagem);
        Map<String, Object> imagemBloco = Map.of(
                "type", "input_image",
                "image_url", "data:" + tipoMime + ";base64," + imagemBase64);
        Map<String, Object> corpo = Map.of(
                "model", openaiModelo,
                "max_output_tokens", 500,
                "input", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "input_text", "text", textoDaAnalise()),
                                imagemBloco))));

        String resposta = enviar(
                openaiApiUrl,
                "/v1/responses",
                Map.of("Authorization", "Bearer " + openaiApiKey),
                corpo,
                "OpenAI");
        try {
            JsonNode raiz = objectMapper.readTree(resposta);
            List<String> textos = new ArrayList<>();
            for (JsonNode item : raiz.path("output")) {
                for (JsonNode parte : item.path("content")) {
                    if ("output_text".equals(parte.path("type").asText())) {
                        textos.add(parte.path("text").asText());
                    }
                }
            }
            return validarDescricao(String.join("\n", textos), "OpenAI");
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException("A resposta da API OpenAI possui formato inválido.", e);
        }
    }

    private String enviar(String apiUrl, String caminho, Map<String, String> cabecalhos,
                          Map<String, Object> corpo, String nomeProvedor) {
        try {
            RestClient.RequestBodySpec requisicao = RestClient.builder()
                    .baseUrl(apiUrl)
                    .build()
                    .post()
                    .uri(caminho)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo);
            for (Map.Entry<String, String> cabecalho : cabecalhos.entrySet()) {
                requisicao.header(cabecalho.getKey(), cabecalho.getValue());
            }
            return requisicao.retrieve().body(String.class);
        } catch (RestClientResponseException e) {
            int status = e.getStatusCode().value();
            String resposta = e.getResponseBodyAsString();
            boolean deveAlternar = indicaLimiteOuCota(nomeProvedor, status, resposta);
            String detalhe = extrairDetalheErro(resposta);
            String mensagem = "A API " + nomeProvedor
                    + " recusou a solicitação (HTTP " + status + ").";
            if (!detalhe.isBlank()) {
                mensagem += " " + detalhe;
            }
            throw new AiException(mensagem, e, deveAlternar);
        } catch (RestClientException e) {
            throw new AiException(
                    "Não foi possível estabelecer comunicação com a API " + nomeProvedor + ".",
                    e,
                    false);
        }
    }

    private String extrairDetalheErro(String resposta) {
        if (resposta == null || resposta.isBlank()) {
            return "";
        }

        try {
            JsonNode raiz = objectMapper.readTree(resposta);
            JsonNode erro = raiz.path("error");
            String mensagem = erro.path("message").asText();
            String status = erro.path("status").asText();

            if (!mensagem.isBlank()) {
                return status.isBlank() ? mensagem : status + ": " + mensagem;
            }
        } catch (Exception ignored) {
            // Algumas respostas de erro podem não estar em JSON.
        }

        String texto = resposta.replaceAll("\\s+", " ").trim();
        return texto.length() > 400 ? texto.substring(0, 400) : texto;
    }

    private boolean indicaLimiteOuCota(String provedor, int status, String resposta) {
        String texto = resposta == null ? "" : resposta.toLowerCase();
        if (status == 429) {
            return true;
        }
        if ("gemini".equals(provedor)) {
            return texto.contains("resource_exhausted") || texto.contains("quota");
        }
        if ("claude".equals(provedor)) {
            return status == 400 && (texto.contains("credit")
                    || texto.contains("balance")
                    || texto.contains("insufficient"));
        }
        return "openai".equals(provedor)
                && status == 429
                && (texto.contains("insufficient_quota")
                || texto.contains("credit_balance_exhausted")
                || texto.contains("rate_limit"));
    }

    private String modeloDo(String provedor) {
        return switch (provedor) {
            case "gemini" -> geminiModelo;
            case "claude" -> claudeModelo;
            case "openai" -> openaiModelo;
            default -> provedor;
        };
    }

    private void verificarConfiguracao(String valor, String propriedade) {
        if (valor == null || valor.isBlank()) {
            throw new AiException("Configure " + propriedade + " no application.properties.");
        }
    }

    private String validarDescricao(String descricao, String provedor) {
        if (descricao == null || descricao.isBlank()) {
            throw new AiException("A API " + provedor + " não retornou uma descrição válida.");
        }
        return descricao;
    }

    private String textoDaAnalise() {
        return "Descreva de forma objetiva os obstáculos e elementos relevantes visíveis nesta imagem para auxiliar uma pessoa com deficiência visual. Não invente informações que não estejam visíveis.";
    }

    private String normalizar(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase();
    }

    private boolean ehProvedorValido(String provedor) {
        return "gemini".equals(provedor) || "claude".equals(provedor) || "openai".equals(provedor);
    }
}
