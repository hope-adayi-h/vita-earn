/**
 * Compresse et redimensionne une image côté client vers un Data URL JPEG léger.
 * Évite tout blocage de bucket Storage et garde les pages rapides sur réseau 3G/4G.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 640,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP)."));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      reject(new Error("L'image est trop volumineuse (maximum 6 Mo)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire l'image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format d'image non supporté."));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Erreur lors du traitement de l'image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
