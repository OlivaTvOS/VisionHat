package global.vision.hat.service;

import global.vision.hat.dao.LocalizacaoDAO;
import global.vision.hat.dto.Localizacao;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class LocalizacaoService {
    private final LocalizacaoDAO localizacaoDAO;

    public LocalizacaoService(LocalizacaoDAO localizacaoDAO) {
        this.localizacaoDAO = localizacaoDAO;
    }

    public Optional<Localizacao> buscarPorId(int idLocalizacao) {
        validarId(idLocalizacao);
        return localizacaoDAO.buscarPorId(idLocalizacao);
    }

    public List<Localizacao> listar() {
        return localizacaoDAO.listar();
    }

    public void cadastrar(Localizacao localizacao) {
        validarDados(localizacao, false);
        localizacaoDAO.inserir(localizacao);
    }

    public void atualizar(Localizacao localizacao) {
        validarDados(localizacao, true);
        verificarExistencia(localizacao.getIdLocalizacao());
        localizacaoDAO.atualizar(localizacao);
    }

    private void validarDados(Localizacao localizacao, boolean exigeId) {
        if (localizacao == null) {
            throw new IllegalArgumentException("A localização deve ser informada.");
        }
        if (exigeId) {
            validarId(localizacao.getIdLocalizacao());
        }
        validarTexto(localizacao.getUf(), "UF");
        validarTexto(localizacao.getCidade(), "cidade");
        if (localizacao.getUf().trim().length() != 2) {
            throw new IllegalArgumentException("A UF deve possuir dois caracteres.");
        }
        boolean latitudeInformada = localizacao.getLatitude() != null;
        boolean longitudeInformada = localizacao.getLongitude() != null;
        if (latitudeInformada != longitudeInformada) {
            throw new IllegalArgumentException("Latitude e longitude devem ser informadas juntas.");
        }
        if (latitudeInformada && (localizacao.getLatitude() < -90 || localizacao.getLatitude() > 90)) {
            throw new IllegalArgumentException("A latitude deve estar entre -90 e 90.");
        }
        if (longitudeInformada && (localizacao.getLongitude() < -180 || localizacao.getLongitude() > 180)) {
            throw new IllegalArgumentException("A longitude deve estar entre -180 e 180.");
        }
    }

    private void validarId(int idLocalizacao) {
        if (idLocalizacao <= 0) {
            throw new IllegalArgumentException("O ID da localização deve ser maior que zero.");
        }
    }

    private void verificarExistencia(int idLocalizacao) {
        if (localizacaoDAO.buscarPorId(idLocalizacao).isEmpty()) {
            throw new NoSuchElementException("Localização não encontrada.");
        }
    }

    private void validarTexto(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("O campo " + campo + " deve ser informado.");
        }
    }
}
