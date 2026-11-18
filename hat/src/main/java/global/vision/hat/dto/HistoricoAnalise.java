package global.vision.hat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter @Setter
@NoArgsConstructor
public class HistoricoAnalise {
    private int idAnalise;
    private int idDispositivo;
    private Integer idLocalizacao;
    private Timestamp dataHora;
    private String referenciaImagem;
    private String descricaoIa;
    private String modeloIa;
    private String status;
    private String erroProcessamento;
}
