# Teams 應用程式打包指南

## 📦 打包步驟

### 步驟 1: 建立圖示檔案

#### 方式一：使用 Python + Pillow（推薦）

```bash
# 安裝 Pillow
pip3 install Pillow

# 執行建立圖示的 Python 腳本
python3 create-icons.py
```

#### 方式二：使用線上工具

1. 前往：https://www.favicon-generator.org/ 或 https://realfavicongenerator.net/
2. 上傳您的 Logo 或使用文字 "R"
3. 下載 192x192 和 32x32 的圖示
4. 重新命名為：
   - `icon-color.png` (192x192)
   - `icon-outline.png` (32x32)

#### 方式三：使用瀏覽器

1. 開啟 `create-icons.html` 在瀏覽器中
2. 點擊「下載」按鈕下載圖示

### 步驟 2: 確認檔案

確保以下檔案存在：
- ✅ `manifest.json`
- ✅ `icon-color.png` (192x192)
- ✅ `icon-outline.png` (32x32)

### 步驟 3: 打包成 ZIP

#### macOS/Linux

```bash
zip teams-sso-test.zip manifest.json icon-color.png icon-outline.png
```

#### Windows

1. 選取三個檔案
2. 右鍵 → 傳送到 → 壓縮的 (zipped) 資料夾
3. 重新命名為 `teams-sso-test.zip`

### 步驟 4: 驗證 ZIP 檔案

解壓縮 ZIP 檔案，確認包含：
- manifest.json
- icon-color.png
- icon-outline.png

## 📤 上傳到 Teams

1. 開啟 Microsoft Teams
2. 點擊左側「應用程式」（Apps）
3. 點擊「上傳自訂應用程式」（Upload a custom app）
4. 選擇「為您的組織上傳」（Upload for your organization）
5. 選擇 `teams-sso-test.zip`
6. 點擊「新增」（Add）

## ✅ 測試

1. 在 Teams 中開啟應用程式
2. 應該會自動使用 SSO 登入
3. 顯示您的使用者資訊

## 🆘 常見問題

### 圖示顯示不正確

- 確認圖示檔案大小正確（192x192 和 32x32）
- 確認檔案名稱正確（icon-color.png, icon-outline.png）
- 確認圖示格式為 PNG

### 應用程式無法載入

- 確認 manifest.json 中的 URL 正確
- 確認 Vercel 部署成功
- 檢查 Azure Portal 中的 Redirect URI

### SSO 認證失敗

- 確認 Azure Portal 中的應用程式設定
- 確認 manifest.json 中的 webApplicationInfo 正確

