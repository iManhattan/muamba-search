const KNOWN_BRANDS = [
  "APPLE",
  "IPHONE",
  "MACBOOK",
  "IPAD",
  "AIRPODS",
  "WATCH",
  "SAMSUNG",
  "GALAXY",
  "XIAOMI",
  "REDMI",
  "POCO",
  "MOTOROLA",
  "PLAYSTATION",
  "PS5",
  "PS4",
  "NINTENDO",
  "SWITCH",
  "XBOX",
  "RTX",
  "GEFORCE",
  "GTX",
  "RADEON",
  "SANDISK",
  "KINGSTON",
  "CORSAIR",
  "LOGITECH",
  "DJI",
  "GOPRO",
  "JBL",
  "SONY",
  "CANON",
  "NIKON",
  "BLACKMAGIC",
  "DELL",
  "ALIENWARE",
  "THINKPAD",
  "STARLINK",
  "GARMIN",
  "ASUS",
  "ACER",
  "LENOVO",
  "GIGABYTE",
  "MSI",
  "ASROCK",
  "AMD",
  "RYZEN",
  "INTEL",
  "CORE I3",
  "CORE I5",
  "CORE I7",
  "CORE I9",
  "AORUS",
];

/**
 * Avalia se o item da Receita é facilmente identificável para busca de preços no mercado
 * e extrai o nome do produto limpo, preservando modelos comerciais essenciais (como B550M-PLUS,
 * RTX 4070, Ryzen 7 7800X3D) e removendo apenas números de série, IMEIs e ruídos fiscais/fabris.
 */
export function extrairProdutoIdentificavel(descricao: string): string | null {
  if (!descricao) return null;

  const descUpper = descricao.toUpperCase();
  const temMarca = KNOWN_BRANDS.some((marca) => descUpper.includes(marca));
  if (!temMarca) return null;

  let texto = descricao.toUpperCase();

  // 1. Remove final de linha com barras (////)
  texto = texto.replace(/\/+.*$/g, "");

  // 2. Remove IMEIs (14 a 16 dígitos) e sequências puramente numéricas longas (8+ dígitos)
  // Ex: "350418051957876" em "IPHONE 17 256GB A3519 350418051957876"
  texto = texto.replace(/\b\d{8,}\b/g, "");

  // 3. Remove tags explícitas de identificação e seus valores (ex: IMEI: 350418..., SN: SDF9K6..., COD: 1234)
  texto = texto.replace(
    /\b(IMEI|SN|S\/N|SERIAL|ANATEL|HOMOLOGA[CÇ][AÃ]O|PART\s*NUMBER|PN|P\/N|SKU|REF|REFERENCIA|COD|CODIGO)\b\s*[:\s]*[A-Z0-9\-\/]+/gi,
    ""
  );

  // 4. Remove códigos de modelo específicos da Apple que não agregam nas lojas (ex: A3519, A3106, A2849, A2633)
  texto = texto.replace(/\bA\d{4}\b/g, "");

  // 5. Remove códigos de fábrica de smartphones/aparelhos (ex: SM-S928B/DS, MTJV3AM/A, MR993LL/A, SNV2S/1000G)
  texto = texto.replace(/\bSM\-[A-Z0-9]+(\/[A-Z0-9]+)?\b/gi, "");
  texto = texto.replace(/\b[A-Z0-9\-]{4,}\/[A-Z0-9\-]{1,}\b/g, "");

  // 6. Remove prefixos de part numbers industriais específicos conhecidos (Sony CFI-..., Nintendo HEG-..., Part numbers de CPU como 100-100000...)
  texto = texto.replace(/\b(CFI|HEG|CUH)\-[A-Z0-9\-]+\b/gi, "");
  texto = texto.replace(/\b\d{3}\-\d{7,}[A-Z0-9]*\b/g, ""); // Ex: part number AMD 100-100000910WOF
  texto = texto.replace(/\b(TUF|ROG|GAMING)\-[A-Z0-9\-]{6,}\b/gi, ""); // Ex: TUF-RTX4070TIS-O16G-GAMING
  texto = texto.replace(/\bMODELO\s*[:\s]*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\bMODEL\s*[:\s]*[A-Z0-9\-]+/gi, "");

  // 7. Remove ruídos de fabricação e procedência
  texto = texto.replace(/\b(MADE IN|FABRICADO NA|FABRICADO NO|ORIGEM)\s+[A-Z\s]+/gi, "");
  texto = texto.replace(
    /\b(CHINA|TAIWAN|COREIA DO SUL|COREIA|VIETNA|ESTADOS UNIDOS|EUA|PARAGUAI|AUSTRALIA)\b/gi,
    ""
  );

  // 8. Remove palavras de estado / embalagem / conservação
  texto = texto.replace(
    /\b(LACRADO|USADO|NOVO|NA EMBALAGEM|CAIXA ORIGINAL|COM DEFEITO|RECONDICIONADO|VITRINE|ORIGINAL|SEM COOLER|COM COOLER)\b/gi,
    ""
  );

  // 9. Remove categorias redundantes em celulares/consoles (mas preserva componentes de PC como Placa Mae, SSD, etc.)
  texto = texto.replace(/\b(SMARTPHONE|TELEFONE CELULAR|APARELHO CELULAR|APARELHO TELEFONICO)\b/gi, "");
  texto = texto.replace(/\b(CONSOLE DE VIDEO GAME|CONSOLE DE VIDEOGAME|CONSOLE)\b/gi, "");
  texto = texto.replace(/\b(FONE DE OUVIDO)\b/gi, "");
  texto = texto.replace(/\b(SMARTWATCH)\b/gi, "");

  // 10. Remove menções a acessórios inclusos
  texto = texto.replace(/\bCOM\s+(LEITOR|JOY\-CON|CONTROLE|TELA|ESTOJO|CABO|CARREGADOR)\b[A-Z0-9\s\-]*/gi, "");
  texto = texto.replace(/\bJOY\-CON\b/gi, "");

  // 11. Remove voltagens e cores acessórias
  texto = texto.replace(/\b(BIVOLT|110V|220V)\b/gi, "");
  texto = texto.replace(/\b(TITANIUM BLACK|SPACE BLACK|MIDNIGHT|MEIA\-NOITE|ESTELAR|STARLIGHT|GRAFITE)\b/gi, "");
  texto = texto.replace(/\b(CAIXA DE ALUMINIO)\b/gi, "");
  texto = texto.replace(/\b(256BITS|128BITS|384BITS|GDDR6X|GDDR6)\b/gi, "");

  // 12. Unifica capacidade e memória (ex: "128 GB" -> "128GB")
  texto = texto.replace(/(\d+)\s*(GB|TB|MB|RAM)\b/gi, "$1$2");

  // 13. Limpeza de pontuação e caracteres indesejados (mantendo hífen e ponto em M.2 e nomes de modelo como B550M-PLUS)
  texto = texto.replace(/[\\\/\|\*\#\_\+\:]+/g, " ");
  texto = texto.replace(/\s+/g, " ").trim();

  // 14. Remove duplicatas
  let tokens: string[] = [];
  for (const t of texto.split(" ")) {
    if (t && !tokens.includes(t)) {
      tokens.push(t);
    }
  }

  // 15. Limita o tamanho para evitar queries excessivamente longas no motor de busca
  if (tokens.length > 7) {
    tokens = tokens.slice(0, 7);
  }

  const resultado = tokens
    .join(" ")
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

  if (resultado.length < 3) return null;

  return resultado;
}
