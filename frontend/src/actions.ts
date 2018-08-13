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

export const LOGIN_DIALOG_VISIBLE = 'SHOW_LOGIN';

export function ActionLoginDialogVisible (
  visible: boolean,
) {
  return {
    type: LOGIN_DIALOG_VISIBLE,
    data: {visible},
  }
}