# Testing Instructions for Reviewers

Halo Quick Ticket is a companion extension for **HaloPSA**, a commercial IT
service-management platform. It lets a Halo agent create tickets from the
browser toolbar without opening the full Halo web app.

Testing requires a HaloPSA instance. Halo offers a free 30-day trial with no
payment details required — setup takes about 10 minutes end to end.

## 1. Create a free HaloPSA trial

1. Go to https://halopsa.com and click **Free Trial**.
2. Complete the sign-up form. You will receive your own hosted instance, e.g.
   `https://yourcompany.halopsa.com`, and admin login credentials by email.
3. Log in to the instance as the admin agent.

## 2. Register the extension as an API application in Halo

1. In Halo, go to **Configuration → Integrations → HaloAPI → View
   Applications → New**.
2. On the **Details** tab:
   - Give the application any name (e.g. "Quick Ticket").
   - Authentication Method: **Authorisation Code (Native Application)** —
     i.e. Authorization Code Flow.
   - Enable **Use PKCE**.
   - Add the **Redirect URI** shown in the extension's options page (open the
     extension's options — the URI is displayed with a Copy button; it has the
     form `https://<extension-id>.chromiumapp.org/`).
   - Copy the generated **Client ID** for step 3.
3. Under **Login Details / Preferences**, allow **Agent Logins**.
4. On the **Permissions** tab, grant: `read:tickets`, `edit:tickets`,
   `read:customers`.
5. Save the application.

## 3. Configure the extension

1. Open the extension's options page (right-click the toolbar icon →
   **Options**, or click **Open Settings** in the popup).
2. Enter:
   - **Halo Base URL**: your trial instance URL, e.g.
     `https://yourcompany.halopsa.com`
   - **Client ID**: from step 2
3. Click **Save API Configuration** and accept the host-permission prompt
   (the extension requests access only to the Halo hostname you entered).
4. Click **Login to Halo** and sign in with your trial admin credentials.
5. Choose a **Default User** (search for any user in the trial instance) and
   a **Ticket Type** (e.g. Incident), then click **Save changes**.

## 4. Create a ticket

1. Click the extension's toolbar icon.
2. Enter a Summary (and optionally Details and other fields).
3. Click **Submit**.
4. A success message appears, and a **Last ticket** button in the popup
   header links directly to the created ticket in Halo, where it can be
   verified.

## Notes

- The extension uses OAuth 2.0 Authorization Code with PKCE; no client
  secret or password is stored. Tokens are kept in `chrome.storage.local`.
- Host permissions are requested at runtime for the configured Halo
  hostname only; the manifest contains no fixed host permissions.
