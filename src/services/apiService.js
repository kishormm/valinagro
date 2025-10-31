import toast from 'react-hot-toast';

// --- Helper to handle API responses ---
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let errorData = { error: `HTTP error! Status: ${response.status}` };
    if (contentType && contentType.includes("application/json")) {
      errorData = await response.json();
    }
    toast.error(errorData.error || 'An unexpected error occurred.');
    throw new Error(errorData.error || 'API request failed');
  }

  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return;
  }

  return response.json();
};

// --- Auth ---
export const login = (credentials) => {
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include' 
  })
    .then(handleResponse)
    .then((data) => {
      return data; 
    });
};

export const checkAuthStatus = () => {
  return fetch('/api/auth/me', {
    credentials: 'include' 
  }).then(res => {
    if (!res.ok) return null;
    return res.json();
  });
};

// --- Products ---
export const getProducts = () => {
  return fetch('/api/products', {
    credentials: 'include'
  }).then(handleResponse);
};

export const addProduct = (productData) => {
  return fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
    credentials: 'include'
  }).then(handleResponse);
};

export const updateProduct = (productId, productData) => {
  return fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
    credentials: 'include'
  }).then(handleResponse);
};

export const deleteProduct = (productId) => {
  return fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
};
export const getMasterProductList = () => {
  return fetch('/api/products/all', {
    credentials: 'include'
  }).then(handleResponse);
};

// --- Users ---
export const addUser = (userData) => {
  return fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getDownline = (userId) => {
  return fetch(`/api/users/${userId}/downline`, {
    credentials: 'include'
  }).then(handleResponse);
};

export const getHierarchy = (userId) => {
  return fetch(`/api/users/${userId}/hierarchy`, {
    credentials: 'include'
  }).then(handleResponse);
};

export const getUsers = () => {
  return fetch(`/api/users`, {
    credentials: 'include'
  }).then(handleResponse);
};

export const updateUser = (userId, userData) => {
  return fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include'
  }).then(handleResponse);
};

export const deleteUser = (userId) => {
  return fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
};

export const getUserDetails = (userId) => {
  return fetch(`/api/users/details/${userId}`, {
    credentials: 'include'
  }).then(handleResponse);
};

// --- NEW FUNCTION TO GRANT MEMBERSHIP (ADMIN ONLY) ---
export const grantMembership = (userId) => {
  return fetch(`/api/users/${userId}/grant-membership`, {
    method: 'POST',
    credentials: 'include'
  }).then(handleResponse);
};


// --- Sales & Purchases ---
export const createSale = (saleData) => {
  return fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getSales = () => {
  return fetch(`/api/sales`, {
    credentials: 'include'
  }).then(handleResponse);
};

export const createPurchase = (purchaseData) => {
  return fetch('/api/transactions/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData),
    credentials: 'include'
  }).then(handleResponse);
};

export const createDirectPurchase = (purchaseData) => {
  return fetch('/api/transactions/buy-from-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData),
    credentials: 'include'
  }).then(handleResponse);
};

// --- Payouts (Profit from Admin) ---
export const getPendingPayouts = () => {
  return fetch(`/api/payouts/pending`).then(handleResponse);
};

export const createPayout = (payoutData) => {
  return fetch(`/api/payouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payoutData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getPendingPayoutForUser = (userId) => {
  return fetch(`/api/payouts/user/${userId}`, {
    credentials: 'include'
  }).then(handleResponse);
};


// --- Inventory ---
export const getUserInventory = () => {
  return fetch(`/api/inventory`, { 
    credentials: 'include'
  }).then(handleResponse);
};

export const getUplineInventory = () => {
  return fetch(`/api/upline-inventory`, {
    credentials: 'include'
  }).then(handleResponse);
};

// --- Reports ---
export const getSalesReport = (timePeriod, role, startDate, endDate) => {
  const params = new URLSearchParams();
  
  if (startDate && endDate) {
    params.append('startDate', startDate);
    params.append('endDate', endDate);
  } else if (timePeriod) {
    params.append('timePeriod', timePeriod);
  }

  if (role && role !== 'All') {
    params.append('role', role);
  }
  
  return fetch(`/api/reports/sales?${params.toString()}`, {
    credentials: 'include'
  }).then(handleResponse);
};

// --- Misc ---
export const changePassword = (passwordData) => {
  return fetch('/api/users/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwordData),
    credentials: 'include'
  }).then(handleResponse);
};

export const getUsersByRole = (role) => {
    return fetch(`/api/users/by-role?role=${role}`, {
      credentials: 'include'
    }).then(handleResponse);
};
  

// --- PAYMENTS & COMMISSIONS ---

export const getPayables = () => {
    return fetch('/api/transactions/payable', {
        credentials: 'include'
    }).then(handleResponse);
};

export const getReceivables = () => {
    return fetch('/api/transactions/receivable', {
        credentials: 'include'
    }).then(handleResponse);
};

export const uploadPaymentProof = (transactionId, formData) => {
  return fetch(`/api/transactions/${transactionId}/upload-proof`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  }).then(handleResponse);
};

export const verifyPayment = (transactionId) => {
    return fetch(`/api/transactions/${transactionId}/verify`, {
        method: 'POST',
        credentials: 'include'
    }).then(handleResponse);
};

export const getPendingCommissions = () => {
    return fetch('/api/commissions/pending', {
        credentials: 'include'
    }).then(handleResponse);
};

export const payCommission = (payoutData) => {
    return fetch('/api/commissions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutData),
        credentials: 'include'
    }).then(handleResponse);
};

export const getMyPendingCommissions = () => {
    return fetch('/api/commissions/user', {
        credentials: 'include'
    }).then(handleResponse);
};


// --- ANALYTICS ---
export const getAdminAnalytics = () => {
  return fetch('/api/analytics/admin', {
    credentials: 'include'
  }).then(handleResponse);
};