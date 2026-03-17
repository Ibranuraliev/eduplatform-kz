import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Token ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (token expired)
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers['Authorization'] = `Token ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/users/token/refresh/`, {
          refresh_token: refreshToken,
        });
        const newToken = res.data.token;
        localStorage.setItem('authToken', newToken);
        api.defaults.headers['Authorization'] = `Token ${newToken}`;
        refreshQueue.forEach(cb => cb.resolve(newToken));
        refreshQueue = [];
        original.headers['Authorization'] = `Token ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(cb => cb.reject(refreshErr));
        refreshQueue = [];
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  logout: () => api.post('/users/logout/'),
  profile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
  refreshToken: (data) => api.post('/users/token/refresh/', data),
};

export const coursesAPI = {
  list: () => api.get('/courses/'),
  detail: (id) => api.get(`/courses/${id}/`),
  packages: () => api.get('/courses/packages/'),
  myCourses: () => api.get('/courses/my/'),
  lessonDetail: (id) => api.get(`/courses/lessons/${id}/`),
  // Progress
  progress: (courseId) => api.get(`/courses/${courseId}/progress/`),
  markComplete: (lessonId) => api.post(`/courses/lessons/${lessonId}/complete/`),
  // Materials
  addMaterial: (lessonId, data) => api.post(`/courses/lessons/${lessonId}/materials/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteMaterial: (materialId) => api.delete(`/courses/materials/${materialId}/`),
};

export const groupsAPI = {
  list: (courseId) => api.get(`/groups/?course=${courseId}`),
  join: (id) => api.post(`/groups/${id}/join/`),
  myGroups: () => api.get('/groups/my/'),
  myGroupsSmart: () => api.get('/groups/my-groups/'),
  schedule: () => api.get('/groups/schedule/'),
  markAttendance: (data) => api.post('/groups/attendance/', data),
  markConducted: (id) => api.post(`/groups/sessions/${id}/conducted/`),
  extendSession: (id) => api.post(`/groups/sessions/${id}/extend/`),
  changeRequest: (data) => api.post('/groups/change-request/', data),
  studentStats: () => api.get('/groups/student-stats/'),
  createGroup: (data) => api.post('/groups/create/', data),
};

export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/order/', data),
  myOrders: () => api.get('/payments/orders/'),
  requestRefund: (data) => api.post('/payments/refund/', data),
  myRefunds: () => api.get('/payments/refunds/'),
  myDiscount: () => api.get('/payments/discount/'),
};

export const homeworkAPI = {
  myHomework: () => api.get('/homework/'),
  submit: (id, data) => api.post(`/homework/${id}/submit/`, data),
  pending: () => api.get('/homework/pending/'),
  review: (data) => api.post('/homework/review/', data),
  bulkReview: (data) => api.post('/homework/bulk-review/', data),
  templates: () => api.get('/homework/templates/'),
};

export const testsAPI = {
  detail: (id) => api.get(`/tests/${id}/`),
  start: (id) => api.post(`/tests/${id}/start/`),
  submit: (id, data) => api.post(`/tests/attempts/${id}/submit/`, data),
  myAttempts: () => api.get('/tests/attempts/'),
};

export const hrAPI = {
  apply: (data) => api.post('/hr/apply/', data),
  applications: () => api.get('/hr/applications/'),
  review: (data) => api.post('/hr/applications/review/', data),
  myProgress: () => api.get('/hr/progress/'),
  trialSlots: (subject) => api.get('/hr/slots/' + (subject ? '?subject=' + subject : '')),
  bookTrial: (data) => api.post('/hr/book-trial/', data),
  myTrials: () => api.get('/hr/my-trials/'),
};

export const chatAPI = {
  list: () => api.get('/chat/'),
  // student → teacher
  start: (teacherId) => api.post('/chat/start/', { teacher_id: teacherId }),
  // teacher → student
  startWithStudent: (studentId) => api.post('/chat/start/', { student_id: studentId }),
  // list teacher's enrolled students (for teacher chat)
  students: () => api.get('/chat/students/'),
  messages: (convId) => api.get(`/chat/${convId}/messages/`),
  send: (convId, text) => api.post(`/chat/${convId}/messages/`, { text }),
  unread: () => api.get('/chat/unread/'),
};

export default api;
