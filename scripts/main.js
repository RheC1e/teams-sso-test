// Teams SSO 測試應用程式

let teamsContext = null;
let userInfo = null;

// 初始化 Teams SDK
async function init() {
  try {
    console.log('初始化 Teams SDK...');
    
    // 等待 Teams SDK 載入
    await microsoftTeams.app.initialize();
    console.log('Teams SDK 初始化成功');

    // 取得 Teams 上下文
    teamsContext = await microsoftTeams.app.getContext();
    console.log('Teams 上下文:', teamsContext);
    console.log('User Agent:', navigator.userAgent);
    console.log('是否在 iframe 中:', window.self !== window.top);

    // 檢查是否在 Teams 中執行（桌面版和網頁版都應該在 Teams 中）
    // 只要 Teams SDK 可用，就使用 Teams SSO（getAuthToken）
    if (teamsContext && teamsContext.app && teamsContext.app.host) {
      console.log('在 Teams 中執行（桌面版或網頁版），使用 Teams SSO...');
      
      // 防止重複執行認證（避免死循環）
      if (window.isAuthenticating) {
        console.log('認證正在進行中，跳過重複執行...');
        return;
      }
      
      window.isAuthenticating = true;
      
      try {
        // 在 Teams 中（無論桌面版還是網頁版），都使用 getAuthToken
        // 這會使用 Teams 內建視窗，不會有 popup 或 redirect
        await authenticateWithSSO();
      } finally {
        // 認證完成後，清除標記（但延遲一下，避免立即重複）
        setTimeout(() => {
          window.isAuthenticating = false;
        }, 2000);
      }
    } else {
      console.log('不在 Teams 中執行，無法使用 Teams SSO');
      showError('此應用程式必須在 Microsoft Teams 中執行。');
    }
  } catch (error) {
    console.error('初始化失敗:', error);
    showError('初始化失敗：' + error.message);
  }
}

// 檢測是否為 Teams 桌面版
function isTeamsDesktop() {
  try {
    // 方法 1: 檢查 userAgent（最可靠）
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('Electron')) {
      console.log('檢測到 Electron（桌面版）');
      return true;
    }
    
    // 方法 2: 檢查 Teams 上下文
    if (teamsContext && teamsContext.app && teamsContext.app.host) {
      const hostName = teamsContext.app.host.name;
      console.log('Teams Host:', hostName);
      // 桌面版通常是 'Teams'，網頁版可能是 'Teams' 或其他
      // 但這不是完全可靠的判斷方式
    }
    
    // 方法 3: 檢查是否在 iframe 中
    // 桌面版通常不在 iframe 中（window.self === window.top）
    // 但這也不完全可靠，因為網頁版也可能不在 iframe 中
    
    return false;
  } catch (error) {
    console.error('檢測桌面版時發生錯誤:', error);
    return false;
  }
}

