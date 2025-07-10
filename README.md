# Halo Quick Ticket Chrome Extension

A Chrome extension that provides a streamlined interface for creating tickets in Halo (Professional Services Automation) directly from your browser.

## Features

### 🎯 **Quick Ticket Creation**
- Fast, popup-based ticket creation interface
- Auto-saving form data to prevent data loss
- Customizable form fields based on your workflow needs

### 🔐 **Secure Authentication**
- OAuth 2.0 integration with Halo
- PKCE (Proof Key for Code Exchange) for enhanced security
- Automatic token refresh handling

### 👥 **User Management**
- Default user assignment for quick ticket creation
- Advanced user search and selection capabilities
- Real-time user lookup with debounced search

### 📋 **Advanced Form Features**
- **Time Budget Tracking**: Set project time estimates with quick-select buttons
- **Date Management**: Smart date selection with "Today", "Tomorrow", "Next Week" shortcuts
- **Priority Setting**: Configurable priority levels (Critical, High, Medium, Low)
- **Category Management**: Hierarchical category selection with up to 4 category levels
- **Field Customization**: Show/hide form fields based on your needs

### ⚙️ **Configuration Options**
- Dedicated options page for extension setup
- Customizable form field visibility
- API endpoint configuration
- User preferences management

## Installation

### From Chrome Web Store
*Coming Soon*

### Manual Installation (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/Robbie-Renada/halo-quick-ticket.git
   cd halo-quick-ticket
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Build the extension:
   ```bash
   npm run build
   # or
   pnpm build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

## Setup & Configuration

### Initial Setup
1. **Install the extension** following the installation steps above
2. **Open the options page** by right-clicking the extension icon and selecting "Options"
3. **Configure your Halo settings**:
   - **API URL**: Your Halo instance URL (e.g., `https://yourcompany.Halo.com/`)
   - **Client ID**: Your Halo OAuth client ID
   - **User ID**: Default user ID for ticket assignment
   - **Ticket Type ID**: Default ticket type for new tickets

### Authentication
1. Click the extension icon in your browser toolbar
2. Click "Login to Halo" if not already authenticated
3. Complete the OAuth flow in the popup window
4. The extension will automatically handle token refresh

### Form Customization
In the options page, you can customize which fields appear in the ticket creation form:
- ✅ Start Date
- ✅ Target Date  
- ✅ Time Budget
- ✅ Categories 1-4
- ✅ Priority
- ✅ User Selection

## Usage

### Creating a Ticket
1. Click the extension icon in your browser toolbar
2. Fill out the ticket form:
   - **Summary**: Brief description of the ticket
   - **Details**: Detailed information about the task
   - **Time Budget**: Estimated time required (with quick-select buttons)
   - **Dates**: Start and target dates (with shortcut buttons)
   - **Categories**: Select appropriate categories from dropdown menus
   - **Priority**: Set ticket priority level
   - **User** (if enabled): Select user for ticket assignment

3. Click "Submit" to create the ticket
4. Upon success, you'll see a "Success!" message and a link to view the ticket in Halo

### Quick Actions
- **Time Budget**: Use quick buttons for 15 minutes, 1 hour, or 2 hours
- **Dates**: Use "Today", "Tomorrow", "Next Week" buttons for quick date selection
- **Form Auto-save**: Form data is automatically saved as you type

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: OAuth 2.0 with PKCE
- **Storage**: Chrome Extension Storage API
- **Bundling**: Chrome Extension Manifest V3

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm
- Chrome browser

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Load the extension in Chrome developer mode pointing to the `dist` folder

### Build for Production
```bash
pnpm build
```

---

**Note**: This extension requires a valid Halo account and proper API configuration. Contact your Halo administrator for OAuth client setup if needed.
