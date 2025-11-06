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

    // 檢查是否在 Teams 中執行
    if (teamsContext.app.host.name === 'Teams') {
      console.log('在 Teams 中執行，開始 SSO 登入...');
      // 在 Teams 中，優先使用 SSO，失敗則使用 Popup（不能使用 redirect）
      await authenticateWithSSO();
    } else {
      console.log('不在 Teams 中執行，檢查是否在 iframe 中...');
      // 檢查是否在 iframe 中
      if (window.self !== window.top) {
        console.log('在 iframe 中，使用 Popup 登入...');
        await authenticateWithMSALPopup();
      } else {
        console.log('在一般網頁中，使用 Redirect 登入...');
        await authenticateWithMSAL();
      }
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
    
    // 方法 1: 嘗試 silent token（不需要使用者互動）
    try {
      const token = await microsoftTeams.authentication.getAuthToken({
        resources: ['api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d'],
        silent: true // 先嘗試 silent，不需要彈窗
      });
      
      console.log('SSO Silent Token 取得成功');
      await fetchUserInfo(token);
      return;
    } catch (silentError) {
      console.log('Silent token 失敗:', silentError);
      console.log('錯誤代碼:', silentError.errorCode);
    }
    
    // 方法 2: 僅在非桌面版使用 authentication.authenticate()
    // 桌面版可能不支援此 API，所以跳過
    if (!isDesktop) {
      try {
        const authUrl = `${window.location.origin}/auth.html?clientId=33abd69a-d012-498a-bddb-8608cbf10c2d&tenantId=cd4e36bd-ac9a-4236-9f91-a6718b6b5e45`;
        
        console.log('使用 Teams authentication.authenticate()（僅網頁版），URL:', authUrl);
        
        const result = await microsoftTeams.authentication.authenticate({
          url: authUrl,
          width: 600,
          height: 535
        });
        
        console.log('Teams authentication.authenticate() 成功，結果:', result);
        
        // result 應該包含 token（字串）
        if (result && typeof result === 'string') {
          await fetchUserInfo(result);
          return;
        } else if (result && result.accessToken) {
          await fetchUserInfo(result.accessToken);
          return;
        } else {
          console.warn('authentication.authenticate() 返回的結果格式不預期:', result);
        }
      } catch (authError) {
        console.log('authentication.authenticate() 失敗，改用 getAuthToken...', authError);
      }
    } else {
      console.log('桌面版跳過 authentication.authenticate()，直接使用 getAuthToken');
    }
    
    // 方法 3: 使用 getAuthToken（需要使用者同意，但使用 Teams 內建視窗，不是 popup）
    // 這個方法在桌面版和網頁版都可以工作
    console.log('使用 getAuthToken（Teams 內建視窗）...');
    const token = await microsoftTeams.authentication.getAuthToken({
      resources: ['api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d'],
      silent: false // 會顯示 Teams 內建的認證視窗，不是瀏覽器 popup
    });
    
    console.log('SSO Token 取得成功');
    await fetchUserInfo(token);
    
  } catch (error) {
    console.error('所有 SSO 方法都失敗:', error);
    console.error('錯誤詳情:', {
      errorCode: error.errorCode,
      message: error.message,
      stack: error.stack
    });
    
    // 最後備用方案：使用 MSAL Silent（如果已登入過）
    try {
      console.log('嘗試使用 MSAL Silent 登入...');
      await authenticateWithMSALSilent();
    } catch (msalError) {
      console.error('MSAL Silent 也失敗:', msalError);
      showError('登入失敗：' + (error.message || error.errorCode || '未知錯誤') + '\n\n請確認已授與應用程式權限，或聯繫系統管理員。\n\n錯誤代碼：' + (error.errorCode || 'N/A'));
    }
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

// 從 SSO Token 取得使用者資訊
async function fetchUserInfo(token) {
  try {
    console.log('取得使用者資訊...');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    userInfo = await response.json();
    console.log('使用者資訊:', userInfo);
    displayUserInfo();
  } catch (error) {
    console.error('取得使用者資訊失敗:', error);
    showError('取得使用者資訊失敗：' + error.message);
  }
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
  // 如果不在 Teams 中，檢查是否在 iframe 中
  window.addEventListener('load', () => {
    if (!window.microsoftTeams) {
      // 檢查是否在 iframe 中
      if (window.self !== window.top) {
        console.log('在 iframe 中，使用 Popup 登入...');
        authenticateWithMSALPopup();
      } else {
        console.log('在一般網頁中，使用 Redirect 登入...');
        authenticateWithMSAL();
      }
    } else {
      init();
    }
  });
}

