// dispatched when get new current user information from the server
export const SET_LOGIN_INFORMATION = 'SET_LOGIN_INFORMATION';
export function ActionSetLoginInformation (
  id: string,
  name: string,
  groups: string[],
) {
  return {
    type: SET_LOGIN_INFORMATION,
    data: {
      id,
      name,
      groups,
    }
  }
}

// dispatched when user clicks login button in the login dialog
export const LOGIN = 'LOGIN';
export function ActionLogin (
  username :string, 
  profilePicture: string,
  groups :string,
) {
  return {
    type: LOGIN,
    data: {username, profilePicture, groups}
  }
}

// dispatched when user logs out
export const CLEAR_LOGIN_INFORMATION = 'CLEAR_LOGIN_INFORMATION';
export function ActionClearLoginInformation() {
  return {
    type: CLEAR_LOGIN_INFORMATION,
  }
}

export const TOKEN_REFRESHED = 'TOKEN_REFRESHED';