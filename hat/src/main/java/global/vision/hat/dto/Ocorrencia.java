package global.vision.hat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
public class Ocorrencia {
    private int idOcorrencia;
    private int idAnalise;
    private Integer idTipoObstaculo;
    private String descricao;
    private String nivelAtencao;
    private Double confianca;
}
