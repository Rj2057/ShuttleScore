# Tournament Management System - Complete Documentation

## Overview

This is a comprehensive full-stack tournament management system designed for badminton doubles tournaments with 20 teams progressing through multiple stages.

---

## Tournament Stages

### Stage 1: League Matches (Round 1)
- **Teams:** 20
- **Matches:** 10 (random pairings)
- **Format:** 1 set, 15 points
- **Output:** 10 winners + 10 losers

### Stage 2: Losers Round
- **Teams:** 10 (from losers of Round 1)
- **Matches:** 5 (random pairings)
- **Format:** 1 set, 11 points
- **Output:** 5 winners (rejoin tournament) + 5 eliminated

### Stage 3: Group Stage Formation
- **Total Teams:** 15 (10 from Round 1 + 5 from Losers Round)
- **Groups:** 4 groups with specific composition

#### Group Distribution:
| Group | Winners | Loser Winners | Total |
|-------|---------|---------------|-------|
| A     | 3       | 1             | 4     |
| B     | 3       | 1             | 4     |
| C     | 2       | 2             | 4     |
| D     | 2       | 1             | 3     |

### Stage 4: Group Stage Matches
- **Format:** Round-robin (each team plays every other team)
- **Match Format:** 1 set, 15 points
- **Points System:** Win = 1 point, Loss = 0 points

#### Ranking in Each Group (in order):
1. Total points (matches won)
2. Fair positioning

### Stage 5: Qualification
- **Qualified Teams:** 8 (Top 2 from each group)
- **Knockout Structure:**

#### Quarterfinal Seeding:
```
A1 vs D2  → Winner to SF1
B1 vs C2  → Winner to SF2
C1 vs B2  → Winner to SF3
D1 vs A2  → Winner to SF4
```

#### Semifinals:
```
SF1 Winner vs SF4 Winner  → F1, LS1
SF2 Winner vs SF3 Winner  → F2, LS2
```

#### Final & 3rd Place:
```
F1 vs F2        → Champion
LS1 vs LS2      → 3rd Place
```

---

## Random Generation Details

### Random Number Generator Used
**Fisher-Yates Shuffle Algorithm with Math.random()**

**Implementation:**
```typescript
shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Why This Approach:**
- Ensures uniform randomness (all permutations equally likely)
- O(n) time complexity
- No hardcoded winners - results are fair and unpredictable
- Used for:
  - Initial team pairings (Round 1)
  - Losers round pairings
  - Group assignments (maintaining constraints)
  - Match simulations (random winner from 50-50)

### Seeded Random (Optional)
For reproducibility/testing:
```typescript
const rng = new RandomGenerator(12345); // seed
const shuffled = rng.shuffle(teams);
```

---

## Data Models

### Core Models

#### `Team`
```typescript
{
  id: string;
  name: string;
  players: Player[];  // 2 players per team
  groupId?: string;
  groupPosition?: number;
  status: "active" | "eliminated" | "qualified";
  totalPoints?: number;
  matchesPlayed?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  pointDifference?: number;
}
```

#### `Match`
```typescript
{
  id: string;
  type: MatchType;  // league, loser, group, quarterfinal, etc.
  matchNumber: number;
  team1: Team;
  team2: Team;
  result?: {
    team1Score: number;
    team2Score: number;
    winner: Team;
    loser: Team;
  };
  status: "pending" | "completed" | "cancelled";
  bestOf: number;
  pointsPerSet: number;
}
```

#### `Group`
```typescript
{
  id: string;
  name: "A" | "B" | "C" | "D";
  teams: Team[];
  matches: Match[];
  standings: GroupStanding[];
  roundNumber: number;
}
```

#### `Tournament`
```typescript
{
  id: string;
  name: string;
  teams: Team[];
  initialMatches: Match[];    // League matches
  loserMatches: Match[];       // Losers round
  groups: Group[];
  quarterfinals: Match[];
  semifinals: Match[];
  final: Match[];
  thirdPlace: Match[];
  champion?: Team;
  runner_up?: Team;
  third_place?: Team;
  status: "pending" | "league_active" | "loser_active" | "group_active" | "knockout_active" | "completed";
}
```

---

## API Endpoints

### Tournament Creation & Management
```
POST /api/tournament/create
  Body: { name: string }
  Returns: Tournament summary

GET /api/tournament/[id]
  Returns: Full tournament data with all matches and standings
```

### Tournament Actions
```
POST /api/tournament/[id]
  Body: { action: string }
  
  Actions:
  - "start" → Initialize and generate initial matches
  - "complete_initial" → Simulate all initial matches
  - "progress_to_loser" → Generate losers round matches
  - "complete_loser" → Simulate losers round
  - "progress_to_group" → Form groups and generate group matches
  - "complete_group" → Simulate all group matches
  - "progress_to_knockout" → Generate quarterfinal matches
  - "complete_quarterfinals" → Simulate quarterfinals
  - "progress_to_semifinals" → Generate semifinal matches
  - "complete_semifinals" → Simulate semifinals
  - "progress_to_final" → Generate final and 3rd place matches
  - "complete_final" → Simulate final stage and conclude tournament
