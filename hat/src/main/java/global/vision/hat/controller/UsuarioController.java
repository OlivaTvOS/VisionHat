package global.vision.hat.controller;

import global.vision.hat.dto.Usuario;
import global.vision.hat.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @GetMapping("/{idUsuario}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable int idUsuario) {
        return ResponseEntity.of(usuarioService.buscarPorId(idUsuario));
    }

    @PostMapping
    public ResponseEntity<Void> cadastrar(@RequestBody Usuario usuario) {
        usuarioService.cadastrar(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idUsuario}")
    public ResponseEntity<Void> atualizar(@PathVariable int idUsuario, @RequestBody Usuario usuario) {
        usuario.setIdUsuario(idUsuario);
        usuarioService.atualizar(usuario);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idUsuario}/status")
    public ResponseEntity<Void> alterarStatus(@PathVariable int idUsuario, @RequestParam char status) {
        usuarioService.alterarStatus(idUsuario, status);
        return ResponseEntity.noContent().build();
    }
}
