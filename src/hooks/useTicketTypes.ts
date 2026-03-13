import { useState, useCallback } from "react";
import HaloAuth from "../services/auth";
import { TicketType } from "../types";

interface UseTicketTypesResult {
  ticketTypes: TicketType[];
  isLoadingTicketTypes: boolean;
  fetchTicketTypes: () => Promise<void>;
}

export function useTicketTypes(): UseTicketTypesResult {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(false);

  const fetchTicketTypes = useCallback(async () => {
    setIsLoadingTicketTypes(true);
    try {
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get(["apiUrl"]);
      if (!token || !settings.apiUrl) {
        setTicketTypes([]);
        return;
      }

      const response = await fetch(
        `${settings.apiUrl}/api/TicketType?showall=true&showinactive=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        setTicketTypes([]);
        return;
      }
      const data: TicketType[] = await response.json();
      setTicketTypes(data);
    } catch (error) {
      console.error("Failed to fetch ticket types:", error);
      setTicketTypes([]);
    } finally {
      setIsLoadingTicketTypes(false);
    }
  }, []);

  return { ticketTypes, isLoadingTicketTypes, fetchTicketTypes };
}
