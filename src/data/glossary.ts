export interface GlossaryEntry {
  title: string
  description: string
}

export const glossary = {
  movement: {
    title: 'Movement',
    description:
      'How far the unit can normally move across the battlefield in inches.',
  },
  toughness: {
    title: 'Toughness',
    description:
      'How difficult the unit is to wound. Higher Toughness makes attacks less likely to cause damage.',
  },
  save: {
    title: 'Save',
    description:
      'The dice result usually needed to block an attack after it successfully wounds.',
  },
  wounds: {
    title: 'Wounds',
    description:
      'How much damage a model can take before it is removed from the battlefield.',
  },
  leadership: {
    title: 'Leadership',
    description:
      'How well the unit holds its nerve when it must take a Battle-shock test.',
  },
  objectiveControl: {
    title: 'Objective Control',
    description:
      'How much each model helps its unit control an objective marker.',
  },
  points: {
    title: 'Points',
    description:
      'The army-building cost of including the unit. Larger or stronger units often cost more points.',
  },
  factionType: {
    title: 'Faction type',
    description:
      'A broad group such as Imperium, Chaos, or Xenos that the faction belongs to.',
  },
  keywords: {
    title: 'Keywords',
    description:
      'Tags that identify what a unit is and determine which rules can affect it.',
  },
  abilities: {
    title: 'Abilities',
    description:
      'Special rules that describe what a unit can do beyond its basic stats and weapons.',
  },
  range: {
    title: 'Range',
    description: 'How far away the weapon can target enemies.',
  },
  attacks: {
    title: 'Attacks',
    description: 'How many attacks the weapon makes when it is used.',
  },
  skill: {
    title: 'Skill',
    description: 'The dice roll normally needed to hit with this weapon.',
  },
  strength: {
    title: 'Strength',
    description:
      'How powerful the weapon is when trying to wound its target.',
  },
  armorPenetration: {
    title: 'Armour Penetration',
    description:
      "How much the weapon worsens the target's saving throw.",
  },
  damage: {
    title: 'Damage',
    description: 'How much damage each successful unsaved attack deals.',
  },
} satisfies Record<string, GlossaryEntry>
