import { ReportScope } from "../dto/generate-report.dto";

export interface KpiResult {
  value: number;
  unit: string;
  details?: Record<string, any>;
}

export interface ReportResponse {
  scope: ReportScope;
  from: string;
  to: string;
  targetId: string | null;
  targetName: string;
  kpis: Record<string, KpiResult>;
  generatedAt: string;
}