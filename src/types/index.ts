export type { HaloUser } from "../services/userService";

export interface HaloSettings {
  apiUrl: string;
  clientId: string;
  selectedUser: import("../services/userService").HaloUser | null;
  ticketTypeId: string;
  showTicketType: boolean;
  showAutoAssign: boolean;
  showStartDate: boolean;
  showTargetDate: boolean;
  showTimeBudget: boolean;
  showTimeTaken: boolean;
  showChargeType: boolean;
  showCategory1: boolean;
  showCategory2: boolean;
  showCategory3: boolean;
  showCategory4: boolean;
  showPriority: boolean;
  allowUserSelection: boolean;
  allowCompleteTickets: boolean;
  autoAssignToMe: boolean;
  fieldOrder: string[];
}

export type SetupStep = "basic" | "auth" | "advanced";

export interface TicketType {
  id: number;
  name: string;
}

export interface FormData {
  summary: string;
  details: string;
  projecttimebudget: string;
  timetaken: string;
  startDate: string;
  targetDate: string;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
  chargeType: string;
}

export interface TicketPayload {
  summary: string;
  details: string;
  user_Id: string;
  site_id?: string;
  client_id?: string;
  ticketType_Id: string;
  projecttimebudget?: string;
  timetaken?: string;
  startDate?: string;
  targetDate?: string;
  _novalidate: boolean;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
  new_actioncode?: string;
  status_id?: number;
  _newticket_quickclose?: boolean;
  agent_id?: number;
}

export interface TicketResponse {
  id: number;
}

export interface LastTicket {
  id: number;
  url: string;
}

export interface Category {
  guid: string;
  id: number;
  value: string;
  category_name: string;
  type_id: number;
  category_group_id: number;
}

export interface ChargeType {
  id: number;
  name: string;
}

export type AppState = "loading" | "unconfigured" | "unauthenticated" | "ready";
