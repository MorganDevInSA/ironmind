/** Single source of truth for static brand imagery under `public/brand/`. */

const base = '/brand';

export const brandAssets = {
  logoMale: `${base}/ironmind_logo_male.png`,
  logoFemale: `${base}/ironmind_logo_female.png`,
  logoCombined: `${base}/ironmind_logo_combined.png`,
  /** Apple touch / PWA metadata icon */
  appleTouchIcon: `${base}/ironmind_transparent_1_reverted.png`,
  /** Optional alternate crops (marketing / future UI) */
  alternateTopRight: `${base}/ironmind_logo_2_top_right.png`,
  alternateBottomLeft: `${base}/ironmind_logo_3_bottom_left.png`,
  alternateBottomRight: `${base}/ironmind_logo_4_bottom_right.png`,
} as const;
