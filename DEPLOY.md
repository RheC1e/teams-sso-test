# Teams SSO 測試專案 - 部署指南

## ✅ 已完成

- ✅ GitHub 倉庫已建立：https://github.com/RheC1e/teams-sso-test
- ✅ 程式碼已推送到 GitHub

## 📋 下一步：部署到 Vercel

### 步驟 1: 在 Vercel 中新增專案

1. 前往：https://vercel.com/new
2. 點擊「Continue with GitHub」登入
3. 選擇「Import Git Repository」
4. 搜尋或選擇：`RheC1e/teams-sso-test`
5. 點擊「Import」

### 步驟 2: 設定建置選項

Vercel 會自動偵測，但請確認：

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `./`（保持預設）

### 步驟 3: 部署

1. 點擊「Deploy」
2. 等待部署完成（約 2-3 分鐘）
3. 記下部署後的網址（例如：`teams-sso-test.vercel.app`）

### 步驟 4: 更新 manifest.json

部署完成後，需要更新 `manifest.json` 中的 URL：

1. 在專案中更新 `manifest.json`：
   - 將 `contentUrl` 改為您的 Vercel 網址
   - 將 `validDomains` 更新為您的網域

2. 重新打包並上傳到 Teams

## 🔧 Azure Portal 設定

### 新增 Redirect URI

1. 前往：https://portal.azure.com
2. 找到「RHEMA 請款系統」應用程式註冊
3. 點擊「驗證」（Authentication）
4. 在「重新導向 URI」中新增：
   ```
   https://teams-sso-test.vercel.app
   https://teams-sso-test.vercel.app/index.html
   ```
   （替換為您的實際 Vercel 網址）

5. 點擊「儲存」

## 📦 打包 Teams 應用程式

### 方式一：手動打包

1. 建立圖示檔案（或使用佔位符）：
   - `icon-color.png` (192x192)
   - `icon-outline.png` (32x32)

2. 將以下檔案打包成 ZIP：
   - `manifest.json`
   - `icon-color.png`
   - `icon-outline.png`

3. ZIP 檔案名稱：`teams-sso-test.zip`

### 方式二：使用 Teams Toolkit（推薦）

1. 安裝 Teams Toolkit（VS Code 擴充功能）
2. 使用 Teams Toolkit 建立應用程式套件
3. 自動驗證 manifest.json

## 📤 上傳到 Teams

1. 開啟 Microsoft Teams
2. 點擊左側「應用程式」（Apps）
3. 點擊「上傳自訂應用程式」（Upload a custom app）
4. 選擇「為您的組織上傳」（Upload for your organization）
5. 選擇打包好的 ZIP 檔案
6. 點擊「新增」（Add）

## ✅ 測試

1. 在 Teams 中開啟應用程式
2. 應該會自動使用 SSO 登入
3. 顯示您的使用者資訊：
   - 顯示名稱
   - 信箱
   - 姓名（姓 + 名）
   - 使用者 ID

## 🆘 疑難排解

### SSO 認證失敗

1. 檢查 Azure Portal 中的 Redirect URI
2. 確認 manifest.json 中的 webApplicationInfo 正確
3. 檢查應用程式 ID 是否正確

### 無法顯示使用者資訊

1. 檢查 API 權限是否已授與
2. 查看瀏覽器控制台的錯誤訊息
3. 確認 Token 是否有效

### 應用程式無法載入

1. 確認 Vercel 部署成功
2. 檢查 manifest.json 中的 URL 是否正確
3. 確認 validDomains 包含您的網域

## 📝 注意事項

- Teams 應用程式必須部署在 HTTPS 網址
- manifest.json 中的 URL 必須與實際部署網址一致
- 需要確保 Azure Portal 中的設定正確

