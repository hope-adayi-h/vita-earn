import { NextResponse } from "next/server";
import { getStoredProductById } from "@/lib/data/products-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const product = await getStoredProductById(params.id);
  if (!product || !product.imageUrl) {
    return new NextResponse("Image introuvable", { status: 404 });
  }

  const img = product.imageUrl.trim();

  // Si c'est un Data URL base64, le décoder en réponse binaire HTTP
  // pour que les aperçus WhatsApp Status / Open Graph puissent afficher la photo.
  const match = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match && match[1] && match[2]) {
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return NextResponse.redirect(img);
  }

  return new NextResponse("Format d'image non supporté", { status: 400 });
}
