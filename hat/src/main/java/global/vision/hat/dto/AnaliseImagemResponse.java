package global.vision.hat.dto;

public class AnaliseImagemResponse {
    private final int idDispositivo;
    private final String descricao;
    private final String modeloIa;
    private final String status;
    private final boolean usouFallback;

    public AnaliseImagemResponse(int idDispositivo, String descricao, String modeloIa, String status) {
        this(idDispositivo, descricao, modeloIa, status, false);
    }

    public AnaliseImagemResponse(int idDispositivo, String descricao, String modeloIa,
                                 String status, boolean usouFallback) {
        this.idDispositivo = idDispositivo;
        this.descricao = descricao;
        this.modeloIa = modeloIa;
        this.status = status;
        this.usouFallback = usouFallback;
    }

    public int getIdDispositivo() {
        return idDispositivo;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getModeloIa() {
        return modeloIa;
    }

    public String getStatus() {
        return status;
    }

    public boolean isUsouFallback() {
        return usouFallback;
    }
}
