# Teams SSO 測試專案

這是一個用於測試 Teams 單一登入（SSO）功能的簡單應用程式。

## 功能

- ✅ Teams SSO 自動登入
- ✅ 顯示使用者顯示名稱
- ✅ 顯示使用者信箱
- ✅ 顯示使用者姓名（姓 + 名）
- ✅ 顯示使用者 ID

## 設定步驟

### 1. 在 Azure Portal 設定應用程式

1. 前往 https://portal.azure.com
2. 找到「RHEMA 請款系統」應用程式註冊
3. 在「驗證」中，確認已設定以下 Redirect URI：
   - `https://rhema-pwa-demo.vercel.app/teams-sso-test/index.html`
   - `http://localhost:3001`（本地開發）

### 2. 建立 Teams 應用程式套件

1. 將 `manifest.json` 打包成 ZIP 檔案
2. 在 Teams 中上傳應用程式：
   - 開啟 Teams
   - 點擊左側「應用程式」
   - 點擊「上傳自訂應用程式」
   - 選擇「為您的組織上傳」
   - 上傳 ZIP 檔案

### 3. 部署應用程式

#### 本地開發

```bash
npm install
npm run dev
```

#### 部署到 Vercel

1. 將此專案推送到 GitHub
2. 在 Vercel 中新增專案
3. 設定建置路徑為 `teams-sso-test`
4. 部署完成後，更新 `manifest.json` 中的 URL

## 使用方式

1. 在 Teams 中開啟應用程式
2. 應用程式會自動使用 SSO 登入
3. 顯示您的使用者資訊

## 檔案結構

```
teams-sso-test/
├── manifest.json      # Teams 應用程式設定檔
├── index.html         # 主頁面
├── scripts/
│   └── main.js       # 主要邏輯
├── package.json       # 專案設定
└── README.md         # 本檔案
```

## 注意事項

- 此專案使用與主請款系統相同的 Azure 應用程式 ID
- 需要確保 Azure Portal 中的 Redirect URI 已正確設定
- Teams 應用程式需要部署到 HTTPS 網址

## 疑難排解

### SSO 認證失敗

1. 檢查 Azure Portal 中的應用程式設定
2. 確認 Redirect URI 已正確設定
3. 檢查 Teams 應用程式 manifest.json 中的 webApplicationInfo

### 無法取得使用者資訊

1. 檢查 API 權限是否已授與
2. 確認 Token 是否有效
3. 查看瀏覽器控制台的錯誤訊息

