import secret from '../secret.json'
import axios from 'axios'

export default function pushNotification(data) {
  axios.post(
    `${secret.pushService.url}`,
    {
      data,
      targetTokens:[secret.pushService.clientToken],
    },
    {
      headers: {
        token: secret.pushService.postToken,
      }
    }
  )
}