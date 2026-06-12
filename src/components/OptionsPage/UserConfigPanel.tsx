import UserService, { HaloUser } from "../../services/userService";
import { TicketType } from "../../types";

interface UserConfigPanelProps {
  selectedUser: HaloUser | null;
  ticketTypeId: string;
  onTicketTypeSelect: (id: string) => void;
  ticketTypes: TicketType[];
  isLoadingTicketTypes: boolean;
  // user search state/functions (from useUserSearch hook):
  userSearch: string;
  availableUsers: HaloUser[];
  isLoadingUsers: boolean;
  showUserDropdown: boolean;
  setShowUserDropdown: (v: boolean) => void;
  handleUserSearch: (term: string) => void;
  handleUserSelect: (user: HaloUser) => void;
  onUserClear: () => void;
}

function UserConfigPanel({
  selectedUser,
  ticketTypeId,
  onTicketTypeSelect,
  ticketTypes,
  isLoadingTicketTypes,
  userSearch,
  availableUsers,
  isLoadingUsers,
  showUserDropdown,
  setShowUserDropdown,
  handleUserSearch,
  handleUserSelect,
  onUserClear,
}: UserConfigPanelProps) {
  return (
    <div className="hqt-panel">
      <h2 className="hqt-panel-title mb-3">User Configuration</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="selectedUser" className="hqt-label">
            Default User <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="selectedUser"
              placeholder="Search for user..."
              value={
                selectedUser
                  ? UserService.formatUserDisplayNameCompact(
                      selectedUser.name,
                      selectedUser.site_name,
                      selectedUser.client_name,
                    )
                  : userSearch
              }
              onChange={(e) => {
                if (selectedUser) {
                  onUserClear();
                  handleUserSearch(e.target.value);
                } else {
                  handleUserSearch(e.target.value);
                }
                setShowUserDropdown(true);
              }}
              onFocus={() => {
                if (selectedUser) {
                  onUserClear();
                }
                setShowUserDropdown(true);
              }}
              className={`hqt-input text-sm ${
                selectedUser ? "cursor-pointer" : ""
              }`}
            />

            {showUserDropdown && !selectedUser && (
              <div className="user-dropdown hqt-dropdown max-h-40">
                {isLoadingUsers ? (
                  <div className="p-2 text-sm text-stone-500">
                    Loading users...
                  </div>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map((user) => {
                    const compactDisplay =
                      UserService.formatUserDisplayNameCompact(
                        user.name,
                        user.site_name,
                        user.client_name,
                      );
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="hqt-dropdown-item"
                      >
                        <div className="text-sm font-medium text-stone-900">
                          {compactDisplay}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-stone-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="ticketTypeId" className="hqt-label">
            Ticket Type <span className="text-red-500">*</span>
          </label>
          <select
            id="ticketTypeId"
            name="ticketTypeId"
            value={ticketTypeId}
            onChange={(e) => onTicketTypeSelect(e.target.value)}
            className="hqt-input text-sm"
            disabled={isLoadingTicketTypes}
          >
            <option value="">
              {isLoadingTicketTypes
                ? "Loading..."
                : "Select Ticket Type"}
            </option>
            {ticketTypes.map((ticketType) => (
              <option
                key={ticketType.id}
                value={ticketType.id.toString()}
              >
                {ticketType.name}
              </option>
            ))}
          </select>
        </div>

        {/* Remove the save button from here */}
      </div>
    </div>
  );
}

export default UserConfigPanel;
