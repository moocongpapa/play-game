/** Complete provider response so the real SDK validates our fake transport. */
export const freePlan = {
  tier: 'free', character_count: 200, character_limit: 10000,
  max_credit_limit_extension: 0, can_extend_character_limit: false, allowed_to_extend_character_limit: false,
  next_character_count_reset_unix: 1794072103, voice_slots_used: 0, professional_voice_slots_used: 0,
  professional_voice_slots_used_in_workspace: 0, voice_limit: 3, voice_add_edit_counter: 0,
  professional_voice_limit: 0, can_extend_voice_limit: false, can_use_instant_voice_cloning: false,
  can_use_professional_voice_cloning: false, current_overage: { amount: '0', currency: 'usd' },
  status: 'free', open_invoices: [], has_open_invoices: false,
};
