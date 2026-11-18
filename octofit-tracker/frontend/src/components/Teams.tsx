import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: unknown[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      responseKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} - ${team.members.length} members`}
    />
  );
}
