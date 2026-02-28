export interface FirstAidStep {
  step: number;
  instruction: string;
}

export interface FirstAidGuidance {
  category: string;
  emoji: string;
  title: string;
  urgency: 'critical' | 'high' | 'medium';
  steps: FirstAidStep[];
  warnings: string[];
  callEmergency: boolean;
}

export const EMERGENCY_CATEGORIES: { id: string; label: string; emoji: string; keywords: string[] }[] = [
  { id: 'cpr', label: 'CPR / Cardiac Arrest', emoji: '❤️', keywords: ['cpr', 'cardiac', 'heart', 'chest', 'pulse', 'breathing', 'unconscious', 'not breathing'] },
  { id: 'choking', label: 'Choking', emoji: '🫁', keywords: ['chok', 'airway', 'heimlich', 'throat', 'swallow', 'stuck'] },
  { id: 'bleeding', label: 'Severe Bleeding', emoji: '🩸', keywords: ['bleed', 'blood', 'wound', 'cut', 'lacerat', 'hemorrhage'] },
  { id: 'burns', label: 'Burns', emoji: '🔥', keywords: ['burn', 'fire', 'scald', 'hot', 'flame', 'chemical burn'] },
  { id: 'fractures', label: 'Fractures / Broken Bones', emoji: '🦴', keywords: ['fracture', 'broken', 'bone', 'sprain', 'break', 'snap'] },
  { id: 'seizures', label: 'Seizures', emoji: '⚡', keywords: ['seizure', 'epilepsy', 'convuls', 'fit', 'shaking', 'tremor'] },
  { id: 'stroke', label: 'Stroke', emoji: '🧠', keywords: ['stroke', 'face droop', 'slurred', 'arm weak', 'fast', 'brain'] },
  { id: 'poisoning', label: 'Poisoning / Overdose', emoji: '☠️', keywords: ['poison', 'overdose', 'toxic', 'swallow', 'chemical', 'drug'] },
];

