package global.vision.hat.service;

public class AiException extends RuntimeException {
    private final boolean deveTentarFallback;

    public AiException(String mensagem) {
        this(mensagem, null, false);
    }

    public AiException(String mensagem, Throwable causa) {
        this(mensagem, causa, false);
    }

    public AiException(String mensagem, Throwable causa, boolean deveTentarFallback) {
        super(mensagem, causa);
        this.deveTentarFallback = deveTentarFallback;
    }

    public boolean deveTentarFallback() {
        return deveTentarFallback;
    }
}
