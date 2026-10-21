# 🔍 Muamba Search

Scanner automatizado de lotes e oportunidades do **Leilão da Receita Federal** ([Sistema de Leilão Eletrônico - SLE Sociedade](https://www25.receita.fazenda.gov.br/sle-sociedade/portal)), focado em identificar produtos de alta liquidez e margem para **revenda**.

---

## ⚡ Como Funciona

Diferente de scrapers tradicionais lentos e frágeis baseados em emulação de navegador (Selenium/Playwright), o **Muamba Search** conecta-se diretamente aos **endpoints REST públicos** do portal oficial do SLE da Receita Federal:
* **Varredura Ultrarrápida e Paralela:** Processa centenas de lotes em poucos segundos via multithreading.
* **Busca no Nível do Item:** Analisa cada descrição individual, quantidades e recinto de armazenagem dentro de cada lote.
* **Filtros Avançados:** Filtra por palavras-chave, tipo de participante (**PF vs. PJ**), lance mínimo máximo e cidade/região fiscal.
* **Exportação Direta:** Gera relatórios em `.xlsx` (Excel) ou `.csv` com links diretos para cada lote.

---

## 📦 Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/gabriel-fonseca/muamba-search.git
cd muamba-search

pip install -r requirements.txt
```

---

## 🚀 Como Usar

### 1. Listar todos os editais abertos no momento
Visualize rapidamente os editais em andamento no Brasil, datas limites para envio de propostas e permissão de PF/PJ:

```bash
python -m muamba.cli --listar-editais
```

---

### 2. Buscar por palavras-chave
Busque por termos de interesse (ex: celulares, notebooks, videogames, drones, placas de vídeo):

```bash
python -m muamba.cli -t "iphone, macbook, playstation, nintendo, rtx"
```

---

### 3. Filtrar apenas lotes para Pessoa Física (PF)
Se você não possui CNPJ e pretende participar como Pessoa Física:

```bash
python -m muamba.cli -t "celular, videogame" --pf
```

---

### 4. Filtrar por Lance Mínimo e Cidade
Encontre lotes com lance inicial de até R$ 5.000 em uma região específica:

```bash
python -m muamba.cli -t "notebook, ipad" -v 5000 -c "São Paulo"
```

---

### 5. Exportar Resultados para Excel ou CSV
Salve os lotes encontrados diretamente em uma planilha para análise de viabilidade:

```bash
# Exportar para Excel (.xlsx)
python -m muamba.cli -t "memoria, cartao, ssd, celular" -o oportunidades.xlsx

# Exportar para CSV
python -m muamba.cli -t "videogame, console" -o resultados.csv
```

---

## ⚙️ Opções da Linha de Comando (CLI)

| Opção | Abreviação | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| `--termos` | `-t` | Palavras-chave separadas por vírgula | `-t "iphone, drone"` |
| `--pf` | | Filtra apenas lotes que aceitam Pessoa Física | `--pf` |
| `--max-valor` | `-v` | Valor máximo do lance mínimo inicial (R$) | `-v 10000` |
| `--cidade` | `-c` | Filtra por cidade ou superintendência | `-c "Curitiba"` |
| `--limite-editais` | `-l` | Limita o número de editais consultados | `-l 3` |
| `--export` | `-o` | Caminho do arquivo para exportação (`.xlsx` ou `.csv`) | `-o lotes.xlsx` |
| `--listar-editais` | | Lista apenas os editais sem varrer lotes | `--listar-editais` |

---

## 💡 Dicas Importantes para Revenda em Leilões da Receita

1. **Pessoa Física vs. Pessoa Jurídica:**
   * Lotes destinados expressamente a revenda comercial geralmente exigem **Pessoa Jurídica (CNPJ)** com CNAE compatível.
   * Lotes liberados para **Pessoa Física (PF)** são destinados prioritariamente a uso e consumo próprio, embora existam excelentes oportunidades em lotes unitários ou mistos.
2. **ICMS e Custos Extras:**
   * O valor arrematado não inclui o **ICMS** do estado onde a mercadoria se encontra (normalmente recolhido via DAE/GNRE antes da retirada).
   * Verifique as regras de taxa de armazenagem no edital completo.
3. **Logística de Retirada:**
   * A Receita Federal **não realiza frete**. O arrematante deve retirar as mercadorias presencialmente no depósito indicado ou emitir uma procuração para uma transportadora credenciada.

---

## 🧪 Testes

Para executar a suíte de testes unitários:

```bash
python -m pytest
```
