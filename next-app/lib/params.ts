export async function resolveParams<T extends Record<string, unknown>>(params: T | Promise<T>): Promise<T> {
  return params instanceof Promise ? await params : params;
}

export type AwaitedParams<T> = T extends Promise<infer U> ? U : T;
