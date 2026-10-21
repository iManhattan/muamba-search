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
 * e extrai o nome do produto limpo, sem números de série ou ruídos fiscais.
 */
export function extrairProdutoIdentificavel(descricao: string): string | null {
  if (!descricao) return null;

  const descUpper = descricao.toUpperCase();
  const temMarca = KNOWN_BRANDS.some((marca) => descUpper.includes(marca));
  if (!temMarca) return null;

  // Limpa padrões comuns de apreensão da Receita Federal
  let texto = descricao;
  texto = texto.replace(/\/{2,}.*$/g, ""); // remove barras no final (ex: ////)
  texto = texto.replace(/\bSN\s*:\s*[A-Z0-9\-]+/gi, ""); // remove número de série
  texto = texto.replace(/\bS\/N\s*:\s*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\bSERIAL\s*:\s*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\bMADE IN\s+[A-Z\s]+/gi, "");
  texto = texto.replace(/\bFABRICADO NA\s+[A-Z\s]+/gi, "");
  texto = texto.replace(/\bORIGEM\s*:\s*[A-Z\s]+/gi, "");
  texto = texto.replace(/\bMODELO\s*:\s*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\bMODEL\s*:\s*[A-Z0-9\-]+/gi, "");
  texto = texto.replace(/\b(CHINA|TAIWAN|COREIA DO SUL|ESTADOS UNIDOS|AUSTRALIA)\b/gi, "");
  texto = texto.replace(/[\\\/\|\*\#\_\+]+/g, " "); // remove pontuações estranhas
  texto = texto.replace(/\s+/g, " ").trim();

  // Se ficou muito longo, mantém os primeiros termos essenciais
  const palavras = texto.split(" ");
  if (palavras.length > 7) {
    texto = palavras.slice(0, 7).join(" ");
  }

  // Se tiver menos de 3 caracteres, descarta
  if (texto.length < 3) return null;

  return texto;
}
