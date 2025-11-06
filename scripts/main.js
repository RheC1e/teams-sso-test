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

// 使用 Teams SSO 登入
async function authenticateWithSSO() {
  try {
    console.log('開始 Teams SSO 認證...');
    
    // 取得 SSO Token
    const token = await microsoftTeams.authentication.getAuthToken({
      resources: ['api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d'],
      silent: false
    });
    
    console.log('SSO Token 取得成功');

    // 使用 Token 取得使用者資訊
    await fetchUserInfo(token);
  } catch (error) {
    console.error('SSO 認證失敗:', error);
    
    // 如果 SSO 失敗，嘗試使用 MSAL（在 Teams 中必須使用 popup）
    if (error.errorCode === 'UserConsentRequired' || error.errorCode === 'InvalidResource') {
      console.log('SSO 失敗，改用 MSAL Popup 登入（Teams iframe 環境）...');
      await authenticateWithMSALPopup();
    } else {
      showError('SSO 認證失敗：' + error.message);
    }
  }
}

// 使用 MSAL Popup 登入（Teams iframe 環境必須使用 popup）
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

