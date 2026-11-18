package global.vision.hat.service;

import global.vision.hat.dao.HistoricoAnaliseDAO;
import global.vision.hat.dao.DispositivoDAO;
import global.vision.hat.dto.AnaliseImagemResponse;
import global.vision.hat.dto.AnaliseIaResultado;
import global.vision.hat.dto.HistoricoAnalise;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class HistoricoAnaliseService {
    private final HistoricoAnaliseDAO historicoAnaliseDAO;
    private final DispositivoDAO dispositivoDAO;
    private final AiService aiService;

    public HistoricoAnaliseService(HistoricoAnaliseDAO historicoAnaliseDAO,
                                   DispositivoDAO dispositivoDAO,
                                   AiService aiService) {
        this.historicoAnaliseDAO = historicoAnaliseDAO;
        this.dispositivoDAO = dispositivoDAO;
        this.aiService = aiService;
    }

    public Optional<HistoricoAnalise> buscarPorId(int idAnalise) {
        validarId(idAnalise, "análise");
        return historicoAnaliseDAO.buscarPorId(idAnalise);
    }

    public List<HistoricoAnalise> listarPorDispositivo(int idDispositivo) {
        validarId(idDispositivo, "dispositivo");
        return historicoAnaliseDAO.listarPorDispositivo(idDispositivo);
    }

    public void registrar(HistoricoAnalise analise) {
        if (analise == null) {
            throw new IllegalArgumentException("A análise deve ser informada.");
        }
        validarId(analise.getIdDispositivo(), "dispositivo");
        if (analise.getIdLocalizacao() != null) {
            validarId(analise.getIdLocalizacao(), "localização");
        }
        historicoAnaliseDAO.inserir(analise);
    }

    public AnaliseImagemResponse analisarImagem(int idDispositivo, MultipartFile imagem) {
        validarId(idDispositivo, "dispositivo");
        byte[] bytesImagem = lerImagem(imagem);
        validarImagem(imagem, bytesImagem);
        if (dispositivoDAO.buscarPorId(idDispositivo).isEmpty()) {
            throw new NoSuchElementException("Dispositivo não encontrado.");
        }

        try {
            AnaliseIaResultado resultado = aiService.descreverImagem(bytesImagem, "image/jpeg");
            return new AnaliseImagemResponse(
                    idDispositivo,
                    resultado.getDescricao(),
                    resultado.getModeloIa(),
                    "CONCLUIDA",
                    resultado.isUsouFallback());
        } catch (AiException e) {
            throw e;
        }
    }

    public void atualizarResultado(HistoricoAnalise analise) {
        if (analise == null) {
            throw new IllegalArgumentException("A análise deve ser informada.");
        }
        validarId(analise.getIdAnalise(), "análise");
        if (!statusValido(analise.getStatus())) {
            throw new IllegalArgumentException("O status da análise é inválido.");
        }
        verificarExistencia(analise.getIdAnalise());
        historicoAnaliseDAO.atualizarResultado(analise);
    }

    private boolean statusValido(String status) {
        return "PENDENTE".equals(status)
                || "PROCESSANDO".equals(status)
                || "CONCLUIDA".equals(status)
                || "FALHA".equals(status);
    }

    private void verificarExistencia(int idAnalise) {
        if (historicoAnaliseDAO.buscarPorId(idAnalise).isEmpty()) {
            throw new NoSuchElementException("Análise não encontrada.");
        }
    }

    private void validarId(int id, String entidade) {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID de " + entidade + " deve ser maior que zero.");
        }
    }

    private byte[] lerImagem(MultipartFile imagem) {
        if (imagem == null) {
            throw new IllegalArgumentException("Envie uma imagem JPEG não vazia.");
        }
        try {
            return imagem.getBytes();
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Não foi possível ler a imagem enviada.", e);
        }
    }

    private void validarImagem(MultipartFile imagem, byte[] bytesImagem) {
        if (imagem == null || imagem.isEmpty()) {
            throw new IllegalArgumentException("Envie uma imagem JPEG não vazia.");
        }
        if (!"image/jpeg".equalsIgnoreCase(imagem.getContentType())) {
            throw new IllegalArgumentException("O arquivo enviado deve estar no formato JPEG.");
        }
        if (imagem.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("A imagem deve ter no máximo 5 MB.");
        }
        if (bytesImagem.length < 3
                || (bytesImagem[0] & 0xFF) != 0xFF
                || (bytesImagem[1] & 0xFF) != 0xD8
                || (bytesImagem[2] & 0xFF) != 0xFF) {
            throw new IllegalArgumentException("O conteúdo enviado não possui uma assinatura JPEG válida.");
        }
    }
}
