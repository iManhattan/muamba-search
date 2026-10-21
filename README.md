# 🔍 Muamba Search

Aplicação web e scanner de oportunidades do **Leilão da Receita Federal** ([Sistema de Leilão Eletrônico - SLE Sociedade](https://www25.receita.fazenda.gov.br/sle-sociedade/portal)), criada para identificar produtos de alta liquidez e margem para **revenda**.

Construída em **Next.js (React + TypeScript + Tailwind CSS)**, pronta para rodar **localmente** e ser publicada com 1 clique na **Vercel**.

---

## ✨ Funcionalidades da Aplicação Web

* 🔍 **Busca por Palavras-Chave:** Filtre por celulares, videogames, placas de vídeo, memórias, drones ou qualquer mercadoria.
* 📷 **Galeria e Carrossel de Fotos:** Visualização das fotos oficiais armazenadas pela Receita Federal com modal em tela cheia e alta resolução.
* ⚠️ **Avisos e Erratas Oficiais em Destaque:** Alertas destacados nos lotes com avisos cruciais (ex: bens armazenados em outro estado/cidade).
* 👤 **Filtro PF vs. PJ:** Separe facilmente lotes liberados para Pessoa Física daqueles exclusivos para Pessoa Jurídica.
* 💰 **Margem e Desconto Estimado:** Cálculo automático da porcentagem de desconto inicial em relação ao valor de avaliação do lote.
* 📊 **Exportação para Planilha:** Botão no navegador para baixar todos os lotes encontrados em formato `.csv` compatível com Excel.
* ⚡ **Arquitetura Serverless:** Consultas diretas e paralelas à API REST do SLE, sem navegadores pesados nem dependência de banco de dados.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
* Node.js (versão 18 ou superior) instalado.

### 2. Instalação e Execução
Na pasta do projeto, execute:

```bash
# 1. Instalar dependências (caso não tenha instalado)
npm install

# 2. Iniciar o servidor de desenvolvimento local
npm run dev
```

Abra o seu navegador em:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ☁️ Como Fazer Deploy na Vercel

A aplicação foi desenhada nativamente para a **Vercel**:

### Opção 1: Pelo Painel Web da Vercel (Recomendado)
1. Faça o push do seu repositório para o seu **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **"Add New..."** ➔ **"Project"**.
4. Selecione o repositório **`muamba-search`**.
5. O Next.js será detectado automaticamente. Basta clicar em **"Deploy"**!

### Opção 2: Pelo Terminal (Vercel CLI)
```bash
npm i -g vercel
vercel
```

---

## 🐍 Utilitário Alternativo via Terminal (Python CLI)

O repositório também inclui a ferramenta de terminal em Python:

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Listar editais abertos
python -m muamba.cli --listar-editais

# Buscar e exportar para Excel
python -m muamba.cli -t "iphone, macbook, memoria" -o oportunidades.xlsx
```

---

## 💡 Dicas para Arrematação na Receita Federal

1. **Pessoa Física vs. Pessoa Jurídica:**
   * Lotes para **Pessoa Física (PF)** são voltados para uso próprio. Para revenda comercial contínua em volume, utilize **Pessoa Jurídica (PJ)** com CNAE apropriado.
2. **ICMS Estadual:**
   * O lance vencedor não inclui o ICMS do estado de retirada (geralmente pago via guia DAE antes da retirada dos itens).
3. **Retirada das Mercadorias:**
   * A Receita Federal **não realiza frete nem entrega**. É obrigatório comparecer ao depósito ou enviar transportadora com procuração do arrematante.
