import { type Request, type Response, type NextFunction } from "express";

export function canonicalDomainMiddleware(req: Request, res: Response, next: NextFunction): void {
  next();
}
