package global.vision.hat.service;

import global.vision.hat.dao.DispositivoDAO;
import global.vision.hat.dto.Dispositivo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class DispositivoService {
    private final DispositivoDAO dispositivoDAO;

    public DispositivoService(DispositivoDAO dispositivoDAO) {
        this.dispositivoDAO = dispositivoDAO;
    }

    public Optional<Dispositivo> buscarPorId(int idDispositivo) {
        validarId(idDispositivo, "dispositivo");
        return dispositivoDAO.buscarPorId(idDispositivo);
    }

    public List<Dispositivo> listarPorUsuario(int idUsuario) {
        validarId(idUsuario, "usuário");
        return dispositivoDAO.listarPorUsuario(idUsuario);
    }

    public void cadastrar(Dispositivo dispositivo) {
        validarDados(dispositivo);
        dispositivoDAO.inserir(dispositivo);
    }

    public void atualizar(Dispositivo dispositivo) {
        validarDispositivoInformado(dispositivo);
        validarId(dispositivo.getIdDispositivo(), "dispositivo");
        validarTexto(dispositivo.getIdentificador(), "identificador");
        validarTexto(dispositivo.getModelo(), "modelo");
        verificarExistencia(dispositivo.getIdDispositivo());
        dispositivoDAO.atualizar(dispositivo);
    }

    public void alterarStatus(int idDispositivo, char status) {
        validarId(idDispositivo, "dispositivo");
        if (status != 'A' && status != 'I') {
            throw new IllegalArgumentException("O status do dispositivo deve ser A ou I.");
        }
        verificarExistencia(idDispositivo);
        dispositivoDAO.alterarStatus(idDispositivo, status);
    }

    private void validarDados(Dispositivo dispositivo) {
        validarDispositivoInformado(dispositivo);
        validarId(dispositivo.getIdUsuario(), "usuário");
        validarTexto(dispositivo.getIdentificador(), "identificador");
        validarTexto(dispositivo.getModelo(), "modelo");
    }

    private void validarDispositivoInformado(Dispositivo dispositivo) {
        if (dispositivo == null) {
            throw new IllegalArgumentException("O dispositivo deve ser informado.");
        }
    }

    private void verificarExistencia(int idDispositivo) {
        if (dispositivoDAO.buscarPorId(idDispositivo).isEmpty()) {
            throw new NoSuchElementException("Dispositivo não encontrado.");
        }
    }

    private void validarId(int id, String entidade) {
        if (id <= 0) {
            throw new IllegalArgumentException("O ID de " + entidade + " deve ser maior que zero.");
        }
    }

    private void validarTexto(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("O campo " + campo + " deve ser informado.");
        }
    }
}
