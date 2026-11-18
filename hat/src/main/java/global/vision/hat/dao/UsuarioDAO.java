package global.vision.hat.dao;

import global.vision.hat.dto.Usuario;
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
public class UsuarioDAO {
    private final DataSource dataSource;

    public UsuarioDAO(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Optional<Usuario> buscarPorId(int idUsuario) {
        String sql = """
                SELECT ID_USUARIO, CPF, NOME, EMAIL, SENHA_HASH, DATA_CADASTRO, STATUS
                FROM USUARIO
                WHERE ID_USUARIO = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setInt(1, idUsuario);

            try (ResultSet resultado = comando.executeQuery()) {
                if (!resultado.next()) {
                    return Optional.empty();
                }

                return Optional.of(mapear(resultado));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível buscar o usuário no banco de dados.", e);
        }
    }

    public List<Usuario> listar() {
        String sql = """
                SELECT ID_USUARIO, CPF, NOME, EMAIL, SENHA_HASH, DATA_CADASTRO, STATUS
                FROM USUARIO
                ORDER BY NOME
                """;
        List<Usuario> usuarios = new ArrayList<>();

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql);
             ResultSet resultado = comando.executeQuery()) {

            while (resultado.next()) {
                usuarios.add(mapear(resultado));
            }
            return usuarios;
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível listar os usuários.", e);
        }
    }

    public void inserir(Usuario usuario) {
        String sql = """
                INSERT INTO USUARIO (CPF, NOME, EMAIL, SENHA_HASH)
                VALUES (?, ?, ?, ?)
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, usuario.getCpf());
            comando.setString(2, usuario.getNome());
            comando.setString(3, usuario.getEmail());
            comando.setString(4, usuario.getSenhaHash());
            comando.executeUpdate();
        } catch (SQLException e) {
            if (e.getErrorCode() == 1) {
                throw new IllegalArgumentException("Já existe um usuário cadastrado com este CPF ou e-mail.");
            }
            throw new RuntimeException("Não foi possível cadastrar o usuário.", e);
        }
    }

    public void atualizar(Usuario usuario) {
        String sql = """
                UPDATE USUARIO
                SET CPF = ?, NOME = ?, EMAIL = ?, SENHA_HASH = ?
                WHERE ID_USUARIO = ?
                """;

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, usuario.getCpf());
            comando.setString(2, usuario.getNome());
            comando.setString(3, usuario.getEmail());
            comando.setString(4, usuario.getSenhaHash());
            comando.setInt(5, usuario.getIdUsuario());
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível atualizar o usuário.", e);
        }
    }

    public void alterarStatus(int idUsuario, char status) {
        String sql = "UPDATE USUARIO SET STATUS = ? WHERE ID_USUARIO = ?";

        try (Connection conexao = dataSource.getConnection();
             PreparedStatement comando = conexao.prepareStatement(sql)) {

            comando.setString(1, String.valueOf(status));
            comando.setInt(2, idUsuario);
            comando.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Não foi possível alterar o status do usuário.", e);
        }
    }

    private Usuario mapear(ResultSet resultado) throws SQLException {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(resultado.getInt("ID_USUARIO"));
        usuario.setCpf(resultado.getString("CPF"));
        usuario.setNome(resultado.getString("NOME"));
        usuario.setEmail(resultado.getString("EMAIL"));
        usuario.setSenhaHash(resultado.getString("SENHA_HASH"));
        usuario.setDataCadastro(resultado.getTimestamp("DATA_CADASTRO"));
        usuario.setStatus(resultado.getString("STATUS").charAt(0));
        return usuario;
    }
}
