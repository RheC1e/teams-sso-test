# 修復說明

## ✅ 已修復的問題

### 1. Teams SSO 錯誤：redirect_in_iframe

**問題：**
- Teams 應用程式在 iframe 中執行
- MSAL 的 `loginRedirect` 在 iframe 中不支援
- 錯誤訊息：`redirect_in_iframe: Redirects are not supported for iframed or brokered applications`

**解決方案：**
- 在 Teams 環境中使用 `loginPopup` 而非 `loginRedirect`
- 新增 `authenticateWithMSALPopup()` 函數專門處理 Teams iframe 環境
- 一般網頁環境仍使用 `loginRedirect`（更好的使用者體驗）

**修改檔案：**
- `scripts/main.js` - 新增 popup 登入邏輯

### 2. PDF 匯出失敗：jsPDF 模組 404 錯誤

**問題：**
- 動態載入的 jsPDF 模組路徑不正確
- Vite 打包後的路徑與實際部署路徑不一致
- 錯誤訊息：`Failed to fetch dynamically imported module`

**解決方案：**
- 改用 CDN 載入 jsPDF（更可靠）
- 在 HTML 中預先載入 jsPDF CDN
- 備用方案：如果 CDN 失敗，仍嘗試使用 npm 套件

**修改檔案：**
- `index.html` - 新增 jsPDF CDN 載入
- `scripts/main.js` - 改善 PDF 匯出邏輯

### 3. Resource URI 更新

**問題：**
- manifest.json 中的 resource URI 使用舊網址

**解決方案：**
- 更新為正確的 Vercel 網址：`api://teams-sso-test-rho.vercel.app/...`

**修改檔案：**
- `manifest.json` - 更新 resource URI

## 📋 測試步驟

### Teams SSO 測試

1. **重新上傳 Teams 應用程式：**
   - 使用更新後的 `teams-sso-test.zip`
   - 在 Teams 中上傳並安裝

2. **測試登入：**
   - 開啟 Teams 應用程式
   - 應該會自動使用 SSO 或 Popup 登入
   - 如果出現 Popup，請允許彈出視窗

3. **確認顯示：**
   - 應該會顯示您的使用者資訊
   - 顯示名稱、信箱、姓名、使用者 ID

### PDF 匯出測試

1. **清除快取：**
   - 使用 `Cmd + Shift + R` 強制重新整理

2. **測試匯出：**
   - 新增一些請款項目
   - 點擊「匯出 PDF」
   - 應該會成功下載 PDF

3. **檢查控制台：**
   - 應該會看到 "jsPDF 已從 CDN 載入" 的訊息

## 🔧 Azure Portal 設定

### 需要更新的設定

1. **Application ID URI：**
   - 前往 Azure Portal → 應用程式註冊 → RHEMA 請款系統
   - 點擊「公開 API」
   - 確認 Application ID URI 為：`api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d`

2. **Redirect URI：**
   - 前往「驗證」
   - 確認已新增：`https://teams-sso-test-rho.vercel.app`

## 📝 注意事項

### Teams 環境

- **Popup 登入：** 在 Teams 中必須使用 popup，不能使用 redirect
- **彈出視窗：** 請確保瀏覽器允許彈出視窗
- **SSO 優先：** 系統會先嘗試 SSO，失敗後才使用 Popup

### PDF 匯出

- **CDN 載入：** 優先使用 CDN，更可靠
- **網路需求：** 需要網路連線才能載入 CDN
- **備用方案：** 如果 CDN 失敗，會嘗試使用 npm 套件

## 🆘 如果還有問題

### Teams SSO 仍然失敗

1. 檢查 Azure Portal 中的 Application ID URI
2. 確認 manifest.json 中的 resource URI 正確
3. 檢查瀏覽器是否允許彈出視窗
4. 查看控制台的錯誤訊息

### PDF 仍然無法匯出

1. 檢查網路連線
2. 確認 CDN 可以訪問
3. 查看控制台的錯誤訊息
4. 嘗試清除瀏覽器快取

