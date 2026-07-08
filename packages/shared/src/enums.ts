/**
 * Canonical GrowEasy CRM enums.
 * These are the ONLY allowed values for crm_status and data_source.
 * Anything the AI is unsure about must fall back to "" (blank), never a guess.
 */

export const CRM_STATUS = {
  GOOD_LEAD_FOLLOW_UP: "GOOD_LEAD_FOLLOW_UP",
  DID_NOT_CONNECT: "DID_NOT_CONNECT",
  BAD_LEAD: "BAD_LEAD",
  SALE_DONE: "SALE_DONE",
} as const;

export type CrmStatus = (typeof CRM_STATUS)[keyof typeof CRM_STATUS];

export const CRM_STATUS_VALUES = Object.values(CRM_STATUS) as CrmStatus[];

export const DATA_SOURCE = {
  LEADS_ON_DEMAND: "leads_on_demand",
  MERIDIAN_TOWER: "meridian_tower",
  EDEN_PARK: "eden_park",
  VARAH_SWAMY: "varah_swamy",
  SARJAPUR_PLOTS: "sarjapur_plots",
} as const;

export type DataSource = (typeof DATA_SOURCE)[keyof typeof DATA_SOURCE];

export const DATA_SOURCE_VALUES = Object.values(DATA_SOURCE) as DataSource[];

/**
 * UI badge styling hints, kept here so frontend and any docs share one source.
 * Colors map to the GrowEasy product screenshots (Manage Leads table).
 */
export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  DID_NOT_CONNECT: "Did Not Connect",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};