const GUIDANCE_MAP: Record<string, FirstAidGuidance> = {
  cpr: {
    category: 'cpr',
    emoji: '❤️',
    title: 'CPR / Cardiac Arrest',
    urgency: 'critical',
    callEmergency: true,
    steps: [
      { step: 1, instruction: 'Check the scene is safe. Tap the person\'s shoulder and shout "Are you OK?"' },
      { step: 2, instruction: 'Call emergency services (911/112) immediately or ask someone nearby to call.' },
      { step: 3, instruction: 'Lay the person on their back on a firm, flat surface.' },
      { step: 4, instruction: 'Place the heel of your hand on the center of their chest (lower half of breastbone).' },
      { step: 5, instruction: 'Place your other hand on top, interlace fingers. Keep arms straight.' },
      { step: 6, instruction: 'Push down hard and fast — at least 2 inches deep, 100–120 compressions per minute (to the beat of "Stayin\' Alive").' },
      { step: 7, instruction: 'After 30 compressions, give 2 rescue breaths: tilt head back, lift chin, pinch nose, seal mouth, breathe for 1 second each.' },
      { step: 8, instruction: 'Continue 30:2 cycle until emergency services arrive or the person shows signs of life.' },
      { step: 9, instruction: 'If an AED is available, use it as soon as possible.' },
    ],
    warnings: [
      'Do NOT stop CPR unless the person starts breathing normally or emergency services take over.',
      'Rib fractures can occur during CPR — this is acceptable. Continue compressions.',
    ],
  },
  choking: {
    category: 'choking',
    emoji: '🫁',
    title: 'Choking',
    urgency: 'critical',
    callEmergency: true,
    steps: [
      { step: 1, instruction: 'Ask "Are you choking?" If they can cough, encourage them to keep coughing.' },
      { step: 2, instruction: 'If they cannot cough, speak, or breathe — act immediately.' },
      { step: 3, instruction: 'Stand behind the person. Give 5 firm back blows between shoulder blades with the heel of your hand.' },
      { step: 4, instruction: 'If back blows fail: perform 5 abdominal thrusts (Heimlich). Place fist above navel, grasp with other hand, thrust inward and upward.' },
      { step: 5, instruction: 'Alternate 5 back blows and 5 abdominal thrusts until the object is dislodged or they lose consciousness.' },
      { step: 6, instruction: 'If they become unconscious, lower them to the ground and begin CPR. Check mouth before giving breaths.' },
      { step: 7, instruction: 'For infants: use 5 back blows and 5 chest thrusts (NOT abdominal thrusts).' },
    ],
    warnings: [
      'Do NOT perform blind finger sweeps — only remove an object if you can clearly see it.',
      'Seek medical attention after Heimlich maneuver even if successful.',
    ],
  },
  bleeding: {
    category: 'bleeding',
    emoji: '🩸',
    title: 'Severe Bleeding',
    urgency: 'critical',
    callEmergency: true,
    steps: [
      { step: 1, instruction: 'Ensure your safety. Wear gloves if available to protect against bloodborne pathogens.' },
      { step: 2, instruction: 'Call emergency services immediately for severe bleeding.' },
      { step: 3, instruction: 'Apply firm, direct pressure to the wound using a clean cloth, bandage, or clothing.' },
      { step: 4, instruction: 'Maintain continuous pressure for at least 10–15 minutes without lifting the cloth.' },
      { step: 5, instruction: 'If blood soaks through, add more material on top — do NOT remove the original cloth.' },
      { step: 6, instruction: 'For limb bleeding: if direct pressure fails, apply a tourniquet 2–3 inches above the wound. Note the time applied.' },
      { step: 7, instruction: 'Elevate the injured area above heart level if possible and no fracture is suspected.' },
      { step: 8, instruction: 'Keep the person warm and calm. Watch for signs of shock (pale, cold, rapid breathing).' },
    ],
    warnings: [
      'Do NOT remove embedded objects — stabilize them in place.',
      'Do NOT apply tourniquet to neck, chest, or abdomen.',
      'Tourniquets cause tissue damage — only use as last resort for life-threatening limb bleeding.',
    ],
  },
  burns: {
    category: 'burns',
    emoji: '🔥',
    title: 'Burns',
    urgency: 'high',
    callEmergency: false,
    steps: [
      { step: 1, instruction: 'Remove the person from the source of the burn. Ensure your own safety first.' },
      { step: 2, instruction: 'Cool the burn with cool (not cold/icy) running water for 20 minutes.' },
      { step: 3, instruction: 'Remove jewelry, watches, or tight clothing near the burn — but NOT if stuck to skin.' },
      { step: 4, instruction: 'Cover loosely with a clean, non-fluffy material (cling film or clean plastic bag works well).' },
      { step: 5, instruction: 'Do NOT apply butter, toothpaste, ice, or any creams to the burn.' },
      { step: 6, instruction: 'For chemical burns: brush off dry chemicals first, then flush with large amounts of water for 20+ minutes.' },
      { step: 7, instruction: 'Seek medical attention for burns larger than 3 inches, on face/hands/feet/genitals, or if blistering occurs.' },
    ],
    warnings: [
      'Call emergency services for burns covering large areas, electrical burns, or inhalation injuries.',
      'Do NOT burst blisters — this increases infection risk.',
      'Keep the person warm to prevent hypothermia while cooling the burn.',
    ],
  },
  fractures: {
    category: 'fractures',
    emoji: '🦴',
    title: 'Fractures / Broken Bones',
    urgency: 'high',
    callEmergency: false,
    steps: [
      { step: 1, instruction: 'Keep the person still. Do NOT attempt to straighten the bone.' },
      { step: 2, instruction: 'Immobilize the injured area using a splint (rigid material) padded with soft material.' },
      { step: 3, instruction: 'Splint the joint above AND below the fracture site.' },
      { step: 4, instruction: 'Apply ice wrapped in cloth to reduce swelling — 20 minutes on, 20 minutes off.' },
      { step: 5, instruction: 'Elevate the injured limb above heart level if possible.' },
      { step: 6, instruction: 'Check circulation below the injury: pulse, sensation, and movement.' },
      { step: 7, instruction: 'Seek medical attention. For suspected spinal injuries, do NOT move the person.' },
    ],
    warnings: [
      'Call emergency services for suspected spinal, pelvis, or femur fractures.',
      'Do NOT give food or water — surgery may be needed.',
      'Watch for signs of shock.',
    ],
  },
  seizures: {
    category: 'seizures',
    emoji: '⚡',
    title: 'Seizures',
    urgency: 'high',
    callEmergency: false,
    steps: [
      { step: 1, instruction: 'Stay calm. Time the seizure. Most seizures end within 1–3 minutes.' },
      { step: 2, instruction: 'Clear the area of hard or sharp objects. Cushion the person\'s head.' },
      { step: 3, instruction: 'Do NOT restrain the person or put anything in their mouth.' },
      { step: 4, instruction: 'Gently roll them onto their side (recovery position) to prevent choking.' },
      { step: 5, instruction: 'Stay with them until fully conscious. Speak calmly and reassuringly.' },
      { step: 6, instruction: 'After the seizure, check for injuries and keep them comfortable.' },
      { step: 7, instruction: 'Call emergency services if: seizure lasts >5 minutes, person doesn\'t regain consciousness, or has another seizure.' },
    ],
    warnings: [
      'NEVER put anything in the person\'s mouth during a seizure.',
      'Call 911 if this is their first seizure, they are pregnant, or injured during the seizure.',
    ],
  },
  stroke: {
    category: 'stroke',
    emoji: '🧠',
    title: 'Stroke — Use FAST',
    urgency: 'critical',
    callEmergency: true,
    steps: [
      { step: 1, instruction: 'Use FAST: Face drooping? Arm weakness? Speech difficulty? Time to call 911!' },
      { step: 2, instruction: 'Call emergency services IMMEDIATELY. Time is critical — every minute counts.' },
      { step: 3, instruction: 'Note the exact time symptoms started — tell emergency services.' },
      { step: 4, instruction: 'Keep the person calm and still. Do NOT give food or water.' },
      { step: 5, instruction: 'If conscious, lay them down with head and shoulders slightly raised.' },
      { step: 6, instruction: 'If unconscious and breathing, place in recovery position.' },
      { step: 7, instruction: 'If not breathing, begin CPR.' },
      { step: 8, instruction: 'Do NOT give aspirin unless directed by emergency services.' },
    ],
    warnings: [
      'Do NOT leave the person alone.',
      'Do NOT give food, water, or medication by mouth.',
      'Stroke treatment is time-sensitive — act within 3 hours for best outcomes.',
    ],
  },
  poisoning: {
    category: 'poisoning',
    emoji: '☠️',
    title: 'Poisoning / Overdose',
    urgency: 'critical',
    callEmergency: true,
    steps: [
      { step: 1, instruction: 'Call Poison Control (1-800-222-1222 in US) or emergency services immediately.' },
      { step: 2, instruction: 'Identify the substance if possible — keep the container for emergency responders.' },
      { step: 3, instruction: 'Do NOT induce vomiting unless specifically instructed by Poison Control.' },
      { step: 4, instruction: 'If the person is unconscious but breathing, place in recovery position.' },
      { step: 5, instruction: 'If not breathing, begin CPR.' },
      { step: 6, instruction: 'For skin/eye exposure: flush with large amounts of water for 15–20 minutes.' },
      { step: 7, instruction: 'For inhaled poisons: move to fresh air immediately.' },
    ],
    warnings: [
      'Do NOT give milk, water, or any antidote without professional guidance.',
      'Do NOT leave the person alone.',
      'Bring the substance container to the hospital.',
    ],
  },
};

export function getGuidanceByCategory(categoryId: string): FirstAidGuidance | null {
  return GUIDANCE_MAP[categoryId] || null;
}

export function getGuidanceByKeyword(input: string): FirstAidGuidance | null {
  const lower = input.toLowerCase();
  for (const cat of EMERGENCY_CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return GUIDANCE_MAP[cat.id] || null;
    }
  }
  return null;
}
