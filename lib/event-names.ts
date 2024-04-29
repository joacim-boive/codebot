// eventNames.ts
//export const SERVER_REQUEST_TODOS_LOAD = 'server:request:todo:load'
export const SERVER_RETURN_QUESTION_ANSWER = 'server:return:question:answer'
export const CLIENT_SUBMIT_QUESTION = 'client:submit:question'
export const SERVER_COMPILE_PROGRESS = 'server:compile:progress'
export const SERVER_ERROR = 'server:error'

export type AllowedSocketEvents =
  | 'welcome'
  | typeof SERVER_RETURN_QUESTION_ANSWER
  | typeof CLIENT_SUBMIT_QUESTION
  | typeof SERVER_COMPILE_PROGRESS
  | typeof SERVER_ERROR
