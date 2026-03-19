import { ms, vs } from '../../utils/responsive';

/** Same left offset for all Stylist cards and sections — everything left-aligned. */
export const STYLIST_CARD_LEFT = ms(10);

/** Same width for all Stylist cards so branding, sub-branding, and list cards align. */
export const STYLIST_CARD_WIDTH = ms(397);

/** Same gap between all cards and at bottom (appointments + waitlist). */
export const STYLIST_CARD_GAP = vs(4);

/** Left padding for card content and section titles — one alignment line for all. */
export const STYLIST_CONTENT_PADDING_LEFT = ms(16);

/** Height of the sub-branding card (Muse → sub-branding → appointments). */
export const SUB_BRANDING_CARD_HEIGHT = vs(60);
