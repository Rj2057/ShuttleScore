"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Team } from "@/types/database";

export interface MatchWithTeams extends Match {
  team1?: Team | null;
  team2?: Team | null;
  winner?: Team | null;
}

export function useRealtimeMatches(tournamentId: string | null) {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!tournamentId) {
      setMatches([]);
      setTeams({});
      setLoading(false);
      return;
    }
    const client = createClient();
    let teamsCache: Record<string, Team> = {};

    const mapTeams = (teamsData: Team[] | null) => {
      const teamsMap: Record<string, Team> = {};
      (teamsData || []).forEach((t) => {
        teamsMap[t.id] = t;
      });
      return teamsMap;
    };

    const enrichMatches = (matchesData: Match[] | null, teamsMap: Record<string, Team>) => {
      const enriched: MatchWithTeams[] = (matchesData || []).map((m) => ({
        ...m,
        team1: m.team1_id ? teamsMap[m.team1_id] : null,
        team2: m.team2_id ? teamsMap[m.team2_id] : null,
        winner: m.winner_id ? teamsMap[m.winner_id] : null,
      }));

      return enriched;
    };

    async function fetchInitial() {
      const { data: teamsData } = await client.from("teams").select("*");
      const teamsMap = mapTeams(teamsData || null);
      teamsCache = teamsMap;

      const { data: matchesData } = await client
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("sort_order", { ascending: true });

      const enriched = enrichMatches(matchesData || null, teamsMap);

      setMatches(enriched);
      setTeams(teamsMap);
      setLoading(false);
    }

    async function fetchMatchesOnly() {
      const { data } = await client
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("sort_order", { ascending: true });

      setMatches(enrichMatches(data || null, teamsCache));
    }

    async function refreshTeamsOnly() {
      const { data: teamsData } = await client.from("teams").select("*");
      const nextTeams = mapTeams(teamsData || null);
      teamsCache = nextTeams;
      setTeams(nextTeams);
      setMatches((current) => enrichMatches(current, nextTeams));
    }

    setLoading(true);
    fetchInitial();

    const channel = client
      .channel(`matches-changes-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async () => {
          await fetchMatchesOnly();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        async () => {
          await refreshTeamsOnly();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [tournamentId, refreshKey]);

  return {
    matches,
    teams,
    loading,
    refreshMatches: () => setRefreshKey((current) => current + 1),
  };
}
