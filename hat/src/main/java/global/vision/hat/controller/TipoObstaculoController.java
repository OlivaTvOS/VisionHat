package global.vision.hat.controller;

import global.vision.hat.dto.TipoObstaculo;
import global.vision.hat.service.TipoObstaculoService;
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
@RequestMapping("/api/tipos-obstaculo")
public class TipoObstaculoController {
    private final TipoObstaculoService tipoObstaculoService;

    public TipoObstaculoController(TipoObstaculoService tipoObstaculoService) {
        this.tipoObstaculoService = tipoObstaculoService;
    }

    @GetMapping
    public ResponseEntity<List<TipoObstaculo>> listarAtivos() {
        return ResponseEntity.ok(tipoObstaculoService.listarAtivos());
    }

    @GetMapping("/{idTipoObstaculo}")
    public ResponseEntity<TipoObstaculo> buscarPorId(@PathVariable int idTipoObstaculo) {
        return ResponseEntity.of(tipoObstaculoService.buscarPorId(idTipoObstaculo));
    }

    @PostMapping
    public ResponseEntity<Void> cadastrar(@RequestBody TipoObstaculo tipoObstaculo) {
        tipoObstaculoService.cadastrar(tipoObstaculo);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idTipoObstaculo}")
    public ResponseEntity<Void> atualizar(@PathVariable int idTipoObstaculo,
                                          @RequestBody TipoObstaculo tipoObstaculo) {
        tipoObstaculo.setIdTipoObstaculo(idTipoObstaculo);
        tipoObstaculoService.atualizar(tipoObstaculo);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idTipoObstaculo}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable int idTipoObstaculo, @RequestParam char ativo) {
        tipoObstaculoService.alterarAtivo(idTipoObstaculo, ativo);
        return ResponseEntity.noContent().build();
    }
}
