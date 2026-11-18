package global.vision.hat.service;

import global.vision.hat.dao.UsuarioDAO;
import global.vision.hat.dto.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class UsuarioService {
    private final UsuarioDAO usuarioDAO;
    private final BCryptPasswordEncoder codificador = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioDAO usuarioDAO) {
        this.usuarioDAO = usuarioDAO;
    }

    public Optional<Usuario> buscarPorId(int idUsuario) {
        validarId(idUsuario, "usuário");
        return usuarioDAO.buscarPorId(idUsuario);
    }

    public List<Usuario> listar() {
        return usuarioDAO.listar();
    }

    public Usuario autenticar(String email, String senha) {
        validarTexto(email, "e-mail");
        validarTexto(senha, "senha");

        Usuario usuario = usuarioDAO.buscarPorEmail(email.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        if (usuario.getStatus() != 'A') {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        String senhaArmazenada = usuario.getSenhaHash();
        boolean senhaValida;

        if (senhaArmazenada != null && senhaArmazenada.startsWith("$2")) {
            senhaValida = codificador.matches(senha, senhaArmazenada);
        } else {
            // Compatibilidade com contas cadastradas antes da adoção do BCrypt.
            senhaValida = senha.equals(senhaArmazenada);
            if (senhaValida) {
                usuarioDAO.atualizarSenhaHash(
                        usuario.getIdUsuario(), codificador.encode(senha));
            }
        }

        if (!senhaValida) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        usuario.setSenhaHash(null);
        return usuario;
    }

    public void cadastrar(Usuario usuario) {
        validarDados(usuario);
        usuario.setSenhaHash(codificador.encode(usuario.getSenhaHash()));
        usuarioDAO.inserir(usuario);
    }

    public void atualizar(Usuario usuario) {
        validarUsuarioInformado(usuario);
        validarId(usuario.getIdUsuario(), "usuário");
        validarDados(usuario);
        verificarExistencia(usuario.getIdUsuario());
        usuario.setSenhaHash(codificador.encode(usuario.getSenhaHash()));
        usuarioDAO.atualizar(usuario);
    }

    public void alterarStatus(int idUsuario, char status) {
        validarId(idUsuario, "usuário");
        if (status != 'A' && status != 'I') {
            throw new IllegalArgumentException("O status do usuário deve ser A ou I.");
        }
        verificarExistencia(idUsuario);
        usuarioDAO.alterarStatus(idUsuario, status);
    }

    private void validarDados(Usuario usuario) {
        validarUsuarioInformado(usuario);
        normalizarCpf(usuario);
        validarTexto(usuario.getNome(), "nome");
        validarTexto(usuario.getEmail(), "e-mail");
        validarTexto(usuario.getSenhaHash(), "senha");
        if (usuario.getNome().trim().length() < 3) {
            throw new IllegalArgumentException("O nome deve conter pelo menos 3 caracteres.");
        }
        if (!usuario.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
        if (usuario.getSenhaHash().length() < 6) {
            throw new IllegalArgumentException("A senha deve conter pelo menos 6 caracteres.");
        }
    }

    private void normalizarCpf(Usuario usuario) {
        validarTexto(usuario.getCpf(), "CPF");
        String cpf = usuario.getCpf().replaceAll("\\D", "");
        if (cpf.length() != 11) {
            throw new IllegalArgumentException("O CPF deve conter 11 dígitos.");
        }
        usuario.setCpf(cpf);
    }

    private void validarUsuarioInformado(Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("O usuário deve ser informado.");
        }
    }

    private void verificarExistencia(int idUsuario) {
        if (usuarioDAO.buscarPorId(idUsuario).isEmpty()) {
            throw new NoSuchElementException("Usuário não encontrado.");
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
