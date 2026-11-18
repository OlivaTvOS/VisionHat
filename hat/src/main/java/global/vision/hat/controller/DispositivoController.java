package global.vision.hat.controller;

import global.vision.hat.dto.Dispositivo;
import global.vision.hat.service.DispositivoService;
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
@RequestMapping("/api/dispositivos")
public class DispositivoController {
    private final DispositivoService dispositivoService;

    public DispositivoController(DispositivoService dispositivoService) {
        this.dispositivoService = dispositivoService;
    }

    @GetMapping("/{idDispositivo}")
    public ResponseEntity<Dispositivo> buscarPorId(@PathVariable int idDispositivo) {
        return ResponseEntity.of(dispositivoService.buscarPorId(idDispositivo));
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Dispositivo>> listarPorUsuario(@PathVariable int idUsuario) {
        return ResponseEntity.ok(dispositivoService.listarPorUsuario(idUsuario));
    }

    @PostMapping
    public ResponseEntity<Void> cadastrar(@RequestBody Dispositivo dispositivo) {
        dispositivoService.cadastrar(dispositivo);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idDispositivo}")
    public ResponseEntity<Void> atualizar(@PathVariable int idDispositivo, @RequestBody Dispositivo dispositivo) {
        dispositivo.setIdDispositivo(idDispositivo);
        dispositivoService.atualizar(dispositivo);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idDispositivo}/status")
    public ResponseEntity<Void> alterarStatus(@PathVariable int idDispositivo, @RequestParam char status) {
        dispositivoService.alterarStatus(idDispositivo, status);
        return ResponseEntity.noContent().build();
    }
}
