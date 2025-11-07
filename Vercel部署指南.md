# Vercel 部署指南

## 🚀 方法一：使用 Vercel 網站 Import 功能（推薦）

這是最簡單的方式，直接從 GitHub 匯入專案並自動部署。

### 步驟

1. **前往 Vercel 新增專案頁面**
   - 訪問：https://vercel.com/new
   - 使用您的帳號登入：rhemaluis125@gmail.com

2. **連接到 GitHub**
   - 如果還沒連接，點擊「Continue with GitHub」
   - 授權 Vercel 訪問您的 GitHub 帳號

3. **選擇專案**
   - 在倉庫列表中，找到 `RheC1e/teams-sso-test`
   - 點擊「Import」

4. **配置專案設定**
   - **Project Name**：teams-sso-test（或保持預設）
   - **Framework Preset**：Vite（應該會自動偵測）
   - **Root Directory**：`./`（根目錄）
   - **Build Command**：`npm run build`（應該已自動填寫）
   - **Output Directory**：`dist`（應該已自動填寫）
   - **Install Command**：`npm install`（應該已自動填寫）

5. **環境變數（如果需要）**
   - 目前專案不需要環境變數，可以直接跳過

6. **部署**
   - 點擊「Deploy」按鈕
   - 等待部署完成（通常需要 1-2 分鐘）

7. **取得部署 URL**
   - 部署完成後，Vercel 會提供一個 URL
   - 應該是：`https://teams-sso-test-rho.vercel.app` 或類似
   - 記下這個 URL

8. **更新 manifest.json（如果需要）**
   - 如果部署 URL 與 manifest.json 中的 URL 不同
   - 需要更新 manifest.json 中的相關 URL
   - 然後重新生成 Teams 應用程式包

---

## 🛠️ 方法二：使用 Vercel CLI

如果您偏好使用命令行工具。

### 前置需求

1. **安裝 Vercel CLI**（如果還沒安裝）
   ```bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
   npm install -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```
   - 會打開瀏覽器，使用 rhemaluis125@gmail.com 登入

### 部署步驟

1. **進入專案目錄**
   ```bash
   cd "/Users/chenyayueh/Documents/Cursor AI/teamsApp-test"
   ```

2. **載入 Node.js 環境**
   ```bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
   ```

3. **部署到生產環境**
   ```bash
   vercel --prod
   ```

4. **按照提示操作**
   - 如果是第一次部署，會詢問專案設定
   - 選擇預設值即可
   - 等待部署完成

---

## ✅ 部署後檢查

### 1. 檢查部署狀態
- 前往 Vercel Dashboard：https://vercel.com/ivans-projects-0e89bacc
- 找到 `teams-sso-test` 專案
- 確認部署狀態為「Ready」

### 2. 測試應用程式
- 訪問部署 URL（例如：https://teams-sso-test-rho.vercel.app）
- 應該能看到應用程式正常載入

### 3. 檢查 Teams 應用程式
- 確保 `manifest.json` 中的 URL 與實際部署 URL 一致
- 如果不一致，更新 manifest.json 並重新生成 Teams 應用程式包

---

## 🔄 自動部署

### GitHub 連動自動部署

當您使用 Vercel 網站 Import 功能時，Vercel 會自動：
- ✅ 監聽 GitHub 倉庫的變更
- ✅ 當您推送新代碼到 GitHub 時，自動觸發部署
- ✅ 自動執行 `npm install` 和 `npm run build`

### 手動觸發部署

如果需要手動觸發部署：
- 在 Vercel Dashboard 中，點擊專案
- 點擊「Redeploy」按鈕

---

## 📝 注意事項

1. **首次部署**
   - 需要授權 Vercel 訪問 GitHub 倉庫
   - 部署時間可能需要 1-2 分鐘

2. **URL 變更**
   - 如果部署 URL 與預期不同，需要更新 manifest.json
   - 也需要更新 Azure AD 應用程式註冊中的相關設定

3. **環境變數**
   - 目前專案不需要環境變數
   - 如果需要，可以在 Vercel Dashboard 的「Settings」>「Environment Variables」中添加

4. **建置設定**
   - Vercel 會自動偵測 Vite 專案
   - 建置命令和輸出目錄應該已經正確設定

---

## 🐛 疑難排解

### 問題：部署失敗

**可能原因：**
1. Node.js 版本不兼容
2. 建置命令錯誤
3. 依賴安裝失敗

**解決方案：**
1. 檢查 Vercel 部署日誌
2. 確認 `package.json` 中的腳本正確
3. 確認所有依賴都已正確安裝

### 問題：URL 無法訪問

**可能原因：**
1. 部署尚未完成
2. 專案設定錯誤

**解決方案：**
1. 等待部署完成
2. 檢查 Vercel Dashboard 中的部署狀態
3. 檢查建置日誌

---

## 🔗 相關連結

- [Vercel Dashboard](https://vercel.com/ivans-projects-0e89bacc)
- [Vercel 新增專案](https://vercel.com/new)
- [Vercel 文檔](https://vercel.com/docs)

