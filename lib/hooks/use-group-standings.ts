"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group, GroupStanding } from "@/types/database";

export function useGroupStandings(tournamentId: string | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [standingsByGroup, setStandingsByGroup] = useState<Record<string, GroupStanding[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setGroups([]);
      setStandingsByGroup({});
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let active = true;

    async function fetchAll() {
      setLoading(true);

      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("name", { ascending: true });

      if (!active) {
        return;
      }

      const nextGroups = groupsData || [];
      setGroups(nextGroups);

      if (nextGroups.length === 0) {
        setStandingsByGroup({});
        setLoading(false);
        return;
      }

      const groupIds = nextGroups.map((group) => group.id);
      const { data: standingsData } = await supabase
        .from("group_standings")
        .select("*, team:teams(*)")
        .in("group_id", groupIds)
        .order("position", { ascending: true });

      if (!active) {
        return;
      }

      const nextMap: Record<string, GroupStanding[]> = {};
      for (const row of (standingsData || []) as GroupStanding[]) {
        if (!nextMap[row.group_id]) {
          nextMap[row.group_id] = [];
        }
        nextMap[row.group_id].push(row);
      }

      setStandingsByGroup(nextMap);
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel(`group-standings-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_standings",
        },
        () => {
          fetchAll();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  return { groups, standingsByGroup, loading };
}