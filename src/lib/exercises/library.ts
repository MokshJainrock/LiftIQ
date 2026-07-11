// Full exercise library — every loggable exercise in the app, grouped by
// primary muscle and equipment. Camera-trackable movements carry a trackingId
// that maps to an ExerciseConfig for live pose analysis.

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "cardio"
  | "full-body";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "cardio";

export interface LibraryExercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  /** Set when the exercise can be pose-tracked with the camera. */
  trackingId?: string;
  /** Suggested rest between sets, seconds. */
  defaultRestSec: number;
  /** Whether the set editor should ask for a load. */
  isWeighted: boolean;
  /** One-line form cue. */
  cue: string;
}

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "forearms", label: "Forearms" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "full-body", label: "Full Body" },
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight",
  kettlebell: "Kettlebell",
  band: "Band",
  cardio: "Cardio",
};

function ex(
  name: string,
  muscle: MuscleGroup,
  equipment: Equipment,
  cue: string,
  opts?: { trackingId?: string; rest?: number; unweighted?: boolean },
): LibraryExercise {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    muscle,
    equipment,
    trackingId: opts?.trackingId,
    defaultRestSec: opts?.rest ?? (equipment === "bodyweight" || equipment === "cardio" ? 60 : 90),
    isWeighted: !(opts?.unweighted ?? (equipment === "bodyweight" || equipment === "cardio")),
    cue,
  };
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ── Chest ─────────────────────────────────────────────────────
  ex("Bench Press", "chest", "barbell", "Bar to mid-chest, drive feet into the floor.", { rest: 150 }),
  ex("Incline Bench Press", "chest", "barbell", "30-45° bench, touch upper chest.", { rest: 150 }),
  ex("Decline Bench Press", "chest", "barbell", "Lower to the sternum, elbows ~45°.", { rest: 150 }),
  ex("Dumbbell Bench Press", "chest", "dumbbell", "Deep stretch at the bottom, press up and slightly in."),
  ex("Incline Dumbbell Press", "chest", "dumbbell", "Keep wrists stacked over elbows."),
  ex("Dumbbell Fly", "chest", "dumbbell", "Soft elbows, hug-a-tree arc, stop at chest level."),
  ex("Cable Fly", "chest", "cable", "Squeeze the chest, hands meet at midline."),
  ex("Low-to-High Cable Fly", "chest", "cable", "Pulleys low, sweep up to shoulder height."),
  ex("Pec Deck", "chest", "machine", "Elbows slightly below shoulders, controlled squeeze."),
  ex("Machine Chest Press", "chest", "machine", "Shoulder blades pinned back, full lockout."),
  ex("Push-Up", "chest", "bodyweight", "Body in one line, chest to an inch off the floor.", { trackingId: "pushup" }),
  ex("Incline Push-Up", "chest", "bodyweight", "Hands elevated — easier; great for volume."),
  ex("Decline Push-Up", "chest", "bodyweight", "Feet elevated — biases upper chest."),
  ex("Dip (Chest)", "chest", "bodyweight", "Lean forward, elbows flare slightly.", { rest: 90 }),
  ex("Machine Incline Press", "chest", "machine", "Drive up and slightly back, slow negative."),
  ex("Dumbbell Pullover", "chest", "dumbbell", "Big stretch over the head, ribs stay down."),
  ex("Svend Press", "chest", "dumbbell", "Squeeze a plate between palms, press straight out."),
  ex("Banded Chest Press", "chest", "band", "Anchor behind you, press to full lockout."),

  // ── Back ──────────────────────────────────────────────────────
  ex("Deadlift", "back", "barbell", "Brace hard, push the floor away, bar stays close.", { trackingId: "deadlift", rest: 180 }),
  ex("Barbell Row", "back", "barbell", "Hinge ~45°, pull to lower ribs, no torso heave.", { trackingId: "row", rest: 120 }),
  ex("Pendlay Row", "back", "barbell", "Each rep starts dead on the floor, explosive pull.", { rest: 120 }),
  ex("T-Bar Row", "back", "barbell", "Chest up, elbows drive back past the torso.", { rest: 120 }),
  ex("Dumbbell Row", "back", "dumbbell", "Pull the elbow to the hip, not the hand to the chest."),
  ex("Chest-Supported Row", "back", "dumbbell", "Chest on bench kills momentum — strict reps."),
  ex("Seated Cable Row", "back", "cable", "Tall spine, squeeze shoulder blades together."),
  ex("Lat Pulldown", "back", "cable", "Pull to the collarbone, elbows down and back."),
  ex("Straight-Arm Pulldown", "back", "cable", "Arms straight, sweep the bar to the thighs."),
  ex("Pull-Up", "back", "bodyweight", "Full hang to chin over bar, no kipping.", { rest: 120 }),
  ex("Chin-Up", "back", "bodyweight", "Underhand grip — more biceps, same lats.", { rest: 120 }),
  ex("Inverted Row", "back", "bodyweight", "Body rigid, chest to the bar."),
  ex("Machine Row", "back", "machine", "Control the negative for a full stretch."),
  ex("Rack Pull", "back", "barbell", "Pins at knee height, brutal upper-back loader.", { rest: 180 }),
  ex("Single-Arm Lat Pulldown", "back", "cable", "Pull the elbow into the back pocket."),
  ex("Meadows Row", "back", "barbell", "Landmine end, wide elbow, hip-height pull.", { rest: 120 }),
  ex("Renegade Row", "back", "dumbbell", "Plank position, row without rotating the hips."),
  ex("Band Pull-Down", "back", "band", "Anchor high, drive elbows to the ribs."),
  ex("Superman Hold", "back", "bodyweight", "Arms and legs off the floor, squeeze the spine.", { rest: 45 }),
  ex("Seal Row", "back", "barbell", "Lying flat on a high bench — zero momentum.", { rest: 120 }),

  // ── Shoulders ─────────────────────────────────────────────────
  ex("Overhead Press", "shoulders", "barbell", "Squeeze glutes, press in a straight line, head through.", { rest: 150 }),
  ex("Push Press", "shoulders", "barbell", "Small leg drive, lock out overhead.", { rest: 150 }),
  ex("Dumbbell Shoulder Press", "shoulders", "dumbbell", "Elbows under wrists the whole press.", { trackingId: "shoulder-press" }),
  ex("Arnold Press", "shoulders", "dumbbell", "Rotate palms from facing you to facing forward."),
  ex("Lateral Raise", "shoulders", "dumbbell", "Lead with the elbows, stop at shoulder height.", { trackingId: "lateral-raise" }),
  ex("Cable Lateral Raise", "shoulders", "cable", "Constant tension — slow on the way down."),
  ex("Front Raise", "shoulders", "dumbbell", "Raise to eye level, no body swing."),
  ex("Rear Delt Fly", "shoulders", "dumbbell", "Hinge over, swing arms wide like wings."),
  ex("Face Pull", "shoulders", "cable", "Pull to the forehead, thumbs point behind you."),
  ex("Machine Shoulder Press", "shoulders", "machine", "Seat height so handles start at ear level."),
  ex("Upright Row", "shoulders", "barbell", "Wide grip, pull to chest height — not higher."),
  ex("Pike Push-Up", "shoulders", "bodyweight", "Hips high, head travels toward the floor."),
  ex("Cable Rear Delt Fly", "shoulders", "cable", "Cross the cables, pull wide and back."),
  ex("Landmine Press", "shoulders", "barbell", "One arm, press up and forward along the bar.", { rest: 90 }),
  ex("Dumbbell Y-Raise", "shoulders", "dumbbell", "Raise into a Y — lower traps love it."),
  ex("Plate Front Raise", "shoulders", "dumbbell", "Hold a plate at 9 and 3, raise to eye level."),
  ex("Handstand Push-Up", "shoulders", "bodyweight", "Kick up to a wall, head to floor and press.", { rest: 120 }),

  // ── Biceps ────────────────────────────────────────────────────
  ex("Barbell Curl", "biceps", "barbell", "Elbows pinned to your sides, full extension."),
  ex("Dumbbell Curl", "biceps", "dumbbell", "Supinate as you lift; no shoulder swing.", { trackingId: "bicep-curl" }),
  ex("Hammer Curl", "biceps", "dumbbell", "Neutral grip — hits brachialis and forearms."),
  ex("Incline Dumbbell Curl", "biceps", "dumbbell", "Arms hang behind torso for a long stretch."),
  ex("Preacher Curl", "biceps", "barbell", "Armpits over the pad, no bounce at the bottom."),
  ex("Cable Curl", "biceps", "cable", "Constant tension top to bottom."),
  ex("Concentration Curl", "biceps", "dumbbell", "Elbow braced on the thigh, peak squeeze."),
  ex("EZ-Bar Curl", "biceps", "barbell", "Angled grip is easier on the wrists."),
  ex("Spider Curl", "biceps", "dumbbell", "Chest on an incline bench, arms hang straight down."),
  ex("Zottman Curl", "biceps", "dumbbell", "Curl palms-up, rotate, lower palms-down."),
  ex("Rope Hammer Curl", "biceps", "cable", "Neutral rope grip, elbows pinned."),
  ex("Band Curl", "biceps", "band", "Stand on the band, curl against rising tension."),

  // ── Triceps ───────────────────────────────────────────────────
  ex("Close-Grip Bench Press", "triceps", "barbell", "Hands shoulder-width, elbows tucked.", { rest: 120 }),
  ex("Skull Crusher", "triceps", "barbell", "Lower to the forehead, elbows stay in."),
  ex("Tricep Pushdown", "triceps", "cable", "Elbows glued to sides, full lockout.", { trackingId: "tricep-extension" }),
  ex("Overhead Tricep Extension", "triceps", "dumbbell", "Big stretch behind the head."),
  ex("Cable Overhead Extension", "triceps", "cable", "Face away from the stack, extend forward."),
  ex("Dip (Triceps)", "triceps", "bodyweight", "Stay upright, elbows track straight back.", { trackingId: "tricep-dip", rest: 90 }),
  ex("Bench Dip", "triceps", "bodyweight", "Hands on a bench behind you, knees bent to scale."),
  ex("Diamond Push-Up", "triceps", "bodyweight", "Hands form a diamond under the chest."),
  ex("Rope Pushdown", "triceps", "cable", "Split the rope at the bottom, full extension."),
  ex("Tricep Kickback", "triceps", "dumbbell", "Upper arm parallel to the floor, extend back."),
  ex("Machine Tricep Extension", "triceps", "machine", "Elbows on the pad, press to lockout."),

  // ── Forearms ──────────────────────────────────────────────────
  ex("Wrist Curl", "forearms", "dumbbell", "Forearms on thighs, curl with wrists only."),
  ex("Reverse Wrist Curl", "forearms", "dumbbell", "Palms down — builds the extensors."),
  ex("Reverse Curl", "forearms", "barbell", "Overhand grip curl, wrists straight."),
  ex("Farmer Walk", "forearms", "dumbbell", "Heavy, tall posture, walk steady.", { rest: 120 }),
  ex("Dead Hang", "forearms", "bodyweight", "Hang from the bar, shoulders packed."),
  ex("Plate Pinch Hold", "forearms", "dumbbell", "Pinch plates smooth-side out, hold for time."),
  ex("Behind-the-Back Wrist Curl", "forearms", "barbell", "Bar behind you, curl with the wrists."),

  // ── Quads ─────────────────────────────────────────────────────
  ex("Back Squat", "quads", "barbell", "Brace, sit between your heels, drive up.", { rest: 180 }),
  ex("Front Squat", "quads", "barbell", "Elbows high, stay upright.", { rest: 180 }),
  ex("Bodyweight Squat", "quads", "bodyweight", "Hips below parallel, chest tall.", { trackingId: "squat" }),
  ex("Goblet Squat", "quads", "dumbbell", "Hold at the chest, elbows inside knees."),
  ex("Leg Press", "quads", "machine", "Full depth without the hips rolling off the pad.", { rest: 120 }),
  ex("Hack Squat", "quads", "machine", "Back flat on the pad, knees track over toes.", { rest: 150 }),
  ex("Bulgarian Split Squat", "quads", "dumbbell", "Rear foot on bench, drop straight down.", { rest: 90 }),
  ex("Lunge", "quads", "bodyweight", "Step long, both knees to ~90°.", { trackingId: "lunge" }),
  ex("Walking Lunge", "quads", "dumbbell", "Continuous steps, torso upright."),
  ex("Leg Extension", "quads", "machine", "Pause one second at the top."),
  ex("Step-Up", "quads", "dumbbell", "Drive through the top heel, don't push off the back leg."),
  ex("Wall Sit", "quads", "bodyweight", "Thighs parallel, hold and breathe.", { rest: 60 }),
  ex("Reverse Lunge", "quads", "dumbbell", "Step back, knee kisses the floor."),
  ex("Jump Squat", "quads", "bodyweight", "Explode up, land soft into the next rep."),
  ex("Pistol Squat", "quads", "bodyweight", "One leg, heel stays down — hold a counterweight to scale.", { rest: 90 }),
  ex("Sissy Squat", "quads", "bodyweight", "Knees travel far forward, lean back in one line.", { rest: 90 }),

  // ── Hamstrings ────────────────────────────────────────────────
  ex("Romanian Deadlift", "hamstrings", "barbell", "Soft knees, push hips back until you feel the stretch.", { rest: 150 }),
  ex("Stiff-Leg Deadlift", "hamstrings", "barbell", "Straighter knees than RDL, lighter load.", { rest: 150 }),
  ex("Dumbbell RDL", "hamstrings", "dumbbell", "Dumbbells slide down the thighs, flat back."),
  ex("Lying Leg Curl", "hamstrings", "machine", "Hips stay pinned to the bench."),
  ex("Seated Leg Curl", "hamstrings", "machine", "Bigger stretch than lying — control it."),
  ex("Nordic Curl", "hamstrings", "bodyweight", "Lower as slow as possible, catch with hands.", { rest: 120 }),
  ex("Good Morning", "hamstrings", "barbell", "Bar on the back, hinge until torso near parallel.", { rest: 120 }),
  ex("Glute-Ham Raise", "hamstrings", "bodyweight", "Knees to hips in one line at the top.", { rest: 90 }),
  ex("Single-Leg RDL", "hamstrings", "dumbbell", "Hinge on one leg, hips stay square."),
  ex("Back Extension", "hamstrings", "machine", "Hinge at the hips, squeeze glutes at the top."),
  ex("Banded Leg Curl", "hamstrings", "band", "Anchor low, curl the heel to the glute."),

  // ── Glutes ────────────────────────────────────────────────────
  ex("Hip Thrust", "glutes", "barbell", "Chin tucked, squeeze hard, full lockout.", { rest: 120 }),
  ex("Glute Bridge", "glutes", "bodyweight", "Drive through the heels, pause at the top.", { trackingId: "glute-bridge" }),
  ex("Cable Kickback", "glutes", "cable", "Kick back and slightly up, no back arch."),
  ex("Cable Pull-Through", "glutes", "cable", "Face away, hinge, snap the hips through."),
  ex("Sumo Deadlift", "glutes", "barbell", "Wide stance, knees out, vertical torso.", { rest: 180 }),
  ex("Curtsy Lunge", "glutes", "dumbbell", "Step behind and across, knee tracks the toe."),
  ex("Hip Abduction", "glutes", "machine", "Lean slightly forward, push knees apart."),
  ex("Frog Pump", "glutes", "bodyweight", "Soles together, pump the hips up."),
  ex("Single-Leg Hip Thrust", "glutes", "bodyweight", "One foot down, full lockout, no hip drop."),
  ex("Donkey Kick", "glutes", "bodyweight", "On all fours, drive the heel to the ceiling."),
  ex("Banded Lateral Walk", "glutes", "band", "Band above knees, stay low, step wide."),
  ex("Reverse Hyperextension", "glutes", "machine", "Legs swing up behind you, pause at the top."),

  // ── Calves ────────────────────────────────────────────────────
  ex("Standing Calf Raise", "calves", "machine", "Full stretch at the bottom, pause at the top.", { rest: 60 }),
  ex("Seated Calf Raise", "calves", "machine", "Bent knee biases the soleus.", { rest: 60 }),
  ex("Single-Leg Calf Raise", "calves", "bodyweight", "On a step, full range, hold something to balance."),
  ex("Donkey Calf Raise", "calves", "machine", "Hips hinged — bigger gastroc stretch.", { rest: 60 }),
  ex("Leg Press Calf Raise", "calves", "machine", "Balls of feet on the platform edge, full stretch.", { rest: 60 }),
  ex("Tibialis Raise", "calves", "bodyweight", "Heels on a step, lift the toes — bulletproof shins.", { rest: 45 }),

  // ── Core ──────────────────────────────────────────────────────
  ex("Plank", "core", "bodyweight", "Squeeze glutes, ribs down, one straight line.", { trackingId: "plank", rest: 60 }),
  ex("Side Plank", "core", "bodyweight", "Stack feet, hips high.", { rest: 60 }),
  ex("Sit-Up", "core", "bodyweight", "Curl up vertebra by vertebra.", { trackingId: "situp" }),
  ex("Crunch", "core", "bodyweight", "Shoulder blades off the floor, exhale at the top."),
  ex("Bicycle Crunch", "core", "bodyweight", "Opposite elbow to knee, slow and controlled."),
  ex("Russian Twist", "core", "bodyweight", "Lean back 45°, rotate from the ribs."),
  ex("Hanging Leg Raise", "core", "bodyweight", "Pelvis tucks at the top, no swing.", { rest: 90 }),
  ex("Hanging Knee Raise", "core", "bodyweight", "Knees to chest, control the descent."),
  ex("Ab Wheel Rollout", "core", "bodyweight", "Hips locked, roll only as far as you can hold.", { rest: 90 }),
  ex("Cable Crunch", "core", "cable", "Kneel, crunch ribs to pelvis — not arms pulling."),
  ex("Cable Woodchopper", "core", "cable", "Rotate through the torso, arms stay long."),
  ex("Dead Bug", "core", "bodyweight", "Lower back glued to the floor."),
  ex("Mountain Climber", "core", "bodyweight", "Hips level, fast knees.", { trackingId: "mountain-climber" }),
  ex("Flutter Kick", "core", "bodyweight", "Legs straight, low back stays down."),
  ex("V-Up", "core", "bodyweight", "Hands meet feet over the hips."),
  ex("Leg Raise", "core", "bodyweight", "Lying flat, heels to the ceiling."),
  ex("Hollow Body Hold", "core", "bodyweight", "Low back pressed down, arms and legs long.", { rest: 60 }),
  ex("Pallof Press", "core", "cable", "Press out and resist the rotation."),
  ex("Suitcase Carry", "core", "dumbbell", "Heavy on one side, walk perfectly upright.", { rest: 90 }),
  ex("Toes to Bar", "core", "bodyweight", "Hang, sweep toes up to the bar.", { rest: 90 }),
  ex("Plank Shoulder Tap", "core", "bodyweight", "Tap opposite shoulder, hips don't sway."),
  ex("Bird Dog", "core", "bodyweight", "Opposite arm and leg out, slow and square."),
  ex("Copenhagen Plank", "core", "bodyweight", "Top foot on a bench — side plank for adductors.", { rest: 60 }),

  // ── Cardio / conditioning ─────────────────────────────────────
  ex("Jumping Jack", "cardio", "bodyweight", "Light on the feet, full arm swing.", { trackingId: "jumping-jack" }),
  ex("Burpee", "cardio", "bodyweight", "Chest to floor, jump tall.", { trackingId: "burpee" }),
  ex("High Knees", "cardio", "bodyweight", "Knees to hip height, quick turnover."),
  ex("Jump Rope", "cardio", "cardio", "Small hops, wrists do the work."),
  ex("Box Jump", "cardio", "bodyweight", "Land soft, stand fully, step down.", { rest: 90 }),
  ex("Rowing Machine", "cardio", "cardio", "Legs-back-arms, then arms-back-legs."),
  ex("Assault Bike", "cardio", "cardio", "Push and pull — full body sprint."),
  ex("Treadmill Run", "cardio", "cardio", "Track minutes as reps if you like."),
  ex("Stair Climber", "cardio", "cardio", "Stand tall, light grip on the rails."),
  ex("Sprint Interval", "cardio", "bodyweight", "All-out effort, full recovery between."),
  ex("Cycling", "cardio", "cardio", "Steady cadence, log minutes as reps."),
  ex("Elliptical", "cardio", "cardio", "Push and pull the handles — full body, low impact."),
  ex("Swimming", "cardio", "cardio", "Log laps as reps, any stroke counts."),
  ex("Incline Walk", "cardio", "cardio", "10-15% incline, brisk pace, no holding on."),
  ex("Ski Erg", "cardio", "cardio", "Long pulls from the lats, hinge with each stroke."),
  ex("Shadow Boxing", "cardio", "bodyweight", "Stay on your toes, snap the punches back."),
  ex("Bear Crawl", "cardio", "bodyweight", "Knees an inch off the floor, opposite limbs move."),
  ex("Shuttle Run", "cardio", "bodyweight", "Touch the line, explode out of the turn."),

  // ── Full body ─────────────────────────────────────────────────
  ex("Kettlebell Swing", "full-body", "kettlebell", "Hinge, snap the hips — arms are just ropes.", { rest: 90 }),
  ex("Kettlebell Clean & Press", "full-body", "kettlebell", "Smooth clean to rack, strict press.", { rest: 120 }),
  ex("Kettlebell Goblet Carry", "full-body", "kettlebell", "Hold at chest, walk tall.", { rest: 90 }),
  ex("Clean & Jerk", "full-body", "barbell", "Explosive pull, fast elbows, drive overhead.", { rest: 180 }),
  ex("Snatch", "full-body", "barbell", "Bar stays close, punch up into the catch.", { rest: 180 }),
  ex("Thruster", "full-body", "barbell", "Front squat straight into an overhead press.", { rest: 120 }),
  ex("Man Maker", "full-body", "dumbbell", "Push-up, row each side, clean, press.", { rest: 120 }),
  ex("Turkish Get-Up", "full-body", "kettlebell", "Eyes on the bell the whole way up.", { rest: 120 }),
  ex("Sled Push", "full-body", "machine", "Low body angle, drive with the legs.", { rest: 120 }),
  ex("Battle Ropes", "full-body", "cardio", "Big waves, athletic stance."),
  ex("Band Pull-Apart", "full-body", "band", "Arms straight, pull to the chest.", { rest: 45 }),
  ex("Resistance Band Row", "full-body", "band", "Anchor at chest height, squeeze the blades."),
  ex("Wall Ball", "full-body", "dumbbell", "Squat, drive up, throw to the target.", { rest: 90 }),
  ex("Dumbbell Snatch", "full-body", "dumbbell", "One pull, punch the bell overhead.", { rest: 120 }),
  ex("Devil Press", "full-body", "dumbbell", "Burpee with dumbbells straight into a double snatch.", { rest: 120 }),
  ex("Overhead Carry", "full-body", "kettlebell", "Lock the elbow, ribs down, walk tall.", { rest: 90 }),
  ex("Kettlebell Windmill", "full-body", "kettlebell", "Bell overhead, hinge sideways, eyes on the bell.", { rest: 90 }),
];

