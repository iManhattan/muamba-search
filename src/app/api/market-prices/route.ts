import { NextRequest, NextResponse } from "next/server";
import { extrairProdutoIdentificavel } from "@/lib/product-identifier";

export interface AnuncioMercado {
  title: string;
  price: string;
  store: string;
  link: string;
  image?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q");

  if (!rawQuery) {
    return NextResponse.json({ error: "Parâmetro 'q' é obrigatório" }, { status: 400 });
  }

  // Remove ruídos (IMEI, códigos de modelo A3519, serial, etc.) para garantir anúncios reais
  const query = extrairProdutoIdentificavel(rawQuery) || rawQuery.trim();

  const encodedQuery = encodeURIComponent(query);
  const googleShoppingUrl = `https://www.google.com/search?tbm=shop&q=${encodedQuery}`;
  const mercadoLivreUrl = `https://lista.mercadolivre.com.br/${encodedQuery}`;

  const buscapeUrl = `https://www.buscape.com.br/search?q=${encodedQuery}`;

  try {
    const res = await fetch(buscapeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (!res.ok) {
      return NextResponse.json({
        query,
        anuncios: [],
        googleShoppingUrl,
        mercadoLivreUrl,
      });
    }

    const html = await res.text();
    const articles = html.match(/<article[^>]*data-testid="product-card"[^>]*>([\s\S]*?)<\/article>/g) || [];

    const anuncios: AnuncioMercado[] = [];

    for (const art of articles.slice(0, 5)) {
      // Link
      const hrefMatch = art.match(/<a[^>]*href="([^"]+)"/);
      let link = hrefMatch ? hrefMatch[1] : "";
      if (link.startsWith("/")) {
        link = `https://www.buscape.com.br${link}`;
      }

      // Title
      const titleMatch = art.match(/<h2[^>]*data-testid="product-card::name"[^>]*>([^<]+)<\/h2>/);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Price
      const priceMatch = art.match(/<div[^>]*data-testid="product-card::price"[^>]*>(?:<strong[^>]*>)?([^<]+)/);
      const price = priceMatch ? priceMatch[1].trim() : "";

      // Store
      const storeMatch = art.match(/<div[^>]*class="[^"]*BestOfferMerchant[^"]*"[^>]*>[\s\S]*?<span>Via ([^<]+)<\/span>/);
      const store = storeMatch ? storeMatch[1].trim() : "Lojas Online";

      // Image
      const imgMatch = art.match(/<img[^>]*src="([^"]+)"/);
      const image = imgMatch ? imgMatch[1] : "";

      if (title && price) {
        anuncios.push({
          title,
          price,
          store,
          link: link || googleShoppingUrl,
          image,
        });
      }
    }

    return NextResponse.json({
      query,
      anuncios,
      googleShoppingUrl,
      mercadoLivreUrl,
    });
  } catch (error: any) {
    return NextResponse.json({
      query,
      anuncios: [],
      googleShoppingUrl,
      mercadoLivreUrl,
      error: error.message,
    });
  }
}
