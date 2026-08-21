export type WorkerTask = "json-to-csv" | "csv-to-json" | "hash";
export interface WorkerRequest { id: string; task: WorkerTask; payload: { input: string; algorithm?: AlgorithmIdentifier } }
export interface WorkerResponse { id: string; result?: string; error?: string }
