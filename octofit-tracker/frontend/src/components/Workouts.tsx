import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason?: string };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      responseKey="suggestions"
      emptyMessage="No workout suggestions yet."
      renderItem={(workout) => workout.reason ? `${workout.title} - ${workout.reason}` : workout.title}
    />
  );
}
