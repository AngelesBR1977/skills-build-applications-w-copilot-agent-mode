import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity must be an object');

  const { userId, teamId, type, minutes } = input;
  if (
    !isObjectId(userId) ||
    !isObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes < 1
  ) {
    throw httpError(400, 'Activity requires valid userId, teamId, type, and minutes');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw httpError(404, 'Activity user or team was not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team must be an object');

  const { name, mascot } = input;
  const rawMembers = input.members ?? [];
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(rawMembers) ||
    !rawMembers.every(isObjectId)
  ) {
    throw httpError(400, 'Team requires a name, mascot, and valid member IDs');
  }

  const members = [...new Set(rawMembers)];
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== members.length) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Activity.aggregate<{
    teamName: string;
    totalPoints: number;
  }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const activity = type.toLowerCase();
  if (/(run|cycle|walk|swim|cardio|endurance)/.test(activity)) return 'endurance';
  if (/(strength|weight|resistance|lift)/.test(activity)) return 'strength';
  if (/(yoga|stretch|mobility)/.test(activity)) return 'mobility';
  return activity;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User was not found');

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select({ type: 1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocuses = recentActivities.map(({ type }) => ({
    type,
    focus: focusForActivity(type),
  }));

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const activity = recentFocuses.find((recent) => recent.focus === focus);
      const matchesGoal = focus === goal;
      const reason = matchesGoal
        ? `Recommended because it matches your ${user.fitnessGoal} goal.`
        : activity
          ? `Recommended because your recent ${activity.type} activity matches this focus.`
          : 'Suggested as an additional workout option.';

      return { ...workout, reason, relevance: matchesGoal ? 0 : activity ? 1 : 2 };
    })
    .sort((left, right) => left.relevance - right.relevance || left.title.localeCompare(right.title))
    .map(({ relevance: _relevance, ...workout }) => workout);
}

export { User };
