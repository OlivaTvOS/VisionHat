package global.vision.hat.service;

import global.vision.hat.dao.TipoObstaculoDAO;
import global.vision.hat.dto.TipoObstaculo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class TipoObstaculoService {
    private final TipoObstaculoDAO tipoObstaculoDAO;

    public TipoObstaculoService(TipoObstaculoDAO tipoObstaculoDAO) {
        this.tipoObstaculoDAO = tipoObstaculoDAO;
    }

    public Optional<TipoObstaculo> buscarPorId(int idTipoObstaculo) {
        validarId(idTipoObstaculo);
        return tipoObstaculoDAO.buscarPorId(idTipoObstaculo);
    }

    public List<TipoObstaculo> listarAtivos() {
        return tipoObstaculoDAO.listarAtivos();
    }

    public void cadastrar(TipoObstaculo tipoObstaculo) {
        validarDados(tipoObstaculo, false);
        tipoObstaculoDAO.inserir(tipoObstaculo);
    }

    public void atualizar(TipoObstaculo tipoObstaculo) {
        validarDados(tipoObstaculo, true);
        verificarExistencia(tipoObstaculo.getIdTipoObstaculo());
        tipoObstaculoDAO.atualizar(tipoObstaculo);
    }

    public void alterarAtivo(int idTipoObstaculo, char ativo) {
        validarId(idTipoObstaculo);
        if (ativo != 'S' && ativo != 'N') {
            throw new IllegalArgumentException("O campo ativo deve ser S ou N.");
        }
        verificarExistencia(idTipoObstaculo);
        tipoObstaculoDAO.alterarAtivo(idTipoObstaculo, ativo);
    }

    private void validarDados(TipoObstaculo tipoObstaculo, boolean exigeId) {
        if (tipoObstaculo == null) {
            throw new IllegalArgumentException("O tipo de obstáculo deve ser informado.");
        }
        if (exigeId) {
            validarId(tipoObstaculo.getIdTipoObstaculo());
        }
        if (tipoObstaculo.getNome() == null || tipoObstaculo.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome do tipo de obstáculo deve ser informado.");
        }
    }

    private void validarId(int idTipoObstaculo) {
        if (idTipoObstaculo <= 0) {
            throw new IllegalArgumentException("O ID do tipo de obstáculo deve ser maior que zero.");
        }
    }

    private void verificarExistencia(int idTipoObstaculo) {
        if (tipoObstaculoDAO.buscarPorId(idTipoObstaculo).isEmpty()) {
            throw new NoSuchElementException("Tipo de obstáculo não encontrado.");
        }
    }
}
