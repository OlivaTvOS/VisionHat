from pathlib import Path

import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    accuracy_score,
    adjusted_rand_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    silhouette_score,
)
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_predict
from sklearn.preprocessing import StandardScaler


DIRETORIO = Path(__file__).resolve().parent
ARQUIVO_DADOS = DIRETORIO / "dataset" / "dados_visionhat.csv"
ARQUIVO_MODELOS = DIRETORIO / "modelos_visionhat.joblib"

FEATURES = [
    "quantidade_obstaculos",
    "distancia_media_metros",
    "luminosidade",
    "velocidade_movimento",
    "tipo_obstaculo_codigo",
]
FEATURES_CLUSTER = [
    "quantidade_obstaculos",
    "distancia_media_metros",
]
COLUNA_ATENCAO = "nivel_atencao"
COLUNA_CONFIANCA = "confianca_deteccao"
CLASSES_ATENCAO = ["BAIXO", "MEDIO", "ALTO"]


def carregar_dados():
    """Lê e verifica as colunas necessárias para o treinamento."""
    if not ARQUIVO_DADOS.is_file():
        raise FileNotFoundError("Dataset não encontrado: " + str(ARQUIVO_DADOS))

    dados = pd.read_csv(ARQUIVO_DADOS)
    colunas_necessarias = FEATURES + [COLUNA_ATENCAO, COLUNA_CONFIANCA]

    for coluna in colunas_necessarias:
        if coluna not in dados.columns:
            raise ValueError("Coluna ausente no dataset: " + coluna)

    if dados[colunas_necessarias].isnull().any().any():
        raise ValueError("O dataset possui valores ausentes.")

    if len(dados) < 5:
        raise ValueError("São necessários pelo menos cinco registros para a validação cruzada.")

    contagem_classes = dados[COLUNA_ATENCAO].value_counts()
    for classe in CLASSES_ATENCAO:
        if contagem_classes.get(classe, 0) < 5:
            raise ValueError(
                "A classe " + classe + " precisa ter pelo menos cinco registros."
            )

    return dados


def treinar_modelos():
    """Avalia os modelos por validação cruzada e salva versões finais."""
    dados = carregar_dados()

    print("Registros usados:", len(dados))
    print("Distribuição das classes:")
    print(dados[COLUNA_ATENCAO].value_counts().sort_index())

    # Modelo 1: K-Means. A avaliação é feita sobre a própria base usada
    # no agrupamento, pois o algoritmo não utiliza rótulos no treinamento.
    dados_cluster = dados[FEATURES_CLUSTER]
    escalonador = StandardScaler()
    dados_escalonados = escalonador.fit_transform(dados_cluster)

    modelo_cluster = KMeans(n_clusters=3, n_init=10, random_state=42)
    grupos = modelo_cluster.fit_predict(dados_escalonados)

    silhueta = silhouette_score(dados_escalonados, grupos)
    ari = adjusted_rand_score(dados[COLUNA_ATENCAO], grupos)

    comparacao = pd.crosstab(
        pd.Series(grupos, name="grupo"),
        dados[COLUNA_ATENCAO],
    )
    mapa_niveis = {}
    for grupo in comparacao.index:
        mapa_niveis[int(grupo)] = str(comparacao.loc[grupo].idxmax())

    # Modelo 2: Random Forest. Cada registro recebe uma previsão quando
    # fica fora do treino de sua dobra (out-of-fold).
    x_classificacao = dados[FEATURES]
    y_classificacao = dados[COLUNA_ATENCAO]

    validacao_classificacao = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )
    modelo_classificacao = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
    )
    previsoes_classificacao = cross_val_predict(
        modelo_classificacao,
        x_classificacao,
        y_classificacao,
        cv=validacao_classificacao,
    )

    acuracia = accuracy_score(y_classificacao, previsoes_classificacao)
    f1_macro = f1_score(
        y_classificacao,
        previsoes_classificacao,
        labels=CLASSES_ATENCAO,
        average="macro",
        zero_division=0,
    )
    relatorio = classification_report(
        y_classificacao,
        previsoes_classificacao,
        labels=CLASSES_ATENCAO,
        zero_division=0,
    )
    matriz = confusion_matrix(
        y_classificacao,
        previsoes_classificacao,
        labels=CLASSES_ATENCAO,
    )

    # Depois da avaliação, o modelo disponibilizado pela API é treinado
    # novamente com todos os registros existentes.
    modelo_classificacao.fit(x_classificacao, y_classificacao)

    # Modelo 3: Regressão Linear. As métricas são calculadas com previsões
    # out-of-fold, usando cinco partes da base.
    x_regressao = dados[FEATURES]
    y_regressao = dados[COLUNA_CONFIANCA]

    validacao_regressao = KFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )
    modelo_regressao = LinearRegression()
    previsoes_regressao = cross_val_predict(
        modelo_regressao,
        x_regressao,
        y_regressao,
        cv=validacao_regressao,
    )

    mae = mean_absolute_error(y_regressao, previsoes_regressao)
    rmse = mean_squared_error(y_regressao, previsoes_regressao) ** 0.5
    r2 = r2_score(y_regressao, previsoes_regressao)

    # A versão final também é treinada com todos os registros.
    modelo_regressao.fit(x_regressao, y_regressao)

    pacote_modelos = {
        "modelo_cluster": modelo_cluster,
        "escalonador": escalonador,
        "mapa_niveis": mapa_niveis,
        "modelo_classificacao": modelo_classificacao,
        "modelo_regressao": modelo_regressao,
        "features": FEATURES,
        "features_cluster": FEATURES_CLUSTER,
        "classes_atencao": [str(classe) for classe in modelo_classificacao.classes_],
        "metrica_silhueta": float(silhueta),
        "metrica_ari": float(ari),
        "metrica_acuracia": float(acuracia),
        "metrica_f1_macro": float(f1_macro),
        "metrica_mae": float(mae),
        "metrica_rmse": float(rmse),
        "metrica_r2": float(r2),
        "metodo_avaliacao": "validacao cruzada de 5 partes",
        "quantidade_registros": int(len(dados)),
        "base_experimental": True,
    }
    joblib.dump(pacote_modelos, ARQUIVO_MODELOS)

    print("\nK-Means")
    print("Silhueta:", round(silhueta, 3))
    print("Adjusted Rand Index:", round(ari, 3))
    print("Comparação dos grupos:")
    print(comparacao)
    print("Nível representativo de cada grupo:", mapa_niveis)

    print("\nRandom Forest - validação cruzada de 5 partes")
    print("Acurácia:", round(acuracia, 3))
    print("F1 macro:", round(f1_macro, 3))
    print("Relatório de classificação:")
    print(relatorio)
    print("Matriz de confusão:")
    print(pd.DataFrame(
        matriz,
        index=CLASSES_ATENCAO,
        columns=CLASSES_ATENCAO,
    ))

    print("\nRegressão Linear - validação cruzada de 5 partes")
    print("MAE:", round(mae, 2))
    print("RMSE:", round(rmse, 2))
    print("R²:", round(r2, 3))

    print("\nObservação: métricas calculadas em uma base artificial de protótipo.")
    print("Elas não comprovam desempenho com pessoas, sensores ou ocorrências reais.")
    print("Modelos finais salvos em:", ARQUIVO_MODELOS)


if __name__ == "__main__":
    treinar_modelos()
