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
];

/**
 * Avalia se o item da Receita é facilmente identificável para busca de preços no mercado
 * e extrai o nome do produto limpo, sem números de série, IMEIs ou ruídos fiscais.
 */
export function extrairProdutoIdentificavel(descricao: string): string | null {
  if (!descricao) return null;

  const descUpper = descricao.toUpperCase();
  const temMarca = KNOWN_BRANDS.some((marca) => descUpper.includes(marca));
  if (!temMarca) return null;

  let texto = descricao.toUpperCase();

  // 1. Remove final de linha com barras (////)
  texto = texto.replace(/\/+.*$/g, "");

  // 2. Remove IMEIs (14 a 16 dígitos) e sequências numéricas longas (8+ dígitos seguidos)
  // Ex: "350418051957876" em "IPHONE 17 256GB A3519 350418051957876"
  texto = texto.replace(/\b\d{8,}\b/g, "");

  // 3. Remove tags explícitas de identificação e seus valores (ex: IMEI: 350418..., SN: SDF9K6..., COD: 1234)
  texto = texto.replace(
    /\b(IMEI|SN|S\/N|SERIAL|ANATEL|HOMOLOGA[CÇ][AÃ]O|PART\s*NUMBER|PN|P\/N|SKU|REF|REFERENCIA|COD|CODIGO)\b\s*[:\s]*[A-Z0-9\-\/]+/gi,
    ""
  );

  // 4. Remove códigos de modelo específicos da Apple (ex: A3519, A3106, A2849, A2633, A2172)
  texto = texto.replace(/\bA\d{4}\b/g, "");

  // 5. Remove códigos de modelo complexos com barras, traços ou prefixos de fábrica
  // Ex: SM-S928B/DS, MTJV3AM/A, MR993LL/A, CFI-2014A, HEG-001, TUF-RTX4070TIS-O16G-GAMING
  texto = texto.replace(/\b[A-Z0-9\-]+\/[A-Z0-9\-]+\b/g, "");
  texto = texto.replace(/\b[A-Z0-9]+\-[A-Z0-9\-]{3,}\b/g, "");
  texto = texto.replace(/\b(CFI|HEG|SM|MT|CUH)\-[A-Z0-9\-]+\b/gi, "");
  texto = texto.replace(/\bMODELO\s*[:\s]*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\bMODEL\s*[:\s]*[A-Z0-9\-]+/gi, "");

  // 6. Remove ruídos de fabricação e procedência
  texto = texto.replace(/\b(MADE IN|FABRICADO NA|FABRICADO NO|ORIGEM)\s+[A-Z\s]+/gi, "");
  texto = texto.replace(
    /\b(CHINA|TAIWAN|COREIA DO SUL|COREIA|VIETNA|ESTADOS UNIDOS|EUA|PARAGUAI|AUSTRALIA)\b/gi,
    ""
  );

  // 7. Remove palavras de estado / embalagem / conservação
  texto = texto.replace(
    /\b(LACRADO|USADO|NOVO|NA EMBALAGEM|CAIXA ORIGINAL|COM DEFEITO|RECONDICIONADO|VITRINE|ORIGINAL)\b/gi,
    ""
  );

  // 8. Remove categorias redundantes que afunilam demais ou quebram o mecanismo de busca
  // Ex: "SMARTPHONE APPLE IPHONE" -> "APPLE IPHONE"
  texto = texto.replace(/\b(SMARTPHONE|TELEFONE CELULAR|APARELHO CELULAR|APARELHO TELEFONICO)\b/gi, "");
  texto = texto.replace(/\b(CONSOLE DE VIDEO GAME|CONSOLE DE VIDEOGAME|CONSOLE)\b/gi, "");
  texto = texto.replace(/\b(FONE DE OUVIDO)\b/gi, "");
  texto = texto.replace(/\b(SMARTWATCH)\b/gi, "");
  texto = texto.replace(/\b(PLACA DE VIDEO)\b/gi, "");
  texto = texto.replace(/\b(NOTEBOOK)\b/gi, "");

  // 9. Remove menções a acessórios inclusos
  texto = texto.replace(/\bCOM\s+(LEITOR|JOY\-CON|CONTROLE|TELA|ESTOJO|CABO|CARREGADOR)\b[A-Z0-9\s\-]*/gi, "");
  texto = texto.replace(/\bJOY\-CON\b/gi, "");

  // 10. Remove voltagens e especificações secundárias
  texto = texto.replace(/\b(BIVOLT|110V|220V)\b/gi, "");
  texto = texto.replace(/\b(TITANIUM BLACK|SPACE BLACK|MIDNIGHT|MEIA\-NOITE|ESTELAR|STARLIGHT|GRAFITE)\b/gi, "");
  texto = texto.replace(/\b(CAIXA DE ALUMINIO|ALUMINIO)\b/gi, "");
  texto = texto.replace(/\b(256BITS|GDDR6X|GDDR6|SDXC|UHS\-1|CARD)\b/gi, "");

  // 11. Unifica capacidade de armazenamento (ex: "128 GB" -> "128GB")
  texto = texto.replace(/(\d+)\s*(GB|TB|MB|RAM)\b/gi, "$1$2");

  // 12. Limpeza de pontuação e espaços múltiplos
  texto = texto.replace(/[\\\/\|\*\#\_\+\:\.]+/g, " ");
  texto = texto.replace(/\s+/g, " ").trim();

  // 13. Remove palavras duplicadas (ex: "Apple Macbook Air 2024 Apple M3" -> "Apple Macbook Air 2024 M3")
  let tokens: string[] = [];
  for (const t of texto.split(" ")) {
    if (t && !tokens.includes(t)) {
      tokens.push(t);
    }
  }

  // 14. Limita para até 6 palavras mais relevantes para garantir resultados no Google/Buscapé
  if (tokens.length > 6) {
    tokens = tokens.slice(0, 6);
  }

  const resultado = tokens
    .join(" ")
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

  // Se tiver menos de 3 caracteres, descarta
  if (resultado.length < 3) return null;

  return resultado;
}
