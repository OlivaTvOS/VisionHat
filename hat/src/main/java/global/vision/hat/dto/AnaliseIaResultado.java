package global.vision.hat.dto;

public class AnaliseIaResultado {
    private final String descricao;
    private final String modeloIa;
    private final boolean usouFallback;

    public AnaliseIaResultado(String descricao, String modeloIa, boolean usouFallback) {
        this.descricao = descricao;
        this.modeloIa = modeloIa;
        this.usouFallback = usouFallback;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getModeloIa() {
        return modeloIa;
    }

    public boolean isUsouFallback() {
        return usouFallback;
    }
}
