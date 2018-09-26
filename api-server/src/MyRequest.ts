import express from 'express'

export interface IUserInfo {
    id:string,
    fullName: string,
    email: string,
    groups: [string],
  }
  export interface IUserJWT extends IUserInfo {
    iat: number,
    exp: number,
  }
  
  export interface Request extends express.Request {
    currentUser :IUserJWT,
  }