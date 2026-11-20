from pathlib import Path

import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    accuracy_score,
    adjusted_rand_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
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


def treinar_modelos():
    """Lê os dados, treina os três modelos e salva o pacote da API."""
    if not ARQUIVO_DADOS.is_file():
        raise FileNotFoundError("Dataset não encontrado: " + str(ARQUIVO_DADOS))

    dados = pd.read_csv(ARQUIVO_DADOS)
    colunas_necessarias = FEATURES + [COLUNA_ATENCAO, COLUNA_CONFIANCA]
    for coluna in colunas_necessarias:
        if coluna not in dados.columns:
            raise ValueError("Coluna ausente no dataset: " + coluna)

    if dados[colunas_necessarias].isnull().any().any():
        raise ValueError("O dataset possui valores ausentes.")

    dados_modelo = dados[FEATURES_CLUSTER]

    escalonador = StandardScaler()
    dados_escalonados = escalonador.fit_transform(dados_modelo)
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

    x_classificacao = dados[FEATURES]
    y_classificacao = dados[COLUNA_ATENCAO]
    x_treino, x_teste, y_treino, y_teste = train_test_split(
        x_classificacao,
        y_classificacao,
        test_size=0.2,
        random_state=42,
        stratify=y_classificacao,
    )
    modelo_classificacao = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
    )
    modelo_classificacao.fit(x_treino, y_treino)
    previsoes_classificacao = modelo_classificacao.predict(x_teste)
    acuracia = accuracy_score(y_teste, previsoes_classificacao)

    x_regressao = dados[FEATURES]
    y_regressao = dados[COLUNA_CONFIANCA]
    x_reg_treino, x_reg_teste, y_reg_treino, y_reg_teste = train_test_split(
        x_regressao,
        y_regressao,
        test_size=0.2,
        random_state=42,
    )
    modelo_regressao = LinearRegression()
    modelo_regressao.fit(x_reg_treino, y_reg_treino)
    previsoes_regressao = modelo_regressao.predict(x_reg_teste)
    mae = mean_absolute_error(y_reg_teste, previsoes_regressao)
    rmse = mean_squared_error(y_reg_teste, previsoes_regressao) ** 0.5
    r2 = r2_score(y_reg_teste, previsoes_regressao)

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
        "metrica_mae": float(mae),
        "metrica_rmse": float(rmse),
        "metrica_r2": float(r2),
    }
    joblib.dump(pacote_modelos, ARQUIVO_MODELOS)

    print("Registros usados:", len(dados))
    print("Silhueta do K-Means:", round(silhueta, 3))
    print("Adjusted Rand Index:", round(ari, 3))
    print("Acurácia da classificação:", round(acuracia, 3))
    print("MAE da regressão:", round(mae, 2))
    print("RMSE da regressão:", round(rmse, 2))
    print("R² da regressão:", round(r2, 3))
    print("Modelos salvos em:", ARQUIVO_MODELOS)


if __name__ == "__main__":
    treinar_modelos()
