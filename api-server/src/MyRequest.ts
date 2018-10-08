import express from 'express'
import log4js from 'log4js'
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
    log: log4js.Logger,
  }