// 使用 Teams SSO 登入（不使用 popup）
async function authenticateWithSSO() {
  try {
    console.log('開始 Teams SSO 認證...');
    console.log('Teams 上下文:', teamsContext);
    
    // 檢測是否為桌面版
    const isDesktop = isTeamsDesktop();
    console.log('是否為桌面版:', isDesktop);
    
    // 方法 1: 嘗試取得 Microsoft Graph token（silent，不需要使用者互動）
    try {
      console.log('嘗試取得 Microsoft Graph Token (Silent)...');
      
      // 使用 Microsoft Graph 作為資源來取得 Graph token
      const graphToken = await microsoftTeams.authentication.getAuthToken({
        resources: ['https://graph.microsoft.com'],
        silent: true // 先嘗試 silent，不需要彈窗
      });
      
      console.log('Microsoft Graph Silent Token 取得成功');
      // 使用 Graph token 取得使用者資訊（驗證登入）
      await fetchUserInfoFromGraph(graphToken);
      return;
    } catch (silentError) {
      console.log('Silent token 失敗:', silentError);
      console.log('錯誤代碼:', silentError.errorCode);
      console.log('錯誤訊息:', silentError.message);
      
      // 如果是 UserConsentRequired，繼續到下一步要求授權
      if (silentError.errorCode !== 'UserConsentRequired') {
        // 其他錯誤可能是配置問題，記錄詳細資訊
        console.error('Silent token 失敗詳情:', {
          errorCode: silentError.errorCode,
          message: silentError.message,
          stack: silentError.stack
        });
      }
    }
    
    // 方法 2: 使用 getAuthToken 取得 Microsoft Graph token（需要使用者同意，但使用 Teams 內建視窗，不是 popup）
    // 這個方法在桌面版和網頁版都可以工作，且都在同頁面完成認證
    console.log('使用 getAuthToken 取得 Microsoft Graph Token（Teams 內建視窗，同頁面認證）...');
    
    try {
      // 使用 Microsoft Graph 作為資源來取得 Graph token
      const graphToken = await microsoftTeams.authentication.getAuthToken({
        resources: ['https://graph.microsoft.com'],
        silent: false // 會顯示 Teams 內建的認證視窗，不是瀏覽器 popup，且在同頁面完成
      });
      
      console.log('Microsoft Graph Token 取得成功');
      // 使用 Graph token 取得使用者資訊（驗證登入）
      await fetchUserInfoFromGraph(graphToken);
    } catch (getTokenError) {
      console.error('getAuthToken 失敗:', getTokenError);
      console.error('錯誤代碼:', getTokenError.errorCode);
      console.error('錯誤訊息:', getTokenError.message);
      
      // 重新拋出錯誤，讓外層的 catch 處理
      throw getTokenError;
    }
    
  } catch (error) {
    console.error('Teams SSO 認證失敗:', error);
    console.error('錯誤詳情:', {
      errorCode: error.errorCode,
      message: error.message,
      stack: error.stack
    });
    
    // 不回退到 popup 或 redirect，直接顯示錯誤
    // 這樣可以確保不會有彈窗或新分頁
    let errorMessage = '登入失敗：';
    
    if (error.errorCode === 'UserConsentRequired') {
      errorMessage += '需要使用者授權。請點擊「允許」按鈕以繼續。';
    } else if (error.errorCode === 'InvalidResource') {
      errorMessage += '應用程式設定錯誤。請聯繫系統管理員檢查 Azure Portal 中的資源 URI 設定。';
    } else if (error.errorCode === 'InvalidGrant') {
      errorMessage += '授權無效。請重新授權應用程式。';
    } else {
      errorMessage += error.message || error.errorCode || '未知錯誤';
    }
    
    errorMessage += '\n\n錯誤代碼：' + (error.errorCode || 'N/A');
    errorMessage += '\n\n請確認已授與應用程式權限，或聯繫系統管理員。';
    
    showError(errorMessage);
  }
}

// 使用 MSAL Silent 登入（不需要 popup，適合 Teams 桌面版）
async function authenticateWithMSALSilent() {
  try {
    console.log('開始 MSAL Silent 登入（不需要 popup）...');
    
    const { PublicClientApplication } = await import('@azure/msal-browser');
    
    const msalConfig = {
      auth: {
        clientId: '33abd69a-d012-498a-bddb-8608cbf10c2d',
        authority: 'https://login.microsoftonline.com/cd4e36bd-ac9a-4236-9f91-a6718b6b5e45',
        redirectUri: window.location.origin
      },
      system: {
        allowNativeBroker: false
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // 檢查是否已登入
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      // 嘗試 silent token（不需要使用者互動）
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      await fetchUserInfoFromMSAL(tokenResponse.accessToken);
      return;
    }
    
    // 如果沒有已登入的帳號，無法使用 silent
    throw new Error('沒有已登入的帳號，無法使用 silent 登入');
  } catch (error) {
    console.error('MSAL Silent 登入失敗:', error);
    throw error; // 重新拋出錯誤，讓上層處理
  }
}

// 使用 MSAL Popup 登入（僅在網頁版 Teams 且允許 popup 時使用）
async function authenticateWithMSALPopup() {
  try {
    console.log('開始 MSAL Popup 登入（Teams iframe 環境）...');
    
    const { PublicClientApplication } = await import('@azure/msal-browser');
    
    const msalConfig = {
      auth: {
        clientId: '33abd69a-d012-498a-bddb-8608cbf10c2d',
        authority: 'https://login.microsoftonline.com/cd4e36bd-ac9a-4236-9f91-a6718b6b5e45',
        redirectUri: window.location.origin
      },
      system: {
        // 在 iframe 中允許 popup
        allowNativeBroker: false
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // 檢查是否已登入
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: accounts[0]
        });
        await fetchUserInfoFromMSAL(tokenResponse.accessToken);
        return;
      } catch (silentError) {
        console.log('Silent token 取得失敗，使用 popup:', silentError);
      }
    }
    
    // 在 Teams iframe 中必須使用 popup，不能使用 redirect
    const response = await msalInstance.loginPopup({
      scopes: ['User.Read']
    });
    
    await fetchUserInfoFromMSAL(response.accessToken);
  } catch (error) {
    console.error('MSAL Popup 登入失敗:', error);
    showError('登入失敗：' + error.message + '\n\n在 Teams 中必須使用 Popup 登入，請允許彈出視窗。');
  }
}

