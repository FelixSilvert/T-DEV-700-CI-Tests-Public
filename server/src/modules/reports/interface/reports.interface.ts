import { KpiResult } from "../services/kpi-calculator.service";
import { ReportScope } from "../dto/generate-report.dto";

/**
 * Interface de réponse pour un rapport généré
 */
export interface ReportResponse {
  scope: ReportScope;
  from: string;
  to: string;
  targetId: string | null;
  targetName?: string;
  periodInfo: {
    totalDays: number;
    workingDays: number;
  };
  kpis: Record<string, KpiResult>;
  generatedAt: string;
}