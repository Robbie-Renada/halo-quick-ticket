import UserService, { HaloUser } from "../../services/userService";

interface UserSearchFieldProps {
  selectedUser: HaloUser | null;
  userSearch: string;
  availableUsers: HaloUser[];
  isLoadingUsers: boolean;
  showUserDropdown: boolean;
  setShowUserDropdown: (v: boolean) => void;
  onSearch: (term: string) => void;
  onSelect: (user: HaloUser) => void;
  onClear: () => void;
}

function UserSearchField({
  selectedUser,
  userSearch,
  availableUsers,
  isLoadingUsers,
  showUserDropdown,
  setShowUserDropdown,
  onSearch,
  onSelect,
  onClear,
}: UserSearchFieldProps) {
  return (
    <div>
      <label className="hqt-label">
        User
      </label>
      <div className="relative">
        <input
          type="text"
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
              onClear();
              onSearch(e.target.value);
            } else {
              onSearch(e.target.value);
            }
            setShowUserDropdown(true);
          }}
          onFocus={() => {
            if (selectedUser) {
              onClear();
            }
            setShowUserDropdown(true);
          }}
          className={`hqt-input py-1 ${
            selectedUser ? "cursor-pointer" : ""
          }`}
        />

        {showUserDropdown && !selectedUser && (
          <div className="user-dropdown hqt-dropdown max-h-40">
            {isLoadingUsers ? (
              <div className="p-2 text-xs text-stone-500">
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
                    onClick={() => onSelect(user)}
                    className="hqt-dropdown-item"
                  >
                    <div className="text-xs font-medium text-stone-900">
                      {compactDisplay}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-2 text-xs text-stone-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSearchField;
