import { useState, useEffect } from "react";
import UserService, { HaloUser } from "../services/userService";

interface UseUserSearchOptions {
  enabled?: boolean;
  onSelect?: (user: HaloUser) => void;
}

interface UseUserSearchResult {
  userSearch: string;
  availableUsers: HaloUser[];
  isLoadingUsers: boolean;
  showUserDropdown: boolean;
  userSearchTimeout: number | null;
  setUserSearch: (value: string) => void;
  setShowUserDropdown: (value: boolean) => void;
  handleUserSearch: (term: string) => void;
  handleUserSelect: (user: HaloUser) => void;
  clearSearch: () => void;
}

export function useUserSearch(options: UseUserSearchOptions = {}): UseUserSearchResult {
  const { enabled, onSelect } = options;

  const [userSearch, setUserSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<HaloUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTimeout, setUserSearchTimeout] = useState<number | null>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown && event.target instanceof Element) {
        const dropdown = document.querySelector(".user-dropdown");
        if (dropdown && !dropdown.contains(event.target)) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (userSearchTimeout) {
        clearTimeout(userSearchTimeout);
      }
    };
  }, [userSearchTimeout]);

  const searchUsers = async (searchTerm: string) => {
    if (enabled === false) return;

    setIsLoadingUsers(true);
    try {
      const users = await UserService.fetchUsers(searchTerm);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to search users:", error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSearch = (term: string) => {
    setUserSearch(term);

    if (userSearchTimeout) {
      clearTimeout(userSearchTimeout);
    }

    const timeout = window.setTimeout(() => {
      searchUsers(term);
    }, 300);

    setUserSearchTimeout(timeout);
  };

  const handleUserSelect = (user: HaloUser) => {
    setUserSearch(
      UserService.formatUserDisplayNameCompact(
        user.name,
        user.site_name,
        user.client_name,
      ),
    );
    setShowUserDropdown(false);
    if (onSelect) {
      onSelect(user);
    }
  };

  const clearSearch = () => {
    setUserSearch("");
    setAvailableUsers([]);
    setShowUserDropdown(false);
  };

  return {
    userSearch,
    availableUsers,
    isLoadingUsers,
    showUserDropdown,
    userSearchTimeout,
    setUserSearch,
    setShowUserDropdown,
    handleUserSearch,
    handleUserSelect,
    clearSearch,
  };
}
