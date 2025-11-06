# 無彈窗認證解決方案

## ✅ 已完成的改進

### 1. 完全移除 Popup 和 Redirect
- ❌ 移除所有 `loginPopup()` 調用
- ❌ 移除所有 `loginRedirect()` 調用
- ❌ 移除所有 `authentication.authenticate()` 調用（可能開啟新視窗）
- ✅ 統一使用 `getAuthToken()`（Teams 內建視窗，同頁面認證）

### 2. 統一認證流程
無論是桌面版還是網頁版 Teams，都使用相同的認證流程：

1. **優先嘗試 Silent Token**（不需要使用者互動）
   - 如果使用者之前已授權，會自動取得 token

2. **使用 getAuthToken**（Teams 內建視窗）
   - 會顯示 Teams 內建的認證視窗
   - **不是瀏覽器 popup**
   - **不是新分頁**
   - **在同頁面完成認證**

### 3. 錯誤處理
- 不再回退到 popup 或 redirect
- 直接顯示清晰的錯誤訊息
- 提供具體的錯誤代碼和解決建議

## 🎯 預期行為

### 桌面版 Teams
1. 開啟應用程式
2. 自動嘗試 Silent Token（如果已授權）
3. 如果需要授權，會顯示 Teams 內建的認證視窗（不是瀏覽器 popup）
4. 完成認證後，視窗關閉，在同頁面顯示使用者資訊
5. **不會有彈窗錯誤**

### 網頁版 Teams
1. 開啟應用程式
2. 自動嘗試 Silent Token（如果已授權）
3. 如果需要授權，會顯示 Teams 內建的認證視窗（不是瀏覽器 popup）
4. 完成認證後，視窗關閉，在同頁面顯示使用者資訊
5. **不會有新分頁或彈窗**

## 🔍 如果仍然有問題

### 檢查項目

1. **Azure Portal 設定**
   - 確認資源 URI：`api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d`
   - 確認與 `manifest.json` 中的 `webApplicationInfo.resource` 完全一致

2. **應用程式權限**
   - 確認所有必要的 API 權限都已授與
   - 確認管理員已同意所有權限

3. **控制台日誌**
   - 開啟開發者工具（`Ctrl+Shift+I` 或 `Cmd+Option+I`）
   - 查看認證流程的日誌
   - 確認使用的是 `getAuthToken`，而不是 popup 或 redirect

### 常見錯誤

#### `UserConsentRequired`
- **含義：** 需要使用者授權
- **解決：** 點擊 Teams 內建視窗中的「允許」按鈕

#### `InvalidResource`
- **含義：** 資源 URI 不正確
- **解決：** 檢查 Azure Portal 中的資源 URI 設定

#### `InvalidGrant`
- **含義：** 授權無效
- **解決：** 重新授權應用程式

## 📋 技術細節

### 為什麼 `getAuthToken` 不會有彈窗？

`getAuthToken` 是 Teams SDK 提供的 API，它會：
1. 使用 Teams 內建的認證機制
2. 在 Teams 應用程式內部顯示認證視窗（不是瀏覽器 popup）
3. 完成認證後，視窗自動關閉
4. 在同頁面返回 token

### 為什麼移除 `authentication.authenticate()`？

雖然 `authentication.authenticate()` 也是 Teams 內建 API，但它：
1. 可能會開啟新視窗（在某些情況下）
2. 在桌面版可能不支援
3. 體驗不如 `getAuthToken` 流暢

### 為什麼移除 MSAL Popup/Redirect？

1. **Popup：** 在桌面版不支援，在網頁版需要允許彈窗
2. **Redirect：** 會跳轉到新頁面，體驗不佳
3. **兩者都不符合「同頁面認證」的需求**

## 🚀 部署後測試

1. **等待 Vercel 部署完成**（約 1-2 分鐘）

2. **桌面版測試**
   - 重新載入 Teams 應用程式
   - 開啟應用程式
   - 應該會看到 Teams 內建認證視窗（不是瀏覽器 popup）
   - 完成認證後，應該在同頁面顯示使用者資訊

3. **網頁版測試**
   - 清除瀏覽器快取
   - 重新載入 Teams
   - 開啟應用程式
   - 應該會看到 Teams 內建認證視窗（不是瀏覽器 popup）
   - 完成認證後，應該在同頁面顯示使用者資訊
   - **不應該有新分頁或彈窗**

## 💡 優勢

1. **一致的體驗：** 桌面版和網頁版使用相同的認證流程
2. **無彈窗：** 完全避免瀏覽器 popup 問題
3. **同頁面：** 認證完成後，使用者資訊顯示在同一頁面
4. **更好的錯誤處理：** 清晰的錯誤訊息和解決建議

