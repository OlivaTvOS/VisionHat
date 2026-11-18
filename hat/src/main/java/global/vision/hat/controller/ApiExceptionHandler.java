package global.vision.hat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarArgumentoInvalido(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> tratarRegistroInexistente(NoSuchElementException e) {
        return ResponseEntity.status(404).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(ResponseStatusException e) {
        String mensagem = e.getReason() == null
                ? "Não foi possível concluir a solicitação."
                : e.getReason();
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("erro", mensagem));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> tratarJsonInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", "Envie um JSON válido."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> tratarParametroInvalido(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", "O parâmetro informado possui formato inválido."));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> tratarParteAusente(MissingServletRequestPartException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", "Envie o campo de imagem no formulário."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tratarArquivoGrande(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(413).body(Map.of("erro", "A imagem deve ter no máximo 5 MB."));
    }

    @ExceptionHandler(global.vision.hat.service.AiException.class)
    public ResponseEntity<Map<String, String>> tratarAiIndisponivel(global.vision.hat.service.AiException e) {
        return ResponseEntity.status(502).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> tratarProcessamentoInvalido(IllegalStateException e) {
        return ResponseEntity.internalServerError().body(Map.of("erro", e.getMessage()));
    }
}
