package global.vision.hat.dao;

import global.vision.hat.dto.Dispositivo;
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
public class DispositivoDAO {
    private final DataSource dataSource;

    public DispositivoDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<Dispositivo> buscarPorId(int idDispositivo) {
        String sql = """
                SELECT ID_DISPOSITIVO, ID_USUARIO, IDENTIFICADOR, MODELO, DATA_CADASTRO, STATUS
                FROM DISPOSITIVO
                WHERE ID_DISPOSITIVO = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idDispositivo);
            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar o dispositivo no banco de dados.", e);
        }
    }

    public List<Dispositivo> listarPorUsuario(int idUsuario) {
        String sql = """
                SELECT ID_DISPOSITIVO, ID_USUARIO, IDENTIFICADOR, MODELO, DATA_CADASTRO, STATUS
                FROM DISPOSITIVO
                WHERE ID_USUARIO = ?
                ORDER BY DATA_CADASTRO DESC
                """;
        List<Dispositivo> dispositivos = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idUsuario);
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    dispositivos.add(mapear(resultado));
                }
            }
            return dispositivos;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar os dispositivos do usuário.", e);
        }
    }

    public void inserir(Dispositivo dispositivo) {
        String sql = """
                INSERT INTO DISPOSITIVO (ID_USUARIO, IDENTIFICADOR, MODELO)
                VALUES (?, ?, ?)
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, dispositivo.getIdUsuario());
            comando.setString(2, dispositivo.getIdentificador());
            comando.setString(3, dispositivo.getModelo());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível cadastrar o dispositivo.", e);
        }
    }

    public void atualizar(Dispositivo dispositivo) {
        String sql = """
                UPDATE DISPOSITIVO
                SET IDENTIFICADOR = ?, MODELO = ?
                WHERE ID_DISPOSITIVO = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, dispositivo.getIdentificador());
            comando.setString(2, dispositivo.getModelo());
            comando.setInt(3, dispositivo.getIdDispositivo());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar o dispositivo.", e);
        }
    }

    public void alterarStatus(int idDispositivo, char status) {
        String sql = "UPDATE DISPOSITIVO SET STATUS = ? WHERE ID_DISPOSITIVO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, String.valueOf(status));
            comando.setInt(2, idDispositivo);
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível alterar o status do dispositivo.", e);
        }
    }

    private Dispositivo mapear(ResultSet resultado) throws SQLException {
        Dispositivo dispositivo = new Dispositivo();
        dispositivo.setIdDispositivo(resultado.getInt("ID_DISPOSITIVO"));
        dispositivo.setIdUsuario(resultado.getInt("ID_USUARIO"));
        dispositivo.setIdentificador(resultado.getString("IDENTIFICADOR"));
        dispositivo.setModelo(resultado.getString("MODELO"));
        dispositivo.setDataCadastro(resultado.getTimestamp("DATA_CADASTRO"));
        dispositivo.setStatus(resultado.getString("STATUS").charAt(0));
        return dispositivo;
    }
}
