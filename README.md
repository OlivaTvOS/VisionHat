# VisionHat - Inteligência Artificial

Trabalho acadêmico - FIAP - Global Solution 2026.

Esta branch organiza o treinamento e a API dos modelos de IA do VisionHat.

## Papel da API Flask

A API Flask é um módulo independente de Machine Learning. Ela recebe dados
numéricos, aplica os modelos próprios treinados no projeto e devolve os
resultados em JSON. Essa independência atende ao fluxo da disciplina: dataset,
treinamento, avaliação, exportação dos modelos e disponibilização por REST.

A API Java possui uma integração multimodal separada para interpretar imagens.
Essa integração é complementar e não substitui os modelos próprios desta
branch. O projeto não declara, nesta etapa, uma chamada Java → Flask para não
apresentar como concluído um fluxo que ainda não foi implementado.

## Fluxo

1. `dataset/dados_visionhat.csv` contém a base experimental.
2. `modelos_visionhat.ipynb` documenta a análise, o treinamento e a avaliação.
3. `treinar_modelos.py` gera `modelos_visionhat.joblib`.
4. `dataset_code.py` disponibiliza os modelos por uma API Flask.

Os modelos agrupam padrões de análise, classificam o nível de atenção e estimam a
confiança da detecção. A base é um protótipo experimental; não representa uma
pesquisa com usuários reais e não deve ser tratada como garantia de segurança.
As classes e o alvo de regressão são uma adaptação acadêmica da proposta do
VisionHat e estão descritos na documentação da entrega.

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

Os códigos de tipo usados nesta carga são apenas uma convenção do protótipo:
1 pessoa, 2 veículo, 3 buraco e 4 outro obstáculo.
