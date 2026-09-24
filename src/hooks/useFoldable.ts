import { useState, useEffect } from "react";

export interface FoldableState {
  isFoldable: boolean;
  isSpanned: boolean;
  isBookMode: boolean; // vertical hinge (2 horizontal segments) - book open
  isLaptopMode: boolean; // horizontal hinge (2 vertical segments) - mini laptop / stand
  isIPhoneDuoDimensions: boolean; // 7.6" passport aspect ratio (approx 2670x1878 px unfolded, ratio ~1.42)
  viewportSegmentsCount: number;
}

export function useFoldable(): FoldableState {
  const [state, setState] = useState<FoldableState>(() => checkFoldable());

  function checkFoldable(): FoldableState {
    if (typeof window === "undefined") {
      return {
        isFoldable: false,
        isSpanned: false,
        isBookMode: false,
        isLaptopMode: false,
        isIPhoneDuoDimensions: false,
        viewportSegmentsCount: 1,
      };
    }

    // Check modern CSS viewport-segments / screen-spanning queries
    const hasHorizontalSegments = window.matchMedia(
      "(horizontal-viewport-segments: 2), (screen-spanning: single-fold-vertical)"
    ).matches;

    const hasVerticalSegments = window.matchMedia(
      "(vertical-viewport-segments: 2), (screen-spanning: single-fold-horizontal)"
    ).matches;

    // Check iPhone Duo specific unfolded viewport and aspect ratio (7.6" ~2670x1878, ratio ~1.42:1)
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / (height || 1);

    const isIPhoneDuoDimensions =
      width >= 680 &&
      width <= 1100 &&
      ratio >= 1.25 &&
      ratio <= 1.6;

    const isSpanned = hasHorizontalSegments || hasVerticalSegments;
    const isBookMode = hasHorizontalSegments || (isIPhoneDuoDimensions && width > height);
    const isLaptopMode = hasVerticalSegments;

    return {
      isFoldable: isSpanned || isIPhoneDuoDimensions,
      isSpanned,
      isBookMode,
      isLaptopMode,
      isIPhoneDuoDimensions,
      viewportSegmentsCount: isSpanned ? 2 : 1,
    };
  }

  useEffect(() => {
    const update = () => setState(checkFoldable());

    const mqHorizontal = window.matchMedia(
      "(horizontal-viewport-segments: 2), (screen-spanning: single-fold-vertical)"
    );
    const mqVertical = window.matchMedia(
      "(vertical-viewport-segments: 2), (screen-spanning: single-fold-horizontal)"
    );

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    mqHorizontal.addEventListener?.("change", update);
    mqVertical.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      mqHorizontal.removeEventListener?.("change", update);
      mqVertical.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}
