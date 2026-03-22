#!/usr/bin/env node

/**
 * TOURNAMENT SYSTEM - FILE NAVIGATION GUIDE
 * 
 * Use this file to understand the structure and navigate project files
 */

const STRUCTURE = {
  "📚 DOCUMENTATION FILES": {
    "BUILD_SUMMARY.md": {
      description: "Complete project summary - START HERE",
      contains: [
        "Project overview",
        "All 15 files created",
        "Requirements checklist",
        "Random generator explanation",
        "Getting started guide",
        "API reference",
        "Feature list",
      ],
    },
    "TOURNAMENT_SYSTEM.md": {
      description:
        "Complete technical documentation - Detailed reference for developers",
      contains: [
        "All tournament stages explained",
        "Random generator algorithms",
        "Data models (Team, Match, Group, Tournament)",
        "Complete API endpoints",
        "Frontend components",
        "Usage examples",
        "File structure",
        "Future enhancements",
      ],
    },
    "QUICK_START.md": {
      description: "Get started immediately - Fastest path to running tournaments",
      contains: [
        "3-step quick start",
        "API access examples",
        "Common tasks",
        "Tournament flowchart",
        "Random generator explanation",
        "Key features",
        "File structure",
      ],
    },
    "TOURNAMENT_EXAMPLES.ts": {
      description:
        "6 complete working examples - Copy and adapt for your needs",
      contains: [
        "Complete tournament example",
        "Manual scoring example",
        "Data export example",
        "Statistics example",
        "Random group assignment demo",
        "Head-to-head tiebreaker demo",
      ],
    },
  },

  "⚙️ CORE LOGIC (lib/tournament/)": {
    "models.ts": {
      description: "Data structures and type definitions",
      exports: [
        "MatchStatus enum",
        "MatchType enum",
        "Team interface",
        "Match interface",
        "Group interface",
        "Tournament interface",
        "TournamentConfig",
        "RandomGenerator class",
      ],
      useWhen: "Understanding data structures or defining new types",
    },
    "logic.ts": {
      description: "Core tournament algorithms",
      exports: [
        "RandomGenerator class",
        "createTeam()",
        "generateInitialMatches()",
        "extractWinnersAndLosers()",
        "generateLoserMatches()",
        "simulateMatch()",
        "formGroups()",
        "generateGroupMatches()",
        "calculateGroupStandings()",
        "generateQuarterfinals()",
        "generateSemifinals()",
        "generateFinalStage()",
      ],
      useWhen: "Implementing tournament algorithms or custom logic",
    },
    "service.ts": {
      description: "Tournament management service",
      exports: ["TournamentService class"],
      methods: [
        "createNewTournament()",
        "getTournament()",
        "startTournament()",
        "completeInitialMatches()",
        "setMatchResult()",
        "progressToLoserRound()",
        "progressToGroupRound()",
        "progressToKnockout()",
        "getTournamentStats()",
      ],
      useWhen: "Managing tournament state and progression",
    },
    "format.ts": {
      description: "Data formatting and export utilities",
      exports: [
        "formatMatch()",
        "formatGroupStandings()",
        "getTournamentSummary()",
        "getFormattedLeagueMatches()",
        "getFormattedGroupMatches()",
        "getFormattedQuarterfinals()",
        "exportTournamentAsJSON()",
        "exportTournamentAsCSV()",
      ],
      useWhen: "Formatting data for display or export",
    },
    "index.ts": {
      description: "Central export file",
      usage: "import { Tournament, TournamentService } from '@/lib/tournament'",
      useWhen: "Always - use this for all tournament imports",
    },
  },

  "🌐 API ROUTES (app/api/tournament/)": {
    "route.ts": {
      path: "app/api/tournament/route.ts",
      endpoints: ["POST /api/tournament", "GET /api/tournament/[id]"],
      methods: {
        POST: {
          description: "Create new tournament",
          bodyRequired: { name: "string" },
          returns: "Tournament summary",
        },
        GET: {
          description: "Get tournament details",
          params: ["id"],
          returns: "Full tournament data",
        },
      },
    },
    "[id]/route.ts": {
      path: "app/api/tournament/[id]/route.ts",
      endpoint: "POST /api/tournament/[id]",
      description: "Execute tournament actions",
      validActions: [
        "start",
        "complete_initial",
        "progress_to_loser",
        "complete_loser",
        "progress_to_group",
        "complete_group",
        "progress_to_knockout",
        "complete_quarterfinals",
        "progress_to_semifinals",
        "complete_semifinals",
        "progress_to_final",
        "complete_final",
      ],
    },
    "[id]/match/route.ts": {
      path: "app/api/tournament/[id]/match/route.ts",
      endpoint: "POST /api/tournament/[id]/match",
      description: "Set match result",
      body: {
        matchId: "string",
        team1Score: "number",
        team2Score: "number",
      },
    },
    "[id]/standings/route.ts": {
      path: "app/api/tournament/[id]/standings/route.ts",
      endpoints: [
        "GET /api/tournament/[id]/standings",
        "GET /api/tournament/[id]/standings/[group]",
      ],
      description: "Get group standings",
      params: ["id", "group (optional: A, B, C, or D)"],
    },
    "[id]/matches/[type]/route.ts": {
      path: "app/api/tournament/[id]/matches/[type]/route.ts",
      endpoint: "GET /api/tournament/[id]/matches/[type]",
      description: "Get matches by type",
      types: ["league", "loser", "group", "quarterfinal", "semifinal", "final"],
    },
  },

  "🎨 UI COMPONENTS": {
    "TournamentMatchTable.tsx": {
      path: "components/TournamentMatchTable.tsx",
      description: "Display and edit match scores",
      props: {
        matches: "Match[]",
        title: "string",
        onMatchUpdate: "(matchId, team1Score, team2Score) => void",
      },
      features: [
        "Display team names and players",
        "Show current scores",
        "Inline score editor",
        "Save/Cancel functionality",
      ],
    },
    "GroupStandings.tsx": {
      path: "components/GroupStandings.tsx",
      description: "Display group standings and rankings",
      props: {
        group: "string (A, B, C, or D)",
        standings: "Standing[]",
      },
      features: [
        "Rank teams by position",
        "Show qualification status (top 2)",
        "Display win/loss record",
        "Show point statistics",
        "Color-coded qualified teams",
      ],
    },
    "Main Dashboard": {
      path: "app/tournament/page.tsx",
      description: "Complete tournament dashboard",
      features: [
        "Tournament info header",
        "Control panel for progression",
        "Stage navigation",
        "Dynamic content display",
        "Real-time updates",
      ],
      access: "http://localhost:3000/tournament",
    },
  },

  "📊 EXAMPLE TOURNAMENT FLOW": {
    "Stage 1 - League": {
      matches: 10,
      format: "15 points, 1 set",
      teams: "20 → 10 winners + 10 losers",
      randomization: "Fisher-Yates shuffle for pairings",
    },
    "Stage 2 - Losers": {
      matches: 5,
      format: "11 points, 1 set",
      teams: "10 losers → 5 winners (rejoin) + 5 (eliminated)",
      randomization: "Fisher-Yates shuffle for pairings",
    },
    "Stage 3 - Groups": {
      groups: 4,
      distribution: {
        "Group A": "3 winners + 1 loser winner (4 teams)",
        "Group B": "3 winners + 1 loser winner (4 teams)",
        "Group C": "2 winners + 2 loser winners (4 teams)",
        "Group D": "2 winners + 1 loser winner (3 teams)",
      },
      format: "Round-robin, 15 points per match",
      randomization: "Random team assignment (constrained)",
    },
    "Stage 4 - Knockout": {
      qualified: "Top 2 from each group (8 teams)",
      quarterfinals: [
        "A1 vs D2",
        "B1 vs C2",
        "C1 vs B2",
        "D1 vs A2",
      ],
      semifinals: [
        "QF1 winner vs QF4 winner",
        "QF2 winner vs QF3 winner",
      ],
      final: "SF1 winner vs SF2 winner",
      thirdPlace: "SF1 loser vs SF2 loser",
    },
  },

  "🔗 QUICK NAVIGATION": {
    "I want to...": {
      "...start a tournament": [
        "1. Read: QUICK_START.md",
        "2. Visit: /tournament (dashboard)",
        "3. Click: 'Start Tournament'",
      ],
      "...understand the system": [
        "1. Read: BUILD_SUMMARY.md (overview)",
        "2. Read: TOURNAMENT_SYSTEM.md (detailed)",
        "3. Check: TOURNAMENT_EXAMPLES.ts (code samples)",
      ],
      "...use the API": [
        "1. Read: TOURNAMENT_SYSTEM.md → API Endpoints section",
        "2. Check: app/api/tournament/* (endpoint files)",
        "3. Use: TOURNAMENT_EXAMPLES.ts (API examples)",
      ],
      "...modify the logic": [
        "1. Check: lib/tournament/logic.ts (algorithms)",
        "2. See: TOURNAMENT_EXAMPLES.ts (usage patterns)",
        "3. Test: Use dashboard or API to verify changes",
      ],
      "...export tournament data": [
        "1. Use: lib/tournament/format.ts",
        "2. Call: exportTournamentAsJSON() or exportTournamentAsCSV()",
        "3. See: TOURNAMENT_EXAMPLES.ts → exportDataExample()",
      ],
      "...understand random generation": [
        "1. Read: TOURNAMENT_SYSTEM.md → Random Generation",
        "2. See: lib/tournament/logic.ts → RandomGenerator class",
        "3. Check: QUICK_START.md → Random Number Generator section",
      ],
    },
  },

  "🎯 RECOMMENDED READING ORDER": {
    "First Time Users": [
      "1. BUILD_SUMMARY.md - Get the big picture (10 min)",
      "2. QUICK_START.md - Understand the flow (5 min)",
      "3. /tournament - Use the dashboard (5 min)",
      "4. TOURNAMENT_EXAMPLES.ts - See code (10 min)",
    ],
    "Developers": [
      "1. BUILD_SUMMARY.md - Overview (10 min)",
      "2. TOURNAMENT_SYSTEM.md - Complete spec (20 min)",
      "3. lib/tournament/models.ts - Data structures (5 min)",
      "4. lib/tournament/logic.ts - Algorithms (15 min)",
      "5. lib/tournament/service.ts - API (10 min)",
      "6. TOURNAMENT_EXAMPLES.ts - Patterns (15 min)",
    ],
    "API Integrators": [
      "1. QUICK_START.md - Overview (5 min)",
      "2. TOURNAMENT_SYSTEM.md - API Endpoints (10 min)",
      "3. app/api/tournament/* - Endpoint code (10 min)",
      "4. TOURNAMENT_EXAMPLES.ts - API examples (10 min)",
    ],
  },

  "📁 COMPLETE FILE LIST": {
    documentation: [
      "BUILD_SUMMARY.md",
      "TOURNAMENT_SYSTEM.md",
      "QUICK_START.md",
      "TOURNAMENT_EXAMPLES.ts",
      "FILE_NAVIGATION.md (this file)",
    ],
    coreLogic: [
      "lib/tournament/models.ts",
      "lib/tournament/logic.ts",
      "lib/tournament/service.ts",
      "lib/tournament/format.ts",
      "lib/tournament/index.ts",
    ],
    api: [
      "app/api/tournament/route.ts",
      "app/api/tournament/[id]/route.ts",
      "app/api/tournament/[id]/match/route.ts",
      "app/api/tournament/[id]/standings/route.ts",
      "app/api/tournament/[id]/matches/[type]/route.ts",
    ],
    ui: [
      "components/TournamentMatchTable.tsx",
      "components/GroupStandings.tsx",
      "app/tournament/page.tsx",
    ],
  },
};