/** Visual identity per muscle group — used for the exercise icon tiles. */
export const MUSCLE_VISUALS: Record<MuscleGroup, { emoji: string; gradient: string }> = {
  chest: { emoji: "🏋️", gradient: "from-rose-500/25 to-orange-500/15" },
  back: { emoji: "🦾", gradient: "from-blue-500/25 to-indigo-500/15" },
  shoulders: { emoji: "🤸", gradient: "from-amber-500/25 to-yellow-500/15" },
  biceps: { emoji: "💪", gradient: "from-violet-500/25 to-purple-500/15" },
  triceps: { emoji: "🔱", gradient: "from-fuchsia-500/25 to-pink-500/15" },
  forearms: { emoji: "✊", gradient: "from-stone-500/25 to-zinc-500/15" },
  quads: { emoji: "🦵", gradient: "from-emerald-500/25 to-green-500/15" },
  hamstrings: { emoji: "🦿", gradient: "from-teal-500/25 to-emerald-500/15" },
  glutes: { emoji: "🍑", gradient: "from-orange-500/25 to-amber-500/15" },
  calves: { emoji: "🦶", gradient: "from-lime-500/25 to-green-500/15" },
  core: { emoji: "🧱", gradient: "from-cyan-500/25 to-sky-500/15" },
  cardio: { emoji: "🏃", gradient: "from-red-500/25 to-rose-500/15" },
  "full-body": { emoji: "🔥", gradient: "from-yellow-500/25 to-red-500/15" },
};

const byId = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));
const byName = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e]));
const byTrackingId = new Map(
  EXERCISE_LIBRARY.filter((e) => e.trackingId).map((e) => [e.trackingId!, e]),
);

/** Look up by a session's exercise key (trackingId for camera moves, else library id). */
export function findLibraryByKey(key: string): LibraryExercise | undefined {
  return byTrackingId.get(key) ?? byId.get(key);
}

export function getLibraryExercise(id: string): LibraryExercise | undefined {
  return byId.get(id);
}

export function findLibraryExerciseByName(name: string): LibraryExercise | undefined {
  return byName.get(name.trim().toLowerCase());
}

export function searchLibrary(query: string, muscle?: MuscleGroup | "all", equipment?: Equipment | "all"): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  return EXERCISE_LIBRARY.filter((e) => {
    if (muscle && muscle !== "all" && e.muscle !== muscle) return false;
    if (equipment && equipment !== "all" && e.equipment !== equipment) return false;
    if (q && !e.name.toLowerCase().includes(q) && !e.muscle.includes(q) && !e.equipment.includes(q)) return false;
    return true;
  });
}
