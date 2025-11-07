// Teams SSO 測試應用程式

let teamsContext = null;
let userInfo = null;

// 初始化 Teams SDK
async function init() {
  try {
    console.log('初始化 Teams SDK...');
    console.log('當前 URL:', window.location.href);
    console.log('是否在 iframe 中:', window.self !== window.top);
    console.log('User Agent:', navigator.userAgent);
    
    // 檢查 Teams SDK 是否可用
    if (!window.microsoftTeams) {
      console.warn('Teams SDK 未載入');
      showError('此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式，而不是直接在瀏覽器中打開。');
      return;
    }
    
    // 等待 Teams SDK 載入
    try {
      await microsoftTeams.app.initialize();
      console.log('Teams SDK 初始化成功');
    } catch (initError) {
      console.error('Teams SDK 初始化失敗:', initError);
      console.error('錯誤詳情:', {
        message: initError.message,
        name: initError.name,
        stack: initError.stack
      });
      
      // 檢查是否是 "No Parent window found" 錯誤
      const errorMessage = initError.message || '';
      if (errorMessage.includes('Parent window') || errorMessage.includes('No Parent')) {
        showError('無法連接到 Teams 客戶端。\n\n此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式，而不是直接在瀏覽器中打開。');
      } else if (errorMessage.includes('Initialization Failed')) {
        showError('Teams SDK 初始化失敗。\n\n此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式。');
      } else {
        showError('Teams SDK 初始化失敗：' + initError.message + '\n\n請確認您在 Teams 中開啟此應用程式。');
      }
      return;
    }

    // 取得 Teams 上下文
    try {
      teamsContext = await microsoftTeams.app.getContext();
      console.log('Teams 上下文:', teamsContext);
    } catch (contextError) {
      console.error('取得 Teams 上下文失敗:', contextError);
      showError('無法取得 Teams 上下文：' + contextError.message);
      return;
    }

    // 檢查是否在 Teams 中執行（桌面版和網頁版都應該在 Teams 中）
    // 只要 Teams SDK 可用，就使用 Teams SSO（getAuthToken）
    if (teamsContext && teamsContext.app && teamsContext.app.host) {
      console.log('在 Teams 中執行（桌面版或網頁版），使用 Teams SSO...');
      console.log('Teams Host:', teamsContext.app.host.name);
      
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
      console.log('Teams 上下文:', teamsContext);
      showError('此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式。');
    }
  } catch (error) {
    console.error('初始化失敗:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 提供更友好的錯誤訊息
    let errorMessage = '初始化失敗：';
    if (error.message && error.message.includes('Parent window')) {
      errorMessage = '無法連接到 Teams 客戶端。\n\n此應用程式必須在 Microsoft Teams 中執行。\n\n請在 Teams 中開啟此應用程式，而不是直接在瀏覽器中打開。';
    } else {
      errorMessage += error.message || '未知錯誤';
    }
    
    showError(errorMessage);
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
    
    // 定義應用程式資源 URI（與 manifest.json 中的 webApplicationInfo.resource 一致）
    // Teams SSO 的 getAuthToken 只能取得應用程式自己的 token
    const apiResourceUri = 'api://teams-sso-test-rho.vercel.app/33abd69a-d012-498a-bddb-8608cbf10c2d';
    
    // 步驟 1: 先使用 Teams SSO 取得應用程式 token（驗證 SSO 成功）
    let apiToken = null;
    try {
      console.log('步驟 1: 嘗試取得應用程式 Token (Silent)...');
      console.log('資源 URI:', apiResourceUri);
      
      // 使用應用程式的資源 URI 來取得 token
      apiToken = await microsoftTeams.authentication.getAuthToken({
        resources: [apiResourceUri],
        silent: true // 先嘗試 silent，不需要彈窗
      });
      
      console.log('應用程式 Silent Token 取得成功');
    } catch (silentError) {
      console.log('應用程式 Silent token 失敗:', silentError);
      console.log('錯誤代碼:', silentError.errorCode);
      console.log('錯誤訊息:', silentError.message);
      
      // 如果是 UserConsentRequired，嘗試非 silent 方式
      if (silentError.errorCode === 'UserConsentRequired') {
        console.log('需要使用者授權，嘗試非 silent 方式...');
        try {
          apiToken = await microsoftTeams.authentication.getAuthToken({
            resources: [apiResourceUri],
            silent: false // 會顯示 Teams 內建的認證視窗
          });
          console.log('應用程式 Token 取得成功（需要授權）');
        } catch (getTokenError) {
          console.error('取得應用程式 Token 失敗:', getTokenError);
          throw getTokenError;
        }
      } else {
        // 其他錯誤，記錄詳細資訊
        console.error('應用程式 Silent token 失敗詳情:', {
          errorCode: silentError.errorCode,
          message: silentError.message,
          stack: silentError.stack
        });
        throw silentError;
      }
    }
    
    // 步驟 2: 使用 MSAL 取得 Graph token（因為使用者已經在 Teams 中登入，可以使用 silent）
    console.log('步驟 2: 使用 MSAL 取得 Microsoft Graph Token...');
    try {
      // 從應用程式 token 中解析使用者資訊，用於 loginHint
      let loginHint = null;
      if (apiToken) {
        try {
          const tokenParts = apiToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            loginHint = payload.unique_name || payload.preferred_username || payload.upn || payload.email;
            console.log('從應用程式 Token 解析的 loginHint:', loginHint);
          }
        } catch (e) {
          console.log('無法從應用程式 Token 解析 loginHint:', e);
        }
      }
      
      await authenticateWithMSALSilent(loginHint);
      return; // 如果成功，直接返回
    } catch (msalError) {
      console.log('MSAL Silent 失敗，嘗試其他方式:', msalError);
      
      // 如果 MSAL silent 失敗，嘗試從 API token 解析使用者資訊
      if (apiToken) {
        console.log('嘗試從應用程式 Token 解析使用者資訊...');
        await fetchUserInfoWithApiToken(apiToken);
        return;
      }
      
      // 如果都失敗，顯示錯誤
      throw msalError;
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
async function authenticateWithMSALSilent(loginHint = null) {
  try {
    console.log('開始 MSAL Silent 登入（不需要 popup）...');
    if (loginHint) {
      console.log('使用 loginHint:', loginHint);
    }
    
    const { PublicClientApplication } = await import('@azure/msal-browser');
    
    const msalConfig = {
      auth: {
        clientId: '33abd69a-d012-498a-bddb-8608cbf10c2d',
        authority: 'https://login.microsoftonline.com/cd4e36bd-ac9a-4236-9f91-a6718b6b5e45',
        redirectUri: window.location.origin
      },
      system: {
        allowNativeBroker: false
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // 方法 1: 先檢查是否已有帳號，嘗試 acquireTokenSilent
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      console.log('找到已登入的帳號，嘗試 acquireTokenSilent...');
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: accounts[0]
        });
        console.log('acquireTokenSilent 成功');
        await fetchUserInfoFromMSAL(tokenResponse.accessToken);
        return;
      } catch (silentError) {
        console.log('acquireTokenSilent 失敗:', silentError);
        console.log('錯誤代碼:', silentError.errorCode);
        console.log('嘗試 ssoSilent...');
      }
    }
    
    // 方法 2: 使用 ssoSilent（在 Teams 環境中可以利用 SSO 狀態）
    console.log('嘗試使用 ssoSilent（利用 Teams SSO 狀態）...');
    try {
      const ssoParams = {
        scopes: ['User.Read']
      };
      
      // 如果有 loginHint，使用它
      if (loginHint) {
        ssoParams.loginHint = loginHint;
        console.log('使用 loginHint 進行 ssoSilent:', loginHint);
      }
      
      const ssoResponse = await msalInstance.ssoSilent(ssoParams);
      console.log('ssoSilent 成功');
      await fetchUserInfoFromMSAL(ssoResponse.accessToken);
      return;
    } catch (ssoError) {
      console.log('ssoSilent 失敗:', ssoError);
      console.log('錯誤代碼:', ssoError.errorCode);
      console.log('錯誤訊息:', ssoError.message);
      
      // 如果 ssoSilent 也失敗，嘗試使用 loginPopup（在 Teams 環境中可能可以工作）
      if (ssoError.errorCode === 'interaction_required' || ssoError.errorCode === 'consent_required') {
        console.log('需要互動，但在 Teams 環境中不應該使用 popup');
        throw new Error('需要使用者授權，但 Teams SSO 應該已經處理了授權。請檢查 Azure Portal 中的 API 權限設定。');
      }
      
      throw ssoError;
    }
  } catch (error) {
    console.error('MSAL Silent 登入失敗:', error);
    console.error('錯誤詳情:', {
      errorCode: error.errorCode,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
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

// 使用 API token 取得使用者資訊
// 先使用 API token 驗證 SSO 成功，然後嘗試取得 Graph token 來取得使用者資訊
async function fetchUserInfoWithApiToken(apiToken) {
  try {
    console.log('使用 API Token 取得使用者資訊...');
    console.log('API Token 前 20 個字元:', apiToken ? apiToken.substring(0, 20) + '...' : 'Token 為空');
    
    if (!apiToken) {
      throw new Error('API Token 為空');
    }
    
    // 方法 1: 先嘗試 silent 取得 Graph token（如果之前已授權）
    try {
      console.log('嘗試取得 Graph Token (Silent)...');
      const graphToken = await microsoftTeams.authentication.getAuthToken({
        resources: ['https://graph.microsoft.com'],
        silent: true
      });
      
      console.log('Graph Token (Silent) 取得成功，使用 Graph API 取得使用者資訊');
      await fetchUserInfoFromGraph(graphToken);
      return;
    } catch (silentError) {
      console.log('Graph Token (Silent) 失敗:', silentError);
      console.log('錯誤代碼:', silentError.errorCode);
      console.log('錯誤訊息:', silentError.message);
      
      // 如果是 UserConsentRequired，繼續到下一步
      if (silentError.errorCode === 'UserConsentRequired') {
        console.log('需要使用者授權，嘗試非 silent 方式...');
      } else {
        console.log('Silent 失敗，嘗試其他方式...');
      }
    }
    
    // 方法 2: 嘗試非 silent 取得 Graph token（需要使用者授權，但使用 Teams 內建視窗）
    try {
      console.log('嘗試取得 Graph Token（需要授權）...');
      const graphToken = await microsoftTeams.authentication.getAuthToken({
        resources: ['https://graph.microsoft.com'],
        silent: false // 會顯示 Teams 內建的認證視窗
      });
      
      console.log('Graph Token 取得成功，使用 Graph API 取得使用者資訊');
      await fetchUserInfoFromGraph(graphToken);
      return;
    } catch (graphError) {
      console.log('無法取得 Graph Token:', graphError);
      console.log('錯誤代碼:', graphError.errorCode);
      console.log('錯誤訊息:', graphError.message);
      console.log('嘗試從 API Token 解析使用者資訊...');
    }
    
    // 方法 3: 如果無法取得 Graph token，從 API token 中解析使用者資訊（JWT token 包含基本資訊）
    try {
      console.log('嘗試從 API Token 解析使用者資訊...');
      const tokenParts = apiToken.split('.');
      if (tokenParts.length === 3) {
        // 解碼 JWT payload
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('從 API Token 解析的 Payload:', payload);
        
        // 使用 token 中的資訊（如果有的話）
        if (payload.unique_name || payload.preferred_username || payload.name || payload.upn) {
          userInfo = {
            displayName: payload.name || payload.unique_name || payload.preferred_username || payload.upn,
            userPrincipalName: payload.unique_name || payload.preferred_username || payload.upn,
            mail: payload.email || payload.unique_name || payload.preferred_username || payload.upn,
            id: payload.oid || payload.sub || payload.tid
          };
          console.log('使用 Token 中的使用者資訊:', userInfo);
          displayUserInfo();
          return;
        } else {
          console.log('Token 中沒有找到使用者資訊欄位');
        }
      } else {
        console.log('Token 格式不正確，不是有效的 JWT');
      }
    } catch (parseError) {
      console.log('無法從 Token 解析使用者資訊:', parseError);
      console.error('解析錯誤詳情:', parseError.message);
    }
    
    // 方法 4: 如果以上都失敗，顯示 SSO 成功但無法取得詳細資訊
    console.log('SSO 認證成功（已取得 API Token），但無法取得詳細使用者資訊');
    showError('SSO 認證成功，但無法取得使用者詳細資訊。\n\n可能的原因：\n1. 未授與 Microsoft Graph API 權限\n2. 需要重新授權應用程式\n\n請在 Azure Portal 中確認已授與 Microsoft Graph API 權限。');
    
  } catch (error) {
    console.error('使用 API Token 取得使用者資訊失敗:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack
    });
    showError('取得使用者資訊失敗：' + error.message);
  }
}

// 從 Microsoft Graph API 取得使用者資訊（驗證登入）
async function fetchUserInfoFromGraph(graphToken) {
  try {
    console.log('從 Microsoft Graph API 取得使用者資訊（驗證登入）...');
    console.log('Token 前 20 個字元:', graphToken ? graphToken.substring(0, 20) + '...' : 'Token 為空');
    
    if (!graphToken) {
      throw new Error('Graph Token 為空');
    }
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${graphToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Graph API 回應:', response.status, errorText);
      
      // 詳細記錄錯誤資訊
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorDetails += `\n錯誤代碼: ${errorJson.error.code || 'N/A'}`;
          errorDetails += `\n錯誤訊息: ${errorJson.error.message || 'N/A'}`;
        }
      } catch (e) {
        // 如果無法解析 JSON，使用原始文字
        if (errorText) {
          errorDetails += `\n詳細資訊: ${errorText.substring(0, 200)}`;
        }
      }
      
      throw new Error(errorDetails);
    }

    userInfo = await response.json();
    console.log('從 Graph API 取得的使用者資訊（驗證成功）:', userInfo);
    displayUserInfo();
  } catch (error) {
    console.error('從 Graph API 取得使用者資訊失敗:', error);
    
    // 提供更詳細的錯誤訊息
    let errorMessage = '取得使用者資訊失敗：' + error.message;
    
    if (error.message.includes('401')) {
      errorMessage += '\n\n這表示 Microsoft 365 登入驗證失敗。';
      errorMessage += '\n\n可能的原因：';
      errorMessage += '\n1. Token 已過期或無效';
      errorMessage += '\n2. 應用程式未授與 Microsoft Graph API 權限';
      errorMessage += '\n3. 需要重新授權應用程式';
    } else if (error.message.includes('403')) {
      errorMessage += '\n\n這表示沒有權限存取 Microsoft Graph API。';
      errorMessage += '\n\n請確認已授與應用程式 Microsoft Graph API 權限。';
    }
    
    showError(errorMessage);
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

