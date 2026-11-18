package global.vision.hat.service;

import global.vision.hat.dao.OcorrenciaDAO;
import global.vision.hat.dto.Ocorrencia;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class OcorrenciaService {
    private final OcorrenciaDAO ocorrenciaDAO;

    public OcorrenciaService(OcorrenciaDAO ocorrenciaDAO) {
        this.ocorrenciaDAO = ocorrenciaDAO;
    }

    public Optional<Ocorrencia> buscarPorId(int idOcorrencia) {
        validarId(idOcorrencia, "ocorrência");
        return ocorrenciaDAO.buscarPorId(idOcorrencia);
    }

    public List<Ocorrencia> listarPorAnalise(int idAnalise) {
        validarId(idAnalise, "análise");
        return ocorrenciaDAO.listarPorAnalise(idAnalise);
    }

    public void registrar(Ocorrencia ocorrencia) {
        validarDados(ocorrencia);
        validarId(ocorrencia.getIdAnalise(), "análise");
        if (ocorrencia.getIdTipoObstaculo() != null) {
            validarId(ocorrencia.getIdTipoObstaculo(), "tipo de obstáculo");
        }
        ocorrenciaDAO.inserir(ocorrencia);
    }

    public void atualizar(Ocorrencia ocorrencia) {
        validarDados(ocorrencia);
        validarId(ocorrencia.getIdOcorrencia(), "ocorrência");
        verificarExistencia(ocorrencia.getIdOcorrencia());
        ocorrenciaDAO.atualizar(ocorrencia);
    }

    private void validarDados(Ocorrencia ocorrencia) {
        if (ocorrencia == null) {
            throw new IllegalArgumentException("A ocorrência deve ser informada.");
        }
        if (ocorrencia.getDescricao() == null || ocorrencia.getDescricao().isBlank()) {
            throw new IllegalArgumentException("A descrição da ocorrência deve ser informada.");
        }
        if (!nivelAtencaoValido(ocorrencia.getNivelAtencao())) {
            throw new IllegalArgumentException("O nível de atenção é inválido.");
        }
        if (ocorrencia.getConfianca() != null
                && (ocorrencia.getConfianca() < 0 || ocorrencia.getConfianca() > 100)) {
            throw new IllegalArgumentException("A confiança deve estar entre 0 e 100.");
        }
    }

    private boolean nivelAtencaoValido(String nivelAtencao) {
        return "BAIXO".equals(nivelAtencao)
                || "MEDIO".equals(nivelAtencao)
                || "ALTO".equals(nivelAtencao)
                || "INDETERMINADO".equals(nivelAtencao);
    }

    private void verificarExistencia(int idOcorrencia) {
        if (ocorrenciaDAO.buscarPorId(idOcorrencia).isEmpty()) {
            throw new NoSuchElementException("Ocorrência não encontrada.");
        }
    }

    private void validarId(int id, String entidade) {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID de " + entidade + " deve ser maior que zero.");
        }
    }
}
