export interface IAction {
  type: string,
  data: any,
}

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