```

### Match Score Management
```
POST /api/tournament/[id]/match
  Body: { matchId: string, team1Score: number, team2Score: number }
  Returns: Updated tournament
```

### Standings & Results
```
GET /api/tournament/[id]/standings
  Returns: All group standings

GET /api/tournament/[id]/standings/[group]
  Returns: Specific group standings (A, B, C, or D)

GET /api/tournament/[id]/matches/[type]
  Types: league, loser, group, quarterfinal, semifinal, final
  Returns: Formatted matches of specified type
```

---

## Frontend Components

### `TournamentMatchTable`
Displays matches with:
- Team names and players
- Current scores
- Match status
- Inline score editing
- Save/Cancel functionality

### `GroupStandings`
Displays group standings with:
- Position (with qualification marker ✓ for top 2)
- Team name
- Matches played, wins, losses
- Total points
- Color-coded qualified teams (green background)

### `TournamentPage` (Main Dashboard)
- Tournament status overview
- Control panel for tournament progression
- Stage navigation buttons
- Dynamic content display based on selected stage
- Real-time match score updates

---

## Usage Example

### Programmatic Usage (Backend)
```typescript
import { tournamentService } from '@/lib/tournament/service';

// Create tournament with sample teams
const tournament = tournamentService.createSampleTournament();
const id = tournament.id;

// Progress through stages
tournamentService.startTournament(id);
tournamentService.completeInitialMatches(id);
tournamentService.progressToLoserRound(id);
tournamentService.completeLoserMatches(id);
tournamentService.progressToGroupRound(id);
tournamentService.completeGroupMatches(id);

// Get standings
const standings = tournamentService.getGroupStandings(id, "A");
console.log(standings);

// Progress to knockout stage
tournamentService.progressToKnockout(id);
tournamentService.completeQuarterfinals(id);
tournamentService.progressToSemifinals(id);
tournamentService.completeSemifinals(id);
tournamentService.progressToFinal(id);
tournamentService.completeFinal(id);

// Get tournament stats
const stats = tournamentService.getTournamentStats(id);
console.log(`Champion: ${stats.champion}`);
```

### API Usage (Frontend)
```typescript
// Create tournament
const tourRes = await fetch('/api/tournament', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Tournament' })
});
const { tournament } = await tourRes.json();
const id = tournament.id;

// Progress stages
await fetch(`/api/tournament/${id}`, {
  method: 'POST',
  body: JSON.stringify({ action: 'start' })
});

// Update match score
await fetch(`/api/tournament/${id}/match`, {
  method: 'POST',
  body: JSON.stringify({ matchId: 'M1', team1Score: 15, team2Score: 8 })
});

// Get standings
const standingsRes = await fetch(`/api/tournament/${id}/standings`);
const standings = await standingsRes.json();
```

---

## Key Features

✅ **Strict Tournament Rules:** No hardcoding of winners  
✅ **True Randomness:** Fisher-Yates shuffle with Math.random()  
✅ **Scalable Architecture:** Clean separation of concerns  
✅ **Comprehensive Ranking Logic:** Multiple tiebreaker levels  
✅ **Flexible Match Management:** Manual score entry or simulation  
✅ **Real-time UI Updates:** Live tournament progression visualization  
✅ **Group Stage Constraints:** Automatic distribution of loser round winners  
✅ **Knockout Structure:** Standard badminton tournament format  
✅ **Export Options:** JSON and CSV export formats  

---

## File Structure

```
lib/tournament/
  ├── models.ts         // Data structures and enums
  ├── logic.ts          // Core tournament logic
  ├── service.ts        // Tournament service (singleton)
  ├── format.ts         // Data formatting and export
  └── index.ts          // Central exports

app/api/tournament/
  ├── route.ts                      // Create/get tournament
  ├── [id]/route.ts                 // Tournament actions
  ├── [id]/match/route.ts          // Set match results
  ├── [id]/standings/route.ts      // Get standings
  └── [id]/matches/[type]/route.ts // Get matches by type

app/tournament/
  └── page.tsx          // Main dashboard

components/
  ├── TournamentMatchTable.tsx      // Match display
  └── GroupStandings.tsx            // Standings display
```

---

## Notes

- **Match Simulation:** When using `simulate` endpoints, winners are chosen randomly (50-50 chance)
- **Manual Entry:** Scores can be manually entered via API or UI for actual tournament results
- **Group Assignment:** Teams are randomly assigned to groups while maintaining distribution constraints
- **Head-to-Head:** Calculated from direct match results between teams with ties
- **Performance:** Optimized for 20 teams; scalable to more with configuration changes

---

## Future Enhancements

- [ ] Database persistence (MongoDB)
- [ ] Real-time updates with WebSockets
- [ ] Mobile app
- [ ] Statistical analysis and team rankings
- [ ] Playoff bracket visualization
- [ ] Live scoring with admin panel
- [ ] Team registration and seeding
- [ ] Match venue management
