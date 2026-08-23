/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from "./worker-types";
import { executeWorkerTask } from "./worker-executor";

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  const response: WorkerResponse = { id: data.id };
  try {
    response.result = await executeWorkerTask(data.task, data.payload.input, data.payload.algorithm);
  } catch (error) {
    response.error = error instanceof Error ? error.message : "Worker operation failed";
  }
  scope.postMessage(response);
};