// 使用 MSAL 登入（一般網頁環境，使用 redirect）
async function authenticateWithMSAL() {
  try {
    console.log('開始 MSAL 登入（一般網頁環境）...');
    
    const { PublicClientApplication } = await import('@azure/msal-browser');
    
    const msalConfig = {
      auth: {
        clientId: '33abd69a-d012-498a-bddb-8608cbf10c2d',
        authority: 'https://login.microsoftonline.com/cd4e36bd-ac9a-4236-9f91-a6718b6b5e45',
        redirectUri: window.location.origin
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // 處理 redirect callback
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      await fetchUserInfoFromMSAL(response.accessToken);
      return;
    }

    // 檢查是否已登入
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      await fetchUserInfoFromMSAL(tokenResponse.accessToken);
    } else {
      // 需要登入（一般網頁使用 redirect）
      await msalInstance.loginRedirect({
        scopes: ['User.Read']
      });
    }
  } catch (error) {
    console.error('MSAL 登入失敗:', error);
    showError('登入失敗：' + error.message);
  }
}

// 從 Microsoft Graph API 取得使用者資訊（驗證登入）
async function fetchUserInfoFromGraph(graphToken) {
  try {
    console.log('從 Microsoft Graph API 取得使用者資訊（驗證登入）...');
    console.log('Token 前 20 個字元:', graphToken.substring(0, 20) + '...');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${graphToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Graph API 回應:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    userInfo = await response.json();
    console.log('從 Graph API 取得的使用者資訊（驗證成功）:', userInfo);
    displayUserInfo();
  } catch (error) {
    console.error('從 Graph API 取得使用者資訊失敗:', error);
    showError('取得使用者資訊失敗：' + error.message + '\n\n這表示 Microsoft 365 登入驗證失敗。');
  }
}

// 從 SSO Token 取得使用者資訊（保留向後兼容）
async function fetchUserInfo(token) {
  // 使用 Graph token 取得使用者資訊
  await fetchUserInfoFromGraph(token);
}

// 從 MSAL Token 取得使用者資訊
async function fetchUserInfoFromMSAL(token) {
  await fetchUserInfo(token);
}

// 顯示使用者資訊
function displayUserInfo() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  
  loading.style.display = 'none';
  content.style.display = 'block';

  // 顯示名稱
  document.getElementById('display-name').textContent = 
    userInfo.displayName || userInfo.userPrincipalName || '-';

  // 信箱
  document.getElementById('email').textContent = 
    userInfo.mail || userInfo.userPrincipalName || '-';

  // 姓名（姓 + 名）
  const fullName = [];
  if (userInfo.surname) fullName.push(userInfo.surname);
  if (userInfo.givenName) fullName.push(userInfo.givenName);
  document.getElementById('full-name').textContent = 
    fullName.length > 0 ? fullName.join(' ') : userInfo.displayName || '-';

  // 使用者 ID
  document.getElementById('user-id').textContent = 
    userInfo.id || userInfo.userPrincipalName || '-';
}

// 顯示錯誤
function showError(message) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  
  loading.style.display = 'none';
  error.style.display = 'block';
  error.textContent = message;
}

// 啟動應用程式
// 等待 Teams SDK 載入
if (window.microsoftTeams) {
  init();
} else {
  // 如果 Teams SDK 未載入，等待載入
  window.addEventListener('load', () => {
    if (window.microsoftTeams) {
      init();
    } else {
      // 如果 Teams SDK 仍然不可用，顯示錯誤
      console.error('Teams SDK 未載入');
      showError('此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式。');
    }
  });
}

