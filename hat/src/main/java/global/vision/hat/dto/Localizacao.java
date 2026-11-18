package global.vision.hat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
public class Localizacao {
    private int idLocalizacao;
    private String uf;
    private String cidade;
    private String bairro;
    private Double latitude;
    private Double longitude;
}
