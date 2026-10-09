export interface Run {
  id: number;
  started_at: string;
  finished_at: string | null;
}

export interface RunPage {
  runs: Run[];
  page: number;
  totalPages: number;
  total: number;
}

export interface Entry {
  id: number;
  run_id: number;
  name: string;
}

export interface Elimination {
  id: number;
  run_id: number;
  entry_id: number;
  spin_number: number;
  created_at: string;
}

export interface RunDetails extends Run {
  entries: Entry[];
  eliminations: Elimination[];
}

export interface CreateRunRequest {
  entries: string[];
}

export interface SpinResult {
  elimination: Elimination;
  remaining: Entry[];
  winner: Entry | null;
}
