package global.vision.hat.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
public class Dispositivo {
    private int id_dispositivo;
    private int id_usuario;
    private String identificador;
    private String modelo;
    private Timestamp data_cadastro;
    private char status;
}
