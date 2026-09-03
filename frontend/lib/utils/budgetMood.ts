export interface BudgetMood {
  emoji: string;
  label: string;
  marathiLabel: string;
  reaction: string;
  badgeClass: string;
  textColor: string;
  barColor: string;
  isOver: boolean;
}

export function getBudgetMood(percentage: number, isOverBudget: boolean): BudgetMood {
  if (isOverBudget || percentage >= 100) {
    return {
      emoji: '😱',
      label: 'Out of Budget!',
      marathiLabel: 'खर्च बजेटबाहेर!',
      reaction: 'Pocket on fire! 💸 थांबवा खर्च!',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse',
      textColor: 'text-rose-400',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      isOver: true,
    };
  }

  if (percentage >= 80) {
    return {
      emoji: '😬',
      label: 'Warning Zone',
      marathiLabel: 'मर्यादेच्या जवळ!',
      reaction: 'Tight budget, watch out!',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      textColor: 'text-amber-400',
      barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      isOver: false,
    };
  }

  if (percentage >= 50) {
    return {
      emoji: '🙂',
      label: 'Balanced Pace',
      marathiLabel: 'मध्यम खर्च',
      reaction: 'Steady and balanced',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      textColor: 'text-sky-400',
      barColor: 'bg-gradient-to-r from-sky-500 to-cyan-400',
      isOver: false,
    };
  }

  return {
    emoji: '😎',
    label: 'Chill Mode',
    marathiLabel: 'मस्त नियोजन!',
    reaction: 'Super savings, great control!',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    textColor: 'text-emerald-400',
    barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    isOver: false,
  };
}
