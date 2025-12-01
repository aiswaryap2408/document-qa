# How to Install MongoDB Community Edition on Windows

Since you want to use a local MongoDB instance but haven't installed it yet, follow these steps to get it running.

## 1. Download the Installer
1. Go to the [MongoDB Community Download Page](https://www.mongodb.com/try/download/community).
2. In the **Available Downloads** section, ensure the following are selected:
   - **Version**: (Latest current version, e.g., 7.0.x or 6.0.x)
   - **Platform**: Windows x64
   - **Package**: msi
3. Click **Download**.

## 2. Run the Installer
1. Double-click the downloaded `.msi` file.
2. Click **Next**.
3. Accept the license agreement and click **Next**.
4. Choose **Complete** as the setup type.
5. **Important**: On the "Service Configuration" screen:
   - Keep "Install MongoDB as a Service" **CHECKED**.
   - This ensures MongoDB starts automatically when you turn on your computer.
6. (Optional) You can uncheck "Install MongoDB Compass" if you don't want the GUI tool, but it is recommended for viewing your data.
7. Click **Next**, then **Install**.

## 3. Verify Installation
1. Open a new Command Prompt or PowerShell window.
2. Try running the MongoDB shell (if you installed the tools) or check the service.
3. To verify the service is running, type:
   ```powershell
   Get-Service MongoDB
   ```
   It should show `Status: Running`.

## 4. Run Your Application
Your application is now configured to connect to `mongodb://localhost:27017/` by default.
1. Navigate to your project folder:
   ```bash
   cd c:\Users\user\py-workspace\document-QA\document-qa
   ```
2. Run the auth app:
   ```bash
   python -m auth_pages.app
   ```
3. Open http://localhost:5000 in your browser.
