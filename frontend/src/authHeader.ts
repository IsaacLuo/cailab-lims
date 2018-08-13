export default function getAuthHeader(otherHeaders: object = {}) {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `bearer ${token}`,
      ...otherHeaders
    }
  }
}