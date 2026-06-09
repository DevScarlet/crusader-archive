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
} satisfies Record<string, GlossaryEntry>
