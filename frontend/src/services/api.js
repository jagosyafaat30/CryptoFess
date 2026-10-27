/**
 * CryptoFess — Frontend API Service
 */

const API_BASE = '/api';

export const tokenStorage = {
  getToken() {
    return localStorage.getItem('cryptofess_token');
  },
  setToken(token) {
    localStorage.setItem('cryptofess_token', token);
  },
  removeToken() {
    localStorage.removeItem('cryptofess_token');
  },
  getUser() {
    const raw = localStorage.getItem('cryptofess_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    localStorage.setItem('cryptofess_user', JSON.stringify(user));
  },
  removeUser() {
    localStorage.removeItem('cryptofess_user');
  },
  getPrivateKey(username) {
    return localStorage.getItem(`cryptofess_privkey_${username}`);
  },
  setPrivateKey(username, privKey) {
    localStorage.setItem(`cryptofess_privkey_${username}`, privKey.toString());
  },
  removePrivateKey(username) {
    localStorage.removeItem(`cryptofess_privkey_${username}`);
  }
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = tokenStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Permintaan gagal (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Autentikasi
  async register(username, password, publicKey) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, publicKey })
    });
  },

  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      tokenStorage.setToken(data.token);
      tokenStorage.setUser(data.user);
    }
    return data;
  },

  logout() {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
  },

  // Profil
  async getMe() {
    return request('/users/me');
  },

  async updatePublicKey(publicKeyData) {
    return request('/users/public-key', {
      method: 'POST',
      body: JSON.stringify({ publicKeyData })
    });
  },

  // Penerima
  async getRecipient(username) {
    return request(`/recipients/${encodeURIComponent(username)}`);
  },

  async getRecipientPublicKeys(username) {
    return request(`/recipients/${encodeURIComponent(username)}/public-keys`);
  },

  // Pesan Anonim
  async sendMessage(recipientUsername, ciphertext, cryptoMetadata) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        recipientUsername,
        ciphertext,
        cryptoMetadata
      })
    });
  },

  async getInbox(limit = 50, offset = 0) {
    return request(`/messages/inbox?limit=${limit}&offset=${offset}`);
  },

  async getMessage(id) {
    return request(`/messages/${id}`);
  },

  async markAsRead(id) {
    return request(`/messages/${id}/read`, {
      method: 'PATCH'
    });
  },

  async deleteMessage(id) {
    return request(`/messages/${id}`, {
      method: 'DELETE'
    });
  },

  // Crypto Lab Helper
  async getCryptoParameters() {
    return request('/crypto/parameters');
  },

  async simulateDh(p, g, privateKeyA, privateKeyB) {
    return request('/crypto/simulate-dh', {
      method: 'POST',
      body: JSON.stringify({ p, g, privateKeyA, privateKeyB })
    });
  }
};
