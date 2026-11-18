package global.vision.hat.dao;

import global.vision.hat.dto.Localizacao;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class LocalizacaoDAO {
    private final DataSource dataSource;

    public LocalizacaoDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<Localizacao> buscarPorId(int idLocalizacao) {
        String sql = "SELECT ID_LOCALIZACAO, UF, CIDADE, BAIRRO, LATITUDE, LONGITUDE "
                + "FROM LOCALIZACAO WHERE ID_LOCALIZACAO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idLocalizacao);
            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar a localização.", e);
        }
    }

    public List<Localizacao> listar() {
        String sql = "SELECT ID_LOCALIZACAO, UF, CIDADE, BAIRRO, LATITUDE, LONGITUDE "
                + "FROM LOCALIZACAO ORDER BY UF, CIDADE, BAIRRO";
        List<Localizacao> localizacoes = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql);
             ResultSet resultado = comando.executeQuery()) {

            while (resultado.next()) {
                localizacoes.add(mapear(resultado));
            }
            return localizacoes;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar as localizações.", e);
        }
    }

    public void inserir(Localizacao localizacao) {
        String sql = """
                INSERT INTO LOCALIZACAO (UF, CIDADE, BAIRRO, LATITUDE, LONGITUDE)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, localizacao.getUf());
            comando.setString(2, localizacao.getCidade());
            comando.setString(3, localizacao.getBairro());
            comando.setObject(4, localizacao.getLatitude());
            comando.setObject(5, localizacao.getLongitude());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível cadastrar a localização.", e);
        }
    }

    public void atualizar(Localizacao localizacao) {
        String sql = """
                UPDATE LOCALIZACAO
                SET UF = ?, CIDADE = ?, BAIRRO = ?, LATITUDE = ?, LONGITUDE = ?
                WHERE ID_LOCALIZACAO = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, localizacao.getUf());
            comando.setString(2, localizacao.getCidade());
            comando.setString(3, localizacao.getBairro());
            comando.setObject(4, localizacao.getLatitude());
            comando.setObject(5, localizacao.getLongitude());
            comando.setInt(6, localizacao.getIdLocalizacao());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar a localização.", e);
        }
    }

    private Localizacao mapear(ResultSet resultado) throws SQLException {
        Localizacao localizacao = new Localizacao();
        localizacao.setIdLocalizacao(resultado.getInt("ID_LOCALIZACAO"));
        localizacao.setUf(resultado.getString("UF"));
        localizacao.setCidade(resultado.getString("CIDADE"));
        localizacao.setBairro(resultado.getString("BAIRRO"));
        localizacao.setLatitude(resultado.getObject("LATITUDE", Double.class));
        localizacao.setLongitude(resultado.getObject("LONGITUDE", Double.class));
        return localizacao;
    }
}
