# VisionHat - Inteligência Artificial

Trabalho acadêmico - FIAP - Global Solution 2026.

Esta branch organiza o treinamento e a API dos modelos de IA do VisionHat.

## Papel da API Flask

A API Flask é um módulo independente de Machine Learning. Ela recebe dados numéricos, aplica os modelos próprios treinados no projeto e devolve os resultados em JSON. Essa independência atende ao fluxo da disciplina: dataset, treinamento, avaliação, exportação dos modelos e disponibilização por REST.

A API Java possui uma integração multimodal separada para interpretar imagens. Essa integração é complementar e não substitui os modelos próprios desta branch. Não é afirmado que existe uma chamada Java → Flask nesta etapa, pois esse fluxo não foi implementado.

## Dataset

O arquivo `dataset/dados_visionhat.csv` contém 45 registros artificiais, com 15 exemplos para cada nível de atenção: BAIXO, MEDIO e ALTO.

O CSV foi elaborado como uma representação simulada do tipo de registro que poderia ser cadastrado por pessoas usuárias do VisionHat no futuro. Os valores foram construídos para o protótipo; não foram coletados de pessoas reais, sensores dos óculos ou ocorrências de campo. Portanto, a base permite demonstrar o fluxo de preparação, treinamento e avaliação, mas não comprova o comportamento do sistema em uso real.

As variáveis de entrada são quantidade de obstáculos, distância média, luminosidade, velocidade de movimento e tipo de obstáculo. Os códigos de tipo desta base são: 1 pessoa, 2 veículo, 3 buraco e 4 outro obstáculo.

## Modelos e avaliação

1. **K-Means:** agrupa registros com características numéricas semelhantes. O nível de atenção é utilizado somente depois, para interpretar os grupos.
2. **Random Forest:** classifica o nível de atenção em BAIXO, MEDIO ou ALTO.
3. **Regressão Linear:** estima um valor de confiança na escala de 0 a 100, definido artificialmente na base.

A avaliação da Random Forest e da Regressão Linear utiliza validação cruzada de cinco partes. Cada registro recebe uma previsão enquanto está fora do conjunto de treino daquela dobra. Depois da avaliação, os modelos finais são treinados novamente com todos os 45 registros e exportados para a API.

O K-Means é avaliado na própria base usada no agrupamento: silhueta mede a separação dos grupos e Adjusted Rand Index compara os grupos com os rótulos artificiais de atenção. Essas métricas também não representam um teste de campo.

### Resultados obtidos nesta base

| Modelo | Métrica | Resultado |
|---|---|---:|
| K-Means | Silhueta | 0,480 |
| K-Means | Adjusted Rand Index | 0,807 |
| Random Forest | Acurácia (validação cruzada) | 95,6% |
| Random Forest | F1 macro | 0,955 |
| Regressão Linear | MAE | 2,25 pontos |
| Regressão Linear | RMSE | 2,95 pontos |
| Regressão Linear | R² | 0,937 |

Os resultados descrevem somente o desempenho sobre esta base artificial pequena e organizada para o protótipo. Não devem ser apresentados como precisão comprovada para identificar obstáculos, como garantia de segurança ou como validação com pessoas usuárias. A estimativa de confiança também não é a confiança de um modelo de visão computacional real.

## Fluxo

1. `dataset/dados_visionhat.csv` contém a base artificial.
2. `modelos_visionhat.ipynb` documenta a análise, o treinamento e a avaliação.
3. `treinar_modelos.py` repete o treinamento e gera `modelos_visionhat.joblib`.
4. `dataset_code.py` disponibiliza os modelos por uma API Flask.

## Execução local

```text
pip install -r requirements.txt
python treinar_modelos.py
python dataset_code.py
```

A API local fica em `http://127.0.0.1:5000`.

Exemplo de entrada para `POST /predict/analise`:

```json
{
  "quantidade_obstaculos": 3,
  "distancia_media_metros": 1.2,
  "luminosidade": 60,
  "velocidade_movimento": 2.5,
  "tipo_obstaculo_codigo": 1
}
```

A API informa que os resultados são experimentais. Antes de qualquer uso em situações reais, será necessário substituir ou complementar a base artificial por dados documentados, obtidos com consentimento, validar as fontes das variáveis e realizar testes específicos de segurança.
