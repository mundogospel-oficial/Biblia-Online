/**
 * Image Moderation Service
 * Detects obscene, explicit, adult, or inappropriate images uploaded or submitted by users.
 */

const EXPLICIT_FILENAME_TERMS = [
  'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda',
  'vagina', 'penis', 'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt',
  'ass', 'hentai', 'safada', 'gostosa', 'nsfw', 'adult', 'xxx', 'dick', 'pussy', 'boob'
];

/**
 * Checks whether an uploaded image file contains explicit or inappropriate content.
 */
export async function validateImageContent(file: File): Promise<{ isAppropriate: boolean; reason?: string }> {
  if (!file) return { isAppropriate: true };

  // 1. Check filename for explicit terms
  const fileNameLower = file.name.toLowerCase();
  const hasForbiddenName = EXPLICIT_FILENAME_TERMS.some(term => {
    const regex = new RegExp(`(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`, 'i');
    return regex.test(fileNameLower);
  });

  if (hasForbiddenName) {
    return {
      isAppropriate: false,
      reason: "Imagem inapropriada tente novamente"
    };
  }

  // If not an image, pass through to let standard file validator handle format
  if (!file.type.startsWith('image/')) {
    return { isAppropriate: true };
  }

  // 2. Perform canvas pixel analysis for skin-tone / explicit visual density
  try {
    const isExplicitVisuals = await analyzeImageCanvas(file);
    if (isExplicitVisuals) {
      return {
        isAppropriate: false,
        reason: "Imagem inapropriada tente novamente"
      };
    }
  } catch (err) {
    console.warn("[Moderation] Non-fatal image canvas analysis error:", err);
  }

  return { isAppropriate: true };
}

/**
 * Fast client-side image canvas skin-tone & chromaticity analysis
 */
function analyzeImageCanvas(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 120; // Downscale to 120px for rapid performance
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const totalPixels = canvas.width * canvas.height;

        let skinPixelCount = 0;

        // Sample every pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Normalized RGB skin color classification rule
          const isSkinRGB = r > 95 && g > 40 && b > 20 &&
            (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
            Math.abs(r - g) > 15 && r > g && r > b;

          // Normalized YCbCr skin color classification
          const y = 0.299 * r + 0.587 * g + 0.114 * b;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          const isSkinYCbCr = cb >= 80 && cb <= 130 && cr >= 132 && cr <= 175;

          if (isSkinRGB && isSkinYCbCr) {
            skinPixelCount++;
          }
        }

        const skinRatio = skinPixelCount / totalPixels;

        // If skin tones dominate > 45% of the image canvas, flag as obscene/inappropriate
        if (skinRatio > 0.45) {
          resolve(true);
          return;
        }

        resolve(false);
      } catch (err) {
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    img.src = objectUrl;
  });
}
