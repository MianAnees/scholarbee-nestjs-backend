# WebSocket Gateway Token Extraction Issue — Investigation Report

## 1. Initial Setup
- **Goal:** Create a simple NestJS WebSocket gateway (`/test` namespace) to test basic socket connections.
- **Result:** Successfully connected to the gateway; connection and disconnection events were logged as expected.

## 2. Introducing Token Extraction
- **Change:** Modified the gateway to extract a `token` from either the query parameter (`client.handshake.query.token`) or the `Authorization` header (`client.handshake.headers.authorization`), and log it.
- **Result:** After this change, socket connection requests started hanging (no connection established, no logs).

## 3. Incremental Debugging Steps
- **Step 1:** Isolated token extraction to only the query parameter.
  - **Action:** Commented out header extraction; only used `client.handshake.query.token`.
  - **Result:** Connection still hung; no improvement.
- **Step 2:** Isolated token extraction to only the `Authorization` header.
  - **Action:** Commented out query extraction; only used `client.handshake.headers.authorization`.
  - **Result:** Connection still hung; no improvement.

## 4. New Findings
- **Postman Global Variable Issue:** When the token is set to a dummy value (e.g., "sad asd text") directly in the Postman request, the connection and logging work as expected. The `client.handshake` object is logged, and token extraction from both the query parameter and the header works.
- **Query Parameter Length Limit:** If the token sent as a query parameter is 1969 characters or less, it is received by the server. If the token length exceeds 1969 characters (e.g., a 2565-character bearer token), the request hangs and never reaches the server.
- **Conclusion:** The issue is not with the gateway implementation, but with how the token is being sent—specifically, the length of the query parameter exceeds a limit, causing the connection to hang.

## 5. Current Status
- **Observation:** The gateway works when a valid (even dummy) token value is provided directly and is within the length limit. The problem only occurs when using a token that exceeds the query parameter length limit.

---

## Analysis & Hypotheses

### Why was this not working?
- **Query String Length Limit:** Most browsers, proxies, and web servers impose a limit on the length of URLs, including query parameters. When the token is too long, the request may be dropped, truncated, or never reach the server, resulting in a hanging connection.
- **Socket.IO Client Differences:** Depending on the client and how it connects, the `handshake.query` and `handshake.headers` objects may not be populated as expected.
- **Version Mismatch:** There may be a version mismatch between the Socket.IO server (used by NestJS) and the client, especially regarding how query parameters and headers are sent and parsed.
- **CORS or Transport Issues:** If the client is not sending the expected headers or query parameters due to CORS, proxy, or transport settings, the server may not receive them, leading to unexpected behavior.
- **Synchronous/Async Issues:** If the `handleConnection` method throws an error or hangs while accessing these properties, it could prevent the connection from being established.
- **NestJS/Socket.IO Bug:** There could be a bug or undocumented behavior in the integration between NestJS and Socket.IO regarding handshake property access.
- **Postman Variable Issue:** If the global variable is undefined, empty, or not being replaced correctly, it may cause the connection to hang or fail silently.

---

## Recommendations for Next Steps

1. **Avoid Sending Large Tokens in Query Parameters:**
   - Instead of sending large tokens in the query string, use the `Authorization` header to transmit bearer tokens. Headers can handle much larger values and are the standard way to send authentication tokens.
2. **Check Postman Variable Values:**  
   Ensure that the global variable for the token is set and being replaced correctly in the request.
3. **Log the Entire Handshake Object:**  
   Before extracting the token, log `client.handshake` to see what properties are actually present at connection time.
4. **Check Client Implementation:**  
   Ensure the client is actually sending the query parameter or header as expected. Use browser dev tools or a tool like [wscat](https://github.com/websockets/wscat) to inspect the handshake.
5. **Check Socket.IO Versions:**  
   Make sure the versions of Socket.IO on the server and client are compatible.
6. **Error Handling:**  
   Wrap the extraction logic in a try-catch block and log any errors to avoid silent failures.
7. **Minimal Reproduction:**  
   Try a minimal Socket.IO server (outside of NestJS) to see if the issue persists, which can help isolate whether the problem is with NestJS or Socket.IO itself.

---

## Why Does This Happen?
- **URL Length Limits:** Most web servers, browsers, and proxies enforce a maximum URL length (often between 2000 and 8000 characters, but sometimes less). Query parameters are part of the URL, so sending very large tokens as query parameters can exceed this limit, causing the request to fail or hang.
- **WebSocket Handshake:** The initial WebSocket handshake is an HTTP request, so it is subject to the same URL length restrictions as any other HTTP request.

## Possible Solution
- **Use Headers for Large Tokens:** Always send large tokens (such as JWTs) in the `Authorization` header rather than as query parameters. This avoids URL length limits and follows best practices for authentication. 