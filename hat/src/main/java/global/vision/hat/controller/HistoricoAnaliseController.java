package global.vision.hat.controller;

import global.vision.hat.dto.HistoricoAnalise;
import global.vision.hat.dto.AnaliseImagemResponse;
import global.vision.hat.service.HistoricoAnaliseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/analises")
public class HistoricoAnaliseController {
    private final HistoricoAnaliseService historicoAnaliseService;

    public HistoricoAnaliseController(HistoricoAnaliseService historicoAnaliseService) {
        this.historicoAnaliseService = historicoAnaliseService;
    }

    @GetMapping("/{idAnalise}")
    public ResponseEntity<HistoricoAnalise> buscarPorId(@PathVariable int idAnalise) {
        return ResponseEntity.of(historicoAnaliseService.buscarPorId(idAnalise));
    }

    @GetMapping("/dispositivo/{idDispositivo}")
    public ResponseEntity<List<HistoricoAnalise>> listarPorDispositivo(@PathVariable int idDispositivo) {
        return ResponseEntity.ok(historicoAnaliseService.listarPorDispositivo(idDispositivo));
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@RequestBody HistoricoAnalise analise) {
        historicoAnaliseService.registrar(analise);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping(value = "/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnaliseImagemResponse> analisarImagem(
            @RequestParam int idDispositivo,
            @RequestPart("imagem") MultipartFile imagem) {
        return ResponseEntity.ok(historicoAnaliseService.analisarImagem(idDispositivo, imagem));
    }

    @PutMapping("/{idAnalise}/resultado")
    public ResponseEntity<Void> atualizarResultado(@PathVariable int idAnalise,
                                                    @RequestBody HistoricoAnalise analise) {
        analise.setIdAnalise(idAnalise);
        historicoAnaliseService.atualizarResultado(analise);
        return ResponseEntity.noContent().build();
    }
}
