import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  RotateCcw,
  Pencil,
  Check,
  Dumbbell,
  Trophy,
  Flag,
  ChevronRight,
  PersonStanding,
  ArrowDownUp,
} from "lucide-react";

type ActivityType = "run" | "exercise";
type ActivityStatus = "pending" | "active" | "completed";

interface Activity {
  id: number;
  name: string;
  type: ActivityType;
  metric: string;
  value: string;
  elapsedMs: number;
  status: ActivityStatus;
}

interface RoxTime {
  afterActivityId: number;
  elapsedMs: number;
  status: ActivityStatus;
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 1, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 2, name: "SkiErg", type: "exercise", metric: "Distance", value: "1000m", elapsedMs: 0, status: "pending" },
  { id: 3, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 4, name: "Burpee Broad Jumps", type: "exercise", metric: "Distance", value: "80m", elapsedMs: 0, status: "pending" },
  { id: 5, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 6, name: "Rowing", type: "exercise", metric: "Distance", value: "1000m", elapsedMs: 0, status: "pending" },
  { id: 7, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 8, name: "Farmers Carry", type: "exercise", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 9, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 10, name: "Sandbag Lunges", type: "exercise", metric: "Distance", value: "100m", elapsedMs: 0, status: "pending" },
  { id: 11, name: "Run", type: "run", metric: "Distance", value: "200m", elapsedMs: 0, status: "pending" },
  { id: 12, name: "Wall Balls", type: "exercise", metric: "Reps", value: "75", elapsedMs: 0, status: "pending" },
];

function buildDefaultRoxTimes(): RoxTime[] {
  return Array.from({ length: 11 }, (_, i) => ({
    afterActivityId: i + 1,
    elapsedMs: 0,
    status: "pending" as ActivityStatus,
  }));
}

const METRIC_OPTIONS = ["Distance", "Reps", "Time", "Weight", "Calories"];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function formatRaceTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type TimerTarget = { kind: "activity"; id: number } | { kind: "rox"; afterActivityId: number } | null;

