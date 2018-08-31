export interface IAction {
  type: string,
  data: any,
}

export const INITIALIZE_DONE = 'INITIALIZE_DONE';
export function ActionInitizeDone () {
  return {type: INITIALIZE_DONE};
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

export const SET_LOGIN_INFORMATION = 'SET_LOGIN_INFORMATION';
export function ActionSetLoginInformation (
  name: string,
  groups: string[],
) {
  return {
    type: SET_LOGIN_INFORMATION,
    data: {
      name,
      groups,
    }
  }
}

export const CLEAR_LOGIN_INFORMATION = 'CLEAR_LOGIN_INFORMATION';
export function ActionClearLoginInformation() {
  return {
    type: CLEAR_LOGIN_INFORMATION,
  }
}

export const VERIFY_MYSELF = 'VERIFY_MYSELF';
export function ActionVerifyMyself() {
  return {
    type: VERIFY_MYSELF,
  }
}

export const SET_PARTS_COUNT = 'SET_PARTS_COUNT';
export function ActionSetPartsCount(data) {
  return {
    type: SET_PARTS_COUNT,
    data,
  }
}

export const SET_ALL_USER_NAMES = 'SET_ALL_USER_NAMES';
export function ActionSetAllUserNames(data) {
  return {
    type: SET_ALL_USER_NAMES,
    data,
  }
}

export const SET_NEW_PART_DIALOG_VISIBLE = 'SET_NEW_PART_DIALOG_VISIBLE'
export function ActionSetNewPartDialogVisible(data) {
  return {
    type: SET_NEW_PART_DIALOG_VISIBLE,
    data,
  }
}