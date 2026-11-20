import math
import os
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request


DIRETORIO = Path(__file__).resolve().parent
ARQUIVO_MODELOS = DIRETORIO / "modelos_visionhat.joblib"

if not ARQUIVO_MODELOS.is_file():
    raise FileNotFoundError(
        "Arquivo de modelos não encontrado. Execute treinar_modelos.py antes de iniciar a API."
    )

MODELOS = joblib.load(ARQUIVO_MODELOS)
FEATURES = MODELOS["features"]
FEATURES_CLUSTER = MODELOS["features_cluster"]
AVISO_EXPERIMENTAL = (
    "Resultado experimental calculado com uma base artificial de protótipo. "
    "Não representa validação com pessoas, sensores ou ocorrências reais."
)
app = Flask(__name__)


def obter_json():
    """Retorna o objeto JSON enviado ou uma resposta de erro."""
    if not request.is_json:
        return None, (jsonify({"erro": "O conteúdo deve ser application/json."}), 400)

    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return None, (jsonify({"erro": "Envie um objeto JSON válido."}), 400)

    return dados, None


def validar_dados(dados):
    """Valida os campos numéricos usados pelos modelos."""
    if not isinstance(dados, dict):
        return None, "Envie um objeto JSON com os dados da análise."

    valores = []
    campos_ausentes = []
    for campo in FEATURES:
        if campo not in dados:
            campos_ausentes.append(campo)
            continue

        valor = dados[campo]
        if isinstance(valor, bool) or not isinstance(valor, (int, float)):
            return None, "O campo '" + campo + "' deve ser numérico."
        try:
            valor_finito = math.isfinite(valor)
        except OverflowError:
            return None, "O campo '" + campo + "' está fora do limite numérico."
        if not valor_finito:
            return None, "O campo '" + campo + "' deve ser finito."
        if valor < 0:
            return None, "O campo '" + campo + "' não pode ser negativo."
        if campo == "luminosidade" and valor > 100:
            return None, "O campo 'luminosidade' deve estar entre 0 e 100."
        if campo == "tipo_obstaculo_codigo" and (valor < 1 or valor > 4):
            return None, "O campo 'tipo_obstaculo_codigo' deve estar entre 1 e 4."
        if campo == "tipo_obstaculo_codigo" and isinstance(valor, float) and not valor.is_integer():
            return None, "O campo 'tipo_obstaculo_codigo' deve ser inteiro."
        if campo == "quantidade_obstaculos" and isinstance(valor, float) and not valor.is_integer():
            return None, "O campo 'quantidade_obstaculos' deve ser inteiro."
        valores.append(valor)

    if campos_ausentes:
        return None, "Campos obrigatórios ausentes: " + ", ".join(campos_ausentes)

    return valores, None


def receber_entrada():
    """Valida o corpo JSON e monta uma linha para os modelos."""
    dados, erro_json = obter_json()
    if erro_json:
        return None, erro_json

    valores, erro_validacao = validar_dados(dados)
    if erro_validacao:
        return None, (jsonify({"erro": erro_validacao}), 400)

    return pd.DataFrame([valores], columns=FEATURES), None


@app.route("/", methods=["GET"])
def verificar_api():
    """Informa que a API e os modelos estão disponíveis."""
    return jsonify(
        {
            "status": "disponível",
            "modelos": ["kmeans", "random_forest", "linear_regression"],
            "base": "artificial e experimental",
            "aviso": AVISO_EXPERIMENTAL,
        }
    )


@app.route("/predict/atencao", methods=["POST"])
def prever_atencao():
    """Classifica o nível de atenção de uma análise."""
    dados, erro = receber_entrada()
    if erro:
        return erro

    modelo = MODELOS["modelo_classificacao"]
    nivel = str(modelo.predict(dados)[0])
    probabilidades = modelo.predict_proba(dados)[0]
    probabilidades_por_nivel = {}
    for classe, probabilidade in zip(modelo.classes_, probabilidades):
        probabilidades_por_nivel[str(classe)] = round(float(probabilidade), 4)

    return jsonify(
        {
            "nivel_atencao": nivel,
            "probabilidades": probabilidades_por_nivel,
            "modelo": "RandomForestClassifier",
            "aviso": AVISO_EXPERIMENTAL,
        }
    )


@app.route("/predict/confianca", methods=["POST"])
def prever_confianca():
    """Estima a confiança da detecção de obstáculo."""
    dados, erro = receber_entrada()
    if erro:
        return erro

    modelo = MODELOS["modelo_regressao"]
    confianca = float(modelo.predict(dados)[0])
    if confianca < 0:
        confianca = 0
    if confianca > 100:
        confianca = 100

    return jsonify(
        {
            "confianca_estimada": round(confianca, 2),
            "modelo": "LinearRegression",
            "aviso": AVISO_EXPERIMENTAL,
        }
    )


@app.route("/predict/agrupamento", methods=["POST"])
def prever_agrupamento():
    """Agrupa a análise com padrões semelhantes da base."""
    dados, erro = receber_entrada()
    if erro:
        return erro

    dados_escalonados = MODELOS["escalonador"].transform(dados[FEATURES_CLUSTER])
    grupo = int(MODELOS["modelo_cluster"].predict(dados_escalonados)[0])
    return jsonify(
        {
            "grupo": grupo,
            "nivel_representativo": MODELOS["mapa_niveis"][grupo],
            "modelo": "KMeans",
            "aviso": AVISO_EXPERIMENTAL,
        }
    )


@app.route("/predict/analise", methods=["POST"])
def prever_analise():
    """Executa os três modelos para a mesma análise."""
    dados, erro = receber_entrada()
    if erro:
        return erro

    classificacao = MODELOS["modelo_classificacao"]
    nivel = str(classificacao.predict(dados)[0])
    probabilidades = classificacao.predict_proba(dados)[0]
    probabilidades_por_nivel = {}
    for classe, probabilidade in zip(classificacao.classes_, probabilidades):
        probabilidades_por_nivel[str(classe)] = round(float(probabilidade), 4)

    confianca = float(MODELOS["modelo_regressao"].predict(dados)[0])
    if confianca < 0:
        confianca = 0
    if confianca > 100:
        confianca = 100

    dados_escalonados = MODELOS["escalonador"].transform(dados[FEATURES_CLUSTER])
    grupo = int(MODELOS["modelo_cluster"].predict(dados_escalonados)[0])
    return jsonify(
        {
            "nivel_atencao": nivel,
            "probabilidades": probabilidades_por_nivel,
            "confianca_estimada": round(confianca, 2),
            "grupo": grupo,
            "nivel_representativo": MODELOS["mapa_niveis"][grupo],
            "aviso": AVISO_EXPERIMENTAL,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
