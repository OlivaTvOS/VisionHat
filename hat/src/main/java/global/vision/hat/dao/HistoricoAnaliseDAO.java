package global.vision.hat.dao;

import global.vision.hat.dto.HistoricoAnalise;
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
public class HistoricoAnaliseDAO {
    private final DataSource dataSource;

    public HistoricoAnaliseDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<HistoricoAnalise> buscarPorId(int idAnalise) {
        String sql = "SELECT ID_ANALISE, ID_DISPOSITIVO, ID_LOCALIZACAO, DATA_HORA, REFERENCIA_IMAGEM, "
                + "DESCRICAO_IA, MODELO_IA, STATUS, ERRO_PROCESSAMENTO "
                + "FROM HISTORICO_ANALISE WHERE ID_ANALISE = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idAnalise);
            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar a análise.", e);
        }
    }

    public List<HistoricoAnalise> listarPorDispositivo(int idDispositivo) {
        String sql = "SELECT ID_ANALISE, ID_DISPOSITIVO, ID_LOCALIZACAO, DATA_HORA, REFERENCIA_IMAGEM, "
                + "DESCRICAO_IA, MODELO_IA, STATUS, ERRO_PROCESSAMENTO "
                + "FROM HISTORICO_ANALISE WHERE ID_DISPOSITIVO = ? ORDER BY DATA_HORA DESC";
        List<HistoricoAnalise> analises = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idDispositivo);
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    analises.add(mapear(resultado));
                }
            }
            return analises;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar as análises do dispositivo.", e);
        }
    }

    public void inserir(HistoricoAnalise analise) {
        String sql = """
                INSERT INTO HISTORICO_ANALISE
                    (ID_DISPOSITIVO, ID_LOCALIZACAO, REFERENCIA_IMAGEM, MODELO_IA)
                VALUES (?, ?, ?, ?)
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, analise.getIdDispositivo());
            if (analise.getIdLocalizacao() == null) {
                comando.setNull(2, Types.INTEGER);
            } else {
                comando.setInt(2, analise.getIdLocalizacao());
            }
            comando.setString(3, analise.getReferenciaImagem());
            comando.setString(4, analise.getModeloIa());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível registrar a análise.", e);
        }
    }

    public void atualizarResultado(HistoricoAnalise analise) {
        String sql = """
                UPDATE HISTORICO_ANALISE
                SET DESCRICAO_IA = ?, MODELO_IA = ?, STATUS = ?, ERRO_PROCESSAMENTO = ?
                WHERE ID_ANALISE = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, analise.getDescricaoIa());
            comando.setString(2, analise.getModeloIa());
            comando.setString(3, analise.getStatus());
            comando.setString(4, analise.getErroProcessamento());
            comando.setInt(5, analise.getIdAnalise());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar o resultado da análise.", e);
        }
    }

    private HistoricoAnalise mapear(ResultSet resultado) throws SQLException {
        HistoricoAnalise analise = new HistoricoAnalise();
        analise.setIdAnalise(resultado.getInt("ID_ANALISE"));
        analise.setIdDispositivo(resultado.getInt("ID_DISPOSITIVO"));
        analise.setIdLocalizacao(resultado.getObject("ID_LOCALIZACAO", Integer.class));
        analise.setDataHora(resultado.getTimestamp("DATA_HORA"));
        analise.setReferenciaImagem(resultado.getString("REFERENCIA_IMAGEM"));
        analise.setDescricaoIa(resultado.getString("DESCRICAO_IA"));
        analise.setModeloIa(resultado.getString("MODELO_IA"));
        analise.setStatus(resultado.getString("STATUS"));
        analise.setErroProcessamento(resultado.getString("ERRO_PROCESSAMENTO"));
        return analise;
    }
}
