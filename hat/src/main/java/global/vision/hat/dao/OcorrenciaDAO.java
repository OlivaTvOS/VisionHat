package global.vision.hat.dao;

import global.vision.hat.dto.Ocorrencia;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class OcorrenciaDAO {
    private final DataSource dataSource;

    public OcorrenciaDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<Ocorrencia> buscarPorId(int idOcorrencia) {
        String sql = "SELECT ID_OCORRENCIA, ID_ANALISE, ID_TIPO_OBSTACULO, DESCRICAO, "
                + "NIVEL_ATENCAO, CONFIANCA FROM OCORRENCIA WHERE ID_OCORRENCIA = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idOcorrencia);
            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar a ocorrência.", e);
        }
    }

    public List<Ocorrencia> listarPorAnalise(int idAnalise) {
        String sql = "SELECT ID_OCORRENCIA, ID_ANALISE, ID_TIPO_OBSTACULO, DESCRICAO, "
                + "NIVEL_ATENCAO, CONFIANCA FROM OCORRENCIA "
                + "WHERE ID_ANALISE = ? ORDER BY ID_OCORRENCIA";
        List<Ocorrencia> ocorrencias = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idAnalise);
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    ocorrencias.add(mapear(resultado));
                }
            }
            return ocorrencias;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar as ocorrências da análise.", e);
        }
    }

    public void inserir(Ocorrencia ocorrencia) {
        String sql = """
                INSERT INTO OCORRENCIA
                    (ID_ANALISE, ID_TIPO_OBSTACULO, DESCRICAO, NIVEL_ATENCAO, CONFIANCA)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, ocorrencia.getIdAnalise());
            if (ocorrencia.getIdTipoObstaculo() == null) {
                comando.setNull(2, Types.INTEGER);
            } else {
                comando.setInt(2, ocorrencia.getIdTipoObstaculo());
            }
            comando.setString(3, ocorrencia.getDescricao());
            comando.setString(4, ocorrencia.getNivelAtencao());
            comando.setObject(5, ocorrencia.getConfianca());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível registrar a ocorrência.", e);
        }
    }

    public void atualizar(Ocorrencia ocorrencia) {
        String sql = """
                UPDATE OCORRENCIA
                SET ID_TIPO_OBSTACULO = ?, DESCRICAO = ?, NIVEL_ATENCAO = ?, CONFIANCA = ?
                WHERE ID_OCORRENCIA = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            if (ocorrencia.getIdTipoObstaculo() == null) {
                comando.setNull(1, Types.INTEGER);
            } else {
                comando.setInt(1, ocorrencia.getIdTipoObstaculo());
            }
            comando.setString(2, ocorrencia.getDescricao());
            comando.setString(3, ocorrencia.getNivelAtencao());
            comando.setObject(4, ocorrencia.getConfianca());
            comando.setInt(5, ocorrencia.getIdOcorrencia());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar a ocorrência.", e);
        }
    }

    private Ocorrencia mapear(ResultSet resultado) throws SQLException {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.setIdOcorrencia(resultado.getInt("ID_OCORRENCIA"));
        ocorrencia.setIdAnalise(resultado.getInt("ID_ANALISE"));
        ocorrencia.setIdTipoObstaculo(resultado.getObject("ID_TIPO_OBSTACULO", Integer.class));
        ocorrencia.setDescricao(resultado.getString("DESCRICAO"));
        ocorrencia.setNivelAtencao(resultado.getString("NIVEL_ATENCAO"));
        ocorrencia.setConfianca(resultado.getObject("CONFIANCA", Double.class));
        return ocorrencia;
    }
}
