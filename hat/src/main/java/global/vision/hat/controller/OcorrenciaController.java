package global.vision.hat.controller;

import global.vision.hat.dto.Ocorrencia;
import global.vision.hat.service.OcorrenciaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ocorrencias")
public class OcorrenciaController {
    private final OcorrenciaService ocorrenciaService;

    public OcorrenciaController(OcorrenciaService ocorrenciaService) {
        this.ocorrenciaService = ocorrenciaService;
    }

    @GetMapping("/{idOcorrencia}")
    public ResponseEntity<Ocorrencia> buscarPorId(@PathVariable int idOcorrencia) {
        return ResponseEntity.of(ocorrenciaService.buscarPorId(idOcorrencia));
    }

    @GetMapping("/analise/{idAnalise}")
    public ResponseEntity<List<Ocorrencia>> listarPorAnalise(@PathVariable int idAnalise) {
        return ResponseEntity.ok(ocorrenciaService.listarPorAnalise(idAnalise));
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@RequestBody Ocorrencia ocorrencia) {
        ocorrenciaService.registrar(ocorrencia);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idOcorrencia}")
    public ResponseEntity<Void> atualizar(@PathVariable int idOcorrencia, @RequestBody Ocorrencia ocorrencia) {
        ocorrencia.setIdOcorrencia(idOcorrencia);
        ocorrenciaService.atualizar(ocorrencia);
        return ResponseEntity.noContent().build();
    }
}