// Pretty print the structure
function printGuide() {
  const guides = STRUCTURE as Record<string, any>;

  for (const [section, content] of Object.entries(guides)) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`${section}`);
    console.log("=".repeat(70));

    if (typeof content === "object" && !Array.isArray(content)) {
      for (const [key, details] of Object.entries(content)) {
        if (typeof details === "string") {
          console.log(`\n  📄 ${key}\n     ${details}`);
        } else if (typeof details === "object") {
          console.log(`\n  📄 ${key}`);
          for (const [k, v] of Object.entries(details)) {
            if (k === "features" && Array.isArray(v)) {
              console.log(`     Features:`);
              (v as string[]).forEach((f) => console.log(`       • ${f}`));
            } else if (k === "contains" && Array.isArray(v)) {
              console.log(`     Contains:`);
              (v as string[]).forEach((f) => console.log(`       • ${f}`));
            } else if (k === "exports" && Array.isArray(v)) {
              console.log(`     Exports:`);
              (v as string[]).forEach((f) => console.log(`       • ${f}`));
            } else if (k === "methods" && Array.isArray(v)) {
              console.log(`     Methods:`);
              (v as string[]).forEach((f) => console.log(`       • ${f}`));
            } else if (k === "endpoints" && Array.isArray(v)) {
              console.log(`     Endpoints:`);
              (v as string[]).forEach((f) => console.log(`       • ${f}`));
            } else if (k === "description" || k === "path") {
              // These are handled separately
            } else if (typeof v === "string" || typeof v === "object") {
              console.log(`     ${k}: ${JSON.stringify(v, null, 2).replace(/\n/g, "\n                ")}`);
            } else {
              console.log(`     ${k}: ${v}`);
            }
          }
        }
      }
    }
  }

  console.log(`\n${"=".repeat(70)}\n`);
  console.log("✓ Navigation guide complete. Refer back to this file anytime!");
  console.log("Start with: BUILD_SUMMARY.md\n");
}

export { STRUCTURE, printGuide };

if (require.main === module) {
  printGuide();
}
