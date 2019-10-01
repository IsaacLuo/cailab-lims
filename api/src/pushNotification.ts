import secret from '../secret'
import axios from 'axios'

export default async function pushNotification(data) {
  const response = await axios.post(
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
  );
  // console.log(response.data);
}