const STORAGE_KEY = "HYFIT_EVENT_CONFIG";

export interface EventConfig {
  eventName: string;
  eventDate: string;
  location: string;
}

const DEFAULT: EventConfig = {
  eventName: "Hyfit Games 2.1",
  eventDate: "",
  location: "",
};

export function getEventConfig(): EventConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<EventConfig>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
}

export function setEventConfig(config: Partial<EventConfig>): void {
  const current = getEventConfig();
  const next = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
