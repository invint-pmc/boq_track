"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

export function useDefaultProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    setProject((data as Project) || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    projectId: project?.id ?? null,
    projectName: project?.name ?? "",
    loading,
    refresh: fetchProject,
  };
}