export default function Home() {
  const [athleteName, setAthleteName] = useState("");
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [roxTimes, setRoxTimes] = useState<RoxTime[]>(buildDefaultRoxTimes);

  const [activeTarget, setActiveTarget] = useState<TimerTarget>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMs, setTimerMs] = useState(0);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", type: "run" as ActivityType, metric: "Distance", value: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [raceElapsedMs, setRaceElapsedMs] = useState(0);
  const [isRaceRunning, setIsRaceRunning] = useState(false);

  const startTimeRef = useRef(0);
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const raceStartRef = useRef(0);
  const raceAccumulatedRef = useRef(0);
  const raceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeTarget]);

  const completedCount = activities.filter((a) => a.status === "completed").length;
  const totalActivityMs = activities.reduce((sum, a) => sum + a.elapsedMs, 0);
  const totalRoxMs = roxTimes.reduce((sum, r) => sum + r.elapsedMs, 0);
  const allComplete = completedCount === 12;

  const isActivityActive = (id: number) => activeTarget?.kind === "activity" && activeTarget.id === id;
  const isRoxActive = (afterId: number) => activeTarget?.kind === "rox" && activeTarget.afterActivityId === afterId;

  const clearActivityInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveCurrentTimerValue = useCallback(() => {
    if (isRunning) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
      clearActivityInterval();
      setIsRunning(false);
    }
    const savedMs = accumulatedRef.current;
    if (activeTarget?.kind === "activity") {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activeTarget.id && a.status === "active"
            ? { ...a, elapsedMs: savedMs, status: "pending" as ActivityStatus }
            : a
        )
      );
    } else if (activeTarget?.kind === "rox") {
      setRoxTimes((prev) =>
        prev.map((r) =>
          r.afterActivityId === activeTarget.afterActivityId && r.status === "active"
            ? { ...r, elapsedMs: savedMs, status: "pending" as ActivityStatus }
            : r
        )
      );
    }
  }, [isRunning, activeTarget, clearActivityInterval]);

  const startRaceTimer = useCallback(() => {
    if (!isRaceRunning) {
      raceStartRef.current = Date.now();
      setIsRaceRunning(true);
      raceIntervalRef.current = setInterval(() => {
        setRaceElapsedMs(raceAccumulatedRef.current + (Date.now() - raceStartRef.current));
      }, 100);
    }
  }, [isRaceRunning]);

  const stopRaceTimer = useCallback(() => {
    if (isRaceRunning) {
      raceAccumulatedRef.current += Date.now() - raceStartRef.current;
      setRaceElapsedMs(raceAccumulatedRef.current);
      setIsRaceRunning(false);
      if (raceIntervalRef.current) {
        clearInterval(raceIntervalRef.current);
        raceIntervalRef.current = null;
      }
    }
  }, [isRaceRunning]);

  const beginTimer = useCallback((fromMs: number = 0) => {
    accumulatedRef.current = fromMs;
    setTimerMs(fromMs);
    startTimeRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerMs(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 10);
    startRaceTimer();
  }, [startRaceTimer]);

  const startTimer = useCallback(() => {
    beginTimer(accumulatedRef.current);
  }, [beginTimer]);

  const pauseTimer = useCallback(() => {
    accumulatedRef.current += Date.now() - startTimeRef.current;
    setTimerMs(accumulatedRef.current);
    setIsRunning(false);
    clearActivityInterval();
  }, [clearActivityInterval]);

  const selectActivity = useCallback(
    (id: number) => {
      if (activeTarget?.kind === "activity" && activeTarget.id === id) return;
      saveCurrentTimerValue();

      const activity = activities.find((a) => a.id === id);
      if (activity) {
        setActiveTarget({ kind: "activity", id });
        setActivities((prev) =>
          prev.map((a) => {
            if (a.id === id) return { ...a, status: "active" as ActivityStatus };
            if (a.status === "active") return { ...a, status: "pending" as ActivityStatus };
            return a;
          })
        );
        beginTimer(activity.elapsedMs);
      }
    },
    [activeTarget, activities, saveCurrentTimerValue, beginTimer]
  );

  const selectRox = useCallback(
    (afterActivityId: number) => {
      if (activeTarget?.kind === "rox" && activeTarget.afterActivityId === afterActivityId) return;
      saveCurrentTimerValue();

      const rox = roxTimes.find((r) => r.afterActivityId === afterActivityId);
      if (rox) {
        setActiveTarget({ kind: "rox", afterActivityId });
        setActivities((prev) => prev.map((a) => (a.status === "active" ? { ...a, status: "pending" as ActivityStatus } : a)));
        setRoxTimes((prev) =>
          prev.map((r) => {
            if (r.afterActivityId === afterActivityId) return { ...r, status: "active" as ActivityStatus };
            if (r.status === "active") return { ...r, status: "pending" as ActivityStatus };
            return r;
          })
        );
        beginTimer(rox.elapsedMs);
      }
    },
    [activeTarget, roxTimes, saveCurrentTimerValue, beginTimer]
  );

  const completeActivity = useCallback(() => {
    if (activeTarget?.kind !== "activity") return;
    const activityId = activeTarget.id;

    if (isRunning) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
      clearActivityInterval();
    }

    const finalTime = accumulatedRef.current;

    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, elapsedMs: finalTime, status: "completed" as ActivityStatus } : a))
    );

    if (activityId < 12) {
      const rox = roxTimes.find((r) => r.afterActivityId === activityId);
      if (rox && rox.status !== "completed") {
        setActiveTarget({ kind: "rox", afterActivityId: activityId });
        setRoxTimes((prev) =>
          prev.map((r) =>
            r.afterActivityId === activityId ? { ...r, status: "active" as ActivityStatus } : r
          )
        );
        beginTimer(rox.elapsedMs);
        return;
      }
    }

    const currentIndex = activities.findIndex((a) => a.id === activityId);
    const nextPending = activities.slice(currentIndex + 1).find((a) => a.status === "pending");
    if (nextPending) {
      setActiveTarget({ kind: "activity", id: nextPending.id });
      setActivities((prev) =>
        prev.map((a) => (a.id === nextPending.id ? { ...a, status: "active" as ActivityStatus } : a))
      );
      beginTimer(0);
    } else {
      setActiveTarget(null);
      setIsRunning(false);
      setTimerMs(0);
      accumulatedRef.current = 0;
      const willAllBeComplete = activities.filter((a) => a.id !== activityId).every((a) => a.status === "completed");
      if (willAllBeComplete) stopRaceTimer();
    }
  }, [activeTarget, isRunning, activities, roxTimes, clearActivityInterval, stopRaceTimer, beginTimer]);

  const completeRox = useCallback(() => {
    if (activeTarget?.kind !== "rox") return;
    const afterId = activeTarget.afterActivityId;

    if (isRunning) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
      clearActivityInterval();
    }

    const finalTime = accumulatedRef.current;

    setRoxTimes((prev) =>
      prev.map((r) => (r.afterActivityId === afterId ? { ...r, elapsedMs: finalTime, status: "completed" as ActivityStatus } : r))
    );

    const nextActivityId = afterId + 1;
    const nextActivity = activities.find((a) => a.id === nextActivityId);
    if (nextActivity && nextActivity.status !== "completed") {
      setActiveTarget({ kind: "activity", id: nextActivityId });
      setActivities((prev) =>
        prev.map((a) => (a.id === nextActivityId ? { ...a, status: "active" as ActivityStatus } : a))
      );
      beginTimer(nextActivity.elapsedMs);
    } else {
      setActiveTarget(null);
      setIsRunning(false);
      setTimerMs(0);
      accumulatedRef.current = 0;
    }
  }, [activeTarget, isRunning, activities, clearActivityInterval, beginTimer]);

  const resetCurrentTimer = useCallback(() => {
    if (isRunning) {
      clearActivityInterval();
      setIsRunning(false);
    }
    accumulatedRef.current = 0;
    setTimerMs(0);
    if (activeTarget?.kind === "activity") {
      setActivities((prev) =>
        prev.map((a) => (a.id === activeTarget.id ? { ...a, elapsedMs: 0 } : a))
      );
    } else if (activeTarget?.kind === "rox") {
      setRoxTimes((prev) =>
        prev.map((r) => (r.afterActivityId === activeTarget.afterActivityId ? { ...r, elapsedMs: 0 } : r))
      );
    }
  }, [activeTarget, isRunning, clearActivityInterval]);

  const redoActivity = useCallback(
    (id: number) => {
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, elapsedMs: 0, status: "pending" as ActivityStatus } : a))
      );
      if (activeTarget?.kind === "activity" && activeTarget.id === id) {
        accumulatedRef.current = 0;
        setTimerMs(0);
        setIsRunning(false);
        setActiveTarget(null);
      }
    },
    [activeTarget]
  );

  const redoRox = useCallback(
    (afterId: number) => {
      setRoxTimes((prev) =>
        prev.map((r) => (r.afterActivityId === afterId ? { ...r, elapsedMs: 0, status: "pending" as ActivityStatus } : r))
      );
      if (activeTarget?.kind === "rox" && activeTarget.afterActivityId === afterId) {
        accumulatedRef.current = 0;
        setTimerMs(0);
        setIsRunning(false);
        setActiveTarget(null);
      }
    },
    [activeTarget]
  );

  const openEditDialog = useCallback(
    (id: number) => {
      const activity = activities.find((a) => a.id === id);
      if (activity) {
        setEditId(id);
        setEditForm({ name: activity.name, type: activity.type, metric: activity.metric, value: activity.value });
        setEditDialogOpen(true);
      }
    },
    [activities]
  );

  const saveEdit = useCallback(() => {
    if (editId === null) return;
    setActivities((prev) =>
      prev.map((a) =>
        a.id === editId ? { ...a, name: editForm.name, type: editForm.type, metric: editForm.metric, value: editForm.value } : a
      )
    );
    setEditDialogOpen(false);
    setEditId(null);
  }, [editId, editForm]);

  const resetRace = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    intervalRef.current = null;
    raceIntervalRef.current = null;
    setActivities(DEFAULT_ACTIVITIES.map((a) => ({ ...a })));
    setRoxTimes(buildDefaultRoxTimes());
    setActiveTarget(null);
    setIsRunning(false);
    setTimerMs(0);
    accumulatedRef.current = 0;
    setRaceElapsedMs(0);
    setIsRaceRunning(false);
    raceAccumulatedRef.current = 0;
    setResetDialogOpen(false);
  }, []);

  const handleComplete = activeTarget?.kind === "activity" ? completeActivity : activeTarget?.kind === "rox" ? completeRox : undefined;

  function renderTimerControls(testIdPrefix: string) {
    return (
      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isRunning && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-5 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-chart-5" />
              </span>
            )}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider" aria-live="polite">
              {isRunning ? "Running" : timerMs > 0 ? "Paused" : "Ready"}
            </span>
          </div>
          <div
            className={`text-5xl sm:text-6xl font-mono font-bold tabular-nums tracking-wider transition-colors ${
              isRunning ? "text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`text-${testIdPrefix}-timer`}
          >
            {formatTime(timerMs)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-3">
          {!isRunning ? (
            <Button size="lg" data-testid={`button-${testIdPrefix}-start`} onClick={startTimer} className="col-span-1">
              <Play className="mr-2 h-5 w-5" />
              {timerMs > 0 ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" data-testid={`button-${testIdPrefix}-pause`} onClick={pauseTimer} className="col-span-1">
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          )}

          <Button
            size="lg"
            variant="secondary"
            data-testid={`button-${testIdPrefix}-reset`}
            onClick={resetCurrentTimer}
            disabled={timerMs === 0}
            className="col-span-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>

          <Button
            size="lg"
            data-testid={`button-${testIdPrefix}-complete`}
            onClick={handleComplete}
            className="col-span-2 sm:col-span-1"
          >
            <Check className="mr-2 h-5 w-5" />
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-title">HYFIT GAMES | BANGALORE</h1>
              <p className="text-sm opacity-75">Race Timer</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold tabular-nums" data-testid="text-race-time">
                {formatRaceTime(raceElapsedMs)}
              </div>
              <p className="text-xs opacity-75">Race Clock</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-primary-foreground/20 rounded-full">
              <div
                className="h-full bg-primary-foreground/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / 12) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums" data-testid="text-progress">
              {completedCount}/12
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="athlete-name" className="text-sm font-medium text-muted-foreground">
              Athlete Name
            </Label>
            <Input
              id="athlete-name"
              data-testid="input-athlete-name"
              value={athleteName}
              onChange={(e) => setAthleteName(e.target.value)}
              placeholder="Enter athlete name..."
              className="text-base"
            />
          </div>
          <Button variant="secondary" size="default" data-testid="button-reset-race" onClick={() => setResetDialogOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {allComplete && (
          <Card className="border-chart-2/30 bg-chart-2/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-chart-2/15">
                <Trophy className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <h2 className="text-lg font-bold" data-testid="text-race-complete">Race Complete!</h2>
                <p className="text-sm text-muted-foreground">
                  {athleteName ? athleteName : "Athlete"} finished all 12 activities
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-md bg-background p-3 text-center">
                <div className="text-xl font-mono font-bold tabular-nums" data-testid="text-total-race-time">
                  {formatRaceTime(raceElapsedMs)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Race</div>
              </div>
              <div className="rounded-md bg-background p-3 text-center">
                <div className="text-xl font-mono font-bold tabular-nums" data-testid="text-total-activity-time">
                  {formatRaceTime(totalActivityMs)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Activity</div>
              </div>
              <div className="rounded-md bg-background p-3 text-center">
                <div className="text-xl font-mono font-bold tabular-nums text-chart-4" data-testid="text-total-rox-time">
                  {formatRaceTime(totalRoxMs)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Rox Time</div>
              </div>
            </div>

            <div className="space-y-1">
              {activities.map((a) => {
                const rox = roxTimes.find((r) => r.afterActivityId === a.id);
                return (
                  <div key={a.id}>
                    <div
                      className="flex items-center justify-between text-sm px-2 py-1.5 rounded-md bg-background"
                      data-testid={`text-result-${a.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-5 text-right tabular-nums">{a.id}.</span>
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground text-xs">({a.value})</span>
                      </div>
                      <span className="font-mono tabular-nums font-medium">{formatTime(a.elapsedMs)}</span>
                    </div>
                    {rox && rox.status === "completed" && (
                      <div
                        className="flex items-center justify-between text-xs px-2 py-1 ml-7 text-chart-4"
                        data-testid={`text-result-rox-${a.id}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <ArrowDownUp className="h-3 w-3" />
                          <span>Rox Time</span>
                        </div>
                        <span className="font-mono tabular-nums">{formatTime(rox.elapsedMs)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {activities.map((activity) => {
            const isActive = isActivityActive(activity.id);
            const isCompleted = activity.status === "completed";
            const isPending = activity.status === "pending" && !isActive;

            const rox = roxTimes.find((r) => r.afterActivityId === activity.id);
            const roxIsActive = rox ? isRoxActive(activity.id) : false;
            const roxIsCompleted = rox?.status === "completed";
            const roxIsPending = rox ? rox.status === "pending" && !roxIsActive : false;

            return (
              <div key={activity.id}>
                <div
                  ref={isActive ? activeCardRef : undefined}
                  data-testid={`card-activity-${activity.id}`}
                >
                  <Card
                    className={`transition-all duration-300 ${
                      isActive
                        ? "border-primary/50 ring-2 ring-primary/20"
                        : isCompleted
                          ? "border-chart-2/20"
                          : "border-border"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isCompleted
                                ? "bg-chart-2/15 text-chart-2"
                                : "bg-muted text-muted-foreground"
                          }`}
                          data-testid={`badge-number-${activity.id}`}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : activity.id}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base truncate" data-testid={`text-activity-name-${activity.id}`}>
                              {activity.name}
                            </span>
                            <Badge variant={activity.type === "run" ? "secondary" : "default"} className="text-xs">
                              {activity.type === "run" ? (
                                <PersonStanding className="h-3 w-3 mr-1" />
                              ) : (
                                <Dumbbell className="h-3 w-3 mr-1" />
                              )}
                              {activity.type === "run" ? "Run" : "Exercise"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {activity.metric}: {activity.value}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isCompleted && (
                            <span className="font-mono text-sm font-semibold text-chart-2 tabular-nums mr-1" data-testid={`text-time-${activity.id}`}>
                              {formatTime(activity.elapsedMs)}
                            </span>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${activity.name}`}
                            data-testid={`button-edit-${activity.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(activity.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {isPending && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Select ${activity.name}`}
                              data-testid={`button-select-${activity.id}`}
                              onClick={() => selectActivity(activity.id)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}

                          {isCompleted && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Redo ${activity.name}`}
                              data-testid={`button-redo-${activity.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                redoActivity(activity.id);
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isActive && renderTimerControls("activity")}
                    </div>
                  </Card>
                </div>

                {rox && (
                  <div
                    ref={roxIsActive ? activeCardRef : undefined}
                    className="my-1"
                    data-testid={`card-rox-${activity.id}`}
                  >
                    <div
                      className={`rounded-md border transition-all duration-300 ${
                        roxIsActive
                          ? "border-chart-4/50 ring-2 ring-chart-4/20 bg-chart-4/5"
                          : roxIsCompleted
                            ? "border-chart-4/15 bg-chart-4/5"
                            : "border-dashed border-border/60"
                      }`}
                    >
                      <div className={`px-4 ${roxIsActive ? "py-4" : "py-2.5"}`}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                              roxIsActive
                                ? "bg-chart-4 text-background"
                                : roxIsCompleted
                                  ? "bg-chart-4/15 text-chart-4"
                                  : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {roxIsCompleted ? <Check className="h-3 w-3" /> : <ArrowDownUp className="h-3 w-3" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${roxIsCompleted || roxIsActive ? "text-chart-4" : "text-muted-foreground"}`}>
                              Rox Time
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Transition {activity.id} → {activity.id + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {roxIsCompleted && (
                              <span className="font-mono text-sm font-semibold text-chart-4 tabular-nums mr-1" data-testid={`text-rox-time-${activity.id}`}>
                                {formatTime(rox.elapsedMs)}
                              </span>
                            )}

                            {roxIsPending && (
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Start Rox transition ${activity.id} to ${activity.id + 1}`}
                                data-testid={`button-select-rox-${activity.id}`}
                                onClick={() => selectRox(activity.id)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}

                            {roxIsCompleted && (
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Redo Rox transition ${activity.id} to ${activity.id + 1}`}
                                data-testid={`button-redo-rox-${activity.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  redoRox(activity.id);
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {roxIsActive && renderTimerControls("rox")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!allComplete && activeTarget === null && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-3">
              <Flag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground" data-testid="text-get-started">
              Select an activity to start timing
            </p>
          </div>
        )}

        <div className="h-8" />
      </div>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Customize this activity's details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Activity Name</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sled Push"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as ActivityType }))}>
                <SelectTrigger data-testid="select-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="run">Run</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Measurement</Label>
              <Select value={editForm.metric} onValueChange={(v) => setEditForm((f) => ({ ...f, metric: v }))}>
                <SelectTrigger data-testid="select-edit-metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                data-testid="input-edit-value"
                value={editForm.value}
                onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="e.g. 200m, 75 reps"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={saveEdit} data-testid="button-save-edit">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Race</DialogTitle>
            <DialogDescription>
              This will clear all recorded times and reset every activity. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResetDialogOpen(false)} data-testid="button-cancel-reset">
              Cancel
            </Button>
            <Button variant="destructive" onClick={resetRace} data-testid="button-confirm-reset">
              Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
