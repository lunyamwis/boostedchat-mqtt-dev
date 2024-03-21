## Notes

### login to ig

```bash
curl -X POST -H "Content-Type: application/json" -d '{"igname": "jaribuaccount"}' 127.0.0.1:3000/login
```

### list logged in accounts
```bash
curl  127.0.0.1:3000/accounts
```

### logout

### reconnect (log out and log in again)