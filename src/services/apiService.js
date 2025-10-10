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
  return fetch('/api/transactions/direct-purchase', {
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
export const getSalesReport = (timePeriod, role, startDate, endDate) => { // ADDED startDate, endDate
  const params = new URLSearchParams();
  
  // Custom date range takes priority
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
  

// --- NEW FUNCTIONS FOR PAYMENTS ---

// Gets the list of transactions the logged-in user needs to pay (their debts)
export const getPayables = () => {
    return fetch('/api/transactions/payable', {
        credentials: 'include'
    }).then(handleResponse);
};

// Gets the list of unpaid transactions owed to the logged-in user
export const getReceivables = () => {
    return fetch('/api/transactions/receivable', {
        credentials: 'include'
    }).then(handleResponse);
};

// Marks a specific transaction as paid
export const payTransaction = (transactionId) => {
    return fetch(`/api/transactions/${transactionId}/pay`, {
        method: 'POST',
        credentials: 'include'
    }).then(handleResponse);
};

// --- NEW ANALYTICS FUNCTION ---
export const getAdminAnalytics = () => {
  return fetch('/api/analytics/admin', {
    credentials: 'include'
  }).then(handleResponse);
};
