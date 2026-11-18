package global.vision.hat.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
public class Dispositivo {
    private int idDispositivo;
    private int idUsuario;
    private String identificador;
    private String modelo;
    private Timestamp dataCadastro;
    private char status;
}
