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
      <label className="block text-gray-500 text-xs font-medium pb-1">
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
          className={`w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors py-1 ${
            selectedUser ? "cursor-pointer" : ""
          }`}
        />

        {showUserDropdown && !selectedUser && (
          <div className="user-dropdown absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
            {isLoadingUsers ? (
              <div className="p-2 text-xs text-gray-500">
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
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <div className="text-xs font-medium text-gray-900">
                      {compactDisplay}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-2 text-xs text-gray-500">
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
