package global.vision.hat.dao;

import global.vision.hat.dto.TipoObstaculo;
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
public class TipoObstaculoDAO {
    private final DataSource dataSource;

    public TipoObstaculoDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<TipoObstaculo> buscarPorId(int idTipoObstaculo) {
        String sql = "SELECT ID_TIPO_OBSTACULO, NOME, DESCRICAO, ATIVO "
                + "FROM TIPO_OBSTACULO WHERE ID_TIPO_OBSTACULO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idTipoObstaculo);
            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar o tipo de obstáculo.", e);
        }
    }

    public List<TipoObstaculo> listarAtivos() {
        String sql = "SELECT ID_TIPO_OBSTACULO, NOME, DESCRICAO, ATIVO "
                + "FROM TIPO_OBSTACULO WHERE ATIVO = 'S' ORDER BY NOME";
        List<TipoObstaculo> tipos = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql);
             ResultSet resultado = comando.executeQuery()) {

            while (resultado.next()) {
                tipos.add(mapear(resultado));
            }
            return tipos;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar os tipos de obstáculo.", e);
        }
    }

    public void inserir(TipoObstaculo tipoObstaculo) {
        String sql = "INSERT INTO TIPO_OBSTACULO (NOME, DESCRICAO) VALUES (?, ?)";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, tipoObstaculo.getNome());
            comando.setString(2, tipoObstaculo.getDescricao());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível cadastrar o tipo de obstáculo.", e);
        }
    }

    public void atualizar(TipoObstaculo tipoObstaculo) {
        String sql = "UPDATE TIPO_OBSTACULO SET NOME = ?, DESCRICAO = ? "
                + "WHERE ID_TIPO_OBSTACULO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, tipoObstaculo.getNome());
            comando.setString(2, tipoObstaculo.getDescricao());
            comando.setInt(3, tipoObstaculo.getIdTipoObstaculo());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar o tipo de obstáculo.", e);
        }
    }

    public void alterarAtivo(int idTipoObstaculo, char ativo) {
        String sql = "UPDATE TIPO_OBSTACULO SET ATIVO = ? WHERE ID_TIPO_OBSTACULO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, String.valueOf(ativo));
            comando.setInt(2, idTipoObstaculo);
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível alterar o status do tipo de obstáculo.", e);
        }
    }

    private TipoObstaculo mapear(ResultSet resultado) throws SQLException {
        TipoObstaculo tipoObstaculo = new TipoObstaculo();
        tipoObstaculo.setIdTipoObstaculo(resultado.getInt("ID_TIPO_OBSTACULO"));
        tipoObstaculo.setNome(resultado.getString("NOME"));
        tipoObstaculo.setDescricao(resultado.getString("DESCRICAO"));
        tipoObstaculo.setAtivo(resultado.getString("ATIVO").charAt(0));
        return tipoObstaculo;
    }
}
