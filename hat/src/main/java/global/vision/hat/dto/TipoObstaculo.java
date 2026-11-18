package global.vision.hat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
public class TipoObstaculo {
    private int idTipoObstaculo;
    private String nome;
    private String descricao;
    private char ativo;
}
