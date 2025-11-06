# Teams 桌面版認證修復

## 🔧 問題

- **網頁版 Teams：** 需要允許彈出視窗才能登入
- **桌面版 Teams：** 無法開啟彈窗，登入失敗

## ✅ 解決方案

### 使用 Teams 內建認證視窗（不需要瀏覽器 popup）

已改為使用 `microsoftTeams.authentication.authenticate()` API，這個方法：
- ✅ 使用 Teams 內建的認證視窗（不是瀏覽器 popup）
- ✅ 在桌面版和網頁版都可以工作
- ✅ 不需要使用者允許彈出視窗
- ✅ 更好的使用者體驗

### 認證流程

1. **優先嘗試 Silent Token**（不需要使用者互動）
   - 如果使用者之前已授權，可以直接取得 token

2. **使用 Teams authentication.authenticate()**（Teams 內建視窗）
   - 開啟 Teams 內建的認證視窗
   - 不是瀏覽器 popup，所以桌面版可以正常運作
   - 使用者完成認證後，視窗會自動關閉並回傳 token

3. **備用方案：getAuthToken**（Teams 內建視窗）
   - 如果 authentication.authenticate() 失敗，使用 getAuthToken
   - 也會使用 Teams 內建視窗，不是瀏覽器 popup

4. **最後備用：MSAL Silent**
   - 如果使用者之前已登入過，嘗試 silent token

## 📋 新增檔案

### auth.html
- Teams 認證專用頁面
- 使用 MSAL 進行認證
- 在 Teams 內建視窗中執行
- 認證完成後回傳 token 給主應用程式

## 🔄 部署後測試

### 桌面版 Teams

1. **重新載入應用程式**
   - 在 Teams 中重新開啟應用程式
   - 或重新啟動 Teams

2. **測試登入**
   - 應該會開啟 Teams 內建的認證視窗（不是瀏覽器 popup）
   - 完成認證後視窗會自動關閉
   - 應該會顯示使用者資訊

### 網頁版 Teams

1. **清除快取**
   - 清除瀏覽器快取
   - 重新載入 Teams

2. **測試登入**
   - 應該會開啟 Teams 內建的認證視窗
   - 不需要允許瀏覽器彈出視窗
   - 完成認證後應該會顯示使用者資訊

## 🆘 如果還有問題

### 檢查項目

1. **Vercel 部署**
   - 確認 `auth.html` 已部署
   - 確認可以訪問：`https://teams-sso-test-rho.vercel.app/auth.html`

2. **Teams 應用程式**
   - 確認應用程式已重新載入
   - 確認使用的是最新版本

3. **控制台日誌**
   - 開啟開發者工具（F12）
   - 查看認證流程的日誌
   - 確認使用的是哪個認證方法

### 常見錯誤

#### "authentication.authenticate() 失敗"
- 確認 `auth.html` 已正確部署
- 確認 URL 可以正常訪問
- 檢查控制台的錯誤訊息

#### "Silent token 失敗"
- 這是正常的，如果使用者第一次使用
- 會自動使用 Teams 內建視窗進行認證

#### "無法取得使用者資訊"
- 確認 API 權限已授與
- 確認 Token 有效
- 檢查 Microsoft Graph API 的錯誤訊息

## 💡 優勢

### 使用 Teams 內建視窗的優點

1. **不需要允許彈出視窗**
   - 桌面版和網頁版都可以正常運作
   - 更好的使用者體驗

2. **更安全**
   - 使用 Teams 的認證機制
   - 不會被瀏覽器 popup blocker 阻擋

3. **更一致**
   - 所有 Teams 應用程式使用相同的認證流程
   - 使用者體驗一致

