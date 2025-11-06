# Teams 桌面版認證問題排查

## 🔍 問題描述

- **網頁版 Teams：** ✅ 可以正常運作（允許彈窗後）
- **桌面版 Teams：** ❌ 仍然無法運作

## 🔧 已實施的修復

### 1. 跳過 `authentication.authenticate()`（桌面版）
- 桌面版可能不支援此 API
- 現在僅在網頁版使用 `authentication.authenticate()`
- 桌面版直接使用 `getAuthToken`

### 2. 優先使用 Silent Token
- 如果使用者之前已授權，會自動取得 token
- 不需要任何使用者互動

### 3. 使用 `getAuthToken`（Teams 內建視窗）
- 這是最可靠的方法，在桌面版和網頁版都可以工作
- 會顯示 Teams 內建的認證視窗（不是瀏覽器 popup）

## 🐛 可能的原因

### 1. Azure AD 應用程式註冊問題

#### 檢查項目：
1. **資源 URI 是否正確**
   - 應該在 Azure Portal 中設定為：`api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d`
   - 必須與 `manifest.json` 中的 `webApplicationInfo.resource` 完全一致

2. **API 權限是否已授與**
   - 確認所有必要的權限都已授與
   - 確認管理員已同意所有權限

3. **重新導向 URI**
   - 確認已新增 `https://teams-sso-test-rho.vercel.app` 作為 SPA Redirect URI

### 2. Teams 應用程式設定問題

#### 檢查項目：
1. **manifest.json 中的資源 URI**
   ```json
   "webApplicationInfo": {
     "id": "33abd69a-d012-498a-bddb-8608cbf10c2d",
     "resource": "api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d"
   }
   ```

2. **有效網域**
   ```json
   "validDomains": [
     "teams-sso-test-rho.vercel.app",
     "*.vercel.app"
   ]
   ```

### 3. 桌面版特定問題

#### 可能的原因：
1. **Teams 桌面版快取問題**
   - 清除 Teams 快取
   - 重新啟動 Teams

2. **應用程式未正確更新**
   - 重新上傳應用程式到 Teams
   - 確認使用最新版本

3. **權限未正確授與**
   - 在桌面版中，可能需要重新授權
   - 檢查是否出現授權提示

## 🔍 除錯步驟

### 步驟 1: 檢查控制台日誌

1. **在 Teams 桌面版中開啟開發者工具**
   - 按 `Ctrl+Shift+I` (Windows) 或 `Cmd+Option+I` (Mac)
   - 或右鍵點擊應用程式，選擇「檢查元素」

2. **查看控制台輸出**
   - 應該會看到：
     - `開始 Teams SSO 認證...`
     - `Teams 上下文: ...`
     - `User Agent: ...`
     - `是否為桌面版: true/false`
     - `Silent token 失敗: ...`
     - `使用 getAuthToken（Teams 內建視窗）...`

3. **記錄錯誤訊息**
   - 複製完整的錯誤訊息
   - 特別注意 `errorCode` 和 `message`

### 步驟 2: 檢查 Azure Portal 設定

1. **登入 Azure Portal**
   - https://portal.azure.com

2. **導航到應用程式註冊**
   - Azure Active Directory > 應用程式註冊
   - 找到應用程式：`33abd69a-d012-498a-bddb-8608cbf10c2d`

3. **檢查「公開 API」設定**
   - 確認「應用程式識別碼 URI」已設定
   - 確認「範圍」已新增並授與

4. **檢查「驗證」設定**
   - 確認已新增 SPA Redirect URI：`https://teams-sso-test-rho.vercel.app`

### 步驟 3: 測試 Silent Token

如果 Silent Token 失敗，檢查錯誤代碼：

- **`UserConsentRequired`**: 需要使用者授權（正常，會繼續使用 `getAuthToken`）
- **`InvalidResource`**: 資源 URI 不正確（需要檢查 Azure Portal 設定）
- **`InvalidGrant`**: 授權無效（可能需要重新授權）

### 步驟 4: 測試 getAuthToken

如果 `getAuthToken` 失敗，檢查：

1. **是否出現 Teams 內建認證視窗**
   - 應該會看到 Teams 的授權視窗（不是瀏覽器 popup）
   - 如果沒有出現，可能是權限問題

2. **錯誤訊息**
   - 記錄完整的錯誤訊息
   - 特別注意 `errorCode`

## 💡 可能的解決方案

### 方案 1: 重新授權

1. **在 Teams 中移除應用程式**
2. **重新上傳應用程式**
3. **重新授權**

### 方案 2: 檢查資源 URI

確認 Azure Portal 中的資源 URI 與 `manifest.json` 完全一致：

```
api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d
```

### 方案 3: 清除 Teams 快取

**Windows:**
1. 關閉 Teams
2. 刪除 `%appdata%\Microsoft\Teams` 資料夾
3. 重新啟動 Teams

**Mac:**
1. 關閉 Teams
2. 刪除 `~/Library/Application Support/Microsoft/Teams` 資料夾
3. 重新啟動 Teams

### 方案 4: 檢查 Teams 版本

確認使用最新版本的 Teams 桌面版。

## 📋 需要提供的資訊

如果問題仍然存在，請提供：

1. **控制台完整日誌**
   - 從應用程式啟動到錯誤發生的所有日誌

2. **錯誤訊息**
   - 完整的錯誤訊息和錯誤代碼

3. **Teams 版本**
   - Teams 桌面版的版本號

4. **Azure Portal 設定截圖**
   - 「公開 API」設定
   - 「驗證」設定中的 Redirect URI

5. **manifest.json**
   - 確認 `webApplicationInfo.resource` 的值

## 🔄 下一步

1. **測試最新版本**
   - 等待 Vercel 部署完成
   - 重新載入 Teams 應用程式
   - 查看控制台日誌

2. **記錄錯誤**
   - 如果仍然失敗，記錄完整的錯誤訊息
   - 特別注意 `errorCode`

3. **檢查 Azure Portal**
   - 確認所有設定都正確
   - 確認資源 URI 完全一致

