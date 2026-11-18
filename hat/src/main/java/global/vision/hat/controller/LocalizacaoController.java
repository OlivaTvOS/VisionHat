package global.vision.hat.controller;

import global.vision.hat.dto.Localizacao;
import global.vision.hat.service.LocalizacaoService;
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
@RequestMapping("/api/localizacoes")
public class LocalizacaoController {
    private final LocalizacaoService localizacaoService;

    public LocalizacaoController(LocalizacaoService localizacaoService) {
        this.localizacaoService = localizacaoService;
    }

    @GetMapping
    public ResponseEntity<List<Localizacao>> listar() {
        return ResponseEntity.ok(localizacaoService.listar());
    }

    @GetMapping("/{idLocalizacao}")
    public ResponseEntity<Localizacao> buscarPorId(@PathVariable int idLocalizacao) {
        return ResponseEntity.of(localizacaoService.buscarPorId(idLocalizacao));
    }

    @PostMapping
    public ResponseEntity<Void> cadastrar(@RequestBody Localizacao localizacao) {
        localizacaoService.cadastrar(localizacao);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idLocalizacao}")
    public ResponseEntity<Void> atualizar(@PathVariable int idLocalizacao, @RequestBody Localizacao localizacao) {
        localizacao.setIdLocalizacao(idLocalizacao);
        localizacaoService.atualizar(localizacao);
        return ResponseEntity.noContent().build();
    }
}
