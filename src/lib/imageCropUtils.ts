/**
 * Utility to detect and remove letterboxing/pillarboxing (black bars)
 * from AI-generated images so they seamlessly cover the entire frame edge-to-edge.
 */

export interface LetterboxInfo {
  hasLetterbox: boolean;
  scale: number;
  topFraction: number;
  bottomFraction: number;
}

/**
 * Rapidly analyzes an HTMLImageElement using an offscreen canvas.
 * Checks if the image has symmetrical black bars on top and bottom (letterboxing).
 */
export function analyzeLetterbox(img: HTMLImageElement): LetterboxInfo {
  const defaultResult: LetterboxInfo = {
    hasLetterbox: false,
    scale: 1,
    topFraction: 0,
    bottomFraction: 0,
  };

  try {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height || width < 50 || height < 50) {
      return defaultResult;
    }

    // Downsample to 100x100 for instant (<1ms) analysis
    const sampleSize = 100;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultResult;

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imgData.data;

    const isRowBlack = (y: number): boolean => {
      let blackCount = 0;
      let totalChecked = 0;
      // Check middle region (15% to 75%) to avoid right-corner watermarks
      for (let x = 15; x <= 75; x += 3) {
        totalChecked++;
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Luminance or max channel < 32 is considered dark/black bar
        const maxVal = Math.max(r, g, b);
        if (maxVal < 32) {
          blackCount++;
        }
      }
      return blackCount / totalChecked >= 0.9;
    };

    // Scan top rows downward
    let topBlackRows = 0;
    for (let y = 0; y < 40; y++) {
      if (isRowBlack(y)) {
        topBlackRows++;
      } else {
        break;
      }
    }

    // Scan bottom rows upward
    let bottomBlackRows = 0;
    for (let y = sampleSize - 1; y >= 60; y--) {
      if (isRowBlack(y)) {
        bottomBlackRows++;
      } else {
        break;
      }
    }

    // True letterboxing has black bars on both top and bottom (usually 5% to 35% each)
    if (topBlackRows >= 4 && bottomBlackRows >= 4) {
      const topFraction = topBlackRows / sampleSize;
      const bottomFraction = bottomBlackRows / sampleSize;
      const visibleRatio = 1 - (topFraction + bottomFraction);

      if (visibleRatio >= 0.45 && visibleRatio <= 0.94) {
        // Multiplier with tiny 2% margin to ensure no 1px black seam remains
        const scale = (1 / visibleRatio) * 1.025;
        return {
          hasLetterbox: true,
          scale,
          topFraction,
          bottomFraction,
        };
      }
    }

    return defaultResult;
  } catch (err) {
    // If CORS or security restriction occurs, fail gracefully
    return defaultResult;
  }
}

/**
 * Crops out black bars from an image data URL or external URL,
 * returning a clean base64 data URL that completely fills the frame.
 */
export async function cropBlackBars(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const info = analyzeLetterbox(img);
        if (!info.hasLetterbox) {
          resolve(imageSrc);
          return;
        }

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const cropTop = Math.floor(info.topFraction * height);
        const cropBottom = Math.floor(info.bottomFraction * height);
        const cropHeight = height - cropTop - cropBottom;

        if (cropHeight <= 0) {
          resolve(imageSrc);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(
          img,
          0, cropTop, width, cropHeight, // source rect
          0, 0, width, cropHeight       // dest rect
        );

        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(cleanDataUrl);
      } catch (err) {
        console.warn('[ImageCrop] Erro ao recortar barras pretas:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}
