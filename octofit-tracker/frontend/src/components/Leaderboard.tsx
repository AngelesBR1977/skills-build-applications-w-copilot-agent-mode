import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const loadLeaderboard = () => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
    .then(({ leaderboard }) => leaderboard);

  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      load={loadLeaderboard}
      emptyMessage="No leaderboard rankings yet."
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} - ${entry.totalPoints} points`}
    />
  );
}
