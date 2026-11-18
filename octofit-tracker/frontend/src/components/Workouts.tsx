import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason?: string };

const userEmail = 'mona@example.com';
const loadSuggestions = () => getJson<{ suggestions: WorkoutSuggestion[] }>(
  `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
).then(({ suggestions }) => suggestions);

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      load={loadSuggestions}
      emptyMessage="No workout suggestions yet."
      renderItem={(workout) => workout.reason ? `${workout.title} - ${workout.reason}` : workout.title}
    />
  );
}
