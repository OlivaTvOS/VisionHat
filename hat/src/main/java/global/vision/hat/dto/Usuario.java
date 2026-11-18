package global.vision.hat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
public class Usuario {
    private int idUsuario;
    private String cpf;
    private String nome;
    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senhaHash;
    private Timestamp dataCadastro;
    private char status;
}
