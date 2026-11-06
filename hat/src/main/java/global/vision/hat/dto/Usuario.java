package global.vision.hat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
public class Usuario {
    private int id_usuario;
    private String cpf;
    private String nome;
    private String email;
    private String senha_hash;
    private Timestamp data_cadastro;
    private char status;
}
