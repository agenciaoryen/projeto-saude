interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const getMessage = () => {
    if (streak === 0) return "Comece hoje! 🌱";
    if (streak < 3) return "Está começando! 🌿";
    if (streak < 7) return "Constância! 🌳";
    if (streak < 14) return "Uma semana! ⭐";
    if (streak < 30) return "Incrível! 💎";
    if (streak < 60) return "1 mês! 🏆";
    return "Lendário! 👑";
  };

  return (
    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/20 rounded-2xl">
      <div className="text-4xl font-bold text-primary">{streak}</div>
      <div className="text-sm text-muted-foreground mt-1">dias consecutivos</div>
      <div className="text-xs text-primary font-medium mt-1">{getMessage()}</div>
    </div>
  );
}
